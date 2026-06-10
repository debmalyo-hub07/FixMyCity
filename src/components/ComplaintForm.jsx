import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Trash2, Send, Upload } from 'lucide-react';

export default function ComplaintForm({
  complaintForm,
  setComplaintForm,
  complaintTypes,
  handleComplaintImage,
  handleComplaintSubmit,
}) {
  const fileInputRef = useRef(null);

  const removeImage = () => {
    setComplaintForm((current) => ({
      ...current,
      image: '',
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
        <label>Attach Picture Proof</label>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleComplaintImage}
          style={{ display: 'none' }}
        />

        <AnimatePresence mode="wait">
          {!complaintForm.image ? (
            <motion.div
              key="uploader"
              className="file-upload-dragzone"
              onClick={() => fileInputRef.current?.click()}
              whileHover={{ scale: 0.99, borderColor: 'rgba(59, 130, 246, 0.4)' }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Upload size={24} className="uploader-icon" />
              <span>Click to select an image from your device</span>
              <small>JPEG, PNG, or WebP files accepted</small>
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              className="file-upload-preview-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <img
                src={complaintForm.image}
                alt="Complaint preview"
                className="file-preview-img"
              />
              <div className="file-preview-overlay">
                <span className="file-preview-meta">
                  <ImageIcon size={14} style={{ marginRight: '6px' }} />
                  Image ready for upload
                </span>
                <motion.button
                  type="button"
                  onClick={removeImage}
                  className="remove-img-btn"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Trash2 size={16} />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
