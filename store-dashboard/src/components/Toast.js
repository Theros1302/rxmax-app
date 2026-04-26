// Tiny toast notifier used by store-dashboard.
// Anywhere in the app:  notify('error', 'Failed to update order')  or  notify.success('Saved')
// Listens to window 'rxmax-toast' CustomEvent so it works even from non-React modules.

import React, { useEffect, useState } from 'react';

let toastId = 0;

export function notify(type, message) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('rxmax-toast', { detail: { type, message } }));
}
notify.success = (msg) => notify('success', msg);
notify.error   = (msg) => notify('error', msg);
notify.info    = (msg) => notify('info', msg);

export function ToastHost() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const handler = (e) => {
      const id = ++toastId;
      const { type = 'info', message = '' } = e.detail || {};
      setItems((prev) => [...prev, { id, type, message }]);
      // Auto-dismiss after 4.5s
      setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    };
    window.addEventListener('rxmax-toast', handler);
    return () => window.removeEventListener('rxmax-toast', handler);
  }, []);

  if (items.length === 0) return null;

  const colorFor = (t) => ({
    success: '#16a34a',
    error: '#dc2626',
    info: '#2563eb',
  }[t] || '#1f2937');

  return (
    <div style={{
      position: 'fixed', top: 16, right: 16, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 360,
    }}>
      {items.map((t) => (
        <div key={t.id} style={{
          background: 'white', borderLeft: `4px solid ${colorFor(t.type)}`,
          padding: '12px 16px', borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          fontSize: 14, lineHeight: 1.4, color: '#111827', wordBreak: 'break-word',
        }}>
          <div style={{ fontWeight: 600, color: colorFor(t.type), marginBottom: 2, textTransform: 'capitalize' }}>{t.type}</div>
          {t.message}
        </div>
      ))}
    </div>
  );
}
