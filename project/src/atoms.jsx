// Atoms — icons, chips, formatters

const fmt$ = (n, dec=0) => {
  const sign = n < 0 ? '-' : '';
  const v = Math.abs(n);
  return sign + '$' + v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
};
const fmtN = (n) => Math.round(n).toLocaleString('en-US');
const fmtPts = (n) => Math.round(n).toLocaleString('en-US');

const CARD_LABEL = {
  gold: 'Gold', csr: 'CSR', savor: 'Savor'
};

const Icon = ({ name, size = 16 }) => {
  const s = { width: size, height: size, stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' };
  const paths = {
    dining: <><path d="M3 3v7a3 3 0 0 0 3 3v8" /><path d="M6 3v7M9 3v7" /><path d="M15 3c-1.5 0-3 2-3 5s1.5 5 3 5v8" /></>,
    grocery: <><path d="M3 4h2l2 11h11l2-8H7" /><circle cx="9" cy="19" r="1.3" /><circle cx="17" cy="19" r="1.3" /></>,
    flight: <><path d="M21 12l-8 2-4 7-1-1 2-6-6 1-2-2 9-4 5-8 2 1-1 6 5 2-1 2z" /></>,
    hotel: <><path d="M3 20V6M21 20V10M3 10h18M3 14h18M7 10V7h4v3M13 12v-1h4v1" /></>,
    travel: <><rect x="5" y="6" width="14" height="13" rx="1.5" /><path d="M9 6V4h6v2M5 12h14" /></>,
    rideshare: <><path d="M5 17h14l-2-6H7l-2 6zM7 17v2M17 17v2" /><circle cx="8.5" cy="14.5" r="1" /><circle cx="15.5" cy="14.5" r="1" /></>,
    gas: <><rect x="4" y="4" width="9" height="16" rx="1" /><path d="M13 9h3l2 2v7a1.5 1.5 0 0 1-3 0v-3h-2" /><path d="M6 8h5" /></>,
    transit: <><rect x="5" y="4" width="14" height="14" rx="2" /><path d="M5 13h14M9 18l-2 3M15 18l2 3" /><circle cx="9" cy="15.5" r=".6" fill="currentColor" /><circle cx="15" cy="15.5" r=".6" fill="currentColor" /></>,
    streaming: <><rect x="3" y="5" width="18" height="12" rx="1.5" /><path d="M10 9l5 3-5 3V9z" fill="currentColor" stroke="none" /></>,
    online: <><rect x="3" y="4" width="18" height="13" rx="1" /><path d="M8 21h8M12 17v4" /></>,
    shopping: <><path d="M6 7h12l-1 12H7L6 7z" /><path d="M9 7a3 3 0 0 1 6 0" /></>,
    utilities: <><path d="M12 3v3M5 7l2 2M19 7l-2 2M3 14h3M18 14h3" /><rect x="7" y="10" width="10" height="10" rx="1.5" /><path d="M11 14l-1 3h2l-1 3" /></>,
    health: <><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.5-7 10-7 10z" /></>,
    entertainment: <><circle cx="12" cy="12" r="8" /><path d="M10 9l5 3-5 3V9z" fill="currentColor" stroke="none" /></>,
    other: <><circle cx="7" cy="12" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="17" cy="12" r="1.2" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    sparkle: <><path d="M12 4l1.5 5.5L19 11l-5.5 1.5L12 18l-1.5-5.5L5 11l5.5-1.5z" /></>,
    calendar: <><rect x="4" y="5" width="16" height="15" rx="1.5" /><path d="M4 10h16M8 3v4M16 3v4" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19 12l2-1-2-1 1-2-2 1-1-2-1 2-2-1 1 2-2 1 2 1-1 2 2-1 1 2 1-2 2 1z" /></>,
    check: <><path d="M5 12l5 5 9-11" /></>,
    bolt: <><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
  };
  return <svg viewBox="0 0 24 24" style={s}>{paths[name] ?? paths.other}</svg>;
};

const CardChip = ({ brand = 'gold', size = 'md' }) => {
  const dims = size === 'sm'
    ? { w: 32, h: 21, fontSize: 7.5 }
    : { w: 42, h: 28, fontSize: 9 };
  const labels = { gold: 'GOLD', csr: 'CSR', savor: 'SAVOR' };
  return (
    <div className={"chip " + brand} style={{ width: dims.w, height: dims.h, fontSize: dims.fontSize }}>
      {labels[brand]}
    </div>
  );
};

const Seg = ({ options, value, onChange }) => (
  <div className="seg">
    {options.map(o => (
      <button key={o.value} className={value === o.value ? 'on' : ''} onClick={() => onChange(o.value)}>{o.label}</button>
    ))}
  </div>
);

Object.assign(window, { Icon, CardChip, Seg, fmt$, fmtN, fmtPts, CARD_LABEL });
