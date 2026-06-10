import React from 'react';
import { MapPin, Tag, ShieldAlert } from 'lucide-react';
import Timeline from './Timeline';

export default function ComplaintDetail({ selectedComplaint, showFullDetails = true, onBackToList }) {
  if (!selectedComplaint) {
    return (
      <div className="empty-state-modern">
        <h4>No complaint selected</h4>
        <p>Select a complaint from the list to view its current timeline.</p>
      </div>
    );
  }

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

          {selectedComplaint.image && (
            <div className="detail-image-box">
              <img
                className="detail-img-fluid"
                src={selectedComplaint.image}
                alt={selectedComplaint.title}
              />
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
                Forwarded: {selectedComplaint.forwardedTo}
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
