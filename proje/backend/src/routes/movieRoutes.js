const express = require('express');
const { getMovies, getMovieById, rateMovie } = require('../controllers/movieController');

const router = express.Router();

router.get('/', getMovies);
router.get('/:id', getMovieById);
router.post('/:id/rate', rateMovie);

module.exports = router;


