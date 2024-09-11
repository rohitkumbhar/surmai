import {pb} from "./pocketbase.ts";
import {CreateTripForm, Trip} from "../../types/trips.ts";
import {currentUser} from "./auth.ts";

export const createTrip = async (values: CreateTripForm) => {

  const user = await currentUser();
  const {name, description, dateRange, participants, destinations} = values;
  const data = {
    "name": name,
    "description": description,
    "startDate": dateRange[0]?.toISOString(),
    "endDate": dateRange[1]?.toISOString(),
    "ownerId": user.id,
    "participants": JSON.stringify(participants?.map(entry => {
      return {name: entry};
    })),
    "destinations": JSON.stringify(destinations?.map(entry_1 => {
      return {name: entry_1};
    }))
  };
  return await pb.collection('trips').create(data);
}

export const getTrip = (tripId: string): Promise<Trip> => {
  return pb.collection('trips').getOne(tripId);
}

export const listTrips = (): Promise<Trip[]> => {
  return pb.collection('trips').getFullList({
    sort: '-created',
  });
}

export const updateTrip = (tripId: string, data: {[key: string]: any}) => {
  return pb.collection('trips').update(tripId, data);
}