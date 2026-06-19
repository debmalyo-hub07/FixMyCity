import React, { useState, useEffect } from 'react';
import { MapPin, Tag, ShieldAlert, Maximize2 } from 'lucide-react';
import Timeline from './Timeline';

export default function ComplaintDetail({ selectedComplaint, showFullDetails = true, onBackToList, onImageClick }) {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Reset active photo index when selected complaint changes
  useEffect(() => {
    setActivePhotoIndex(0);
  }, [selectedComplaint?.id]);

  if (!selectedComplaint) {
    return (
      <div className="empty-state-modern">
        <h4>No complaint selected</h4>
        <p>Select a complaint from the list to view its current timeline.</p>
      </div>
    );
  }

  const images = selectedComplaint.images || (selectedComplaint.image ? [selectedComplaint.image] : []);
  const activeImage = images[activePhotoIndex] || selectedComplaint.image;

  return (
    <div className="detail-card-modern">
      {showFullDetails ? (
        <>
          <div className="detail-header-modern">
            {onBackToList && (
              <button type="button" className="mobile-detail-back-btn" onClick={onBackToList}>
                &larr; Back to List
              </button>
            )}
            <div>
              <span className="detail-id-bubble">{selectedComplaint.id}</span>
              <h3 className="detail-main-heading">Complaint Overview</h3>
            </div>
          </div>

          {activeImage && (
            <div className="detail-gallery-container-modern">
              <div 
                className="detail-image-box"
                onClick={() => onImageClick && onImageClick(activeImage)}
                style={{ cursor: onImageClick ? 'pointer' : 'default' }}
                title={onImageClick ? "Click to view maximized" : ""}
              >
                <img
                  className="detail-img-fluid"
                  src={activeImage}
                  alt={selectedComplaint.title}
                />
                {onImageClick && (
                  <div className="image-hover-zoom-overlay">
                    <Maximize2 size={18} color="#ffffff" />
                  </div>
                )}
              </div>

              {images.length > 1 && (
                <div className="detail-gallery-thumbnails-row">
                  {images.map((imgUrl, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`detail-gallery-thumb-btn ${index === activePhotoIndex ? 'is-active' : ''}`}
                      onClick={() => setActivePhotoIndex(index)}
                    >
                      <img src={imgUrl} alt={`Thumbnail ${index + 1}`} className="detail-gallery-thumb-img" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="detail-text-body">
            <h4 className="detail-title">{selectedComplaint.title}</h4>
            <p className="detail-desc">{selectedComplaint.description}</p>

            <div className="detail-tags-row">
              <span className="detail-tag-chip">
                <Tag size={13} style={{ marginRight: '6px', strokeWidth: 2.2 }} />
                {selectedComplaint.type}
              </span>
              <span className="detail-tag-chip">
                <MapPin size={13} style={{ marginRight: '6px', strokeWidth: 2.2 }} />
                {selectedComplaint.location}
              </span>
              <span className="detail-tag-chip">
                <ShieldAlert size={13} style={{ marginRight: '6px', strokeWidth: 2.2 }} />
                {selectedComplaint.forwardedTo ? `Forwarded: ${selectedComplaint.forwardedTo}` : 'Unassigned'}
              </span>
            </div>
          </div>

          <div className="detail-timeline-box">
            <h4 className="section-title-sub">Progress Timeline</h4>
            <Timeline updates={selectedComplaint.updates} />
          </div>
        </>
      ) : (
        <>
          <div className="detail-header-modern">
            {onBackToList && (
              <button type="button" className="mobile-detail-back-btn" onClick={onBackToList}>
                &larr; Back to List
              </button>
            )}
            <div>
              <span className="detail-id-bubble">{selectedComplaint.id}</span>
              <h3 className="detail-main-heading">Complaint Timeline</h3>
            </div>
          </div>
          <div className="detail-timeline-box" style={{ marginTop: '1.5rem' }}>
            <Timeline updates={selectedComplaint.updates} />
          </div>
        </>
      )}
    </div>
  );
}
