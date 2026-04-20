import { validateSignUp } from '../logic/signUpValidation';

describe('validate singnup', () => {
  test('returns error if email is empty', () => {
    expect(validateSignUp('', 'password123', 'password123')).toBe(
      'Email is required.',
    );
  });

  test('returns error if password is empty', () => {
    expect(validateSignUp('test@gmail.com', '', 'password123')).toBe(
      'Password is required.',
    );
  });

  test('returns error if password is too short', () => {
    expect(validateSignUp('test@gmail.com', 'short', 'short')).toBe(
      'Password must be at least 6 characters.',
    );
  });

  test('returns error if password is empty', () => {
    expect(validateSignUp('test@gmail.com', 'password113', 'password123')).toBe(
      'Your password does not match.',
    );
  });
});
