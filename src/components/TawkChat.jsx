import React, { useEffect } from 'react';
import { MessageSquare } from 'lucide-react';

const TawkChat = () => {
  useEffect(() => {
    // 1. Load Tawk.to Script
    var Tawk_API = window.Tawk_API || {}, Tawk_LoadStart = new Date();
    (function() {
      var s1 = document.createElement("script"),
          s0 = document.getElementsByTagName("script")[0];
      s1.async = true;
      s1.src = 'https://embed.tawk.to/6a6b6f444f48221d49abfc39/1jupql90d';
      s1.charset = 'UTF-8';
      s1.setAttribute('crossorigin', '*');
      s0.parentNode.insertBefore(s1, s0);
    })();

    // 2. Hide default widget once loaded
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_API.onLoad = function() {
      window.Tawk_API.hideWidget();
    };

    // 3. Optional: Re-hide if it tries to show itself
    window.Tawk_API.onChatMaximized = function() {
      // Keep it visible while chatting
    };

    window.Tawk_API.onChatMinimized = function() {
      window.Tawk_API.hideWidget();
    };

    // 4. Global helper for other buttons
    window.openTawkChat = () => {
      if (window.Tawk_API) {
        window.Tawk_API.maximize();
        window.Tawk_API.showWidget();
      }
    };
  }, []);

  const handleChatClick = () => {
    window.openTawkChat();
  };

  return (
    <button className="chat-cora-btn" onClick={handleChatClick}>
      <MessageSquare className="chat-icon" size={20} />
      <span>Chat to Cora</span>
    </button>
  );
};

export default TawkChat;
