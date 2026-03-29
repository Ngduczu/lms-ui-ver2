export function StatusBadge({ status }) {
  const s = String(status || '').toUpperCase();

  const MAP = {
    OPEN: { cls: 'badge-green', label: 'Mở' },
    ACTIVE: { cls: 'badge-green', label: 'Hoạt động' },
    APPROVED: { cls: 'badge-green', label: 'Đã duyệt' },
    VISIBLE: { cls: 'badge-green', label: 'Hiển thị' },
    CLOSED: { cls: 'badge-red', label: 'Đóng' },
    DISABLED: { cls: 'badge-red', label: 'Bị khoá' },
    REJECTED: { cls: 'badge-red', label: 'Từ chối' },
    HIDDEN: { cls: 'badge-gray', label: 'Ẩn' },
    PENDING: { cls: 'badge-yellow', label: 'Chờ duyệt' },
  };

  const { cls, label } = MAP[s] || { cls: 'badge-gray', label: s || 'N/A' };

  return (
    <span className={`badge ${cls}`}>
      <span className="badge-dot" />
      {label}
    </span>
  );
}
