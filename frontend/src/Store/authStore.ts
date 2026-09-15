import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { setAccessToken as setApiToken } from '../library/authApi';
import createClientLogger from '../utils/clientLogger';
//remember to change is authenticated in the db and also in the routes
import type { AuthState, LoginResponse } from '../types/auth';
import authApi, { setAccessToken } from '../library/authApi';
import useSuccessStore from './SuccessStore';
import useErrorStore from './ErrorStore';
import handleApiError from '../utils/apiError';
import { authClient } from '../lib/auth-client';
//import NotFound from '../components/NotFound';
const log = createClientLogger('AUTH STORE');

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            accessToken: null,
            createdAt: null,
            isLoading: true,
            notFound: false,

            setNotFound: (state) => set({ notFound: state }),

            register: async (name, email, password) => {
                set({ isLoading: true });
                log.highlight('SENDING DATA TO THE BACKEND');
                try {
                    log.info('Data sent to the backend', {
                        data: { email },
                    });
                    const { error } = await authClient.signUp.email({
                        name,
                        email,
                        password,
                        callbackURL: 'http://localhost:5173/',
                    } as Parameters<typeof authClient.signUp.email>[0]);
                    if (error) {
                        const { setError } = useErrorStore.getState();
                        const errorMessage =
                            error.message || 'Error in signup.Please try again';
                        switch (error.code) {
                            case 'USER_ALREADY_EXISTS':
                                setError(
                                    'An account with this email already exists'
                                );
                                break;
                            case 'PASSWORD_TOO_SHORT':
                                setError(
                                    'Password must be at least 8 characters'
                                );
                                break;
                            default:
                                log.error('error in sign up', {
                                    data: { error },
                                });

                                setError(errorMessage);
                        }
                        log.error('Error in registering new user', {
                            data: { error },
                        });
                        handleApiError(error, setError);
                        set({ isAuthenticated: false });
                        return;
                    }

                    set({
                        isAuthenticated: true,
                    });
                    /*useProfileStore
                        .getState()
                        .setProfilePic(res.data.user?.profileImageUrl || null);*/

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
                    const response = await authClient.signIn.email({
                        email,
                        password,
                        rememberMe: true,
                        callbackURL: 'http://localhost:5173/',
                    });
                    const { data, error } = response;
                    if (error) {
                        const { setError } = useErrorStore.getState();
                        const errorMessage =
                            error.message || 'Error in login. Please try again';
                        switch (error.code) {
                            case 'USER_ALREADY_EXISTS':
                                setError(
                                    'An account with this email already exists'
                                );
                                break;
                            case 'PASSWORD_TOO_SHORT':
                                setError(
                                    'Password must be at least 8 characters'
                                );
                                break;
                            default:
                                log.error('Error in login in user', {
                                    data: { error },
                                });

                                setError(errorMessage);
                        }
                        log.error('Error in Login in  user', {
                            data: { error },
                        });
                        handleApiError(error, setError);
                        set({ isAuthenticated: false });
                        return response; // Stop execution - don't set success state
                    }
                    set({
                        user: data?.user,
                        accessToken: data?.token,
                        createdAt: data?.user?.createdAt,

                        isAuthenticated: true,
                    });
                    useSuccessStore.setState({
                        success: 'Login successful',
                    });
                    return response;
                } catch (error) {
                    log.error('Error in login in  user', { data: { error } });
                    const { setError } = useErrorStore.getState();
                    handleApiError(error, setError);
                    set({ isAuthenticated: false });
                    return {
                        data: null,
                        error:
                            error instanceof Error
                                ? error
                                : new Error('Unknown authentication error'),
                    } as unknown as LoginResponse;
                } finally {
                    set({ isLoading: false });
                }
            },

            requestPasswordReset: async (email: string) => {
                try {
                    await authApi.post('/auth/forgot-password', { email });
                } catch (error) {
                    const { setError } = useErrorStore.getState();
                    handleApiError(error, setError);
                }
            },
            resetPassword: async (token: string, password: string) => {
                try {
                    // Send token in the URL and password in the body
                    await authApi.patch(`/auth/reset-password/${token}`, {
                        password,
                    });
                } catch (error) {
                    throw error;
                }
            },
            logout: async () => {
                await authClient.signOut();
                log.warn('User is logged out ');
                set({ isAuthenticated: false });
            },
            deleteAccount: async () => {
                try {
                    await authApi.post('/user/delete-account');
                    setAccessToken(null);
                    setApiToken(null);
                    set({
                        user: null,
                        accessToken: null,
                        isAuthenticated: false,
                        createdAt: null,
                    });
                    localStorage.removeItem('hasSession');
                    localStorage.removeItem('upload-stats');
                    localStorage.removeItem('auth-storage');
                } catch (error) {
                    log.error('Error in deleteAccount', { data: { error } });
                    const { setError } = useErrorStore.getState();
                    handleApiError(error, setError);
                }
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
            //ONLY PERSIST THESE 2 due to security reasons i removed the accessToken from local storage tho it solved my problem of accessToken persistence
            partialize: (state) => ({
                user: state.user,
                createdAt: state.createdAt,
                isAuthenticated: state.isAuthenticated,
            }),
            //triggered when local storage is finished loading
        }
    )
);
