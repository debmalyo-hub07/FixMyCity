import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2,
  Send,
  ImagePlus,
  Type,
  MapPin,
  AlignLeft,
  Construction,
  CircleDashed,
  Droplets,
  CircleHelp,
} from 'lucide-react';

const TYPE_META = {
  'Road problem': { icon: Construction, hint: 'Cracks, broken stretches, debris' },
  Potholes: { icon: CircleDashed, hint: 'Sunken patches, road craters' },
  'Drainage problem': { icon: Droplets, hint: 'Clogged, overflow, stagnant water' },
  Others: { icon: CircleHelp, hint: 'Anything else civic-related' },
};

const MAX_DESC = 400;

export default function ComplaintForm({
  complaintForm,
  setComplaintForm,
  complaintTypes,
  handleComplaintImages,
  handleComplaintSubmit,
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
  
  const formGridVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.12 }
    }
  };

  const formColVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { type: 'spring', stiffness: 100, damping: 16 } 
    }
  };

  const categoryContainerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const categoryItemVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.96 },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: 'spring', stiffness: 120, damping: 15 } 
    }
  };

  return (
    <motion.form 
      className="cf-form" 
      onSubmit={handleComplaintSubmit}
      variants={formGridVariants}
      initial="hidden"
      animate="show"
    >
      <div className="cf-form-grid">
        <motion.div className="cf-form-col" variants={formColVariants}>
          {/* Title */}
          <div className="cf-field">
            <label className="cf-label" htmlFor="cf-title">
              <Type size={14} /> Problem Title
            </label>
            <input
              id="cf-title"
              required
              type="text"
              className="cf-input"
              placeholder="e.g. Large pothole near market gate"
              value={complaintForm.title}
              onChange={(e) =>
                setComplaintForm((current) => ({ ...current, title: e.target.value }))
              }
            />
          </div>

          {/* Category as visual picker */}
          <div className="cf-field" style={{ marginTop: '1.25rem' }}>
            <label className="cf-label">
              <Construction size={14} /> Category
            </label>
            <motion.div 
              className="cf-category-grid" 
              role="radiogroup" 
              aria-label="Complaint category"
              variants={categoryContainerVariants}
            >
              {complaintTypes.map((type) => {
                const meta = TYPE_META[type] || { icon: CircleHelp, hint: '' };
                const Icon = meta.icon;
                const active = complaintForm.type === type;
                return (
                  <motion.button
                    key={type}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    className={`cf-category-card ${active ? 'is-active' : ''}`}
                    onClick={() =>
                      setComplaintForm((current) => ({ ...current, type }))
                    }
                    variants={categoryItemVariants}
                    whileHover={{ scale: 1.02, y: -3 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <span className="cf-category-icon">
                      <Icon size={18} />
                    </span>
                    <span className="cf-category-text">
                      <strong>{type}</strong>
                      <small>{meta.hint}</small>
                    </span>
                  </motion.button>
                );
              })}
            </motion.div>
          </div>

          {/* Location */}
          <div className="cf-field" style={{ marginTop: '1.25rem' }}>
            <label className="cf-label" htmlFor="cf-location">
              <MapPin size={14} /> Exact Location
            </label>
            <input
              id="cf-location"
              required
              type="text"
              className="cf-input"
              placeholder="Street, landmark, ward, area"
              value={complaintForm.location}
              onChange={(e) =>
                setComplaintForm((current) => ({ ...current, location: e.target.value }))
              }
            />
          </div>
        </motion.div>

        <motion.div className="cf-form-col" variants={formColVariants}>
          {/* Description */}
          <div className="cf-field">
            <label className="cf-label" htmlFor="cf-desc">
              <AlignLeft size={14} /> Detailed Description
            </label>
            <textarea
              id="cf-desc"
              required
              rows="4"
              maxLength={MAX_DESC}
              className="cf-input cf-textarea"
              placeholder="Explain the issue, how long it has been there, and any safety hazards."
              value={complaintForm.description}
              onChange={(e) =>
                setComplaintForm((current) => ({ ...current, description: e.target.value }))
              }
              style={{ minHeight: '136px' }}
            />
            <span className={`cf-char-count ${descLen > MAX_DESC * 0.9 ? 'is-warn' : ''}`}>
              {descLen}/{MAX_DESC}
            </span>
          </div>

          {/* Image upload */}
          <div className="cf-field" style={{ marginTop: '1.25rem' }}>
            <label className="cf-label">
              <ImagePlus size={14} /> Attach Picture Proof
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              ref={fileInputRef}
              onChange={handleComplaintImages}
              style={{ display: 'none' }}
            />

            <motion.button
              type="button"
              className="cf-dropzone"
              onClick={() => fileInputRef.current?.click()}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="cf-dropzone-icon">
                <ImagePlus size={22} />
              </span>
              <span className="cf-dropzone-text">
                <strong>Tap to upload photos</strong>
                <small>One or more files · clearer proof, faster action</small>
              </span>
            </motion.button>

            <AnimatePresence>
              {complaintForm.images && complaintForm.images.length > 0 && (
                <motion.div
                  className="cf-thumb-grid"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ marginTop: '0.75rem' }}
                >
                  {complaintForm.images.map((imgUrl, index) => (
                    <motion.div
                      key={`${index}-${imgUrl.slice(-20)}`}
                      className="cf-thumb"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 120, damping: 15 }}
                    >
                      <img src={imgUrl} alt={`Preview ${index + 1}`} className="cf-thumb-img" />
                      <motion.button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="cf-thumb-remove"
                        whileHover={{ scale: 1.12 }}
                        whileTap={{ scale: 0.9 }}
                        title="Delete photo"
                      >
                        <Trash2 size={12} />
                      </motion.button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            type="submit"
            className="cf-submit"
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.98 }}
            style={{ marginTop: '1.75rem' }}
          >
            <Send size={16} />
            Submit Complaint
          </motion.button>
        </motion.div>
      </div>
    </motion.form>
  );
}
