import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, LibraryBig, Pencil, RefreshCcw } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { createAssessmentApi, deleteAssessmentApi, getAssessmentsByCourseApi, updateAssessmentApi, updateAssessmentStatusApi } from '../../api/assessmentApi';
import { getCoursesApi } from '../../api/courseApi';
import { getQuestionBanksApi, getQuestionsByBankApi } from '../../api/questionApi';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../hooks/useAuth';
import { confirmAction, notifySuccess } from '../../lib/notify';

function fmtDT(v) { return v ? new Date(v).toLocaleString('vi-VN') : 'Không giới hạn'; }
function toLocalDT(v) { if (!v) return ''; const d = new Date(v); if (isNaN(d)) return ''; return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; }
function getTypeLabel(v) { return (v||'').toUpperCase() === 'MULTIPLE_CHOICE' ? 'Trắc nghiệm' : (v||'').toUpperCase() === 'FILL_IN_BLANK' ? 'Điền khuyết' : v||'-'; }
function getDiffLabel(v) { const u = (v||'').toUpperCase(); return u === 'EASY' ? 'Dễ' : u === 'MEDIUM' ? 'Vừa' : u === 'HARD' ? 'Khó' : v||'-'; }

export function TeacherAssessmentManagerPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { courseId = '' } = useParams();
  const [activeTab, setActiveTab] = useState('EXAM');
  const [courses, setCourses] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [aLoading, setALoading] = useState(false);
  const [banks, setBanks] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [selectedBankId, setSelectedBankId] = useState('');
  const [selectedQIds, setSelectedQIds] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [creatingType, setCreatingType] = useState('');
  const [editingA, setEditingA] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', durationMinutes: 30, status: 'OPEN', gradingPolicy: 'LAST', expirationDate: '' });
  const [aForm, setAForm] = useState({ EXAM: { title: '', durationMinutes: 60, status: 'OPEN', gradingPolicy: 'LAST', expirationDate: '' }, EXERCISE: { title: '', durationMinutes: 30, status: 'OPEN', gradingPolicy: 'BEST', expirationDate: '' } });

  const selectedCourse = useMemo(() => courses.find((c) => String(c.id||c.courseId) === String(courseId)), [courses, courseId]);
  const selectedBank = useMemo(() => banks.find((b) => String(b.id) === String(selectedBankId)), [banks, selectedBankId]);
  const exams = useMemo(() => assessments.filter((a) => (a.assessmentType||'').toUpperCase() === 'EXAM'), [assessments]);
  const exercises = useMemo(() => assessments.filter((a) => (a.assessmentType||'').toUpperCase() === 'EXERCISE'), [assessments]);

  const fetchCourses = useCallback(async () => { try { const d = await getCoursesApi({ page: 0, size: 200 }); setCourses((d?.content||[]).filter((c) => String(c.teacherId) === String(user?.userId))); } catch (e) { setError(e.message); } }, [user?.userId]);
  const fetchBanks = useCallback(async () => { try { const d = await getQuestionBanksApi({ page: 0, size: 200 }); const b = d?.content||[]; setBanks(b); setSelectedBankId((p) => p || (b[0] ? String(b[0].id) : '')); } catch (e) { setError(e.message); } }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);
  useEffect(() => { if (courseId) fetchA(courseId); }, [courseId]);
  useEffect(() => { fetchBanks(); }, [fetchBanks]);
  useEffect(() => { if (selectedBankId) fetchQ(selectedBankId); else { setQuestions([]); setSelectedQIds([]); } }, [selectedBankId]);

  async function fetchA(cid) { setALoading(true); try { const d = await getAssessmentsByCourseApi(cid, { page: 0, size: 100 }); setAssessments(d?.content||[]); } catch (e) { setError(e.message); } finally { setALoading(false); } }
  async function fetchQ(bid) { try { const d = await getQuestionsByBankApi(bid, { page: 0, size: 300 }); setQuestions(d?.content||[]); } catch (e) { setError(e.message); } }

  function toggleQ(id) { setSelectedQIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]); }
  function updateAF(type, key, val) { setAForm((p) => ({ ...p, [type]: { ...p[type], [key]: val } })); }

  async function handleCreate(e, type) {
    e.preventDefault(); if (!selectedQIds.length) { setError('Chọn ít nhất 1 câu.'); return; }
    const f = aForm[type]; if (!f.title?.trim()) { setError('Nhập tiêu đề.'); return; }
    try {
      await createAssessmentApi({ title: f.title.trim(), courseId: selectedCourse?.id||selectedCourse?.courseId, assessmentType: type, durationSeconds: (f.durationMinutes||0)*60, status: f.status, maxAttempt: type === 'EXAM' ? 'ONCE' : 'UNLIMITED', gradingPolicy: type === 'EXERCISE' ? f.gradingPolicy : 'LAST', expirationDate: type === 'EXERCISE' ? null : (f.expirationDate||null), questionIds: selectedQIds });
      notifySuccess(type === 'EXAM' ? 'Đã tạo bài thi.' : 'Đã tạo bài luyện tập.');
      setAForm((p) => ({ ...p, [type]: { ...p[type], title: '', expirationDate: '' } }));
      setSelectedQIds([]); setCreatingType(''); fetchA(courseId);
    } catch (e) { setError(e.message); }
  }

  async function handleStatusToggle(id, next) { try { await updateAssessmentStatusApi(id, next); notifySuccess(next === 'OPEN' ? 'Đã mở.' : 'Đã đóng.'); fetchA(courseId); } catch (e) { setError(e.message); } }
  async function handleDelete(id) { const ok = await confirmAction({ title: 'Xóa bài?', confirmText: 'Xóa', variant: 'danger' }); if (!ok) return; try { await deleteAssessmentApi(id); notifySuccess('Đã xóa.'); fetchA(courseId); } catch (e) { setError(e.message); } }
  function openEdit(a) { setEditingA(a); setEditForm({ title: a.title||'', durationMinutes: Math.max(1, Math.round((a.durationSeconds||0)/60)), status: a.status||'OPEN', gradingPolicy: a.gradingPolicy||'LAST', expirationDate: (a.assessmentType||'').toUpperCase() === 'EXERCISE' ? '' : toLocalDT(a.expirationDate) }); }
  async function handleSaveEdit(e) { e.preventDefault(); if (!editingA) return; const isPrac = (editingA.assessmentType||'').toUpperCase() === 'EXERCISE'; try { await updateAssessmentApi(editingA.id, { title: editForm.title.trim(), durationSeconds: editForm.durationMinutes*60, status: editForm.status, gradingPolicy: isPrac ? editForm.gradingPolicy : 'LAST', expirationDate: isPrac ? null : (editForm.expirationDate||null), clearExpirationDate: isPrac ? true : !editForm.expirationDate }); notifySuccess('Đã cập nhật.'); setEditingA(null); fetchA(courseId); } catch (e) { setError(e.message); } }

  function renderTab(type, title, items) {
    return (
      <>
        <button className="btn-primary btn-sm" style={{ marginBottom: '1rem' }} onClick={() => { setSelectedQIds([]); setCreatingType(type); }}><Plus size={14} /> Tạo {title.toLowerCase()} mới</button>
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Tên</th><th>Thời gian</th><th>Số câu</th><th>Trạng thái</th><th>Hạn nộp</th><th>Thao tác</th></tr></thead>
            <tbody>
              {items.map((a) => { const s = (a.status||'').toUpperCase(); const next = s === 'OPEN' ? 'CLOSED' : 'OPEN'; return (
                <tr key={a.id}><td style={{ fontWeight: 600 }}>{a.title}</td><td>{Math.round((a.durationSeconds||0)/60)} phút</td><td>{a.itemCount||0}</td><td><StatusBadge status={a.status} /></td><td>{(a.assessmentType||'').toUpperCase() === 'EXERCISE' ? 'N/A' : fmtDT(a.expirationDate)}</td>
                  <td><div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}><button className="btn-secondary btn-sm" onClick={() => handleStatusToggle(a.id, next)}>{next === 'OPEN' ? 'Mở' : 'Đóng'}</button><button className="btn-secondary btn-sm" onClick={() => openEdit(a)}><Pencil size={14} /></button><button className="btn-danger btn-sm" onClick={() => handleDelete(a.id)}>Xóa</button></div></td></tr>
              ); })}
              {!items.length && !aLoading ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Chưa có {title.toLowerCase()}.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  return (
    <DashboardLayout title="Quản lý đề" subtitle="Tạo và quản lý bài thi, bài luyện tập.">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <button className="btn-secondary btn-sm" onClick={() => navigate(`/teacher/course/${courseId}/detail`)}><ArrowLeft size={14} /> Quay lại</button>
        <button className="btn-secondary btn-sm" onClick={() => fetchA(courseId)}><RefreshCcw size={14} /> Làm mới</button>
      </div>

      {error ? <p className="text-error" style={{ marginBottom: '0.75rem' }}>{error}</p> : null}
      {notice ? <p className="text-success" style={{ marginBottom: '0.75rem' }}>{notice}</p> : null}

      <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
        <p style={{ fontSize: '0.875rem' }}>Khóa học: <strong>{selectedCourse?.name||'---'}</strong> · <StatusBadge status={selectedCourse?.status} /> · {selectedCourse?.approvedEnrollmentCount??0} SV</p>
      </div>

      <div className="tab-group" style={{ marginBottom: '1rem' }}>
        <button className={`tab-item ${activeTab === 'EXAM' ? 'tab-item-active' : ''}`} onClick={() => setActiveTab('EXAM')}>Bài thi</button>
        <button className={`tab-item ${activeTab === 'PRACTICE' ? 'tab-item-active' : ''}`} onClick={() => setActiveTab('PRACTICE')}>Bài luyện tập</button>
      </div>

      {activeTab === 'EXAM' ? renderTab('EXAM', 'Bài thi', exams) : renderTab('EXERCISE', 'Bài luyện tập', exercises)}

      {/* Edit Modal */}
      <Modal open={!!editingA} onClose={() => setEditingA(null)} title={`Sửa ${(editingA?.assessmentType||'') === 'EXERCISE' ? 'bài luyện tập' : 'bài thi'}`}>
        <form onSubmit={handleSaveEdit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="field-group" style={{ gridColumn: 'span 2' }}><label className="field-label">Tiêu đề</label><input className="input-field" value={editForm.title} onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))} /></div>
          <div className="field-group"><label className="field-label">Thời lượng (phút)</label><input className="input-field" type="number" min={1} value={editForm.durationMinutes} onChange={(e) => setEditForm((p) => ({ ...p, durationMinutes: Number(e.target.value) }))} /></div>
          <div className="field-group"><label className="field-label">Trạng thái</label><select className="input-field" value={editForm.status} onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}><option value="OPEN">Mở</option><option value="CLOSED">Đóng</option></select></div>
          {(editingA?.assessmentType||'') === 'EXERCISE' ? <div className="field-group"><label className="field-label">Cách chấm</label><select className="input-field" value={editForm.gradingPolicy} onChange={(e) => setEditForm((p) => ({ ...p, gradingPolicy: e.target.value }))}><option value="BEST">Điểm cao nhất</option><option value="LAST">Lần gần nhất</option></select></div> : null}
          {(editingA?.assessmentType||'') !== 'EXERCISE' ? <div className="field-group" style={{ gridColumn: 'span 2' }}><label className="field-label">Hạn nộp</label><input className="input-field" type="datetime-local" value={editForm.expirationDate} onChange={(e) => setEditForm((p) => ({ ...p, expirationDate: e.target.value }))} /></div> : null}
          <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}><button type="button" className="btn-secondary" onClick={() => setEditingA(null)}>Hủy</button><button type="submit" className="btn-primary">Lưu</button></div>
        </form>
      </Modal>

      {/* Create Modal */}
      <Modal open={!!creatingType} onClose={() => { setCreatingType(''); setSelectedQIds([]); }} title={`Tạo ${creatingType === 'EXAM' ? 'bài thi' : 'bài luyện tập'} mới`} maxWidth="56rem">
        <form onSubmit={(e) => handleCreate(e, creatingType)} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="field-group" style={{ gridColumn: 'span 2' }}><label className="field-label">Tiêu đề</label><input className="input-field" value={aForm[creatingType]?.title||''} onChange={(e) => updateAF(creatingType, 'title', e.target.value)} /></div>
          <div className="field-group"><label className="field-label">Thời lượng (phút)</label><input className="input-field" type="number" min={1} value={aForm[creatingType]?.durationMinutes||1} onChange={(e) => updateAF(creatingType, 'durationMinutes', Number(e.target.value))} /></div>
          <div className="field-group"><label className="field-label">Trạng thái</label><select className="input-field" value={aForm[creatingType]?.status||'OPEN'} onChange={(e) => updateAF(creatingType, 'status', e.target.value)}><option value="OPEN">Mở</option><option value="CLOSED">Đóng</option></select></div>
          {creatingType === 'EXERCISE' ? <div className="field-group"><label className="field-label">Cách chấm</label><select className="input-field" value={aForm.EXERCISE.gradingPolicy} onChange={(e) => updateAF('EXERCISE', 'gradingPolicy', e.target.value)}><option value="BEST">Điểm cao nhất</option><option value="LAST">Lần gần nhất</option></select></div> : null}
          {creatingType !== 'EXERCISE' ? <div className="field-group" style={{ gridColumn: 'span 2' }}><label className="field-label">Hạn nộp</label><input className="input-field" type="datetime-local" value={aForm[creatingType]?.expirationDate||''} onChange={(e) => updateAF(creatingType, 'expirationDate', e.target.value)} /></div> : null}

          <div className="card" style={{ gridColumn: 'span 2', padding: '1rem' }}>
            <h4 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>Chọn câu hỏi ({selectedQIds.length} đã chọn)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <select className="input-field" value={selectedBankId} onChange={(e) => setSelectedBankId(e.target.value)}>
                <option value="">-- Ngân hàng --</option>
                {banks.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.questionCount})</option>)}
              </select>
              <button type="button" className="btn-secondary btn-sm" onClick={() => navigate('/teacher/question-banks')}><LibraryBig size={14} /> Quản lý</button>
            </div>
            <div className="table-container" style={{ maxHeight: '16rem', overflow: 'auto' }}>
              <table className="data-table">
                <thead><tr><th style={{ width: '2.5rem' }}>Chọn</th><th>Nội dung</th><th>Loại</th><th>Độ khó</th></tr></thead>
                <tbody>
                  {questions.map((q) => (
                    <tr key={q.id}><td><input type="checkbox" checked={selectedQIds.includes(q.id)} onChange={() => toggleQ(q.id)} /></td><td><span className="text-ellipsis-1" style={{ maxWidth: '20rem' }}>{q.questionContent}</span></td><td>{getTypeLabel(q.questionType)}</td><td>{getDiffLabel(q.difficulty)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}><button type="button" className="btn-secondary" onClick={() => { setCreatingType(''); setSelectedQIds([]); }}>Hủy</button><button type="submit" className="btn-primary">Tạo</button></div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}

function Plus({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
