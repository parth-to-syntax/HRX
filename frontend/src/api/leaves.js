import api from './client';

export async function listLeaveTypes() {
  const { data } = await api.get('/leaves/types');
  return data;
}

export async function createLeaveType(payload) {
  const { data } = await api.post('/leaves/types', payload);
  return data;
}

export async function listAllocations({ employee_id, page = 1, pageSize = 20 } = {}) {
  const params = { page, pageSize };
  if (employee_id) params.employee_id = employee_id;
  const { data } = await api.get('/leaves/allocations', { params });
  return data; // { items, page, pageSize, total }
}

export async function createAllocation(payload) {
  const { data } = await api.post('/leaves/allocations', payload);
  return data;
}

export async function listMyAllocations() {
  const { data } = await api.get('/leaves/my-allocations');
  return data;
}

export async function listLeaveRequests(params = {}) {
  const { data } = await api.get('/leaves/requests', { params });
  return data; // { items, page, pageSize, total } or array for employee view if backend differs
}

export async function createLeaveRequest(payload) {
  const { data } = await api.post('/leaves/requests', payload);
  return data;
}

export async function approveLeaveRequest(id) {
  const { data } = await api.patch(`/leaves/requests/${id}/approve`);
  return data;
}

export async function rejectLeaveRequest(id) {
  const { data } = await api.patch(`/leaves/requests/${id}/reject`);
  return data;
}
