import { Platform } from 'react-native';

/**
 * API Base URL Configuration.
 * 
 * For Production Deployment:
 * Replace PRODUCTION_API_URL with your live Render backend URL, e.g.:
 * 'https://smartapp-api-xyz.onrender.com/api/v1'
 * 
 * Set IS_PRODUCTION = true when building your release app.
 */
const IS_PRODUCTION = false; // Set to true when deploying/building release APK
const PRODUCTION_API_URL = 'https://YOUR-RENDER-APP-NAME.onrender.com/api/v1';

const DEFAULT_API_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const LOCAL_API_URL = `http://${DEFAULT_API_HOST}:8000/api/v1`;

export const API_BASE_URL = IS_PRODUCTION ? PRODUCTION_API_URL : LOCAL_API_URL;

