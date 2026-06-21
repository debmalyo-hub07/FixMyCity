import React, { useState, useEffect } from 'react';
import { MapPin, Tag, Send, Maximize2, Star, CheckCircle2 } from 'lucide-react';
import Timeline from './Timeline';

export default function ComplaintDetail({
  selectedComplaint,
  showFullDetails = true,
  onBackToList,
  onImageClick,
  handleReviewSubmit,
  session
}) {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Reset active photo index and review form states when selected complaint changes
  useEffect(() => {
    setActivePhotoIndex(0);
    setRating(5);
    setComment('');
    setHoveredStar(0);
    setIsSubmitted(false);
  }, [selectedComplaint?.id]);

  const handleReviewFormSubmit = async (e) => {
    e.preventDefault();
    if (!handleReviewSubmit || !session) return;
    setIsSubmitting(true);
    
    const roleText = `Resident, ${selectedComplaint.location}`;
    const success = await handleReviewSubmit({
      name: session.name,
      role: roleText,
      quote: comment.trim(),
      rating,
      complaintId: selectedComplaint.id
    });
    
    setIsSubmitting(false);
    if (success) {
      setIsSubmitted(true);
    }
  };

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

          {selectedComplaint.status === 'Resolved' && (
            <div className="detail-review-box-new" style={{ marginTop: '2rem', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(15, 118, 110, 0.15)', background: 'var(--panel-glass-solid, rgba(255, 255, 255, 0.96))' }}>
              {selectedComplaint.isReviewed || isSubmitted ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e' }}>
                    <CheckCircle2 size={24} />
                  </div>
                  <h4 style={{ margin: '8px 0 4px', color: 'var(--text-main)', fontSize: '1.1rem' }}>Review Submitted!</h4>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Thank you for reviewing our website. Your feedback helps us improve!</p>
                </div>
              ) : (
                <form onSubmit={handleReviewFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', color: 'var(--text-main)', fontSize: '1.1rem' }}>How was your experience?</h4>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Since your issue has been resolved, please take a moment to review our website.</p>
                  </div>
                  
                  {/* Star Rating Selector */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>Rating</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {[1, 2, 3, 4, 5].map((starNum) => (
                        <button
                          key={starNum}
                          type="button"
                          onClick={() => setRating(starNum)}
                          onMouseEnter={() => setHoveredStar(starNum)}
                          onMouseLeave={() => setHoveredStar(0)}
                          style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', outline: 'none' }}
                        >
                          <Star
                            size={28}
                            fill={starNum <= (hoveredStar || rating) ? 'var(--yellow-accent, #F0E840)' : 'none'}
                            color={starNum <= (hoveredStar || rating) ? 'var(--yellow-accent, #F0E840)' : 'rgba(26,36,56,0.2)'}
                            style={{ transition: 'transform 0.15s ease, fill 0.15s ease' }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment Input */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label htmlFor="review-comment" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>Comment</label>
                    <textarea
                      id="review-comment"
                      rows={3}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Leave a comment about the website..."
                      required
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(15, 118, 110, 0.25)',
                        backgroundColor: '#ffffff',
                        color: 'var(--text-main)',
                        fontSize: '0.9rem',
                        resize: 'vertical',
                        outline: 'none',
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--brand-light)'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(15, 118, 110, 0.25)'}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      alignSelf: 'flex-start',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'linear-gradient(135deg, var(--brand), var(--brand-hover))',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(15, 118, 110, 0.25)',
                      transition: 'transform 0.1s ease, box-shadow 0.1s ease',
                      opacity: isSubmitting ? 0.7 : 1,
                    }}
                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    Submit Review
                  </button>
                </form>
              )}
            </div>
          )}
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
