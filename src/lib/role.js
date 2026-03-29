export const ROLE_ADMIN = 'ADMIN';
export const ROLE_TEACHER = 'TEACHER';
export const ROLE_STUDENT = 'STUDENT';

export function normalizeRole(role) {
  if (!role) return '';
  return role.replace('ROLE_', '').toUpperCase();
}

export function getDefaultPathByRole(role) {
  const normalized = normalizeRole(role);
  if (normalized === ROLE_ADMIN) return '/admin';
  if (normalized === ROLE_TEACHER) return '/teacher';
  return '/student';
}

export function getRoleLabel(role) {
  const n = normalizeRole(role);
  if (n === 'TEACHER') return 'Giảng viên';
  if (n === 'STUDENT') return 'Sinh viên';
  if (n === 'ADMIN') return 'Quản trị viên';
  return n || 'Người dùng';
}
