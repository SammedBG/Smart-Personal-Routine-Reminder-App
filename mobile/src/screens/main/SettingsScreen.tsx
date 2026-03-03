import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Switch,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

import { useAuthStore } from '../../store/authStore';
import { logout } from '../../api/authApi';
import { updateProfile, changePassword, deleteAccount } from '../../api/userApi';
import { fetchDevices, removeDevice, DeviceInfo } from '../../api/deviceApi';
import { useTheme } from '../../theme/ThemeContext';

export const SettingsScreen: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const { isDark, colors, toggle } = useTheme();

  // Profile editing state
  const [editingProfile, setEditingProfile] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [timezone, setTimezone] = useState(user?.timezone || 'UTC');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password change state
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  // Device management state
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [showDevices, setShowDevices] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadDevices = useCallback(async () => {
    setLoadingDevices(true);
    try {
      const list = await fetchDevices();
      setDevices(list);
    } catch {
      // silently fail
    } finally {
      setLoadingDevices(false);
    }
  }, []);

  useEffect(() => {
    if (showDevices) {
      void loadDevices();
    }
  }, [showDevices, loadDevices]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (showDevices) await loadDevices();
    } finally {
      setRefreshing(false);
    }
  }, [showDevices, loadDevices]);

  const handleRemoveDevice = (deviceId: string) => {
    Alert.alert('Remove Device', 'Remove this device from your account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeDevice(deviceId);
            setDevices((prev) => prev.filter((d) => d.device_id !== deviceId));
          } catch {
            Alert.alert('Error', 'Failed to remove device');
          }
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => void logout(),
      },
    ]);
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await updateProfile({
        full_name: fullName.trim(),
        timezone: timezone.trim(),
      });
      setEditingProfile(false);
      Alert.alert('Success', 'Profile updated');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPw.length < 8) {
      Alert.alert('Validation', 'New password must be at least 8 characters');
      return;
    }
    setSavingPw(true);
    try {
      await changePassword(currentPw, newPw);
      setChangingPassword(false);
      setCurrentPw('');
      setNewPw('');
      Alert.alert('Success', 'Password changed');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to change password');
    } finally {
      setSavingPw(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action is irreversible. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Failed to delete account');
            }
          },
        },
      ],
    );
  };

  const bg = colors.background;
  const surfaceBg = colors.surface;
  const textColor = colors.text;
  const textSec = colors.textSecondary;
  const textTer = colors.textTertiary;
  const borderColor = colors.border;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: bg }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      {/* Profile Card */}
      <View style={[styles.profileCard, { backgroundColor: surfaceBg }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>
            {(user?.full_name || user?.email || '?')[0].toUpperCase()}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          {user?.full_name ? (
            <Text style={[styles.profileName, { color: textColor }]}>
              {user.full_name}
            </Text>
          ) : null}
          <Text style={[styles.profileEmail, { color: textSec }]}>
            {user?.email || 'Unknown'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setEditingProfile(!editingProfile)}>
          <Text style={{ color: colors.primary, fontWeight: '600' }}>
            {editingProfile ? 'Cancel' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Inline profile editor */}
      {editingProfile && (
        <View style={[styles.section, { backgroundColor: surfaceBg }]}>
          <Text style={[styles.sectionTitle, { color: textTer }]}>
            Edit Profile
          </Text>
          <TextInput
            style={[
              styles.inlineInput,
              { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: textColor },
            ]}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Full Name"
            placeholderTextColor={textTer}
          />
          <TextInput
            style={[
              styles.inlineInput,
              { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: textColor },
            ]}
            value={timezone}
            onChangeText={setTimezone}
            placeholder="Timezone (e.g. Asia/Kolkata)"
            placeholderTextColor={textTer}
          />
          <TouchableOpacity
            style={[styles.inlineBtn, { backgroundColor: colors.primary }]}
            onPress={handleSaveProfile}
            disabled={savingProfile}>
            <Text style={styles.inlineBtnText}>
              {savingProfile ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Account Section */}
      <View style={[styles.section, { backgroundColor: surfaceBg }]}>
        <Text style={[styles.sectionTitle, { color: textTer }]}>Account</Text>
        <View style={[styles.row, { borderColor }]}>
          <Text style={[styles.rowLabel, { color: textColor }]}>Email</Text>
          <Text style={[styles.rowValue, { color: textSec }]}>
            {user?.email}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.row, { borderColor }]}
          onPress={() => setChangingPassword(!changingPassword)}>
          <Text style={[styles.rowLabel, { color: textColor }]}>Password</Text>
          <Text style={{ color: colors.primary, fontWeight: '500' }}>
            {changingPassword ? 'Cancel' : 'Change'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Password change form */}
      {changingPassword && (
        <View style={[styles.section, { backgroundColor: surfaceBg }]}>
          <TextInput
            style={[
              styles.inlineInput,
              { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: textColor },
            ]}
            value={currentPw}
            onChangeText={setCurrentPw}
            placeholder="Current Password"
            placeholderTextColor={textTer}
            secureTextEntry
          />
          <TextInput
            style={[
              styles.inlineInput,
              { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: textColor },
            ]}
            value={newPw}
            onChangeText={setNewPw}
            placeholder="New Password (min 8 chars)"
            placeholderTextColor={textTer}
            secureTextEntry
          />
          <TouchableOpacity
            style={[styles.inlineBtn, { backgroundColor: colors.primary }]}
            onPress={handleChangePassword}
            disabled={savingPw}>
            <Text style={styles.inlineBtnText}>
              {savingPw ? 'Changing...' : 'Change Password'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Appearance Section */}
      <View style={[styles.section, { backgroundColor: surfaceBg }]}>
        <Text style={[styles.sectionTitle, { color: textTer }]}>
          Appearance
        </Text>
        <View style={[styles.row, { borderColor }]}>
          <Text style={[styles.rowLabel, { color: textColor }]}>Dark Mode</Text>
          <Switch
            value={isDark}
            onValueChange={toggle}
            trackColor={{ false: colors.border, true: colors.primary }}
            accessibilityLabel="Toggle dark mode"
          />
        </View>
      </View>

      {/* Devices Section */}
      <View style={[styles.section, { backgroundColor: surfaceBg }]}>
        <TouchableOpacity
          onPress={() => setShowDevices(!showDevices)}
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[styles.sectionTitle, { color: textTer }]}>Devices</Text>
          <Text style={{ color: colors.primary, fontWeight: '500' }}>
            {showDevices ? 'Hide' : 'Manage'}
          </Text>
        </TouchableOpacity>

        {showDevices && (
          <>
            {loadingDevices ? (
              <ActivityIndicator style={{ paddingVertical: 16 }} color={colors.primary} />
            ) : devices.length === 0 ? (
              <Text style={[styles.rowValue, { color: textSec, paddingVertical: 12 }]}>
                No registered devices
              </Text>
            ) : (
              devices.map((device) => (
                <View key={device.device_id} style={[styles.row, { borderColor }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowLabel, { color: textColor }]}>
                      {device.platform === 'android' ? '📱 Android' : '📱 iOS'}
                      {device.app_version ? ` v${device.app_version}` : ''}
                    </Text>
                    <Text style={{ color: textTer, fontSize: 12, marginTop: 2 }}>
                      Last seen: {new Date(device.last_seen_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveDevice(device.device_id)}>
                    <Text style={{ color: colors.danger, fontWeight: '600', fontSize: 13 }}>
                      Remove
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
        )}
      </View>

      {/* App Section */}
      <View style={[styles.section, { backgroundColor: surfaceBg }]}>
        <Text style={[styles.sectionTitle, { color: textTer }]}>App</Text>
        <View style={[styles.row, { borderColor }]}>
          <Text style={[styles.rowLabel, { color: textColor }]}>Version</Text>
          <Text style={[styles.rowValue, { color: textSec }]}>1.0.0</Text>
        </View>
      </View>

      {/* Actions */}
      <TouchableOpacity
        style={[styles.logoutBtn, { borderColor: colors.danger }]}
        onPress={handleLogout}
        accessibilityLabel="Logout"
        accessibilityRole="button">
        <Text style={[styles.logoutText, { color: colors.danger }]}>
          Logout
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.deleteAccountBtn}
        onPress={handleDeleteAccount}
        accessibilityLabel="Delete account"
        accessibilityRole="button">
        <Text style={[styles.deleteAccountText, { color: colors.textTertiary }]}>Delete Account</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginBottom: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
  },
  profileEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  section: {
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginVertical: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: {
    fontSize: 15,
  },
  rowValue: {
    fontSize: 15,
  },
  inlineInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 10,
  },
  inlineBtn: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  inlineBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  logoutBtn: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  deleteAccountBtn: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 40,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteAccountText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

