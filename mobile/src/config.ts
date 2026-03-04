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
 * Use 'localhost' as default for all platforms.
 *
 * For **emulator**: run  `adb reverse tcp:8000 tcp:8000`
 * For **physical device via USB**: run  `adb reverse tcp:8000 tcp:8000`
 * For **physical device via Wi-Fi**: set API_BASE_URL env var to your PC's LAN IP
 *   e.g. `http://192.168.1.100:8000/api/v1`
 */
const DEFAULT_API_HOST = 'localhost';

export const API_BASE_URL =
  // @ts-ignore – injected via babel-plugin-transform-inline-environment-variables
  (typeof process !== 'undefined' && process.env?.API_BASE_URL) ||
  `http://${DEFAULT_API_HOST}:8000/api/v1`;
