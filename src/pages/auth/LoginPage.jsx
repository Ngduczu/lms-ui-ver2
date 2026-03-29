import { useState, useRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../layouts/AuthLayout';
import { useAuth } from '../../hooks/useAuth';
import { getDefaultPathByRole } from '../../lib/role';
import { validateEmail, validatePassword } from '../../lib/validate';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const isSubmitting = useRef(false);

  function validateForm() {
    const errors = {};
    const emailErr = validateEmail(form.email);
    if (emailErr) errors.email = emailErr;

    const pwErr = validatePassword(form.password);
    if (pwErr) errors.password = pwErr;

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (isSubmitting.current) return;
    if (!validateForm()) return;
    isSubmitting.current = true;
    
    setError('');
    setLoading(true);
    try {
      const profile = await login(form);
      navigate(getDefaultPathByRole(profile?.role), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      isSubmitting.current = false;
    }
  }

  return (
    <AuthLayout title="Đăng nhập" subtitle="Truy cập hệ thống quản lý học tập UTC" footerMode="login">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="field-group">
          <label className="field-label">Email</label>
          <input
            className="input-field"
            type="email"
            placeholder="student@utc.edu.vn"
            required
            value={form.email}
            onChange={(e) => { setForm((p) => ({ ...p, email: e.target.value })); setFieldErrors((p) => ({ ...p, email: '' })); }}
          />
          {fieldErrors.email ? <p className="text-error">{fieldErrors.email}</p> : null}
        </div>

        <div className="field-group">
          <label className="field-label">Mật khẩu</label>
          <div className="password-wrapper">
            <input
              className="input-field"
              type={showPassword ? 'text' : 'password'}
              placeholder="Nhập mật khẩu"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => { setForm((p) => ({ ...p, password: e.target.value })); setFieldErrors((p) => ({ ...p, password: '' })); }}
            />
            <button type="button" className="password-toggle" onClick={() => setShowPassword((p) => !p)}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {fieldErrors.password ? <p className="text-error">{fieldErrors.password}</p> : null}
        </div>

        <div style={{ textAlign: 'right' }}>
          <Link to="/forgot-password" style={{ fontSize: '0.8125rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>
            Quên mật khẩu?
          </Link>
        </div>

        {error ? <p className="text-error">{error}</p> : null}

        <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.625rem' }} disabled={loading}>
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>
    </AuthLayout>
  );
}
