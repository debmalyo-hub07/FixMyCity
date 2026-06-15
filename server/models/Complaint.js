const mongoose = require('mongoose');

const UpdateSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
  },
  note: {
    type: String,
    required: true,
  },
  at: {
    type: String,
    required: true,
  },
}, { _id: false });

const ComplaintSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  citizenName: {
    type: String,
    required: true,
  },
  citizenPhone: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Submitted', 'In Review', 'Forwarded', 'Resolved'],
    default: 'Submitted',
  },
  forwardedTo: {
    type: String,
    default: '',
  },
  image: {
    type: String,
    default: '',
  },
  images: {
    type: [String],
    default: [],
  },
  updates: {
    type: [UpdateSchema],
    default: [],
  },
  createdAt: {
    type: String,
    required: true,
  },
  updatedAt: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('Complaint', ComplaintSchema);
