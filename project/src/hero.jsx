// Hero — big net value delta + side-by-side card summaries

const Hero = ({ result, period }) => {
  const { ranking, totalSpendAnnual, totalSpendMonthly, delta } = result;
  const scale = period === 'monthly' ? 1/12 : 1;
  const winner = ranking[0];

  return (
    <div className="hero">
      <div className="card hero-main">
        <div className="hero-kicker">Net Annual Value · Delta (top card vs 2nd)</div>
        <div className="hero-delta">
          <span className="sign">+</span>
          <AnimatedNumber value={Math.abs(delta * scale)} />
          <span className="suffix">{period === 'monthly' ? '/mo' : '/yr'}</span>
        </div>
        <div className="hero-sub">
          Across 3 cards, <b>{winner.name}</b> returns the most net value after fees, rewards, and statement credits.
        </div>
        <div className="hero-winner">
          <span className="pip"><Icon name="check" size={12} /></span>
          Primary card · {winner.name}
        </div>

        <div style={{ marginTop: 28, display: 'flex', gap: 28, color: 'var(--muted)', fontSize: 12.5 }}>
          <div>
            <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--faint)', marginBottom: 4 }}>Spend analyzed</div>
            <div className="num-lg" style={{ color: 'var(--ink)' }}>{fmt$(period === 'monthly' ? totalSpendMonthly : totalSpendAnnual)}</div>
          </div>
          <div>
            <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--faint)', marginBottom: 4 }}>Transactions</div>
            <div className="num-lg" style={{ color: 'var(--ink)' }}>{period === 'monthly' ? '100' : '1,200'}</div>
          </div>
          <div>
            <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--faint)', marginBottom: 4 }}>Cards compared</div>
            <div className="num-lg" style={{ color: 'var(--ink)' }}>3</div>
          </div>
        </div>
      </div>

      <div className="hero-side">
        {ranking.map((c, i) => (
          <CardSummary key={c.id} brand={c.id} data={result.cards[c.id]} scale={scale} period={period} isWinner={i === 0} rank={i + 1} />
        ))}
      </div>
    </div>
  );
};

const CardSummary = ({ brand, data, scale, period, isWinner, rank }) => {
  const card = CARDS.find(c => c.id === brand);
  const pointsDisplay = card.isCashback
    ? fmt$(data.rewards * scale) + ' cash'
    : fmtPts(data.pts * scale) + ' pts';
  return (
    <div className={"card card-mini " + brand + (isWinner ? ' winner' : '')}>
      <CardChip brand={brand} />
      <div>
        <div className="card-mini-name">
          {card.name}
          <span className="iss">{card.issuer} · rank #{rank}</span>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 6, fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', flexWrap: 'wrap' }}>
          <span>{pointsDisplay}</span>
          <span>· {fmt$(data.credits * scale)} credits</span>
          <span>· -{fmt$(data.fee * scale)} fee</span>
        </div>
      </div>
      <div className="card-mini-value">
        {fmt$(data.net * scale)}
        <span className="unit">net {period === 'monthly' ? '/mo' : '/yr'}</span>
      </div>
    </div>
  );
};

const AnimatedNumber = ({ value, duration = 800 }) => {
  const [display, setDisplay] = React.useState(value);
  const prev = React.useRef(value);
  React.useEffect(() => {
    const start = prev.current;
    const delta = value - start;
    if (Math.abs(delta) < 0.5) { setDisplay(value); prev.current = value; return; }
    let raf; const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(start + delta * ease);
      if (p < 1) raf = requestAnimationFrame(step);
      else prev.current = value;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span>{fmt$(display)}</span>;
};

Object.assign(window, { Hero, CardSummary, AnimatedNumber });
