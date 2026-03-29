import { useState, useRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../layouts/AuthLayout';
import { useAuth } from '../../hooks/useAuth';
import { getDefaultPathByRole } from '../../lib/role';
import { validateEmail, validatePassword, validatePhone, validateRequired } from '../../lib/validate';
import { notifyError } from '../../lib/notify';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', phoneNumber: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const isSubmitting = useRef(false);

  function validateForm() {
    const errors = [];

    const nameErr = validateRequired(form.fullName, 'Họ và tên');
    if (nameErr) errors.push(nameErr);

    const emailErr = validateEmail(form.email);
    if (emailErr) errors.push(emailErr);

    const pwErr = validatePassword(form.password);
    if (pwErr) errors.push(pwErr);

    const phoneErr = validatePhone(form.phoneNumber);
    if (phoneErr) errors.push(phoneErr);

    if (errors.length > 0) {
      notifyError(errors.join('\n'));
      return false;
    }
    return true;
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
          <label className="field-label">Họ và tên <span style={{ color: '#ef4444' }}>*</span></label>
          <input className="input-field" placeholder="Nguyễn Văn A" value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} />
          <p className="field-hint">Không được để trống</p>
        </div>
        <div className="field-group">
          <label className="field-label">Email <span style={{ color: '#ef4444' }}>*</span></label>
          <input className="input-field" type="text" placeholder="student@utc.edu.vn" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
          <p className="field-hint">Định dạng email hợp lệ, ví dụ: student@utc.edu.vn</p>
        </div>
        <div className="field-group">
          <label className="field-label">Mật khẩu <span style={{ color: '#ef4444' }}>*</span></label>
          <div className="password-wrapper">
            <input className="input-field" type={showPassword ? 'text' : 'password'} placeholder="Nhập mật khẩu" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} />
            <button type="button" className="password-toggle" onClick={() => setShowPassword((p) => !p)}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <p className="field-hint">Tối thiểu 8 ký tự, gồm chữ hoa (A-Z), chữ thường (a-z) và số (0-9)</p>
        </div>
        <div className="field-group">
          <label className="field-label">Số điện thoại</label>
          <input className="input-field" placeholder="0912345678" maxLength={10} value={form.phoneNumber} onChange={(e) => setForm((p) => ({ ...p, phoneNumber: e.target.value.replace(/\D/g, '') }))} />
          <p className="field-hint">10 chữ số, bắt đầu bằng 0 (không bắt buộc)</p>
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
