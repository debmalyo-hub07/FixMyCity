import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Clock, ClipboardList, Search, SlidersHorizontal, MapPin, Tag, Briefcase, Maximize2 } from 'lucide-react';
import ComplaintDetail from './ComplaintDetail';

export default function AdminDashboard({
  stats,
  logout,
  complaints,
  selectedComplaintId,
  setSelectedComplaintId,
  selectedComplaint,
  handleStatusChange,
  handleComplaintDelete,
  authorityOptions,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [mobileView, setMobileView] = useState('list'); // 'list' or 'detail'
  const [maximizedImage, setMaximizedImage] = useState(null);

  const [forwardingComplaintId, setForwardingComplaintId] = useState(null);
  const [selectedAuthority, setSelectedAuthority] = useState(authorityOptions[0]);

  // Close lightbox on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMaximizedImage(null);
      }
    };
    if (maximizedImage) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [maximizedImage]);

  // Categories
  const categories = useMemo(() => {
    const types = new Set(complaints.map((c) => c.type));
    return ['All', ...Array.from(types)];
  }, [complaints]);

  // Statuses
  const statusOptions = ['All', 'Submitted', 'In Review', 'Forwarded', 'Resolved'];

  const filteredComplaints = useMemo(() => {
    return complaints.filter((complaint) => {
      const matchesSearch =
        complaint.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        complaint.citizenName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        complaint.citizenPhone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        complaint.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        complaint.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = selectedStatus === 'All' || complaint.status === selectedStatus;
      const matchesType = selectedType === 'All' || complaint.type === selectedType;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [complaints, searchQuery, selectedStatus, selectedType]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
  };

  const getStatusClass = (status) => {
    return `status-badge status-${status.toLowerCase().replace(/\s+/g, '-')}`;
  };

  return (
    <motion.div
      className="dashboard-container-modern"
      initial="hidden"
      animate="show"
      variants={containerVariants}
    >
      {/* Admin Header */}
      <motion.div className="dashboard-header-card admin-header-theme" variants={cardVariants}>
        <div className="header-greeting-info">
          <span className="dashboard-eyebrow">Admin Control Center</span>
          <h2>All Registered Complaints</h2>
          <p>Review filed complaints, assign departments, and update resolution progress.</p>
        </div>
        <motion.button
          type="button"
          className="logout-action-btn"
          onClick={logout}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Sign Out
        </motion.button>
      </motion.div>

      {/* Admin Stats Row */}
      <motion.div className="stats-row-modern" variants={containerVariants}>
        <motion.div className="stat-card-modern border-blue" variants={cardVariants} whileHover={{ y: -3 }}>
          <div className="stat-icon-wrapper bg-blue-soft text-blue">
            <ClipboardList size={22} />
          </div>
          <div className="stat-text-wrapper">
            <h3>{stats.total}</h3>
            <span>Total complaints</span>
          </div>
        </motion.div>

        <motion.div className="stat-card-modern border-warning" variants={cardVariants} whileHover={{ y: -3 }}>
          <div className="stat-icon-wrapper bg-warning-soft text-warning">
            <Clock size={22} />
          </div>
          <div className="stat-text-wrapper">
            <h3>{stats.active}</h3>
            <span>Needs Attention</span>
          </div>
        </motion.div>

        <motion.div className="stat-card-modern border-success" variants={cardVariants} whileHover={{ y: -3 }}>
          <div className="stat-icon-wrapper bg-success-soft text-success">
            <Users size={22} />
          </div>
          <div className="stat-text-wrapper">
            <h3>{stats.citizens}</h3>
            <span>Citizens Served</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Main Admin Section */}
      <div className="admin-layout-grid">
        {/* Left Side: Complaints List and management */}
        <div className={`admin-left-panel ${mobileView === 'list' ? '' : 'mobile-hidden'}`}>
          {/* Filters card */}
          <motion.div className="card-panel-modern admin-filters-card" variants={cardVariants} style={{ marginBottom: '1.25rem' }}>
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search by reporter, area, issue, UID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input-field"
              />
              <button
                type="button"
                className={`filter-toggle-btn ${showFilters ? 'is-active' : ''}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal size={16} />
              </button>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="expanded-filters-panel"
                  style={{ marginTop: '1rem', borderTop: '1px solid var(--line)', paddingTop: '1rem' }}
                >
                  <div className="filter-group">
                    <label>Filter Status</label>
                    <div className="filter-chips">
                      {statusOptions.map((st) => (
                        <button
                          key={st}
                          type="button"
                          className={`filter-chip ${selectedStatus === st ? 'is-active' : ''}`}
                          onClick={() => setSelectedStatus(st)}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="filter-group" style={{ marginTop: '0.75rem' }}>
                    <label>Filter Category</label>
                    <div className="filter-chips">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          className={`filter-chip ${selectedType === cat ? 'is-active' : ''}`}
                          onClick={() => setSelectedType(cat)}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* List of complaints */}
          <div className="admin-complaints-scroll">
            <AnimatePresence mode="popLayout">
              {filteredComplaints.length ? (
                filteredComplaints.map((complaint) => (
                  <motion.article
                    key={complaint.id}
                    layoutId={`admin-card-${complaint.id}`}
                    className={`admin-complaint-card-modern ${selectedComplaintId === complaint.id ? 'is-active' : ''}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 100 }}
                  >
                    <div className="admin-card-img-container">
                      <img
                        src={complaint.images?.[0] || complaint.image}
                        alt={complaint.title}
                        className="admin-card-img"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMaximizedImage(complaint.images?.[0] || complaint.image);
                        }}
                        title="Click to view maximized"
                      />
                      <div className="admin-card-img-overlay">
                        <Maximize2 size={12} color="#ffffff" />
                      </div>
                    </div>
                    <div className="admin-card-content">
                      <div className="admin-card-topbar">
                        <div>
                          <span className="admin-card-id">{complaint.id}</span>
                          <h3>{complaint.title}</h3>
                          <p className="admin-card-reporter">
                            Reporter: <strong>{complaint.citizenName}</strong> ({complaint.citizenPhone})
                          </p>
                        </div>
                        <span className={getStatusClass(complaint.status)}>
                          {complaint.status}
                        </span>
                      </div>

                      <div className="admin-card-meta">
                        <span className="meta-tag-chip">
                          <Tag size={12} style={{ marginRight: '4px' }} />
                          {complaint.type}
                        </span>
                        <span className="meta-tag-chip">
                          <MapPin size={12} style={{ marginRight: '4px' }} />
                          {complaint.location}
                        </span>
                        <span className="meta-tag-chip">
                          <Briefcase size={12} style={{ marginRight: '4px' }} />
                          Assigned: {complaint.forwardedTo}
                        </span>
                      </div>

                      <p className="admin-card-desc">{complaint.description}</p>

                      <div className="admin-card-actions">
                        <motion.button
                          whileTap={{ scale: 0.96 }}
                          type="button"
                          className="admin-btn-secondary"
                          onClick={() => {
                            setSelectedComplaintId(complaint.id);
                            setMobileView('detail');
                          }}
                        >
                          View History
                        </motion.button>

                        {/* Inline Status Actions in the Middle */}
                        {forwardingComplaintId === complaint.id ? (
                          <div className="inline-forward-panel">
                            <select
                              value={selectedAuthority}
                              onChange={(e) => setSelectedAuthority(e.target.value)}
                              className="inline-authority-select"
                            >
                              {authorityOptions.map((auth) => (
                                <option key={auth} value={auth}>
                                  {auth}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              className="admin-btn-action admin-btn-primary-small"
                              onClick={() => {
                                handleStatusChange(complaint.id, 'Forwarded', selectedAuthority);
                                setForwardingComplaintId(null);
                              }}
                            >
                              Assign
                            </button>
                            <button
                              type="button"
                              className="admin-btn-action admin-btn-cancel-small"
                              onClick={() => setForwardingComplaintId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="inline-status-buttons">
                            {complaint.status === 'Submitted' && (
                              <motion.button
                                whileTap={{ scale: 0.96 }}
                                type="button"
                                className="admin-btn-action admin-btn-approve"
                                onClick={() => handleStatusChange(complaint.id, 'In Review', '')}
                              >
                                Approve
                              </motion.button>
                            )}

                            {(complaint.status === 'Submitted' || complaint.status === 'In Review') && (
                              <motion.button
                                whileTap={{ scale: 0.96 }}
                                type="button"
                                className="admin-btn-action admin-btn-forward"
                                onClick={() => {
                                  setSelectedAuthority(authorityOptions[0]);
                                  setForwardingComplaintId(complaint.id);
                                }}
                              >
                                Forward
                              </motion.button>
                            )}

                            {complaint.status === 'Forwarded' && (
                              <motion.button
                                whileTap={{ scale: 0.96 }}
                                type="button"
                                className="admin-btn-action admin-btn-forward-change"
                                onClick={() => {
                                  setSelectedAuthority(complaint.forwardedTo || authorityOptions[0]);
                                  setForwardingComplaintId(complaint.id);
                                }}
                              >
                                Re-assign
                              </motion.button>
                            )}

                            {complaint.status !== 'Resolved' && (
                              <motion.button
                                whileTap={{ scale: 0.96 }}
                                type="button"
                                className="admin-btn-action admin-btn-solve"
                                onClick={() => handleStatusChange(complaint.id, 'Resolved', '')}
                              >
                                Solve
                              </motion.button>
                            )}

                            {complaint.status === 'Resolved' && (
                              <motion.button
                                whileTap={{ scale: 0.96 }}
                                type="button"
                                className="admin-btn-action admin-btn-reopen"
                                onClick={() => handleStatusChange(complaint.id, 'Submitted', '')}
                              >
                                Reopen
                              </motion.button>
                            )}
                          </div>
                        )}

                        <motion.button
                          whileTap={{ scale: 0.96 }}
                          type="button"
                          className="admin-btn-delete"
                          onClick={() => handleComplaintDelete(complaint.id)}
                        >
                          Delete
                        </motion.button>
                      </div>
                    </div>
                  </motion.article>
                ))
              ) : (
                <div className="empty-state-modern">
                  <h4>No complaints found</h4>
                  <p>Admins can view reported issues once they match the filter parameters.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Side: Timeline details */}
        <motion.div 
          className={`admin-right-panel card-panel-modern ${mobileView === 'detail' ? '' : 'mobile-hidden'}`} 
          variants={cardVariants}
        >
          <ComplaintDetail
            selectedComplaint={selectedComplaint}
            showFullDetails={true}
            onBackToList={() => setMobileView('list')}
            onImageClick={setMaximizedImage}
          />
        </motion.div>
      </div>

      {/* Lightbox maximized photo viewer */}
      <AnimatePresence>
        {maximizedImage && (
          <motion.div
            className="lightbox-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMaximizedImage(null)}
          >
            <motion.div
              className="lightbox-container"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <img src={maximizedImage} alt="Maximized view" className="lightbox-img" />
              <button
                type="button"
                className="lightbox-close-btn"
                onClick={() => setMaximizedImage(null)}
                title="Close Viewer"
              >
                &times;
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
