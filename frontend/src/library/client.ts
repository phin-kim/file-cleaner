import axios from 'axios';
const baseURL =
    import.meta.env.MODE === 'development'
        ? 'http://localhost:5100/api'
        : 'https://tidy-up.onrender.com/api';
export const fileCleanerApi = axios.create({
    baseURL,
    timeout: 600000, // 10 minutes for large file uploads
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
});
export const subscriptionApi = axios.create({ baseURL });
export const authApi = axios.create({ baseURL });
authApi.interceptors.response.use(
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
