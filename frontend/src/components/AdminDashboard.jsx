import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Search, 
  SlidersHorizontal, 
  MapPin, 
  Tag, 
  AlertTriangle, 
  FileText, 
  Send, 
  CheckCircle2, 
  Calendar 
} from 'lucide-react';
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
  const statusOptions = ['All', 'In Review', 'Approved', 'Forwarded', 'Solved'];

  const mapFilterToStatus = (filterLabel) => {
    switch (filterLabel) {
      case 'In Review': return 'Submitted';
      case 'Approved':  return 'In Review';
      case 'Forwarded': return 'Forwarded';
      case 'Solved':    return 'Resolved';
      default:          return filterLabel;
    }
  };

  const filteredComplaints = useMemo(() => {
    return complaints.filter((complaint) => {
      const matchesSearch =
        complaint.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        complaint.citizenName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        complaint.citizenPhone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        complaint.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        complaint.id.toLowerCase().includes(searchQuery.toLowerCase());

      const dbStatus = mapFilterToStatus(selectedStatus);
      const matchesStatus = selectedStatus === 'All' || complaint.status === dbStatus;
      const matchesType = selectedType === 'All' || complaint.type === selectedType;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [complaints, searchQuery, selectedStatus, selectedType]);


  return (
    <div className="admin-dashboard-layout">
      {/* Main Content Area */}
      <main className="admin-main-content">
        {/* Stats Grid Card */}
        <div className="admin-stats-card-row">
          <div className="admin-stat-card-col">
            <div className="admin-stat-card-icon bg-blue-soft">
              <FileText size={18} color="#1A2438" />
            </div>
            <div className="admin-stat-card-text">
              <h3>{stats.total}</h3>
              <span>Total Complaints</span>
            </div>
          </div>
          
          <div className="admin-stat-card-col">
            <div className="admin-stat-card-icon bg-warning-soft">
              <Clock size={18} color="#E85D26" />
            </div>
            <div className="admin-stat-card-text">
              <h3>{stats.active}</h3>
              <span>Pending Review</span>
            </div>
          </div>

          <div className="admin-stat-card-col">
            <div className="admin-stat-card-icon bg-orange-soft">
              <Send size={18} color="#ea580c" />
            </div>
            <div className="admin-stat-card-text">
              <h3>{complaints.filter(c => c.status === 'Forwarded').length}</h3>
              <span>Forwarded</span>
            </div>
          </div>

          <div className="admin-stat-card-col">
            <div className="admin-stat-card-icon bg-success-soft">
              <CheckCircle2 size={18} color="#16a34a" />
            </div>
            <div className="admin-stat-card-text">
              <h3>{complaints.filter(c => c.status === 'Resolved').length}</h3>
              <span>Resolved</span>
            </div>
          </div>
        </div>

        {/* Complaints Layout Grid */}
        <div className="admin-layout-grid-new">
          {/* Left panel: List */}
          <div className={`admin-left-panel-new ${mobileView === 'list' ? '' : 'mobile-hidden'}`}>
            <div className="admin-list-header-new">
              <h3>All Complaints</h3>
            </div>

            {/* Filters */}
            <div className="admin-filters-card-new">
              <div className="search-input-wrapper-new">
                <Search size={18} className="search-icon-new" />
                <input
                  type="text"
                  placeholder="Search by ID, title, area..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input-field-new"
                />
              </div>
              <button
                type="button"
                className={`filter-toggle-btn-new ${showFilters ? 'is-active' : ''}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal size={18} />
              </button>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="expanded-filters-panel-new"
                >
                  <div className="filter-group-new">
                    <label>Filter Status</label>
                    <div className="filter-chips-new">
                      {statusOptions.map((st) => (
                        <button
                          key={st}
                          type="button"
                          className={`filter-chip-new ${selectedStatus === st ? 'is-active' : ''}`}
                          onClick={() => setSelectedStatus(st)}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="filter-group-new">
                    <label>Filter Category</label>
                    <div className="filter-chips-new">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          className={`filter-chip-new ${selectedType === cat ? 'is-active' : ''}`}
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



            {/* Scrollable list */}
            <div className="admin-complaints-scroll-new">
              <AnimatePresence mode="popLayout">
                {filteredComplaints.length ? (
                  filteredComplaints.map((complaint) => {
                    const isSelected = selectedComplaintId === complaint.id;
                    return (
                      <motion.article
                        key={complaint.id}
                        layoutId={`admin-card-${complaint.id}`}
                        className={`admin-complaint-card-new ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => {
                          setSelectedComplaintId(complaint.id);
                        }}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 100 }}
                      >
                        <div className="admin-card-header-new">
                          <span className="admin-card-id-new">{complaint.id}</span>
                          <span className={`status-badge-new status-${complaint.status.toLowerCase().replace(/\s+/g, '-')}`}>
                            {complaint.status}
                          </span>
                        </div>

                        <h4 className="admin-card-title-new">{complaint.title}</h4>

                        <div className="admin-card-meta-new">
                          <span className="meta-text-new">
                            <MapPin size={13} style={{ marginRight: '4px' }} />
                            {complaint.location}
                          </span>
                          <span className="meta-text-new">
                            <Tag size={13} style={{ marginRight: '4px' }} />
                            {complaint.type}
                          </span>
                          {complaint.forwardedTo && (
                            <span className="meta-text-new department">
                              <Send size={12} style={{ marginRight: '4px' }} />
                              {complaint.forwardedTo}
                            </span>
                          )}
                        </div>

                        <div className="admin-card-footer-new">
                          <span className="footer-timestamp-new">
                            <Calendar size={13} style={{ marginRight: '4px' }} />
                            Updated {complaint.updatedAt}
                          </span>
                        </div>
                      </motion.article>
                    );
                  })
                ) : (
                  <div className="empty-state-modern-new">
                    <h4>No complaints found</h4>
                    <p>Admins can view reported issues once they match the filter parameters.</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right panel: Details and actions */}
          <div className={`admin-right-panel-new ${mobileView === 'detail' ? '' : 'mobile-hidden'}`}>
            {selectedComplaint ? (
              <div className="admin-detail-pane-wrapper">
                {/* Top Action Row */}
                <div className="admin-detail-actions-top">
                  <div className="action-buttons-group">
                    <button
                      type="button"
                      className={`admin-action-btn-top approve ${selectedComplaint.status !== 'Submitted' ? 'clicked' : 'active'}`}
                      disabled={selectedComplaint.status !== 'Submitted'}
                      onClick={() => handleStatusChange(selectedComplaint.id, 'In Review', '')}
                    >
                      {selectedComplaint.status === 'Submitted' ? 'Approve' : 'Approved'}
                    </button>
                    <button
                      type="button"
                      className={`admin-action-btn-top forward ${(selectedComplaint.status === 'Forwarded' || selectedComplaint.status === 'Resolved') ? 'clicked' : 'active'}`}
                      disabled={selectedComplaint.status !== 'In Review'}
                      onClick={() => {
                        setSelectedAuthority(authorityOptions[0]);
                        setForwardingComplaintId(selectedComplaint.id);
                      }}
                    >
                      {(selectedComplaint.status === 'Forwarded' || selectedComplaint.status === 'Resolved') ? 'Forwarded' : 'Forward'}
                    </button>
                    <button
                      type="button"
                      className={`admin-action-btn-top solve ${selectedComplaint.status === 'Resolved' ? 'clicked' : 'active'}`}
                      disabled={selectedComplaint.status !== 'Forwarded'}
                      onClick={() => handleStatusChange(selectedComplaint.id, 'Resolved', '')}
                    >
                      {selectedComplaint.status === 'Resolved' ? 'Solved' : 'Solve'}
                    </button>
                  </div>

                  <button
                    type="button"
                    className="admin-action-btn-top delete"
                    onClick={() => handleComplaintDelete(selectedComplaint.id)}
                  >
                    Delete
                  </button>
                </div>

                {/* Inline Forward/Assign dropdown pane */}
                {forwardingComplaintId === selectedComplaint.id && (
                  <div className="detail-forward-dropdown-panel">
                    <div className="dropdown-label">Assign Department Authority:</div>
                    <div className="dropdown-controls">
                      <select
                        value={selectedAuthority}
                        onChange={(e) => setSelectedAuthority(e.target.value)}
                        className="admin-authority-select-dropdown"
                      >
                        {authorityOptions.map((auth) => (
                          <option key={auth} value={auth}>
                            {auth}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="dropdown-action-btn confirm"
                        onClick={() => {
                          handleStatusChange(selectedComplaint.id, 'Forwarded', selectedAuthority);
                          setForwardingComplaintId(null);
                        }}
                      >
                        Assign
                      </button>
                      <button
                        type="button"
                        className="dropdown-action-btn cancel"
                        onClick={() => setForwardingComplaintId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Standard ComplaintDetail visual render */}
                <div className="admin-detail-content-card">
                  {selectedComplaint.imageCheck?.matched === false && (
                    <div className="image-flag-banner-admin">
                      <AlertTriangle size={16} />
                      <div>
                        <strong>Image may not match category</strong>
                        <span>Please verify the photo before resolving.</span>
                      </div>
                    </div>
                  )}

                  <ComplaintDetail
                    selectedComplaint={selectedComplaint}
                    showFullDetails={true}
                    onBackToList={() => setMobileView('list')}
                    onImageClick={setMaximizedImage}
                  />

                  {/* Reporter details block */}
                  <div className="admin-detail-reporter-box" style={{ flexWrap: 'wrap', gap: '16px' }}>
                    <div className="reporter-detail-col">
                      <span className="detail-label">Reporter</span>
                      <strong className="detail-value">{selectedComplaint.citizenName}</strong>
                    </div>
                    <div className="reporter-detail-col">
                      <span className="detail-label">Phone</span>
                      <strong className="detail-value">{selectedComplaint.citizenPhone}</strong>
                    </div>
                    {selectedComplaint.citizenLocation && (
                      <div className="reporter-detail-col" style={{ flex: '1 1 100%', borderTop: '1px solid rgba(26, 36, 56, 0.05)', paddingTop: '10px', marginTop: '6px' }}>
                        <span className="detail-label">Citizen Address / Location Info</span>
                        <strong className="detail-value" style={{ fontWeight: 500 }}>{selectedComplaint.citizenLocation}</strong>
                      </div>
                    )}
                  </div>

                  {/* Middle Actions row */}
                  <div className="admin-detail-actions-middle">
                    <div className="left-group">
                    </div>

                    <div className="right-group">
                      <button
                        type="button"
                        className="admin-middle-action-btn reassign"
                        onClick={() => {
                          setSelectedAuthority(selectedComplaint.forwardedTo || authorityOptions[0]);
                          setForwardingComplaintId(selectedComplaint.id);
                        }}
                      >
                        Re-assign
                      </button>
                      <button
                        type="button"
                        className="admin-middle-link-btn"
                        onClick={() => {
                          // View history or scroll to timeline
                          const timelineEl = document.querySelector('.detail-timeline-box-new');
                          if (timelineEl) timelineEl.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                        View History
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state-modern-new">
                <h4>No complaint selected</h4>
                <p>Select a complaint from the list to view its current timeline and manage updates.</p>
              </div>
            )}
          </div>
        </div>
      </main>

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
    </div>
  );
}
