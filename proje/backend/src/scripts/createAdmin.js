require('dotenv').config();

const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');

async function createAdmin() {
  await connectDB();

  const name = process.env.ADMIN_NAME || 'Admin';
  const email = (process.env.ADMIN_EMAIL || 'admin@filmdunyasi.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '123456';

  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = 'admin';
    existing.passwordHash = await bcrypt.hash(password, 10);
    await existing.save();
    console.log('Mevcut kullanici admin olarak guncellendi.');
    process.exit(0);
  }

  await User.create({
    name,
    email,
    passwordHash: await bcrypt.hash(password, 10),
    role: 'admin'
  });

  console.log('Admin kullanici olusturuldu.');
  process.exit(0);
}

createAdmin().catch((err) => {
  console.error('Admin olusturma hatasi:', err.message);
  process.exit(1);
});
