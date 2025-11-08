import api from './client';

export async function loginApi({ login_id, password }) {
  const { data } = await api.post('/auth/login', { login_id, password });
  return data;
}

export async function meApi() {
  const { data } = await api.get('/auth/me');
  return data;
}

export async function firstResetApi({ login_id, temp_password, new_password }) {
  const { data } = await api.post('/auth/first-reset', { login_id, temp_password, new_password });
  return data;
}

export async function forgotPasswordApi({ login_id }) {
  const { data } = await api.post('/auth/forgot', { login_id });
  return data;
}

export async function applyResetApi({ token, new_password }) {
  const { data } = await api.post('/auth/reset', { token, new_password });
  return data;
}

export async function publicSignupApi(payload) {
  const { data } = await api.post('/auth/public-signup', payload);
  return data;
}

export async function logoutApi() {
  const { data } = await api.post('/auth/logout');
  return data;
}

export async function changePasswordApi({ current_password, new_password }) {
  const { data } = await api.post('/auth/change-password', { current_password, new_password });
  return data;
}
