import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Bell,
  Camera,
  ChevronRight,
  Construction,
  Droplets,
  Lightbulb,
  MapPin,
  Menu,
  Star,
  Trash2,
  TrendingUp,
  TriangleAlert,
  X,
  Zap,
  Phone,
  Key,
  User,
  Shield,
  FileText
} from 'lucide-react';

export default function Hero({
  portal,
  setPortal,
  citizenMode,
  setCitizenMode,
  stats,
  authMessage,
  loginForm,
  setLoginForm,
  registerForm,
  setRegisterForm,
  handleCitizenLogin,
  handleCitizenRegister,
  handleAdminLogin,
  resetAuthForms,
  complaints = []
}) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [feedFilter, setFeedFilter] = useState('All');

  const openAuthModal = (targetPortal, mode = 'login') => {
    setPortal(targetPortal);
    if (targetPortal === 'citizen') {
      setCitizenMode(mode);
    }
    resetAuthForms();
    setIsAuthModalOpen(true);
    setMenuOpen(false);
  };

  // Mock static stats from Figma prototype, combined with actual system stats
  const statsList = [
    { value: (48291 + (stats.total || 0)).toLocaleString(), label: 'Issues Reported' },
    { value: (31847 + (stats.resolved || 0)).toLocaleString(), label: 'Issues Resolved' },
    { value: '4.2 days', label: 'Avg. Resolution' },
    { value: '127', label: 'Partner Cities' }
  ];

  // Steps definition
  const steps = [
    {
      number: '01',
      icon: Camera,
      title: 'Spot the Issue',
      desc: 'See a pothole, broken light, or neighborhood problem? Open FixMyCity on any device.'
    },
    {
      number: '02',
      icon: MapPin,
      title: 'Pin & Describe',
      desc: 'Drop a pin on the map, snap a photo, write a quick description. Done in under 60 seconds.'
    },
    {
      number: '03',
      icon: Bell,
      title: 'We Notify the City',
      desc: 'Your report goes directly to the right municipal department. Track progress in real time.'
    }
  ];

  // Categories definition (main four only, counts computed dynamically from complaints database)
  const categories = [
    { 
      icon: Construction, 
      label: 'Potholes & Roads', 
      count: 12480 + (complaints || []).filter(c => c.type === 'Potholes' || c.type === 'Road problem').length, 
      color: 'bg-orange-soft' 
    },
    { 
      icon: Lightbulb, 
      label: 'Street Lighting', 
      count: 8341 + (complaints || []).filter(c => c.type === 'Others' && (c.title.toLowerCase().includes('light') || c.description.toLowerCase().includes('light'))).length, 
      color: 'bg-yellow-soft' 
    },
    { 
      icon: Trash2, 
      label: 'Waste & Litter', 
      count: 7920 + (complaints || []).filter(c => c.type === 'Others' && (c.title.toLowerCase().includes('waste') || c.title.toLowerCase().includes('litter') || c.description.toLowerCase().includes('waste') || c.description.toLowerCase().includes('litter'))).length, 
      color: 'bg-green-soft' 
    },
    { 
      icon: Droplets, 
      label: 'Flooding & Drains', 
      count: 5640 + (complaints || []).filter(c => c.type === 'Drainage problem').length, 
      color: 'bg-blue-soft-new' 
    }
  ];

  // Mock initial reports from Figma prototype
  const mockFeed = [
    {
      id: 'FMC-2024-8841',
      title: 'Large pothole on Elm Street near bus stop',
      category: 'Potholes & Roads',
      location: '12 Elm St, Downtown',
      status: 'In Progress',
      statusClass: 'status-inprogress',
      time: '2 hours ago',
      votes: 14
    },
    {
      id: 'FMC-2024-8837',
      title: 'Streetlight out for 3 weeks at Oak Ave & 5th',
      category: 'Street Lighting',
      location: 'Oak Ave & 5th, Northside',
      status: 'Assigned',
      statusClass: 'status-assigned',
      time: '5 hours ago',
      votes: 27
    },
    {
      id: 'FMC-2024-8830',
      title: 'Overflowing storm drain flooding sidewalk',
      category: 'Flooding & Drains',
      location: 'River Rd, Westbank',
      status: 'Resolved',
      statusClass: 'status-resolved',
      time: '1 day ago',
      votes: 9
    },
    {
      id: 'FMC-2024-8819',
      title: 'Graffiti on underpass wall, Main St Bridge',
      category: 'Waste & Litter',
      location: 'Main St Bridge, Central',
      status: 'Under Review',
      statusClass: 'status-review',
      time: '2 days ago',
      votes: 6
    }
  ];

  // Map real complaints to feed items and Prepend to mock list
  const realMappedComplaints = complaints.map(c => {
    let statusClass = 'status-review';
    if (c.status === 'In Progress') statusClass = 'status-inprogress';
    else if (c.status === 'Resolved') statusClass = 'status-resolved';
    else if (c.status === 'Assigned') statusClass = 'status-assigned';

    return {
      id: c.id.substring(0, 13).toUpperCase(),
      title: c.title,
      category: c.type || 'General',
      location: c.location,
      status: c.status || 'Pending',
      statusClass: statusClass,
      time: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Just now',
      votes: c.upvotes || 0
    };
  });

  const combinedFeed = [...realMappedComplaints, ...mockFeed];

  const filteredFeed = feedFilter === 'All' 
    ? combinedFeed 
    : combinedFeed.filter(item => item.status.toLowerCase() === feedFilter.toLowerCase() || (feedFilter === 'Under Review' && item.status === 'Pending'));

  // Testimonials list
  const testimonials = [
    {
      name: 'Maria Chen',
      role: 'Resident, Portland',
      quote: 'Reported a pothole on my street Monday morning. By Thursday it was filled. I was genuinely shocked at how fast it worked.',
      avatar: 'MC'
    },
    {
      name: 'David Okafor',
      role: 'Community Organizer, Austin',
      quote: 'FixMyCity turned our neighborhood association into a real force. We documented 40 broken streetlights in one evening. All fixed within a month.',
      avatar: 'DO'
    },
    {
      name: 'Rosa Medina',
      role: 'City Council Aide, Denver',
      quote: 'From the government side — the prioritized reports make our job so much easier. We see what matters most to residents instantly.',
      avatar: 'RM'
    }
  ];

  return (
    <div className="landing-portal" id="top">
      {/* 1. Header Navigation */}
      <nav className="landing-nav">
        <div className="landing-nav-container">
          <a href="#top" className="landing-brand">
            <div className="landing-logo-box">
              <MapPin size={16} color="#ffffff" strokeWidth={3} />
            </div>
            <span className="landing-brand-text">
              Fix<span>My</span>City
            </span>
          </a>

          <div className="landing-nav-links">
            <a href="#how-it-works" className="landing-nav-link">How It Works</a>
            <a href="#categories" className="landing-nav-link">Issue Map</a>
            <a href="#reports" className="landing-nav-link">Reports</a>
            <a href="#about" className="landing-nav-link">About</a>
          </div>

          <div className="landing-nav-actions">
            <button 
              type="button" 
              className="landing-btn-text"
              onClick={() => openAuthModal('citizen', 'login')}
            >
              Sign In
            </button>
            <button 
              type="button" 
              className="landing-btn-accent"
              onClick={() => openAuthModal('citizen', 'register')}
            >
              Report Issue
            </button>
          </div>

          <button 
            type="button" 
            className="landing-menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <Menu size={24} />
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {menuOpen && (
          <div className="landing-mobile-menu">
            <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How It Works</a>
            <a href="#categories" onClick={() => setMenuOpen(false)}>Issue Map</a>
            <a href="#reports" onClick={() => setMenuOpen(false)}>Reports</a>
            <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
            <button 
              type="button" 
              className="landing-btn-accent" 
              style={{ width: '100%', marginTop: '8px' }}
              onClick={() => openAuthModal('citizen', 'register')}
            >
              Report Issue
            </button>
            <button 
              type="button" 
              className="landing-btn-text" 
              style={{ width: '100%', textAlign: 'center' }}
              onClick={() => openAuthModal('citizen', 'login')}
            >
              Sign In
            </button>
          </div>
        )}
      </nav>

      {/* 2. Hero Section */}
      <section className="landing-hero-section">
        <div className="landing-deco-frame-1"></div>
        <div className="landing-deco-frame-2"></div>
        <div className="landing-deco-dot-1"></div>
        <div className="landing-deco-dot-2"></div>

        <div className="landing-hero-container">
          <div style={{ zIndex: 5 }}>
            <div className="landing-eyebrow-badge">
              <Zap size={14} color="#F0E840" fill="#F0E840" />
              <span>Civic reporting, reimagined</span>
            </div>
            <h1 className="landing-hero-title">
              Report.
              <br />
              <span>Track.</span>
              <br />
              Fix.
            </h1>
            <p className="landing-hero-desc">
              Spotted a pothole, broken streetlight, or neighborhood eyesore? FixMyCity connects residents directly to the right city department — and keeps you updated every step of the way.
            </p>
            <div className="landing-hero-actions">
              <button 
                type="button" 
                className="landing-btn-hero-primary"
                onClick={() => openAuthModal('citizen', 'register')}
              >
                Report an Issue
                <ArrowRight size={16} />
              </button>
              <a 
                href="#reports" 
                className="landing-btn-hero-secondary"
                style={{ textDecoration: 'none' }}
              >
                <MapPin size={16} />
                View Live Map
              </a>
            </div>

            <div className="landing-hero-social">
              <div className="landing-avatar-group">
                <div className="landing-avatar-dot" style={{ backgroundColor: '#3A7CA5' }} />
                <div className="landing-avatar-dot" style={{ backgroundColor: '#E85D26' }} />
                <div className="landing-avatar-dot" style={{ backgroundColor: '#6BAA75' }} />
                <div className="landing-avatar-dot" style={{ backgroundColor: '#1A2438' }} />
              </div>
              <p>
                <strong>12,400+</strong> citizens reported issues this month
              </p>
            </div>
          </div>

          {/* Hero Image overlays */}
          <div className="landing-hero-image-pane">
            <div className="landing-hero-image-wrapper">
              <div className="landing-hero-image-border" />
              <div className="landing-hero-image-frame">
                <img 
                  src="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&h=750&fit=crop&auto=format" 
                  alt="City street at dusk" 
                />
                <div className="landing-hero-image-gradient" />
              </div>

              {/* Floating overlays */}
              <div className="landing-floating-report">
                <div className="landing-live-badge-row">
                  <div className="landing-live-dot" />
                  <span className="landing-live-label">Live Report</span>
                </div>
                <h3>Pothole on Maple Ave</h3>
                <span className="ticket-id">FMC-2024-8841</span>
                <div className="landing-status-row">
                  <span className="landing-status-label">Status</span>
                  <span className="landing-status-badge-live">IN PROGRESS</span>
                </div>
              </div>

              <div className="landing-floating-resolution">
                <h2>66%</h2>
                <p>Resolution rate</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Stats Strip Banner */}
      <section className="landing-stats-section">
        <div className="landing-stats-container">
          {statsList.map((stat, idx) => (
            <div className="landing-stat-box" key={idx}>
              <div className="landing-stat-value">{stat.value}</div>
              <div className="landing-stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. How It Works Timeline */}
      <section className="landing-process-section" id="how-it-works">
        <div className="landing-process-container">
          <div className="landing-section-header">
            <span className="landing-section-eyebrow">Process</span>
            <h2 className="landing-section-title">
              Three Steps.
              <br />
              Real Results.
            </h2>
          </div>

          <div className="landing-timeline-grid">
            {steps.map((step, idx) => {
              const IconComponent = step.icon;
              return (
                <div className={`landing-timeline-card ${idx === 1 ? 'inverted' : ''}`} key={idx}>
                  <div className="landing-card-num">{step.number}</div>
                  <div className="landing-card-icon-box">
                    <IconComponent size={24} style={{ color: '#1A2438' }} />
                  </div>
                  <h3 className="landing-card-title">{step.title}</h3>
                  <p className="landing-card-desc">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Civic Issue Categories Grid */}
      <section className="landing-categories-section" id="categories">
        <div className="landing-categories-container">
          <div className="landing-flex-header">
            <div>
              <span className="landing-section-eyebrow">What can you report?</span>
              <h2 className="landing-section-title">
                Every Kind of
                <br />
                Civic Issue
              </h2>
            </div>
            <a href="#reports" className="landing-link-accent">
              Browse all categories
              <ChevronRight size={16} />
            </a>
          </div>

          <div className="landing-categories-grid">
            {categories.map((cat, idx) => {
              const IconComponent = cat.icon;
              return (
                <div 
                  className="landing-category-card" 
                  key={idx}
                  onClick={() => openAuthModal('citizen', 'register')}
                >
                  <div className={`landing-cat-icon-badge ${cat.color}`}>
                    <IconComponent size={24} />
                  </div>
                  <h3>{cat.label}</h3>
                  <span className="font-mono">{cat.count.toLocaleString()} reports</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. Live Feed & Reports List */}
      <section className="landing-feed-section" id="reports">
        <div className="landing-feed-container">
          <div className="landing-flex-header" style={{ marginBottom: '40px' }}>
            <div>
              <span className="landing-section-eyebrow">Live Feed</span>
              <h2 className="landing-section-title">
                Recent
                <br />
                Reports
              </h2>
            </div>
            <div className="landing-filter-tabs">
              {['All', 'In Progress', 'Assigned', 'Resolved'].map(tab => (
                <button
                  type="button"
                  key={tab}
                  className={`landing-filter-tab ${feedFilter === tab ? 'active' : ''}`}
                  onClick={() => setFeedFilter(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="landing-feed-list">
            {filteredFeed.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow' }}>
                No reports found in this status category.
              </div>
            ) : (
              filteredFeed.map((item, idx) => (
                <div className="landing-feed-item" key={idx} onClick={() => openAuthModal('citizen', 'login')} style={{ cursor: 'pointer' }}>
                  <div className="landing-feed-main">
                    <div className="landing-feed-icon-col">
                      <TriangleAlert size={16} />
                    </div>
                    <div className="landing-feed-details">
                      <div className="landing-feed-meta">
                        <span className="landing-feed-id font-mono">{item.id}</span>
                        <span className="landing-feed-cat-tag">{item.category}</span>
                      </div>
                      <h3>{item.title}</h3>
                      <div className="landing-feed-location">
                        <MapPin size={12} />
                        <span>{item.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="landing-feed-aside">
                    <div className="landing-feed-status-block">
                      <span className={`landing-feed-status font-mono ${item.statusClass}`}>
                        {item.status}
                      </span>
                      <span className="landing-feed-time">{item.time}</span>
                    </div>

                    <div className="landing-feed-votes">
                      <TrendingUp size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />
                      <span className="font-mono">{item.votes}</span>
                    </div>
                    <ChevronRight size={16} className="arrow" />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="landing-feed-actions">
            <button 
              type="button" 
              className="landing-btn-hero-secondary"
              onClick={() => openAuthModal('citizen', 'login')}
            >
              View All Reports
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* 7. Testimonials */}
      <section className="landing-testimonials-section" id="about">
        <div className="landing-testimonials-container">
          <div className="landing-section-header">
            <span className="landing-section-eyebrow">What people say</span>
            <h2 className="landing-section-title">
              Real Stories,
              <br />
              Real Impact
            </h2>
          </div>

          <div className="landing-testimonials-grid">
            {testimonials.map((test, idx) => (
              <div className={`landing-testimonial-card ${idx === 1 ? 'highlighted' : ''}`} key={idx}>
                <div>
                  <div className="landing-stars">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} />
                    ))}
                  </div>
                  <blockquote className="landing-quote">
                    “{test.quote}”
                  </blockquote>
                </div>
                <div className="landing-reviewer">
                  <div className="landing-reviewer-avatar">{test.avatar}</div>
                  <div>
                    <div className="landing-reviewer-name">{test.name}</div>
                    <div className="landing-reviewer-role">{test.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Call To Action (CTA) Block */}
      <section className="landing-cta-section">
        <div className="landing-cta-container">
          <span className="landing-section-eyebrow" style={{ color: 'rgba(26,36,56,0.6)' }}>Ready?</span>
          <h2>
            Your city needs
            <br />
            your voice.
          </h2>
          <p>
            Every report you file is a step toward a safer, cleaner, better-functioning city. It takes 60 seconds.
          </p>
          <div className="landing-cta-actions">
            <button 
              type="button" 
              className="landing-btn-cta-primary"
              onClick={() => openAuthModal('citizen', 'register')}
            >
              Report Your First Issue
              <ArrowRight size={16} />
            </button>
            <button 
              type="button" 
              className="landing-btn-cta-secondary"
              onClick={() => openAuthModal('admin', 'login')}
            >
              <Shield size={16} />
              For Cities (Admin access)
            </button>
          </div>
        </div>
      </section>

      {/* 9. Footer */}
      <footer className="landing-footer-section">
        <div className="landing-footer-container">
          <div className="landing-footer-grid">
            <div className="landing-footer-about">
              <a href="#top" className="landing-brand">
                <div className="landing-logo-box">
                  <MapPin size={16} color="#ffffff" strokeWidth={3} />
                </div>
                <span className="landing-brand-text" style={{ color: '#fff' }}>
                  Fix<span>My</span>City
                </span>
              </a>
              <p>
                Citizen-powered infrastructure reporting. Because everyone deserves a city that works.
              </p>
            </div>

            <div className="landing-footer-col">
              <h4>Platform</h4>
              <div className="landing-footer-links">
                <a href="#how-it-works">How It Works</a>
                <a href="#categories">Issue Map</a>
                <a href="#reports">Track Reports</a>
                <a href="#top" onClick={(e) => { e.preventDefault(); openAuthModal('citizen', 'register'); }}>File Complaint</a>
              </div>
            </div>

            <div className="landing-footer-col">
              <h4>For Cities</h4>
              <div className="landing-footer-links">
                <a href="#top" onClick={(e) => { e.preventDefault(); openAuthModal('admin', 'login'); }}>Admin Dashboard</a>
                <a href="#top" onClick={(e) => e.preventDefault()}>City Analytics</a>
                <a href="#top" onClick={(e) => e.preventDefault()}>API Access</a>
                <a href="#top" onClick={(e) => e.preventDefault()}>Partnerships</a>
              </div>
            </div>

            <div className="landing-footer-col">
              <h4>Company</h4>
              <div className="landing-footer-links">
                <a href="#about">About Us</a>
                <a href="#top" onClick={(e) => e.preventDefault()}>Blog</a>
                <a href="#top" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
                <a href="#top" onClick={(e) => e.preventDefault()}>Terms of Service</a>
              </div>
            </div>
          </div>

          <div className="landing-footer-bottom">
            <p>© 2026 FixMyCity. All rights reserved.</p>
            <p>Built for people, powered by community.</p>
          </div>
        </div>
      </footer>

      {/* ==========================================================================
         ── Floating Authentication Modal Overlay ─────────────────────────
         ========================================================================== */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <motion.div 
            className="auth-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsAuthModalOpen(false)}
          >
            <motion.div 
              className="auth-modal-card"
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              transition={{ type: 'spring', duration: 0.4 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                type="button" 
                className="auth-modal-close"
                onClick={() => setIsAuthModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>

              <div className="auth-modal-tabs">
                <button
                  type="button"
                  className={`auth-modal-tab ${portal === 'citizen' ? 'active' : ''}`}
                  onClick={() => {
                    setPortal('citizen');
                    resetAuthForms();
                  }}
                >
                  <User size={15} />
                  Citizen Portal
                </button>
                <button
                  type="button"
                  className={`auth-modal-tab ${portal === 'admin' ? 'active' : ''}`}
                  onClick={() => {
                    setPortal('admin');
                    resetAuthForms();
                  }}
                >
                  <Shield size={15} />
                  Admin Access
                </button>
              </div>

              {portal === 'citizen' ? (
                <div>
                  <div className="auth-mode-toggle">
                    <button
                      type="button"
                      className={`auth-mode-btn ${citizenMode === 'login' ? 'active' : ''}`}
                      onClick={() => setCitizenMode('login')}
                    >
                      Log In
                    </button>
                    <button
                      type="button"
                      className={`auth-mode-btn ${citizenMode === 'register' ? 'active' : ''}`}
                      onClick={() => setCitizenMode('register')}
                    >
                      Register
                    </button>
                  </div>

                  {citizenMode === 'login' ? (
                    <form onSubmit={(e) => { e.preventDefault(); handleCitizenLogin(e); }}>
                      <div className="auth-form-title-group">
                        <h3>Citizen Login</h3>
                        <p>Access your reported complaints and track progress.</p>
                      </div>

                      <div className="auth-input-group">
                        <label>Mobile Number</label>
                        <div className="auth-input-wrapper">
                          <Phone size={16} className="auth-input-icon" />
                          <input
                            required
                            type="text"
                            placeholder="Enter 10-digit number"
                            value={loginForm.phone}
                            onChange={(e) =>
                              setLoginForm((prev) => ({ ...prev, phone: e.target.value }))
                            }
                          />
                        </div>
                      </div>

                      <div className="auth-input-group">
                        <label>Password</label>
                        <div className="auth-input-wrapper">
                          <Key size={16} className="auth-input-icon" />
                          <input
                            required
                            type="password"
                            placeholder="••••••••"
                            value={loginForm.password}
                            onChange={(e) =>
                              setLoginForm((prev) => ({ ...prev, password: e.target.value }))
                            }
                          />
                        </div>
                      </div>

                      <button type="submit">Log In</button>
                    </form>
                  ) : (
                    <form onSubmit={(e) => { e.preventDefault(); handleCitizenRegister(e); }}>
                      <div className="auth-form-title-group">
                        <h3>Create Citizen Account</h3>
                        <p>Join the community to report and monitor neighborhood issues.</p>
                      </div>

                      <div className="auth-input-group">
                        <label>Full Name</label>
                        <div className="auth-input-wrapper">
                          <User size={16} className="auth-input-icon" />
                          <input
                            required
                            type="text"
                            placeholder="John Doe"
                            value={registerForm.name}
                            onChange={(e) =>
                              setRegisterForm((prev) => ({ ...prev, name: e.target.value }))
                            }
                          />
                        </div>
                      </div>

                      <div className="auth-input-group">
                        <label>Mobile Number</label>
                        <div className="auth-input-wrapper">
                          <Phone size={16} className="auth-input-icon" />
                          <input
                            required
                            type="text"
                            placeholder="Enter 10-digit number"
                            value={registerForm.phone}
                            onChange={(e) =>
                              setRegisterForm((prev) => ({ ...prev, phone: e.target.value }))
                            }
                          />
                        </div>
                      </div>

                      <div className="auth-input-group">
                        <label>Aadhar Number</label>
                        <div className="auth-input-wrapper">
                          <FileText size={16} className="auth-input-icon" />
                          <input
                            required
                            type="text"
                            placeholder="12-digit UID"
                            value={registerForm.aadhar}
                            onChange={(e) =>
                              setRegisterForm((prev) => ({ ...prev, aadhar: e.target.value }))
                            }
                          />
                        </div>
                      </div>

                      <div className="auth-input-group">
                        <label>Password</label>
                        <div className="auth-input-wrapper">
                          <Key size={16} className="auth-input-icon" />
                          <input
                            required
                            type="password"
                            placeholder="Create password"
                            value={registerForm.password}
                            onChange={(e) =>
                              setRegisterForm((prev) => ({ ...prev, password: e.target.value }))
                            }
                          />
                        </div>
                      </div>

                      <button type="submit">Register Account</button>
                    </form>
                  )}
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); handleAdminLogin(e); }}>
                  <div className="auth-form-title-group">
                    <h3>Admin Portal</h3>
                    <p>Enter your credentials to manage community tickets.</p>
                  </div>

                  <div className="auth-input-group">
                    <label>Admin ID</label>
                    <div className="auth-input-wrapper">
                      <User size={16} className="auth-input-icon" />
                      <input
                        required
                        type="text"
                        placeholder="Enter Admin ID"
                        value={loginForm.phone}
                        onChange={(e) =>
                          setLoginForm((prev) => ({ ...prev, phone: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <div className="auth-input-group">
                    <label>Password</label>
                    <div className="auth-input-wrapper">
                      <Key size={16} className="auth-input-icon" />
                      <input
                        required
                        type="password"
                        placeholder="••••••••"
                        value={loginForm.password}
                        onChange={(e) =>
                          setLoginForm((prev) => ({ ...prev, password: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <button type="submit">Admin login</button>
                </form>
              )}

              {authMessage && (
                <div className="auth-modal-error font-mono">
                  {authMessage}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
