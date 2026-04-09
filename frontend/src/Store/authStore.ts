import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { setAccessToken as setApiToken } from '../library/authApi';
import createClientLogger from '../utils/clientLogger';
//remember to change is authenticated in the db and also in the routes
import type { User, AuthResponse, LoginResponse } from '../types/auth';
import authApi, { setAccessToken } from '../library/authApi';
import useSuccessStore from './SuccessStore';
import useErrorStore from './ErrorStore';
import handleApiError from '../utils/apiError';
import type { BackendError, UnknownApiError } from '../types/types';
import type { AuthState } from '../types/auth';
//import NotFound from '../components/NotFound';
const log = createClientLogger('AUTH STORE');

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            accessToken: null,
            isLoading: true,
            notFound: false,
            setNotFound: (state) => set({ notFound: state }),
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
            login: async (email, password) => {
                set({ isLoading: true });
                try {
                    const res = await authApi.post<LoginResponse>(
                        '/auth/login',
                        { email, password }
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
                        success: 'Login  successful',
                    });
                } catch (error) {
                    //const statusCode = error.code;

                    log.warn(`Get the general error ${error}`);
                    log.error('Error in registering', {
                        data: { error },
                    });

                    let serverStatus: number | undefined;
                    let serverData: BackendError | undefined;

                    const potentialError = error as UnknownApiError;

                    // Check if it has the typical Axios response structure
                    if (potentialError?.response) {
                        serverStatus = potentialError.response.status;
                        serverData = potentialError.response.data;
                        const rawData = potentialError.response?.data;
                        serverData =
                            typeof rawData === 'string'
                                ? JSON.parse(rawData)
                                : rawData;
                    }
                    // Check if the error itself has a status (some middlewares do this)
                    else if (potentialError?.status) {
                        serverStatus = potentialError.status;
                        const rawData = potentialError?.data;
                        serverData =
                            typeof rawData === 'string'
                                ? JSON.parse(rawData)
                                : rawData;
                    }

                    log.error('Error in processing files', {
                        data: { serverStatus, serverData },
                    });
                    /*const expiredFlag = log.debug(
                `Is the 403 error being triggered: ${serverStatus === 403 ? 'YES' : 'NO'}`
            );*/
                    log.debug(
                        `What is the server status code: ${serverStatus}`
                    );
                    set({ notFound: true });
                    log.debug(
                        `Does it contain an expired flag: ${potentialError.type}`
                    );

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
