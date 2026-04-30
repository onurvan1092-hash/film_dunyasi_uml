const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Yetkisiz erisim (token yok).' });
    }

    const secret = process.env.JWT_SECRET;
    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.userId).select('-passwordHash');

    if (!user) {
      return res.status(401).json({ message: 'Kullanici bulunamadi.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Gecersiz veya suresi dolmus token.' });
  }
}

function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bu islem icin admin yetkisi gerekli.' });
  }
  next();
}

module.exports = {
  protect,
  adminOnly
};
