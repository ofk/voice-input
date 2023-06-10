import { isSupported } from '../src';

describe('isSupported', () => {
  it('returns bool value', () => {
    expect(typeof isSupported).toBe('boolean');
  });
});
