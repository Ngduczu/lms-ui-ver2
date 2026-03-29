import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { loginApi, registerApi, getMyProfileApi } from '../api/authApi';
import { normalizeRole } from '../lib/role';
import {
  clearAuthStorage,
  getStoredToken,
  getStoredUser,
  setStoredToken,
  setStoredUser,
} from '../lib/storage';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());
  const [loading, setLoading] = useState(true);

  const role = useMemo(() => normalizeRole(user?.role), [user?.role]);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await getMyProfileApi();
      setUser(profile);
      setStoredUser(profile);
      return profile;
    } catch {
      clearAuthStorage();
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }
    refreshProfile().finally(() => setLoading(false));
  }, [refreshProfile]);

  const login = useCallback(async (credentials) => {
    const data = await loginApi(credentials);
    if (data?.token) setStoredToken(data.token);
    const profile = await getMyProfileApi();
    setUser(profile);
    setStoredUser(profile);
    return profile;
  }, []);

  const register = useCallback(async (payload) => {
    return registerApi(payload);
  }, []);

  const logout = useCallback(() => {
    clearAuthStorage();
    setUser(null);
  }, []);

  const contextValue = useMemo(
    () => ({ user, role, loading, login, register, logout, refreshProfile }),
    [user, role, loading, login, register, logout, refreshProfile],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}
