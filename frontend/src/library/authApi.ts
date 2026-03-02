import type {
    AxiosError,
    AxiosInstance,
    InternalAxiosRequestConfig,
} from 'axios';
import axios from 'axios';
import createClientLogger from '../utils/clientLogger';
const log = createClientLogger('Auth api');
const baseURL =
    import.meta.env.MODE === 'development'
        ? 'http://localhost:5000/api'
        : 'https://tidy-up.onrender.com/api';
interface QueuedRequest {
    resolve: (value: string | null) => void;
    reject: (reason?: AxiosError) => void;
    config: InternalAxiosRequestConfig;
}
let failedQueue: QueuedRequest[] = [];
let accessToken: string | null = null;
let isRefreshing = false;
const authApi: AxiosInstance = axios.create({
    baseURL,
});
//
/**
 * Attach access token to request
 * Centralized authentication: Instead of manually adding the token to every API call, this does it automatically
 * This attaches a function that runs BEFORE every request made with this Axios instance (authApi)
 */
authApi.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        if (accessToken && config.headers) {
            config.headers.Authorization = `Bearer ${accessToken} `;
        }
        return config;
    },
    (error) => Promise.reject(error)
);
authApi.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as
            | (InternalAxiosRequestConfig & { _retry?: boolean })
            | undefined;
        //this stores the failed request
        //don't retry if already retried
        if (!originalRequest || originalRequest._retry) {
            return Promise.reject(error);
        }
        //skip refresh endpoint itself this prevents a refresh loop
        if (originalRequest.url?.includes('/auth/refresh')) {
            return Promise.reject(error);
        }
        if (error.response?.status === 401) {
            originalRequest._retry = true;
            //CASE 1:refresh is  already in progress
            if (isRefreshing) {
                return new Promise<string>((resolve, reject) => {
                    failedQueue.push({
                        resolve: (token) => resolve(token!),
                        reject,
                        config: originalRequest,
                    });
                })
                    .then((token) => {
                        originalRequest.headers = originalRequest.headers || {};
                        originalRequest.headers['Authorization'] =
                            `Bearer ${token}`;
                        return authApi(originalRequest);
                    })
                    .catch((error) => Promise.reject(error));
            }
            isRefreshing = true;
            try {
                const refreshResponse = await authApi.post<{
                    accessToken: string;
                }>('/auth/refresh');
                const newToken = refreshResponse.data.accessToken;
                setAccessToken(newToken);
                processQueue(null, newToken);

                originalRequest.headers = originalRequest.headers || {};
                originalRequest.headers['Authorization'] = `Bearer ${newToken}`;

                return authApi(originalRequest);
            } catch (refreshError) {
                log.error('Error in refresh que', { data: refreshError });
                const error = refreshError as AxiosError;
                processQueue(error, null);
                setAccessToken(null); //clear invalid tokens
                // TODO: Implement logout/clear auth state
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    }
);
//setAccess token used by auth context{zustand}
export function setAccessToken(token: string | null) {
    accessToken = token;
}
function processQueue(error: AxiosError | null, token: string | null = null) {
    failedQueue.forEach(({ resolve, reject, config }) => {
        if (error) {
            reject(error);
        } else if (token !== null) {
            config.headers = config.headers || {};
            config.headers['Authorization'] = `Bearer ${token}`;
            resolve(token);
        }
    });
    failedQueue = [];
}
export default authApi;
