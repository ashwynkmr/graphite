// Thin line icons, drawn like pencil strokes. currentColor so they follow the tab state.

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export function IconHome() {
  return (
    <svg {...base}>
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M6 9.5V20h12V9.5" />
    </svg>
  );
}

export function IconQuant() {
  return (
    <svg {...base}>
      <path d="M7 4v6M4 7h6" />
      <path d="M14 7h6" />
      <path d="M4.5 15.5l5 5M9.5 15.5l-5 5" />
      <path d="M14 16h6M14 20h6" />
    </svg>
  );
}

export function IconVocab() {
  return (
    <svg {...base}>
      <rect x="3.5" y="6" width="13" height="13" rx="1.5" />
      <path d="M7.5 3h11.5a1.5 1.5 0 0 1 1.5 1.5V16" />
      <path d="M6.5 11h7M6.5 14h5" />
    </svg>
  );
}

export function IconMistakes() {
  return (
    <svg {...base}>
      <path d="M15.5 4.5l4 4L9 19H5v-4z" />
      <path d="M13 7l4 4" />
    </svg>
  );
}

export function IconProgress() {
  return (
    <svg {...base}>
      <path d="M4 20h16" />
      <path d="M5 16l4.5-5 3.5 3 6-7" />
    </svg>
  );
}

export function IconSettings() {
  return (
    <svg {...base}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8" />
    </svg>
  );
}
