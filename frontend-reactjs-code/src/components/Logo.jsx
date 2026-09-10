export default function Logo({ size = 28 }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
      >
        {/* Wallet body */}
        <rect x="3" y="8" width="26" height="18" rx="4" fill="#0f172a" />
        {/* Flap highlight */}
        <path d="M3 12h26v3H3z" fill="#1e293b" />
        {/* Clasp with a rupee mark */}
        <circle cx="23" cy="17" r="4.5" fill="#f8fafc" />
        <text
          x="23"
          y="17"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="6"
          fontWeight="700"
          fill="#0f172a"
        >
          ₹
        </text>
      </svg>
      <span className="font-semibold tracking-tight">MyWalletTracker</span>
    </span>
  );
}
