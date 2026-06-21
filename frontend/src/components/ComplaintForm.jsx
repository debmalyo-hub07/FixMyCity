import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2,
  ImagePlus,
  Lightbulb,
  MapPin,
  Droplets,
  MoreHorizontal,
  ChevronRight,
} from 'lucide-react';

const TYPE_META = {
  'Broken street light problem': { icon: Lightbulb, hint: 'Flickering, non-functioning, dark street lights' },
  Potholes: { icon: MapPin, hint: 'Sunken patches, road craters' },
  'Drainage problem': { icon: Droplets, hint: 'Clogged overflow, drainage water' },
  Others: { icon: MoreHorizontal, hint: 'Plumbing, gas etc related' },
};

const MAX_DESC = 400;

export default function ComplaintForm({
  complaintForm,
  setComplaintForm,
  complaintTypes,
  handleComplaintImages,
  handleComplaintSubmit,
  complaintError,
  setComplaintError,
}) {
  const fileInputRef = useRef(null);

  const removeImage = (indexToRemove) => {
    setComplaintForm((current) => ({
      ...current,
      images: (current.images || []).filter((_, index) => index !== indexToRemove),
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const descLen = (complaintForm.description || '').length;

  return (
    <form className="cf-form-new" onSubmit={handleComplaintSubmit}>
      <div className="cf-grid-new">
        {/* Left Column */}
        <div className="cf-col-new">
          {/* Title */}
          <div className="cf-field-new">
            <label className="cf-label-new">
              Problem Title *
            </label>
            <input
              required
              type="text"
              className="cf-input-new"
              placeholder="e.g. Large pothole near market gate"
              value={complaintForm.title}
              onChange={(e) =>
                setComplaintForm((current) => ({ ...current, title: e.target.value }))
              }
            />
          </div>

          {/* Category Visual Grid */}
          <div className="cf-field-new" style={{ marginTop: '20px' }}>
            <label className="cf-label-new">
              Category
            </label>
            <div className="cf-category-picker-grid">
              {complaintTypes.map((type) => {
                const meta = TYPE_META[type] || { icon: MoreHorizontal, hint: '' };
                const Icon = meta.icon;
                const active = complaintForm.type === type;
                return (
                  <button
                    key={type}
                    type="button"
                    className={`cf-category-picker-card ${active ? 'active' : ''}`}
                    onClick={() =>
                      setComplaintForm((current) => ({ ...current, type }))
                    }
                  >
                    <span className="cf-cat-card-icon-wrapper">
                      <Icon size={18} />
                    </span>
                    <span className="cf-cat-card-text">
                      <strong>{type}</strong>
                      <small>{meta.hint}</small>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location */}
          <div className="cf-field-new" style={{ marginTop: '20px' }}>
            <label className="cf-label-new">
              Exact Location
            </label>
            <input
              required
              type="text"
              className="cf-input-new"
              placeholder="Street, landmark, ward, area"
              value={complaintForm.location}
              onChange={(e) =>
                setComplaintForm((current) => ({ ...current, location: e.target.value }))
              }
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="cf-col-new">
          {/* Description */}
          <div className="cf-field-new">
            <label className="cf-label-new">
              Detailed Description *
            </label>
            <div style={{ position: 'relative' }}>
              <textarea
                required
                rows="5"
                maxLength={MAX_DESC}
                className="cf-textarea-new"
                placeholder="Explain the issue, how long it has been there, and any safety hazards."
                value={complaintForm.description}
                onChange={(e) =>
                  setComplaintForm((current) => ({ ...current, description: e.target.value }))
                }
              />
              <span className="cf-desc-char-limit font-mono">
                {descLen}/{MAX_DESC}
              </span>
            </div>
          </div>

          {/* Upload Proof */}
          <div className="cf-field-new" style={{ marginTop: '20px' }}>
            <label className="cf-label-new">
              Attach Picture Proof
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              ref={fileInputRef}
              onChange={handleComplaintImages}
              style={{ display: 'none' }}
            />

            <button
              type="button"
              className="cf-upload-dropzone-new"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="cf-upload-icon-wrapper">
                <ImagePlus size={22} color="#8a8a8a" />
              </div>
              <strong>Tap to upload photos</strong>
              <small>ONE PHOTO MAX - CITATION-PROOF, FASTER ACTION</small>
            </button>

            {/* Uploaded Thumbnails */}
            <AnimatePresence>
              {complaintForm.images && complaintForm.images.length > 0 && (
                <motion.div
                  className="cf-thumbnails-row-new"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {complaintForm.images.map((imgUrl, index) => (
                    <motion.div
                      key={`${index}-${imgUrl.slice(-20)}`}
                      className="cf-thumbnail-box-new"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 120, damping: 15 }}
                    >
                      <img src={imgUrl} alt={`Preview ${index + 1}`} />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="cf-thumbnail-delete-btn"
                        title="Delete photo"
                      >
                        <Trash2 size={12} />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {complaintError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
              marginTop: '20px',
              padding: '14px 16px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#b91c1c',
              fontSize: '13px',
              lineHeight: 1.5,
            }}
          >
            <strong style={{ display: 'block', marginBottom: '6px', fontSize: '14px' }}>
              {complaintError.kind === 'mismatch'
                ? 'Image does not match selected category'
                : 'Submission failed'}
            </strong>
            <div>{complaintError.message}</div>
            {complaintError.kind === 'mismatch' && (
              <div style={{ marginTop: '8px', fontSize: '12px', opacity: 0.85 }}>
                Detected: <strong>{complaintError.detected}</strong>
                {' · '}Declared: <strong>{complaintError.declared}</strong>
                {' · '}Confidence: <strong>{Math.round((complaintError.confidence || 0) * 100)}%</strong>
              </div>
            )}
            <button
              type="button"
              onClick={() => setComplaintError(null)}
              style={{
                marginTop: '10px',
                padding: '4px 10px',
                fontSize: '11px',
                borderRadius: '6px',
                background: 'transparent',
                border: '1px solid rgba(185, 28, 28, 0.4)',
                color: '#b91c1c',
                cursor: 'pointer',
              }}
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Button */}
      <button type="submit" className="cf-submit-btn-new">
        Submit Complaint
        <ChevronRight size={16} style={{ marginLeft: '6px' }} />
      </button>
    </form>
  );
}
