import React, { useState, useEffect } from 'react';
import { Download, Share2 } from 'lucide-react';
import './PWAInstallButton.css';

const PWAInstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setCanInstall(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return null;
  }

  if (isIOS) {
    return (
      <button
        className="pwa-install-btn mobile"
        onClick={() => {
          const msg = 'Tap the Share button below, then "Add to Home Screen".';
          if (navigator.share) {
            navigator.share({ title: 'PHC Platform', text: msg, url: window.location.href });
          } else {
            alert(msg + ' Then tap "Add to Home Screen" in the share sheet.');
          }
        }}
      >
        <Share2 size={16} />
        <span>Add to Home Screen</span>
      </button>
    );
  }

  if (!canInstall) {
    return null;
  }

  return (
    <button
      className="pwa-install-btn"
      onClick={handleInstall}
      title="Install PHC Platform as a web app"
    >
      <Download size={16} />
      <span>Install App</span>
    </button>
  );
};

export default PWAInstallButton;
