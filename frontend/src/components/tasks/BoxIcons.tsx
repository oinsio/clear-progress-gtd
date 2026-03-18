// Shared box icon components used in BoxFilterBar and TaskQuickActions

export function TodayBoxIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 6.5l1.545 3.13 3.455.502-2.5 2.437.59 3.441L12 14.3l-3.09 1.71.59-3.441L7 10.132l3.455-.502L12 6.5z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

export function WeekBoxIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" aria-hidden="true">
      <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="6" />
      <g transform="translate(50,50) scale(1.15) translate(-50,-50)">
        <rect x="30" y="32" width="40" height="36" rx="3" ry="3" fill="none" stroke="currentColor" strokeWidth="4" />
        <line x1="30" y1="42" x2="70" y2="42" stroke="currentColor" strokeWidth="4" />
        <line x1="40" y1="28" x2="40" y2="36" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <line x1="50" y1="28" x2="50" y2="36" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <line x1="60" y1="28" x2="60" y2="36" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <text
          x="50"
          y="55"
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize="16"
          fontWeight="600"
          fill="currentColor"
        >
          +7
        </text>
      </g>
    </svg>
  );
}

export function LaterBoxIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8.5 12h7M13 9l3 3-3 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function InboxBoxIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M7.5 14h9l-1.5-4h-6L7.5 14z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 14v.5a2.5 2.5 0 0 0 5 0V14"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AllBoxesIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="7.5" cy="16" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16.5" cy="16" r="3.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
