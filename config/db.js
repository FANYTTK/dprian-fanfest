const mongoose = require('mongoose');

async function connectDB() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('Falta la variable MONGODB_URI en tu archivo .env');
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB conectado');
  } catch (err) {
    console.error('❌ No se pudo conectar a MongoDB:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
