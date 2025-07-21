// API Configuration
export const API_CONFIG = {
  TIMEOUT: 30000,
  // BASE_URL: import.meta.env.VITE_BASE_URL,
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL
};

export const FEATURES = {
  ENABLE_AUTH: import.meta.env.VITE_ENABLE_AUTH === 'true',
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
};

// UI Constants
export const UI = {
  HEADER_HEIGHT: 64,
  SIDEBAR_WIDTH: 240,
  TRANSITION_DURATION: 200,
};

// Route Constants
export const ROUTES = {
  HOME: '/',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  DASHBOARD: '/projects',
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK: 'Network error. Please check your connection.',
  GENERAL: 'Something went wrong. Please try again later.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  UPDATE: 'Updated successfully.',
  DELETE: 'Deleted successfully.',
  SAVE: 'Changes saved successfully.',
};