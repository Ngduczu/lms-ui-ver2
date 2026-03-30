import { useCallback, useEffect, useState } from 'react';
import { FileSpreadsheet, RefreshCcw, Eye } from 'lucide-react';
import { getAssessmentDetailApi, getAssessmentAttemptDetailApi, getAssessmentAttemptsApi, getAssessmentsByCourseApi, getMyAssessmentAttemptsApi, getAssessmentAttemptRankingsApi } from '../../api/assessmentApi';
import { getCoursesApi } from '../../api/courseApi';
import { getMyEnrollmentsApi } from '../../api/enrollmentApi';
import { useAuth } from '../../hooks/useAuth';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { PageHeader } from '../../components/ui/PageHeader';
import { Modal } from '../../components/ui/Modal';
import { exportAssessmentToExcel } from '../../lib/excel';
import { notifyError, notifySuccess } from '../../lib/notify';

function fmtDT(v) { return v ? new Date(v).toLocaleString('vi-VN') : '-'; }

function formatDuration(sec) {
  if (sec == null || sec < 0) return '-';
  if (sec > 1000000) return 'Chưa nộp'; // Handle max long value
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}p ${s}s` : `${s}s`;
}

export function AssessmentHistoryPage() {
  const { user, role } = useAuth();
  const isTeacherOrAdmin = role === 'TEACHER' || role === 'ADMIN';

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [assessments, setAssessments] = useState([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('');
  const [attempts, setAttempts] = useState([]);
  const [rankings, setRankings] = useState([]);
  const [activeTab, setActiveTab] = useState('ATTEMPTS');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [detailModal, setDetailModal] = useState(null);

  const selectedAssessment = assessments.find((a) => String(a.id) === String(selectedAssessmentId));

  const fetchCourses = useCallback(async () => {
    try {
      if (isTeacherOrAdmin) {
        const d = await getCoursesApi({ page: 0, size: 300 });
        const all = d?.content || [];
        if (role === 'TEACHER') setCourses(all.filter((c) => String(c.teacherId) === String(user?.userId)));
        else setCourses(all);
      } else {
        const d = await getMyEnrollmentsApi({ page: 0, size: 300 });
        setCourses((d?.content || []).filter((e) => e.enrollmentStatus === 'APPROVED').map((e) => ({ id: e.courseId, courseId: e.courseId, name: e.courseName })));
      }
    } catch (e) { setError(e.message); }
  }, [role, user?.userId]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  useEffect(() => {
    if (!selectedCourseId) { setAssessments([]); return; }
    (async () => { try { const d = await getAssessmentsByCourseApi(selectedCourseId, { page: 0, size: 100 }); setAssessments(d?.content || []); } catch (e) { setError(e.message); } })();
  }, [selectedCourseId]);

  useEffect(() => {
    if (!selectedAssessmentId) { setAttempts([]); setRankings([]); return; }
    fetchAttempts(selectedAssessmentId);
    if (isTeacherOrAdmin) fetchRankings(selectedAssessmentId);
  }, [selectedAssessmentId]);

  async function fetchAttempts(aId) {
    setLoading(true);
    try {
      const d = isTeacherOrAdmin ? await getAssessmentAttemptsApi(aId, { page: 0, size: 300 }) : await getMyAssessmentAttemptsApi(aId);
      setAttempts(d?.content || (Array.isArray(d) ? d : []));
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }

  async function fetchRankings(aId) {
    try { const d = await getAssessmentAttemptRankingsApi(aId); setRankings(Array.isArray(d) ? d : (d?.content || [])); } catch {}
  }

  async function viewDetail(attemptId) {
    try {
      const d = await getAssessmentAttemptDetailApi(selectedAssessmentId, attemptId);
      setDetailModal(d);
    } catch (e) { notifyError(e.message); }
  }

  async function handleExportExcel() {
    if (!selectedAssessment) { notifyError('Chọn bài thi trước.'); return; }
    try {
      const allAttempts = await getAssessmentAttemptsApi(selectedAssessmentId, { page: 0, size: 1000 });
      const attemptList = allAttempts?.content || [];
      const detailedAttempts = [];

      for (const attempt of attemptList) {
        try {
          const detail = await getAssessmentAttemptDetailApi(selectedAssessmentId, attempt.attemptId || attempt.id);
          detailedAttempts.push({
            studentName: attempt.studentName || detail.studentName || '-',
            studentEmail: attempt.studentEmail || detail.studentEmail || '-',
            startTime: attempt.startTime || detail.startTime,
            submitTime: attempt.submitTime || detail.submitTime,
            violationCount: attempt.violationCount ?? detail.violationCount ?? 0,
            score: attempt.score ?? detail.score ?? 0,
            questionDetails: detail.questionDetails || detail.answers || [],
          });
        } catch {
          detailedAttempts.push({
            studentName: attempt.studentName || '-',
            studentEmail: attempt.studentEmail || '-',
            startTime: attempt.startTime,
            submitTime: attempt.submitTime,
            violationCount: attempt.violationCount ?? 0,
            score: attempt.score ?? 0,
            questionDetails: [],
          });
        }
      }

      // Infer question count from the first detailed attempt
      const assessmentDetail = await getAssessmentDetailApi(selectedAssessmentId);
      const questions = assessmentDetail.items || assessmentDetail.questions || [];

      exportAssessmentToExcel({
        attempts: detailedAttempts,
        assessmentTitle: selectedAssessment.title,
        questions,
      });
      notifySuccess('Đã xuất file Excel.');
    } catch (e) { notifyError(e.message || 'Lỗi khi xuất Excel.'); }
  }

  const showAnswer = selectedAssessment && ((selectedAssessment.assessmentType || '').toUpperCase() === 'EXERCISE' || isTeacherOrAdmin);

  return (
    <DashboardLayout title="Lịch sử bài thi" subtitle="Xem lại kết quả các bài thi và luyện tập.">
      <PageHeader title="Lịch sử bài thi" actions={
        <>
          {isTeacherOrAdmin && selectedAssessmentId ? <button className="btn-primary btn-sm" onClick={handleExportExcel}><FileSpreadsheet size={14} /> Xuất Excel</button> : null}
        </>
      } />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem', maxWidth: '36rem' }}>
        <div className="field-group">
          <label className="field-label">Khóa học</label>
          <select className="input-field" value={selectedCourseId} onChange={(e) => { setSelectedCourseId(e.target.value); setSelectedAssessmentId(''); }}>
            <option value="">-- Chọn --</option>
            {courses.map((c) => <option key={c.id || c.courseId} value={c.id || c.courseId}>{c.name}</option>)}
          </select>
        </div>
        <div className="field-group">
          <label className="field-label">Bài thi / Luyện tập</label>
          <select className="input-field" value={selectedAssessmentId} onChange={(e) => setSelectedAssessmentId(e.target.value)}>
            <option value="">-- Chọn --</option>
            {assessments.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
          </select>
        </div>
      </div>

      {error ? <p className="text-error" style={{ marginBottom: '0.75rem' }}>{error}</p> : null}

      {isTeacherOrAdmin ? (
        <div className="tab-group" style={{ marginBottom: '1rem' }}>
          <button className={`tab-item ${activeTab === 'ATTEMPTS' ? 'tab-item-active' : ''}`} onClick={() => setActiveTab('ATTEMPTS')}>Lịch sử nộp</button>
          <button className={`tab-item ${activeTab === 'RANKINGS' ? 'tab-item-active' : ''}`} onClick={() => setActiveTab('RANKINGS')}>Bảng xếp hạng</button>
        </div>
      ) : null}

      {activeTab === 'ATTEMPTS' ? (
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th className="cell-center">#</th>{isTeacherOrAdmin ? <th>Họ tên</th> : null}{isTeacherOrAdmin ? <th>Email</th> : null}<th>Thời gian bắt đầu</th><th>Thời gian nộp</th><th className="cell-center">Vi phạm</th><th className="cell-center">Điểm</th><th className="cell-center">Chi tiết</th></tr></thead>
            <tbody>
              {attempts.map((a, i) => (
                <tr key={a.attemptId || a.id || i}>
                  <td className="cell-center">{i + 1}</td>
                  {isTeacherOrAdmin ? <td>{a.studentName || '-'}</td> : null}
                  {isTeacherOrAdmin ? <td>{a.studentEmail || '-'}</td> : null}
                  <td>{fmtDT(a.startTime)}</td>
                  <td>{fmtDT(a.submitTime)}</td>
                  <td className="cell-center"><span style={{ fontWeight: 700, color: (a.violationCount) > 0 ? '#dc2626' : '#059669' }}>{a.violationCount}</span></td>
                  <td className="cell-center"><span style={{ fontWeight: 700 }}>{a.score ?? '-'}</span></td>
                  <td className="cell-center"><button className="btn-secondary btn-sm" onClick={() => viewDetail(a.attemptId || a.id)}><Eye size={14} /></button></td>
                </tr>
              ))}
              {!attempts.length && !loading ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>{selectedAssessmentId ? 'Chưa có lượt nộp.' : 'Chọn bài thi để xem.'}</td></tr> : null}
            </tbody>
          </table>
        </div>
      ) : null}

      {activeTab === 'RANKINGS' ? (
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th className="cell-center">Hạng</th><th>Họ tên</th><th>Email</th><th className="cell-center">Thời gian làm</th><th className="cell-center">Điểm</th></tr></thead>
            <tbody>
              {rankings.map((r, i) => (
                <tr key={r.userId || i}>
                  <td className="cell-center" style={{ fontWeight: 700, color: i < 3 ? '#d97706' : undefined }}>{i + 1}</td>
                  <td>{r.studentName || r.fullName || '-'}</td>
                  <td>{r.studentEmail || r.email || '-'}</td>
                  <td className="cell-center">{formatDuration(r.durationSeconds)}</td>
                  <td className="cell-center" style={{ fontWeight: 700 }}>{r.score ?? '-'}</td>
                </tr>
              ))}
              {!rankings.length ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Chưa có dữ liệu.</td></tr> : null}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* Detail Modal */}
      <Modal open={!!detailModal} onClose={() => setDetailModal(null)} title="Chi tiết bài nộp" maxWidth="52rem">
        {detailModal ? (
          <div style={{ maxHeight: '65vh', overflowY: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.8125rem' }}>
              <p><strong>Điểm:</strong> {detailModal.score ?? '-'}</p>
              <p><strong>Nộp lúc:</strong> {fmtDT(detailModal.submitTime)}</p>
              <p><strong>Vi phạm:</strong> <span style={{ fontWeight: 700, color: (detailModal.violationCount || 0) > 0 ? '#dc2626' : '#059669' }}>{detailModal.violationCount || 0}</span></p>
            </div>
            {(detailModal.questionDetails || detailModal.answers || []).map((qd, i) => {
              const isCorrect = Boolean(qd.correct ?? qd.isCorrect);
              return (
                <div key={i} style={{ marginBottom: '0.75rem', padding: '0.75rem', borderRadius: '0.5rem', border: `1.5px solid ${isCorrect ? '#86efac' : '#fecaca'}`, background: isCorrect ? '#f0fdf4' : '#fef2f2' }}>
                  <p style={{ fontWeight: 600, marginBottom: '0.375rem' }}>Câu {i + 1}: {qd.questionContentSnapshot || qd.questionContent || '-'}</p>
                  <p style={{ fontSize: '0.8125rem' }}>Đáp án chọn: <strong>{qd.selectedAnswerSnapshot || qd.selectedAnswer || '(bỏ trống)'}</strong></p>
                  {showAnswer ? <p style={{ fontSize: '0.8125rem', color: '#059669' }}>Đáp án đúng: <strong>{qd.correctAnswerSnapshot || qd.correctAnswer || '-'}</strong></p> : null}
                  <span className={`badge ${isCorrect ? 'badge-green' : 'badge-red'}`} style={{ marginTop: '0.25rem' }}><span className="badge-dot" />{isCorrect ? 'Đúng' : 'Sai'}</span>
                </div>
              );
            })}
          </div>
        ) : null}
      </Modal>
    </DashboardLayout>
  );
}
