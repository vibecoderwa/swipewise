// Push notification moments — 2 variations
// Shown on a lock-screen-like background

function PushScene({ children, time = '9:41' }) {
  return (
    <div style={{
      width: 402, height: 874, borderRadius: 0,
      background: `linear-gradient(180deg, #1a1f2b 0%, #0a0d14 100%)`,
      position: 'relative', overflow: 'hidden', color: '#fff',
      fontFamily: '-apple-system, system-ui',
    }}>
      <FakeStatus time={time} dark />
      {/* giant time */}
      <div style={{ textAlign: 'center', paddingTop: 30 }}>
        <div style={{ fontSize: 14, fontWeight: 500, opacity: 0.7 }}>Sunday, April 26</div>
        <div style={{ fontSize: 88, fontWeight: 300, letterSpacing: -3, lineHeight: 0.9, marginTop: 6 }}>{time}</div>
      </div>
      {/* soft light spot */}
      <div style={{ position: 'absolute', top: 100, left: -100, width: 500, height: 500, background: 'radial-gradient(circle, rgba(255,217,61,0.18) 0%, transparent 60%)', pointerEvents: 'none' }} />
      {children}
      {/* bottom indicators */}
      <div style={{ position: 'absolute', bottom: 30, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '0 40px' }}>
        <div style={{ width: 44, height: 44, borderRadius: 22, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🔦</div>
        <div style={{ width: 44, height: 44, borderRadius: 22, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📷</div>
      </div>
    </div>
  );
}

function PushA_Arrival() {
  return (
    <PushScene time="2:14">
      {/* Single rich notification */}
      <div style={{ position: 'absolute', top: 300, left: 12, right: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{
          background: 'rgba(255,255,255,0.92)', color: T.ink,
          borderRadius: 20, padding: '12px 14px', backdropFilter: 'blur(20px)',
          display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: T.lemon, border: `1.5px solid ${T.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 20 }}>$</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>Swipewise</span>
              <span style={{ fontSize: 11, color: T.dim }}>now</span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, marginTop: 2, lineHeight: 1.3 }}>
              Walking into Whole Foods? <span style={{ color: T.mintDk }}>Use Gold</span> — 4× on groceries, +$9.60 on your usual basket.
            </div>
          </div>
        </div>

        {/* a dismissed/older alert peeks underneath */}
        <div style={{
          background: 'rgba(255,255,255,0.75)', color: T.ink,
          borderRadius: 20, padding: '10px 14px', margin: '0 14px',
          display: 'flex', alignItems: 'center', gap: 10,
          opacity: 0.85,
          boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
        }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: T.coral, border: `1.5px solid ${T.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⏰</div>
          <div style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>Uber Cash expires Sunday — $15 unused</div>
          <span style={{ fontSize: 11, color: T.dim }}>2h ago</span>
        </div>
      </div>
    </PushScene>
  );
}

function PushB_DynamicIsland() {
  return (
    <div style={{
      width: 402, height: 874,
      background: `linear-gradient(180deg, #151821 0%, #070a10 100%)`,
      position: 'relative', overflow: 'hidden', color: '#fff',
      fontFamily: '-apple-system, system-ui',
    }}>
      <FakeStatus dark />

      {/* Dynamic Island — expanded Live Activity */}
      <div style={{
        position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
        minWidth: 370, background: '#000', borderRadius: 28, padding: '12px 18px',
        display: 'flex', alignItems: 'center', gap: 14,
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{
          width: 46, height: 30, borderRadius: 5, background: T.amex,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, fontWeight: 900, letterSpacing: 1,
        }}>AMEX</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: 'rgba(255,217,61,0.9)', textTransform: 'uppercase' }}>You're at Whole Foods</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginTop: 1 }}>Swipe Gold · 4× points</div>
        </div>
        <div style={{
          padding: '6px 10px', borderRadius: 10,
          background: T.lemon, color: T.ink, fontSize: 12, fontWeight: 800,
        }}>+$9.60</div>
      </div>

      {/* Time */}
      <div style={{ textAlign: 'center', paddingTop: 120 }}>
        <div style={{ fontSize: 14, fontWeight: 500, opacity: 0.7 }}>Sunday, April 26</div>
        <div style={{ fontSize: 88, fontWeight: 300, letterSpacing: -3, lineHeight: 0.9, marginTop: 6 }}>2:14</div>
      </div>

      {/* Lock-screen widgets */}
      <div style={{ margin: '60px 16px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{
          padding: 14, background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)', borderRadius: 18, border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.6, letterSpacing: 1, textTransform: 'uppercase' }}>Swipewise</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginTop: 6, lineHeight: 1.2 }}>Use Gold here</div>
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>4× on groceries</div>
        </div>
        <div style={{
          padding: 14, background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)', borderRadius: 18, border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.6, letterSpacing: 1, textTransform: 'uppercase' }}>Expiring</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginTop: 6 }}>Uber $15</div>
          <div style={{ fontSize: 12, color: '#ffb4a2', marginTop: 4 }}>in 2 days</div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 30, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '0 40px' }}>
        <div style={{ width: 44, height: 44, borderRadius: 22, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🔦</div>
        <div style={{ width: 44, height: 44, borderRadius: 22, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📷</div>
      </div>
    </div>
  );
}

Object.assign(window, { PushA_Arrival, PushB_DynamicIsland });
