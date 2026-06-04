import axios from 'axios';
import { GATEWAY_URL } from '../config';

export const apiClient = axios.create({
  baseURL: GATEWAY_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor to format error messages
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'An unexpected error occurred.';
    if (error.response) {
      if (error.response.data && error.response.data.error) {
        message = error.response.data.error;
      } else if (typeof error.response.data === 'string') {
        message = error.response.data;
      } else {
        message = `${error.response.status}: ${error.response.statusText}`;
      }
    } else if (error.request) {
      message = 'No response received from authentication service.';
    } else {
      message = error.message;
    }
    return Promise.reject(new Error(message));
  }
);
