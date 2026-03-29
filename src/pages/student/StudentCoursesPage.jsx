import { useCallback, useEffect, useState } from 'react';
import { RefreshCcw, Search, BookOpen, User, Users } from 'lucide-react';
import { getCoursesApi } from '../../api/courseApi';
import { requestEnrollmentApi } from '../../api/enrollmentApi';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../../components/ui/Pagination';
import { notifySuccess } from '../../lib/notify';

export function StudentCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [search]);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const d = await getCoursesApi({ page, size: 20, search: search || undefined, excludeEnrolled: true });
      setCourses(d?.content || []);
      setTotalPages(d?.totalPages || 1);
      setTotalElements(d?.totalElements || 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  async function handleEnroll(courseId) {
    try {
      await requestEnrollmentApi(courseId);
      notifySuccess('Đã gửi yêu cầu đăng ký.');
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <DashboardLayout title="Tất cả khóa học" subtitle="Xem và đăng ký các khóa học.">
      <PageHeader 
        title="Tất cả khóa học"
        subtitle={`${totalElements} khóa học`}
        actions={
          <button className="btn-secondary btn-sm" onClick={fetchCourses}>
            <RefreshCcw size={14} /> Làm mới
          </button>
        } 
      />
      {error ? <p className="text-error" style={{ marginBottom: '0.75rem' }}>{error}</p> : null}

      <div style={{ marginBottom: '1.5rem', maxWidth: '24rem', position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input 
          className="input-field" 
          placeholder="Tìm kiếm khóa học..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          style={{ paddingLeft: '2.25rem', width: '100%' }} 
        />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {courses.map((c, i) => (
          <div key={c.id || i} style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            border: '1px solid #e2e8f0',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            transition: 'border-color 0.2s',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3b82f6' }}>
                <BookOpen size={20} />
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#1e293b' }}>
                  {c.name}
                </h3>
              </div>
              <StatusBadge status={c.status} />
            </div>

            <div style={{ color: '#64748b', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={16} />
                <span>Giảng viên: <strong style={{ color: '#334155' }}>{c.teacherName || 'Chưa cập nhật'}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={16} />
                <span>Sĩ số: <strong style={{ color: '#334155' }}>{c.approvedEnrollmentCount ?? 0} / {c.max_Student ?? c.maxStudent ?? '-'}</strong></span>
              </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                className="btn-primary" 
                onClick={() => handleEnroll(c.id)} 
                disabled={(c.status || '').toUpperCase() !== 'OPEN'}
                style={{ width: '100%' }}
              >
                Đăng ký khóa học
              </button>
            </div>
          </div>
        ))}

        {courses.length === 0 && !loading && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            Không tìm thấy khóa học nào.
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </DashboardLayout>
  );
}
