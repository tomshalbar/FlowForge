export function validateSignUp(
  email: string,
  password: string,
  confirm_password: string,
) {
  if (!email.trim()) {
    return 'Email is required.';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return 'Invalid email address.';
  }

  if (!password) {
    return 'Password is required.';
  }

  if (password.length < 6) {
    return 'Password must be at least 6 characters.';
  }

  if (password !== confirm_password) {
    return 'Your password does not match.';
  }

  return null;
}
