import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockPocketBase, listCall } from '../../helpers/pocketbase';

const client = createMockPocketBase();
vi.mock('@src/lib/api/pocketbase/pocketbase', () => ({
  pb: client.pb,
  pbAdmin: client.pbAdmin,
  pocketBaseUrl: 'http://localhost',
  pocketBaseClients: { user: client.pb, admin: client.pbAdmin },
}));

const api = await import('@src/lib/api/pocketbase/lists');

beforeEach(() => client.reset());

describe('loading datasets', () => {
  it('asks the admin endpoint for each dataset by name', async () => {
    await api.loadCities();
    await api.loadAirports();
    await api.loadAirlines();

    const names = client.pbAdmin.send.mock.calls.map((call) => (call[1] as { body: { name: string } }).body.name);
    expect(names).toEqual(['places', 'airports', 'airlines']);
    for (const call of client.pbAdmin.send.mock.calls) {
      expect(call[0]).toBe('/api/surmai/settings/datasets');
      expect((call[1] as { method: string }).method).toBe('POST');
    }
  });

  // Loading places takes minutes, so the request is given a long timeout.
  it('allows a long time for the request', async () => {
    await api.loadCities();

    const options = client.pbAdmin.send.mock.calls[0][1] as { signal?: AbortSignal };
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });
});

describe('counting reference data', () => {
  it('asks for a single row and reads the total', async () => {
    client.collection('places').getList.mockResolvedValueOnce({
      items: [],
      page: 1,
      perPage: 1,
      totalItems: 12345,
      totalPages: 12345,
    });

    expect(await api.countPlaces()).toBe(12345);
    expect(client.collection('places').getList).toHaveBeenCalledWith(1, 1);
  });

  it('counts airports and airlines the same way', async () => {
    await api.countAirports();
    await api.countAirlines();

    expect(client.collection('airports').getList).toHaveBeenCalledWith(1, 1);
    expect(client.collection('airlines').getList).toHaveBeenCalledWith(1, 1);
  });
});

describe('searchPlaces', () => {
  it('pages through the places collection', async () => {
    await api.searchPlaces('par', 2, 50);

    const { page, perPage } = listCall(client.collection('places').getList);
    expect(page).toBe(2);
    expect(perPage).toBe(50);
  });

  it('defaults to the first page', async () => {
    await api.searchPlaces('par');

    const { page, perPage } = listCall(client.collection('places').getList);
    expect(page).toBe(1);
    expect(perPage).toBe(20);
  });
});
