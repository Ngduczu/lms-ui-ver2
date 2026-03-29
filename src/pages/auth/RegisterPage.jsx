import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../layouts/AuthLayout';
import { useAuth } from '../../hooks/useAuth';
import { getDefaultPathByRole } from '../../lib/role';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', phoneNumber: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const profile = await register(form);
      navigate(getDefaultPathByRole(profile?.role), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Tạo tài khoản" subtitle="Đăng ký để bắt đầu học tập trên UTC LMS" footerMode="register">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="field-group">
          <label className="field-label">Họ và tên</label>
          <input className="input-field" required placeholder="Nguyễn Văn A" value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} />
        </div>
        <div className="field-group">
          <label className="field-label">Email</label>
          <input className="input-field" type="email" required placeholder="student@utc.edu.vn" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
        </div>
        <div className="field-group">
          <label className="field-label">Mật khẩu</label>
          <div className="password-wrapper">
            <input className="input-field" type={showPassword ? 'text' : 'password'} required minLength={8} placeholder="Tối thiểu 8 ký tự" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} />
            <button type="button" className="password-toggle" onClick={() => setShowPassword((p) => !p)}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div className="field-group">
          <label className="field-label">Số điện thoại</label>
          <input className="input-field" placeholder="0912345678" pattern="^0\d{9}$" maxLength={10} title="10 chữ số, bắt đầu bằng 0" value={form.phoneNumber} onChange={(e) => setForm((p) => ({ ...p, phoneNumber: e.target.value }))} />
        </div>
        {error ? <p className="text-error">{error}</p> : null}
        <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.625rem' }} disabled={loading}>
          {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
        </button>
      </form>
    </AuthLayout>
  );
}
