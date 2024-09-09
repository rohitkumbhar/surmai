import {pb} from "./pocketbase.ts";
import {Trip} from "../../types/trips.ts";
import {currentUser} from "./auth.ts";

export const createTrip = (values: Trip) => {

  return currentUser().then(
    user => {
      const {name, description, startDate, endDate, participants, destinations} = values

      const data = {
        "name": name,
        "description": description,
        "startDate": startDate?.toISOString(),
        "endDate": endDate?.toISOString(),
        "ownerId": user.id
      };

      return pb.collection('trips').create(data)

    }
  )
}

export const getTrip = (tripId: string) => {
  return pb.collection('trips').getOne(tripId);
}

export const listTrips = () : Promise<Trip[]> => {
  return pb.collection('trips').getFullList({
    sort: '-created',
  });
}