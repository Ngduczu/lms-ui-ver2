import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, RefreshCcw } from 'lucide-react';
import { getMyEnrollmentsApi } from '../../api/enrollmentApi';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';

export function StudentMyCoursesPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try { const d = await getMyEnrollmentsApi({ page: 0, size: 200 }); setCourses((d?.content || []).filter((e) => e.enrollmentStatus === 'APPROVED')); } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <DashboardLayout title="Khóa học của tôi" subtitle="Danh sách khóa học bạn đã đăng ký thành công.">
      <PageHeader title="Khóa học của tôi" subtitle={`${courses.length} khóa học`} actions={<button className="btn-secondary btn-sm" onClick={fetch}><RefreshCcw size={14} /> Làm mới</button>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {courses.map((c, i) => (
          <motion.div key={c.courseId || i} className="card" style={{ padding: '1.25rem', cursor: 'pointer' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} onClick={() => navigate(`/student/course/${c.courseId}/detail`)}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', background: 'linear-gradient(135deg, #059669, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><BookOpen size={18} /></div>
              <StatusBadge status={c.enrollmentStatus} />
            </div>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>{c.courseName}</h3>
            <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>GV: {c.teacherName || '-'}</p>
          </motion.div>
        ))}
        {!courses.length && !loading ? <p style={{ color: '#94a3b8' }}>Chưa có khóa học nào.</p> : null}
      </div>
    </DashboardLayout>
  );
}
