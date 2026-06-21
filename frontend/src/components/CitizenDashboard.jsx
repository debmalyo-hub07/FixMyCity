import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  CheckCircle2,
  FileText,
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
  complaintError,
  setComplaintError,
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

  const handleFormSubmitWrapped = async (e) => {
    e.preventDefault();
    const ok = await handleComplaintSubmit(e);
    if (ok) {
      setActiveTab('track');
      setMobileTrackView('detail');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 90, damping: 14 } },
  };

  return (
    <motion.div
      className="cz-dashboard"
      initial="hidden"
      animate="show"
      variants={containerVariants}
    >
      {/* Hero headerwelcome box */}
      <motion.div className="cz-hero" variants={cardVariants}>
        {/* Background rotating outline boxes */}
        <div className="cz-hero-deco-box-1" />
        <div className="cz-hero-deco-box-2" />

        <div className="cz-hero-main">
          <div className="cz-avatar" aria-hidden="true">{initials}</div>
          <div className="cz-hero-info">
            <span className="cz-eyebrow">Citizen Panel</span>
            <h2>Welcome back, {session.name}</h2>
            <p>File your complaints with photo proof and track live status updates.</p>
          </div>
        </div>
        
        <button
          type="button"
          className="cz-logout"
          onClick={logout}
        >
          <LogOut size={14} style={{ marginRight: '6px' }} />
          Sign Out
        </button>
      </motion.div>

      {/* 3-column stats row */}
      <motion.div className="cz-stats-row" variants={cardVariants}>
        <div className="cz-stat-col tone-blue">
          <div className="cz-stat-icon-wrapper">
            <FileText size={20} color="#1A2438" />
          </div>
          <div className="cz-stat-text-group">
            <h3>{citizenStats.total}</h3>
            <span>Your Complaints</span>
          </div>
        </div>

        <div className="cz-stat-col tone-warning">
          <div className="cz-stat-icon-wrapper">
            <Clock size={20} color="#E85D26" />
          </div>
          <div className="cz-stat-text-group">
            <h3>{citizenStats.open}</h3>
            <span>Open Cases</span>
          </div>
        </div>

        <div className="cz-stat-col tone-success">
          <div className="cz-stat-icon-wrapper">
            <CheckCircle2 size={20} color="#22c55e" />
          </div>
          <div className="cz-stat-text-group">
            <h3>{citizenStats.resolved}</h3>
            <span>Resolved</span>
          </div>
        </div>
      </motion.div>

      {/* Flat Underlined Tab Selectors */}
      <div className="cz-flat-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'file'}
          className={`cz-flat-tab ${activeTab === 'file' ? 'active' : ''}`}
          onClick={() => setActiveTab('file')}
        >
          <PlusCircle size={16} />
          File Report
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'track'}
          className={`cz-flat-tab ${activeTab === 'track' ? 'active' : ''}`}
          onClick={() => setActiveTab('track')}
        >
          <BarChart2 size={16} />
          Track Status{citizenStats.total > 0 ? ` (${citizenStats.total})` : ''}
        </button>
      </div>

      {/* Work area */}
      <div className={`cz-work-area ${activeTab === 'file' ? 'view-file' : 'view-track'}`}>
        {activeTab === 'track' && currentCitizenComplaints.length === 0 ? (
          <motion.div className="cz-track-empty-state" variants={cardVariants}>
            <div className="cz-empty-icon-box">
              <Clock size={32} color="#1A2438" />
            </div>
            <h2>No Complaints Yet</h2>
            <p>Once you file a complaint, you can track its live status here.</p>
          </motion.div>
        ) : (
          <>
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
                complaintError={complaintError}
                setComplaintError={setComplaintError}
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
          </>
        )}
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
