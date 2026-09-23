import { describe, expect, it } from 'vitest';
import { nextReceiptNumbers } from './receiptNumber';

describe('nextReceiptNumbers', () => {
  it('keeps the RCP-###### format, seeded from the last six clock digits', () => {
    expect(nextReceiptNumbers(1, [], 1758620482913)).toEqual(['RCP-482913']);
  });

  it('gives every payment in a batch a distinct number', () => {
    const nums = nextReceiptNumbers(40, [], 1758620482913);
    expect(nums).toHaveLength(40);
    expect(new Set(nums).size).toBe(40);
    expect(nums.slice(0, 3)).toEqual(['RCP-482913', 'RCP-482914', 'RCP-482915']);
  });

  it('skips numbers already on record', () => {
    expect(nextReceiptNumbers(2, ['RCP-000010', undefined, 'RCP-000011'], 10)).toEqual(['RCP-000012', 'RCP-000013']);
  });

  it('zero-pads and wraps around at the top of the six-digit range', () => {
    expect(nextReceiptNumbers(3, [], 999_999)).toEqual(['RCP-999999', 'RCP-000000', 'RCP-000001']);
  });

  it('returns nothing for a zero count', () => {
    expect(nextReceiptNumbers(0, [])).toEqual([]);
  });
});
