import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, UserRole, AuthContextType } from '../types';
import toast from 'react-hot-toast';
import { loginUser, registerUser, updateProfile as updateProfileAPI } from '../api.ts';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'business_nexus_user';
const TOKEN_KEY = 'token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, role: UserRole): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await loginUser({ email, password, role });
      const { token, user: userData } = res.data;

      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      setUser(userData);
      toast.success('Successfully logged in!');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Login failed';
      toast.error(msg);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await registerUser({ name, email, password, role });
      const { token, user: userData } = res.data;

      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      setUser(userData);
      toast.success('Account created successfully!');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Registration failed';
      toast.error(msg);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    toast.success('Logged out successfully');
  };

  const forgotPassword = async (_email: string): Promise<void> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('Password reset instructions sent to your email');
    } catch (error: any) {
      toast.error('Something went wrong');
      throw error;
    }
  };

  const resetPassword = async (_token: string, _newPassword: string): Promise<void> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('Password reset successfully');
    } catch (error: any) {
      toast.error('Something went wrong');
      throw error;
    }
  };

  const updateProfile = async (_userId: string, updates: Partial<User>): Promise<void> => {
    try {
      const res = await updateProfileAPI(updates);
      const updatedUser = res.data;
      setUser(updatedUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      toast.success('Profile updated successfully');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Update failed';
      toast.error(msg);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    isAuthenticated: !!user,
    isLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};