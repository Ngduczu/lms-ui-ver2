import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, ChevronLeft, ChevronRight, ClipboardList, FileSpreadsheet,
  GraduationCap, History, LayoutDashboard, LogOut, Menu, Settings,
  UserCog, Users, FolderKanban, X,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getRoleLabel, ROLE_ADMIN, ROLE_STUDENT, ROLE_TEACHER } from '../lib/role';

const NAV_CONFIG = {
  ADMIN: [
    { section: 'Quản trị' },
    { to: '/admin', icon: Users, label: 'Quản lý người dùng', end: true },
    { to: '/admin/courses', icon: BookOpen, label: 'Quản lý khóa học' },
    { to: '/admin/enrollments', icon: ClipboardList, label: 'Quản lý đăng ký' },
    { section: 'Khác' },
    { to: '/history', icon: History, label: 'Lịch sử bài thi' },
    { to: '/profile', icon: Settings, label: 'Cài đặt tài khoản' },
  ],
  TEACHER: [
    { section: 'Giảng dạy' },
    { to: '/teacher', icon: BookOpen, label: 'Khóa học của tôi', end: true },
    { to: '/teacher/enrollments', icon: ClipboardList, label: 'Yêu cầu đăng ký' },
    { to: '/teacher/question-banks', icon: FolderKanban, label: 'Ngân hàng câu hỏi' },
    { section: 'Khác' },
    { to: '/history', icon: History, label: 'Lịch sử bài thi' },
    { to: '/profile', icon: Settings, label: 'Cài đặt tài khoản' },
  ],
  STUDENT: [
    { section: 'Học tập' },
    { to: '/student', icon: BookOpen, label: 'Khóa học của tôi', end: true },
    { to: '/student/courses', icon: GraduationCap, label: 'Tất cả khóa học' },
    { to: '/student/enrollments', icon: ClipboardList, label: 'Đăng ký của tôi' },
    { section: 'Khác' },
    { to: '/history', icon: History, label: 'Lịch sử bài thi' },
    { to: '/profile', icon: Settings, label: 'Cài đặt tài khoản' },
  ],
};

export function DashboardLayout({ children, title, subtitle }) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = NAV_CONFIG[role] || NAV_CONFIG.STUDENT;

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  const initials = (user?.fullName || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="dashboard-layout">
      {/* Mobile overlay */}
      {mobileOpen ? (
        <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />
      ) : null}

      {/* Sidebar */}
      <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'sidebar-mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">U</div>
          {!collapsed ? <span>UTC LMS</span> : null}
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, i) => {
            if (item.section) {
              return !collapsed ? (
                <div key={`s-${i}`} className="sidebar-section-title">{item.section}</div>
              ) : (
                <div key={`s-${i}`} style={{ height: '0.75rem' }} />
              );
            }

            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
                }
                title={collapsed ? item.label : undefined}
                onClick={() => setMobileOpen(false)}
              >
                <Icon className="sidebar-link-icon" />
                {!collapsed ? <span>{item.label}</span> : null}
              </NavLink>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <button
          className="sidebar-link"
          onClick={() => setCollapsed((p) => !p)}
          title={collapsed ? 'Mở rộng' : 'Thu gọn'}
          style={{ margin: '0 0.75rem', flexShrink: 0 }}
        >
          {collapsed ? <ChevronRight className="sidebar-link-icon" /> : <ChevronLeft className="sidebar-link-icon" />}
          {!collapsed ? <span>Thu gọn</span> : null}
        </button>

        {/* User section */}
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="avatar" />
            ) : (
              initials
            )}
          </div>
          {!collapsed ? (
            <div className="sidebar-user-info" style={{ flex: 1 }}>
              <div className="sidebar-user-name">{user?.fullName || 'Người dùng'}</div>
              <div className="sidebar-user-role">{getRoleLabel(role)}</div>
            </div>
          ) : null}
          {!collapsed ? (
            <button className="btn-icon" onClick={handleLogout} title="Đăng xuất" style={{ color: '#94a3b8' }}>
              <LogOut size={16} />
            </button>
          ) : null}
        </div>
      </aside>

      {/* Main Content */}
      <main className={`dashboard-main ${collapsed ? 'dashboard-main-collapsed' : ''}`}>
        <div className="dashboard-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              className="btn-icon"
              onClick={() => setMobileOpen(true)}
              style={{ display: 'none' }}
              id="mobile-menu-btn"
            >
              <Menu size={20} />
            </button>
            <style>{`@media (max-width: 768px) { #mobile-menu-btn { display: flex !important; } }`}</style>
            {title ? (
              <div>
                <h1 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text)' }}>{title}</h1>
                {subtitle ? <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{subtitle}</p> : null}
              </div>
            ) : null}
          </div>
        </div>

        <motion.div
          className="dashboard-content"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
