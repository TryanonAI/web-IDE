// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  TIMEOUT: 30000,
};

// Feature Flags
export const FEATURES = {
  ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  ENABLE_AUTH: process.env.NEXT_PUBLIC_ENABLE_AUTH === 'true',
};

// UI Constants
export const UI = {
  SIDEBAR_WIDTH: 240,
  HEADER_HEIGHT: 64,
  TRANSITION_DURATION: 200,
};

// Route Constants
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/projects',
  PROFILE: '/profile',
  SETTINGS: '/settings',
};

// Error Messages
export const ERROR_MESSAGES = {
  GENERAL: 'Something went wrong. Please try again later.',
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  SAVE: 'Changes saved successfully.',
  UPDATE: 'Updated successfully.',
  DELETE: 'Deleted successfully.',
}; 