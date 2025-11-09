// import { pool } from '../db.js';

// const DEFAULT_EXPECTED_DAILY_HOURS = Number(process.env.EXPECTED_DAILY_HOURS || 8);

// async function getEmployeeByUser(userId) {
//   const { rows } = await pool.query('SELECT id, company_id FROM employees WHERE user_id=$1 LIMIT 1', [userId]);
//   return rows.length ? rows[0] : null;
// }

// function toDateOnly(d) {
//   // expects YYYY-MM-DD or Date; returns YYYY-MM-DD
//   if (!d) return null;
//   if (typeof d === 'string') return d.slice(0, 10);
//   return new Date(d).toISOString().slice(0, 10);
// }

// function hoursBetween(start, end, breakHours = 0) {
//   if (!start || !end) return null;
//   const ms = new Date(end).getTime() - new Date(start).getTime();
//   const hrs = ms / 36e5 - Number(breakHours || 0);
//   return Math.max(0, Math.round(hrs * 100) / 100);
// }

// export async function checkInMe(req, res) {
//   try {
//     const emp = await getEmployeeByUser(req.user.id);
//     if (!emp) return res.status(404).json({ error: 'Employee profile not found' });
    
//     // Get date from query params or use current date
//     const targetDate = req.query.date ? toDateOnly(req.query.date) : toDateOnly(new Date());
    
//     console.log('checkInMe - Employee:', emp.id, 'Target date:', targetDate);
    
//     // Check if it's a weekday (Mon-Fri)
//     const dateObj = new Date(targetDate + 'T00:00:00Z'); // Force UTC to avoid timezone issues
//     const dayOfWeek = dateObj.getUTCDay();
//     if (dayOfWeek === 0 || dayOfWeek === 6) {
//       return res.status(400).json({ error: 'Cannot check in on weekends (Saturday/Sunday)' });
//     }
    
//     // Check if employee has approved leave for this date
//     const existing = await pool.query(
//       'SELECT id, check_in, status FROM attendance WHERE employee_id=$1 AND date = $2',
//       [emp.id, targetDate]
//     );
    
//     console.log('checkInMe - Existing record check:', existing.rowCount, existing.rows[0]);
    
//     if (existing.rowCount && existing.rows[0].status === 'leave') {
//       return res.status(400).json({ error: 'Cannot check in on a day with approved leave' });
//     }
    
//     if (existing.rowCount && existing.rows[0].check_in) {
//       // If already checked in, return the existing record
//       const { rows } = await pool.query('SELECT * FROM attendance WHERE id=$1', [existing.rows[0].id]);
//       console.log('checkInMe - Already checked in, returning existing record:', rows[0]);
//       return res.json(rows[0]);
//     }
    
//     if (existing.rowCount) {
//       // Update existing record - clear check_out and other calculated fields when checking in
//       const { rows } = await pool.query(
//         `UPDATE attendance 
//          SET check_in = NOW(), 
//              check_out = NULL, 
//              work_hours = NULL, 
//              extra_hours = NULL, 
//              break_hours = NULL,
//              status = 'present' 
//          WHERE id=$1 
//          RETURNING *`,
//         [existing.rows[0].id]
//       );
//       console.log('checkInMe - Updated existing record:', rows[0]);
//       return res.json(rows[0]);
//     }
//     const { rows } = await pool.query(
//       "INSERT INTO attendance (employee_id, date, check_in, status) VALUES ($1, $2::date, NOW(), 'present') RETURNING *",
//       [emp.id, targetDate]
//     );
//     console.log('checkInMe - Created new record:', JSON.stringify(rows[0], null, 2));
//     console.log('checkInMe - check_in value:', rows[0].check_in);
//     console.log('checkInMe - check_out value:', rows[0].check_out);
//     console.log('checkInMe - work_hours value:', rows[0].work_hours);
//     res.status(201).json(rows[0]);
//   } catch (e) {
//     console.error('checkInMe ERROR:', e);
//     res.status(500).json({ error: 'Failed to check in' });
//   }
// }

// export async function checkOutMe(req, res) {
//   try {
//     const emp = await getEmployeeByUser(req.user.id);
//     if (!emp) return res.status(404).json({ error: 'Employee profile not found' });
    
//     // Get date from query params or use current date
//     const targetDate = req.query.date ? toDateOnly(req.query.date) : toDateOnly(new Date());
    
//     console.log('checkOutMe - Employee:', emp.id, 'Target date:', targetDate);
    
//     // Check if it's a weekday (Mon-Fri)
//     const dateObj = new Date(targetDate + 'T00:00:00Z'); // Force UTC to avoid timezone issues
//     const dayOfWeek = dateObj.getUTCDay();
//     if (dayOfWeek === 0 || dayOfWeek === 6) {
//       return res.status(400).json({ error: 'Cannot check out on weekends (Saturday/Sunday)' });
//     }
    
//     const todayQ = await pool.query('SELECT * FROM attendance WHERE employee_id=$1 AND date = $2', [emp.id, targetDate]);
//     if (!todayQ.rowCount) return res.status(400).json({ error: 'No check-in found for this date' });
//     const att = todayQ.rows[0];
    
//     console.log('checkOutMe - Found attendance record:', att);
    
//     // Prevent checkout if on approved leave
//     if (att.status === 'leave') {
//       return res.status(400).json({ error: 'Cannot check out on a day with approved leave' });
//     }
    
//     if (!att.check_in) return res.status(400).json({ error: 'No check-in found' });
//     if (att.check_out) {
//       console.log('checkOutMe - Already checked out, returning existing record');
//       return res.json(att); // idempotent
//     }

//     // Fixed calculation: 1 hour break, 8 hours expected, overtime for > 8 hours
//     const breakHours = 1; // Fixed 1-hour break
//     const checkOut = new Date();
//     const workHours = hoursBetween(att.check_in, checkOut, breakHours);
//     const expectedHours = 8; // 8 hours expected work day
//     const extraHours = workHours != null ? Math.max(0, Math.round((workHours - expectedHours) * 100) / 100) : null;
    
//     console.log('checkOutMe - Time calculations:', {
//       check_in: att.check_in,
//       check_out: checkOut,
//       total_time: hoursBetween(att.check_in, checkOut, 0),
//       break_hours: breakHours,
//       work_hours: workHours,
//       expected_hours: expectedHours,
//       extra_hours: extraHours
//     });
    
//     const { rows } = await pool.query(
//       'UPDATE attendance SET check_out=$1, break_hours=$2, work_hours=$3, extra_hours=$4 WHERE id=$5 RETURNING *',
//       [checkOut, breakHours, workHours, extraHours, att.id]
//     );
//     console.log('checkOutMe - Updated record with checkout:', rows[0]);
//     res.json(rows[0]);
//   } catch (e) {
//     console.error('checkOutMe ERROR:', e);
//     res.status(500).json({ error: 'Failed to check out' });
//   }
// }

// export async function getMyAttendance(req, res) {
//   try {
//     const emp = await getEmployeeByUser(req.user.id);
//     if (!emp) return res.status(404).json({ error: 'Employee profile not found' });
//     const from = toDateOnly(req.query.from) || toDateOnly(new Date());
//     const to = toDateOnly(req.query.to) || from;
    
//     console.log('getMyAttendance - Query params:', { employee_id: emp.id, from, to });
    
//     const { rows } = await pool.query(
//       `SELECT 
//          date,
//          check_in, 
//          check_out, 
//          work_hours, 
//          extra_hours, 
//          status,
//          break_hours
//        FROM attendance 
//        WHERE employee_id=$1 AND date BETWEEN $2 AND $3
//        ORDER BY date ASC`,
//       [emp.id, from, to]
//     );
    
//     console.log('getMyAttendance - DB rows count:', rows.length);
//     if (rows.length > 0) {
//       console.log('getMyAttendance - First row:', rows[0]);
//     }
    
//     // Check if this is a single-day query (e.g., fetching today's status)
//     const isSingleDay = from === to;
    
//     // Generate all weekdays (Mon-Fri) in the date range
//     const allDays = [];
//     // Create map using date column - ensure we use string format for consistent comparison
//     const attendanceMap = new Map(
//       rows.map(r => {
//         const dateStr = toDateOnly(r.date);
//         console.log('Mapping attendance record:', { 
//           dateStr, 
//           status: r.status, 
//           check_in: r.check_in,
//           check_out: r.check_out,
//           work_hours: r.work_hours
//         });
//         return [dateStr, r];
//       })
//     );
    
//     console.log('Attendance map size:', attendanceMap.size);
//     console.log('Attendance map keys:', Array.from(attendanceMap.keys()));
    
//     let currentDate = new Date(from);
//     const endDate = new Date(to);
    
//     while (currentDate <= endDate) {
//       const dayOfWeek = currentDate.getDay(); // 0=Sunday, 6=Saturday
//       const dateStr = toDateOnly(currentDate);
//       const existingRecord = attendanceMap.get(dateStr);
      
//       console.log('Processing date:', { dateStr, dayOfWeek, hasRecord: !!existingRecord, status: existingRecord?.status });
      
//       // For single-day queries, include all days (even weekends) to support check-in/out on any day
//       // For multi-day queries, only include weekdays (Mon-Fri)
//       const shouldInclude = isSingleDay || (dayOfWeek >= 1 && dayOfWeek <= 5);
      
//       if (shouldInclude) {
//         if (existingRecord) {
//           allDays.push(existingRecord);
//         } else {
//           // No record = absent for weekdays
//           allDays.push({
//             date: new Date(dateStr),
//             check_in: null,
//             check_out: null,
//             work_hours: null,
//             extra_hours: null,
//             status: 'absent'
//           });
//         }
//       }
//       currentDate.setDate(currentDate.getDate() + 1);
//     }
    
//     // summary - only count weekdays for summary stats
//     const weekdaysOnly = allDays.filter(day => {
//       const dayOfWeek = new Date(day.date).getDay();
//       return dayOfWeek >= 1 && dayOfWeek <= 5;
//     });
//     const present = weekdaysOnly.filter(r => r.status === 'present').length;
//     const leave = weekdaysOnly.filter(r => r.status === 'leave').length;
//     const absent = weekdaysOnly.filter(r => r.status === 'absent').length;
//     const total_working_days = weekdaysOnly.length; // Total weekdays in range
    
//     console.log('Final result:', { 
//       totalDays: allDays.length, 
//       weekdaysOnly: weekdaysOnly.length,
//       summary: { present, leave, absent, total_working_days },
//       firstDay: allDays[0],
//       lastDay: allDays[allDays.length - 1]
//     });
    
//     res.json({ 
//       from, 
//       to, 
//       summary: { present_days: present, leave_days: leave, absent_days: absent, total_working_days }, 
//       days: allDays 
//     });
//   } catch (e) {
//     console.error(e);
//     res.status(500).json({ error: 'Failed to fetch attendance' });
//   }
// }

// export async function listAttendanceByDate(req, res) {
//   try {
//     const companyId = req.user.company_id;
//     const role = req.user.role;
//     if (!['admin','hr'].includes(role)) return res.status(403).json({ error: 'Forbidden' });
//     const date = toDateOnly(req.query.date) || toDateOnly(new Date());
//     const page = Math.max(1, parseInt(req.query.page || '1', 10));
//     const pageSize = Math.min(200, Math.max(1, parseInt(req.query.pageSize || '50', 10)));
//     const offset = (page - 1) * pageSize;
//     const countQ = await pool.query('SELECT COUNT(*)::int AS c FROM employees e WHERE e.company_id=$1', [companyId]);
//     const total = countQ.rows[0].c;
//     // Left join to include employees without attendance row yet
//     const q = await pool.query(
//       `SELECT e.id as employee_id, e.first_name, e.last_name, a.id as attendance_id, a.check_in, a.check_out, a.work_hours, a.extra_hours, a.status
//          FROM employees e
//          LEFT JOIN attendance a ON a.employee_id = e.id AND a.date = $1
//         WHERE e.company_id = $2
//         ORDER BY e.first_name ASC, e.last_name ASC
//         LIMIT $3 OFFSET $4`,
//       [date, companyId, pageSize, offset]
//     );
//     res.json({ date, items: q.rows, page, pageSize, total });
//   } catch (e) {
//     console.error(e);
//     res.status(500).json({ error: 'Failed to list attendance' });
//   }
// }

// // Admin/HR: mark absents for a date for employees with no attendance AND no approved leave
// export async function markAbsentsForDate(req, res) {
//   try {
//     const companyId = req.user.company_id;
//     const role = req.user.role;
//     if (!['admin','hr'].includes(role)) return res.status(403).json({ error: 'Forbidden' });
//     const date = toDateOnly(req.query.date) || toDateOnly(new Date());
//     // Employees without attendance on date and not on approved leave for date
//     const empQ = await pool.query(
//       `SELECT e.id
//          FROM employees e
//          LEFT JOIN attendance a ON a.employee_id=e.id AND a.date=$1
//          LEFT JOIN leave_requests lr ON lr.employee_id=e.id AND lr.status='approved' AND lr.start_date <= $1 AND lr.end_date >= $1
//         WHERE e.company_id=$2 AND a.id IS NULL AND lr.id IS NULL`,
//       [date, companyId]
//     );
//     let inserted = 0;
//     for (const r of empQ.rows) {
//       await pool.query("INSERT INTO attendance (employee_id, date, status, work_hours, break_hours, extra_hours) VALUES ($1,$2,'absent',0,0,0)", [r.id, date]);
//       inserted++;
//     }
//     res.json({ date, marked_absent: inserted });
//   } catch (e) {
//     console.error(e);
//     res.status(500).json({ error: 'Failed to mark absents' });
//   }
// }
import { pool } from '../db.js';

const DEFAULT_EXPECTED_DAILY_HOURS = Number(process.env.EXPECTED_DAILY_HOURS || 8);

async function getEmployeeByUser(userId) {
  const { rows } = await pool.query('SELECT id, company_id FROM employees WHERE user_id=$1 LIMIT 1', [userId]);
  return rows.length ? rows[0] : null;
}

function toDateOnly(d) {
  // expects YYYY-MM-DD or Date; returns YYYY-MM-DD
  if (!d) return null;
  if (typeof d === 'string') return d.slice(0, 10);
  return new Date(d).toISOString().slice(0, 10);
}

function hoursBetween(start, end, breakHours = 0) {
  if (!start || !end) return null;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const hrs = ms / 36e5 - Number(breakHours || 0);
  return Math.max(0, Math.round(hrs * 100) / 100);
}

export async function checkInMe(req, res) {
  try {
    const emp = await getEmployeeByUser(req.user.id);
    if (!emp) return res.status(404).json({ error: 'Employee profile not found' });
    
    // Get date from query params or use current date
    const targetDate = req.query.date ? toDateOnly(req.query.date) : toDateOnly(new Date());
    
    console.log('checkInMe - Employee:', emp.id, 'Target date:', targetDate);
    
    // Check if it's a weekday (Mon-Fri)
    const dateObj = new Date(targetDate);
    const dayOfWeek = dateObj.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return res.status(400).json({ error: 'Cannot check in on weekends (Saturday/Sunday)' });
    }
    
    // Check if employee has approved leave for this date
    const existing = await pool.query(
      'SELECT id, check_in, status FROM attendance WHERE employee_id=$1 AND date = $2',
      [emp.id, targetDate]
    );
    
    if (existing.rowCount && existing.rows[0].status === 'leave') {
      return res.status(400).json({ error: 'Cannot check in on a day with approved leave' });
    }
    
    if (existing.rowCount && existing.rows[0].check_in) {
      // idempotent: already checked in
      const { rows } = await pool.query('SELECT * FROM attendance WHERE id=$1', [existing.rows[0].id]);
      return res.json(rows[0]);
    }
    if (existing.rowCount) {
      // Update existing record (even if absent) to present with check-in time
      const { rows } = await pool.query(
        "UPDATE attendance SET check_in = NOW(), status = 'present' WHERE id=$1 RETURNING *",
        [existing.rows[0].id]
      );
      console.log('checkInMe - Updated existing record from', existing.rows[0].status, 'to present:', rows[0]);
      return res.json(rows[0]);
    }
    const { rows } = await pool.query(
      "INSERT INTO attendance (employee_id, date, check_in, status) VALUES ($1, $2, NOW(), 'present') RETURNING *",
      [emp.id, targetDate]
    );
    console.log('checkInMe - Created new record:', rows[0]);
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to check in' });
  }
}

export async function checkOutMe(req, res) {
  try {
    const emp = await getEmployeeByUser(req.user.id);
    if (!emp) return res.status(404).json({ error: 'Employee profile not found' });
    
    // Get date from query params or use current date
    const targetDate = req.query.date ? toDateOnly(req.query.date) : toDateOnly(new Date());
    
    // Check if it's a weekday (Mon-Fri)
    const dateObj = new Date(targetDate);
    const dayOfWeek = dateObj.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return res.status(400).json({ error: 'Cannot check out on weekends (Saturday/Sunday)' });
    }
    
    const todayQ = await pool.query('SELECT * FROM attendance WHERE employee_id=$1 AND date = $2', [emp.id, targetDate]);
    if (!todayQ.rowCount) return res.status(400).json({ error: 'No check-in found for this date' });
    const att = todayQ.rows[0];
    
    // Prevent checkout if on approved leave
    if (att.status === 'leave') {
      return res.status(400).json({ error: 'Cannot check out on a day with approved leave' });
    }
    
    if (!att.check_in) return res.status(400).json({ error: 'No check-in found' });
    if (att.check_out) return res.json(att); // idempotent

    // derive break_hours default from salary_structure; fallback 0
    const salQ = await pool.query('SELECT break_hours FROM salary_structure WHERE employee_id=$1', [emp.id]);
    const breakHours = salQ.rowCount ? Number(salQ.rows[0].break_hours || 0) : 0;
    const checkOut = new Date();
    const workHours = hoursBetween(att.check_in, checkOut, breakHours);
    const expected = DEFAULT_EXPECTED_DAILY_HOURS;
    const extraHours = workHours != null ? Math.max(0, Math.round((workHours - expected) * 100) / 100) : null;
    const { rows } = await pool.query(
      'UPDATE attendance SET check_out=$1, break_hours=$2, work_hours=$3, extra_hours=$4 WHERE id=$5 RETURNING *',
      [checkOut, breakHours, workHours, extraHours, att.id]
    );
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to check out' });
  }
}

export async function getMyAttendance(req, res) {
  try {
    const emp = await getEmployeeByUser(req.user.id);
    if (!emp) return res.status(404).json({ error: 'Employee profile not found' });
    const from = toDateOnly(req.query.from) || toDateOnly(new Date());
    const to = toDateOnly(req.query.to) || from;
    
    console.log('getMyAttendance - Query params:', { employee_id: emp.id, from, to });
    
    const { rows } = await pool.query(
      `SELECT 
         date::TEXT as date_str,
         date,
         check_in, 
         check_out, 
         work_hours, 
         extra_hours, 
         status
       FROM attendance 
       WHERE employee_id=$1 AND date BETWEEN $2 AND $3
       ORDER BY date ASC`,
      [emp.id, from, to]
    );
    
    console.log('getMyAttendance - DB rows:', rows);
    
    // Check if this is a single-day query (e.g., fetching today's status)
    const isSingleDay = from === to;
    
    // Generate all weekdays (Mon-Fri) in the date range
    const allDays = [];
    // Create map using the date_str column which is the actual date without timezone issues
    const attendanceMap = new Map(
      rows.map(r => {
        console.log('Mapping attendance record:', { dateStr: r.date_str, record: r });
        return [r.date_str, r];
      })
    );
    
    console.log('Attendance map keys:', Array.from(attendanceMap.keys()));
    
    let currentDate = new Date(from);
    const endDate = new Date(to);
    
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay(); // 0=Sunday, 6=Saturday
      const dateStr = currentDate.toISOString().split('T')[0];
      const existingRecord = attendanceMap.get(dateStr);
      
      console.log('Processing date:', { dateStr, dayOfWeek, hasRecord: !!existingRecord });
      
      // For single-day queries, include all days (even weekends) to support check-in/out on any day
      // For multi-day queries, only include weekdays (Mon-Fri)
      const shouldInclude = isSingleDay || (dayOfWeek >= 1 && dayOfWeek <= 5);
      
      if (shouldInclude) {
        if (existingRecord) {
          allDays.push(existingRecord);
        } else {
          // No record = absent for weekdays
          allDays.push({
            date: new Date(dateStr),
            check_in: null,
            check_out: null,
            work_hours: null,
            extra_hours: null,
            status: 'absent'
          });
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // summary - only count weekdays for summary stats
    const weekdaysOnly = allDays.filter(day => {
      const dayOfWeek = new Date(day.date).getDay();
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    });
    const present = weekdaysOnly.filter(r => r.status === 'present').length;
    const leave = weekdaysOnly.filter(r => r.status === 'leave').length;
    const absent = weekdaysOnly.filter(r => r.status === 'absent').length;
    const total_working_days = weekdaysOnly.length; // Total weekdays in range
    
    console.log('Final result:', { 
      totalDays: allDays.length, 
      weekdaysOnly: weekdaysOnly.length,
      summary: { present, leave, absent, total_working_days },
      firstDay: allDays[0],
      lastDay: allDays[allDays.length - 1]
    });
    
    res.json({ 
      from, 
      to, 
      summary: { present_days: present, leave_days: leave, absent_days: absent, total_working_days }, 
      days: allDays 
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
}

export async function listAttendanceByDate(req, res) {
  try {
    const companyId = req.user.company_id;
    const role = req.user.role;
    if (!['admin','hr'].includes(role)) return res.status(403).json({ error: 'Forbidden' });
    const date = toDateOnly(req.query.date) || toDateOnly(new Date());
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const pageSize = Math.min(200, Math.max(1, parseInt(req.query.pageSize || '50', 10)));
    const offset = (page - 1) * pageSize;
    const countQ = await pool.query('SELECT COUNT(*)::int AS c FROM employees e WHERE e.company_id=$1', [companyId]);
    const total = countQ.rows[0].c;
    // Left join to include employees without attendance row yet
    const q = await pool.query(
      `SELECT e.id as employee_id, e.first_name, e.last_name, a.id as attendance_id, a.check_in, a.check_out, a.work_hours, a.extra_hours, a.status
         FROM employees e
         LEFT JOIN attendance a ON a.employee_id = e.id AND a.date = $1
        WHERE e.company_id = $2
        ORDER BY e.first_name ASC, e.last_name ASC
        LIMIT $3 OFFSET $4`,
      [date, companyId, pageSize, offset]
    );
    res.json({ date, items: q.rows, page, pageSize, total });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list attendance' });
  }
}

// Admin/HR: mark absents for a date for employees with no attendance AND no approved leave
export async function markAbsentsForDate(req, res) {
  try {
    const companyId = req.user.company_id;
    const role = req.user.role;
    if (!['admin','hr'].includes(role)) return res.status(403).json({ error: 'Forbidden' });
    const date = toDateOnly(req.query.date) || toDateOnly(new Date());
    // Employees without attendance on date and not on approved leave for date
    const empQ = await pool.query(
      `SELECT e.id
         FROM employees e
         LEFT JOIN attendance a ON a.employee_id=e.id AND a.date=$1
         LEFT JOIN leave_requests lr ON lr.employee_id=e.id AND lr.status='approved' AND lr.start_date <= $1 AND lr.end_date >= $1
        WHERE e.company_id=$2 AND a.id IS NULL AND lr.id IS NULL`,
      [date, companyId]
    );
    let inserted = 0;
    for (const r of empQ.rows) {
      await pool.query("INSERT INTO attendance (employee_id, date, status, work_hours, break_hours, extra_hours) VALUES ($1,$2,'absent',0,0,0)", [r.id, date]);
      inserted++;
    }
    res.json({ date, marked_absent: inserted });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to mark absents' });
  }
}