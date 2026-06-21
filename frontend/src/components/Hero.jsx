import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Bell,
  Camera,
  ChevronRight,
  Droplets,
  Lightbulb,
  MapPin,
  Menu,
  MoreHorizontal,
  Star,
  TrendingUp,
  TriangleAlert,
  X,
  Zap,
  Phone,
  Key,
  User,
  Shield,
  FileText,
  Settings,
  Eye,
  EyeOff,
  Mail
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
  complaints = [],
  changeApiUrl,
  reviews = []
}) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [feedFilter, setFeedFilter] = useState('All');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const openAuthModal = (targetPortal, mode = 'login') => {
    setPortal(targetPortal);
    if (targetPortal === 'citizen') {
      setCitizenMode(mode);
    }
    resetAuthForms();
    setShowLoginPassword(false);
    setShowRegisterPassword(false);
    setShowAdminPassword(false);
    setIsAuthModalOpen(true);
    setMenuOpen(false);
  };

  // Calculate average resolution time dynamically from database resolved complaints
  const avgResolutionTime = React.useMemo(() => {
    const resolvedComplaints = (complaints || []).filter(c => c.status === 'Resolved' && c.createdAt && c.updatedAt);
    if (resolvedComplaints.length === 0) return '0 days';
    
    let totalMs = 0;
    let validCount = 0;
    resolvedComplaints.forEach(c => {
      const created = new Date(c.createdAt).getTime();
      const updated = new Date(c.updatedAt).getTime();
      if (!isNaN(created) && !isNaN(updated) && updated >= created) {
        totalMs += (updated - created);
        validCount++;
      }
    });
    
    if (validCount === 0) return '0 days';
    const avgDays = totalMs / (1000 * 60 * 60 * 24 * validCount);
    return `${avgDays.toFixed(1)} days`;
  }, [complaints]);

  const statsList = [
    { value: (stats.total || 0).toLocaleString(), label: 'Issues Reported' },
    { value: (stats.resolved || 0).toLocaleString(), label: 'Issues Resolved' },
    { value: avgResolutionTime, label: 'Avg. Resolution' },
    { value: '1', label: 'Partner Cities' }
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

  // Categories definition (four options from the citizen complaint form, exact database counts)
  const categories = [
    { 
      icon: Lightbulb, 
      label: 'Broken street light problem', 
      count: (complaints || []).filter(c => c.type === 'Broken street light problem').length, 
      color: 'bg-yellow-soft' 
    },
    { 
      icon: MapPin, 
      label: 'Potholes', 
      count: (complaints || []).filter(c => c.type === 'Potholes').length, 
      color: 'bg-orange-soft' 
    },
    { 
      icon: Droplets, 
      label: 'Drainage problem', 
      count: (complaints || []).filter(c => c.type === 'Drainage problem').length, 
      color: 'bg-blue-soft-new' 
    },
    { 
      icon: MoreHorizontal, 
      label: 'Others', 
      count: (complaints || []).filter(c => c.type === 'Others').length, 
      color: 'bg-purple-soft-new' 
    }
  ];

  // Mock initial reports from Figma prototype
  // Map real complaints from the database to feed items
  const realMappedComplaints = complaints.map(c => {
    let statusClass = 'status-review';
    let displayStatus = c.status || 'Pending';
    
    if (c.status === 'In Review' || c.status === 'Submitted') {
      statusClass = 'status-inprogress';
      displayStatus = c.status === 'Submitted' ? 'In Progress' : 'In Review';
    } else if (c.status === 'Resolved') {
      statusClass = 'status-resolved';
      displayStatus = 'Resolved';
    } else if (c.status === 'Forwarded' || c.status === 'Assigned') {
      statusClass = 'status-assigned';
      displayStatus = 'Forwarded';
    }

    return {
      id: c.id.substring(0, 13).toUpperCase(),
      title: c.title,
      category: c.type || 'General',
      location: c.location,
      status: displayStatus,
      statusClass: statusClass,
      time: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Just now',
      votes: c.upvotes || 0
    };
  });

  const filteredFeed = feedFilter === 'All' 
    ? realMappedComplaints 
    : realMappedComplaints.filter(item => {
        const filterLower = feedFilter.toLowerCase();
        const statusLower = item.status.toLowerCase();
        
        if (filterLower === 'in progress') {
          return statusLower === 'in progress' || statusLower === 'in review' || statusLower === 'submitted' || statusLower === 'pending';
        }
        if (filterLower === 'assigned') {
          return statusLower === 'assigned' || statusLower === 'forwarded';
        }
        return statusLower === filterLower;
      });

  // Testimonials list
  const testimonials = reviews.length > 0 ? reviews : [
    {
      name: 'Maria Chen',
      role: 'Resident, Portland',
      quote: 'Reported a pothole on my street Monday morning. By Thursday it was filled. I was genuinely shocked at how fast it worked.',
      avatar: 'MC',
      rating: 5
    },
    {
      name: 'David Okafor',
      role: 'Community Organizer, Austin',
      quote: 'FixMyCity turned our neighborhood association into a real force. We documented 40 broken streetlights in one evening. All fixed within a month.',
      avatar: 'DO',
      rating: 5
    },
    {
      name: 'Rosa Medina',
      role: 'City Council Aide, Denver',
      quote: 'From the government side — the prioritized reports make our job so much easier. We see what matters most to residents instantly.',
      avatar: 'RM',
      rating: 5
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
          <motion.div 
            style={{ zIndex: 5 }}
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.08 }
              }
            }}
          >
            <motion.div className="landing-eyebrow-badge" variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }}>
              <Zap size={14} color="#F0E840" fill="#F0E840" />
              <span>Civic reporting, reimagined</span>
            </motion.div>
            <motion.h1 className="landing-hero-title" variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
              Report.
              <br />
              <span>Track.</span>
              <br />
              Fix.
            </motion.h1>
            <motion.p className="landing-hero-desc" variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
              Spotted a pothole, broken streetlight, or neighborhood eyesore? FixMyCity connects residents directly to the right city department — and keeps you updated every step of the way.
            </motion.p>
            <motion.div className="landing-hero-actions" variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
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
            </motion.div>

            <motion.div className="landing-hero-social" variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }}>
              <div className="landing-avatar-group">
                <div className="landing-avatar-dot" style={{ backgroundColor: '#3A7CA5' }} />
                <div className="landing-avatar-dot" style={{ backgroundColor: '#E85D26' }} />
                <div className="landing-avatar-dot" style={{ backgroundColor: '#6BAA75' }} />
                <div className="landing-avatar-dot" style={{ backgroundColor: '#1A2438' }} />
              </div>
              <p>
                <strong>12,400+</strong> citizens reported issues this month
              </p>
            </motion.div>
          </motion.div>

          {/* Hero Image overlays */}
          <motion.div 
            className="landing-hero-image-pane"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 80, delay: 0.2 }}
          >
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
              <motion.div 
                className="landing-floating-report"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.6, type: 'spring', stiffness: 100 }}
                whileHover={{ y: -5 }}
              >
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
              </motion.div>

              <motion.div 
                className="landing-floating-resolution"
                initial={{ opacity: 0, scale: 0.9, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.8, type: 'spring', stiffness: 100 }}
                whileHover={{ y: -5 }}
              >
                <h2>66%</h2>
                <p>Resolution rate</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. Stats Strip Banner */}
      <section className="landing-stats-section">
        <div className="landing-stats-container">
          {statsList.map((stat, idx) => (
            <motion.div 
              className="landing-stat-box" 
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
            >
              <div className="landing-stat-value">{stat.value}</div>
              <div className="landing-stat-label">{stat.label}</div>
            </motion.div>
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
                <motion.div 
                  className={`landing-timeline-card ${idx === 1 ? 'inverted' : ''}`} 
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  transition={{ type: 'spring', stiffness: 100, delay: idx * 0.1 }}
                >
                  <div className="landing-card-num">{step.number}</div>
                  <div className="landing-card-icon-box">
                    <IconComponent size={24} style={{ color: '#1A2438' }} />
                  </div>
                  <h3 className="landing-card-title">{step.title}</h3>
                  <p className="landing-card-desc">{step.desc}</p>
                </motion.div>
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
                <motion.div 
                  className="landing-category-card" 
                  key={idx}
                  onClick={() => openAuthModal('citizen', 'register')}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.2 } }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 100, delay: idx * 0.08 }}
                >
                  <div className={`landing-cat-icon-badge ${cat.color}`}>
                    <IconComponent size={24} />
                  </div>
                  <h3>{cat.label}</h3>
                  <span className="font-mono">{cat.count.toLocaleString()} reports</span>
                </motion.div>
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

          <div className="landing-feed-list" style={{ position: 'relative' }}>
            <AnimatePresence mode="popLayout">
              {filteredFeed.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow' }}
                >
                  No reports found in this status category.
                </motion.div>
              ) : (
                filteredFeed.map((item) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30, mass: 0.8 }}
                    whileHover={{ scale: 1.01, x: 4, transition: { duration: 0.2 } }}
                    className="landing-feed-item"
                    key={item.id}
                    onClick={() => openAuthModal('citizen', 'login')}
                    style={{ cursor: 'pointer' }}
                  >
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
                  </motion.div>
                ))
              )}
            </AnimatePresence>
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
              <motion.div 
                className={`landing-testimonial-card ${idx === 1 ? 'highlighted' : ''}`} 
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.2 } }}
                transition={{ type: 'spring', stiffness: 100, delay: idx * 0.1 }}
              >
                <div>
                  <div className="landing-stars">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        style={{
                          fill: i < (test.rating || 5) ? 'var(--yellow-accent, #F0E840)' : 'none',
                          color: i < (test.rating || 5) ? 'var(--yellow-accent, #F0E840)' : 'rgba(255, 255, 255, 0.25)'
                        }}
                      />
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
              </motion.div>
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

            <div className="landing-footer-col">
              <h4>Contact Us</h4>
              <div className="landing-footer-contact-icons">
                <a
                  href="mailto:rounakthakur49@gmail.com"
                  className="landing-contact-icon-btn"
                  title="Email Us"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Mail size={20} />
                </a>
                <a
                  href="https://wa.me/917001451653"
                  className="landing-contact-icon-btn whatsapp-btn"
                  title="WhatsApp Us"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.66.986 3.288 1.488 4.96.489 1.67-.001 3.33-.5 4.96-1.489l.356-.21 3.672.961-.979-3.578.232-.369c1.077-1.714 1.644-3.705 1.644-5.753C21.09 6.275 17.01 2.2 12.01 2.2 7.009 2.2 2.93 6.275 2.93 11.277c0 2.054.566 4.045 1.643 5.759l.233.369-.979 3.579 3.672-.962.356.211zm11.258-5.32c-.3-.15-1.771-.875-2.029-.969-.258-.094-.446-.14-.633.14-.187.281-.726.912-.89 1.092-.164.18-.328.201-.628.05-3.002-1.503-4.385-2.73-5.263-4.24-.234-.403.234-.373.67-.1.391-.356.5-1.121.5-1.4-.047-.281-.234-1.219-.328-1.5-.094-.281-.187-.234-.328-.234-.141 0-.328-.047-.516-.047-.188 0-.516.07-.797.375-.281.305-1.078 1.055-1.078 2.578 0 1.523 1.109 2.992 1.266 3.195.156.203 2.18 3.328 5.281 4.664.738.318 1.312.507 1.758.65.742.234 1.414.201 1.945.122.592-.088 1.772-.724 2.022-1.391.25-.667.25-1.238.175-1.391-.075-.152-.258-.244-.558-.394z"/>
                  </svg>
                </a>
                <a
                  href="tel:+917001451653"
                  className="landing-contact-icon-btn call-btn"
                  title="Call Us"
                >
                  <Phone size={20} />
                </a>
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
              {changeApiUrl && (
                <button 
                  type="button" 
                  className="auth-modal-settings-btn"
                  onClick={changeApiUrl}
                  title="Configure Server URL"
                  style={{
                    position: 'absolute',
                    top: '24px',
                    left: '24px',
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(26, 36, 56, 0.4)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.25s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#F4AE52'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(26, 36, 56, 0.4)'}
                >
                  <Settings size={20} />
                </button>
              )}
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
                            type={showLoginPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={loginForm.password}
                            onChange={(e) =>
                              setLoginForm((prev) => ({ ...prev, password: e.target.value }))
                            }
                            style={{ paddingRight: '40px' }}
                          />
                          <button
                            type="button"
                            className="auth-password-toggle"
                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                            aria-label={showLoginPassword ? "Hide password" : "Show password"}
                          >
                            {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
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
                            pattern="\d{12}"
                            title="Aadhar number must be exactly 12 digits."
                            placeholder="12-digit UID"
                            value={registerForm.aadhar}
                            maxLength={12}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              setRegisterForm((prev) => ({ ...prev, aadhar: val }));
                            }}
                          />
                        </div>
                      </div>

                      <div className="auth-input-group">
                        <label>Password</label>
                        <div className="auth-input-wrapper">
                          <Key size={16} className="auth-input-icon" />
                          <input
                            required
                            type={showRegisterPassword ? "text" : "password"}
                            placeholder="Create password"
                            value={registerForm.password}
                            onChange={(e) =>
                              setRegisterForm((prev) => ({ ...prev, password: e.target.value }))
                            }
                            style={{ paddingRight: '40px' }}
                          />
                          <button
                            type="button"
                            className="auth-password-toggle"
                            onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                            aria-label={showRegisterPassword ? "Hide password" : "Show password"}
                          >
                            {showRegisterPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
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
                        type={showAdminPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={loginForm.password}
                        onChange={(e) =>
                          setLoginForm((prev) => ({ ...prev, password: e.target.value }))
                        }
                        style={{ paddingRight: '40px' }}
                      />
                      <button
                        type="button"
                        className="auth-password-toggle"
                        onClick={() => setShowAdminPassword(!showAdminPassword)}
                        aria-label={showAdminPassword ? "Hide password" : "Show password"}
                      >
                        {showAdminPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button type="submit">Admin login</button>
                </form>
              )}

              {authMessage && (
                <div className="auth-modal-error font-mono" style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                  <span>{authMessage}</span>
                  {changeApiUrl && authMessage.toLowerCase().includes('connect') && (
                    <button 
                      type="button"
                      onClick={changeApiUrl}
                      style={{
                        background: 'transparent',
                        border: '1px solid currentColor',
                        color: 'inherit',
                        padding: '4px 8px',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        marginTop: '4px',
                        textTransform: 'uppercase',
                        fontFamily: 'inherit',
                        letterSpacing: '0.05em'
                      }}
                    >
                      Configure Server URL
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
