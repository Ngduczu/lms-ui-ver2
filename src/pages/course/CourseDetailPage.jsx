import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, RefreshCcw } from 'lucide-react';
import { getAssessmentsByCourseApi } from '../../api/assessmentApi';
import { getCourseMaterialsApi, getMaterialDownloadUrlApi } from '../../api/materialApi';
import { useAuth } from '../../hooks/useAuth';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { StatusBadge } from '../../components/ui/StatusBadge';

function fmtDT(v) { return v ? new Date(v).toLocaleString('vi-VN') : '-'; }

export function CourseDetailPage() {
  const { courseId = '' } = useParams();
  const { role } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('MATERIAL');
  const [materials, setMaterials] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (courseId && activeTab === 'MATERIAL') fetchMaterials(courseId);
  }, [courseId, activeTab]);

  useEffect(() => {
    if (courseId && activeTab === 'EXAM') fetchAssessments(courseId);
  }, [courseId, activeTab]);

  async function fetchMaterials(id) {
    setLoading(true);
    try { const d = await getCourseMaterialsApi(id, { page: 0, size: 100 }); setMaterials((d?.content || []).filter((m) => (m.status || '').toUpperCase() !== 'HIDDEN')); } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function fetchAssessments(id) {
    setLoading(true);
    try { const d = await getAssessmentsByCourseApi(id, { page: 0, size: 100 }); setAssessments(d?.content || []); } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function handleDownload(mId) { try { const url = await getMaterialDownloadUrlApi(mId); window.open(url, '_blank'); } catch (e) { setError(e.message); } }

  function handleStartAttempt(aId) { navigate(`/student/assessment/${aId}/take`); }

  const tabs = [
    { key: 'MATERIAL', label: 'Tài liệu' },
    { key: 'EXAM', label: 'Bài thi / Luyện tập' },
  ];

  return (
    <DashboardLayout title="Chi tiết khóa học">
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <button className="btn-secondary btn-sm" onClick={() => navigate(-1)}><ArrowLeft size={14} /> Quay lại</button>
      </div>

      {error ? <p className="text-error" style={{ marginBottom: '0.75rem' }}>{error}</p> : null}

      <div className="tab-group" style={{ marginBottom: '1rem' }}>
        {tabs.map((t) => <button key={t.key} className={`tab-item ${activeTab === t.key ? 'tab-item-active' : ''}`} onClick={() => setActiveTab(t.key)}>{t.label}</button>)}
      </div>

      {activeTab === 'MATERIAL' ? (
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th className="cell-center">#</th><th>Tên tài liệu</th><th className="cell-center">Loại</th><th className="cell-center">Tải về</th></tr></thead>
            <tbody>
              {materials.map((m, i) => { const id = m.materialId || m.id; return (
                <tr key={id}><td className="cell-center">{i + 1}</td><td>{m.name || '-'}</td><td className="cell-center">{m.type}</td>
                  <td className="cell-center"><button className="btn-secondary btn-sm" onClick={() => handleDownload(id)}><Download size={14} /> Tải</button></td></tr>
              ); })}
              {!materials.length && !loading ? <tr><td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Chưa có tài liệu.</td></tr> : null}
            </tbody>
          </table>
        </div>
      ) : null}

      {activeTab === 'EXAM' ? (
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Tên</th><th>Loại</th><th>Thời gian</th><th>Hạn nộp</th><th>Trạng thái</th><th className="cell-center">Hành động</th></tr></thead>
            <tbody>
              {assessments.map((a) => { const type = (a.assessmentType || '').toUpperCase(); const isOpen = (a.status || '').toUpperCase() === 'OPEN'; return (
                <tr key={a.id}><td style={{ fontWeight: 600 }}>{a.title}</td><td>{type === 'EXAM' ? 'Bài thi' : 'Luyện tập'}</td><td>{Math.round((a.durationSeconds || 0) / 60)} phút</td><td>{type === 'EXERCISE' ? 'N/A' : fmtDT(a.expirationDate)}</td><td><StatusBadge status={a.status} /></td>
                  <td className="cell-center">{isOpen ? <button className="btn-primary btn-sm" onClick={() => handleStartAttempt(a.id)}>Làm bài</button> : <span style={{ color: '#94a3b8' }}>Đã đóng</span>}</td></tr>
              ); })}
              {!assessments.length && !loading ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Chưa có bài thi.</td></tr> : null}
            </tbody>
          </table>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
