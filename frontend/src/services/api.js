const API_BASE_URL = 'http://localhost:3001/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('accessToken');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    };

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        // Token expirado, tentar refresh
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Tentar novamente com o novo token
          config.headers.Authorization = `Bearer ${this.token}`;
          const retryResponse = await fetch(url, config);
          if (!retryResponse.ok) {
            throw new Error(`HTTP error! status: ${retryResponse.status}`);
          }
          return await retryResponse.json();
        } else {
          // Redirect para login
          this.setToken(null);
          window.location.href = '/login';
          return;
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async refreshToken() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        this.setToken(data.accessToken);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  // Auth endpoints
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    this.setToken(data.accessToken);
    return data;
  }

  async register(userData) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: userData,
    });
    this.setToken(data.accessToken);
    return data;
  }

  async logout() {
    await this.request('/auth/logout', { method: 'POST' });
    this.setToken(null);
  }

  async getMe() {
    return this.request('/auth/me');
  }

  // Dashboard endpoints
  async getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  async getRecentActivity() {
    return this.request('/dashboard/activity');
  }

  // Hardware endpoints
  async getHardware() {
    return this.request('/hardware');
  }

  async getHardwareById(id) {
    return this.request(`/hardware/${id}`);
  }

  async createHardware(data) {
    return this.request('/hardware', {
      method: 'POST',
      body: data,
    });
  }

  async updateHardware(id, data) {
    return this.request(`/hardware/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteHardware(id) {
    return this.request(`/hardware/${id}`, {
      method: 'DELETE',
    });
  }

  // User endpoints
  async getUsers() {
    return this.request('/users');
  }

  async getUserById(id) {
    return this.request(`/users/${id}`);
  }

  async createUser(data) {
    return this.request('/users', {
      method: 'POST',
      body: data,
    });
  }

  async updateUser(id, data) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteUser(id) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Vendor endpoints
  async getVendors() {
    return this.request('/vendors');
  }

  async getVendorById(id) {
    return this.request(`/vendors/${id}`);
  }

  async createVendor(data) {
    return this.request('/vendors', {
      method: 'POST',
      body: data,
    });
  }

  async updateVendor(id, data) {
    return this.request(`/vendors/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteVendor(id) {
    return this.request(`/vendors/${id}`, {
      method: 'DELETE',
    });
  }

  // Chat endpoints
  async sendChatMessage(message) {
    return this.request('/chat', {
      method: 'POST',
      body: { message },
    });
  }
}

export const apiService = new ApiService();
export default apiService;

