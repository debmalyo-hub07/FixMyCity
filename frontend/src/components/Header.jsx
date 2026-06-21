import React from 'react';
import { Shield, User, LogOut, Bell, ChevronDown } from 'lucide-react';

export default function Header({ portal, setPortal, session, logout }) {
  const isAdmin = session?.role === 'admin';

  const initials = session?.name
    ? session.name
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <header className="topbar-modern">
      <div className="brand-modern">
        <div className="landing-logo-box" style={{ marginRight: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="/fmc-logo.jpeg" alt="FMC Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div className="brand-text-modern" style={{ display: 'flex', flexDirection: 'column' }}>
          <span className="brand-name-text" style={{ fontFamily: 'Barlow Condensed', fontWeight: 800, fontSize: '1.25rem', textTransform: 'uppercase', color: '#F4EFE4', lineHeight: 1.1 }}>
            Fix<span style={{ color: '#F0E840' }}>My</span>City
          </span>
          <span className="brand-tagline-text" style={{ fontFamily: 'DM Mono', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
            {isAdmin ? 'Admin Control Panel' : 'Citizen Issue Reporting System'}
          </span>
        </div>
      </div>

      <nav className="topbar-nav-modern">
        {!isAdmin && (
          <>
            <button
              type="button"
              className={`nav-tab-btn ${portal === 'citizen' ? 'active' : ''}`}
              onClick={() => setPortal('citizen')}
            >
              <User size={14} style={{ marginRight: '6px' }} />
              Citizen Portal
            </button>
            <button
              type="button"
              className={`nav-tab-btn ${portal === 'admin' ? 'active' : ''}`}
              onClick={() => setPortal('admin')}
            >
              <Shield size={14} style={{ marginRight: '6px' }} />
              Admin Access
            </button>
          </>
        )}
        
        {session ? (
          <div className="header-session-block">
            {isAdmin ? (
              <div className="admin-header-right">
                <div className="admin-bell-btn" title="Notifications">
                  <Bell size={16} color="#ffffff" />
                  <span className="admin-bell-badge" />
                </div>
                <div className="admin-user-dropdown">
                  <div className="admin-avatar-box">
                    <User size={14} color="#ffffff" />
                  </div>
                  <span className="admin-username">Admin</span>
                  <ChevronDown size={12} color="rgba(255,255,255,0.6)" />
                </div>
                <button 
                  type="button" 
                  className="header-logout-btn" 
                  onClick={logout}
                  title="Sign Out"
                  style={{ marginLeft: '12px', display: 'flex', alignItems: 'center' }}
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <>
                <div className="header-avatar-box">{initials}</div>
                <span className="header-username">{session.name}</span>
                <button 
                  type="button" 
                  className="header-logout-btn" 
                  onClick={logout}
                  title="Sign Out"
                >
                  <LogOut size={14} />
                </button>
              </>
            )}
          </div>
        ) : null}
      </nav>
    </header>
  );
}
