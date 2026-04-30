const express = require('express');
const {
  getDashboard,
  listUsers,
  deleteUser,
  createMovie,
  updateMovie,
  deleteMovie
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect, adminOnly);

router.get('/dashboard', getDashboard);
router.get('/users', listUsers);
router.delete('/users/:id', deleteUser);

router.post('/movies', createMovie);
router.patch('/movies/:id', updateMovie);
router.delete('/movies/:id', deleteMovie);

module.exports = router;
