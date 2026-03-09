import { describe, it, expect } from 'vitest';
import { generateSessionId } from '@/utils/session-id';

describe('generateSessionId', () => {
  it('should return the same hash for the same inputs (deterministic)', () => {
    const id1 = generateSessionId('192.168.1.1', 'Mozilla/5.0');
    const id2 = generateSessionId('192.168.1.1', 'Mozilla/5.0');
    expect(id1).toBe(id2);
  });

  it('should return different hashes for different IPs', () => {
    const id1 = generateSessionId('192.168.1.1', 'Mozilla/5.0');
    const id2 = generateSessionId('10.0.0.1', 'Mozilla/5.0');
    expect(id1).not.toBe(id2);
  });

  it('should return different hashes for different user agents', () => {
    const id1 = generateSessionId('192.168.1.1', 'Mozilla/5.0');
    const id2 = generateSessionId('192.168.1.1', 'Chrome/120');
    expect(id1).not.toBe(id2);
  });

  it('should handle null IP', () => {
    const id1 = generateSessionId(null, 'Mozilla/5.0');
    const id2 = generateSessionId(null, 'Mozilla/5.0');
    expect(id1).toBe(id2);
    expect(id1).toHaveLength(16);
  });

  it('should handle null user agent', () => {
    const id1 = generateSessionId('192.168.1.1', null);
    const id2 = generateSessionId('192.168.1.1', null);
    expect(id1).toBe(id2);
    expect(id1).toHaveLength(16);
  });

  it('should handle both null inputs', () => {
    const id1 = generateSessionId(null, null);
    const id2 = generateSessionId(null, null);
    expect(id1).toBe(id2);
    expect(id1).toHaveLength(16);
  });

  it('should return a 16-character hex string', () => {
    const id = generateSessionId('192.168.1.1', 'Mozilla/5.0');
    expect(id).toHaveLength(16);
    expect(id).toMatch(/^[a-f0-9]{16}$/);
  });
});
