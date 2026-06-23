import { useState, useEffect } from 'react';
import { Download, X, Leaf, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

function isInStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;
}

function isIOSSafari(): boolean {
  const ua = navigator.userAgent;
  return isIOS() && /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|mercury/.test(ua);
}

export function PWAInstallBanner() {
  const [prompt,    setPrompt]    = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem('fern_pwa_dismissed') === '1'
  );
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  useEffect(() => {
    // Inject manifest link
    if (!document.querySelector('link[rel="manifest"]')) {
      const link = document.createElement('link');
      link.rel = 'manifest';
      link.href = '/manifest.json';
      document.head.appendChild(link);
    }
    // theme-color (Android + Chrome)
    if (!document.querySelector('meta[name="theme-color"]')) {
      const m = document.createElement('meta');
      m.name = 'theme-color'; m.content = '#ea580c';
      document.head.appendChild(m);
    }
    // Apple PWA capable
    if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
      const m = document.createElement('meta');
      m.name = 'apple-mobile-web-app-capable'; m.content = 'yes';
      document.head.appendChild(m);
    }
    // Apple status bar — orange by matching theme-color
    if (!document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')) {
      const m = document.createElement('meta');
      m.name = 'apple-mobile-web-app-status-bar-style'; m.content = 'black-translucent';
      document.head.appendChild(m);
    }
    // Apple title
    if (!document.querySelector('meta[name="apple-mobile-web-app-title"]')) {
      const m = document.createElement('meta');
      m.name = 'apple-mobile-web-app-title'; m.content = 'Fern';
      document.head.appendChild(m);
    }
    // Apple touch icon
    if (!document.querySelector('link[rel="apple-touch-icon"]')) {
      const l = document.createElement('link');
      l.rel = 'apple-touch-icon'; l.href = '/apple-touch-icon.svg';
      document.head.appendChild(l);
    }

    // iOS: show Add to Home Screen prompt if in Safari and not already installed
    if (isIOS() && !isInStandalone() && !dismissed) {
      if (!isIOSSafari()) {
        // Not in Safari — show "open in Safari" nudge
        setShowIOSPrompt(true);
      } else {
        // In Safari — show Add to Home Screen prompt
        setShowIOSPrompt(true);
      }
    }
  }, []);

  // Android: capture native install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  function dismiss() {
    setDismissed(true);
    setShowIOSPrompt(false);
    localStorage.setItem('fern_pwa_dismissed', '1');
  }

  async function handleAndroidInstall() {
    if (!prompt) return;
    await prompt.prompt();
    const result = await prompt.userChoice;
    if (result.outcome === 'accepted') setPrompt(null);
  }

  // Nothing to show
  if (dismissed || isInStandalone()) return null;

  // iOS banner (Safari: Add to Home Screen, other browser: open in Safari)
  if (showIOSPrompt && isIOS()) {
    const inSafari = isIOSSafari();
    return (
      <div
        className="fixed left-3 right-3 z-[70] md:hidden rounded-2xl px-4 py-3.5"
        style={{
          bottom: 'calc(max(env(safe-area-inset-bottom), 12px) + 68px + 8px)',
          background: '#111',
          boxShadow: '0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.07)',
        }}
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#ea580c' }}>
            <Leaf width={16} height={16} style={{ color: '#fff' }} />
          </div>
          <div className="flex-1 min-w-0">
            {inSafari ? (
              <>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '3px' }}>
                  Add Fern to your Home Screen
                </p>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
                  Tap <Share width={11} height={11} style={{ display: 'inline', verticalAlign: 'middle', color: 'rgba(255,255,255,0.7)' }} /> Share, then <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Add to Home Screen</strong> for the full app experience
                </p>
              </>
            ) : (
              <>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '3px' }}>
                  Get the full Fern experience
                </p>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
                  Open Fern in <strong style={{ color: '#ea580c' }}>Safari</strong>, then tap Add to Home Screen for a native app feel
                </p>
              </>
            )}
          </div>
          <button onClick={dismiss} className="flex-shrink-0 p-1 rounded-lg mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <X width={14} height={14} />
          </button>
        </div>
      </div>
    );
  }

  // Android native install prompt
  if (prompt) {
    return (
      <div
        className="fixed left-3 right-3 z-[70] md:left-auto md:right-5 md:bottom-5 md:w-80 rounded-2xl flex items-center gap-3 px-4 py-3.5"
        style={{
          bottom: 'calc(max(env(safe-area-inset-bottom), 12px) + 68px + 8px)',
          background: '#111',
          boxShadow: '0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.07)',
        }}
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#ea580c' }}>
          <Leaf width={16} height={16} style={{ color: '#fff' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '1px' }}>Install Fern</p>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>Add to home screen for quick access</p>
        </div>
        <button
          onClick={handleAndroidInstall}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl flex-shrink-0 transition-all active:scale-95"
          style={{ background: '#ea580c', fontSize: '12px', fontWeight: 700, color: '#fff' }}
        >
          <Download width={12} height={12} />
          Install
        </button>
        <button onClick={dismiss} className="flex-shrink-0 p-1 rounded-lg" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <X width={14} height={14} />
        </button>
      </div>
    );
  }

  return null;
}
