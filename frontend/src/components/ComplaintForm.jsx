import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Send, Upload } from 'lucide-react';

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

  return (
    <form className="complaint-form-modern" onSubmit={handleComplaintSubmit}>
      <div className="form-two-col">
        <div className="input-group">
          <label>Problem Title</label>
          <input
            required
            type="text"
            placeholder="e.g. Large pothole near market gate"
            value={complaintForm.title}
            onChange={(e) =>
              setComplaintForm((current) => ({ ...current, title: e.target.value }))
            }
          />
        </div>

        <div className="input-group">
          <label>Category</label>
          <select
            value={complaintForm.type}
            onChange={(e) =>
              setComplaintForm((current) => ({ ...current, type: e.target.value }))
            }
          >
            {complaintTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="input-group">
        <label>Exact Location</label>
        <input
          required
          type="text"
          placeholder="Street, landmark, ward, area"
          value={complaintForm.location}
          onChange={(e) =>
            setComplaintForm((current) => ({ ...current, location: e.target.value }))
          }
        />
      </div>

      <div className="input-group">
        <label>Detailed Description</label>
        <textarea
          required
          rows="3"
          placeholder="Explain the issue, how long it has been there, and any safety hazards."
          value={complaintForm.description}
          onChange={(e) =>
            setComplaintForm((current) => ({ ...current, description: e.target.value }))
          }
        />
      </div>

      <div className="input-group">
        <label>Attach Picture Proof (Multiple Allowed)</label>
        <input
          type="file"
          accept="image/*"
          multiple
          ref={fileInputRef}
          onChange={handleComplaintImages}
          style={{ display: 'none' }}
        />

        <div className="file-upload-wrapper-multi">
          <motion.div
            className="file-upload-dragzone-compact"
            onClick={() => fileInputRef.current?.click()}
            whileHover={{ scale: 0.99, borderColor: 'rgba(20, 184, 166, 0.4)' }}
            whileTap={{ scale: 0.98 }}
          >
            <Upload size={20} className="uploader-icon" />
            <span>Select Photos</span>
            <small>Click to add one or more files</small>
          </motion.div>

          <AnimatePresence>
            {complaintForm.images && complaintForm.images.length > 0 && (
              <div className="file-previews-grid-modern">
                {complaintForm.images.map((imgUrl, index) => (
                  <motion.div
                    key={`${index}-${imgUrl.slice(-20)}`}
                    className="file-preview-thumb-card"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: 'spring', stiffness: 120, damping: 15 }}
                  >
                    <img
                      src={imgUrl}
                      alt={`Preview ${index + 1}`}
                      className="file-preview-thumb-img"
                    />
                    <motion.button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="remove-thumb-btn"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title="Delete Photo"
                    >
                      <Trash2 size={12} />
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <motion.button
        type="submit"
        className="primary-btn submit-complaint-btn"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Send size={15} style={{ marginRight: '8px' }} />
        Submit Complaint
      </motion.button>
    </form>
  );
}
