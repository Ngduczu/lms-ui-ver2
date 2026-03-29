import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, RefreshCcw } from 'lucide-react';
import { createCourseApi, getCoursesApi } from '../../api/courseApi';
import { useAuth } from '../../hooks/useAuth';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../../components/ui/Pagination';
import { Modal } from '../../components/ui/Modal';
import { notifyError, notifySuccess } from '../../lib/notify';
import { Search, Plus } from 'lucide-react';

export function TeacherMyCoursesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '', status: 'OPEN', maxStudent: 50 });

  useEffect(() => {
    setPage(0);
  }, [search]);

  async function handleCreateCourse(e) {
    e.preventDefault();
    if (!createForm.name.trim()) return;
    try {
      await createCourseApi({
        name: createForm.name.trim(),
        description: createForm.description.trim(),
        status: createForm.status,
        maxStudent: Number(createForm.maxStudent) || 50,
        teacherId: (user?.userId || user?.id),
      });
      notifySuccess('Tạo khóa học thành công!');
      setShowCreateCourse(false);
      setCreateForm({ name: '', description: '', status: 'OPEN', maxStudent: 50 });
      fetchCourses();
    } catch (err) {
      notifyError(err.message || 'Lỗi tạo khóa học');
    }
  }

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCoursesApi({ page, size: 20, search: search || undefined });
      setCourses(data?.content || []);
      setTotalPages(data?.totalPages || 1);
      setTotalElements(data?.totalElements || 0);
    } catch {} finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  return (
    <DashboardLayout title="Khóa học của tôi" subtitle="Danh sách các khóa học bạn đang giảng dạy.">
      <PageHeader title="Khóa học của tôi" subtitle={`${totalElements} khóa học`} actions={
        <>
          <button className="btn-secondary btn-sm" onClick={fetchCourses}><RefreshCcw size={14} /> Làm mới</button>
          <button className="btn-primary btn-sm" onClick={() => setShowCreateCourse(true)}><Plus size={14} /> Tạo khóa học</button>
        </>
      } />
      
      <div style={{ marginBottom: '1.5rem', maxWidth: '24rem', position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input className="input-field" placeholder="Tìm kiếm khóa học..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: '2.25rem' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
        {courses.map((c, i) => (
          <motion.div key={c.id} className="card" style={{ padding: '1.25rem', cursor: 'pointer' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} onClick={() => navigate(`/teacher/course/${c.id}/detail`)}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <BookOpen size={18} />
              </div>
              <StatusBadge status={c.status} />
            </div>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>{c.name}</h3>
            <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>{c.approvedEnrollmentCount ?? 0} sinh viên đã duyệt</p>
          </motion.div>
        ))}
        {!courses.length && !loading ? <p style={{ color: '#94a3b8', gridColumn: 'span 3' }}>Chưa có khóa học nào.</p> : null}
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <Modal open={showCreateCourse} onClose={() => setShowCreateCourse(false)} title="Tạo khóa học mới">
        <form onSubmit={handleCreateCourse} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="field-group">
            <label className="field-label">Tên khóa học <span className="text-error">*</span></label>
            <input className="input-field" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} placeholder="VD: Lập trình Java cơ bản" required autoFocus />
          </div>
          <div className="field-group">
            <label className="field-label">Mô tả</label>
            <textarea className="input-field" value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} placeholder="Mô tả khóa học..." rows={3} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="field-group">
              <label className="field-label">Trạng thái</label>
              <select className="input-field" value={createForm.status} onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}>
                <option value="OPEN">Mở</option>
                <option value="CLOSED">Đóng</option>
                <option value="HIDDEN">Ẩn</option>
              </select>
            </div>
            <div className="field-group">
              <label className="field-label">Sĩ số tối đa</label>
              <input type="number" className="input-field" min="1" value={createForm.maxStudent} onChange={(e) => setCreateForm({ ...createForm, maxStudent: e.target.value })} required />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn-secondary" onClick={() => setShowCreateCourse(false)}>Hủy</button>
            <button type="submit" className="btn-primary">Tạo ngay</button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
