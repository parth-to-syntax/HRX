import api from './client';

export async function createPayrun({ period_month, period_year }) {
  const { data } = await api.post('/payroll/payruns', { period_month, period_year });
  return data;
}

export async function listPayruns({ page = 1, pageSize = 20 } = {}) {
  const { data } = await api.get('/payroll/payruns', { params: { page, pageSize } });
  return data; // { items, page, pageSize, total }
}

export async function getPayrun(id) {
  const { data } = await api.get(`/payroll/payruns/${id}`);
  return data;
}

export async function listPayslipsForPayrun(id, { page = 1, pageSize = 20 } = {}) {
  const { data } = await api.get(`/payroll/payruns/${id}/payslips`, { params: { page, pageSize } });
  return data; // { items, page, pageSize, total }
}

export async function getPayslip(id) {
  const { data } = await api.get(`/payroll/payslips/${id}`);
  return data; // includes absent_days
}

export async function listMyPayslips({ page = 1, pageSize = 20 } = {}) {
  const { data } = await api.get('/payroll/me/payslips', { params: { page, pageSize } });
  return data;
}

export async function validatePayslip(id) {
  const { data } = await api.patch(`/payroll/payslips/${id}/validate`);
  return data;
}

export async function cancelPayslip(id) {
  const { data } = await api.patch(`/payroll/payslips/${id}/cancel`);
  return data;
}

export async function recomputePayslip(id) {
  const { data } = await api.patch(`/payroll/payslips/${id}/recompute`);
  return data;
}

export async function downloadPayslipPdf(id) {
  const res = await api.get(`/payroll/payslips/${id}/pdf`, { responseType: 'blob' });
  return res.data; // blob
}

export async function downloadYearSalaryPdf(employee_id, year) {
  const res = await api.get(`/payroll/employees/${employee_id}/salary-report/pdf`, { params: { year }, responseType: 'blob' });
  return res.data;
}

export async function employerCostReport(year) {
  const { data } = await api.get('/payroll/reports/employer-cost', { params: { year } });
  return data;
}

export async function employeeCountReport(year) {
  const { data } = await api.get('/payroll/reports/employee-count', { params: { year } });
  return data;
}
