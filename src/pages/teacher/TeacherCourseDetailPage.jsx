import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Download, FolderKanban, RefreshCcw, Trash2, Upload, Users, BookOpen, Settings } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getCourseByIdApi, updateCourseApi } from '../../api/courseApi';
import { getCourseEnrollmentsApi, updateEnrollmentStatusApi } from '../../api/enrollmentApi';
import { deleteMaterialApi, getCourseMaterialsApi, getMaterialDownloadUrlApi, uploadMaterialApi, updateMaterialStatusApi } from '../../api/materialApi';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../hooks/useAuth';
import { confirmAction, notifyError, notifySuccess } from '../../lib/notify';

function getMaterialDisplayName(item) {
  const name = String(item?.name || '').trim();
  if (name) return name;
  try {
    const u = new URL(item?.fileUrl || '');
    const i = u.pathname.indexOf('/o/');
    if (i < 0) return '-';
    return decodeURIComponent(u.pathname.slice(i + 3)).split('/').pop() || '-';
  } catch {
    return '-';
  }
}

export function TeacherCourseDetailPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { courseId = '' } = useParams();

  const [course, setCourse] = useState(null);
  const [activeTab, setActiveTab] = useState('MATERIAL');
  const [materials, setMaterials] = useState([]);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [materialForm, setMaterialForm] = useState({ name: '', type: 'PDF', file: null });
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [courseForm, setCourseForm] = useState({ name: '', description: '', maxStudent: 1, status: 'OPEN' });

  /* Fetch course detail by ID */
  const fetchCourseDetail = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const data = await getCourseByIdApi(courseId);
      setCourse(data);
      setCourseForm({
        name: data?.name || '',
        description: data?.description || '',
        maxStudent: data?.maxStudent ?? 1,
        status: data?.status || 'OPEN',
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { fetchCourseDetail(); }, [fetchCourseDetail]);
  useEffect(() => { if (courseId && activeTab === 'MATERIAL') fetchMaterials(courseId); }, [courseId, activeTab]);
  useEffect(() => { if (courseId && activeTab === 'MEMBER') fetchMembers(courseId); }, [courseId, activeTab]);

  async function fetchMaterials(id) {
    setLoading(true);
    try {
      const d = await getCourseMaterialsApi(id, { page: 0, size: 100 });
      setMaterials(d?.content || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMembers(id) {
    setLoading(true);
    try {
      const d = await getCourseEnrollmentsApi(id, { page: 0, size: 300 });
      setMembers((d?.content || []).filter((m) => (m.enrollmentStatus || '').toUpperCase() === 'APPROVED'));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!materialForm.file || !materialForm.name.trim()) {
      notifyError('Nhập tên và chọn file.');
      return;
    }
    setUploading(true);
    try {
      await uploadMaterialApi(courseId, materialForm);
      notifySuccess('Upload thành công.');
      setMaterialForm({ name: '', type: 'PDF', file: null });
      fetchMaterials(courseId);
    } catch (err) {
      notifyError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteMaterial(id) {
    const ok = await confirmAction({ title: 'Xóa tài liệu?', message: 'Bạn chắc chắn muốn xóa tài liệu này?', confirmText: 'Xóa', variant: 'danger' });
    if (!ok) return;
    try {
      await deleteMaterialApi(id);
      notifySuccess('Đã xóa tài liệu.');
      fetchMaterials(courseId);
    } catch (e) {
      notifyError(e.message);
    }
  }

  async function handleToggleMaterialStatus(m) {
    const id = m.materialId || m.id;
    const next = (m.status || '').toUpperCase() === 'HIDDEN' ? 'VISIBLE' : 'HIDDEN';
    try {
      await updateMaterialStatusApi(id, next);
      notifySuccess(next === 'HIDDEN' ? 'Đã ẩn tài liệu.' : 'Đã hiện tài liệu.');
      fetchMaterials(courseId);
    } catch (e) {
      notifyError(e.message);
    }
  }

  async function handleDownload(id) {
    try {
      const url = await getMaterialDownloadUrlApi(id);
      window.open(url, '_blank');
    } catch (e) {
      notifyError(e.message);
    }
  }

  async function handleUpdateCourse(e) {
    e.preventDefault();
    if (!courseId) return;
    try {
      await updateCourseApi(courseId, courseForm);
      notifySuccess('Đã cập nhật khóa học.');
      setShowCourseForm(false);
      fetchCourseDetail();
    } catch (err) {
      notifyError(err.message);
    }
  }

  async function handleRemoveMember(m) {
    const ok = await confirmAction({ title: 'Xóa thành viên?', message: `Xóa ${m.fullName} khỏi khóa học?`, confirmText: 'Xóa', variant: 'danger' });
    if (!ok) return;
    try {
      await updateEnrollmentStatusApi(courseId, m.userId, 'REJECTED');
      notifySuccess('Đã xóa thành viên.');
      fetchMembers(courseId);
    } catch (e) {
      notifyError(e.message);
    }
  }

  const tabs = [
    { key: 'MATERIAL', label: 'Tài liệu', icon: BookOpen },
    { key: 'EXAM', label: 'Bài thi', icon: FolderKanban },
    { key: 'MEMBER', label: 'Thành viên', icon: Users },
  ];

  return (
    <DashboardLayout title="Chi tiết khóa học" subtitle="Quản lý tài liệu, bài thi và thành viên.">
      {/* Top action bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <button className="btn-secondary btn-sm" onClick={() => navigate('/teacher')}><ArrowLeft size={14} /> Quay lại</button>
        <button className="btn-secondary btn-sm" onClick={() => setShowCourseForm(true)}><Settings size={14} /> Chỉnh sửa</button>
        <button className="btn-secondary btn-sm" onClick={fetchCourseDetail}><RefreshCcw size={14} /> Làm mới</button>
        <button className="btn-primary btn-sm" onClick={() => navigate(`/teacher/course/${courseId}/assessments`)}><FolderKanban size={14} /> Quản lý đề</button>
      </div>

      {/* Course info card */}
      <motion.div
        className="card"
        style={{ padding: '1.5rem', marginBottom: '1.25rem' }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{
            width: '3rem', height: '3rem', borderRadius: '0.75rem',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0,
          }}>
            <BookOpen size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontWeight: 700, fontSize: '1.15rem', marginBottom: '0.25rem', color: 'var(--color-text)' }}>
              {course?.name || '---'}
            </h2>
            {course?.description ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                {course.description}
              </p>
            ) : null}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', fontSize: '0.8rem' }}>
              <StatusBadge status={course?.status} />
              <span style={{ color: 'var(--color-text-muted)' }}>
                <Users size={13} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                {course?.currentEnrollment ?? 0} / {course?.maxStudent ?? '-'} sinh viên
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {error ? <p className="text-error" style={{ marginBottom: '0.75rem' }}>{error}</p> : null}

      {/* Tabs */}
      <div className="tab-group" style={{ marginBottom: '1rem' }}>
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              className={`tab-item ${activeTab === t.key ? 'tab-item-active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              <Icon size={14} style={{ marginRight: '0.35rem', verticalAlign: 'middle' }} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* MATERIAL tab */}
      {activeTab === 'MATERIAL' ? (
        <>
          <form
            onSubmit={handleUpload}
            className="card"
            style={{ padding: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '0.75rem', alignItems: 'end', marginBottom: '1rem' }}
          >
            <div className="field-group">
              <label className="field-label">Tên</label>
              <input className="input-field" value={materialForm.name} onChange={(e) => setMaterialForm((p) => ({ ...p, name: e.target.value }))} placeholder="Tên tài liệu..." />
            </div>
            <div className="field-group">
              <label className="field-label">Loại</label>
              <select className="input-field" value={materialForm.type} onChange={(e) => setMaterialForm((p) => ({ ...p, type: e.target.value }))}>
                <option>PDF</option>
                <option>DOCX</option>
                <option>PPTX</option>
                <option>MP4</option>
              </select>
            </div>
            <div className="field-group">
              <label className="field-label">File</label>
              <input className="input-field" type="file" onChange={(e) => setMaterialForm((p) => ({ ...p, file: e.target.files?.[0] }))} />
            </div>
            <button type="submit" className="btn-primary btn-sm" disabled={uploading}>
              <Upload size={14} /> {uploading ? 'Đang tải...' : 'Upload'}
            </button>
          </form>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="cell-center">#</th>
                  <th>Tên tài liệu</th>
                  <th className="cell-center">Loại</th>
                  <th className="cell-center">Trạng thái</th>
                  <th className="cell-center">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((m, i) => {
                  const id = m.materialId || m.id;
                  return (
                    <tr key={id}>
                      <td className="cell-center">{i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{getMaterialDisplayName(m)}</td>
                      <td className="cell-center">{m.type}</td>
                      <td className="cell-center"><StatusBadge status={m.status} /></td>
                      <td className="cell-center">
                        <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                          <button className="btn-secondary btn-sm" onClick={() => handleDownload(id)} title="Tải xuống"><Download size={14} /></button>
                          <button className="btn-secondary btn-sm" onClick={() => handleToggleMaterialStatus(m)}>
                            {(m.status || '').toUpperCase() === 'HIDDEN' ? 'Hiện' : 'Ẩn'}
                          </button>
                          <button className="btn-danger btn-sm" onClick={() => handleDeleteMaterial(id)} title="Xóa"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!materials.length && !loading ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Chưa có tài liệu nào.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      {/* EXAM tab */}
      {activeTab === 'EXAM' ? (
        <motion.div
          className="card"
          style={{ padding: '2rem', textAlign: 'center' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <FolderKanban size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4, color: '#6366f1' }} />
          <p style={{ color: '#64748b', marginBottom: '0.75rem' }}>Quản lý bài thi/luyện tập tại trang quản lý đề.</p>
          <button className="btn-primary btn-sm" onClick={() => navigate(`/teacher/course/${courseId}/assessments`)}>
            <FolderKanban size={14} /> Mở trang quản lý đề
          </button>
        </motion.div>
      ) : null}

      {/* MEMBER tab */}
      {activeTab === 'MEMBER' ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th className="cell-center">#</th>
                <th>Họ tên</th>
                <th>Email</th>
                <th className="cell-center">Trạng thái</th>
                <th className="cell-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m, i) => (
                <tr key={m.userId || i}>
                  <td className="cell-center">{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{m.fullName || '-'}</td>
                  <td>{m.email || '-'}</td>
                  <td className="cell-center"><StatusBadge status={m.enrollmentStatus} /></td>
                  <td className="cell-center">
                    <button className="btn-danger btn-sm" onClick={() => handleRemoveMember(m)}>
                      <Trash2 size={14} /> Xóa
                    </button>
                  </td>
                </tr>
              ))}
              {!members.length && !loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Chưa có thành viên nào.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* Course edit modal */}
      <Modal open={showCourseForm} onClose={() => setShowCourseForm(false)} title="Cập nhật khóa học">
        <form onSubmit={handleUpdateCourse} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="field-group">
            <label className="field-label">Tên khóa học</label>
            <input className="input-field" required value={courseForm.name} onChange={(e) => setCourseForm((p) => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="field-group">
            <label className="field-label">SV tối đa</label>
            <input className="input-field" type="number" min={1} value={courseForm.maxStudent} onChange={(e) => setCourseForm((p) => ({ ...p, maxStudent: Number(e.target.value) }))} />
          </div>
          <div className="field-group" style={{ gridColumn: 'span 2' }}>
            <label className="field-label">Mô tả</label>
            <textarea className="input-field" rows={3} value={courseForm.description} onChange={(e) => setCourseForm((p) => ({ ...p, description: e.target.value }))} />
          </div>
          <div className="field-group">
            <label className="field-label">Trạng thái</label>
            <select className="input-field" value={courseForm.status} onChange={(e) => setCourseForm((p) => ({ ...p, status: e.target.value }))}>
              <option value="OPEN">Mở</option>
              <option value="CLOSED">Đóng</option>
              <option value="HIDDEN">Ẩn</option>
            </select>
          </div>
          <div style={{ gridColumn: 'span 2', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={() => setShowCourseForm(false)}>Hủy</button>
            <button type="submit" className="btn-primary">Lưu thay đổi</button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
