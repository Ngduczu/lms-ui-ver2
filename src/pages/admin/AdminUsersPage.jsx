import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileSpreadsheet, Plus, RefreshCcw, Search, Upload, Users } from 'lucide-react';
import { createUserApi, getUsersApi, updateUserApi, updateUserStatusApi, deleteUserApi } from '../../api/userApi';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatsCard } from '../../components/ui/StatsCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { confirmAction, notifyError, notifySuccess } from '../../lib/notify';
import { parseUsersFromExcel, downloadUserImportTemplate } from '../../lib/excel';
import { Pagination } from '../../components/ui/Pagination';
import { validateEmail, validatePassword, validatePhone, validateRequired } from '../../lib/validate';

export function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [error, setError] = useState('');

  // Create user
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ fullName: '', email: '', password: '', phoneNumber: '', role: 'STUDENT' });
  const [creating, setCreating] = useState(false);

  // Edit user
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ fullName: '', phoneNumber: '', role: '' });
  const [saving, setSaving] = useState(false);

  // Excel import
  const [showImportModal, setShowImportModal] = useState(false);
  const [importUsers, setImportUsers] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0, errors: [] });
  const fileInputRef = useRef(null);

  useEffect(() => {
    setPage(0);
  }, [search, filterRole, filterStatus]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getUsersApi({ 
        page, 
        size: 20, 
        search: search || undefined, 
        role: filterRole || undefined, 
        status: filterStatus || undefined 
      });
      setUsers(data?.content || []);
      setTotalPages(data?.totalPages || 1);
      setTotalElements(data?.totalElements || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterRole, filterStatus]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // CREATE
  async function handleCreate(e) {
    e.preventDefault();
    const errors = [];
    const nameErr = validateRequired(createForm.fullName, 'Họ và tên');
    if (nameErr) errors.push(nameErr);
    const emailErr = validateEmail(createForm.email);
    if (emailErr) errors.push(emailErr);
    const pwErr = validatePassword(createForm.password);
    if (pwErr) errors.push(pwErr);
    const phoneErr = validatePhone(createForm.phoneNumber);
    if (phoneErr) errors.push(phoneErr);
    if (errors.length > 0) {
      notifyError(errors.join('\n'));
      return;
    }

    setCreating(true);
    try {
      await createUserApi(createForm);
      notifySuccess('Đã tạo người dùng thành công.');
      setShowCreateModal(false);
      setCreateForm({ fullName: '', email: '', password: '', phoneNumber: '', role: 'STUDENT' });
      fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  // EDIT
  function openEdit(user) {
    setEditingUser(user);
    setEditForm({ fullName: user.fullName || '', phoneNumber: user.phoneNumber || '', role: (user.role || '').replace('ROLE_', '') });
    setShowEditModal(true);
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    if (!editingUser) return;
    setSaving(true);
    try {
      await updateUserApi(editingUser.userId || editingUser.id, editForm);
      notifySuccess('Đã cập nhật người dùng.');
      setShowEditModal(false);
      fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // STATUS
  async function handleToggleStatus(user) {
    const currentStatus = (user.userStatus || '').toUpperCase();
    const nextStatus = currentStatus === 'ACTIVE' ? 'BAN' : 'ACTIVE';
    const confirmed = await confirmAction({
      title: nextStatus === 'BAN' ? 'Khoá tài khoản?' : 'Mở khoá tài khoản?',
      message: `Bạn muốn ${nextStatus === 'BAN' ? 'khoá' : 'mở khoá'} tài khoản ${user.fullName}?`,
      confirmText: nextStatus === 'BAN' ? 'Khoá' : 'Mở khoá',
      variant: nextStatus === 'BAN' ? 'danger' : 'primary',
    });
    if (!confirmed) return;
    try {
      await updateUserStatusApi(user.userId || user.id, nextStatus);
      notifySuccess(nextStatus === 'BAN' ? 'Đã khoá tài khoản.' : 'Đã mở khoá tài khoản.');
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  }

  // DELETE
  async function handleDeleteUser(user) {
    const confirmed = await confirmAction({
      title: 'Xóa tài khoản?',
      message: `Bạn có chắc chắn muốn xóa tài khoản ${user.fullName}? Hành động này không thể hoàn tác.`,
      confirmText: 'Xóa',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await deleteUserApi(user.userId || user.id);
      notifySuccess('Đã xóa tài khoản.');
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  }

  // IMPORT EXCEL
  async function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try {
      const parsed = await parseUsersFromExcel(file);
      if (!parsed.length) { notifyError('File Excel không có dữ liệu.'); return; }
      setImportProgress({ done: 0, total: 0, errors: [] });
      setImportUsers(parsed);
      setShowImportModal(true);
    } catch (err) {
      notifyError(err.message);
    }
  }

  async function handleImportConfirm() {
    setImporting(true);
    const total = importUsers.length;
    const errors = [];
    setImportProgress({ done: 0, total, errors: [] });

    for (let i = 0; i < total; i++) {
      const u = importUsers[i];
      try {
        await createUserApi({ fullName: u.fullName, email: u.email, password: u.password, phoneNumber: u.phoneNumber, role: u.role });
      } catch (err) {
        errors.push({ row: u._row, email: u.email, error: err.message });
      }
      setImportProgress({ done: i + 1, total, errors: [...errors] });
    }

    setImporting(false);
    if (!errors.length) {
      notifySuccess(`Đã import thành công ${total} người dùng.`);
      setShowImportModal(false);
      setImportUsers([]);
    } else {
      notifyError(`Có ${errors.length}/${total} dòng bị lỗi.`);
    }
    fetchUsers();
  }

  return (
    <DashboardLayout title="Quản lý người dùng" subtitle="Tạo, chỉnh sửa và quản lý tài khoản người dùng trên hệ thống.">
      <PageHeader
        title="Người dùng"
        subtitle={`Tổng cộng ${totalElements} tài khoản`}
        actions={
          <>
            <button className="btn-secondary btn-sm" onClick={fetchUsers}><RefreshCcw size={14} /> Làm mới</button>
            <button className="btn-secondary btn-sm" onClick={downloadUserImportTemplate}><Download size={14} /> Tải mẫu Excel</button>
            <button className="btn-secondary btn-sm" onClick={() => fileInputRef.current?.click()}><FileSpreadsheet size={14} /> Import từ Excel</button>
            <button className="btn-primary btn-sm" onClick={() => setShowCreateModal(true)}><Plus size={14} /> Tạo người dùng</button>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" style={{ display: 'none' }} onChange={handleFileSelect} />
          </>
        }
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <StatsCard icon={Users} value={totalElements} label="Tổng người dùng" color="#4f46e5" bgColor="#eef2ff" />
      </div>

      {/* Search & Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '16rem', maxWidth: '24rem' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input className="input-field" placeholder="Tìm kiếm theo tên hoặc email..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: '2.25rem' }} />
        </div>
        <select className="input-field" style={{ width: 'auto', minWidth: '10rem' }} value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
          <option value="">Tất cả vai trò</option>
          <option value="ADMIN">Quản trị viên</option>
          <option value="TEACHER">Giảng viên</option>
          <option value="STUDENT">Sinh viên</option>
        </select>
        <select className="input-field" style={{ width: 'auto', minWidth: '10rem' }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Hoạt động</option>
          <option value="BAN">Đã khoá</option>
        </select>
      </div>

      {error ? <p className="text-error" style={{ marginBottom: '0.75rem' }}>{error}</p> : null}

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th className="cell-center">#</th>
              <th>Họ tên</th>
              <th>Email</th>
              <th>SĐT</th>
              <th className="cell-center">Vai trò</th>
              <th className="cell-center">Trạng thái</th>
              <th className="cell-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <motion.tr key={u.userId || u.id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                <td className="cell-center">{i + 1}</td>
                <td style={{ fontWeight: 600 }}>{u.fullName || '-'}</td>
                <td>{u.email || '-'}</td>
                <td>{u.phoneNumber || '-'}</td>
                <td className="cell-center">
                  <span className="badge badge-indigo">{(u.role || '').replace('ROLE_', '')}</span>
                </td>
                <td className="cell-center"><StatusBadge status={u.userStatus} /></td>
                <td className="cell-center">
                  <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'center' }}>
                    {(u.userStatus || '').toUpperCase() !== 'DELETED' ? (
                      <>
                        <button className="btn-secondary btn-sm" onClick={() => openEdit(u)}>Sửa</button>
                        <button className={`btn-sm ${(u.userStatus || '').toUpperCase() === 'ACTIVE' ? 'btn-danger' : 'btn-primary'}`} onClick={() => handleToggleStatus(u)}>
                          {(u.userStatus || '').toUpperCase() === 'ACTIVE' ? 'Khoá' : 'Mở khoá'}
                        </button>
                        <button className="btn-danger btn-sm" onClick={() => handleDeleteUser(u)}>Xóa</button>
                      </>
                    ) : (
                      <span style={{ fontSize: '0.8125rem', color: '#dc2626', fontWeight: 500 }}>Đã bị xóa</span>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
            {!users.length && !loading ? (
              <tr><td colSpan={7} className="empty-state" style={{ padding: '3rem' }}>Không tìm thấy người dùng nào.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Create Modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Tạo người dùng mới">
        <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="field-group" style={{ gridColumn: 'span 2' }}>
            <label className="field-label">Họ và tên <span style={{ color: '#ef4444' }}>*</span></label>
            <input className="input-field" placeholder="Nguyễn Văn A" value={createForm.fullName} onChange={(e) => setCreateForm((p) => ({ ...p, fullName: e.target.value }))} />
            <p className="field-hint">Không được để trống</p>
          </div>
          <div className="field-group">
            <label className="field-label">Email <span style={{ color: '#ef4444' }}>*</span></label>
            <input className="input-field" type="text" placeholder="student@utc.edu.vn" value={createForm.email} onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))} />
            <p className="field-hint">Định dạng email hợp lệ</p>
          </div>
          <div className="field-group">
            <label className="field-label">Mật khẩu <span style={{ color: '#ef4444' }}>*</span></label>
            <input className="input-field" type="password" placeholder="Nhập mật khẩu" value={createForm.password} onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))} />
            <p className="field-hint">Tối thiểu 8 ký tự, chữ hoa + chữ thường + số</p>
          </div>
          <div className="field-group">
            <label className="field-label">Số điện thoại</label>
            <input className="input-field" maxLength={10} placeholder="0912345678" value={createForm.phoneNumber} onChange={(e) => setCreateForm((p) => ({ ...p, phoneNumber: e.target.value.replace(/\D/g, '') }))} />
            <p className="field-hint">10 chữ số, bắt đầu bằng 0 (không bắt buộc)</p>
          </div>
          <div className="field-group">
            <label className="field-label">Vai trò</label>
            <select className="input-field" value={createForm.role} onChange={(e) => setCreateForm((p) => ({ ...p, role: e.target.value }))}>
              <option value="STUDENT">Sinh viên</option>
              <option value="TEACHER">Giảng viên</option>
              <option value="ADMIN">Quản trị viên</option>
            </select>
          </div>
          <div style={{ gridColumn: 'span 2', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>Hủy</button>
            <button type="submit" className="btn-primary" disabled={creating}>{creating ? 'Đang tạo...' : 'Tạo người dùng'}</button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Chỉnh sửa người dùng">
        <form onSubmit={handleSaveEdit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="field-group" style={{ gridColumn: 'span 2' }}>
            <label className="field-label">Họ và tên</label>
            <input className="input-field" required value={editForm.fullName} onChange={(e) => setEditForm((p) => ({ ...p, fullName: e.target.value }))} />
          </div>
          <div className="field-group">
            <label className="field-label">Số điện thoại</label>
            <input className="input-field" maxLength={10} placeholder="0912345678" value={editForm.phoneNumber} onChange={(e) => setEditForm((p) => ({ ...p, phoneNumber: e.target.value.replace(/\D/g, '') }))} />
          </div>
          <div className="field-group">
            <label className="field-label">Vai trò</label>
            <select className="input-field" value={editForm.role} onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value }))}>
              <option value="STUDENT">Sinh viên</option>
              <option value="TEACHER">Giảng viên</option>
              <option value="ADMIN">Quản trị viên</option>
            </select>
          </div>
          <div style={{ gridColumn: 'span 2', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>Hủy</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
          </div>
        </form>
      </Modal>

      {/* Import Excel Modal */}
      <Modal open={showImportModal} onClose={() => { if (!importing) { setShowImportModal(false); setImportUsers([]); } }} title="Import người dùng từ Excel" maxWidth="56rem">
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
          Xem trước danh sách {importUsers.length} người dùng sẽ được tạo. Hãy kiểm tra trước khi xác nhận.
        </p>

        <div className="table-container" style={{ maxHeight: '24rem', overflow: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Dòng</th>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Mật khẩu</th>
                <th>SĐT</th>
                <th>Vai trò</th>
              </tr>
            </thead>
            <tbody>
              {importUsers.map((u, i) => (
                <tr key={i}>
                  <td>{u._row}</td>
                  <td>{u.fullName || <span className="text-error">Thiếu</span>}</td>
                  <td>{u.email || <span className="text-error">Thiếu</span>}</td>
                  <td>{u.password ? '••••••••' : <span className="text-error">Thiếu</span>}</td>
                  <td>{u.phoneNumber || '-'}</td>
                  <td><span className="badge badge-indigo">{u.role}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Progress */}
        {importProgress.total > 0 ? (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.375rem' }}>
              <span>Tiến độ: {importProgress.done}/{importProgress.total}</span>
              <span>{Math.round((importProgress.done / importProgress.total) * 100)}%</span>
            </div>
            <div className="assessment-progress-bar">
              <div className="assessment-progress-fill" style={{ width: `${(importProgress.done / importProgress.total) * 100}%` }} />
            </div>
            {importProgress.errors.length > 0 ? (
              <div style={{ marginTop: '0.75rem' }}>
                <p className="text-error">Lỗi ({importProgress.errors.length} dòng):</p>
                <div style={{ maxHeight: '6rem', overflow: 'auto', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {importProgress.errors.map((err, i) => (
                    <p key={i} style={{ color: '#dc2626' }}>Dòng {err.row} ({err.email}): {err.error}</p>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
          <button className="btn-secondary" onClick={() => { setShowImportModal(false); setImportUsers([]); }} disabled={importing}>Hủy</button>
          <button className="btn-primary" onClick={handleImportConfirm} disabled={importing}>
            <Upload size={14} /> {importing ? `Đang import ${importProgress.done}/${importProgress.total}...` : `Import ${importUsers.length} người dùng`}
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
