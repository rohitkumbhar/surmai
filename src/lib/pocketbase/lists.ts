import { pb } from './pocketbase.ts';


export const countCities = async () => {
  const { totalItems } = await pb.collection("cities").getList(1, 1);
  return totalItems;
}

export const countAirports = async () => {
  const { totalItems } = await pb.collection("airports").getList(1, 1);
  return totalItems;
}