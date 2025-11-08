import api from './client'

export async function listUsers() {
  const { data } = await api.get('/admin/users')
  return data // [{ id, name, email, role }]
}

export async function getAccessRights() {
  const { data } = await api.get('/admin/access-rights')
  return data // { admin:{}, hr:{}, payroll:{}, employee:{} }
}

// entries: [{ role, module, permissions }]
export async function upsertAccessRights(entries) {
  const { data } = await api.post('/admin/access-rights', entries)
  return data
}

export async function updateUserRole(userId, role) {
  const { data } = await api.patch(`/admin/users/${userId}/role`, { role })
  return data // { id, role }
}
