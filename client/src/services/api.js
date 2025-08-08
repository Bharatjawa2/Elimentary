const API_BASE_URL = 'https://elimentary-backend.onrender.com/api';

// Helper function to handle API requests
const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Auth API
export const authAPI = {
  register: (userData) => apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  
  login: (credentials) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  
  getProfile: () => apiRequest('/auth/me'),
  
  updateProfile: (profileData) => apiRequest('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  }),
  
  changePassword: (passwordData) => apiRequest('/auth/change-password', {
    method: 'PUT',
    body: JSON.stringify(passwordData),
  }),
  
  logout: () => apiRequest('/auth/logout', {
    method: 'POST',
  }),
  
  validateToken: () => apiRequest('/auth/validate', {
    method: 'POST',
  }),
};

// Companies API
export const companiesAPI = {
  getAll: () => apiRequest('/companies'),
  
  getById: (id) => apiRequest(`/companies/${id}`),
  
  create: (companyData) => apiRequest('/companies', {
    method: 'POST',
    body: JSON.stringify(companyData),
  }),
  
  update: (id, companyData) => apiRequest(`/companies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(companyData),
  }),
  
  delete: (id) => apiRequest(`/companies/${id}`, {
    method: 'DELETE',
  }),
  
  getHierarchy: (id) => apiRequest(`/companies/${id}/hierarchy`),
  
  getStats: (id) => apiRequest(`/companies/${id}/stats`),
};

// Balance Sheets API
export const balanceSheetsAPI = {
  upload: (formData) => {
    const token = localStorage.getItem('token');
    return fetch(`${API_BASE_URL}/balance-sheets/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }).then(async response => {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }
      return data;
    });
  },
  
  getByCompany: (companyId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/balance-sheets/company/${companyId}?${queryString}`);
  },
  
  getById: (id) => apiRequest(`/balance-sheets/${id}`),
  
  update: (id, data) => apiRequest(`/balance-sheets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  delete: (id) => apiRequest(`/balance-sheets/${id}`, {
    method: 'DELETE',
  }),
  
  getStats: (companyId) => apiRequest(`/balance-sheets/stats/company/${companyId}`),
  
  reprocess: (id) => apiRequest(`/balance-sheets/${id}/reprocess`, {
    method: 'POST',
  }),
};

// Chat API
export const chatAPI = {
  create: (chatData) => apiRequest('/chat', {
    method: 'POST',
    body: JSON.stringify(chatData),
  }),
  
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/chat?${queryString}`);
  },
  
  getById: (id) => apiRequest(`/chat/${id}`),
  
  sendMessage: (id, message) => {
    const token = localStorage.getItem('token');
    return fetch(`${API_BASE_URL}/chat/${id}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message }),
    }).then(async response => {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send message');
      }
      return data;
    });
  },
  
  updateSettings: (id, settings) => apiRequest(`/chat/${id}/settings`, {
    method: 'PUT',
    body: JSON.stringify(settings),
  }),
  
  delete: (id) => apiRequest(`/chat/${id}`, {
    method: 'DELETE',
  }),
  
  getSummary: (id) => apiRequest(`/chat/${id}/summary`),
  
  archive: (id) => apiRequest(`/chat/${id}/archive`, {
    method: 'PUT',
  }),
  
  getAnalytics: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/chat/analytics?${queryString}`);
  },
};

// Analysis API
export const analysisAPI = {
  compare: (data) => apiRequest('/analysis/compare', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  getRatios: (companyId) => apiRequest(`/analysis/ratios/${companyId}`),
  
  getGrowth: (companyId) => apiRequest(`/analysis/growth/${companyId}`),
  
  getRisk: (companyId) => apiRequest(`/analysis/risk/${companyId}`),
  
  getComprehensive: (balanceSheetId) => apiRequest(`/analysis/comprehensive/${balanceSheetId}`),
  
  getBenchmark: (companyId) => apiRequest(`/analysis/benchmark/${companyId}`),
  
  getMetrics: (balanceSheetId) => apiRequest(`/analysis/metrics/${balanceSheetId}`),
};

// Users API
export const usersAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/users?${queryString}`);
  },
  
  getById: (id) => apiRequest(`/users/${id}`),
  
  update: (id, userData) => apiRequest(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  }),
  
  delete: (id) => apiRequest(`/users/${id}`, {
    method: 'DELETE',
  }),
  
  getByCompany: (companyId) => apiRequest(`/users/company/${companyId}`),
  
  getStats: () => apiRequest('/users/stats/overview'),
};

export default {
  auth: authAPI,
  companies: companiesAPI,
  balanceSheets: balanceSheetsAPI,
  chat: chatAPI,
  analysis: analysisAPI,
  users: usersAPI,
};
