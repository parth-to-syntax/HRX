import api from './client';

export async function checkIn(date) {
  const params = date ? { date } : {};
  const { data } = await api.post('/attendance/me/check-in', null, { params });
  return data;
}

export async function checkOut(date) {
  const params = date ? { date } : {};
  const { data } = await api.post('/attendance/me/check-out', null, { params });
  return data;
}

export async function getMyAttendance({ from, to }) {
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const { data } = await api.get('/attendance/me', { params });
  return data; // { from, to, summary, days }
}

export async function listAttendanceByDate({ date, page = 1, pageSize = 50 }) {
  const { data } = await api.get('/attendance', { params: { date, page, pageSize } });
  return data; // { date, items, page, pageSize, total }
}

export async function markAbsents({ date }) {
  const { data } = await api.post('/attendance/mark-absents', null, { params: { date } });
  return data;
}
