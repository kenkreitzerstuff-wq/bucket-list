import '@testing-library/jest-dom';

// Mock API calls for testing
global.fetch = vi.fn();

// Mock environment variables
process.env.VITE_API_URL = 'http://localhost:3001/api';