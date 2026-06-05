export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <rect width="48" height="48" rx="12" fill="#1CC29F" />
      <path
        d="M16 16h11a6 6 0 0 1 0 12h-7"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 24l-4 4 4 4"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Wordmark({ size = 32 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2">
      <LogoMark size={size} />
      <span
        className="font-display font-extrabold tracking-tight text-ink"
        style={{ fontSize: size * 0.72 }}
      >
        Splitr
      </span>
    </div>
  );
}
