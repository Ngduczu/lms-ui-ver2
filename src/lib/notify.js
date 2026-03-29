const TOAST_EVENT = 'app:toast';
const CONFIRM_EVENT = 'app:confirm';

let confirmSequence = 0;
const pendingConfirmResolvers = new Map();

function dispatchUiEvent(eventName, detail) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(eventName, { detail }));
}

export function notify(message, options = {}) {
  if (!message) return;
  dispatchUiEvent(TOAST_EVENT, {
    message,
    type: options.type || 'error',
    durationMs: options.durationMs ?? 4200,
  });
}

export function notifyError(message, options = {}) {
  notify(message, { ...options, type: 'error' });
}

export function notifySuccess(message, options = {}) {
  notify(message, { ...options, type: 'success' });
}

export function notifyInfo(message, options = {}) {
  notify(message, { ...options, type: 'info' });
}

export function confirmAction(options = {}) {
  const id = `confirm-${Date.now()}-${confirmSequence++}`;
  if (typeof window === 'undefined') return Promise.resolve(false);

  return new Promise((resolve) => {
    pendingConfirmResolvers.set(id, resolve);
    dispatchUiEvent(CONFIRM_EVENT, {
      id,
      title: options.title || 'Xác nhận thao tác',
      message: options.message || 'Bạn có chắc chắn muốn tiếp tục?',
      confirmText: options.confirmText || 'Xác nhận',
      cancelText: options.cancelText || 'Hủy',
      variant: options.variant || 'danger',
    });
  });
}

export function resolveConfirmAction(id, accepted) {
  const resolver = pendingConfirmResolvers.get(id);
  if (!resolver) return;
  resolver(Boolean(accepted));
  pendingConfirmResolvers.delete(id);
}

export const notifyEvents = { TOAST_EVENT, CONFIRM_EVENT };
