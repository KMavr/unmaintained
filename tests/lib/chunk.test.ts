import { describe, expect, it } from 'vitest';
import { chunk } from '../../src/lib/chunk.js';

describe('chunk', () => {
  it('should split a list into batches of the given size', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('should return a single batch when the list is smaller than the size', () => {
    expect(chunk([1, 2], 5)).toEqual([[1, 2]]);
  });

  it('should return an empty list of batches for an empty input', () => {
    expect(chunk([], 3)).toEqual([]);
  });

  it('should preserve order and lose no items across the split', () => {
    const items = Array.from({ length: 23 }, (_, i) => i);
    expect(chunk(items, 10).flat()).toEqual(items);
  });
});
