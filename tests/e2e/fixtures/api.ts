import type { APIRequestContext } from '@playwright/test';

export type AuthResult = { token: string; record: Record<string, unknown> };

export type SeededUser = {
  id: string;
  email: string;
  password: string;
  name: string;
  token: string;
  record: Record<string, unknown>;
};

export type TripInput = {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  destinations?: Record<string, unknown>[];
  participants?: Record<string, unknown>[];
  travellers?: string[];
  collaborators?: string[];
};

/**
 * Seeds and reads data through the REST API.
 *
 * Tests seed through here rather than by driving the UI: it is faster, it does
 * not depend on the screens it is setting up for, and it can create data for
 * several users in one test.
 */
export class SurmaiApi {
  constructor(
    private readonly request: APIRequestContext,
    private readonly token: string
  ) {}

  /** Acts as an already signed-in user, for the things only they may do. */
  static asUser(request: APIRequestContext, user: SeededUser): SurmaiApi {
    return new SurmaiApi(request, user.token);
  }

  /** Signs in as the superuser configured for the test backend. */
  static async asSuperuser(request: APIRequestContext, email: string, password: string): Promise<SurmaiApi> {
    const auth = await authenticate(request, '_superusers', email, password);
    return new SurmaiApi(request, auth.token);
  }

  private get headers() {
    return { Authorization: this.token, 'Content-Type': 'application/json' };
  }

  async createRecord(collection: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const response = await this.request.post(`/api/collections/${collection}/records`, {
      headers: this.headers,
      data,
    });
    if (!response.ok()) {
      throw new Error(`could not create a ${collection} record: ${response.status()} ${await response.text()}`);
    }
    return (await response.json()) as Record<string, unknown>;
  }

  async updateRecord(collection: string, id: string, data: Record<string, unknown>) {
    const response = await this.request.patch(`/api/collections/${collection}/records/${id}`, {
      headers: this.headers,
      data,
    });
    if (!response.ok()) {
      throw new Error(`could not update ${collection}/${id}: ${response.status()} ${await response.text()}`);
    }
    return (await response.json()) as Record<string, unknown>;
  }

  async deleteRecord(collection: string, id: string) {
    const response = await this.request.delete(`/api/collections/${collection}/records/${id}`, {
      headers: this.headers,
    });
    if (!response.ok()) {
      throw new Error(`could not delete ${collection}/${id}: ${response.status()} ${await response.text()}`);
    }
  }

  async listRecords(collection: string, query: Record<string, string> = {}) {
    const response = await this.request.get(`/api/collections/${collection}/records`, {
      headers: this.headers,
      params: { perPage: '200', ...query },
    });
    if (!response.ok()) {
      throw new Error(`could not list ${collection}: ${response.status()} ${await response.text()}`);
    }
    const body = (await response.json()) as { items: Record<string, unknown>[]; totalItems: number };
    return body;
  }

  /** Creates a user and signs them in, returning the session a page can adopt. */
  async createUser(email: string, password = 'e2e-password-1234', name = email): Promise<SeededUser> {
    const created = await this.createRecord('users', {
      email,
      password,
      passwordConfirm: password,
      name,
      emailVisibility: true,
      verified: true,
    });

    const auth = await authenticate(this.request, 'users', email, password);
    return {
      id: created.id as string,
      email,
      password,
      name,
      token: auth.token,
      record: auth.record,
    };
  }

  async createTrip(owner: SeededUser, trip: TripInput = {}) {
    return this.createRecord('trips', {
      name: 'E2E Trip',
      description: 'Created by the test suite',
      startDate: isoDay(0),
      endDate: isoDay(7),
      participants: [{ name: owner.name }],
      destinations: [],
      ...trip,
      ownerId: owner.id,
    });
  }

  async createTravellerProfile(owner: SeededUser, fields: Record<string, unknown> = {}) {
    return this.createRecord('traveller_profiles', {
      email: `traveller-${unique()}@example.com`,
      legalName: 'Test Traveller',
      ...fields,
      ownerId: owner.id,
    });
  }

  /** Invites someone to collaborate on a trip. Must be sent as the trip owner. */
  async inviteCollaborator(tripId: string, recipientEmail: string, message = 'Join my trip') {
    return this.createRecord('invitations', { trip: tripId, recipientEmail, message });
  }

  /** Reads PocketBase's own settings, which hold the mail configuration. */
  async readInstanceSettings(): Promise<Record<string, unknown>> {
    const response = await this.request.get('/api/settings', { headers: this.headers });
    if (!response.ok()) {
      throw new Error(`could not read the instance settings: ${response.status()}`);
    }
    return (await response.json()) as Record<string, unknown>;
  }

  /** Updates PocketBase's own settings. */
  async writeInstanceSettings(data: Record<string, unknown>) {
    const response = await this.request.patch('/api/settings', { headers: this.headers, data });
    if (!response.ok()) {
      throw new Error(`could not update the instance settings: ${response.status()} ${await response.text()}`);
    }
    return (await response.json()) as Record<string, unknown>;
  }

  /** Reads a settings record's value. */
  async readSetting(id: string): Promise<Record<string, unknown>> {
    const response = await this.request.get(`/api/collections/surmai_settings/records/${id}`, {
      headers: this.headers,
    });
    if (!response.ok()) {
      throw new Error(`could not read the ${id} setting: ${response.status()}`);
    }
    const record = (await response.json()) as { value: unknown };
    return typeof record.value === 'string'
      ? (JSON.parse(record.value || '{}') as Record<string, unknown>)
      : ((record.value ?? {}) as Record<string, unknown>);
  }

  /** Points a settings record at a value, as the admin screens do. */
  async writeSetting(id: string, value: Record<string, unknown>) {
    return this.updateRecord('surmai_settings', id, { value: JSON.stringify(value) });
  }
}

export async function authenticate(
  request: APIRequestContext,
  collection: string,
  identity: string,
  password: string
): Promise<AuthResult> {
  const response = await request.post(`/api/collections/${collection}/auth-with-password`, {
    headers: { 'Content-Type': 'application/json' },
    data: { identity, password },
  });
  if (!response.ok()) {
    throw new Error(`could not sign in as ${identity}: ${response.status()} ${await response.text()}`);
  }
  return (await response.json()) as AuthResult;
}

/** A value unique to this worker and moment, for emails and names. */
export function unique(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * A trip date this many days from today, stored the way the app stores one.
 *
 * The trip form sends the picked day's local midnight, which the backend keeps
 * as the matching UTC instant. Seeding a literal UTC midnight instead would
 * display as the previous day anywhere west of UTC.
 */
export function isoDay(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return localMidnight(date);
}

/** The stored form of a local calendar day, given as YYYY-MM-DD. */
export function storedDay(day: string): string {
  const [year, month, date] = day.split('-').map(Number);
  return localMidnight(new Date(year, month - 1, date));
}

function localMidnight(date: Date): string {
  date.setHours(0, 0, 0, 0);
  return date.toISOString().replace('T', ' ');
}
