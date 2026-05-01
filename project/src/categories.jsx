// Per-category breakdown — 3 cards

const CategoryTable = ({ result, period }) => {
  const scale = period === 'monthly' ? 1/12 : 1;
  const rows = [...result.rows].sort((a,b) => b.annualSpend - a.annualSpend);

  return (
    <div className="card cat-table">
      <div className="cat-header" style={{ gridTemplateColumns: '1.5fr 0.9fr 1fr 1fr 1fr 0.9fr' }}>
        <div>Category</div>
        <div>Spend</div>
        <div>Gold</div>
        <div>Reserve</div>
        <div>Savor</div>
        <div>Winner</div>
      </div>
      {rows.map(r => <CatRow key={r.id} r={r} scale={scale} period={period} />)}
    </div>
  );
};

const CatRow = ({ r, scale, period }) => {
  const spendDisplay = period === 'monthly' ? r.monthlySpend : r.annualSpend;
  const winnerCard = CARDS.find(c => c.id === r.winner);

  return (
    <div className="cat-row" style={{ gridTemplateColumns: '1.5fr 0.9fr 1fr 1fr 1fr 0.9fr' }}>
      <div className="cat-name">
        <div className="cat-icon"><Icon name={r.icon} /></div>
        <div>
          {r.name}
          <span className="cat-txns">{r.txns} {r.txns === 1 ? 'txn' : 'txns'}/mo</span>
        </div>
      </div>
      <div>
        <div className="num num-lg">{fmt$(spendDisplay)}</div>
        <div className="num num-muted" style={{fontSize: 11, marginTop: 2}}>per {period === 'monthly' ? 'month' : 'year'}</div>
      </div>
      <CardCell brand="gold"  per={r.per.gold}  scale={scale} isWinner={r.winner === 'gold'}/>
      <CardCell brand="csr"   per={r.per.csr}   scale={scale} isWinner={r.winner === 'csr'}/>
      <CardCell brand="savor" per={r.per.savor} scale={scale} isWinner={r.winner === 'savor'} isCashback />
      <div>
        <span className={"winner-pill " + r.winner}>
          <span className="dot"/>{winnerCard.name.replace('Capital One ', '').replace('Sapphire ', '')}
        </span>
        <div className="num num-muted" style={{ fontSize: 11, marginTop: 4, color: 'var(--green)' }}>
          +{fmt$(r.delta * scale, r.delta * scale < 10 ? 2 : 0)}
        </div>
      </div>
    </div>
  );
};

const CardCell = ({ brand, per, scale, isWinner, isCashback }) => {
  const multClass = per.mult >= 2 ? brand : 'dim';
  const multLabel = isCashback ? per.mult + '%' : per.mult + 'x';
  return (
    <div className="pts-cell">
      <span className={"mult " + multClass}>{multLabel}</span>
      <div style={isWinner ? { fontWeight: 600 } : {}}>
        <div className="num">{fmt$(per.val * scale, per.val * scale < 10 ? 2 : 0)}</div>
        <div className="num num-muted" style={{fontSize: 11}}>
          {isCashback ? 'cashback' : fmtPts(per.pts * scale) + ' pts'}
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { CategoryTable });
