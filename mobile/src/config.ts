import { Platform } from 'react-native';

/**
 * API base URL configuration.
 *
 * Android emulator uses 10.0.2.2 to reach the host machine's localhost.
 * iOS simulator and physical devices should use the host machine's actual IP.
 *
 * Override: set the `API_BASE_URL` environment variable or change the
 * fallback value below for your setup.
 */
/**
 * NOTE:
 * This repo does not currently configure a Babel env-inlining plugin,
 * so `process.env.API_BASE_URL` will typically be undefined in RN builds.
 *
 * Pick a default that works out-of-the-box for Android emulator.
 */
const DEFAULT_API_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const API_BASE_URL = `http://${DEFAULT_API_HOST}:8000/api/v1`;
