const Movie = require('../models/Movie');

async function getMovies(req, res) {
  try {
    const { category, search } = req.query;
    const limit = Math.min(Number(req.query.limit) || 100, 200);
    const query = {};

    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { overview: { $regex: search, $options: 'i' } }
      ];
    }

    const movies = await Movie.find(query).sort({ createdAt: -1 }).limit(limit);
    return res.json({ movies });
  } catch (err) {
    return res.status(500).json({ message: 'Filmler alinirken hata olustu.' });
  }
}

async function getMovieById(req, res) {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) {
      return res.status(400).json({ message: 'Gecersiz film id.' });
    }
    const movie = await Movie.findById(id);
    if (!movie) {
      return res.status(404).json({ message: 'Film bulunamadi.' });
    }
    return res.json({ movie });
  } catch (err) {
    return res.status(400).json({ message: 'Gecersiz film id.' });
  }
}

async function rateMovie(req, res) {
  try {
    const id = String(req.params.id || '').trim();
    const rawScore = Number(req.body && req.body.score);
    const score = Number.isFinite(rawScore) ? Math.round(rawScore * 10) / 10 : NaN;

    if (!id) {
      return res.status(400).json({ message: 'Gecersiz film id.' });
    }
    if (!Number.isFinite(score) || score < 1 || score > 5) {
      return res.status(400).json({ message: 'Puan 1 ile 5 arasinda olmalidir.' });
    }

    const movie = await Movie.findById(id);
    if (!movie) {
      return res.status(404).json({ message: 'Film bulunamadi.' });
    }

    // Eski verilerde sadece vote_average varsa ilk puanı koruyarak sayacı başlat.
    if ((!movie.ratingCount || movie.ratingCount < 1) && movie.vote_average > 0) {
      movie.ratingCount = 1;
      movie.ratingTotal = Number(movie.vote_average);
    }

    const nextCount = Number(movie.ratingCount || 0) + 1;
    const nextTotal = Number(movie.ratingTotal || 0) + score;
    movie.ratingCount = nextCount;
    movie.ratingTotal = nextTotal;
    movie.vote_average = Number((nextTotal / nextCount).toFixed(1));

    await movie.save();
    return res.json({
      message: 'Puan kaydedildi.',
      movie
    });
  } catch (err) {
    return res.status(400).json({ message: 'Gecersiz film id.' });
  }
}

module.exports = {
  getMovies,
  getMovieById,
  rateMovie
};