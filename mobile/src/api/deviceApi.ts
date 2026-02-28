import { apiClient } from './client';

export interface DeviceInfo {
  id: string;
  device_id: string;
  platform: string;
  app_version: string | null;
  last_seen_at: string;
  is_active: boolean;
}

export async function fetchDevices(): Promise<DeviceInfo[]> {
  const { data } = await apiClient.get<DeviceInfo[]>('/devices/');
  return data;
}

export async function removeDevice(deviceId: string): Promise<void> {
  await apiClient.delete(`/devices/${deviceId}`);
}
