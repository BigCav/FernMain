import { useState, useEffect } from 'react';
import { Download, X, Leaf, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isIOS(): boolean {
  const ua = navigator.userAgent;
  // iPhone / iPod — always has "iPhone" or "iPod" in UA
  if (/iPhone|iPod/.test(ua)) return true;
  // iPad pre-iPadOS 13
  if (/iPad/.test(ua)) return true;
  // iPadOS 13+ disguises as Mac desktop — but has touch
  const isMacUA = /Macintosh|MacIntel|MacPPC|Mac68K/.test(ua);
  const hasTouch = 'ontouchend' in document || navigator.maxTouchPoints > 1;
  if (isMacUA && hasTouch) return true;
  return false;
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
    localStorage.getItem('fern_pwa_dismissed_v2') === '1'
  );
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  useEffect(() => {
    // Manifest
    if (!document.querySelector('link[rel="manifest"]')) {
      const l = document.createElement('link'); l.rel = 'manifest'; l.href = '/manifest.json';
      document.head.appendChild(l);
    }

    // Viewport: lock minimum scale to prevent zooming-out past page bounds
    const vp = document.querySelector('meta[name="viewport"]');
    const vpContent = 'width=device-width, initial-scale=1, minimum-scale=1, viewport-fit=cover';
    if (vp) vp.setAttribute('content', vpContent);
    else {
      const m = document.createElement('meta'); m.name = 'viewport'; m.content = vpContent;
      document.head.appendChild(m);
    }

    // PWA meta tags
    const inject = (name: string, content: string) => {
      if (!document.querySelector(`meta[name="${name}"]`)) {
        const m = document.createElement('meta'); m.name = name; m.content = content;
        document.head.appendChild(m);
      }
    };
    inject('theme-color', '#ea580c');
    inject('apple-mobile-web-app-capable', 'yes');
    inject('apple-mobile-web-app-status-bar-style', 'black-translucent');
    inject('apple-mobile-web-app-title', 'Fern');

    // Generate apple-touch-icon PNG via canvas — identical design to Android's icon.svg
    // Android icon: 512×512, rx=112, leaf at (128,128) size 256×256 (scale=10.67 on 24×24 viewBox)
    // iOS target: 180×180, same proportions → scale=180/512=0.352, rx≈39, leaf offset≈45, size≈89
    try {
      const S = 180;
      const canvas = document.createElement('canvas');
      canvas.width = S; canvas.height = S;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Orange background — rx proportional to Android (112/512 * 180 ≈ 39)
        const r = Math.round((112 / 512) * S);
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.lineTo(S - r, 0); ctx.quadraticCurveTo(S, 0, S, r);
        ctx.lineTo(S, S - r); ctx.quadraticCurveTo(S, S, S - r, S);
        ctx.lineTo(r, S);     ctx.quadraticCurveTo(0, S, 0, S - r);
        ctx.lineTo(0, r);     ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.closePath(); ctx.fill();

        // Leaf: Android places icon at 128/512 offset, 256/512 size
        // In 180px canvas: offset = 128/512*180 ≈ 45, size = 256/512*180 = 90
        // Leaf viewBox is 24×24, so scale = 90/24 = 3.75
        const offset = Math.round((128 / 512) * S);
        const leafSize = Math.round((256 / 512) * S);
        const leafScale = leafSize / 24;

        ctx.save();
        ctx.translate(offset, offset);
        ctx.scale(leafScale, leafScale);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1.75;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke(new Path2D('M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z'));
        ctx.stroke(new Path2D('M2 21c0-3 1.85-5.36 5.08-6'));
        ctx.restore();

        const png = canvas.toDataURL('image/png');
        const existing = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement | null;
        if (existing) { existing.href = png; }
        else {
          const l = document.createElement('link'); l.rel = 'apple-touch-icon'; l.href = png;
          document.head.appendChild(l);
        }
      }
    } catch { /* canvas not available */ }

    // iOS: show prompt if not already installed and not dismissed
    if (isIOS() && !isInStandalone() && !dismissed) {
      setShowIOSPrompt(true);
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
    localStorage.setItem('fern_pwa_dismissed_v2', '1');
  }

  async function handleAndroidInstall() {
    if (!prompt) return;
    await prompt.prompt();
    const result = await prompt.userChoice;
    if (result.outcome === 'accepted') setPrompt(null);
  }

  // Nothing to show
  if (dismissed || isInStandalone()) return null;

  // iOS banner
  if (showIOSPrompt && isIOS()) {
    const inSafari = isIOSSafari();
    return (
      <div
        className="fixed left-3 right-3 z-[70] md:hidden rounded-2xl px-4 py-4"
        style={{
          bottom: 'max(env(safe-area-inset-bottom), 16px)',
          background: '#111',
          boxShadow: '0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.08)',
        }}
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#ea580c' }}>
            <Leaf width={16} height={16} style={{ color: '#fff' }} />
          </div>
          <div className="flex-1 min-w-0">
            {inSafari ? (
              <>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Add Fern to your Home Screen</p>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                  Tap <Share width={11} height={11} style={{ display: 'inline', verticalAlign: '-1px', color: '#ea580c' }} /> <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Share</strong> then <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Add to Home Screen</strong>
                </p>
              </>
            ) : (
              <>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Get the Fern app</p>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                  Open this page in <strong style={{ color: '#ea580c' }}>Safari</strong> then tap Add to Home Screen
                </p>
              </>
            )}
          </div>
          <button onClick={dismiss} className="flex-shrink-0 p-1 mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
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
          bottom: 'max(env(safe-area-inset-bottom), 16px)',
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
