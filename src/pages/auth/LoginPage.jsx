import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../layouts/AuthLayout';
import { useAuth } from '../../hooks/useAuth';
import { getDefaultPathByRole } from '../../lib/role';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const profile = await login(form);
      navigate(getDefaultPathByRole(profile?.role), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          />
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
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            />
            <button type="button" className="password-toggle" onClick={() => setShowPassword((p) => !p)}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
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
