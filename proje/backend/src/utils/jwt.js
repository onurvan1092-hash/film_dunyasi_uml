const jwt = require('jsonwebtoken');

function signToken(payload) {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  if (!secret) {
    throw new Error('JWT_SECRET tanimli degil.');
  }

  return jwt.sign(payload, secret, { expiresIn });
}

module.exports = { signToken };
