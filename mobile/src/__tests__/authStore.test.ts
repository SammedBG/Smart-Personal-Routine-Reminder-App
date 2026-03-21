import { useAuthStore } from '../store/authStore';

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  });

  it('should initialize with unauthenticated state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('should set session correctly', () => {
    const mockUser = { id: 'u1', email: 'test@example.com', full_name: 'Test User' };
    useAuthStore.getState().setSession(mockUser, 'access-123', 'refresh-456');

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.accessToken).toBe('access-123');
    expect(state.refreshToken).toBe('refresh-456');
    expect(state.isAuthenticated).toBe(true);
  });

  it('should update user partial fields', () => {
    const mockUser = { id: 'u1', email: 'test@example.com', full_name: 'Old Name' };
    useAuthStore.getState().setSession(mockUser, 'a', 'r');

    useAuthStore.getState().updateUser({ full_name: 'New Name' });

    const state = useAuthStore.getState();
    expect(state.user?.full_name).toBe('New Name');
    expect(state.user?.email).toBe('test@example.com'); // unchanged
  });

  it('should not crash updateUser when user is null', () => {
    useAuthStore.getState().updateUser({ full_name: 'Test' });
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('should clear session completely', () => {
    const mockUser = { id: 'u1', email: 'test@example.com' };
    useAuthStore.getState().setSession(mockUser, 'a', 'r');

    useAuthStore.getState().clearSession();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});
