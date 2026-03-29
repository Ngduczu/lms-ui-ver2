import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { FloatingNotifications } from './components/FloatingNotifications';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { GuestRoute } from './routes/GuestRoute';

// Auth
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';

// Admin
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminCoursesPage } from './pages/admin/AdminCoursesPage';
import { AdminEnrollmentsPage } from './pages/admin/AdminEnrollmentsPage';

// Teacher
import { TeacherMyCoursesPage } from './pages/teacher/TeacherMyCoursesPage';
import { TeacherCoursesPage } from './pages/teacher/TeacherCoursesPage';
import { TeacherCourseDetailPage } from './pages/teacher/TeacherCourseDetailPage';
import { TeacherEnrollmentsPage } from './pages/teacher/TeacherEnrollmentsPage';
import { TeacherQuestionBanksPage } from './pages/teacher/TeacherQuestionBanksPage';
import { TeacherAssessmentManagerPage } from './pages/teacher/TeacherAssessmentManagerPage';

// Student
import { StudentMyCoursesPage } from './pages/student/StudentMyCoursesPage';
import { StudentCoursesPage } from './pages/student/StudentCoursesPage';
import { StudentEnrollmentsPage } from './pages/student/StudentEnrollmentsPage';
import { StudentTakeAssessmentPage } from './pages/student/StudentTakeAssessmentPage';

// Shared
import { CourseDetailPage } from './pages/course/CourseDetailPage';
import { AssessmentHistoryPage } from './pages/history/AssessmentHistoryPage';
import { ProfileSettingsPage } from './pages/profile/ProfileSettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FloatingNotifications />
        <Routes>
          {/* Guest routes */}
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Route>

          {/* Admin routes */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin" element={<AdminUsersPage />} />
            <Route path="/admin/courses" element={<AdminCoursesPage />} />
            <Route path="/admin/enrollments" element={<AdminEnrollmentsPage />} />
          </Route>

          {/* Teacher routes */}
          <Route element={<ProtectedRoute allowedRoles={['TEACHER']} />}>
            <Route path="/teacher" element={<TeacherMyCoursesPage />} />
            <Route path="/teacher/courses" element={<TeacherCoursesPage />} />
            <Route path="/teacher/course/:courseId/detail" element={<TeacherCourseDetailPage />} />
            <Route path="/teacher/course/:courseId/assessments" element={<TeacherAssessmentManagerPage />} />
            <Route path="/teacher/enrollments" element={<TeacherEnrollmentsPage />} />
            <Route path="/teacher/question-banks" element={<TeacherQuestionBanksPage />} />
          </Route>

          {/* Student routes */}
          <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
            <Route path="/student" element={<StudentMyCoursesPage />} />
            <Route path="/student/courses" element={<StudentCoursesPage />} />
            <Route path="/student/enrollments" element={<StudentEnrollmentsPage />} />
            <Route path="/student/course/:courseId/detail" element={<CourseDetailPage />} />
            <Route path="/student/assessment/:assessmentId/take" element={<StudentTakeAssessmentPage />} />
          </Route>

          {/* Shared protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/history" element={<AssessmentHistoryPage />} />
            <Route path="/profile" element={<ProfileSettingsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
