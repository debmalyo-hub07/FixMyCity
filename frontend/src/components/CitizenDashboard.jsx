import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle2, ClipboardList, PlusCircle, BarChart2 } from 'lucide-react';
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
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 90, damping: 14 } },
  };

  return (
    <motion.div
      className="dashboard-container-modern"
      initial="hidden"
      animate="show"
      variants={containerVariants}
    >
      {/* Dashboard Greeting Header */}
      <motion.div className="dashboard-header-card citizen-header-theme" variants={cardVariants}>
        <div className="header-greeting-info">
          <span className="dashboard-eyebrow">Citizen Panel</span>
          <h2>Welcome back, {session.name}</h2>
          <p>Submit new civic complaints, upload image proof, and track live status updates.</p>
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

      {/* Citizen Stats Row */}
      <motion.div className="stats-row-modern" variants={containerVariants}>
        <motion.div className="stat-card-modern border-blue" variants={cardVariants}>
          <div className="stat-icon-wrapper bg-blue-soft text-blue">
            <ClipboardList size={22} />
          </div>
          <div className="stat-text-wrapper">
            <h3>{citizenStats.total}</h3>
            <span>Your Complaints</span>
          </div>
        </motion.div>

        <motion.div className="stat-card-modern border-warning" variants={cardVariants}>
          <div className="stat-icon-wrapper bg-warning-soft text-warning">
            <Clock size={22} />
          </div>
          <div className="stat-text-wrapper">
            <h3>{citizenStats.open}</h3>
            <span>Open Cases</span>
          </div>
        </motion.div>

        <motion.div className="stat-card-modern border-success" variants={cardVariants}>
          <div className="stat-icon-wrapper bg-success-soft text-success">
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-text-wrapper">
            <h3>{citizenStats.resolved}</h3>
            <span>Resolved</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Mobile View Toggle Tabs */}
      <div className="mobile-view-tabs">
        <button
          type="button"
          className={`mobile-view-tab-btn ${activeTab === 'file' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('file')}
        >
          <PlusCircle size={15} style={{ marginRight: '6px' }} />
          File Report
        </button>
        <button
          type="button"
          className={`mobile-view-tab-btn ${activeTab === 'track' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('track')}
        >
          <BarChart2 size={15} style={{ marginRight: '6px' }} />
          Track Status {citizenStats.total > 0 && `(${citizenStats.total})`}
        </button>
      </div>

      {/* Dashboard Work Grid */}
      <div className="dashboard-layout-grid">
        {/* Left Side: Create Complaint */}
        <motion.div
          className={`dashboard-left-panel card-panel-modern ${activeTab === 'file' ? '' : 'mobile-hidden'}`}
          variants={cardVariants}
        >
          <div className="panel-title-header">
            <h3>File a New Complaint</h3>
            <p>Describe the issue and list the exact location to expedite routing.</p>
          </div>
          <ComplaintForm
            complaintForm={complaintForm}
            setComplaintForm={setComplaintForm}
            complaintTypes={complaintTypes}
            handleComplaintImages={handleComplaintImages}
            handleComplaintSubmit={handleFormSubmitWrapped}
          />
        </motion.div>

        {/* Center: List of Complaints */}
        <motion.div
          className={`dashboard-center-panel card-panel-modern ${activeTab === 'track' && mobileTrackView === 'list' ? '' : 'mobile-hidden'}`}
          variants={cardVariants}
        >
          <div className="panel-title-header">
            <h3>Track Filed Reports</h3>
            <p>Select a complaint below to watch progress updates.</p>
          </div>
          <ComplaintList
            complaints={currentCitizenComplaints}
            selectedComplaintId={selectedComplaintId}
            setSelectedComplaintId={handleSelectComplaint}
          />
        </motion.div>

        {/* Right Side: Detailed Timeline */}
        <motion.div
          className={`dashboard-right-panel card-panel-modern ${activeTab === 'track' && mobileTrackView === 'detail' ? '' : 'mobile-hidden'}`}
          variants={cardVariants}
        >
          <ComplaintDetail
            selectedComplaint={selectedComplaint}
            showFullDetails={true}
            onBackToList={() => setMobileTrackView('list')}
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
