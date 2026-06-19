import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  CheckCircle2,
  ClipboardList,
  PlusCircle,
  BarChart2,
  LogOut,
} from 'lucide-react';
import ComplaintForm from './ComplaintForm';
import ComplaintList from './ComplaintList';
import ComplaintDetail from './ComplaintDetail';

export default function CitizenDashboard({
  session,
  logout,
  currentCitizenComplaints,
  selectedComplaintId,
  setSelectedComplaintId,
  selectedComplaint,
  complaintForm,
  setComplaintForm,
  complaintTypes,
  handleComplaintImages,
  handleComplaintSubmit,
}) {
  const [activeTab, setActiveTab] = useState('file'); // 'file' or 'track'
  const [mobileTrackView, setMobileTrackView] = useState('list'); // 'list' or 'detail'
  const [maximizedImage, setMaximizedImage] = useState(null);

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

  const citizenStats = {
    total: currentCitizenComplaints.length,
    open: currentCitizenComplaints.filter((item) => item.status !== 'Resolved').length,
    resolved: currentCitizenComplaints.filter((item) => item.status === 'Resolved').length,
  };

  const resolveRate = citizenStats.total
    ? Math.round((citizenStats.resolved / citizenStats.total) * 100)
    : 0;

  const initials = (session.name || 'U')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleSelectComplaint = (id) => {
    setSelectedComplaintId(id);
    setMobileTrackView('detail');
  };

  const handleFormSubmitWrapped = (e) => {
    handleComplaintSubmit(e);
    setActiveTab('track');
    setMobileTrackView('detail');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 90, damping: 14 } },
  };

  const stats = [
    { key: 'total', label: 'Your Complaints', value: citizenStats.total, Icon: ClipboardList, tone: 'blue' },
    { key: 'open', label: 'Open Cases', value: citizenStats.open, Icon: Clock, tone: 'warning' },
    { key: 'resolved', label: 'Resolved', value: citizenStats.resolved, Icon: CheckCircle2, tone: 'success' },
  ];

  return (
    <motion.div
      className="cz-dashboard"
      initial="hidden"
      animate="show"
      variants={containerVariants}
    >
      {/* Hero header */}
      <motion.div className="cz-hero" variants={cardVariants}>
        <div className="cz-hero-glow" aria-hidden="true" />
        <div className="cz-hero-main">
          <div className="cz-avatar" aria-hidden="true">{initials}</div>
          <div className="cz-hero-info">
            <span className="cz-eyebrow">Citizen Panel</span>
            <h2>Welcome back, {session.name}</h2>
            <p>File civic complaints with photo proof and track live status updates.</p>
          </div>
        </div>
        <motion.button
          type="button"
          className="cz-logout"
          onClick={logout}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <LogOut size={15} />
          Sign Out
        </motion.button>
      </motion.div>

      {/* Stats */}
      <motion.div className="cz-stats" variants={containerVariants}>
        {stats.map(({ key, label, value, Icon, tone }) => (
          <motion.div
            key={key}
            className={`cz-stat cz-tone-${tone}`}
            variants={cardVariants}
            whileHover={{ y: -4 }}
          >
            <span className="cz-stat-icon">
              <Icon size={20} />
            </span>
            <div className="cz-stat-body">
              <h3>{value}</h3>
              <span>{label}</span>
            </div>
            {key === 'resolved' && citizenStats.total > 0 && (
              <div className="cz-stat-ring" style={{ '--p': resolveRate }} title={`${resolveRate}% resolved`}>
                <span>{resolveRate}%</span>
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Segmented tab switch (all screen sizes) */}
      <div className="cz-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'file'}
          className={`cz-tab ${activeTab === 'file' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('file')}
        >
          <PlusCircle size={16} />
          File Report
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'track'}
          className={`cz-tab ${activeTab === 'track' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('track')}
        >
          <BarChart2 size={16} />
          Track Status{citizenStats.total > 0 ? ` (${citizenStats.total})` : ''}
        </button>
        <motion.span
          className="cz-tab-indicator"
          animate={{ x: activeTab === 'file' ? '0%' : '100%' }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        />
      </div>

      {/* Work area */}
      <div className={`cz-work ${activeTab === 'file' ? 'view-file' : 'view-track'}`}>
        {/* File complaint */}
        <motion.section
          className={`cz-panel cz-panel-file ${activeTab === 'file' ? '' : 'cz-hidden'}`}
          variants={cardVariants}
        >
          <div className="cz-panel-head">
            <h3>File a New Complaint</h3>
            <p>Describe the issue and give the exact location to speed up routing.</p>
          </div>
          <ComplaintForm
            complaintForm={complaintForm}
            setComplaintForm={setComplaintForm}
            complaintTypes={complaintTypes}
            handleComplaintImages={handleComplaintImages}
            handleComplaintSubmit={handleFormSubmitWrapped}
          />
        </motion.section>

        {/* Track: list */}
        <motion.section
          className={`cz-panel cz-panel-list ${
            activeTab === 'track' && mobileTrackView === 'list' ? '' : 'cz-hidden-mobile'
          } ${activeTab === 'track' ? '' : 'cz-hidden-desktop'}`}
          variants={cardVariants}
        >
          <div className="cz-panel-head">
            <h3>Track Filed Reports</h3>
            <p>Select a complaint to watch its progress updates.</p>
          </div>
          <ComplaintList
            complaints={currentCitizenComplaints}
            selectedComplaintId={selectedComplaintId}
            setSelectedComplaintId={handleSelectComplaint}
          />
        </motion.section>

        {/* Track: detail */}
        <motion.section
          className={`cz-panel cz-panel-detail ${
            activeTab === 'track' && mobileTrackView === 'detail' ? '' : 'cz-hidden-mobile'
          } ${activeTab === 'track' ? '' : 'cz-hidden-desktop'}`}
          variants={cardVariants}
        >
          <ComplaintDetail
            selectedComplaint={selectedComplaint}
            showFullDetails={true}
            onBackToList={() => setMobileTrackView('list')}
            onImageClick={setMaximizedImage}
          />
        </motion.section>
      </div>

      {/* Lightbox */}
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
