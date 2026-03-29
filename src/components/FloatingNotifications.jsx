import { useEffect, useState } from 'react';
import { notifyEvents, resolveConfirmAction } from '../lib/notify';

export function FloatingNotifications() {
  const [toasts, setToasts] = useState([]);
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    function handleToast(e) {
      const toast = { ...e.detail, id: Date.now() + Math.random() };
      setToasts((prev) => [...prev, toast].slice(-5));
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, toast.durationMs || 4200);
    }

    function handleConfirm(e) {
      setConfirm(e.detail);
    }

    window.addEventListener(notifyEvents.TOAST_EVENT, handleToast);
    window.addEventListener(notifyEvents.CONFIRM_EVENT, handleConfirm);
    return () => {
      window.removeEventListener(notifyEvents.TOAST_EVENT, handleToast);
      window.removeEventListener(notifyEvents.CONFIRM_EVENT, handleConfirm);
    };
  }, []);

  function handleConfirmResolve(accepted) {
    if (confirm?.id) resolveConfirmAction(confirm.id, accepted);
    setConfirm(null);
  }

  return (
    <>
      {/* Toasts */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-item toast-${t.type}`}>
            {t.message}
          </div>
        ))}
      </div>

      {/* Confirm Dialog */}
      {confirm ? (
        <div className="modal-backdrop" style={{ zIndex: 999 }} onClick={() => handleConfirmResolve(false)}>
          <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>{confirm.title}</h3>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.25rem' }}>{confirm.message}</p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => handleConfirmResolve(false)}>
                {confirm.cancelText}
              </button>
              <button
                className={confirm.variant === 'danger' ? 'btn-danger' : 'btn-primary'}
                onClick={() => handleConfirmResolve(true)}
              >
                {confirm.confirmText}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
