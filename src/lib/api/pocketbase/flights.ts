import { pb } from './pocketbase.ts';

import type { Airline, Airport } from '../../../types/trips.ts';

export type FlightRoute = {
  callsign: string;
  callsign_icao: string;
  callsign_iata: string;
  airline: Airline;
  origin: Airport;
  destination: Airport;
};

export const getFlightRoute = (flightNumber: string): Promise<FlightRoute> => {
  const sanitizedFlightNumber = flightNumber.replace(/\s/g, '').toUpperCase();
  if (sanitizedFlightNumber === '') {
    return Promise.reject('Invalid Flight Number');
  }

  // /api/surmai/flight-route/{flightNumber}

  return pb.send(`/api/surmai/flight-route/${sanitizedFlightNumber}`, {
    method: 'GET',
    signal: AbortSignal.timeout(5 * 60 * 1000),
  });
};
