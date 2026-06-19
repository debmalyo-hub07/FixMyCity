const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const tf = require('@tensorflow/tfjs');
const mobilenet = require('@tensorflow-models/mobilenet');
const jpeg = require('jpeg-js');
require('dotenv').config();

const User = require('./models/User');
const Admin = require('./models/Admin');
const Complaint = require('./models/Complaint');

const app = express();
const PORT = process.env.PORT || 5000;

// --- MACHINE LEARNING IMAGE VALIDATION ---
let net = null;

// Load MobileNet on startup
async function loadModel() {
  try {
    console.log('Loading MobileNet ML model...');
    net = await mobilenet.load();
    console.log('MobileNet ML model loaded successfully.');
  } catch (error) {
    console.error('Failed to load MobileNet model:', error);
  }
}
loadModel();

// Decode base64 JPEG into a 3D pixel tensor
function imageToTensor(base64Str) {
  const base64Data = base64Str.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, 'base64');
  
  // Decode JPEG
  const rawImageData = jpeg.decode(buffer, { useTArray: true });
  
  // Convert RGBA to RGB tensor
  const numPixels = rawImageData.width * rawImageData.height;
  const rgbValues = new Int32Array(numPixels * 3);
  for (let i = 0; i < numPixels; i++) {
    rgbValues[i * 3] = rawImageData.data[i * 4];     // R
    rgbValues[i * 3 + 1] = rawImageData.data[i * 4 + 1]; // G
    rgbValues[i * 3 + 2] = rawImageData.data[i * 4 + 2]; // B
  }
  
  const shape = [rawImageData.height, rawImageData.width, 3];
  return tf.tensor3d(rgbValues, shape, 'int32');
}

// Category validation logic
function verifyImageCategory(predictions, category) {
  const labels = predictions.map(p => p.className.toLowerCase());
  console.log(`ML Predictions for '${category}':`, predictions);

  if (category === 'Potholes') {
    return labels.some(l => 
      l.includes('pothole') || 
      l.includes('crater') || 
      l.includes('manhole') || 
      l.includes('crack') || 
      l.includes('hole') || 
      l.includes('trench') || 
      l.includes('pit') ||
      l.includes('asphalt') ||
      l.includes('cobblestone')
    );
  }

  if (category === 'Road problem') {
    return labels.some(l => 
      l.includes('road') || 
      l.includes('street') || 
      l.includes('highway') || 
      l.includes('asphalt') || 
      l.includes('cobblestone') || 
      l.includes('curb') || 
      l.includes('barrier') || 
      l.includes('pothole') ||
      l.includes('crater') ||
      l.includes('manhole')
    );
  }

  if (category === 'Drainage problem') {
    return labels.some(l => 
      l.includes('sewer') || 
      l.includes('gutter') || 
      l.includes('drain') || 
      l.includes('water') || 
      l.includes('conduit') || 
      l.includes('pipe') || 
      l.includes('puddle') ||
      l.includes('sink')
    );
  }

  return true;
}

// --- CUSTOM ML MODEL (POTHOLES VS NO_POTHOLES) ---
let customModel = null;

// Load custom model on startup
async function loadCustomModel() {
  try {
    const modelPath = 'file://' + require('path').join(__dirname, 'pothole_model_tfjs', 'model.json');
    console.log(`Loading custom pothole model from: ${modelPath}`);
    customModel = await tf.loadLayersModel(modelPath);
    console.log('Custom pothole model loaded successfully.');
  } catch (error) {
    console.error('Failed to load custom model (make sure model files are in server/pothole_model_tfjs):', error.message);
  }
}
loadCustomModel();

// Preprocess base64 image for the custom 32x32 model
function preprocessForCustomModel(base64Str) {
  // 1. Decode base64 JPEG to RGB 3D tensor
  const tensor = imageToTensor(base64Str); 
  
  // 2. Resize to 32x32 pixels (bilinear interpolation)
  const resized = tf.image.resizeBilinear(tensor, [32, 32]);
  
  // 3. Rescale pixel values from [0, 255] to [0, 1] (matching rescaling layer)
  const normalized = tf.div(resized, 255.0);
  
  // 4. Add batch dimension (output shape: [1, 32, 32, 3])
  const batched = tf.expandDims(normalized, 0);
  
  // Dispose intermediate tensors to prevent memory leaks
  tf.dispose([tensor, resized, normalized]);
  
  return batched;
}

// Middleware
app.use(cors());
// Set body size limit higher because of base64 images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Date Formatter Helper (Asia/Kolkata YYYY-MM-DD HH:mm)
const getFormattedDate = () => {
  try {
    const options = {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };
    const formatter = new Intl.DateTimeFormat('en-CA', options);
    // en-CA formats to YYYY-MM-DD, HH:mm
    return formatter.format(new Date()).replace(',', '');
  } catch (e) {
    return new Date().toISOString().replace('T', ' ').substring(0, 16);
  }
};

// Connect to MongoDB and seed database if empty
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/FixMyCity')
  .then(async () => {
    console.log('Connected to MongoDB database successfully.');
    await seedDatabase();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

// Seed Initial Data function
async function seedDatabase() {
  try {
    // 1. Seed Admin if empty
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      console.log('Seeding initial admin...');
      const adminPasswordHash = await bcrypt.hash('admin123', 10);
      const defaultAdmin = new Admin({
        name: 'City Admin',
        username: 'admin@fixmycity',
        password: adminPasswordHash,
        role: 'admin'
      });
      await defaultAdmin.save();
      console.log('Admin seeded successfully.');
    }

    // 2. Seed Users (Citizens) if empty
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Seeding initial citizens...');
      const citizenPasswordHash = await bcrypt.hash('citizen123', 10);

      const initialUsers = [
        {
          name: 'Aarav Sen',
          phone: '9876543210',
          aadhar: '123412341234',
          password: citizenPasswordHash,
          role: 'citizen'
        },
        {
          name: 'Diya Kapoor',
          phone: '9123456780',
          aadhar: '987698769876',
          password: citizenPasswordHash,
          role: 'citizen'
        }
      ];

      await User.insertMany(initialUsers);
      console.log('Citizens seeded successfully.');
    }

    // 2. Seed Complaints if empty
    const complaintCount = await Complaint.countDocuments();
    if (complaintCount === 0) {
      console.log('Seeding initial complaints...');
      const initialComplaints = [
        {
          id: 'CMP-2401',
          citizenName: 'Aarav Sen',
          citizenPhone: '9876543210',
          title: 'Large potholes near market road',
          type: 'Potholes',
          location: 'MG Road, near City Market Gate 2',
          description: 'Two deep potholes are causing traffic jams and bike skids during evening hours.',
          status: 'In Review',
          forwardedTo: 'Road Maintenance Cell',
          updatedAt: '2026-06-08 10:30',
          createdAt: '2026-06-07 18:45',
          image: 'https://images.unsplash.com/photo-1518391846015-55a9cc003b25?auto=format&fit=crop&w=900&q=80',
          images: [
            'https://images.unsplash.com/photo-1518391846015-55a9cc003b25?auto=format&fit=crop&w=900&q=80'
          ],
          updates: [
            { label: 'Submitted', note: 'Complaint registered by citizen.', at: '2026-06-07 18:45' },
            { label: 'In Review', note: 'Area inspection requested by admin.', at: '2026-06-08 10:30' }
          ]
        },
        {
          id: 'CMP-2402',
          citizenName: 'Diya Kapoor',
          citizenPhone: '9123456780',
          title: 'Overflowing roadside drain',
          type: 'Drainage problem',
          location: 'Lake View Colony, Block B',
          description: 'Drain water is overflowing onto the road and creating a strong smell near the school entrance.',
          status: 'Forwarded',
          forwardedTo: 'Drainage and Sanitation Department',
          updatedAt: '2026-06-08 09:10',
          createdAt: '2026-06-06 14:20',
          image: 'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&w=900&q=80',
          images: [
            'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&w=900&q=80'
          ],
          updates: [
            { label: 'Submitted', note: 'Complaint registered by citizen.', at: '2026-06-06 14:20' },
            { label: 'In Review', note: 'Ward office reviewed the complaint.', at: '2026-06-07 11:00' },
            { label: 'Forwarded', note: 'Issue forwarded to Drainage and Sanitation Department.', at: '2026-06-08 09:10' }
          ]
        }
      ];

      await Complaint.insertMany(initialComplaints);
      console.log('Complaints seeded successfully.');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// --- API ROUTES ---

// 1. Register Citizen
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, phone, aadhar, password } = req.body;

    if (!name || !phone || !aadhar || !password) {
      return res.status(400).json({ message: 'All registration fields are required.' });
    }

    // Check if phone already exists
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({ message: 'Mobile number already registered.' });
    }

    // Check if aadhar already exists
    const existingAadhar = await User.findOne({ aadhar });
    if (existingAadhar) {
      return res.status(400).json({ message: 'Aadhar number already registered.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      phone,
      aadhar,
      password: hashedPassword,
      role: 'citizen'
    });

    await newUser.save();

    // Respond with user details (excluding password)
    res.status(201).json({
      message: 'Citizen registered successfully.',
      user: {
        name: newUser.name,
        phone: newUser.phone,
        aadhar: newUser.aadhar,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error during registration.' });
  }
});

// 2. Login (Citizen or Admin)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { password } = req.body;
    const identifier = req.body.identifier || req.body.phone;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Mobile number/ID and password are required.' });
    }

    // Find user: check Admin collection first, then fall back to User collection (citizens)
    let user = await Admin.findOne({ username: identifier });
    if (!user) {
      user = await User.findOne({ phone: identifier });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect password' });
    }

    res.status(200).json({
      message: 'Logged in successfully.',
      user: {
        name: user.name,
        phone: user.phone || '',
        username: user.username || '',
        aadhar: user.aadhar || '',
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error during login.' });
  }
});

// 3. Get All Complaints
app.get('/api/complaints', async (req, res) => {
  try {
    // Sort complaints so newest/recently updated are first
    const complaints = await Complaint.find().sort({ updatedAt: -1 });
    res.status(200).json(complaints);
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({ message: 'Failed to retrieve complaints.' });
  }
});

// 4. Create Complaint
app.post('/api/complaints', async (req, res) => {
  try {
    const { citizenName, citizenPhone, title, type, location, description, images, image } = req.body;

    if (!citizenName || !citizenPhone || !title || !type || !location || !description) {
      return res.status(400).json({ message: 'Required fields are missing.' });
    }

    // Machine Learning Image Validation
    // Advisory-only verdict persisted on the complaint; never blocks submission.
    let imageCheck = {
      model: 'none',
      matched: null,
      score: null,
      note: 'No automated image check for this category.',
      at: getFormattedDate(),
    };

    if (['Potholes', 'Road problem', 'Drainage problem'].includes(type)) {
      const activeImage = image || (images && images[0]);
      if (!activeImage) {
        return res.status(400).json({ message: `A photo proof is required for category '${type}'.` });
      }

      if (activeImage.startsWith('data:image/')) {
        if (type === 'Potholes') {
          // Use Custom CNN Model (Potholes vs No Potholes)
          if (!customModel) {
            console.warn('Custom ML pothole model is not yet loaded on server, bypassing validation.');
            imageCheck = {
              model: 'none',
              matched: null,
              score: null,
              note: 'Pothole model unavailable — not checked.',
              at: getFormattedDate(),
            };
          } else {
            try {
              const inputTensor = preprocessForCustomModel(activeImage);
              const prediction = customModel.predict(inputTensor);
              const predictionData = prediction.dataSync(); // [potholes_prob, no_potholes_prob]

              // Clean up tensors
              tf.dispose([inputTensor, prediction]);

              console.log(`Custom ML predictions - Potholes: ${predictionData[0]}, No Potholes: ${predictionData[1]}`);

              const potholeProb = predictionData[0];
              const matched = potholeProb >= 0.5;
              imageCheck = {
                model: 'custom-cnn',
                matched,
                score: potholeProb,
                note: matched
                  ? `Image matches pothole category (confidence ${potholeProb.toFixed(2)}).`
                  : `Image may not show a pothole (confidence ${potholeProb.toFixed(2)}).`,
                at: getFormattedDate(),
              };

              // Advisory only: log low-confidence result but never block the submission.
              if (predictionData[0] < 0.5) {
                console.warn(`Advisory: uploaded image has low pothole confidence (${predictionData[0]}). Allowing submission anyway.`);
              }
            } catch (mlError) {
              console.error('Custom ML classification error:', mlError);
              // In case of error, log but proceed to avoid hard blocking
            }
          }
        } else {
          // Use general MobileNet model for other categories
          if (!net) {
            console.warn('ML MobileNet model is not yet loaded on server, bypassing validation.');
            imageCheck = {
              model: 'none',
              matched: null,
              score: null,
              note: 'MobileNet unavailable — not checked.',
              at: getFormattedDate(),
            };
          } else {
            try {
              const tensor = imageToTensor(activeImage);
              const predictions = await net.classify(tensor);
              tf.dispose(tensor); // Clean up memory to prevent leaks

              const isValid = verifyImageCategory(predictions, type);
              imageCheck = {
                model: 'mobilenet',
                matched: isValid,
                score: null,
                note: isValid
                  ? `Image labels match category '${type}'.`
                  : `Image labels did not match category '${type}'.`,
                at: getFormattedDate(),
              };
              if (!isValid) {
                console.warn(`Advisory: uploaded image labels did not match category '${type}'. Allowing submission anyway.`);
              }
            } catch (mlError) {
              console.error('ML Image classification error:', mlError);
              // In case of error, log but proceed to avoid hard blocking
            }
          }
        }
      } else {
        // Seed/URL image — no automated check possible.
        imageCheck = {
          model: 'none',
          matched: null,
          score: null,
          note: 'Image not checked (URL or seed image).',
          at: getFormattedDate(),
        };
      }
    }

    // Generate custom CMP ID (sequential-like based on total records)
    const count = await Complaint.countDocuments();
    let serial = 2401 + count;
    let complaintId = `CMP-${serial}`;
    
    // Ensure uniqueness
    let exists = await Complaint.findOne({ id: complaintId });
    while (exists) {
      serial++;
      complaintId = `CMP-${serial}`;
      exists = await Complaint.findOne({ id: complaintId });
    }

    const timestamp = getFormattedDate();

    const newComplaint = new Complaint({
      id: complaintId,
      citizenName,
      citizenPhone,
      title,
      type,
      location,
      description,
      status: 'Submitted',
      forwardedTo: '',
      image: image || '',
      images: images || [],
      updates: [
        {
          label: 'Submitted',
          note: 'Complaint registered by citizen.',
          at: timestamp
        }
      ],
      imageCheck,
      createdAt: timestamp,
      updatedAt: timestamp
    });

    await newComplaint.save();
    res.status(201).json(newComplaint);

  } catch (error) {
    console.error('Create complaint error:', error);
    res.status(500).json({ message: 'Failed to submit complaint.' });
  }
});

// 5. Update Complaint Status (Admin workflow)
app.patch('/api/complaints/:id/status', async (req, res) => {
  try {
    const complaintId = req.params.id;
    const { status, forwardedTo } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status field is required.' });
    }

    const complaint = await Complaint.findOne({ id: complaintId });
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    const timestamp = getFormattedDate();
    let note = '';

    switch (status) {
      case 'In Review':
        note = 'Area inspection requested by admin.';
        break;
      case 'Forwarded':
        note = `Issue forwarded to ${forwardedTo || 'respective department'}.`;
        break;
      case 'Resolved':
        note = 'Complaint resolved successfully.';
        break;
      default:
        note = `Status updated to ${status}.`;
    }

    // Update fields
    complaint.status = status;
    // Only overwrite the assigned authority when a non-empty value is sent.
    // Approve/Solve/Reopen pass an empty string and must NOT wipe an existing assignment.
    if (forwardedTo !== undefined && forwardedTo !== '') {
      complaint.forwardedTo = forwardedTo;
    }
    complaint.updatedAt = timestamp;
    
    // Append to timeline
    complaint.updates.push({
      label: status,
      note,
      at: timestamp
    });

    await complaint.save();
    res.status(200).json(complaint);

  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Failed to update complaint status.' });
  }
});

// 6. Delete Complaint (Admin workflow)
app.delete('/api/complaints/:id', async (req, res) => {
  try {
    const complaintId = req.params.id;
    const result = await Complaint.findOneAndDelete({ id: complaintId });
    if (!result) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }
    res.status(200).json({ message: 'Complaint deleted successfully.', id: complaintId });
  } catch (error) {
    console.error('Delete complaint error:', error);
    res.status(500).json({ message: 'Failed to delete complaint.' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Express server running on port ${PORT}`);
});
