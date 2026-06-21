'use client';

import Icon from './Icon';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  busy?: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  busy = false,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="modal-backdrop confirm-backdrop" onMouseDown={onCancel}>
      <div
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="confirm-dialog__icon" aria-hidden="true">
          <Icon name="alert-circle" size={22} />
        </div>

        <div className="confirm-dialog__content">
          <div className="confirm-dialog__header">
            <h2 id="confirm-dialog-title">{title}</h2>
            <button type="button" onClick={onCancel} aria-label="Close dialog" disabled={busy}>
              <Icon name="x" size={17} />
            </button>
          </div>
          <p id="confirm-dialog-message">{message}</p>
          {error && <p className="confirm-dialog__error">{error}</p>}

          <div className="confirm-dialog__actions">
            <button type="button" className="button secondary" onClick={onCancel} disabled={busy}>
              Cancel
            </button>
            <button type="button" className="button danger-button" onClick={onConfirm} disabled={busy} autoFocus>
              {busy ? 'Deleting…' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
