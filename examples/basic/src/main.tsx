import React from 'react';
import ReactDOM from 'react-dom/client';
import { LiyaAvatarWidget } from '@liyalabs/3d-avatar';
import '@liyalabs/3d-avatar/style.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div style={{ padding: 40 }}>
      <h1 style={{ color: '#f1f5f9' }}>Liya 3D Avatar Demo</h1>
      <p style={{ color: '#94a3b8' }}>The avatar widget appears in the bottom-right corner.</p>
    </div>
    <LiyaAvatarWidget
      apiKey={import.meta.env.VITE_LIYA_API_KEY ?? 'YOUR_API_KEY'}
      baseUrl={import.meta.env.VITE_LIYA_BASE_URL}
      assistantId={import.meta.env.VITE_ASSISTANT_ID}
      welcomeMessage="Merhaba! Size nasıl yardımcı olabilirim?"
      welcomeSuggestions={['Nasıl başlarım?', 'Fiyatlar nedir?', 'Demo göster']}
      showBranding
      showAvatarButton
      autoSpeak
      locale="tr"
      theme={{ primaryColor: '#6366f1' }}
      onMessageSent={(msg) => console.log('sent:', msg)}
      onMessageReceived={(msg) => console.log('received:', msg)}
      onAvatarOpened={() => console.log('avatar opened')}
    />
  </React.StrictMode>,
);
