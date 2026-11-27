const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const advocateRoutes = require('./routes/advocateRoutes');
const billRoutes = require('./routes/billRoutes');
const hrRoutes = require('./routes/hrRoutes');
const legalRoutes = require('./routes/legalRoutes');
const gmRoutes = require('./routes/gmRoutes');
const accountsRoutes = require('./routes/accountsRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure CORS for local development and production (Vercel, Netlify, custom domain)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.netlify.app') ||
      origin.endsWith('.onrender.com') ||
      process.env.NODE_ENV !== 'production'
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/advocates', advocateRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/legal', legalRoutes);
app.use('/api/gm', gmRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/reports', reportRoutes);

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'BSPHCL Advocate Bill Management System', 
    timestamp: new Date().toISOString() 
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});

// Database Connection with In-Memory fallback for zero-dependency offline run
const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bsphcl_advocate_bills';
  try {
    console.log(`Attempting connection to MongoDB at: ${mongoURI}...`);
    await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 10000 });
    console.log('✓ Successfully connected to MongoDB database');
    const { seedAll } = require('./seed/seedAdmin');
    await seedAll(true);
  } catch (err) {
    console.warn(`Local/Remote MongoDB service not reachable (${err.message}).`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      console.log('Spinning up in-memory MongoDB engine for standalone execution...');
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      await mongoose.connect(uri);
      console.log(`✓ Connected to in-memory MongoDB at: ${uri}`);

      const { seedAll } = require('./seed/seedAdmin');
      await seedAll(false);
    } catch (memErr) {
      console.error('Fatal: Could not start MongoDB engine:', memErr.message);
      process.exit(1);
    }
  }
};

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`BSPHCL Advocate Bill Management Backend Server`);
    console.log(`Running on: http://localhost:${PORT}`);
    console.log(`API Base:   http://localhost:${PORT}/api`);
    console.log(`Health:     http://localhost:${PORT}/api/health`);
    console.log(`====================================================`);
  });
});

module.exports = app;
