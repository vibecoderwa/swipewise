// Home-screen mock — shows widgets on a realistic iOS home screen
// Used on the canvas to give widgets context, not as a standalone screen.

function HomeScreenMock({ children, wallpaper = 'warm', title = 'With widget' }) {
  const wp = wallpaper === 'warm'
    ? `radial-gradient(at 20% 20%, #f6a67b, #c9556a 50%, #4a1d3a 100%)`
    : `radial-gradient(at 70% 30%, #7fb8e8, #3d5a8c 50%, #0f1e33 100%)`;
  return (
    <div style={{
      width: 402, height: 874, position: 'relative', overflow: 'hidden',
      background: wp, fontFamily: '-apple-system, system-ui', color: '#fff',
      borderRadius: 0,
    }}>
      <FakeStatus dark />

      <div style={{ padding: '50px 22px 0' }}>
        {children}
      </div>

      {/* App grid below widgets */}
      <div style={{
        position: 'absolute', bottom: 120, left: 22, right: 22,
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24,
      }}>
        {['Messages','Safari','Photos','Maps','Calendar','Notes','Camera','Clock'].map((a, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{
              width: 60, height: 60, borderRadius: 14, margin: '0 auto',
              background: ['#4CD964','#007AFF','#FF9500','#FF3B30','#FF2D55','#FFCC00','#8E8E93','#5856D6'][i],
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }} />
            <div style={{ fontSize: 11, fontWeight: 500, marginTop: 6, textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>{a}</div>
          </div>
        ))}
      </div>

      {/* Dock */}
      <div style={{
        position: 'absolute', bottom: 20, left: 12, right: 12, height: 88,
        background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.12)', borderRadius: 30,
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      }}>
        {['#4CD964','#007AFF','#FF9500','#FF3B30'].map((c, i) => (
          <div key={i} style={{
            width: 58, height: 58, borderRadius: 14, background: c,
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          }} />
        ))}
      </div>

      {/* home indicator */}
      <div style={{
        position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)',
        width: 134, height: 5, borderRadius: 3, background: '#fff',
      }} />
    </div>
  );
}

// Lock screen background (for lock widgets in context)
function LockScreenMock({ children, time = '9:41' }) {
  return (
    <div style={{
      width: 402, height: 874, position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(180deg, #1a1f2b 0%, #0a0d14 100%)',
      fontFamily: '-apple-system, system-ui', color: '#fff',
    }}>
      <FakeStatus dark time={time} />
      <div style={{ position: 'absolute', top: 100, left: -100, width: 500, height: 500, background: 'radial-gradient(circle, rgba(255,217,61,0.15) 0%, transparent 60%)', pointerEvents: 'none' }} />

      {/* date + time */}
      <div style={{ textAlign: 'center', paddingTop: 40 }}>
        <div style={{ fontSize: 14, fontWeight: 500, opacity: 0.75 }}>Sunday, April 26</div>
        <div style={{ fontSize: 88, fontWeight: 300, letterSpacing: -3, lineHeight: 0.9, marginTop: 6 }}>{time}</div>
      </div>

      {children}

      {/* bottom flashlight/camera */}
      <div style={{ position: 'absolute', bottom: 30, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '0 40px' }}>
        <div style={{ width: 44, height: 44, borderRadius: 22, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🔦</div>
        <div style={{ width: 44, height: 44, borderRadius: 22, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📷</div>
      </div>
      <div style={{
        position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)',
        width: 134, height: 5, borderRadius: 3, background: '#fff', opacity: 0.8,
      }} />
    </div>
  );
}

Object.assign(window, { HomeScreenMock, LockScreenMock });
