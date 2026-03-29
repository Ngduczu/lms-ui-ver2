import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Download } from 'lucide-react';
import {
  getAssessmentsByCourseApi,
  getMyAssessmentAttemptsApi,
} from '../../api/assessmentApi';
import { getCourseMaterialsApi, getMaterialDownloadUrlApi } from '../../api/materialApi';
import { notifyInfo } from '../../lib/notify';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { StatusBadge } from '../../components/ui/StatusBadge';

const TABS = {
  MATERIAL: 'MATERIAL',
  EXAM: 'EXAM',
  PRACTICE: 'PRACTICE',
};

function fmtDT(v) {
  return v ? new Date(v).toLocaleString('vi-VN') : 'Không giới hạn';
}

export function CourseDetailPage() {
  const { courseId = '' } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(TABS.MATERIAL);
  const [materials, setMaterials] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [completedExamIds, setCompletedExamIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /* ── Fetch tài liệu ── */
  useEffect(() => {
    if (courseId && activeTab === TABS.MATERIAL) fetchMaterials(courseId);
  }, [courseId, activeTab]);

  /* ── Fetch bài kiểm tra / luyện tập ── */
  useEffect(() => {
    if (courseId && (activeTab === TABS.EXAM || activeTab === TABS.PRACTICE)) {
      fetchAssessments(courseId);
    }
  }, [courseId, activeTab]);

  async function fetchMaterials(id) {
    setLoading(true);
    setError('');
    try {
      const d = await getCourseMaterialsApi(id, { page: 0, size: 100 });
      setMaterials(
        (d?.content || []).filter((m) => (m.status || '').toUpperCase() !== 'HIDDEN'),
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAssessments(id) {
    setLoading(true);
    setError('');
    try {
      const d = await getAssessmentsByCourseApi(id, { page: 0, size: 100 });
      const allAssessments = d?.content || [];
      setAssessments(allAssessments);

      // Pre-fetch trạng thái đã làm cho tất cả bài thi (EXAM) → để thông báo ngay khi click
      const exams = allAssessments.filter(
        (a) => (a.assessmentType || '').toUpperCase() === 'EXAM',
      );
      if (exams.length > 0) {
        const completed = new Set();
        await Promise.all(
          exams.map(async (exam) => {
            try {
              const attempts = await getMyAssessmentAttemptsApi(exam.id);
              if ((attempts || []).length > 0) {
                completed.add(exam.id);
              }
            } catch {
              // Bỏ qua lỗi đơn lẻ
            }
          }),
        );
        setCompletedExamIds(completed);
      } else {
        setCompletedExamIds(new Set());
      }
    } catch (e) {
      setError(e.message);
      setAssessments([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(mId) {
    try {
      const url = await getMaterialDownloadUrlApi(mId);
      window.open(url, '_blank');
    } catch (e) {
      setError(e.message);
    }
  }

  function handleStartAttempt(assessment) {
    const assessmentId = assessment?.id;
    if (!assessmentId) return;

    const isExam = (assessment.assessmentType || '').toUpperCase() === 'EXAM';

    // Nếu là bài thi đã làm rồi → thông báo nổi ngay lập tức (không cần gọi API)
    if (isExam && completedExamIds.has(assessmentId)) {
      notifyInfo('Bạn đã làm bài thi này rồi, không thể làm lại.');
      return;
    }

    navigate(`/student/assessment/${assessmentId}/take`);
  }

  /* ── Lọc riêng bài thi / luyện tập ── */
  const examAssessments = useMemo(
    () => assessments.filter((a) => (a.assessmentType || '').toUpperCase() === 'EXAM'),
    [assessments],
  );

  const practiceAssessments = useMemo(
    () => assessments.filter((a) => (a.assessmentType || '').toUpperCase() === 'EXERCISE'),
    [assessments],
  );

  const tabs = [
    { key: TABS.MATERIAL, label: 'Tài liệu' },
    { key: TABS.EXAM, label: 'Bài thi' },
    { key: TABS.PRACTICE, label: 'Bài luyện tập' },
  ];

  return (
    <DashboardLayout title="Chi tiết khóa học">
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <button className="btn-secondary btn-sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={14} /> Quay lại
        </button>
      </div>

      {error ? (
        <p className="text-error" style={{ marginBottom: '0.75rem' }}>
          {error}
        </p>
      ) : null}

      {/* Tab navigation */}
      <div className="tab-group" style={{ marginBottom: '1rem' }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`tab-item ${activeTab === t.key ? 'tab-item-active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── Tab: Tài liệu ─── */}
      {activeTab === TABS.MATERIAL ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th className="cell-center">#</th>
                <th>Tên tài liệu</th>
                <th className="cell-center">Loại</th>
                <th className="cell-center">Tải về</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((m, i) => {
                const id = m.materialId || m.id;
                return (
                  <tr key={id}>
                    <td className="cell-center">{i + 1}</td>
                    <td>{m.name || '-'}</td>
                    <td className="cell-center">{m.type}</td>
                    <td className="cell-center">
                      <button
                        className="btn-secondary btn-sm"
                        onClick={() => handleDownload(id)}
                      >
                        <Download size={14} /> Tải
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!materials.length && !loading ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}
                  >
                    Chưa có tài liệu.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* ─── Tab: Bài thi ─── */}
      {activeTab === TABS.EXAM ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tên bài thi</th>
                <th className="cell-center">Thời gian</th>
                <th className="cell-center">Trạng thái</th>
                <th className="cell-center">Tình trạng</th>
                <th className="cell-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {examAssessments.map((a) => {
                const isOpen = (a.status || '').toUpperCase() === 'OPEN';
                const alreadyDone = completedExamIds.has(a.id);
                return (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600 }}>{a.title}</td>
                    <td className="cell-center">
                      {Math.round((a.durationSeconds || 0) / 60)} phút
                    </td>
                    <td className="cell-center">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="cell-center">
                      {alreadyDone ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            background: '#ecfdf5',
                            color: '#047857',
                            border: '1px solid #a7f3d0',
                            borderRadius: '0.5rem',
                            padding: '0.25rem 0.625rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}
                        >
                          <CheckCircle size={14} /> Đã làm
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            background: '#fffbeb',
                            color: '#b45309',
                            border: '1px solid #fde68a',
                            borderRadius: '0.5rem',
                            padding: '0.25rem 0.625rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}
                        >
                          Chưa làm
                        </span>
                      )}
                    </td>
                    <td className="cell-center">
                      {isOpen ? (
                        <button
                          className={alreadyDone ? 'btn-secondary btn-sm' : 'btn-primary btn-sm'}
                          onClick={() => handleStartAttempt(a)}
                        >
                          {alreadyDone ? 'Đã hoàn thành' : 'Làm bài'}
                        </button>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>Đã đóng</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!examAssessments.length && !loading ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}
                  >
                    Chưa có bài thi cho khóa học này.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* ─── Tab: Bài luyện tập ─── */}
      {activeTab === TABS.PRACTICE ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tên bài luyện tập</th>
                <th className="cell-center">Thời gian</th>
                <th className="cell-center">Trạng thái</th>
                <th className="cell-center">Hạn nộp</th>
                <th className="cell-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {practiceAssessments.map((a) => {
                const isOpen = (a.status || '').toUpperCase() === 'OPEN';
                return (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600 }}>{a.title}</td>
                    <td className="cell-center">
                      {Math.round((a.durationSeconds || 0) / 60)} phút
                    </td>
                    <td className="cell-center">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="cell-center">{fmtDT(a.expirationDate)}</td>
                    <td className="cell-center">
                      {isOpen ? (
                        <button
                          className="btn-primary btn-sm"
                          onClick={() => handleStartAttempt(a)}
                        >
                          Làm bài
                        </button>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>Đã đóng</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!practiceAssessments.length && !loading ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}
                  >
                    Chưa có bài luyện tập cho khóa học này.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
