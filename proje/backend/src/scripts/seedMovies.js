require('dotenv').config();

const path = require('path');
const fs = require('fs');
const connectDB = require('../config/db');
const Movie = require('../models/Movie');

async function seedMovies() {
  await connectDB();

  const moviesJsonPath = path.resolve(__dirname, '../data/movies.json');
  const raw = fs.readFileSync(moviesJsonPath, 'utf8');
  const parsed = JSON.parse(raw);
  const movies = Array.isArray(parsed.movies) ? parsed.movies : [];

  await Movie.deleteMany({});
  const inserted = await Movie.insertMany(movies);

  console.log(`${inserted.length} film MongoDB'ye eklendi.`);
  process.exit(0);
}

seedMovies().catch((err) => {
  console.error('Seed hatasi:', err.message);
  process.exit(1);
});
