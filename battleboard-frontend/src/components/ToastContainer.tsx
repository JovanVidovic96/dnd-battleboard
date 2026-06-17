import { useState, useEffect } from 'react';
import { toast } from '../utils/toast';
import type { ToastItem } from '../utils/toast';

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return toast._subscribe((item) => {
      setToasts((prev) => [...prev, item]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== item.id));
      }, 4000);
    });
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '320px' }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          className="toast-slide"
          onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
          style={{
            background: '#12100a',
            border: `1px solid ${t.type === 'error' ? 'rgba(192,57,43,0.7)' : 'rgba(45,122,58,0.7)'}`,
            borderRadius: '6px',
            padding: '10px 14px',
            color: t.type === 'error' ? '#e74c3c' : '#2ecc71',
            fontSize: '13px',
            fontFamily: 'serif',
            letterSpacing: '0.04em',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontWeight: 700 }}>{t.type === 'error' ? '✕' : '✓'}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
