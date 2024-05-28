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
import { getRouteInfo } from "../utils.js";
import axios from 'axios';
import AboutUs from "./AboutUs";

const lvivBounds = {
  east: 24.0798,
  north: 49.8819,
  south: 49.7982,
  west: 23.8872
};

// const HARD_CODED_MARKERS = [{lat: 49.821371, lng: 24.020226, label: 'Іван'}, 
// {lat: 49.817582, lng: 24.055347, label: 'Василь'}, 
// {lat: 49.847388, lng: 24.020365, label: 'Олег'}, 
// {lat: 49.836865, lng: 24.044338, label: 'Сергій'}]

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
  const [validationCode, setValidationCode] = useState('');
  const [isPhoneValidated, setIsPhoneValidated] = useState(false);
  const [isPathSet, setIsPathSet] = useState(false);
  const [description, setDescription] = useState('');
  const [csrftoken, setCsrftoken] = useState('');
  const [isSubmitActive, setIsSubmitActive] = useState(false);
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  const [isAwaitingPhoneVerification, setIsAwaitingPhoneVerification] = useState(false);
  const [phoneErrorText, setPhoneErrorText] = useState('');
  useEffect(() => {
    if (isPhoneValidated && isPathSet && customerName !== '') setIsSubmitActive(true);
    else setIsSubmitActive(false);
  }, [isPhoneValidated, isPathSet, customerName, address]);
  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const response = await axios.get('http://localhost:8000/masters/?format=json');
        const availableMasters = [];
        for (let master of response.data) {
          const statusResponse = await axios.get(`http://localhost:8000/masters/${master.id}/status`);
          if (!statusResponse.data.has_inprocess_orders) availableMasters.push(master);
        }
        const transformedData = availableMasters.map(master => {
          const { latitude, longitude } = master;
          const data = {
            label: master.label,
            lat: latitude,
            lng: longitude
          };

          return data;
        });

        setMasters(transformedData);
      } catch (error) {
        console.error('Error fetching masters:', error);
      }
    };
    fetchMasters();
    async function getCsrfToken() {
      const csrfResponse = await axios.get('http://localhost:8000/get_csrf_token');
      const csrfToken = csrfResponse.data;
      Cookies.set('csrftoken', csrfToken.csrfToken, { path: '/' });
      setCsrftoken(csrfToken.csrfToken);
    }
    getCsrfToken();
  }, []);

  const [map, setMap] = useState(/** @type google.maps.Map */(null))
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
    setIsPathSet(false);
    const prepareOrigin = originForNearestRef.current.value || origin;
    const directionsService = new google.maps.DirectionsService();

    const promises = masters.map(async marker => {
      return await getRouteInfo(prepareOrigin, marker, directionsService);
    });

    try {
      const addressToMarkers = await Promise.all(promises);
      let closestDistance = addressToMarkers.reduce((closest, addressToMarker) => {
        return addressToMarker.duration?.value < closest.duration?.value ? addressToMarker : closest;
      });

      if (!closestDistance) {
        return;
      }

      if(closestDistance.length === 1)closestDistance = closestDistance[0];

      const { directionResponse, distance, duration, markerLabel } = closestDistance;

      setDirectionsResponse(directionResponse);
      setDistance(distance.text);
      setDuration(duration.text);
      setNearestMarkerLabel(markerLabel);
      setIsPathSet(true);
      if (!origin.shouldntSetActive && !isFormSubmitted) setIsPathSet(true);
    } catch (error) {
      console.error('Error calculating nearest route:', error);
    }
  }

  const getUserCurrentLocation = async (e) => {
    e.preventDefault();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        try {
          const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=318c30d02c634a3d82a67a727b0fbfc6`);
          const data = await response.json();
          const address = data.results[0].formatted;
          originForNearestRef.current.value = address;
          setAddress(address);
        } catch (error) {
          console.error('Error fetching the address:', error);
        }
        await calculateNearestRoute({ lat: latitude, lng: longitude, shouldntSetActive: true });
      });
    } else {
      console.log("Geolocation not supported");
    }
    calculateNearestRoute();
  };


  // function clearRoute() {
  //   setDirectionsResponse(null)
  //   setDistance('')
  //   setDuration('')
  //   if (originRef && originRef.current) originRef.current.value = ''
  //   if (destinationRef && destinationRef.current) destinationRef.current.value = ''
  //   if (originForNearestRef && originForNearestRef.current) originForNearestRef.current.value = ''
  //   map.panTo(center)
  //   map.setZoom(15)
  //   setNearestMarkerLabel(''); 
  // }

  
    const handleInvalid = (e) => {
      e.target.setCustomValidity('Заповніть це поле');
    };
  
    const handleInput = (e) => {
      e.target.setCustomValidity(''); 
    };

    const handleAddressInput = (e) => {
      handleInput(e);
      setAddress(e.target.value);
    }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!isSubmitActive) return;

    const orderData = {
      master_label: nearestMarkerLabel,
      address: originForNearestRef.current.value,
      customer_name: customerName,
      phone_number: getPhoneFormatted(phoneNumber),
      description: description,
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
      if (error.response.status === 403) {
        setPhoneErrorText('Max attempts per minute! Please, wait!');
      } else {
        console.error('Error creating order:', error);
      }
    }
  }
  async function handlePhoneNumberVerification(event) {
    event.preventDefault();
    if (!(phoneNumber.startsWith('+380') && phoneNumber.length === 13 || phoneNumber.startsWith('0') && phoneNumber.length === 10 || phoneNumber.startsWith('380') && phoneNumber.length === 12)) {
      setPhoneErrorText("Номер телефону має починатися з +380 та містити 12 цифр!");
      return;
    }
    setPhoneErrorText('');
    const phoneData = {
      phone: getPhoneFormatted(phoneNumber),
    };
    try {
      console.log('Phone number:', phoneData);
      const response = await axios.post('http://localhost:8000/orders/verification', phoneData);
      setIsAwaitingPhoneVerification(true);
      console.log('Response data:', response.data);
    } catch (error) {
      if (error.response.status === 403) {
        setPhoneErrorText('Reached max attempts per day!');
      } else {
        console.error('Error verifying phone number:', error);
        setPhoneErrorText('Помилка під час підтвердження номеру телефону! Спробуйте ще раз!');
        setIsAwaitingPhoneVerification(false);
      }
    }
  }

  function getPhoneFormatted(phone) {
    let phoneFormatted = phone;
    if (phoneFormatted.startsWith('0')) phoneFormatted = `38${phone}`;
    if (phoneFormatted.startsWith('+380')) phoneFormatted = phoneFormatted.slice(1);
    return phoneFormatted;
  }

  async function handleValidationCode(event) {
    event.preventDefault();

    const phoneData = {
      phone: getPhoneFormatted(phoneNumber),
      verification_code: validationCode,
    };

    try {
      const response = await axios.post('http://localhost:8000/orders/verification/code', phoneData);
      console.log('Response data:', response.data);
      if (response.data.success) {
        setIsAwaitingPhoneVerification(false);
        setPhoneErrorText('');
        setIsPhoneValidated(true);
      } else {
        setPhoneErrorText('Невірний код підтвердження! Спробуйте ще раз!');
      }
    } catch (error) {
      if (error.response.status === 404) {
        setPhoneErrorText('Невірний код підтвердження! Спробуйте ще раз!');
      } else if (error.response.status === 403) {
        setPhoneErrorText('Max attempts per minute! Please, wait!');
      } else {
        console.error('Error verifying code:', error);
        setPhoneErrorText('Помилка під час підтвердження коду! Спробуйте ще раз!');
      }
    }
  }

  return (
    <section>
      {/* <div className='heading'>
        <h1>Вітаємо!</h1>
        <h3>Наш новий сервіс дає вам змогу швидко оформити замовлення та за допомогою розробленого нами алгоритму ми знайдемо найближчого до вас майстра який вмить прибуде до вашого дому та зекономить чимало вашого дорогоцінного часу!</h3>
      </div> */}
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
        <legend>Оформити замовлення:</legend>
        <form action="#" method="post" onSubmit={handleSubmit}>
          <div className='SearchForm'>
            <div className='InputInfo'>
              <label htmlFor="address">Адреса</label>
              <Autocomplete restrictions={{ country: 'ua' }} options={{ bounds: lvivBounds, strictBounds: true }} >
                <input onInvalid={handleInvalid}
              onInput={handleAddressInput} className='AddressInput' type='text' name="address" id="address" data-testid="address" placeholder='Введіть свою адресу' onChange={(e) => setAddress(e.target.value)} ref={originForNearestRef} required />
              </Autocomplete>
              <div className="SearchData">
                <button data-testid="rozrahunok" onClick={calculateNearestRoute}>
                  Розрахунок
                </button>
                <button onClick={getUserCurrentLocation}>
                  Поточне місцезнаходження
                </button>
              </div>
            </div>
            <div className='SearchInfo'>
              <p data-testid="distance" id="distance">Дистанція: {distance} </p>
              <p>Орінєнтовний час очікування: {!isNaN(parseFloat(distance)) ? `${((parseFloat(distance) / 13) * 60 + 7).toFixed(1)} min` : ''}  </p>
              <p className='master'>Найближчий майстер: {nearestMarkerLabel || ''} </p>
            </div>
          </div>
          <input type="hidden" name="csrfmiddlewaretoken" value={csrftoken} />
          <p>
            <label htmlFor="FirstName">Ваше ім'я:</label>
            <input onInvalid={handleInvalid}
              onInput={handleInput} type="text" name="FirstName" data-testid="firstName" id="FirstName" placeholder="Ім'я" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
          </p>
          <div className='phone-number-wrapper'>
            <label htmlFor="phone">Ваш номер телефону:</label>
            {isPhoneValidated ? <p>{phoneNumber}</p> : <><Input onInvalid={handleInvalid}
              onInput={handleInput} type="tel" name="phone" id="phone" data-testid="phone" placeholder="Номер телефону(з +380)" pattern="\+380[0-9]{9}" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
              <button data-testid="phone-submit" onClick={handlePhoneNumberVerification}>Підтвердити номер</button></>}
            <span style={{ color: 'red' }}>{phoneErrorText !== '' ? phoneErrorText : ''}</span>
            {isAwaitingPhoneVerification && <>
              <br /><span>Введіть код підтвердження який ви отримали на телефон</span><br />
              <input onInvalid={handleInvalid}
              onInput={handleInput} type="text" name="phone_verification_code" data-testid="code" id="phone_verification_code" placeholder="Код підтвердження" value={validationCode} onChange={e => setValidationCode(e.target.value)} required />
              <button data-testid="code-submit" onClick={handleValidationCode}>Підтвердити код</button>
            </>}
          </div>
          <div className='description-wrapper'>
            <label htmlFor="message">Назва пристрою та опис несправності:</label>
            <textarea onInvalid={handleInvalid}
              onInput={handleInput} name="message" id="message" cols="30" rows="5" placeholder="Напишіть тут" value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
          </div>

          <button type="submit" data-testid="submit" className={isSubmitActive ? 'default' : isFormSubmitted ? 'submitted' : 'disabled'}>{isSubmitActive ? 'Надіслати заявку' : isFormSubmitted ? 'Заявка відправлена!' : 'Надіслати заявку'}</button>
          <button type="reset">Очистити</button>
        </form>
      </fieldset>
    </section>
  )
}