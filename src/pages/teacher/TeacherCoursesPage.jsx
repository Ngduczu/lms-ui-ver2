import { useCallback, useEffect, useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import { getCoursesApi } from '../../api/courseApi';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../../components/ui/Pagination';
import { Search } from 'lucide-react';

export function TeacherCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPage(0);
  }, [search]);

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
    <DashboardLayout title="Tất cả khóa học" subtitle="Xem tất cả khóa học trên hệ thống.">
      <PageHeader title="Tất cả khóa học" subtitle={`${totalElements} khóa học`} actions={
        <button className="btn-secondary btn-sm" onClick={fetchCourses}><RefreshCcw size={14} /> Làm mới</button>
      } />
      
      <div style={{ marginBottom: '1rem', maxWidth: '24rem', position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input className="input-field" placeholder="Tìm kiếm khóa học..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: '2.25rem' }} />
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead><tr><th className="cell-center">#</th><th>Tên khóa học</th><th>Giảng viên</th><th className="cell-center">SV tối đa</th><th className="cell-center">Trạng thái</th></tr></thead>
          <tbody>
            {courses.map((c, i) => (
              <tr key={c.id || i}>
                <td className="cell-center">{i + 1}</td>
                <td style={{ fontWeight: 600 }}>{c.name}</td>
                <td>{c.teacherName || '-'}</td>
                <td className="cell-center">{c.max_Student ?? c.maxStudent ?? '-'}</td>
                <td className="cell-center"><StatusBadge status={c.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </DashboardLayout>
  );
}
