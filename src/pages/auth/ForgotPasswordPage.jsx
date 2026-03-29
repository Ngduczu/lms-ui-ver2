import { useState } from 'react';
import { AuthLayout } from '../../layouts/AuthLayout';
import { forgotPasswordApi } from '../../api/authApi';
import { validateEmail } from '../../lib/validate';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const emailErr = validateEmail(email);
    if (emailErr) {
      setFieldError(emailErr);
      return;
    }
    setError('');
    setFieldError('');
    setSuccess('');
    setLoading(true);
    try {
      await forgotPasswordApi({ email });
      setSuccess('Đã gửi email đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Quên mật khẩu" subtitle="Nhập email để nhận link đặt lại mật khẩu">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="field-group">
          <label className="field-label">Email</label>
          <input className="input-field" type="email" required placeholder="student@utc.edu.vn" value={email} onChange={(e) => { setEmail(e.target.value); setFieldError(''); }} />
          {fieldError ? <p className="text-error">{fieldError}</p> : null}
        </div>
        {error ? <p className="text-error">{error}</p> : null}
        {success ? <p className="text-success">{success}</p> : null}
        <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.625rem' }} disabled={loading}>
          {loading ? 'Đang gửi...' : 'Gửi link đặt lại'}
        </button>
      </form>
    </AuthLayout>
  );
}
