const PATHS = {
  home: <><path d="M3 11l9-8 9 8" /><path d="M5 10v10h4v-6h6v6h4V10" /></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.2" /><rect x="14" y="3" width="7" height="7" rx="1.2" /><rect x="3" y="14" width="7" height="7" rx="1.2" /><rect x="14" y="14" width="7" height="7" rx="1.2" /></>,
  trend: <><path d="M3 17l5-5 4 4 8-8" /><path d="M14 8h6v6" /></>,
  gift: <><path d="M3 11h18v9H3z" /><path d="M3 8h18v3H3zM12 8v12M9 8a2 2 0 1 1 0-4c1.5 0 3 4 3 4M15 8a2 2 0 1 0 0-4c-1.5 0-3 4-3 4" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.5 12a7.5 7.5 0 0 0-.1-1.3l2-1.6-2-3.4-2.4 1a7.5 7.5 0 0 0-2.2-1.3l-.4-2.5h-4l-.4 2.5a7.5 7.5 0 0 0-2.2 1.3l-2.4-1-2 3.4 2 1.6a7.5 7.5 0 0 0 0 2.6l-2 1.6 2 3.4 2.4-1a7.5 7.5 0 0 0 2.2 1.3l.4 2.5h4l.4-2.5a7.5 7.5 0 0 0 2.2-1.3l2.4 1 2-3.4-2-1.6a7.5 7.5 0 0 0 .1-1.3z" /></>,

  flight: <path d="M21 12l-8 2-4 7-1-1 2-6-6 1-2-2 9-4 5-8 2 1-1 6 5 2-1 2z" />,
  grocery: <><path d="M3 4h2l2 11h11l2-8H7" /><circle cx="9" cy="19" r="1.3" /><circle cx="17" cy="19" r="1.3" /></>,
  online: <><rect x="3" y="4" width="18" height="13" rx="1" /><path d="M8 21h8M12 17v4" /></>,
  dining: <><path d="M3 3v7a3 3 0 0 0 3 3v8" /><path d="M6 3v7M9 3v7" /><path d="M15 3c-1.5 0-3 2-3 5s1.5 5 3 5v8" /></>,
  travel: <><rect x="5" y="6" width="14" height="13" rx="1.5" /><path d="M9 6V4h6v2M5 12h14" /></>,
  hotel: <><path d="M3 20V6M21 20V10M3 10h18M3 14h18M7 10V7h4v3M13 12v-1h4v1" /></>,
  utilities: <><path d="M12 3v3M5 7l2 2M19 7l-2 2M3 14h3M18 14h3" /><rect x="7" y="10" width="10" height="10" rx="1.5" /><path d="M11 14l-1 3h2l-1 3" /></>,
  shopping: <><path d="M6 7h12l-1 12H7L6 7z" /><path d="M9 7a3 3 0 0 1 6 0" /></>,
  entertainment: <><circle cx="12" cy="12" r="8" /><path d="M10 9l5 3-5 3V9z" fill="currentColor" stroke="none" /></>,
  gas: <><rect x="4" y="4" width="9" height="16" rx="1" /><path d="M13 9h3l2 2v7a1.5 1.5 0 0 1-3 0v-3h-2" /><path d="M6 8h5" /></>,
  streaming: <><rect x="3" y="5" width="18" height="12" rx="1.5" /><path d="M10 9l5 3-5 3V9z" fill="currentColor" stroke="none" /></>,
  other: <><circle cx="7" cy="12" r="1.2" fill="currentColor" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /><circle cx="17" cy="12" r="1.2" fill="currentColor" /></>,
  card: <><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 11h18M7 15h4" /></>,
  link: <><path d="M10 14l-3 3a3 3 0 0 1-4-4l3-3M14 10l3-3a3 3 0 0 1 4 4l-3 3M9 15l6-6" /></>,
  check: <><path d="M4 12l5 5L20 6" /></>,
  flame: <><path d="M12 2C12 2 8 6 8 11a4 4 0 0 0 8 0c0-1.5-1-2.5-1-4 1.5 1 3 3 3 6a6 6 0 1 1-12 0c0-5 4-8 6-11z" /></>,
};

export default function Icon({ name, size = 18, color = 'currentColor' }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {PATHS[name] || PATHS.other}
    </svg>
  );
}
