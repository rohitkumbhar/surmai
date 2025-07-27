import { Airline, Airport } from '../../../types/trips.ts';


export type FlightRoute = {
  callsign: string,
  callsign_icao: string,
  callsign_iata: string,
  airline: Airline,
  origin: Airport,
  destination: Airport
}


export const getFlightRoute = (flightNumber: string): Promise<FlightRoute> => {

  const sanitizedFlightNumber = flightNumber.replace(/\s/g, '').toUpperCase();
  if (sanitizedFlightNumber === '') {
    return Promise.reject('Invalid Flight Number');
  }

  return fetch(` https://api.adsbdb.com/v0/callsign/${sanitizedFlightNumber}`)
    .then(r => r.json())
    .then(data => {
      console.log(data);
      const route = data.response.flightroute;

      if (!route) {
        return Promise.reject('Invalid Flight Number');
      }

      return {
        callsign: route.callsign,
        callsign_iata: route.callsign_iata,
        callsign_icao: route.callsign_icao,
        airline: {
          name: route.airline?.name,
          code: route.airline?.iata,
        },
        origin: {
          name: route.origin?.name,
          iataCode: route.origin?.iata_code,
        },
        destination: {
          name: route.destination?.name,
          iataCode: route.destination?.iata_code,
        },
      };
    });

};