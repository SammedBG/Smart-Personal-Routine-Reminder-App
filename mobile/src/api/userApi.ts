import { apiClient } from './client';
import { useAuthStore } from '../store/authStore';

type UserProfile = {
  id: string;
  email: string;
  full_name?: string | null;
  timezone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export async function updateProfile(data: {
  full_name?: string;
  timezone?: string;
}): Promise<UserProfile> {
  const res = await apiClient.patch<UserProfile>('/users/me', data);
  useAuthStore.getState().updateUser(data);
  return res.data;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await apiClient.post('/users/me/password', {
    current_password: currentPassword,
    new_password: newPassword,
  });
}

export async function deleteAccount(): Promise<void> {
  await apiClient.delete('/users/me');
  useAuthStore.getState().clearSession();
}
