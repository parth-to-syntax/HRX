// Utility to generate login ID per PRD: OI + first2(firstname) + first2(lastname) + joining year + serial
// Example: Harsh Kumar joining 2025, 3rd employee => OIHAKU202503

export function generateLoginId(firstName, lastName, joiningDate, joiningSerial) {
  const year = new Date(joiningDate).getFullYear();
  const fn = (firstName || '').trim().toUpperCase().slice(0,2).padEnd(2,'X');
  const ln = (lastName || '').trim().toUpperCase().slice(0,2).padEnd(2,'X');
  const serial = String(joiningSerial).padStart(2,'0');
  return `OI${fn}${ln}${year}${serial}`; // OI + FN2 + LN2 + YYYY + NN
}
