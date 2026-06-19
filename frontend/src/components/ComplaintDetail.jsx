import React, { useState, useEffect } from 'react';
import { MapPin, Tag, Send, Maximize2 } from 'lucide-react';
import Timeline from './Timeline';

export default function ComplaintDetail({ selectedComplaint, showFullDetails = true, onBackToList, onImageClick }) {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Reset active photo index when selected complaint changes
  useEffect(() => {
    setActivePhotoIndex(0);
  }, [selectedComplaint?.id]);

  if (!selectedComplaint) {
    return (
      <div className="empty-state-modern-new">
        <h4>No complaint selected</h4>
        <p>Select a complaint from the list to view its current timeline.</p>
      </div>
    );
  }

  const images = selectedComplaint.images || (selectedComplaint.image ? [selectedComplaint.image] : []);
  const activeImage = images[activePhotoIndex] || selectedComplaint.image;

  return (
    <div className="detail-card-modern-new">
      {showFullDetails ? (
        <>
          <div className="detail-header-modern-new">
            {onBackToList && (
              <button type="button" className="mobile-detail-back-btn-new" onClick={onBackToList}>
                &larr; Back to List
              </button>
            )}
            <div className="detail-header-title-wrapper-new">
              <span className="detail-id-bubble-new">{selectedComplaint.id}</span>
              <h3 className="detail-main-heading-new">Complaint Overview</h3>
            </div>
          </div>

          {activeImage && (
            <div className="detail-gallery-container-modern-new">
              <div 
                className="detail-image-box-new"
                onClick={() => onImageClick && onImageClick(activeImage)}
                style={{ cursor: onImageClick ? 'pointer' : 'default' }}
                title={onImageClick ? "Click to view maximized" : ""}
              >
                <img
                  className="detail-img-fluid-new"
                  src={activeImage}
                  alt={selectedComplaint.title}
                />
                {onImageClick && (
                  <div className="image-hover-zoom-overlay-new">
                    <Maximize2 size={18} color="#ffffff" />
                  </div>
                )}
              </div>

              {images.length > 1 && (
                <div className="detail-gallery-thumbnails-row-new">
                  {images.map((imgUrl, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`detail-gallery-thumb-btn-new ${index === activePhotoIndex ? 'is-active' : ''}`}
                      onClick={() => setActivePhotoIndex(index)}
                    >
                      <img src={imgUrl} alt={`Thumbnail ${index + 1}`} className="detail-gallery-thumb-img-new" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="detail-text-body-new">
            <h4 className="detail-title-new">{selectedComplaint.title}</h4>
            <p className="detail-desc-new">{selectedComplaint.description}</p>

            <div className="detail-tags-row-new">
              <span className="detail-tag-chip-new">
                <Tag size={13} style={{ marginRight: '6px' }} />
                {selectedComplaint.type}
              </span>
              <span className="detail-tag-chip-new">
                <MapPin size={13} style={{ marginRight: '6px' }} />
                {selectedComplaint.location}
              </span>
              <span className="detail-tag-chip-new">
                <Send size={13} style={{ marginRight: '6px' }} />
                {selectedComplaint.forwardedTo ? `Forwarded: ${selectedComplaint.forwardedTo}` : 'Unassigned'}
              </span>
            </div>
          </div>

          <div className="detail-timeline-box-new">
            <h4 className="section-title-sub-new">Progress Timeline</h4>
            <Timeline updates={selectedComplaint.updates} />
          </div>
        </>
      ) : (
        <>
          <div className="detail-header-modern-new">
            {onBackToList && (
              <button type="button" className="mobile-detail-back-btn-new" onClick={onBackToList}>
                &larr; Back to List
              </button>
            )}
            <div className="detail-header-title-wrapper-new">
              <span className="detail-id-bubble-new">{selectedComplaint.id}</span>
              <h3 className="detail-main-heading-new">Complaint Timeline</h3>
            </div>
          </div>
          <div className="detail-timeline-box-new" style={{ marginTop: '1.5rem' }}>
            <Timeline updates={selectedComplaint.updates} />
          </div>
        </>
      )}
    </div>
  );
}
