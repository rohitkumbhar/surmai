import {pb} from "./pocketbase.ts";
import {CreateTripFormData} from "../../types/trips.ts";
import {currentUser} from "./auth.ts";

export const createTrip = (values: CreateTripFormData) => {

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