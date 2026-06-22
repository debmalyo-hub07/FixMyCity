import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Tag, Calendar, SlidersHorizontal, ArrowDown } from 'lucide-react';

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
        complaint.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        complaint.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (complaint.citizenName && complaint.citizenName.toLowerCase().includes(searchQuery.toLowerCase()));

      const dbStatus = mapFilterToStatus(selectedStatus);
      const matchesStatus = selectedStatus === 'All' || complaint.status === dbStatus;
      const matchesType = selectedType === 'All' || complaint.type === selectedType;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [complaints, searchQuery, selectedStatus, selectedType]);

  return (
    <div className="complaints-list-wrapper-new">
      <div className="search-filter-container-new">
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
          title="Toggle Filters"
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
            transition={{ duration: 0.2 }}
            className="expanded-filters-panel-new"
          >
            <div className="filter-group-new">
              <label>Filter by Status</label>
              <div className="filter-chips-new">
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    type="button"
                    className={`filter-chip-new ${selectedStatus === status ? 'is-active' : ''}`}
                    onClick={() => setSelectedStatus(status)}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group-new">
              <label>Filter by Category</label>
              <div className="filter-chips-new">
                {categories.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`filter-chip-new ${selectedType === type ? 'is-active' : ''}`}
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

      <div className="complaints-scroll-area-new">
        <AnimatePresence mode="popLayout">
          {filteredComplaints.length ? (
            filteredComplaints.map((complaint, index) => {
              const isSelected = selectedComplaintId === complaint.id;
              return (
                <motion.article
                  layoutId={`complaint-card-${complaint.id}`}
                  key={complaint.id}
                  className={`complaint-item-modern-new ${isSelected ? 'is-selected' : ''}`}
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
                  whileTap={{ scale: 0.97 }}
                >
                  <div className="complaint-item-left-new">
                    <div className="complaint-item-header-new">
                      <span className="complaint-id-tag-new">{complaint.id}</span>
                      <span className={`status-badge-new status-${complaint.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {complaint.status}
                      </span>
                    </div>

                    <h4 className="complaint-item-title-new">{complaint.title}</h4>

                    {showReporterInfo && (
                      <div className="complaint-reporter-line-new">
                        <span>Reporter: {complaint.citizenName} ({complaint.citizenPhone})</span>
                      </div>
                    )}

                    <div className="complaint-item-meta-new">
                      <span className="meta-text-new">
                        <MapPin size={13} style={{ marginRight: '4px' }} />
                        {complaint.location}
                      </span>
                      <span className="meta-text-new">
                        <Tag size={13} style={{ marginRight: '4px' }} />
                        {complaint.type}
                      </span>
                    </div>

                    <div className="complaint-item-footer-new">
                      <span className="footer-timestamp-new">
                        <Calendar size={13} style={{ marginRight: '4px' }} />
                        Updated {complaint.updatedAt}
                      </span>
                    </div>
                  </div>

                  <div className="complaint-item-right-new">
                    <ArrowDown size={18} className="arrow-down-icon-new" />
                  </div>
                </motion.article>
              );
            })
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="empty-state-modern-new"
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
