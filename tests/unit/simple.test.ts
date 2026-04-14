import { describe, test, expect } from '@jest/globals';

describe('Simple Tests', () => {
  test('should pass a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  test('should handle async operations', async () => {
    const result = await Promise.resolve(42);
    expect(result).toBe(42);
  });

  test('should validate email format', () => {
    const email = 'test@example.com';
    expect(email).toMatch(/@/);
  });
});
