export default function EmptyState({ icon: Icon, title, text, actionLabel, onAction }) {
  return (
    <div className="page-enter flex flex-col items-center rounded-2xl border border-dashed border-line px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
        <Icon size={26} />
      </div>
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      <p className="mt-2 max-w-sm text-muted">{text}</p>
      {actionLabel && (
        <button
          onClick={onAction}
          className="mt-6 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 active:scale-95"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}