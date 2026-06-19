import React from 'react';
import { motion } from 'framer-motion';
import { Shield, User, LogOut, AlertOctagon } from 'lucide-react';

export default function Header({ portal, setPortal, session, logout }) {
  return (
    <header className="topbar-modern">
      <div className="brand-modern">
        <motion.div
          className="brand-mark-modern"
          whileHover={{ scale: 1.08, rotate: -6 }}
          whileTap={{ scale: 0.95 }}
        >
          <AlertOctagon size={22} color="#ffffff" style={{ strokeWidth: 2.5 }} />
        </motion.div>
        <div className="brand-text-modern">
          <span className="brand-name-text">FixMyCity</span>
          <span className="brand-tagline-text">Citizen issue reporting system</span>
        </div>
      </div>

      <nav className="topbar-nav-modern">
        <button
          type="button"
          className={`nav-tab-btn ${portal === 'citizen' ? 'is-active' : ''}`}
          onClick={() => setPortal('citizen')}
        >
          <User size={15} style={{ marginRight: '6px', strokeWidth: 2.2 }} />
          Citizen Portal
        </button>
        <button
          type="button"
          className={`nav-tab-btn ${portal === 'admin' ? 'is-active' : ''}`}
          onClick={() => setPortal('admin')}
        >
          <Shield size={15} style={{ marginRight: '6px', strokeWidth: 2.2 }} />
          Admin Access
        </button>
        {session ? (
          <div className="session-wrapper-modern">
            <span className="session-pill-modern">
              <span className={`session-indicator-dot ${session.role === 'admin' ? 'admin' : 'citizen'}`} />
              <span className="session-username">{session.name}</span>
            </span>
            <motion.button
              type="button"
              className="session-logout-btn"
              onClick={logout}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Logout"
            >
              <LogOut size={15} />
            </motion.button>
          </div>
        ) : null}
      </nav>
    </header>
  );
}
