import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { AuthLayout } from '../../layouts/AuthLayout';
import { resetPasswordApi } from '../../api/authApi';
import { validatePassword, validateConfirmPassword } from '../../lib/validate';
import { notifyError } from '../../lib/notify';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function validateForm() {
    const errors = [];

    const pwErr = validatePassword(form.newPassword);
    if (pwErr) errors.push(pwErr);

    const confirmErr = validateConfirmPassword(form.newPassword, form.confirmPassword);
    if (confirmErr) errors.push(confirmErr);

    if (errors.length > 0) {
      notifyError(errors.join('\n'));
      return false;
    }
    return true;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validateForm()) return;
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await resetPasswordApi({ token, newPassword: form.newPassword });
      setSuccess('Đặt lại mật khẩu thành công!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Đặt lại mật khẩu" subtitle="Nhập mật khẩu mới cho tài khoản của bạn" footerMode="reset">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="field-group">
          <label className="field-label">Mật khẩu mới <span style={{ color: '#ef4444' }}>*</span></label>
          <div className="password-wrapper">
            <input className="input-field" type={show ? 'text' : 'password'} placeholder="Nhập mật khẩu mới" value={form.newPassword} onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))} />
            <button type="button" className="password-toggle" onClick={() => setShow((p) => !p)}>
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <p className="field-hint">Tối thiểu 8 ký tự, gồm chữ hoa (A-Z), chữ thường (a-z) và số (0-9)</p>
        </div>
        <div className="field-group">
          <label className="field-label">Xác nhận mật khẩu <span style={{ color: '#ef4444' }}>*</span></label>
          <input className="input-field" type="password" placeholder="Nhập lại mật khẩu mới" value={form.confirmPassword} onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))} />
          <p className="field-hint">Nhập lại chính xác mật khẩu ở trên</p>
        </div>
        {error ? <p className="text-error">{error}</p> : null}
        {success ? <p className="text-success">{success}</p> : null}
        <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.625rem' }} disabled={loading}>
          {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
        </button>
      </form>
    </AuthLayout>
  );
}
