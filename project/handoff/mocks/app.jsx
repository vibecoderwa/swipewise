// Canvas — assembles all mocks into sections

function App() {
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = SYSTEM_CSS + `
      @keyframes blink { 50% { opacity: 0; } }
    `;
    document.head.appendChild(style);
  }, []);

  return (
    <DesignCanvas>
      <DCSection
        title="Swipewise — v2 Design Explorations"
        subtitle="Playful & bright system · phone-first · auth + onboarding + geo + widgets"
      >
        <DCArtboard label="Design system" width={720} height={600}>
          <SystemSheet />
        </DCArtboard>
      </DCSection>

      <DCSection
        title="1. Landing page"
        subtitle="First impression, pre-login. Two directions — big type vs. receipt-ticket."
      >
        <DCArtboard label="A · Big type + wallet spill" width={402} height={874}>
          <LandingA />
        </DCArtboard>
        <DCArtboard label="B · Receipt / ticket stub" width={402} height={874}>
          <LandingB />
        </DCArtboard>
      </DCSection>

      <DCSection
        title="2. Sign up & log in — phone + OTP"
        subtitle="No passwords. Apple/Google can layer on later; this is the primary path."
      >
        <DCArtboard label="Phone entry" width={402} height={874}>
          <AuthA_Phone />
        </DCArtboard>
        <DCArtboard label="OTP verify" width={402} height={874}>
          <AuthB_OTP />
        </DCArtboard>
      </DCSection>

      <DCSection
        title="3. Onboarding — add cards"
        subtitle="Plaid-first for auto-detection; manual as a clean fallback."
      >
        <DCArtboard label="A · Plaid connect" width={402} height={874}>
          <OnboardA_Plaid />
        </DCArtboard>
        <DCArtboard label="B · Manual pick from catalog" width={402} height={874}>
          <OnboardB_Manual />
        </DCArtboard>
      </DCSection>

      <DCSection
        title="4. Geo-suggest — in-app"
        subtitle="When the user opens the app near merchants. List view (comparative) vs. banner (focused)."
      >
        <DCArtboard label="A · Nearby list + map peek" width={402} height={874}>
          <GeoA_List />
        </DCArtboard>
        <DCArtboard label="B · You're-here banner" width={402} height={874}>
          <GeoB_Banner />
        </DCArtboard>
      </DCSection>

      <DCSection
        title="5. Push moments"
        subtitle="Lock screen notifications — the highest-leverage surface for this product."
      >
        <DCArtboard label="A · Arrival alert + expiring credit" width={402} height={874}>
          <PushA_Arrival />
        </DCArtboard>
        <DCArtboard label="B · Dynamic Island + lock widgets" width={402} height={874}>
          <PushB_DynamicIsland />
        </DCArtboard>
      </DCSection>

      <DCSection
        title="6. Home-screen widgets — in context"
        subtitle="How the widgets look on an actual iOS home screen. Small / Medium / Large."
      >
        <DCArtboard label="Large widget — top-3 nearby" width={402} height={874}>
          <HomeScreenMock>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <LargeA />
            </div>
          </HomeScreenMock>
        </DCArtboard>
        <DCArtboard label="Large widget — monthly earnings" width={402} height={874}>
          <HomeScreenMock wallpaper="cool">
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <LargeB />
            </div>
          </HomeScreenMock>
        </DCArtboard>
        <DCArtboard label="Medium + Small combo" width={402} height={874}>
          <HomeScreenMock>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
              <MediumA />
            </div>
            <div style={{ display: 'flex', gap: 18, justifyContent: 'center' }}>
              <SmallA />
              <SmallB />
            </div>
          </HomeScreenMock>
        </DCArtboard>
      </DCSection>

      <DCSection
        title="7. Lock-screen widgets"
        subtitle="Rectangular (wide) + circular (glance) — for iOS 16+ customizable lock screen."
      >
        <DCArtboard label="Lock widgets on lock screen" width={402} height={874}>
          <LockScreenMock>
            <div style={{
              position: 'absolute', bottom: 140, left: 0, right: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <LockCircleA />
                <LockCircleB />
              </div>
              <LockRectA />
            </div>
          </LockScreenMock>
        </DCArtboard>
        <DCArtboard label="Widget gallery — all sizes" width={720} height={874}>
          <WidgetGallery />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

// A clean swatch board showing the design system tokens
function SystemSheet() {
  const swatches = [
    ['Ink',     T.ink],    ['Paper',   T.paper],  ['Cream',   T.cream],
    ['Lemon',   T.lemon],  ['Mint',    T.mint],   ['Coral',   T.coral],
    ['Sky',     T.sky],    ['Plum',    T.plum],   ['Graphite',T.graphite],
  ];
  return (
    <div style={{
      width: '100%', height: '100%', padding: 32, background: T.paper,
      fontFamily: T.body,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: T.dim, textTransform: 'uppercase' }}>Design system</div>
      <h1 className="display" style={{ fontSize: 44, fontWeight: 800, margin: '6px 0 4px', letterSpacing: -0.03 }}>
        Quiet. Warm. <span style={{ fontStyle: 'italic', color: T.graphite }}>Considered.</span>
      </h1>
      <div style={{ fontSize: 13, color: T.graphite, marginBottom: 20 }}>
        Editorial leanings · muted warm palette · expressive serif numbers · paper base · soft shadows, not hard.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 8, marginBottom: 20 }}>
        {swatches.map(([n,c]) => (
          <div key={n}>
            <div style={{ height: 54, background: c, border: `1px solid ${T.hairline}`, borderRadius: 8 }}/>
            <div style={{ fontSize: 10, fontWeight: 600, marginTop: 6 }}>{n}</div>
            <div style={{ fontSize: 9, color: T.dim, fontFamily: T.mono }}>{c}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 20, marginTop: 24, alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.4, color: T.dim, marginBottom: 8, textTransform: 'uppercase' }}>Display · Fraunces</div>
          <div className="display" style={{ fontSize: 68, fontWeight: 900, lineHeight: 0.95, letterSpacing: -0.03 }}>+$518</div>
          <div className="display" style={{ fontSize: 28, fontWeight: 800, fontStyle: 'italic', marginTop: 4 }}>opinionated.</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.4, color: T.dim, marginBottom: 8, textTransform: 'uppercase' }}>Body · Inter Tight</div>
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Your wallet just got opinionated.</div>
          <div style={{ fontSize: 14, fontWeight: 500, color: T.graphite, lineHeight: 1.45 }}>Know which card to swipe, before you swipe it. We track your rewards, credits, and every coffee you forget to expense.</div>
          <div className="mono" style={{ fontSize: 12, marginTop: 10, color: T.graphite }}>+1 (415) ••• 0199 · mono</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
        <ChunkyBtn>Primary</ChunkyBtn>
        <ChunkyBtn bg={T.lemon} fg={T.ink}>Accent</ChunkyBtn>
        <ChunkyBtn bg={T.mint} fg={T.ink}>Positive</ChunkyBtn>
        <ChunkyBtn bg={T.coral} fg="#fff">Alert</ChunkyBtn>
        <Pill bg={T.lemon}>tag</Pill>
        <Pill bg={T.mint}>on track</Pill>
        <Pill bg={T.coral} fg="#fff">expiring</Pill>
      </div>
    </div>
  );
}

function WidgetGallery() {
  return (
    <div style={{
      width: '100%', height: '100%', padding: 30, background: T.smoke,
      fontFamily: T.body, overflow: 'hidden',
    }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: T.dim, textTransform: 'uppercase' }}>All widget sizes</div>
      <h2 className="display" style={{ fontSize: 30, fontWeight: 900, margin: '4px 0 20px', letterSpacing: -0.02 }}>
        Small · Medium · Large · Lock
      </h2>
      <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <Caption>Small A · nearest</Caption>
          <SmallA />
        </div>
        <div>
          <Caption>Small B · monthly</Caption>
          <SmallB />
        </div>
        <div>
          <Caption>Medium A · top 3</Caption>
          <MediumA />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', marginTop: 26, flexWrap: 'wrap' }}>
        <div>
          <Caption>Medium B · you're at</Caption>
          <MediumB />
        </div>
        <div>
          <Caption>Lock widgets</Caption>
          <div style={{
            padding: 18, background: '#141821', borderRadius: 14,
            display: 'flex', gap: 10, alignItems: 'center',
          }}>
            <LockCircleA />
            <LockCircleB />
          </div>
          <div style={{ marginTop: 10, padding: 10, background: '#141821', borderRadius: 14, display: 'inline-block' }}>
            <LockRectA />
          </div>
        </div>
      </div>
    </div>
  );
}

function Caption({ children }) {
  return <div style={{ fontSize: 10, fontWeight: 700, color: T.dim, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>{children}</div>;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
