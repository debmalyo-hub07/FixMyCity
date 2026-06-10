import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Tag, Calendar, SlidersHorizontal, ArrowRight } from 'lucide-react';

export default function ComplaintList({
  complaints,
  selectedComplaintId,
  setSelectedComplaintId,
  showReporterInfo = false,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  // Derive unique categories
  const categories = useMemo(() => {
    const types = new Set(complaints.map((c) => c.type));
    return ['All', ...Array.from(types)];
  }, [complaints]);

  // Derive status options
  const statusOptions = ['All', 'Submitted', 'In Review', 'Forwarded', 'Resolved'];

  const filteredComplaints = useMemo(() => {
    return complaints.filter((complaint) => {
      const matchesSearch =
        complaint.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        complaint.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        complaint.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (complaint.citizenName && complaint.citizenName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = selectedStatus === 'All' || complaint.status === selectedStatus;
      const matchesType = selectedType === 'All' || complaint.type === selectedType;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [complaints, searchQuery, selectedStatus, selectedType]);

  const getStatusClass = (status) => {
    return `status-badge status-${status.toLowerCase().replace(/\s+/g, '-')}`;
  };

  return (
    <div className="complaints-list-wrapper">
      <div className="search-filter-container">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by ID, title, area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input-field"
          />
          <button
            type="button"
            className={`filter-toggle-btn ${showFilters ? 'is-active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
            title="Toggle Filters"
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
              transition={{ duration: 0.2 }}
              className="expanded-filters-panel"
            >
              <div className="filter-group">
                <label>Filter by Status</label>
                <div className="filter-chips">
                  {statusOptions.map((status) => (
                    <button
                      key={status}
                      type="button"
                      className={`filter-chip ${selectedStatus === status ? 'is-active' : ''}`}
                      onClick={() => setSelectedStatus(status)}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-group">
                <label>Filter by Category</label>
                <div className="filter-chips">
                  {categories.map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={`filter-chip ${selectedType === type ? 'is-active' : ''}`}
                      onClick={() => setSelectedType(type)}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="complaints-scroll-area">
        <AnimatePresence mode="popLayout">
          {filteredComplaints.length ? (
            filteredComplaints.map((complaint, index) => {
              const isSelected = selectedComplaintId === complaint.id;
              return (
                <motion.article
                  layoutId={`complaint-card-${complaint.id}`}
                  key={complaint.id}
                  className={`complaint-item-modern ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => setSelectedComplaintId(complaint.id)}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ 
                    type: 'spring', 
                    stiffness: 120, 
                    damping: 18,
                    delay: Math.min(index * 0.05, 0.4) 
                  }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="complaint-item-header">
                    <span className="complaint-id-tag">{complaint.id}</span>
                    <span className={getStatusClass(complaint.status)}>
                      {complaint.status}
                    </span>
                  </div>

                  <h4 className="complaint-item-title">{complaint.title}</h4>

                  {showReporterInfo && (
                    <div className="complaint-reporter-line">
                      <span>Reporter: {complaint.citizenName} ({complaint.citizenPhone})</span>
                    </div>
                  )}

                  <div className="complaint-item-meta">
                    <span className="meta-text">
                      <MapPin size={12} style={{ marginRight: '4px' }} />
                      {complaint.location}
                    </span>
                    <span className="meta-text">
                      <Tag size={12} style={{ marginRight: '4px' }} />
                      {complaint.type}
                    </span>
                  </div>

                  <div className="complaint-item-footer">
                    <span className="footer-timestamp">
                      <Calendar size={12} style={{ marginRight: '4px' }} />
                      Updated {complaint.updatedAt}
                    </span>
                    <ArrowRight size={14} className="arrow-go-icon" />
                  </div>
                </motion.article>
              );
            })
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="empty-state-modern"
            >
              <h4>No complaints found</h4>
              <p>Try refining your search query or filters.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
