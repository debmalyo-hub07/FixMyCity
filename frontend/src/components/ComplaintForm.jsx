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
import GoogleMap from './GoogleMap';

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

          {/* Citizen Location Info */}
          <div className="cf-field-new" style={{ marginTop: '20px' }}>
            <label className="cf-label-new">
              Citizen Location Info (Address/Landmark/Ward) *
            </label>
            <input
              required
              type="text"
              className="cf-input-new"
              placeholder="Enter your home address, landmark, or ward"
              value={complaintForm.citizenLocation || ''}
              onChange={(e) =>
                setComplaintForm((current) => ({ ...current, citizenLocation: e.target.value }))
              }
            />
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

          {/* Location */}
          <div className="cf-field-new" style={{ marginTop: '20px' }}>
            <label className="cf-label-new">
              Exact Location (Map) *
            </label>
            <input
              required
              readOnly
              type="text"
              className="cf-input-new"
              placeholder="Coordinates will populate when you pin location on map below..."
              value={complaintForm.location}
              style={{ backgroundColor: 'rgba(26, 36, 56, 0.02)', cursor: 'not-allowed' }}
            />
            <div style={{ marginTop: '10px' }}>
              <GoogleMap
                mode="form"
                latitude={complaintForm.latitude}
                longitude={complaintForm.longitude}
                address={complaintForm.location}
                onChangeLocation={({ latitude, longitude, address }) => {
                  setComplaintForm((current) => ({
                    ...current,
                    latitude,
                    longitude,
                    location: address || current.location
                  }));
                }}
              />
            </div>
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
              padding: '16px 18px',
              borderRadius: '12px',
              background: complaintError.kind === 'mismatch'
                ? 'rgba(239, 68, 68, 0.07)'
                : 'rgba(239, 68, 68, 0.07)',
              border: '1.5px solid rgba(239, 68, 68, 0.35)',
              color: '#b91c1c',
              fontSize: '13px',
              lineHeight: 1.6,
            }}
          >
            {/* Header */}
            <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '14px' }}>
              <span style={{ fontSize: '16px' }}>
                {complaintError.kind === 'nsfw' ? '⛔' : complaintError.kind === 'mismatch' ? '🚫' : '⚠️'}
              </span>
              {complaintError.kind === 'nsfw'
                ? 'Inappropriate image detected'
                : complaintError.kind === 'mismatch'
                ? 'Image does not match selected category'
                : 'Submission failed'}
            </strong>

            {/* Main message */}
            <div style={{ marginBottom: complaintError.kind === 'mismatch' ? '10px' : '0' }}>
              {complaintError.message}
            </div>

            {/* AI suggestion */}
            {complaintError.kind === 'mismatch' && complaintError.suggestion && (
              <div style={{
                marginTop: '8px',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.06)',
                fontSize: '12px',
                fontStyle: 'italic',
              }}>
                💡 {complaintError.suggestion}
              </div>
            )}

            {/* Score breakdown */}
            {complaintError.kind === 'mismatch' && (complaintError.detected || complaintError.declared) && (
              <div style={{
                marginTop: '10px',
                display: 'flex',
                gap: '10px',
                flexWrap: 'wrap',
                fontSize: '11px',
              }}>
                {complaintError.declared && (
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                  }}>
                    Selected: <strong>{complaintError.declared}</strong>
                    {complaintError.declaredConfidence != null && (
                      <span> ({Math.round(complaintError.declaredConfidence * 100)}% confidence)</span>
                    )}
                  </span>
                )}
                {complaintError.detected && complaintError.detected !== complaintError.declared && (
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    color: '#1d4ed8',
                  }}>
                    AI detected: <strong>{complaintError.detected}</strong>
                    {complaintError.confidence != null && (
                      <span> ({Math.round(complaintError.confidence * 100)}%)</span>
                    )}
                  </span>
                )}
              </div>
            )}

            {/* Guidance */}
            {complaintError.kind === 'mismatch' && (
              <div style={{
                marginTop: '12px',
                fontSize: '12px',
                color: '#7f1d1d',
                opacity: 0.8,
              }}>
                Please upload a clear photo of the actual issue, or select a different category.
              </div>
            )}

            <button
              type="button"
              onClick={() => setComplaintError(null)}
              style={{
                marginTop: '12px',
                padding: '5px 12px',
                fontSize: '11px',
                borderRadius: '6px',
                background: 'transparent',
                border: '1px solid rgba(185, 28, 28, 0.4)',
                color: '#b91c1c',
                cursor: 'pointer',
              }}
            >
              Dismiss & try again
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
