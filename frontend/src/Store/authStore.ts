import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { setAccessToken as setApiToken } from '../library/authApi';
import createClientLogger from '../utils/clientLogger';
//remember to change is authenticated in the db and also in the routes
import type { User, AuthResponse } from '../types/auth';
import authApi, { setAccessToken } from '../library/authApi';
import useSuccessStore from './SuccessStore';
import useErrorStore from './ErrorStore';
import handleApiError from '../utils/apiError';
const log = createClientLogger('AUTH STORE');
type AuthState = {
    user: User | null;
    accessToken: string | null;
    _hasHydrated: boolean; //<-- used  as a flag to tell the pages to wait until the is authenticated is read from the local storage
    isAuthenticated: boolean;
    isLoading: boolean;
    register: (email: string, password: string) => Promise<void>;
    setHasHydrated: (state: boolean) => void;
    setAccessToken: (token: string | null) => void;
    refresh: () => Promise<void>;
    logout: () => Promise<void>;
};
export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            accessToken: null,
            isLoading: true,
            _hasHydrated: false,
            setHasHydrated: (state) => set({ _hasHydrated: state }),
            setAccessToken: (token: string | null) => {
                (set({ accessToken: token }), setApiToken(token));
            },
            register: async (email, password) => {
                set({ isLoading: true });
                log.highlight('SENDING DATA TO THE BACKEND');
                try {
                    log.info('Data sent to the backend', {
                        data: { email, password },
                    });
                    const res = await authApi.post<AuthResponse>(
                        '/auth/register',
                        {
                            email,
                            password,
                        }
                    );
                    get().setAccessToken(res.data.accessToken);
                    set({
                        user: res.data.user,
                        accessToken: res.data.accessToken,
                        isAuthenticated: true,
                    });
                    setApiToken(res.data.accessToken);
                    localStorage.setItem('hasSession', 'true');
                    const currentState = get();
                    log.debug(`Current user `, {
                        data: currentState.user,
                    });
                    log.debug(
                        `Is authenticated ${currentState.isAuthenticated}`
                    );
                    useSuccessStore.setState({
                        success: 'Registration successful',
                    });
                } catch (error) {
                    log.warn(`Get the general error ${error}`);
                    log.error('Error in registering', {
                        data: { error },
                    });

                    const { setError } = useErrorStore.getState();
                    handleApiError(error, setError);

                    set({ isAuthenticated: false });
                } finally {
                    set({ isLoading: false });
                }
            },
            refresh: async () => {
                set({ isLoading: true });
                localStorage.setItem('hasSession', 'true');

                log.highlight('REFRESH IS TRIGGERED');
                try {
                    const res = await authApi.post('/auth/refresh');
                    get().setAccessToken(res.data.accessToken);
                    set({
                        user: res.data.user,
                        accessToken: res.data.accessToken,
                        isAuthenticated: true,
                    });
                    const currentState = get();
                    log.debug('Access  token from authstore', {
                        data: currentState.accessToken,
                    });
                    log.debug('Current user', { data: currentState.user });
                    log.debug(
                        `Is authenticated ${currentState.isAuthenticated}`
                    );
                    log.info('refresh from backend', { data: { res } });
                } catch (error) {
                    // refresh failed; user stays logged out
                    localStorage.removeItem('hasSession');
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
                try {
                    await authApi.post('/auth/logout');
                } catch (error) {
                    log.error('Error in logout ', { data: { error } });
                }
                setAccessToken(null);
                setApiToken(null);
                set({ user: null, accessToken: null, isAuthenticated: false });
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
            //ONLY PERSIST THESE 2 due to security reasons i removed the accessToken from local storage tho it solved my problem of accessToken persistence
            partialize: (state) => ({
                user: state.user,
                //accessToken: state.accessToken,
                isAuthenticated: state.isAuthenticated,
            }),
            //triggered when local storage is finished loading
            onRehydrateStorage: () => (state) => {
                // When the page loads, immediately try to get a fresh token using the cookie
                /**this approach caused a race condition between the ap.tsx and this store as both want the .refresh()   if (state?.isAuthenticated) {
                    state.refresh();
                }*/

                state?.setHasHydrated(true);
            },
        }
    )
);
