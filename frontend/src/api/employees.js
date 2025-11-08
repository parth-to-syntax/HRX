import api from './client';

export async function listEmployees({ page = 1, pageSize = 20 } = {}) {
  const { data } = await api.get('/employees', { params: { page, pageSize } });
  return data; // { items, page, pageSize, total }
}

export async function getEmployee(id) {
  const { data } = await api.get(`/employees/${id}`);
  return data;
}

export async function getMyProfile() {
  const { data } = await api.get('/employees/me');
  return data;
}

export async function updateMyProfile(payload) {
  const { data } = await api.patch('/employees/me/private', payload);
  return data;
}

export async function listMySkills() {
  const { data } = await api.get('/employees/me/skills');
  return data;
}

export async function getMyPrivateInfo() {
  const { data } = await api.get('/employees/me/private-info');
  return data; // { personal:{...}, bank:{...}|null }
}

export async function updateMyPrivateInfo(payload) {
  const { data } = await api.patch('/employees/me/private-info', payload);
  return data; // { message, personal, bank }
}

export async function addMySkill(skill) {
  const { data } = await api.post('/employees/me/skills', { skill });
  return data;
}

export async function deleteMySkill(id) {
  const { data } = await api.delete(`/employees/me/skills/${id}`);
  return data;
}

export async function listMyCerts() {
  const { data } = await api.get('/employees/me/certifications');
  return data;
}

export async function addMyCert(payload) {
  const { data } = await api.post('/employees/me/certifications', payload);
  return data;
}

export async function updateMyCert(id, payload) {
  const { data } = await api.patch(`/employees/me/certifications/${id}`, payload);
  return data;
}

export async function deleteMyCert(id) {
  const { data } = await api.delete(`/employees/me/certifications/${id}`);
  return data;
}
