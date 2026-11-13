import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockPocketBase, listCall } from '../../helpers/pocketbase';

const client = createMockPocketBase();
vi.mock('@src/lib/api/pocketbase/pocketbase', () => ({
  pb: client.pb,
  pbAdmin: client.pbAdmin,
  pocketBaseUrl: 'http://localhost',
  pocketBaseClients: { user: client.pb, admin: client.pbAdmin },
}));

const api = await import('@src/lib/api/pocketbase/transportations');

const transportations = () => client.collection('transportations');

const page = (items: unknown[]) => ({ items, page: 1, perPage: 1000, totalItems: items.length, totalPages: 1 });

beforeEach(() => client.reset());

describe('listTransportations', () => {
  it('filters to one trip, in departure order', async () => {
    await api.listTransportations('t1');

    const { options } = listCall(transportations().getList);
    expect(options.filter).toBe('trip="t1"');
    expect(options.sort).toBe('departureTime');
  });

  // Times are stored as if UTC so every viewer sees the local time that was entered.
  it('converts the stored times for the browser', async () => {
    transportations().getList.mockResolvedValueOnce(
      page([
        {
          id: 'tr1',
          type: 'flight',
          departureTime: '2026-06-01 10:00:00.000Z',
          arrivalTime: '2026-06-01 22:00:00.000Z',
        },
      ])
    );

    const [transportation] = await api.listTransportations('t1');

    expect(transportation.departureTime).toBe('2026-06-01T10:00:00');
    expect(transportation.arrivalTime).toBe('2026-06-01T22:00:00');
  });
});

describe('listTransportationsByYear', () => {
  it("filters on the trip's start date within the year", async () => {
    await api.listTransportationsByYear('2026');

    const filter = listCall(transportations().getList).options.filter ?? '';
    expect(filter).toContain('trip.startDate >=');
    expect(filter).toContain('2026');
  });
});

describe('deleteTransportation', () => {
  it('deletes the named entry', async () => {
    await api.deleteTransportation('tr1');

    expect(transportations().delete).toHaveBeenCalledWith('tr1');
  });
});
