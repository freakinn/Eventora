const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const bookingRoutes = require('./routes/bookings');

const app = express();

const MONGO_URI = process.env.MONGO_URI || (
  process.env.NODE_ENV === 'production' ? '' : 'mongodb://localhost:27017/eventora'
);

let cachedDb = global.mongooseConnection;
if (!cachedDb) {
  cachedDb = global.mongooseConnection = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cachedDb.conn) {
    return cachedDb.conn;
  }

  if (!MONGO_URI) {
    throw new Error('MONGO_URI is not configured');
  }

  if (!cachedDb.promise) {
    mongoose.set('bufferCommands', false);
    cachedDb.promise = mongoose.connect(MONGO_URI)
      .then((mongooseInstance) => {
        console.log('MongoDB Connected');
        return mongooseInstance;
      })
      .catch((error) => {
        cachedDb.promise = null;
        throw error;
      });
  }

  cachedDb.conn = await cachedDb.promise;
  return cachedDb.conn;
};

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'https://event-frontend-sand.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Eventora API is running' });
});

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    res.status(500).json({
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  connectDB()
    .then(() => {
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((err) => {
      console.error('MongoDB Connection Error:', err);
      process.exit(1);
    });
}

module.exports = app;
