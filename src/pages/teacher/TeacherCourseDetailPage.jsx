import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Download, FolderKanban, RefreshCcw, Trash2, Upload } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCoursesApi, updateCourseApi } from '../../api/courseApi';
import { getCourseEnrollmentsApi, updateEnrollmentStatusApi } from '../../api/enrollmentApi';
import { deleteMaterialApi, getCourseMaterialsApi, getMaterialDownloadUrlApi, uploadMaterialApi, updateMaterialStatusApi } from '../../api/materialApi';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../hooks/useAuth';
import { confirmAction, notifySuccess } from '../../lib/notify';

function getMaterialDisplayName(item) {
  const name = String(item?.name || '').trim();
  if (name) return name;
  try { const u = new URL(item?.fileUrl || ''); const i = u.pathname.indexOf('/o/'); if (i < 0) return '-'; return decodeURIComponent(u.pathname.slice(i + 3)).split('/').pop() || '-'; } catch { return '-'; }
}

export function TeacherCourseDetailPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { courseId = '' } = useParams();
  const [courses, setCourses] = useState([]);
  const [activeTab, setActiveTab] = useState('MATERIAL');
  const [materials, setMaterials] = useState([]);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [materialForm, setMaterialForm] = useState({ name: '', type: 'PDF', file: null });
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [courseForm, setCourseForm] = useState({ name: '', description: '', maxStudent: 1, status: 'OPEN' });

  const selectedCourse = useMemo(() => courses.find((c) => String(c.id || c.courseId) === String(courseId)), [courses, courseId]);

  const fetchMyCourses = useCallback(async () => {
    try { const data = await getCoursesApi({ page: 0, size: 200 }); setCourses((data?.content || []).filter((c) => String(c.teacherId) === String(user?.userId))); } catch (e) { setError(e.message); }
  }, [user?.userId]);

  useEffect(() => { fetchMyCourses(); }, [fetchMyCourses]);
  useEffect(() => { if (courseId && activeTab === 'MATERIAL') fetchMaterials(courseId); }, [courseId, activeTab]);
  useEffect(() => { if (courseId && activeTab === 'MEMBER') fetchMembers(courseId); }, [courseId, activeTab]);
  useEffect(() => { if (selectedCourse) setCourseForm({ name: selectedCourse.name || '', description: selectedCourse.description || '', maxStudent: selectedCourse.max_Student ?? selectedCourse.maxStudent ?? 1, status: selectedCourse.status || 'OPEN' }); }, [selectedCourse]);

  async function fetchMaterials(id) { setLoading(true); try { const d = await getCourseMaterialsApi(id, { page: 0, size: 100 }); setMaterials(d?.content || []); } catch (e) { setError(e.message); } finally { setLoading(false); } }
  async function fetchMembers(id) { setLoading(true); try { const d = await getCourseEnrollmentsApi(id, { page: 0, size: 300 }); setMembers((d?.content || []).filter((m) => (m.enrollmentStatus || '').toUpperCase() === 'APPROVED')); } catch (e) { setError(e.message); } finally { setLoading(false); } }

  async function handleUpload(e) { e.preventDefault(); if (!materialForm.file || !materialForm.name.trim()) { setError('Nhập tên và chọn file.'); return; } setUploading(true); try { await uploadMaterialApi(courseId, materialForm); notifySuccess('Upload thành công.'); setMaterialForm({ name: '', type: 'PDF', file: null }); fetchMaterials(courseId); } catch (err) { setError(err.message); } finally { setUploading(false); } }
  async function handleDeleteMaterial(id) { const ok = await confirmAction({ title: 'Xóa tài liệu?', message: 'Bạn chắc chắn?', confirmText: 'Xóa', variant: 'danger' }); if (!ok) return; try { await deleteMaterialApi(id); notifySuccess('Đã xóa.'); fetchMaterials(courseId); } catch (e) { setError(e.message); } }
  async function handleToggleMaterialStatus(m) { const id = m.materialId || m.id; const next = (m.status || '').toUpperCase() === 'HIDDEN' ? 'VISIBLE' : 'HIDDEN'; try { await updateMaterialStatusApi(id, next); notifySuccess(next === 'HIDDEN' ? 'Đã ẩn.' : 'Đã hiện.'); fetchMaterials(courseId); } catch (e) { setError(e.message); } }
  async function handleDownload(id) { try { const url = await getMaterialDownloadUrlApi(id); window.open(url, '_blank'); } catch (e) { setError(e.message); } }
  async function handleUpdateCourse(e) { e.preventDefault(); const id = selectedCourse?.id || selectedCourse?.courseId; if (!id) return; try { await updateCourseApi(id, courseForm); notifySuccess('Đã cập nhật.'); setShowCourseForm(false); fetchMyCourses(); } catch (err) { setError(err.message); } }
  async function handleRemoveMember(m) { const ok = await confirmAction({ title: 'Xóa thành viên?', message: `Xóa ${m.fullName}?`, confirmText: 'Xóa', variant: 'danger' }); if (!ok) return; try { await updateEnrollmentStatusApi(courseId, m.userId, 'REJECTED'); notifySuccess('Đã xóa.'); fetchMembers(courseId); } catch (e) { setError(e.message); } }

  const tabs = [
    { key: 'MATERIAL', label: 'Tài liệu' },
    { key: 'EXAM', label: 'Bài thi' },
    { key: 'MEMBER', label: 'Thành viên' },
  ];

  return (
    <DashboardLayout title="Chi tiết khóa học" subtitle="Quản lý tài liệu, bài thi và thành viên.">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <button className="btn-secondary btn-sm" onClick={() => navigate('/teacher')}><ArrowLeft size={14} /> Quay lại</button>
        <button className="btn-secondary btn-sm" onClick={() => setShowCourseForm(true)}>Chỉnh sửa khóa học</button>
        <button className="btn-primary btn-sm" onClick={() => navigate(`/teacher/course/${courseId}/assessments`)}><FolderKanban size={14} /> Quản lý đề</button>
      </div>

      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{selectedCourse?.name || '---'}</h3>
        <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>Trạng thái: <StatusBadge status={selectedCourse?.status} /> · {selectedCourse?.approvedEnrollmentCount ?? 0} sinh viên</p>
      </div>

      {error ? <p className="text-error" style={{ marginBottom: '0.75rem' }}>{error}</p> : null}

      <div className="tab-group" style={{ marginBottom: '1rem' }}>
        {tabs.map((t) => <button key={t.key} className={`tab-item ${activeTab === t.key ? 'tab-item-active' : ''}`} onClick={() => setActiveTab(t.key)}>{t.label}</button>)}
      </div>

      {activeTab === 'MATERIAL' ? (
        <>
          <form onSubmit={handleUpload} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '0.75rem', alignItems: 'end', marginBottom: '1rem' }}>
            <div className="field-group"><label className="field-label">Tên</label><input className="input-field" value={materialForm.name} onChange={(e) => setMaterialForm((p) => ({ ...p, name: e.target.value }))} /></div>
            <div className="field-group"><label className="field-label">Loại</label><select className="input-field" value={materialForm.type} onChange={(e) => setMaterialForm((p) => ({ ...p, type: e.target.value }))}><option>PDF</option><option>DOCX</option><option>PPTX</option><option>MP4</option></select></div>
            <div className="field-group"><label className="field-label">File</label><input className="input-field" type="file" onChange={(e) => setMaterialForm((p) => ({ ...p, file: e.target.files?.[0] }))} /></div>
            <button type="submit" className="btn-primary btn-sm" disabled={uploading}><Upload size={14} /> {uploading ? 'Đang tải...' : 'Upload'}</button>
          </form>
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th className="cell-center">#</th><th>Tên tài liệu</th><th className="cell-center">Loại</th><th className="cell-center">Trạng thái</th><th className="cell-center">Hành động</th></tr></thead>
              <tbody>
                {materials.map((m, i) => { const id = m.materialId || m.id; return (
                  <tr key={id}><td className="cell-center">{i + 1}</td><td>{getMaterialDisplayName(m)}</td><td className="cell-center">{m.type}</td><td className="cell-center"><StatusBadge status={m.status} /></td>
                    <td className="cell-center"><div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}><button className="btn-secondary btn-sm" onClick={() => handleDownload(id)}><Download size={14} /></button><button className="btn-secondary btn-sm" onClick={() => handleToggleMaterialStatus(m)}>{(m.status || '').toUpperCase() === 'HIDDEN' ? 'Hiện' : 'Ẩn'}</button><button className="btn-danger btn-sm" onClick={() => handleDeleteMaterial(id)}><Trash2 size={14} /></button></div></td></tr>
                ); })}
                {!materials.length && !loading ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Chưa có tài liệu.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      {activeTab === 'EXAM' ? (
        <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <p style={{ color: '#64748b', marginBottom: '0.75rem' }}>Quản lý bài thi/luyện tập tại trang quản lý đề.</p>
          <button className="btn-primary btn-sm" onClick={() => navigate(`/teacher/course/${courseId}/assessments`)}><FolderKanban size={14} /> Mở trang quản lý đề</button>
        </div>
      ) : null}

      {activeTab === 'MEMBER' ? (
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th className="cell-center">#</th><th>Họ tên</th><th>Email</th><th className="cell-center">Trạng thái</th><th className="cell-center">Thao tác</th></tr></thead>
            <tbody>
              {members.map((m, i) => (
                <tr key={m.userId || i}><td className="cell-center">{i + 1}</td><td style={{ fontWeight: 600 }}>{m.fullName || '-'}</td><td>{m.email || '-'}</td><td className="cell-center"><StatusBadge status={m.enrollmentStatus} /></td>
                  <td className="cell-center"><button className="btn-danger btn-sm" onClick={() => handleRemoveMember(m)}><Trash2 size={14} /> Xóa</button></td></tr>
              ))}
              {!members.length && !loading ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Chưa có thành viên.</td></tr> : null}
            </tbody>
          </table>
        </div>
      ) : null}

      <Modal open={showCourseForm} onClose={() => setShowCourseForm(false)} title="Cập nhật khóa học">
        <form onSubmit={handleUpdateCourse} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="field-group"><label className="field-label">Tên</label><input className="input-field" required value={courseForm.name} onChange={(e) => setCourseForm((p) => ({ ...p, name: e.target.value }))} /></div>
          <div className="field-group"><label className="field-label">SV tối đa</label><input className="input-field" type="number" min={1} value={courseForm.maxStudent} onChange={(e) => setCourseForm((p) => ({ ...p, maxStudent: Number(e.target.value) }))} /></div>
          <div className="field-group" style={{ gridColumn: 'span 2' }}><label className="field-label">Mô tả</label><textarea className="input-field" rows={3} value={courseForm.description} onChange={(e) => setCourseForm((p) => ({ ...p, description: e.target.value }))} /></div>
          <div className="field-group"><label className="field-label">Trạng thái</label><select className="input-field" value={courseForm.status} onChange={(e) => setCourseForm((p) => ({ ...p, status: e.target.value }))}><option value="OPEN">Mở</option><option value="CLOSED">Đóng</option><option value="HIDDEN">Ẩn</option></select></div>
          <div style={{ gridColumn: 'span 2', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}><button type="button" className="btn-secondary" onClick={() => setShowCourseForm(false)}>Hủy</button><button type="submit" className="btn-primary">Lưu</button></div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
