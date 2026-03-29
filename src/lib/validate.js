/**
 * Shared validation helpers for form inputs.
 * All functions return an error string or empty string if valid.
 */

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^0\d{9}$/;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export function validateEmail(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return 'Email không được để trống.';
  if (!EMAIL_REGEX.test(trimmed)) return 'Email không hợp lệ. Ví dụ: student@utc.edu.vn';
  return '';
}

export function validatePassword(value) {
  const val = String(value || '');
  if (!val) return 'Mật khẩu không được để trống.';
  if (val.length < PASSWORD_MIN_LENGTH) return `Mật khẩu tối thiểu ${PASSWORD_MIN_LENGTH} ký tự.`;
  if (!/[a-z]/.test(val)) return 'Mật khẩu phải có ít nhất 1 chữ thường.';
  if (!/[A-Z]/.test(val)) return 'Mật khẩu phải có ít nhất 1 chữ hoa.';
  if (!/\d/.test(val)) return 'Mật khẩu phải có ít nhất 1 chữ số.';
  return '';
}

export function validatePhone(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return ''; // Optional field
  if (!PHONE_REGEX.test(trimmed)) return 'Số điện thoại phải gồm 10 chữ số, bắt đầu bằng 0.';
  return '';
}

export function validateConfirmPassword(password, confirmPassword) {
  if (String(confirmPassword || '') !== String(password || '')) {
    return 'Mật khẩu xác nhận không khớp.';
  }
  return '';
}

export function validateRequired(value, fieldName = 'Trường này') {
  if (!String(value || '').trim()) return `${fieldName} không được để trống.`;
  return '';
}
