import { useEffect, useRef } from 'react';
import EditForm from './EditForm';

export default function FormModal({
  open,
  config,
  lookups,
  editingId,
  draftRow,
  onDraftChange,
  onSave,
  onClose,
}) {
  const boxRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const title = editingId
    ? `Редактирование — ID ${editingId}`
    : `Новая запись — ${config.title}`;

  const handleOverlayClick = (event) => {
    if (boxRef.current && !boxRef.current.contains(event.target)) {
      onClose();
    }
  };

  return (
    <div className="form-modal-overlay" onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-label={title}>
      <div className="form-modal-box" ref={boxRef}>
        <div className="form-modal-header">
          <div className="form-modal-title">{title}</div>
          <button
            type="button"
            className="form-modal-close"
            onClick={onClose}
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>
        <div className="form-modal-body">
          <EditForm
            config={config}
            lookups={lookups}
            editingId={editingId}
            draftRow={draftRow}
            onDraftChange={onDraftChange}
            onSave={onSave}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}
