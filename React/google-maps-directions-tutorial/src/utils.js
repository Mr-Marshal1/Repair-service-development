/*global google*/

export const getRouteInfo = async (origin, destination, directionsService) => {
    const results = await directionsService.route({
        origin,
        destination,
        travelMode: google?.maps.TravelMode.WALKING,
    })

    return {
        directionResponse: results,
        distance: results.routes[0].legs[0].distance,
        duration: results.routes[0].legs[0].duration,
        markerLabel: destination.label 
    };
}
