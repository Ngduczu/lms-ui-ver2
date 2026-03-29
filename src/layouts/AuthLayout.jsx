import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export function AuthLayout({ children, title, subtitle, footerMode }) {
  return (
    <div className="auth-container">
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'inline-flex', width: '3rem', height: '3rem', borderRadius: '0.75rem', background: 'linear-gradient(135deg, #6366f1, #a855f7)', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1.25rem', marginBottom: '0.75rem' }}>
            U
          </div>
          <h1 className="auth-title">{title}</h1>
          {subtitle ? <p className="auth-subtitle">{subtitle}</p> : null}
        </div>

        {children}

        {footerMode === 'login' ? (
          <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Chưa có tài khoản?{' '}
            <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
              Đăng ký ngay
            </Link>
          </p>
        ) : null}
        {footerMode === 'register' ? (
          <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Đã có tài khoản?{' '}
            <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
              Đăng nhập
            </Link>
          </p>
        ) : null}
      </motion.div>
    </div>
  );
}
