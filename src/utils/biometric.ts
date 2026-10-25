import {
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
  startAuthentication,
  startRegistration,
} from '@simplewebauthn/browser';

export interface BiometricAvailability {
  isSupported: boolean;
  hasPlatformAuthenticator: boolean;
}

/**
 * Checks if the current browser and device support biometric / platform authentication.
 */
export async function checkBiometricSupport(): Promise<BiometricAvailability> {
  try {
    if (typeof window === 'undefined') {
      return { isSupported: false, hasPlatformAuthenticator: false };
    }

    const isSupported = browserSupportsWebAuthn();
    if (!isSupported) {
      return { isSupported: false, hasPlatformAuthenticator: false };
    }

    let hasPlatform = false;
    try {
      hasPlatform = await platformAuthenticatorIsAvailable();
    } catch {
      hasPlatform = false;
    }

    return {
      isSupported: true,
      hasPlatformAuthenticator: hasPlatform,
    };
  } catch (err) {
    console.warn('Biometric support check error:', err);
    return { isSupported: false, hasPlatformAuthenticator: false };
  }
}

/**
 * Executes platform biometric authentication using WebAuthn.
 * Returns the authentication response or throws an error.
 */
export async function performBiometricAuthentication(optionsJSON: any) {
  try {
    const authResponse = await startAuthentication({ optionsJSON });
    return { success: true, response: authResponse };
  } catch (error: any) {
    const isCancelled =
      error.name === 'NotAllowedError' ||
      error.name === 'AbortError' ||
      error.message?.includes('cancelled') ||
      error.message?.includes('canceled') ||
      error.message?.includes('timed out');

    return {
      success: false,
      isCancelled,
      errorName: error.name,
      message: isCancelled
        ? 'Biometric authentication was cancelled or timed out.'
        : error.message || 'Biometric authentication failed.',
    };
  }
}

/**
 * Registers a new platform credential on this device.
 */
export async function performBiometricRegistration(optionsJSON: any) {
  try {
    const regResponse = await startRegistration({ optionsJSON });
    return { success: true, response: regResponse };
  } catch (error: any) {
    const isCancelled =
      error.name === 'NotAllowedError' ||
      error.name === 'AbortError' ||
      error.message?.includes('cancelled') ||
      error.message?.includes('canceled');

    return {
      success: false,
      isCancelled,
      errorName: error.name,
      message: isCancelled
        ? 'Biometric setup was cancelled.'
        : error.message || 'Failed to register biometric credential.',
    };
  }
}
