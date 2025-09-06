import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
});

// Function to get access token from client-side
const getClientAccessToken = async () => {
  try {
    const response = await fetch('/api/auth/token');
    const data = await response.json();
    return data.accessToken;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
};

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const accessToken = await getClientAccessToken();
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    } catch (error) {
      console.error('Error getting access token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login on unauthorized
      window.location.href = '/api/auth/login';
    }
    return Promise.reject(error);
  }
);

export interface UserProfile {
  sub: string;
  name: string;
  email: string;
  phone_number: string;
  picture: string;
}

export interface Device {
  device_id: string;
  device_info: string;
  login_time: string;
  last_activity: string;
}

export interface LoginResponse {
  success: boolean;
  device_id: string;
  message: string;
  active_devices: number;
  devices?: Device[];
}

export interface DeviceCheckResponse {
  device_id: string;
  is_active: boolean;
}

// API functions
export const apiClient = {
  // User profile
  getUserProfile: async (): Promise<UserProfile> => {
    const response = await api.get('/api/user/profile');
    return response.data;
  },

  // Device management
  loginDevice: async (deviceInfo: string, deviceId?: string): Promise<LoginResponse> => {
    const response = await api.post('/api/auth/login', {
      device_info: deviceInfo,
      device_id: deviceId
    });
    return response.data;
  },

  forceLogoutDevice: async (targetDeviceId: string, currentDeviceId: string) => {
    const response = await api.post('/api/auth/force-logout', {
      target_device_id: targetDeviceId,
      current_device_id: currentDeviceId
    });
    return response.data;
  },

  logoutDevice: async (deviceId: string) => {
    const response = await api.post('/api/auth/logout', null, {
      params: { device_id: deviceId }
    });
    return response.data;
  },

  getActiveDevices: async (): Promise<{ devices: Device[] }> => {
    const response = await api.get('/api/devices/active');
    return response.data;
  },

  checkDeviceStatus: async (deviceId: string): Promise<DeviceCheckResponse> => {
    const response = await api.get(`/api/devices/check/${deviceId}`);
    return response.data;
  }
};

export default api;
