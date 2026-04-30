require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`Server ayakta: http://localhost:${PORT}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} kullanimda. Baska bir port deneyin veya acik sureci kapatin.`);
      } else {
        console.error('Server dinleme hatasi:', err.message);
      }
      process.exit(1);
    });
  } catch (err) {
    console.error('Server baslatilirken hata:', err.message);
    process.exit(1);
  }
}

start();
