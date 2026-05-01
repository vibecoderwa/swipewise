// 12-month timeline SVG — 3 lines

const Timeline = ({ state }) => {
  const data = monthlyTimeline(state);
  const w = 1000, h = 240, padL = 44, padR = 16, padT = 20, padB = 30;
  const iw = w - padL - padR, ih = h - padT - padB;

  const max = Math.max(...data.flatMap(d => CARDS.map(c => d[c.id]))) * 1.15;
  const min = 0;
  const x = (i) => padL + (i / (data.length - 1)) * iw;
  const y = (v) => padT + ih - ((v - min) / (max - min)) * ih;

  const line = (key) => data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(d[key])}`).join(' ');
  const area = (key) => line(key) + ` L ${x(data.length-1)} ${y(0)} L ${x(0)} ${y(0)} Z`;

  const ticks = 4;
  const tickVals = Array.from({length: ticks + 1}, (_, i) => min + (max - min) * (i / ticks));

  const total = (key) => data.reduce((s,d) => s + d[key], 0);
  const colorFor = { gold: 'var(--gold)', csr: 'var(--csr)', savor: 'var(--savor)' };

  return (
    <div className="card">
      <div className="timeline-wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, flexWrap: 'wrap', gap: 10 }}>
          <div className="timeline-legend">
            {CARDS.map(c => (
              <span key={c.id} className="legend-dot">
                <span className={"sw " + c.id}/>{c.name} · {fmt$(total(c.id))}
              </span>
            ))}
          </div>
          <div className="num num-muted" style={{ fontSize: 11.5 }}>Trailing 12 months · rewards value</div>
        </div>
        <svg className="tl-svg" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="gold-grad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="csr-grad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--csr)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="var(--csr)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="savor-grad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--savor)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="var(--savor)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {tickVals.map((v, i) => (
            <g key={i}>
              <line className="tl-gridline" x1={padL} x2={w - padR} y1={y(v)} y2={y(v)} />
              <text className="tl-axis" x={padL - 8} y={y(v) + 3} textAnchor="end">{fmt$(v).replace(',000','k')}</text>
            </g>
          ))}

          <path d={area('gold')}  fill="url(#gold-grad)" />
          <path d={area('csr')}   fill="url(#csr-grad)"  />
          <path d={area('savor')} fill="url(#savor-grad)"/>
          {CARDS.map(c => (
            <path key={c.id} d={line(c.id)} stroke={colorFor[c.id]} strokeWidth="1.8" fill="none" />
          ))}

          {data.map((d, i) => (
            <g key={i}>
              {CARDS.map(c => (
                <circle key={c.id} cx={x(i)} cy={y(d[c.id])} r="2.5" fill={colorFor[c.id]} />
              ))}
              <text className="tl-axis" x={x(i)} y={h - 10} textAnchor="middle">{d.m}</text>
            </g>
          ))}
        </svg>

        <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4, fontStyle: 'italic', fontFamily: 'var(--font-serif)' }}>
          Peaks in Nov–Dec from holiday flights, dining, and shopping. Reserve outperforms during travel months; Gold wins steady-state; Savor is a consistent floor with no fee.
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { Timeline });
