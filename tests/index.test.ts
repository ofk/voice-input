import { noop } from '../src';

describe('index.ts', () => {
  test('noop', () => {
    expect(typeof noop).toBe('function');
  });
});
