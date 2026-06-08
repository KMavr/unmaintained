import { describe, expect, it } from 'vitest';
import { pLimit } from '../../src/lib/pLimit.js';

describe('pLimit', () => {
  it('should never run more than the given number of tasks at once', async () => {
    const limit = pLimit(2);
    let active = 0;
    let peak = 0;
    const run = async () => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
    };
    await Promise.all(Array.from({ length: 10 }, () => limit(run)));
    expect(peak).toBe(2);
  });

  it('should resolve each call to its own task result, in input order', async () => {
    const limit = pLimit(3);
    const results = await Promise.all([1, 2, 3, 4, 5].map((n) => limit(async () => n * 2)));
    expect(results).toEqual([2, 4, 6, 8, 10]);
  });

  it('should run every task even when there are more tasks than the limit', async () => {
    const limit = pLimit(2);
    let count = 0;
    await Promise.all(
      Array.from({ length: 7 }, () =>
        limit(async () => {
          count += 1;
        }),
      ),
    );
    expect(count).toBe(7);
  });

  it('should release the slot on a rejected task so the queue does not wedge', async () => {
    const limit = pLimit(1);
    // Both submitted up front: 'ok' is queued BEHIND the failing task, so it can
    // only run if the rejection path frees the slot and pumps the queue.
    const failing = limit(async () => {
      throw new Error('boom');
    });
    const following = limit(async () => 'ok');
    await expect(failing).rejects.toThrow('boom');
    await expect(following).resolves.toBe('ok');
  });
});
