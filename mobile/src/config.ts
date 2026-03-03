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
const DEFAULT_API_HOST = Platform.select({
  android: '10.0.2.2',
  ios: 'localhost',
  default: 'localhost',
});

export const API_BASE_URL =
  // @ts-ignore – injected via babel-plugin-transform-inline-environment-variables
  (typeof process !== 'undefined' && process.env?.API_BASE_URL) ||
  `http://${DEFAULT_API_HOST}:8000/api/v1`;
