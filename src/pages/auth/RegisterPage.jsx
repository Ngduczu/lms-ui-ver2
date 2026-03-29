import { useState, useRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../layouts/AuthLayout';
import { useAuth } from '../../hooks/useAuth';
import { getDefaultPathByRole } from '../../lib/role';
import { validateEmail, validatePassword, validatePhone, validateRequired } from '../../lib/validate';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', phoneNumber: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const isSubmitting = useRef(false);

  function validateForm() {
    const errors = {};
    const nameErr = validateRequired(form.fullName, 'Họ và tên');
    if (nameErr) errors.fullName = nameErr;

    const emailErr = validateEmail(form.email);
    if (emailErr) errors.email = emailErr;

    const pwErr = validatePassword(form.password);
    if (pwErr) errors.password = pwErr;

    const phoneErr = validatePhone(form.phoneNumber);
    if (phoneErr) errors.phoneNumber = phoneErr;

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (isSubmitting.current) return;
    if (!validateForm()) return;
    isSubmitting.current = true;
    
    setError('');
    setSuccessMessage('');
    setLoading(true);
    
    try {
      await register(form);
      setSuccessMessage('Đăng ký thành công. Vui lòng đăng nhập để tiếp tục.');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 900);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      isSubmitting.current = false;
    }
  }

  return (
    <AuthLayout title="Tạo tài khoản" subtitle="Đăng ký để bắt đầu học tập trên UTC LMS" footerMode="register">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="field-group">
          <label className="field-label">Họ và tên</label>
          <input className="input-field" required placeholder="Nguyễn Văn A" value={form.fullName} onChange={(e) => { setForm((p) => ({ ...p, fullName: e.target.value })); setFieldErrors((p) => ({ ...p, fullName: '' })); }} />
          {fieldErrors.fullName ? <p className="text-error">{fieldErrors.fullName}</p> : null}
        </div>
        <div className="field-group">
          <label className="field-label">Email</label>
          <input className="input-field" type="email" required placeholder="student@utc.edu.vn" value={form.email} onChange={(e) => { setForm((p) => ({ ...p, email: e.target.value })); setFieldErrors((p) => ({ ...p, email: '' })); }} />
          {fieldErrors.email ? <p className="text-error">{fieldErrors.email}</p> : null}
        </div>
        <div className="field-group">
          <label className="field-label">Mật khẩu</label>
          <div className="password-wrapper">
            <input className="input-field" type={showPassword ? 'text' : 'password'} required minLength={8} placeholder="Tối thiểu 8 ký tự (a-z, A-Z, 0-9)" value={form.password} onChange={(e) => { setForm((p) => ({ ...p, password: e.target.value })); setFieldErrors((p) => ({ ...p, password: '' })); }} />
            <button type="button" className="password-toggle" onClick={() => setShowPassword((p) => !p)}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {fieldErrors.password ? <p className="text-error">{fieldErrors.password}</p> : null}
        </div>
        <div className="field-group">
          <label className="field-label">Số điện thoại</label>
          <input className="input-field" placeholder="0912345678" maxLength={10} value={form.phoneNumber} onChange={(e) => { setForm((p) => ({ ...p, phoneNumber: e.target.value.replace(/\D/g, '') })); setFieldErrors((p) => ({ ...p, phoneNumber: '' })); }} />
          {fieldErrors.phoneNumber ? <p className="text-error">{fieldErrors.phoneNumber}</p> : null}
        </div>
        {error ? <p className="text-error">{error}</p> : null}
        {successMessage ? <p style={{ color: 'var(--color-success, #16a34a)', fontSize: '0.875rem' }}>{successMessage}</p> : null}
        <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.625rem' }} disabled={loading}>
          {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
        </button>
      </form>
    </AuthLayout>
  );
}
