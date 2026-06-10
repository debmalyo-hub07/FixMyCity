import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Eye, Send, CheckCircle2 } from 'lucide-react';

const getStatusConfig = (label) => {
  switch (label) {
    case 'Submitted':
      return { icon: FileText, color: 'status-submitted-badge', dotBg: '#3b82f6' };
    case 'In Review':
      return { icon: Eye, color: 'status-in-review-badge', dotBg: '#f59e0b' };
    case 'Forwarded':
      return { icon: Send, color: 'status-forwarded-badge', dotBg: '#0f766e' };
    case 'Resolved':
      return { icon: CheckCircle2, color: 'status-resolved-badge', dotBg: '#16a34a' };
    default:
      return { icon: FileText, color: 'status-submitted-badge', dotBg: '#3b82f6' };
  }
};

export default function Timeline({ updates }) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
      },
    },
  };

  const itemAnim = {
    hidden: { opacity: 0, y: 15 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: 'spring', 
        stiffness: 100, 
        damping: 15 
      } 
    },
  };

  return (
    <motion.div
      className="timeline-container-modern"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <div className="timeline-line-modern">
        <motion.div
          className="timeline-line-progress"
          initial={{ height: 0 }}
          animate={{ height: '100%' }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      {updates.map((update, index) => {
        const config = getStatusConfig(update.label);
        const Icon = config.icon;

        return (
          <motion.div
            key={`${update.at}-${index}`}
            className="timeline-item-modern"
            variants={itemAnim}
          >
            <div className="timeline-dot-container">
              <motion.div
                className="timeline-dot-outer-glow"
                animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: index * 0.4,
                }}
                style={{
                  boxShadow: `0 0 12px ${config.dotBg}60`,
                  borderColor: `${config.dotBg}30`,
                }}
              >
                <div
                  className="timeline-dot-inner-core"
                  style={{ backgroundColor: config.dotBg }}
                />
              </motion.div>
            </div>

            <div className="timeline-card-modern">
              <div className="timeline-card-header">
                <span className={`status-badge-pill ${config.color}`}>
                  <Icon size={13} style={{ marginRight: '5px', strokeWidth: 2.5 }} />
                  {update.label}
                </span>
                <span className="timeline-card-time">{update.at}</span>
              </div>
              <p className="timeline-card-note">{update.note}</p>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
