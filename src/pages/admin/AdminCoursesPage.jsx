import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Plus, RefreshCcw, Search } from 'lucide-react';
import { createCourseApi, deleteCourseApi, getCoursesApi, updateCourseApi } from '../../api/courseApi';
import { getUsersApi } from '../../api/userApi';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { confirmAction, notifySuccess } from '../../lib/notify';
import { Pagination } from '../../components/ui/Pagination';

export function AdminCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', status: 'OPEN', maxStudent: 30, teacherId: '' });

  useEffect(() => {
    setPage(0);
  }, [search]);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCoursesApi({ page, size: 20, search: search || undefined });
      setCourses(data?.content || []);
      setTotalPages(data?.totalPages || 1);
      setTotalElements(data?.totalElements || 0);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [page, search]);

  const fetchTeachers = useCallback(async () => {
    try {
      const data = await getUsersApi({ page: 0, size: 500 });
      setTeachers((data?.content || []).filter((u) => (u.role || '').toUpperCase().includes('TEACHER')));
    } catch {}
  }, []);

  useEffect(() => { fetchCourses(); fetchTeachers(); }, [fetchCourses, fetchTeachers]);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await createCourseApi(form);
      notifySuccess('Đã tạo khóa học.');
      setShowCreate(false);
      setForm({ name: '', description: '', status: 'OPEN', maxStudent: 30, teacherId: '' });
      fetchCourses();
    } catch (err) { setError(err.message); }
  }

  function openEdit(course) {
    setEditingCourse(course);
    setForm({ name: course.name || '', description: course.description || '', status: course.status || 'OPEN', maxStudent: course.max_Student ?? course.maxStudent ?? 30, teacherId: course.teacherId || '' });
    setShowEdit(true);
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    if (!editingCourse) return;
    try {
      await updateCourseApi(editingCourse.id || editingCourse.courseId, form);
      notifySuccess('Đã cập nhật khóa học.');
      setShowEdit(false);
      fetchCourses();
    } catch (err) { setError(err.message); }
  }

  async function handleDelete(course) {
    const ok = await confirmAction({ title: 'Xóa khóa học?', message: `Bạn muốn xóa "${course.name}"?`, confirmText: 'Xóa', variant: 'danger' });
    if (!ok) return;
    try {
      await deleteCourseApi(course.id || course.courseId);
      notifySuccess('Đã xóa khóa học.');
      fetchCourses();
    } catch (err) { setError(err.message); }
  }

  return (
    <DashboardLayout title="Quản lý khóa học" subtitle="Tạo và quản lý các khóa học trên hệ thống.">
      <PageHeader title="Khóa học" subtitle={`${totalElements} khóa học`} actions={
        <>
          <button className="btn-secondary btn-sm" onClick={fetchCourses}><RefreshCcw size={14} /> Làm mới</button>
          <button className="btn-primary btn-sm" onClick={() => { setForm({ name: '', description: '', status: 'OPEN', maxStudent: 30, teacherId: '' }); setShowCreate(true); }}><Plus size={14} /> Tạo khóa học</button>
        </>
      } />

      <div style={{ marginBottom: '1rem', maxWidth: '24rem', position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input className="input-field" placeholder="Tìm kiếm khóa học..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: '2.25rem' }} />
      </div>

      {error ? <p className="text-error" style={{ marginBottom: '0.75rem' }}>{error}</p> : null}

      <div className="table-container">
        <table className="data-table">
          <thead><tr><th className="cell-center">#</th><th>Tên khóa học</th><th>Giảng viên</th><th className="cell-center">SV tối đa</th><th className="cell-center">Đã duyệt</th><th className="cell-center">Trạng thái</th><th className="cell-center">Thao tác</th></tr></thead>
          <tbody>
            {courses.map((c, i) => (
              <motion.tr key={c.id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                <td className="cell-center">{i + 1}</td>
                <td style={{ fontWeight: 600 }}>{c.name}</td>
                <td>{c.teacherName || teachers.find(t => (t.userId || t.id) === c.teacherId)?.fullName || '-'}</td>
                <td className="cell-center">{c.max_Student ?? c.maxStudent ?? '-'}</td>
                <td className="cell-center">{c.approvedEnrollmentCount ?? 0}</td>
                <td className="cell-center"><StatusBadge status={c.status} /></td>
                <td className="cell-center">
                  <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'center' }}>
                    <button className="btn-secondary btn-sm" onClick={() => openEdit(c)}>Sửa</button>
                    <button className="btn-danger btn-sm" onClick={() => handleDelete(c)}>Xóa</button>
                  </div>
                </td>
              </motion.tr>
            ))}
            {!courses.length && !loading ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Không có khóa học nào.</td></tr> : null}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Create/Edit Modal */}
      <Modal open={showCreate || showEdit} onClose={() => { setShowCreate(false); setShowEdit(false); }} title={showEdit ? 'Chỉnh sửa khóa học' : 'Tạo khóa học mới'}>
        <form onSubmit={showEdit ? handleSaveEdit : handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="field-group" style={{ gridColumn: 'span 2' }}>
            <label className="field-label">Tên khóa học</label>
            <input className="input-field" required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          </div>
          {!showEdit ? (
            <div className="field-group">
              <label className="field-label">Giảng viên</label>
              <select className="input-field" value={form.teacherId} onChange={(e) => setForm((p) => ({ ...p, teacherId: e.target.value }))}>
                <option value="">-- Chọn giảng viên --</option>
                {teachers.map((t) => <option key={t.userId || t.id} value={t.userId || t.id}>{t.fullName}</option>)}
              </select>
            </div>
          ) : null}
          <div className="field-group">
            <label className="field-label">SV tối đa</label>
            <input className="input-field" type="number" min={1} value={form.maxStudent} onChange={(e) => setForm((p) => ({ ...p, maxStudent: Number(e.target.value) }))} />
          </div>
          <div className="field-group">
            <label className="field-label">Trạng thái</label>
            <select className="input-field" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
              <option value="OPEN">Mở</option><option value="CLOSED">Đóng</option><option value="HIDDEN">Ẩn</option>
            </select>
          </div>
          <div className="field-group" style={{ gridColumn: 'span 2' }}>
            <label className="field-label">Mô tả</label>
            <textarea className="input-field" rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          </div>
          <div style={{ gridColumn: 'span 2', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={() => { setShowCreate(false); setShowEdit(false); }}>Hủy</button>
            <button type="submit" className="btn-primary">{showEdit ? 'Lưu thay đổi' : 'Tạo khóa học'}</button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
