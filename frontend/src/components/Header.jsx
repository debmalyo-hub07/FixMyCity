import React, { useState, useRef, useEffect } from 'react';
import { Shield, User, LogOut, Bell, ChevronDown, Settings, Phone, BadgeCheck, Mail, FileText, Edit, X } from 'lucide-react';

export default function Header({ portal, setPortal, session, logout, changeGoogleMapsApiKey, updateProfile }) {
  const isAdmin = session?.role === 'admin';
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Profile Edit modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', aadhar: '', email: '' });
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const adminDropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (adminDropdownRef.current && !adminDropdownRef.current.contains(e.target)) {
        setAdminDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditSuccess('');

    if (!editForm.name.trim()) {
      setEditError('Name is required.');
      return;
    }
    if (!/^\d{10}$/.test(editForm.phone.trim())) {
      setEditError('Phone number must be exactly 10 digits.');
      return;
    }
    if (!/^\d{12}$/.test(editForm.aadhar.trim())) {
      setEditError('Aadhar number must be exactly 12 digits.');
      return;
    }

    setIsUpdating(true);
    const res = await updateProfile({
      id: session.id,
      name: editForm.name.trim(),
      phone: editForm.phone.trim(),
      aadhar: editForm.aadhar.trim(),
      email: editForm.email.trim(),
    });
    setIsUpdating(false);

    if (res && res.success) {
      setEditSuccess('Profile updated successfully!');
      setTimeout(() => {
        setModalOpen(false);
      }, 1200);
    } else {
      setEditError(res?.message || 'Failed to update profile.');
    }
  };

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
          <span 
            className="brand-name-text" 
            style={{ 
              fontFamily: 'Barlow Condensed', 
              fontWeight: 800, 
              fontSize: '1.25rem', 
              textTransform: 'uppercase', 
              color: '#F4EFE4', 
              lineHeight: 1.1,
              background: 'none',
              WebkitBackgroundClip: 'initial',
              WebkitTextFillColor: 'initial',
            }}
          >
            Fix<span style={{ color: '#F0E840' }}>My</span>City
          </span>
          <span className="brand-tagline-text" style={{ fontFamily: 'DM Mono', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
            {isAdmin ? 'Admin Control Panel' : 'Citizen Issue Reporting System'}
          </span>
        </div>
      </div>

      <nav className="topbar-nav-modern">

        {session ? (
          <div className="header-session-block">
            {isAdmin ? (
              <div className="admin-header-right">
                <div className="admin-bell-btn" title="Notifications">
                  <Bell size={16} color="#ffffff" />
                  <span className="admin-bell-badge" />
                </div>
                 <div className="admin-user-dropdown-container" ref={adminDropdownRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="admin-user-trigger"
                    onClick={() => setAdminDropdownOpen((o) => !o)}
                    aria-haspopup="true"
                    aria-expanded={adminDropdownOpen}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      transition: 'background 0.2s ease',
                    }}
                  >
                    <div className="admin-avatar-box">
                      <User size={14} color="#ffffff" />
                    </div>
                    <span className="admin-username" style={{ fontFamily: 'Barlow', fontWeight: 600, fontSize: '0.875rem', color: '#ffffff' }}>{session.name || 'Admin'}</span>
                    <ChevronDown
                      size={12}
                      color="rgba(255,255,255,0.6)"
                      style={{
                        transition: 'transform 0.25s ease',
                        transform: adminDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    />
                  </button>

                  {adminDropdownOpen && (
                    <div className="citizen-dropdown-menu" style={{ top: 'calc(100% + 12px)', right: 0 }}>
                      {/* Profile header */}
                      <div className="citizen-dropdown-profile">
                        <div className="citizen-dropdown-avatar" style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)', color: '#ffffff', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)' }}>
                          {initials}
                        </div>
                        <div className="citizen-dropdown-info">
                          <span className="citizen-dropdown-name">{session.name || 'City Admin'}</span>
                          <span className="citizen-dropdown-badge" style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.25)' }}>
                            <Shield size={11} style={{ marginRight: '4px' }} />
                            Admin
                          </span>
                        </div>
                      </div>

                      <div className="citizen-dropdown-divider" />

                      {/* Info rows */}
                      <div className="citizen-dropdown-rows">
                        <div className="citizen-dropdown-row">
                          <User size={13} className="citizen-dropdown-row-icon" />
                          <div className="citizen-dropdown-row-text">
                            <span className="citizen-dropdown-row-label">Name</span>
                            <span className="citizen-dropdown-row-value">{session.name || 'City Admin'}</span>
                          </div>
                        </div>
                        <div className="citizen-dropdown-row">
                          <Mail size={13} className="citizen-dropdown-row-icon" />
                          <div className="citizen-dropdown-row-text">
                            <span className="citizen-dropdown-row-label">Email</span>
                            <span className="citizen-dropdown-row-value">{session.email || session.username || 'admin@fixmycity'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="citizen-dropdown-divider" />

                      {/* Actions */}
                      <div className="citizen-dropdown-actions">
                        <button
                          type="button"
                          className="citizen-dropdown-action-btn citizen-dropdown-signout"
                          onClick={() => { logout(); setAdminDropdownOpen(false); }}
                        >
                          <LogOut size={14} />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button 
                  type="button" 
                  className="header-logout-btn" 
                  onClick={changeGoogleMapsApiKey}
                  title="Configure Google Maps API Key"
                  style={{ marginLeft: '8px', display: 'flex', alignItems: 'center' }}
                >
                  <Settings size={14} />
                </button>
              </div>
            ) : (
              <div className="citizen-user-dropdown" ref={dropdownRef}>
                <button
                  type="button"
                  className="citizen-user-trigger"
                  onClick={() => setDropdownOpen((o) => !o)}
                  aria-haspopup="true"
                  aria-expanded={dropdownOpen}
                >
                  <div className="header-avatar-box">{initials}</div>
                  <span className="header-username">{session.name}</span>
                  <ChevronDown
                    size={13}
                    color="rgba(255,255,255,0.5)"
                    style={{
                      transition: 'transform 0.25s ease',
                      transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  />
                </button>

                {dropdownOpen && (
                  <div className="citizen-dropdown-menu">
                    {/* Profile header */}
                    <div className="citizen-dropdown-profile">
                      <div className="citizen-dropdown-avatar">{initials}</div>
                      <div className="citizen-dropdown-info">
                        <span className="citizen-dropdown-name">{session.name}</span>
                        <span className="citizen-dropdown-badge">
                          <BadgeCheck size={11} style={{ marginRight: '4px' }} />
                          Citizen
                        </span>
                      </div>
                    </div>

                    <div className="citizen-dropdown-divider" />

                    {/* Info rows */}
                    <div className="citizen-dropdown-rows">
                      <div className="citizen-dropdown-row">
                        <Phone size={13} className="citizen-dropdown-row-icon" />
                        <div className="citizen-dropdown-row-text">
                          <span className="citizen-dropdown-row-label">Phone</span>
                          <span className="citizen-dropdown-row-value">{session.phone || '—'}</span>
                        </div>
                      </div>
                      <div className="citizen-dropdown-row">
                        <Mail size={13} className="citizen-dropdown-row-icon" />
                        <div className="citizen-dropdown-row-text">
                          <span className="citizen-dropdown-row-label">Email</span>
                          <span className="citizen-dropdown-row-value">{session.email || 'Not Provided'}</span>
                        </div>
                      </div>
                      <div className="citizen-dropdown-row">
                        <FileText size={13} className="citizen-dropdown-row-icon" />
                        <div className="citizen-dropdown-row-text">
                          <span className="citizen-dropdown-row-label">Aadhar</span>
                          <span className="citizen-dropdown-row-value">{session.aadhar || '—'}</span>
                        </div>
                      </div>
                      <div className="citizen-dropdown-row">
                        <User size={13} className="citizen-dropdown-row-icon" />
                        <div className="citizen-dropdown-row-text">
                          <span className="citizen-dropdown-row-label">Role</span>
                          <span className="citizen-dropdown-row-value" style={{ textTransform: 'capitalize' }}>{session.role}</span>
                        </div>
                      </div>
                    </div>

                    <div className="citizen-dropdown-divider" />

                    {/* Actions */}
                    <div className="citizen-dropdown-actions">
                      <button
                        type="button"
                        className="citizen-dropdown-action-btn"
                        onClick={() => {
                          setEditForm({
                            name: session.name,
                            phone: session.phone || '',
                            aadhar: session.aadhar || '',
                            email: session.email || '',
                          });
                          setEditError('');
                          setEditSuccess('');
                          setModalOpen(true);
                          setDropdownOpen(false);
                        }}
                      >
                        <Edit size={14} />
                        <span>Edit Profile</span>
                      </button>
                      <button
                        type="button"
                        className="citizen-dropdown-action-btn citizen-dropdown-signout"
                        onClick={() => { logout(); setDropdownOpen(false); }}
                      >
                        <LogOut size={14} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}
      </nav>

      {/* Profile Edit Modal */}
      {modalOpen && (
        <div className="profile-edit-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="profile-edit-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="profile-edit-modal-header">
              <h3>Edit Profile Information</h3>
              <button className="profile-edit-modal-close" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="profile-edit-modal-form">
              {editError && <div className="profile-edit-error-msg">{editError}</div>}
              {editSuccess && <div className="profile-edit-success-msg">{editSuccess}</div>}

              <div className="profile-edit-form-group">
                <label>Full Name</label>
                <div className="profile-edit-input-wrapper">
                  <User size={16} className="profile-edit-input-icon" />
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter full name"
                  />
                </div>
              </div>

              <div className="profile-edit-form-group">
                <label>Mobile Number</label>
                <div className="profile-edit-input-wrapper">
                  <Phone size={16} className="profile-edit-input-icon" />
                  <input
                    type="text"
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter 10-digit number"
                  />
                </div>
              </div>

              <div className="profile-edit-form-group">
                <label>Aadhar Number</label>
                <div className="profile-edit-input-wrapper">
                  <FileText size={16} className="profile-edit-input-icon" />
                  <input
                    type="text"
                    required
                    maxLength={12}
                    value={editForm.aadhar}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setEditForm(prev => ({ ...prev, aadhar: val }));
                    }}
                    placeholder="Enter 12-digit Aadhar"
                  />
                </div>
              </div>

              <div className="profile-edit-form-group">
                <label>Email Address</label>
                <div className="profile-edit-input-wrapper">
                  <Mail size={16} className="profile-edit-input-icon" />
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div className="profile-edit-actions">
                <button
                  type="button"
                  className="profile-edit-cancel-btn"
                  onClick={() => setModalOpen(false)}
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="profile-edit-save-btn"
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
