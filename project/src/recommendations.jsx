// Recommendation cards — 3-card version

const Recommendations = ({ result, period }) => {
  const scale = period === 'monthly' ? 1/12 : 1;

  // Group categories by best card
  const byCard = { gold: [], csr: [], savor: [] };
  result.rows.forEach(r => { byCard[r.winner].push(r); });
  Object.keys(byCard).forEach(k => byCard[k].sort((a,b)=>b.delta-a.delta));

  const optimizedGain = (result.optimizedNet - result.ranking[0].net) * scale;

  return (
    <div className="rec-grid">
      <RecCard brand="gold" rows={byCard.gold} title={<><em>Dining</em>, <em>groceries</em>,<br/>food delivery.</>} scale={scale} />
      <RecCard brand="csr"  rows={byCard.csr}  title={<><em>Flights</em>, <em>hotels</em>,<br/>Chase Travel portal.</>} scale={scale} />
      <RecCard brand="savor" rows={byCard.savor} title={<><em>Entertainment</em>,<br/><em>streaming</em>, no-fee fallback.</>} scale={scale} />

      <div className="card rec-card" style={{ background: 'linear-gradient(180deg, #e8eadf 0%, var(--card) 80%)', gridColumn: 'span 3' }}>
        <div className="rec-head">
          <Icon name="bolt" size={13} />
          If you kept all three cards
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr 1fr', gap: 16, alignItems: 'center' }}>
          <h3 style={{ lineHeight: 1.1, margin: 0 }}>Optimal split nets<br/><em>{fmt$(result.optimizedNet * scale)}</em> {period === 'monthly' ? '/mo' : '/yr'}.</h3>

          <StatBox label="Rewards (best-of)" value={fmt$(result.optimizedRewards * scale)} />
          <StatBox label="Credits (all)" value={fmt$(Object.values(result.cards).reduce((s,c)=>s+c.credits,0) * scale)} />
          <StatBox label="Fees (all)" value={'-' + fmt$(Object.values(result.cards).reduce((s,c)=>s+c.fee,0) * scale)} neg />
          <div style={{ padding: '14px 16px', background: 'var(--ink)', color: 'var(--paper)', borderRadius: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', opacity: 0.6 }}>Gain vs best single</div>
            <div className="num" style={{ fontWeight: 600, fontSize: 18, marginTop: 4, color: optimizedGain > 0 ? '#9be3b6' : '#ffb1b1' }}>
              {optimizedGain >= 0 ? '+' : ''}{fmt$(optimizedGain, Math.abs(optimizedGain) < 10 ? 2 : 0)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RecCard = ({ brand, rows, title, scale }) => {
  const card = CARDS.find(c => c.id === brand);
  const bgVar = brand === 'gold' ? 'var(--gold-wash)' : brand === 'csr' ? 'var(--csr-wash)' : 'var(--savor-wash)';
  const top = rows.slice(0, 3);
  return (
    <div className="card rec-card" style={{ background: `linear-gradient(180deg, ${bgVar} 0%, var(--card) 80%)` }}>
      <div className="rec-head">
        <Icon name="sparkle" size={13} />
        Agent · use {card.name.replace('Capital One ','').replace('American Express ','')} for
      </div>
      <h3>{title}</h3>
      {top.length === 0 ? (
        <div className="num-muted" style={{ fontSize: 12.5, fontStyle: 'italic', fontFamily: 'var(--font-serif)' }}>
          This card doesn't win any categories at your current spend. Still useful for credits/fallback.
        </div>
      ) : top.map(r => (
        <div key={r.id} className="rec-card-line">
          <CardChip brand={brand} size="sm" />
          <div>
            <div>{r.name}</div>
            <div className="num-muted" style={{ fontSize: 11 }}>
              {brand === 'savor' ? r.per[brand].mult + '%' : r.per[brand].mult + '×'} on {card.name.split(' ')[0]}
            </div>
          </div>
          <div className="gain">+{fmt$(r.delta * scale, r.delta * scale < 10 ? 2 : 0)}</div>
        </div>
      ))}
    </div>
  );
};

const StatBox = ({ label, value, neg }) => (
  <div style={{ padding: '12px 14px', background: 'var(--paper)', border: '1px solid var(--hairline)', borderRadius: 10 }}>
    <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--faint)' }}>{label}</div>
    <div className="num num-lg" style={{ marginTop: 4, color: neg ? 'var(--red)' : 'var(--ink)' }}>{value}</div>
  </div>
);

Object.assign(window, { Recommendations });
