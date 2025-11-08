export const DEFAULT_RIGHTS = {
  admin: {
    employees: { view: true, create: true, update: true, delete: true },
    salary: { view: true, create: true, update: true, delete: true },
    attendance: { view: true, create: true, update: true, delete: true },
    leaves: { view: true, create: true, update: true, delete: true },
    payroll: { view: true, create: true, update: true, delete: true },
    settings: { view: true, manage: true }
  },
  hr: {
    employees: { view: true, create: true, update: true, delete: false },
    salary: { view: true, create: true, update: true, delete: false },
    attendance: { view: true, create: true, update: true, delete: false },
    // HR manages leave allocations/types (create), but approvals are payroll (update)
    leaves: { view: true, create: true },
    payroll: { view: false },
    settings: { view: false }
  },
  payroll: {
    employees: { view: true },
    salary: { view: true, update: true },
    attendance: { view: true },
    // Payroll can approve/reject (update)
    leaves: { view: true, update: true },
    payroll: { view: true, create: true, update: true },
    settings: { view: false }
  },
  employee: {
    employees: { view: true },
    salary: { view: true },
    attendance: { view: true },
    leaves: { view: true, create: true },
    payroll: { view: true },
    settings: { view: false }
  }
};

export async function hasPermission(pool, companyId, role, module, action) {
  // Load specific permission if configured; otherwise fall back to defaults
  try {
    const { rows } = await pool.query(
      'SELECT permissions FROM access_rights WHERE company_id=$1 AND role=$2 AND module=$3',
      [companyId, role, module]
    );
    const perms = rows.length ? rows[0].permissions : (DEFAULT_RIGHTS[role]?.[module] || {});
    return !!perms?.[action];
  } catch (_) {
    // On error, be safe and deny (or default allow for admin). We'll default to defaults map.
    const perms = DEFAULT_RIGHTS[role]?.[module] || {};
    return !!perms?.[action];
  }
}
