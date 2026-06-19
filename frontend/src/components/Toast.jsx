import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

export default function ToastStack({ toasts, dismiss }) {
  return (
    <div className="toast-stack" role="region" aria-live="polite" aria-label="Notifications">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = ICONS[toast.type] || Info;
          return (
            <motion.div
              key={toast.id}
              className={`toast-item toast-${toast.type}`}
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              role="status"
            >
              <Icon size={18} className="toast-icon" />
              <span style={{ flex: 1 }}>{toast.message}</span>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                <X size={15} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
