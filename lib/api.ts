import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests dynamically
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auth API
export const authAPI = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  register: (data: any) => 
    api.post('/auth/register', data),
};

// Rooms API
export const roomsAPI = {
  getAll: () => api.get('/rooms'),
  getAvailable: (checkIn?: string, checkOut?: string) => {
    if (checkIn && checkOut) {
      return api.get(`/rooms/available?checkIn=${checkIn}&checkOut=${checkOut}`);
    }
    return api.get('/rooms/available');
  },
  getOne: (id: number) => api.get(`/rooms/${id}`),
  create: (data: FormData) => api.post('/rooms', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id: number, data: FormData) => api.put(`/rooms/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id: number) => api.delete(`/rooms/${id}`),
};

// Bookings API
export const bookingsAPI = {
  getAll: () => api.get('/bookings'),
  getOne: (id: number) => api.get(`/bookings/${id}`),
  getByDateRange: (start: string, end: string) => 
    api.get(`/bookings/date-range?start=${start}&end=${end}`),
  create: (data: any) => api.post('/bookings', data),
  update: (id: number, data: any) => api.put(`/bookings/${id}`, data),
  delete: (id: number) => api.delete(`/bookings/${id}`),
  getMetrics: () => api.get('/bookings/metrics'),
};

// Convention Hall API
export const conventionHallAPI = {
  getAll: () => api.get('/convention-hall'),
  getOne: (id: number) => api.get(`/convention-hall/${id}`),
  create: (data: FormData) => api.post('/convention-hall', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id: number, data: FormData) => api.put(`/convention-hall/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id: number) => api.delete(`/convention-hall/${id}`),
};

// Convention Bookings API
export const conventionBookingsAPI = {
  getAll: () => api.get('/convention-bookings'),
  getOne: (id: number) => api.get(`/convention-bookings/${id}`),
  getByDate: (date: string) => api.get(`/convention-bookings/by-date?date=${date}`),
  getAvailability: (date: string, timeSlot: string) => 
    api.get(`/convention-bookings/availability?date=${date}&timeSlot=${timeSlot}`),
  checkAvailability: (hallId: number, date: string, timeSlot: string) => 
    api.get(`/convention-bookings/check-availability/${hallId}?date=${date}&timeSlot=${timeSlot}`),
  create: (data: any) => api.post('/convention-bookings', data),
  update: (id: number, data: any) => api.put(`/convention-bookings/${id}`, data),
  addPayment: (id: number, data: any) => api.post(`/convention-bookings/${id}/payments`, data),
  delete: (id: number) => api.delete(`/convention-bookings/${id}`),
};

// Hero Slides API
export const heroSlidesAPI = {
  getAll: () => api.get('/hero-slides'),
  getActive: () => api.get('/hero-slides/active'),
  getOne: (id: number) => api.get(`/hero-slides/${id}`),
  create: (data: FormData) => api.post('/hero-slides', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id: number, data: FormData) => api.put(`/hero-slides/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id: number) => api.delete(`/hero-slides/${id}`),
};

// Resort Info API
export const resortInfoAPI = {
  get: () => api.get('/resort-info'),
  update: (data: any) => api.put('/resort-info', data),
};

// Users API
export const usersAPI = {
  getAll: () => api.get('/users'),
  getOne: (id: number) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: number, data: any) => api.put(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
};

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  }
};
