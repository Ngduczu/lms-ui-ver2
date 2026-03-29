import { useCallback, useEffect, useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import { getCoursesApi } from '../../api/courseApi';
import { getCourseEnrollmentsApi, updateEnrollmentStatusApi } from '../../api/enrollmentApi';
import { useAuth } from '../../hooks/useAuth';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { notifySuccess } from '../../lib/notify';
import { Pagination } from '../../components/ui/Pagination';
import { Search } from 'lucide-react';

export function TeacherEnrollmentsPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [enrollments, setEnrollments] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchMyCourses = useCallback(async () => {
    if (!user?.userId) return;
    try {
      const data = await getCoursesApi({ page: 0, size: 200, teacherId: user.userId });
      const mine = data?.content || [];
      setCourses(mine);
      if (mine.length && !selectedCourseId) setSelectedCourseId(String(mine[0].id));
    } catch (err) { setError(err.message); }
  }, [user?.userId, selectedCourseId]);

  useEffect(() => { fetchMyCourses(); }, [fetchMyCourses]);

  useEffect(() => {
    setPage(0);
  }, [selectedCourseId, search]);

  const fetchEnrollments = useCallback(async () => {
    if (!selectedCourseId) {
      setEnrollments([]);
      setTotalElements(0);
      setTotalPages(1);
      return;
    }
    setLoading(true);
    try {
      const data = await getCourseEnrollmentsApi(selectedCourseId, { page, size: 20, search: search || undefined });
      setEnrollments(data?.content || []);
      setTotalElements(data?.totalElements || 0);
      setTotalPages(data?.totalPages || 1);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [selectedCourseId, page, search]);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  async function handleUpdateStatus(enrollment, status) {
    try {
      await updateEnrollmentStatusApi(selectedCourseId, enrollment.userId, status);
      notifySuccess(status === 'APPROVED' ? 'Đã duyệt.' : 'Đã từ chối.');
      fetchEnrollments();
    } catch (err) { setError(err.message); }
  }

  return (
    <DashboardLayout title="Yêu cầu đăng ký" subtitle="Duyệt yêu cầu đăng ký từ sinh viên.">
      <PageHeader title="Yêu cầu đăng ký" subtitle={`${totalElements} yêu cầu`} actions={
        <button className="btn-secondary btn-sm" onClick={fetchEnrollments}><RefreshCcw size={14} /> Làm mới</button>
      } />
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div className="field-group" style={{ flex: 1, minWidth: '16rem', maxWidth: '24rem' }}>
          <select className="input-field" value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)}>
            <option value="">-- Chọn khóa học --</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="field-group" style={{ flex: 1, minWidth: '16rem', maxWidth: '24rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input className="input-field" placeholder="Nhập tên học viên..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: '2.25rem' }} />
          </div>
        </div>
      </div>
      {error ? <p className="text-error" style={{ marginBottom: '0.75rem' }}>{error}</p> : null}
      <div className="table-container">
        <table className="data-table">
          <thead><tr><th className="cell-center">#</th><th>Họ tên</th><th>Email</th><th className="cell-center">Trạng thái</th><th className="cell-center">Thao tác</th></tr></thead>
          <tbody>
            {enrollments.map((e, i) => {
              const isPending = (e.enrollmentStatus || '').toUpperCase() === 'PENDING';
              return (
                <tr key={e.userId || i}>
                  <td className="cell-center">{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{e.fullName || '-'}</td>
                  <td>{e.email || '-'}</td>
                  <td className="cell-center"><StatusBadge status={e.enrollmentStatus} /></td>
                  <td className="cell-center">
                    {isPending ? (
                      <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'center' }}>
                        <button className="btn-primary btn-sm" onClick={() => handleUpdateStatus(e, 'APPROVED')}>Duyệt</button>
                        <button className="btn-danger btn-sm" onClick={() => handleUpdateStatus(e, 'REJECTED')}>Từ chối</button>
                      </div>
                    ) : '-'}
                  </td>
                </tr>
              );
            })}
            {!enrollments.length && !loading ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Không có yêu cầu nào.</td></tr> : null}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </DashboardLayout>
  );
}
