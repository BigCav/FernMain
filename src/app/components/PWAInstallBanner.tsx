import { useState, useEffect } from 'react';
import { Download, X, Leaf } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem('fern_pwa_dismissed') === '1'
  );

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Inject PWA meta tags once
  useEffect(() => {
    if (!document.querySelector('meta[name="theme-color"]')) {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = '#ea580c';
      document.head.appendChild(meta);
    }
    if (!document.querySelector('link[rel="apple-touch-icon"]')) {
      const link = document.createElement('link');
      link.rel = 'apple-touch-icon';
      link.href = '/apple-touch-icon.svg';
      document.head.appendChild(link);
    }
  }, []);

  if (!prompt || dismissed) return null;

  async function handleInstall() {
    if (!prompt) return;
    await prompt.prompt();
    const result = await prompt.userChoice;
    if (result.outcome === 'accepted') {
      setPrompt(null);
    }
  }

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem('fern_pwa_dismissed', '1');
  }

  return (
    <div
      className="fixed bottom-24 left-3 right-3 z-[70] md:left-auto md:right-5 md:bottom-5 md:w-80 rounded-2xl flex items-center gap-3 px-4 py-3.5"
      style={{
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
        onClick={handleInstall}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl flex-shrink-0 transition-all active:scale-95"
        style={{ background: '#ea580c', fontSize: '12px', fontWeight: 700, color: '#fff' }}
      >
        <Download width={12} height={12} />
        Install
      </button>
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 p-1 rounded-lg transition-opacity hover:opacity-60"
        style={{ color: 'rgba(255,255,255,0.4)' }}
      >
        <X width={14} height={14} />
      </button>
    </div>
  );
}
