import { beforeEach, describe, expect, it, vi } from 'vitest';

import { bodyOf, createMockPocketBase, fullListCall } from '../../helpers/pocketbase';

const client = createMockPocketBase();
vi.mock('../../../../src/lib/api/pocketbase/pocketbase', () => ({
  pb: client.pb,
  pbAdmin: client.pbAdmin,
  pocketBaseUrl: 'http://localhost',
  pocketBaseClients: { user: client.pb, admin: client.pbAdmin },
}));

const api = await import('../../../../src/lib/api/pocketbase/trips');

const trips = () => client.collection('trips');

beforeEach(() => client.reset());

describe('createTrip', () => {
  it('sends the trip to the trips collection', async () => {
    await api.createTrip({ name: 'Paris', ownerId: 'u1' } as never);

    expect(trips().create).toHaveBeenCalledWith({ name: 'Paris', ownerId: 'u1' });
  });
});

describe('getTrip', () => {
  it('reads a single trip by id', async () => {
    await api.getTrip('t1');

    expect(trips().getOne).toHaveBeenCalledWith('t1');
  });
});

describe('listUpcomingTrips', () => {
  it('asks for trips that have not ended, soonest first', async () => {
    await api.listUpcomingTrips();

    const options = fullListCall(trips().getFullList);
    expect(options.sort).toBe('startDate');
    expect(options.filter).toMatch(/^endDate >= "\d{4}-\d{2}-\d{2}"$/);
  });
});

describe('listPastTrips', () => {
  it('asks for trips that have ended, most recent first', async () => {
    await api.listPastTrips();

    const options = fullListCall(trips().getFullList);
    expect(options.sort).toBe('-endDate');
    expect(options.filter).toMatch(/^endDate < "\d{4}-\d{2}-\d{2}"$/);
  });
});

describe('updateTrip', () => {
  it('updates the named trip', async () => {
    await api.updateTrip('t1', { name: 'Renamed' } as never);

    expect(trips().update).toHaveBeenCalledWith('t1', { name: 'Renamed' });
  });
});

describe('deleteTrip', () => {
  it('deletes the named trip', async () => {
    await api.deleteTrip('t1');

    expect(trips().delete).toHaveBeenCalledWith('t1');
  });
});

describe('collaborators', () => {
  it('adds collaborators without replacing the existing ones', async () => {
    await api.addCollaborators('t1', ['u2', 'u3']);

    // the + suffix is PocketBase's append operator
    expect(trips().update).toHaveBeenCalledWith('t1', { 'collaborators+': ['u2', 'u3'] });
  });

  it('removes a single collaborator', async () => {
    await api.deleteCollaborator('t1', 'u2');

    expect(trips().update).toHaveBeenCalledWith('t1', { 'collaborators-': 'u2' });
  });

  it('asks the backend for the collaborator records', async () => {
    await api.listCollaborators({ tripId: 't1' });

    expect(client.pb.send).toHaveBeenCalledWith('/api/surmai/trip/t1/collaborators', { method: 'GET' });
  });
});

describe('saveTripNotes', () => {
  it('updates only the notes', async () => {
    await api.saveTripNotes('t1', '<p>Remember the adapter</p>');

    expect(trips().update).toHaveBeenCalledWith('t1', { notes: '<p>Remember the adapter</p>' });
  });
});

describe('uploadTripCoverImage', () => {
  it('sends the image as form data', async () => {
    const file = new Blob(['image bytes']);

    await api.uploadTripCoverImage('t1', file);

    expect(trips().update.mock.calls[0][0]).toBe('t1');
    const body = bodyOf<FormData>(trips().update);
    expect(body).toBeInstanceOf(FormData);
    expect(body.get('coverImage')).toBeInstanceOf(Blob);
  });
});
