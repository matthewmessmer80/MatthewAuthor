/**
 * Error translator for Firebase Authentication.
 * Translates raw error codes into friendly user messages.
 */

export function getFirebaseAuthErrorMessage(error: any): string {
  if (!error) return 'An error occurred during authentication. Please try again.';

  const code = (
    error?.code ||
    (typeof error === 'string' ? error : error?.message || '')
  ).toLowerCase();

  // 1. Email/Password provider disabled
  if (code.includes('auth/operation-not-allowed') || code.includes('operation-not-allowed')) {
    return 'Email and password sign-in is not currently enabled for this website. Please contact the site administrator.';
  }

  // 2. Invalid credentials
  if (code.includes('auth/invalid-credential') || code.includes('invalid-credential')) {
    return 'The email address or password is incorrect.';
  }

  // 3. User not found
  if (code.includes('auth/user-not-found') || code.includes('user-not-found')) {
    return "We couldn't find an account with that email address.";
  }

  // 4. Wrong password
  if (code.includes('auth/wrong-password') || code.includes('wrong-password')) {
    return 'The email address or password is incorrect.';
  }

  // 5. Email already registered
  if (code.includes('auth/email-already-in-use') || code.includes('email-already-in-use')) {
    return 'An account already exists with this email address.';
  }

  // 6. Weak password
  if (code.includes('auth/weak-password') || code.includes('weak-password')) {
    return 'Please choose a stronger password.';
  }

  // 7. Too many requests
  if (code.includes('auth/too-many-requests') || code.includes('too-many-requests')) {
    return 'Too many attempts were made. Please wait a moment and try again.';
  }

  // 8. Network issue
  if (code.includes('auth/network-request-failed') || code.includes('network-request-failed')) {
    return 'Network connection failed. Please check your internet connection.';
  }

  return 'An error occurred during authentication. Please try again.';
}
