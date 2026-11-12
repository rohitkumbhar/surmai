import { beforeEach, describe, expect, it, vi } from 'vitest';

import { bodyOf, createMockPocketBase, listCall } from '../../helpers/pocketbase';

const client = createMockPocketBase();
vi.mock('../../../../src/lib/api/pocketbase/pocketbase', () => ({
  pb: client.pb,
  pbAdmin: client.pbAdmin,
  pocketBaseUrl: 'http://localhost',
  pocketBaseClients: { user: client.pb, admin: client.pbAdmin },
}));

const api = await import('../../../../src/lib/api/pocketbase/attachments');

const attachments = () => client.collection('trip_attachments');

beforeEach(() => client.reset());

describe('uploadAttachments', () => {
  it('sends every file in one batch, tagged with the trip', async () => {
    attachments().create
      .mockResolvedValueOnce({ id: 'a1', name: 'one.pdf' })
      .mockResolvedValueOnce({ id: 'a2', name: 'two.pdf' });

    const uploaded = await api.uploadAttachments('t1', [
      new File(['one'], 'one.pdf'),
      new File(['two'], 'two.pdf'),
    ]);

    expect(client.pb.createBatch).toHaveBeenCalledTimes(1);
    expect(uploaded.map((a) => a.id)).toEqual(['a1', 'a2']);

    expect(attachments().create.mock.calls).toHaveLength(2);
    const first = bodyOf<FormData>(attachments().create);
    expect(first.get('trip')).toBe('t1');
    expect(first.get('name')).toBe('one.pdf');
    expect(first.get('file')).toBeInstanceOf(File);
  });

  it('does not open a batch for an empty list', async () => {
    expect(await api.uploadAttachments('t1', [])).toEqual([]);
    expect(client.pb.createBatch).not.toHaveBeenCalled();
  });
});

describe('getTripAttachments', () => {
  it('filters to the trip, newest first', async () => {
    await api.getTripAttachments('t1');

    const { page, perPage, options } = listCall(attachments().getList);
    expect(page).toBe(1);
    expect(perPage).toBe(100);
    expect(options.filter).toBe('trip="t1"');
    expect(options.sort).toBe('-created');
  });
});

describe('deleteAttachment', () => {
  it('deletes the named attachment', async () => {
    await api.deleteAttachment('a1');

    expect(attachments().delete).toHaveBeenCalledWith('a1');
  });
});
