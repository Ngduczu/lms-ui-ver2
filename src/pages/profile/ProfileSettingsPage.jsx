import { useState } from 'react';
import { Eye, EyeOff, Upload } from 'lucide-react';
import { changeMyPasswordApi, updateMyProfileApi, uploadMyAvatarApi } from '../../api/userApi';
import { useAuth } from '../../hooks/useAuth';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { PageHeader } from '../../components/ui/PageHeader';
import { getRoleLabel } from '../../lib/role';
import { notifySuccess } from '../../lib/notify';

export function ProfileSettingsPage() {
  const { user, role, refreshProfile } = useAuth();
  const [profileForm, setProfileForm] = useState({ fullName: user?.fullName || '', phoneNumber: user?.phoneNumber || '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [error, setError] = useState('');
  const [pwError, setPwError] = useState('');

  const initials = (user?.fullName || 'U').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  async function handleSaveProfile(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await updateMyProfileApi(profileForm);
      await refreshProfile();
      notifySuccess('Đã cập nhật thông tin.');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { setPwError('Mật khẩu xác nhận không khớp.'); return; }
    setPwLoading(true);
    setPwError('');
    try {
      await changeMyPasswordApi({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      notifySuccess('Đã đổi mật khẩu.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { setPwError(err.message); }
    finally { setPwLoading(false); }
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadMyAvatarApi(file);
      await refreshProfile();
      notifySuccess('Đã cập nhật ảnh đại diện.');
    } catch (err) { setError(err.message); }
  }

  return (
    <DashboardLayout title="Cài đặt tài khoản">
      <PageHeader title="Cài đặt tài khoản" subtitle="Quản lý thông tin cá nhân và bảo mật." />

      {/* Avatar section */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ width: '4rem', height: '4rem', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1.25rem', overflow: 'hidden' }}>
            {user?.avatarUrl ? <img src={user.avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontWeight: 700 }}>{user?.fullName || 'Người dùng'}</h3>
          <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>{getRoleLabel(role)} · {user?.email}</p>
        </div>
        <label className="btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
          <Upload size={14} /> Đổi avatar
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
        </label>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '1.125rem' }}>Chỉnh sửa thông tin</h4>
          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="field-group">
              <label className="field-label">Email</label>
              <input className="input-field" value={user?.email || ''} disabled />
            </div>
            <div className="field-group">
              <label className="field-label">Họ và tên</label>
              <input className="input-field" required value={profileForm.fullName} onChange={(e) => setProfileForm((p) => ({ ...p, fullName: e.target.value }))} />
            </div>
            <div className="field-group">
              <label className="field-label">Số điện thoại</label>
              <input className="input-field" pattern="^0\d{9}$" maxLength={10} title="10 chữ số, bắt đầu bằng 0" value={profileForm.phoneNumber} onChange={(e) => setProfileForm((p) => ({ ...p, phoneNumber: e.target.value }))} />
            </div>
            {error ? <p className="text-error" style={{ fontSize: '0.875rem' }}>{error}</p> : null}
            <button type="submit" className="btn-primary" style={{ width: 'fit-content', marginTop: '0.5rem' }} disabled={loading}>{loading ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
          </form>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '1.125rem' }}>Đổi mật khẩu</h4>
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="field-group">
              <label className="field-label">Mật khẩu hiện tại</label>
              <div className="password-wrapper">
                <input className="input-field" type={show ? 'text' : 'password'} required value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))} />
                <button type="button" className="password-toggle" onClick={() => setShow((p) => !p)}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </div>
            <div className="field-group">
              <label className="field-label">Mật khẩu mới</label>
              <input className="input-field" type="password" required minLength={8} value={passwordForm.newPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))} />
            </div>
            <div className="field-group">
              <label className="field-label">Xác nhận mật khẩu mới</label>
              <input className="input-field" type="password" required minLength={8} value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))} />
            </div>
            {pwError ? <p className="text-error" style={{ fontSize: '0.875rem' }}>{pwError}</p> : null}
            <button type="submit" className="btn-primary" style={{ width: 'fit-content', marginTop: '0.5rem' }} disabled={pwLoading}>{pwLoading ? 'Đang xử lý...' : 'Đổi mật khẩu'}</button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
