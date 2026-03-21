import axios from 'axios';
/**importing this access token like this wont be ideal coz it will be stale in the case of an update so we use a getter function defined in the auth api.ts */
import { accessToken } from './authApi';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
const baseURL =
    import.meta.env.MODE === 'development'
        ? 'http://localhost:5000/api'
        : 'https://tidy-up.onrender.com/api';
export const fileCleanerApi = axios.create({
    baseURL,
    timeout: 600000, // 10 minutes for large file uploads
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
});
export const subscriptionApi = axios.create({ baseURL });
export const paystackApi = axios.create({
    baseURL,
});
const attachAuth = (instance: AxiosInstance) => {
    instance.interceptors.request.use((config) => {
        // We use the live 'accessToken' exported from authApi.ts
        if (accessToken && config.headers) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }

        return config;
    });
};
attachAuth(paystackApi);
attachAuth(subscriptionApi);
paystackApi.interceptors.response.use(
    (response) => response,
    (error) => {
        if (
            error.code === 'ERR_NETWORK' ||
            error.code === 'ERR_CONNECTION_REFUSED' ||
            error.message === 'Network Error'
        ) {
            return Promise.reject({
                message:
                    'Unable to connect to the server please try again later',
                status: 503,
                type: 'NetworkError',
            });
        }
        const message =
            error.response?.data?.error.message ||
            error.response?.data.error ||
            error.response?.data.message ||
            'Something went wrong.Please try again';
        return Promise.reject({
            message,
            status: error.response?.status || 500,
            type: error.response?.data?.type || 'Server Error',
        });
    }
);
fileCleanerApi.interceptors.response.use(
    (response) => response,
    (error) => {
        if (
            error.code === 'ERR_NETWORK' ||
            error.code === 'ERR_CONNECTION_REFUSED' ||
            error.message === 'Network Error'
        ) {
            return Promise.reject({
                message:
                    'Unable to connect to the server please try again later',
                status: 503,
                type: 'NetworkError',
            });
        }
        const message =
            error.response?.data?.error.message ||
            error.response?.data.error ||
            error.response?.data.message ||
            'Something went wrong.Please try again';
        return Promise.reject({
            message,
            status: error.response?.status || 500,
            type: error.response?.data?.type || 'Server Error',
        });
    }
);
subscriptionApi.interceptors.response.use(
    (response) => response,
    (error) => {
        if (
            error.code === 'ERR_NETWORK' ||
            error.code === 'ERR_CONNECTION_REFUSED' ||
            error.message === 'Network Error'
        ) {
            return Promise.reject({
                message:
                    'Unable to connect to the server please try again later',
                status: 503,
                type: 'NetworkError',
            });
        }
        const message =
            error.response?.data?.error.message ||
            error.response?.data.error ||
            error.response?.data.message ||
            'Something went wrong.Please try again';
        return Promise.reject({
            message,
            status: error.response?.status || 500,
            type: error.response?.data?.type || 'Server Error',
        });
    }
);
