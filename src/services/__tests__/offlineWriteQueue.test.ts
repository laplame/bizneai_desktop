import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  registerOfflineExecutor,
  enqueueOfflineWrite,
  flushOfflineWriteQueue,
  getOfflineWriteQueueCount,
  OFFLINE_QUEUE_STORAGE_KEY,
} from '../offlineWriteQueue';

describe('offlineWriteQueue', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('navigator', { onLine: true });
  });

  it('enqueues a write and flushes it once the executor succeeds', async () => {
    const executor = vi.fn().mockResolvedValue({ success: true });
    registerOfflineExecutor('test-kind-success', executor);

    enqueueOfflineWrite('test-kind-success', { foo: 'bar' }, 'dedup-1');
    expect(getOfflineWriteQueueCount('test-kind-success')).toBe(1);

    const synced = await flushOfflineWriteQueue();
    expect(synced).toBe(1);
    expect(executor).toHaveBeenCalledWith({ foo: 'bar' });
    expect(getOfflineWriteQueueCount('test-kind-success')).toBe(0);
  });

  it('keeps a retriable failure queued for the next flush', async () => {
    const executor = vi.fn().mockResolvedValue({ success: false, retriable: true, error: 'offline' });
    registerOfflineExecutor('test-kind-retriable', executor);

    enqueueOfflineWrite('test-kind-retriable', { a: 1 }, 'dedup-2');
    const synced = await flushOfflineWriteQueue();

    expect(synced).toBe(0);
    expect(getOfflineWriteQueueCount('test-kind-retriable')).toBe(1);
  });

  it('drops a non-retriable failure instead of retrying forever', async () => {
    const executor = vi.fn().mockResolvedValue({ success: false, retriable: false, error: 'validation' });
    registerOfflineExecutor('test-kind-permanent', executor);

    enqueueOfflineWrite('test-kind-permanent', { a: 1 }, 'dedup-3');
    const synced = await flushOfflineWriteQueue();

    expect(synced).toBe(0);
    expect(getOfflineWriteQueueCount('test-kind-permanent')).toBe(0);
  });

  it('deduplicates by id instead of piling up duplicate entries', () => {
    registerOfflineExecutor('test-kind-dedup', vi.fn());
    enqueueOfflineWrite('test-kind-dedup', { v: 1 }, 'same-id');
    enqueueOfflineWrite('test-kind-dedup', { v: 2 }, 'same-id');

    expect(getOfflineWriteQueueCount('test-kind-dedup')).toBe(1);
    const raw = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_STORAGE_KEY) || '[]');
    const match = raw.find((r: { id: string }) => r.id === 'same-id');
    expect(match.payload).toEqual({ v: 2 });
  });

  it('does not flush while offline', async () => {
    const executor = vi.fn().mockResolvedValue({ success: true });
    registerOfflineExecutor('test-kind-offline', executor);
    enqueueOfflineWrite('test-kind-offline', {}, 'dedup-offline');

    vi.stubGlobal('navigator', { onLine: false });
    const synced = await flushOfflineWriteQueue();

    expect(synced).toBe(0);
    expect(executor).not.toHaveBeenCalled();
    expect(getOfflineWriteQueueCount('test-kind-offline')).toBe(1);
  });
});
