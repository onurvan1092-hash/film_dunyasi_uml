const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI tanimli degil.');
  }

  await mongoose.connect(uri);
  console.log('MongoDB baglantisi basarili.');
}

module.exports = connectDB;
