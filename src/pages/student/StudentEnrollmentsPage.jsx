import { useCallback, useEffect, useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import { getMyEnrollmentsApi } from '../../api/enrollmentApi';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';

export function StudentEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => { setLoading(true); try { const d = await getMyEnrollmentsApi({ page: 0, size: 200 }); setEnrollments(d?.content || []); } catch {} finally { setLoading(false); } }, []);
  useEffect(() => { fetch(); }, [fetch]);

  return (
    <DashboardLayout title="Đăng ký của tôi" subtitle="Theo dõi trạng thái đăng ký khóa học.">
      <PageHeader title="Đăng ký của tôi" subtitle={`${enrollments.length} đăng ký`} actions={<button className="btn-secondary btn-sm" onClick={fetch}><RefreshCcw size={14} /></button>} />
      <div className="table-container">
        <table className="data-table">
          <thead><tr><th className="cell-center">#</th><th>Khóa học</th><th>Giảng viên</th><th className="cell-center">Trạng thái</th></tr></thead>
          <tbody>
            {enrollments.map((e, i) => (
              <tr key={e.courseId || i}><td className="cell-center">{i + 1}</td><td style={{ fontWeight: 600 }}>{e.courseName || '-'}</td><td>{e.teacherName || '-'}</td><td className="cell-center"><StatusBadge status={e.enrollmentStatus} /></td></tr>
            ))}
            {!enrollments.length && !loading ? <tr><td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Chưa có đăng ký nào.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
