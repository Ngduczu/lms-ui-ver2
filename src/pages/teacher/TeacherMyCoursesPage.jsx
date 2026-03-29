import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, RefreshCcw, Search, Plus, Users, Clock, Eye, EyeOff } from 'lucide-react';
import { createCourseApi, getCoursesApi } from '../../api/courseApi';
import { useAuth } from '../../hooks/useAuth';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../../components/ui/Pagination';
import { Modal } from '../../components/ui/Modal';
import { notifyError, notifySuccess } from '../../lib/notify';

const STATUS_FILTERS = [
  { value: '', label: 'Tất cả' },
  { value: 'OPEN', label: 'Mở' },
  { value: 'CLOSED', label: 'Đóng' },
  { value: 'HIDDEN', label: 'Ẩn' },
];

export function TeacherMyCoursesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '', status: 'OPEN', maxStudent: 50 });

  /* Reset to page 0 when filters change */
  useEffect(() => { setPage(0); }, [search, statusFilter]);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: 20 };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      const data = await getCoursesApi(params);
      setCourses(data?.content || []);
      setTotalPages(data?.totalPages || 1);
      setTotalElements(data?.totalElements || 0);
    } catch {
      /* errors already handled by interceptor */
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  async function handleCreateCourse(e) {
    e.preventDefault();
    if (!createForm.name.trim()) return;
    try {
      await createCourseApi({
        name: createForm.name.trim(),
        description: createForm.description.trim(),
        status: createForm.status,
        maxStudent: Number(createForm.maxStudent) || 50,
        teacherId: user?.userId || user?.id,
      });
      notifySuccess('Tạo khóa học thành công!');
      setShowCreateCourse(false);
      setCreateForm({ name: '', description: '', status: 'OPEN', maxStudent: 50 });
      fetchCourses();
    } catch (err) {
      notifyError(err.message || 'Lỗi tạo khóa học');
    }
  }

  /* Summary stats */
  const openCount = courses.filter((c) => c.status === 'OPEN').length;
  const closedCount = courses.filter((c) => c.status === 'CLOSED').length;
  const hiddenCount = courses.filter((c) => c.status === 'HIDDEN').length;

  return (
    <DashboardLayout title="Khóa học của tôi" subtitle="Danh sách các khóa học bạn đang giảng dạy.">
      <PageHeader
        title="Khóa học của tôi"
        subtitle={`Tổng cộng ${totalElements} khóa học`}
        actions={
          <>
            <button className="btn-secondary btn-sm" onClick={fetchCourses} disabled={loading}>
              <RefreshCcw size={14} className={loading ? 'spin' : ''} /> Làm mới
            </button>
            <button className="btn-primary btn-sm" onClick={() => setShowCreateCourse(true)}>
              <Plus size={14} /> Tạo khóa học
            </button>
          </>
        }
      />

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Tổng cộng', value: totalElements, color: '#6366f1', icon: BookOpen },
          { label: 'Đang mở', value: openCount, color: '#22c55e', icon: Eye },
          { label: 'Đã đóng', value: closedCount, color: '#ef4444', icon: EyeOff },
          { label: 'Ẩn', value: hiddenCount, color: '#64748b', icon: Clock },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            className="card"
            style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div style={{
              width: '2.25rem', height: '2.25rem', borderRadius: '0.5rem',
              background: `${stat.color}1a`, display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: stat.color, flexShrink: 0,
            }}>
              <stat.icon size={16} />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>{stat.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters bar */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 16rem', maxWidth: '24rem' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            className="input-field"
            placeholder="Tìm kiếm khóa học..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>
        <div className="tab-group" style={{ margin: 0 }}>
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              className={`tab-item ${statusFilter === f.value ? 'tab-item-active' : ''}`}
              onClick={() => setStatusFilter(f.value)}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Course grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
        {courses.map((c, i) => (
          <motion.div
            key={c.id}
            className="card"
            style={{ padding: '1.25rem', cursor: 'pointer', transition: 'box-shadow 0.2s, transform 0.2s' }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
            onClick={() => navigate(`/teacher/course/${c.id}/detail`)}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{
                width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem',
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
              }}>
                <BookOpen size={18} />
              </div>
              <StatusBadge status={c.status} />
            </div>

            {/* Body */}
            <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.35rem', color: 'var(--color-text)' }}>
              {c.name}
            </h3>
            {c.description ? (
              <p style={{
                fontSize: '0.8rem', color: 'var(--color-text-muted)',
                marginBottom: '0.75rem',
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {c.description}
              </p>
            ) : null}

            {/* Footer stats */}
            <div style={{
              display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--color-text-muted)',
              borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem', marginTop: '0.5rem',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Users size={13} /> {c.approvedEnrollmentCount ?? 0} sinh viên
              </span>
              {(c.pendingEnrollmentCount ?? 0) > 0 ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#f59e0b', fontWeight: 600 }}>
                  <Clock size={13} /> {c.pendingEnrollmentCount} chờ duyệt
                </span>
              ) : null}
              <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                Tối đa: {c.max_Student ?? c.maxStudent ?? '-'}
              </span>
            </div>
          </motion.div>
        ))}
        {!courses.length && !loading ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            <BookOpen size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
            <p>Chưa có khóa học nào.</p>
          </div>
        ) : null}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Create modal */}
      <Modal open={showCreateCourse} onClose={() => setShowCreateCourse(false)} title="Tạo khóa học mới">
        <form onSubmit={handleCreateCourse} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="field-group">
            <label className="field-label">Tên khóa học <span className="text-error">*</span></label>
            <input
              className="input-field"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              placeholder="VD: Lập trình Java cơ bản"
              required
              autoFocus
            />
          </div>
          <div className="field-group">
            <label className="field-label">Mô tả</label>
            <textarea
              className="input-field"
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              placeholder="Mô tả ngắn gọn về khóa học..."
              rows={3}
            />
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
