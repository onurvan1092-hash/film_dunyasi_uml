const User = require('../models/User');
const Movie = require('../models/Movie');

async function getDashboard(req, res) {
  try {
    const [userCount, movieCount] = await Promise.all([
      User.countDocuments({}),
      Movie.countDocuments({})
    ]);

    return res.json({
      stats: {
        users: userCount,
        movies: movieCount
      }
    });
  } catch (err) {
    return res.status(500).json({ message: 'Dashboard verisi alinamadi.' });
  }
}

async function listUsers(req, res) {
  try {
    const users = await User.find({}).select('-passwordHash').sort({ createdAt: -1 });
    return res.json({ users });
  } catch (err) {
    return res.status(500).json({ message: 'Kullanicilar alinamadi.' });
  }
}

async function deleteUser(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Kullanici bulunamadi.' });
    }
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Admin kullanici silinemez.' });
    }

    await User.deleteOne({ _id: user._id });
    return res.json({ message: 'Kullanici silindi.' });
  } catch (err) {
    return res.status(400).json({ message: 'Gecersiz kullanici id.' });
  }
}

async function createMovie(req, res) {
  try {
    const {
      title,
      release_date,
      vote_average,
      overview,
      poster,
      watch_url,
      videoUrl,
      runtime,
      category
    } = req.body;
    if (!title) return res.status(400).json({ message: 'title zorunlu.' });

    const movie = await Movie.create({
      title,
      release_date,
      vote_average,
      overview,
      poster,
      watch_url,
      videoUrl,
      runtime,
      category
    });

    return res.status(201).json({ message: 'Film olusturuldu.', movie });
  } catch (err) {
    return res.status(500).json({ message: 'Film olusturma basarisiz.' });
  }
}

async function updateMovie(req, res) {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!movie) return res.status(404).json({ message: 'Film bulunamadi.' });
    return res.json({ message: 'Film guncellendi.', movie });
  } catch (err) {
    return res.status(400).json({ message: 'Film guncelleme basarisiz.' });
  }
}

async function deleteMovie(req, res) {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: 'Film bulunamadi.' });
    await Movie.deleteOne({ _id: movie._id });
    return res.json({ message: 'Film silindi.' });
  } catch (err) {
    return res.status(400).json({ message: 'Gecersiz film id.' });
  }
}

module.exports = {
  getDashboard,
  listUsers,
  deleteUser,
  createMovie,
  updateMovie,
  deleteMovie
};
