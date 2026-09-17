export type ToastItem = {
  id: number;
  tone: "success" | "error";
  text: string;
};

const TONE_STYLES: Record<ToastItem["tone"], string> = {
  success: "border-emerald-200 bg-surface text-emerald-700",
  error: "border-red-200 bg-surface text-red-700",
};

const ICONS: Record<ToastItem["tone"], React.ReactNode> = {
  success: (
    <path d="M5 13l4 4L19 7" />
  ),
  error: (
    <path d="M12 8v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
  ),
};

type ToastProps = {
  toast: ToastItem;
  onDismiss: (id: number) => void;
};

export function Toast({ toast, onDismiss }: ToastProps) {
  return (
    <div
      role="status"
      className={`toast-in pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-[0_20px_50px_-20px_rgba(37,99,235,0.35)] ${TONE_STYLES[toast.tone]}`}
    >
      <svg
        className="mt-px h-4 w-4 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {ICONS[toast.tone]}
      </svg>
      <p className="font-medium">{toast.text}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="shrink-0 rounded-md p-0.5 transition hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-current"
      >
        <svg
          className="h-3.5 w-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

type ToastStackProps = {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
};

export function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
