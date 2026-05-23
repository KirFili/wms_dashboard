import api from './api';
import type { LoginRequest, AuthResponse, User } from '../types';

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const form = new URLSearchParams();
  form.append('username', data.username);
  form.append('password', data.password);

  const res = await api.post<AuthResponse>('/auth/login', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return res.data;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

export async function getMe(): Promise<User> {
  const res = await api.get<User>('/auth/me');
  return res.data;
}
