import Modal from './Modal'

export default function ConfirmDialog({
  title,
  text,
  confirmLabel = 'Confirm',
  busyLabel = 'Deleting…',
  busy = false,
  error = '',
  onConfirm,
  onCancel,
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-muted">{text}</p>
      {error && (
        <p className="mt-4 rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">{error}</p>
      )}
      <div className="mt-6 flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted transition hover:bg-black/5"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={busy}
          className="rounded-xl bg-danger px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 active:scale-95 disabled:opacity-60"
        >
          {busy ? busyLabel : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}