import { pb } from './pocketbase.ts';

export const fetchPOIsFromBackend = async (query: string) => {
  return pb.send('/api/surmai/explore/pois', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
};
