import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock global fetch
(globalThis as any).fetch = vi.fn();

// Set up environment variables for tests
(import.meta as any).env = {
  VITE_API_URL: 'http://localhost:3001/api'
};

// Mock DOM APIs that might be missing in test environment
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: ''
  },
  writable: true
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined)
  }
});

// Mock URL constructor
(globalThis as any).URL = class URL {
  constructor(public href: string, _base?: string) {
    this.searchParams = new URLSearchParams();
  }
  searchParams: URLSearchParams;
  origin = 'http://localhost:3000';
  pathname = '/';
  search = '';
  hash = '';
  toString() {
    return this.href;
  }
};

// Mock URLSearchParams
(globalThis as any).URLSearchParams = class URLSearchParams {
  private params = new Map<string, string>();
  
  get(key: string) {
    return this.params.get(key) || null;
  }
  
  set(key: string, value: string) {
    this.params.set(key, value);
  }
  
  append(key: string, value: string) {
    this.params.set(key, value);
  }
  
  delete(key: string) {
    this.params.delete(key);
  }
  
  toString() {
    const pairs: string[] = [];
    this.params.forEach((value, key) => {
      pairs.push(`${key}=${value}`);
    });
    return pairs.join('&');
  }
};