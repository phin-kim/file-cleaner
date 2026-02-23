import axios from 'axios';
const baseURL =
    import.meta.env.MODE === 'development'
        ? 'http://localhost:5000/api'
        : 'https://tidy-up.onrender.com';
export const fileCleanerApi = axios.create({ baseURL });
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
