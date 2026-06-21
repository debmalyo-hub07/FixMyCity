const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');
const tf = require('@tensorflow/tfjs');
const mobilenet = require('@tensorflow-models/mobilenet');
const jpeg = require('jpeg-js');
require('dotenv').config();

const User = require('./models/User');
const Admin = require('./models/Admin');
const Complaint = require('./models/Complaint');

const app = express();
const PORT = process.env.PORT || 5000;

// --- CIVIC IMAGE CLASSIFIER (MobileNet + keyword matching) -------------------

const CIVIC_CLASSES = ['drainage', 'others', 'potholes', 'streetlight'];

const CATEGORY_TO_CLASS = {
  'Drainage problem': 'drainage',
  'Potholes': 'potholes',
  'Broken street light problem': 'streetlight',
  'Others': 'others',
};

// ImageNet labels (lowercased substrings) that indicate each civic category.
const CATEGORY_KEYWORDS = {
  potholes: [
    'crater', 'pothole', 'hole', 'pit', 'ditch', 'trench',
    'asphalt', 'road', 'pavement', 'gravel', 'cobblestone',
    'concrete', 'tarmac', 'street', 'highway', 'cracked', 'broken',
  ],
  drainage: [
    'manhole', 'sewer', 'drain', 'gutter', 'sewage', 'plumbing',
    'pipe', 'puddle', 'water', 'flood', 'mud', 'sludge', 'swamp',
    'overflow', 'leak', 'bog', 'marsh', 'pool',
  ],
  streetlight: [
    'streetlight', 'street light', 'lamppost', 'lamp post', 'lamp',
    'lantern', 'candle', 'torch', 'pole', 'light', 'bulb',
    'traffic light', 'beacon', 'flagpole', 'spotlight', 'chandelier',
  ],
  others: [],
};

let civicModel = null;

async function loadCivicModel() {
  try {
    console.log('Loading MobileNet (ImageNet)...');
    civicModel = await mobilenet.load({ version: 2, alpha: 1.0 });
    console.log('MobileNet loaded. Civic categories:', CIVIC_CLASSES);
  } catch (e) {
    console.error('Failed to load MobileNet — image checks will be skipped:', e.message);
  }
}

function decodeImageToTensor(base64Str) {
  const data = base64Str.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(data, 'base64');
  const raw = jpeg.decode(buffer, { useTArray: true });
  const numPixels = raw.width * raw.height;
  const rgb = new Uint8Array(numPixels * 3);
  for (let i = 0; i < numPixels; i++) {
    rgb[i * 3]     = raw.data[i * 4];
    rgb[i * 3 + 1] = raw.data[i * 4 + 1];
    rgb[i * 3 + 2] = raw.data[i * 4 + 2];
  }
  return tf.tensor3d(rgb, [raw.height, raw.width, 3]);
}

async function classifyCivicImage(base64Str) {
  if (!civicModel) return null;
  const input = decodeImageToTensor(base64Str);
  const predictions = await civicModel.classify(input, 5);
  tf.dispose([input]);
  return predictions; // [{className, probability}, ...] top 5
}

function matchesCategory(predictions, declaredClass) {
  const keywords = CATEGORY_KEYWORDS[declaredClass] || [];
  if (!keywords.length) return { matched: true, hit: null };
  for (const pred of predictions) {
    const labelLower = pred.className.toLowerCase();
    for (const kw of keywords) {
      if (labelLower.includes(kw)) {
        return { matched: true, hit: { keyword: kw, label: pred.className, prob: pred.probability } };
      }
    }
  }
  return { matched: false, hit: null };
}

function decideBlock(predictions, declaredCategory) {
  // Advisory mode: AI never blocks submissions. Predictions are attached
  // as metadata for admin review only.
  const declaredClass = CATEGORY_TO_CLASS[declaredCategory];
  if (!declaredClass) return { block: false, reason: 'unknown_category' };

  const declaredMatch = matchesCategory(predictions, declaredClass);
  return {
    block: false,
    reason: declaredMatch.matched ? 'advisory_match' : 'advisory_no_match',
    hit: declaredMatch.hit,
  };
}

// --- MIDDLEWARE --------------------------------------------------------------

app.use(cors());
app.use('/model', express.static(path.join(__dirname, 'civic_model_tfjs')));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const getFormattedDate = () => {
  try {
    const opts = {
      timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    };
    return new Intl.DateTimeFormat('en-CA', opts).format(new Date()).replace(',', '');
  } catch (e) {
    return new Date().toISOString().replace('T', ' ').substring(0, 16);
  }
};

// --- HEALTH ------------------------------------------------------------------

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    model_loaded: !!civicModel,
    classes: CIVIC_CLASSES,
    classifier: 'mobilenet-imagenet+keywords (advisory mode — never blocks)',
  });
});

// --- DB + SEED ---------------------------------------------------------------

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/FixMyCity')
  .then(async () => {
    console.log('Connected to MongoDB.');
    await seedDatabase();
  })
  .catch(err => console.error('MongoDB connection error:', err));

async function seedDatabase() {
  try {
    if ((await Admin.countDocuments()) === 0) {
      const hash = await bcrypt.hash('rounak123', 10);
      await new Admin({ name: 'City Admin', username: 'admin@fixmycity', password: hash, role: 'admin' }).save();
      console.log('Admin seeded.');
    }
    if ((await User.countDocuments()) === 0) {
      const hash = await bcrypt.hash('citizen123', 10);
      await User.insertMany([
        { name: 'Aarav Sen', phone: '9876543210', aadhar: '123412341234', password: hash, role: 'citizen' },
        { name: 'Diya Kapoor', phone: '9123456780', aadhar: '987698769876', password: hash, role: 'citizen' },
      ]);
      console.log('Citizens seeded.');
    }
    if ((await Complaint.countDocuments()) === 0) {
      await Complaint.insertMany([
        {
          id: 'CMP-2401', citizenName: 'Aarav Sen', citizenPhone: '9876543210',
          title: 'Large potholes near market road', type: 'Potholes',
          location: 'MG Road, near City Market Gate 2',
          description: 'Two deep potholes are causing traffic jams and bike skids during evening hours.',
          status: 'In Review', forwardedTo: 'Road Maintenance Cell',
          updatedAt: '2026-06-08 10:30', createdAt: '2026-06-07 18:45',
          image: 'https://images.unsplash.com/photo-1518391846015-55a9cc003b25?auto=format&fit=crop&w=900&q=80',
          images: ['https://images.unsplash.com/photo-1518391846015-55a9cc003b25?auto=format&fit=crop&w=900&q=80'],
          updates: [
            { label: 'Submitted', note: 'Complaint registered by citizen.', at: '2026-06-07 18:45' },
            { label: 'In Review', note: 'Area inspection requested by admin.', at: '2026-06-08 10:30' },
          ],
        },
        {
          id: 'CMP-2402', citizenName: 'Diya Kapoor', citizenPhone: '9123456780',
          title: 'Overflowing roadside drain', type: 'Drainage problem',
          location: 'Lake View Colony, Block B',
          description: 'Drain water is overflowing onto the road and creating a strong smell near the school entrance.',
          status: 'Forwarded', forwardedTo: 'Drainage and Sanitation Department',
          updatedAt: '2026-06-08 09:10', createdAt: '2026-06-06 14:20',
          image: 'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&w=900&q=80',
          images: ['https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&w=900&q=80'],
          updates: [
            { label: 'Submitted', note: 'Complaint registered by citizen.', at: '2026-06-06 14:20' },
            { label: 'In Review', note: 'Ward office reviewed the complaint.', at: '2026-06-07 11:00' },
            { label: 'Forwarded', note: 'Issue forwarded to Drainage and Sanitation Department.', at: '2026-06-08 09:10' },
          ],
        },
      ]);
      console.log('Complaints seeded.');
    }
  } catch (e) {
    console.error('Seed error:', e);
  }
}

// --- AUTH ROUTES -------------------------------------------------------------

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, phone, aadhar, password } = req.body;
    if (!name || !phone || !aadhar || !password) {
      return res.status(400).json({ message: 'All registration fields are required.' });
    }
    if (await User.findOne({ phone })) {
      return res.status(400).json({ message: 'Mobile number already registered.' });
    }
    if (await User.findOne({ aadhar })) {
      return res.status(400).json({ message: 'Aadhar number already registered.' });
    }
    const hash = await bcrypt.hash(password, 10);
    const u = new User({ name, phone, aadhar, password: hash, role: 'citizen' });
    await u.save();
    res.status(201).json({
      message: 'Citizen registered successfully.',
      user: { name: u.name, phone: u.phone, aadhar: u.aadhar, role: u.role },
    });
  } catch (e) {
    console.error('Registration error:', e);
    res.status(500).json({ message: 'Internal server error during registration.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { password } = req.body;
    const identifier = req.body.identifier || req.body.phone;
    if (!identifier || !password) {
      return res.status(400).json({ message: 'Mobile number/ID and password are required.' });
    }
    let user = await Admin.findOne({ username: identifier });
    if (!user) user = await User.findOne({ phone: identifier });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: 'Incorrect password' });
    }
    res.status(200).json({
      message: 'Logged in successfully.',
      user: {
        name: user.name, phone: user.phone || '', username: user.username || '',
        aadhar: user.aadhar || '', role: user.role,
      },
    });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ message: 'Internal server error during login.' });
  }
});

// --- COMPLAINT ROUTES --------------------------------------------------------

app.get('/api/complaints', async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ updatedAt: -1 });
    res.status(200).json(complaints);
  } catch (e) {
    console.error('Get complaints error:', e);
    res.status(500).json({ message: 'Failed to retrieve complaints.' });
  }
});

app.post('/api/complaints', async (req, res) => {
  try {
    const { citizenName, citizenPhone, title, type, location, description, images, image } = req.body;
    if (!citizenName || !citizenPhone || !title || !type || !location || !description) {
      return res.status(400).json({ message: 'Required fields are missing.' });
    }

    let imageCheck = {
      model: 'none', matched: null, score: null,
      note: 'Image not checked.', at: getFormattedDate(),
    };

    const activeImage = image || (images && images[0]);
    const isBase64 = activeImage && activeImage.startsWith('data:image/');

    if (isBase64 && CATEGORY_TO_CLASS[type]) {
      if (!civicModel) {
        imageCheck.note = 'AI advisory unavailable — model not loaded.';
      } else {
        try {
          const predictions = await classifyCivicImage(activeImage);
          const decision = decideBlock(predictions, type);
          const topLabels = predictions.slice(0, 3).map(p => `${p.className} (${(p.probability * 100).toFixed(0)}%)`).join(', ');
          console.log(`[civic-advisory] declared=${type} top=[${topLabels}] match=${decision.reason}`);

          const advisoryNote = decision.hit
            ? `AI advisory: image likely matches '${type}' (saw '${decision.hit.label}', ${(decision.hit.prob * 100).toFixed(0)}%).`
            : `AI advisory: image not clearly recognized as '${type}'. Top guesses: ${topLabels}.`;

          imageCheck = {
            model: 'mobilenet-imagenet+keywords',
            matched: decision.reason === 'advisory_match',
            score: decision.hit?.prob || 0,
            probs: predictions.reduce((acc, p) => { acc[p.className] = p.probability; return acc; }, {}),
            note: advisoryNote,
            at: getFormattedDate(),
          };
        } catch (e) {
          console.error('Civic ML inference error — allowing submission:', e);
          imageCheck.note = 'AI advisory unavailable — inference error.';
        }
      }
    } else if (!isBase64) {
      imageCheck.note = 'URL or seed image — AI advisory skipped.';
    }

    const count = await Complaint.countDocuments();
    let serial = 2401 + count;
    let complaintId = `CMP-${serial}`;
    while (await Complaint.findOne({ id: complaintId })) {
      serial++;
      complaintId = `CMP-${serial}`;
    }

    const timestamp = getFormattedDate();
    const newComplaint = new Complaint({
      id: complaintId, citizenName, citizenPhone, title, type, location, description,
      status: 'Submitted', forwardedTo: '',
      image: image || '', images: images || [],
      updates: [{ label: 'Submitted', note: 'Complaint registered by citizen.', at: timestamp }],
      imageCheck, createdAt: timestamp, updatedAt: timestamp,
    });
    await newComplaint.save();
    res.status(201).json(newComplaint);
  } catch (e) {
    console.error('Create complaint error:', e);
    res.status(500).json({ message: 'Failed to submit complaint.' });
  }
});

app.patch('/api/complaints/:id/status', async (req, res) => {
  try {
    const { status, forwardedTo } = req.body;
    if (!status) return res.status(400).json({ message: 'Status field is required.' });

    const complaint = await Complaint.findOne({ id: req.params.id });
    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

    const timestamp = getFormattedDate();
    let note = '';
    switch (status) {
      case 'In Review': note = 'Area inspection requested by admin.'; break;
      case 'Forwarded': note = `Issue forwarded to ${forwardedTo || 'respective department'}.`; break;
      case 'Resolved':  note = 'Complaint resolved successfully.'; break;
      default:          note = `Status updated to ${status}.`;
    }

    complaint.status = status;
    if (forwardedTo !== undefined && forwardedTo !== '') complaint.forwardedTo = forwardedTo;
    complaint.updatedAt = timestamp;
    complaint.updates.push({ label: status, note, at: timestamp });
    await complaint.save();
    res.status(200).json(complaint);
  } catch (e) {
    console.error('Update status error:', e);
    res.status(500).json({ message: 'Failed to update complaint status.' });
  }
});

app.delete('/api/complaints/:id', async (req, res) => {
  try {
    const r = await Complaint.findOneAndDelete({ id: req.params.id });
    if (!r) return res.status(404).json({ message: 'Complaint not found.' });
    res.status(200).json({ message: 'Complaint deleted successfully.', id: req.params.id });
  } catch (e) {
    console.error('Delete complaint error:', e);
    res.status(500).json({ message: 'Failed to delete complaint.' });
  }
});

app.listen(PORT, () => {
  console.log(`Express server running on port ${PORT}`);
  loadCivicModel();
});






