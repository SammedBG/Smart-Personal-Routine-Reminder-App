/**
 * Tests for the FNV-1a notification hash function.
 *
 * We extract and test the hash function directly since NotificationService
 * imports native modules that can't be loaded in a pure Jest environment.
 */

// Exact copy of the stableHashCode function from NotificationService.ts
/* eslint-disable no-bitwise */
function stableHashCode(str: string): number {
  let hash = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193); // FNV prime
  }
  return Math.abs(hash | 0);
}
/* eslint-enable no-bitwise */

describe('stableHashCode (FNV-1a)', () => {
  it('should return a positive number', () => {
    const result = stableHashCode('test-id-123');
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('should be deterministic — same input always gives same output', () => {
    const input = 'reminder-abc-def-123';
    const a = stableHashCode(input);
    const b = stableHashCode(input);
    expect(a).toBe(b);
  });

  it('should produce different hashes for different inputs', () => {
    const hash1 = stableHashCode('reminder-a');
    const hash2 = stableHashCode('reminder-b');
    expect(hash1).not.toBe(hash2);
  });

  it('should produce different hashes for similar UUIDs', () => {
    // These are the kind of IDs the app actually uses
    const hash1 = stableHashCode('550e8400-e29b-41d4-a716-446655440000');
    const hash2 = stableHashCode('550e8400-e29b-41d4-a716-446655440001');
    expect(hash1).not.toBe(hash2);
  });

  it('should not collide for a batch of sequential IDs', () => {
    const hashes = new Set<number>();
    for (let i = 0; i < 1000; i++) {
      hashes.add(stableHashCode(`reminder-${i}`));
    }
    // All 1000 should be unique
    expect(hashes.size).toBe(1000);
  });

  it('should handle empty string', () => {
    const result = stableHashCode('');
    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('should handle very long strings', () => {
    const longId = 'a'.repeat(10000);
    const result = stableHashCode(longId);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(result)).toBe(true);
  });

  it('should handle strings with special characters', () => {
    const result = stableHashCode('reminder-📱-🔔-test');
    expect(result).toBeGreaterThanOrEqual(0);
  });
});
