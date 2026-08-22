type AlertTone = "success" | "error" | "info";

const TONE_STYLES: Record<AlertTone, string> = {
  success:
    "border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]",
  error: "border-[#FECACA] bg-[#FEF2F2] text-[#991B1B]",
  info: "border-[#BFDBFE] bg-[#EFF6FF] text-[#1E40AF]",
};

const ICONS: Record<AlertTone, string> = {
  success: "M5 13l4 4L19 7",
  error: "M12 8v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z",
  info: "M12 8v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z",
};

type AlertProps = {
  tone: AlertTone;
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
};

export function Alert({ tone, title, children, onDismiss }: AlertProps) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${TONE_STYLES[tone]}`}
    >
      <svg
        className="mt-0.5 h-4 w-4 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={ICONS[tone]} />
      </svg>
      <div className="min-w-0 flex-1">
        {title ? (
          <p className="font-semibold">{title}</p>
        ) : null}
        <div className={title ? "mt-0.5" : ""}>{children}</div>
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss message"
          className="shrink-0 rounded-md p-1 transition hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-current"
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
      ) : null}
    </div>
  );
}
