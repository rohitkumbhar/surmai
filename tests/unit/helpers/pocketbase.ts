import { vi } from 'vitest';

import type { Mock } from 'vitest';

/**
 * A stand-in for the PocketBase SDK client.
 *
 * The api modules take their collection handles at import time, so a test has
 * to mock `lib/api/pocketbase/pocketbase.ts` with this before importing them:
 *
 *   const client = createMockPocketBase();
 *   vi.mock('@src/lib/api/pocketbase/pocketbase', () => ({
 *     pb: client.pb, pbAdmin: client.pbAdmin, pocketBaseUrl: 'http://localhost',
 *   }));
 */
type MockFn = Mock<(...args: never[]) => unknown>;

export type MockCollection = {
  create: MockFn;
  update: MockFn;
  delete: MockFn;
  getOne: MockFn;
  getList: MockFn;
  getFullList: MockFn;
  getFirstListItem: MockFn;
  authWithPassword: MockFn;
  requestPasswordReset: MockFn;
};

export type MockClient = {
  collection: MockFn;
  createBatch: MockFn;
  send: MockFn;
  autoCancellation: MockFn;
  files: { getURL: MockFn };
  authStore: { isValid: boolean; record: { id: string }; clear: MockFn };
  settings: { update: MockFn; getAll: MockFn };
};

export type QueuedRequest = { collection: string; body: unknown };

export type MockPocketBase = {
  pb: MockClient;
  pbAdmin: MockClient;
  /** The recording handle for a collection, created on first use. */
  collection: (name: string) => MockCollection;
  /** Every batch that was opened, with the requests queued into it. */
  batches: QueuedRequest[][];
  reset: () => void;
};

/** The query options the SDK takes on list calls. */
export type ListOptions = { filter?: string; sort?: string; expand?: string };

const callOf = (fn: MockFn, index: number): unknown[] => (fn.mock.calls[index] ?? []) as unknown as unknown[];

/** Reads back a getList(page, perPage, options) call. */
export const listCall = (fn: MockFn, index = 0) => {
  const [page, perPage, options] = callOf(fn, index) as [number, number, ListOptions?];
  return { page, perPage, options: options ?? {} };
};

/** Reads back a getFullList(options) call. */
export const fullListCall = (fn: MockFn, index = 0): ListOptions => {
  const [options] = callOf(fn, index) as [ListOptions?];
  return options ?? {};
};

/** Reads back the body of a create or update call. */
export const bodyOf = <T>(fn: MockFn, index = 0): T => {
  const call = callOf(fn, index);
  return call[call.length - 1] as T;
};

const emptyPage = { items: [], page: 1, perPage: 30, totalItems: 0, totalPages: 0 };

const newCollection = (): MockCollection => ({
  create: vi.fn().mockResolvedValue({ id: 'created' }),
  update: vi.fn().mockResolvedValue({ id: 'updated' }),
  delete: vi.fn().mockResolvedValue(true),
  getOne: vi.fn().mockResolvedValue({ id: 'one' }),
  getList: vi.fn().mockResolvedValue(emptyPage),
  getFullList: vi.fn().mockResolvedValue([]),
  getFirstListItem: vi.fn().mockResolvedValue({ id: 'first' }),
  authWithPassword: vi.fn().mockResolvedValue({ token: 't', record: { id: 'u' } }),
  requestPasswordReset: vi.fn().mockResolvedValue(true),
});

export const createMockPocketBase = (): MockPocketBase => {
  const collections = new Map<string, MockCollection>();

  const collection = (name: string): MockCollection => {
    if (!collections.has(name)) {
      collections.set(name, newCollection());
    }
    return collections.get(name)!;
  };

  const createRecord = (name: string, body: unknown) =>
    (collection(name).create as unknown as (body: unknown) => Promise<unknown>)(body);

  // uploadAttachments creates records in a batch; the fake records every queued
  // create and replies with one result per queued request.
  const batches: QueuedRequest[][] = [];
  const createBatch = () => {
    const queued: QueuedRequest[] = [];
    batches.push(queued);
    return {
      collection: (name: string) => ({
        create: (body: unknown) => queued.push({ collection: name, body }),
      }),
      send: () =>
        Promise.all(
          queued.map(async (request) => ({
            status: 200,
            body: await createRecord(request.collection, request.body),
          }))
        ),
    };
  };

  const makeClient = (): MockClient => ({
    collection: vi.fn(collection) as unknown as MockFn,
    createBatch: vi.fn(createBatch) as unknown as MockFn,
    send: vi.fn().mockResolvedValue({}),
    autoCancellation: vi.fn(),
    files: { getURL: vi.fn(() => 'http://localhost/file') as unknown as MockFn },
    authStore: { isValid: true, record: { id: 'u' }, clear: vi.fn() },
    settings: { update: vi.fn().mockResolvedValue({}), getAll: vi.fn().mockResolvedValue({}) },
  });

  const pb = makeClient();
  const pbAdmin = makeClient();

  return {
    pb,
    pbAdmin,
    collection,
    batches,
    reset: () => {
      collections.forEach((c) => Object.values(c).forEach((fn) => fn.mockClear()));
      pb.send.mockClear();
      pbAdmin.send.mockClear();
      pb.createBatch.mockClear();
      pbAdmin.createBatch.mockClear();
      batches.length = 0;
    },
  };
};
