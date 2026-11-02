// Icons take the button's text colour via currentColor.

export function SpinIcon() {
  return (
    <svg width={44} height={44} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 12a8 8 0 1 1-2.34-5.66" />
      <path d="M20 4v5h-5" />
    </svg>
  );
}

export function StopIcon() {
  return (
    <svg width={34} height={34} viewBox="0 0 24 24" aria-hidden>
      <rect x="5" y="5" width="14" height="14" rx="2.5" fill="currentColor" />
    </svg>
  );
}

export function AutoplayIcon() {
  return (
    <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 12a8 8 0 0 1 13.66-5.66L20 8.5" />
      <path d="M20 4v4.5h-4.5" />
      <path d="M20 12a8 8 0 0 1-13.66 5.66L4 15.5" />
      <path d="M4 20v-4.5h4.5" />
      <path d="M10 9l5 3-5 3z" fill="currentColor" />
    </svg>
  );
}

export function ArrowIcon() {
  return (
    <svg width={44} height={44} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.8}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

export function TurboIcon() {
  return (
    <svg width={26} height={26} viewBox="0 0 24 24" aria-hidden>
      <path d="M13.5 2 5 13.5h6L9.5 22 19 9.5h-6.2z" fill="currentColor" stroke="currentColor" strokeWidth={1.2}
        strokeLinejoin="round" />
    </svg>
  );
}
