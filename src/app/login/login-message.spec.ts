import { describe, expect, it } from 'vitest';
import { formatLoginError } from './login-message';

describe('formatLoginError', () => {
  it('keeps dynamic content as plain message text', () => {
    expect(formatLoginError('<student>', '<strong>Try again</strong>')).toBe(
      'No se pudo autenticar a <student>.\n<strong>Try again</strong>'
    );
  });
});