import { create } from 'zustand';

import createClientLogger from '../utils/clientLogger';
//remember to change is authenticated in the db and also in the routes
import type { User, AuthResponse } from '../types/auth';
import authApi, { setAccessToken } from '../library/authApi';
const log = createClientLogger('AUTH STORE');
type AuthState = {
    user: User | null;
    accessToken: string | null;

    isAuthenticated: boolean;
    isLoading: boolean;
    register: (email: string, password: string) => Promise<void>;
    refresh: () => Promise<void>;
    logout: () => Promise<void>;
};
export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    accessToken: null,
    isLoading: false,
    register: async (email, password) => {
        set({ isLoading: true });
        try {
            const res = await authApi.post<AuthResponse>('/auth/register', {
                email,
                password,
            });
            setAccessToken(res.data.accessToken);
            set({
                user: res.data.user,
                accessToken: res.data.accessToken,
                isAuthenticated: true,
            });
        } catch (error) {
            log.error('Error in registering', {
                data: { error },
            });
            set({ isAuthenticated: false });
        } finally {
            set({ isLoading: false });
        }
    },
    refresh: async () => {
        set({ isLoading: true });
        try {
            const res = await authApi.post('/auth/refresh');
            setAccessToken(res.data.accessToken);
            set({
                user: res.data.user,
                accessToken: res.data.accessToken,
                isAuthenticated: true,
            });
        } catch (error) {
            // refresh failed; user stays logged out
            setAccessToken(null);
            set({
                user: null,
                accessToken: null,
                isAuthenticated: false,
            });
            log.error('Error in refreshing', { data: error });
        } finally {
            set({ isLoading: false });
        }
    },
    logout: async () => {
        await authApi.post('/auth/logout');
        setAccessToken(null);
        set({ user: null, accessToken: null, isAuthenticated: false });
    },
}));
