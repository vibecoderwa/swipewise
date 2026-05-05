import { useEffect, useState } from 'react';

const DISMISS_KEY = 'swipewise_install_dismissed';

export default function InstallPrompt() {
  const [dismissed, setDismissed] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === '1');
    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  function dismiss() {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, '1');
  }

  if (dismissed) return null;

  // Already installed (running standalone)?
  if (typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
       window.navigator.standalone)) {
    return null;
  }

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isIOS = /iPhone|iPad|iPod/.test(ua) && !/Android/.test(ua);
  const isAndroidChrome = /Android/.test(ua) && /Chrome/.test(ua);

  if (deferredPrompt && isAndroidChrome) {
    return (
      <div className="ios-install">
        <div style={{ flex: 1 }}>
          <b>Install Swipewise</b> for one-tap access. No app store needed.
        </div>
        <button
          onClick={async () => {
            deferredPrompt.prompt();
            await deferredPrompt.userChoice;
            setDeferredPrompt(null);
          }}
          style={{ color: 'var(--accent)', fontWeight: 600 }}
        >
          Install
        </button>
        <button onClick={dismiss} aria-label="Dismiss">×</button>
      </div>
    );
  }

  if (isIOS) {
    return (
      <div className="ios-install">
        <div style={{ flex: 1 }}>
          <b>Add to Home Screen</b><br />
          Tap the Share icon below, then "Add to Home Screen" — feels like a real app.
        </div>
        <button onClick={dismiss} aria-label="Dismiss">×</button>
      </div>
    );
  }

  return null;
}
