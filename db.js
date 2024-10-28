require('dotenv').config({ path: './sample.env' });
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(process.env.DB);
    console.log('MongoDB connection successful');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
};

const stockSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  likes: {
    type: [String],
    default: [],
    validate: {
      validator: (likes) => likes.every((ip) => typeof ip === 'string'),
      message: 'Likes should be an array of IP addresses in string format.',
    },
  },
});

const Stock = mongoose.model('Stock', stockSchema);

module.exports = { connectDB, Stock };
