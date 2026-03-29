import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
      <button 
        className="btn-secondary btn-icon" 
        onClick={() => onPageChange(page - 1)} 
        disabled={page === 0}
      >
        <ChevronLeft size={16} />
      </button>

      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>
        Trang {page + 1} / {totalPages}
      </span>

      <button 
        className="btn-secondary btn-icon" 
        onClick={() => onPageChange(page + 1)} 
        disabled={page >= totalPages - 1}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
