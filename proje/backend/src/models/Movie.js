const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    release_date: { type: String, default: '' },
    vote_average: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0, min: 0 },
    ratingTotal: { type: Number, default: 0, min: 0 },
    overview: { type: String, default: '' },
    poster: { type: String, default: '' },
    /** YouTube/Vimeo tam URL veya herhangi bir https izleme linki */
    watch_url: { type: String, default: '', trim: true },
    /** Video dosyası (ör. mp4/webm) doğrudan oynatma URL’si — API ile gelen camelCase ile uyumludur */
    videoUrl: { type: String, default: '', trim: true },
    runtime: { type: Number, default: 0 },
    category: {
      type: String,
      enum: ['popular', 'top_rated', 'upcoming'],
      default: 'popular'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Movie', movieSchema);
