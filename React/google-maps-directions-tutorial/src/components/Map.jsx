/*global google*/
import {
    Input,
    SkeletonText,
  } from '@chakra-ui/react'

  import './Map.css'
  import Cookies from 'js-cookie';
  import {
    useJsApiLoader,
    GoogleMap,
    Marker,
    Autocomplete,
    DirectionsRenderer,
  } from '@react-google-maps/api'
  import React, { useRef, useState, useEffect } from 'react'
  import { getRouteInfo } from "../utils";
  import axios from 'axios';
  
  const lvivBounds = {
    east: 24.0798,
    north: 49.8819,
    south: 49.7982,
    west: 23.8872
  };
  
  const HARD_CODED_MARKERS = [{lat: 49.821371, lng: 24.020226, label: 'Іван'}, 
  {lat: 49.817582, lng: 24.055347, label: 'Василь'}, 
  {lat: 49.847388, lng: 24.020365, label: 'Олег'}, 
  {lat: 49.836865, lng: 24.044338, label: 'Сергій'}]
  
  const center = { lat: 49.843163, lng: 24.026782 }

  const libs = ['places']
  
  export default function Map() {
    const { isLoaded } = useJsApiLoader({
      googleMapsApiKey: 'SECRET_KEY',
      libraries: libs,
    })

    const [masters, setMasters] = useState([]);
    const [address, setAddress] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [description, setDescription] = useState('');
    const [csrftoken, setCsrftoken] = useState('');
    const [isSubmitActive, setIsSubmitActive] = useState(false);
    const [isFormSubmitted, setIsFormSubmitted] = useState(false);
    useEffect(async () => {
      const fetchMasters = async () => {
          try {
            const response = await axios.get('http://localhost:8000/masters/?format=json');
            const transformedData = response.data.map(master => {
              const { latitude, longitude } = master;
              const data = {
                label: master.label,
                lat: latitude,
                lng: longitude
              };
              
              return data;
            });

            console.log(transformedData);
            setMasters(transformedData);
          } catch (error) {
              console.error('Error fetching masters:', error);
          }
      };

      fetchMasters();

      const csrfResponse = await axios.get('http://localhost:8000/get_csrf_token');
      const csrfToken = csrfResponse.data;
      Cookies.set('csrftoken', csrfToken.csrfToken, { path: '/' });
      setCsrftoken(csrfToken.csrfToken);
    }, []);

    const [map, setMap] = useState(/** @type google.maps.Map */ (null))
    const [directionsResponse, setDirectionsResponse] = useState(null)
    const [distance, setDistance] = useState('')
    const [duration, setDuration] = useState('')
    const [nearestMarkerLabel, setNearestMarkerLabel] = useState('')
  
    const originForNearestRef = useRef()
    const originRef = useRef()
    const destinationRef = useRef()

    useEffect(() => {
      setIsSubmitActive(false);
    }, [address]);


  
    if (!isLoaded) {
      return <SkeletonText />
    }

    async function calculateNearestRoute(origin) {
      if (originForNearestRef.current.value === '' && !origin) {
          return;
      }
  
      const prepareOrigin = originForNearestRef.current.value || origin;
      const directionsService = new google.maps.DirectionsService();
  
      console.log(`Masters: ${JSON.stringify(masters)}`);
  
      const promises = masters.map(async marker => {
          return await getRouteInfo(prepareOrigin, marker, directionsService);
      });
  
      try {
          const addressToMarkers = await Promise.all(promises);
          const closestDistance = addressToMarkers.reduce((closest, addressToMarker) => {
              return addressToMarker.duration.value < closest.duration.value ? addressToMarker : closest;
          });
  
          if (!closestDistance) {
              return;
          }
  
          const { directionResponse, distance, duration, markerLabel } = closestDistance;
  
          setDirectionsResponse(directionResponse);
          setDistance(distance.text);
          setDuration(duration.text);
          setNearestMarkerLabel(markerLabel);
          if (!origin.shouldntSetActive && !isFormSubmitted) setIsSubmitActive(true);
      } catch (error) {
          console.error('Error calculating nearest route:', error);
      }
  }
  
    const getUserCurrentLocation = (e) => {
      e.preventDefault();
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          originForNearestRef.current.value = ''
          await calculateNearestRoute({ lat: latitude, lng: longitude, shouldntSetActive: true })
        });
      } else {
        console.log("Geolocation not supported");
      }
    }
  
    function clearRoute() {
      setDirectionsResponse(null)
      setDistance('')
      setDuration('')
      if (originRef && originRef.current) originRef.current.value = ''
      if (destinationRef && destinationRef.current) destinationRef.current.value = ''
      if (originForNearestRef && originForNearestRef.current) originForNearestRef.current.value = ''
      map.panTo(center)
      map.setZoom(15)
      setNearestMarkerLabel(''); 
    }

    async function handleSubmit(event) {
      event.preventDefault();
      if (!isSubmitActive) return;

        const orderData = {
            master_label: nearestMarkerLabel,
            address: originForNearestRef.current.value,
            customer_name: customerName,
            phone_number: phoneNumber,
            description: description,
            status: 'pending',
        };

        try {
            console.log('Order created:', orderData);
            const response = await axios.post('http://localhost:8000/orders/', orderData, {
              headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken,
              },
            });
            console.log('Response data:', response.data);
            setIsFormSubmitted(true);
            setIsSubmitActive(false);
            axios.defaults.headers.post['Content-Type'] = 'application/json';
            axios.post('https://formsubmit.co/ajax/hack9169@gmail.com', orderData)
                .then(response => console.log(response))
                .catch(error => console.log(error));
        } catch (error) {
            console.error('Error creating order:', error);
        }
    }
  
    return (
      <section>
        <div className='heading'>
            <h1>Вітаємо!</h1>
            <h3>Наш новий сервіс дає вам змогу швидко оформити замовлення та за допомогою розробленого нами алгоритму ми знайдемо найближчого до вас майстра який вмить прибуде до вашого дому та зекономить чимало вашого дорогоцінного часу!</h3>
        </div>
        <div className='GoogleMap'>
          <GoogleMap
            center={center}
            zoom={15}
            mapContainerStyle={{ width: '100%', height: '100%' }}
            options={{
              zoomControl: false,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
            }}
            onLoad={map => setMap(map)}
          >
            {masters.map(({ label, ...rest }, i) => <Marker position={rest} key={i} label={label} />)}
  
            {directionsResponse && (
              <DirectionsRenderer directions={directionsResponse} />
            )}
          </GoogleMap>
        </div>
      <fieldset>
       <legend>Дані замовника:</legend>
       <form action="#" method="post" onSubmit={handleSubmit}>
          <div className='SearchForm'>
            <div className='InputInfo'>
              <label for="address">Адреса</label>
              <Autocomplete restrictions={{ country: 'ua' }} options={{ bounds: lvivBounds, strictBounds: true }} >
                <Input className='AddressInput' type='text' name="address" id="address" placeholder='Введіть свою адресу' onChange={(e) => setAddress(e.target.value)} ref={originForNearestRef} required/>
              </Autocomplete>
            <div className="SearchData">
             <button onClick={calculateNearestRoute}>
              Розрахунок
             </button>
             <button onClick={getUserCurrentLocation}>
              Поточне місцезнаходження
             </button>
            </div>
          </div>
          <div className='SearchInfo'>
            <p>Дистанція: {distance} </p>
            <p>Орінєнтовний час очікування: {!isNaN(parseFloat(distance)) ? `${((parseFloat(distance) / 13) * 60 + 7).toFixed(1)} min` : ''}  </p>
            <p className='master'>Найближчий майстер: {nearestMarkerLabel || ''} </p>
            {/* <button type='submit' onClick={() => {
              map.panTo(center)
              map.setZoom(15)
              }}>
              Відцентрувати
            </button>
            <button type='submit' onClick={clearRoute}>
              Очистити форму
            </button> */}
           </div>
          </div>
            <input type="hidden" name="csrfmiddlewaretoken" value={csrftoken} />
            <p>
                <label for="FirstName">Ваше ім'я:</label>
                <Input type="text" name="FirstName" id="FirstName" placeholder="Ім'я" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required/>
            </p>
            <p>
                <label for="phone">Ваш номер телефону:</label>
                <Input type="tel" name="phone" id="phone" placeholder="Номер телефону(з +380)" pattern="\+380[0-9]{9}" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required/>
            </p>
            <p>
                <label for="message">Назва пристрою та опис несправності:</label>
                <textarea name="message" id="message" cols="30" rows="5" placeholder="Напишіть тут" value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
            </p>
            
            <button type="submit" className={isSubmitActive ? '' : isFormSubmitted ? 'submitted' : 'disabled'}>{isSubmitActive ? 'Надіслати заявку' : isFormSubmitted ? 'Заявка відправлена!' : 'Надіслати заявку'}</button>
            <button type="reset">Очистити</button>
        </form>
      </fieldset>
        </section>
    )
  }