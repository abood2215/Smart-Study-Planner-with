// API Configuration for Smart Study Planner
const API_CONFIG = {
    BASE_URL: 'http://localhost/Smart-Study-Planner-with/api',

    // Helper to get stored token
    getToken: function() {
        return localStorage.getItem('auth_token');
    },

    // Helper to set token
    setToken: function(token) {
        localStorage.setItem('auth_token', token);
    },

    // Helper to remove token
    removeToken: function() {
        localStorage.removeItem('auth_token');
    },

    // Helper to get current user
    getUser: function() {
        const userStr = localStorage.getItem('current_user');
        return userStr ? JSON.parse(userStr) : null;
    },

    // Helper to set current user
    setUser: function(user) {
        localStorage.setItem('current_user', JSON.stringify(user));
    },

    // Helper to make authenticated requests
    fetch: async function(endpoint, options = {}) {
        const token = this.getToken();

        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options.headers
            }
        };

        try {
            const response = await fetch(`${this.BASE_URL}${endpoint}`, config);
            const data = await response.json();

            // If unauthorized, redirect to login
            if (response.status === 401) {
                this.removeToken();
                window.location.href = '/Smart-Study-Planner-with/login.html';
                return null;
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
};

// Make it globally available
window.API_CONFIG = API_CONFIG;
