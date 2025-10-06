// scripts/test-mongo-connection-insecure.js
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI not set in .env.local');
  process.exit(1);
}

(async () => {
  try {
    console.log('🔌 Attempting insecure TLS connect to MongoDB Atlas (debug only) ...');
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      tls: true,
      tlsInsecure: true // debug only
    });
    console.log('✅ Insecure connection succeeded (tls validation bypassed).');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Insecure connection failed:', err.message || err);
    process.exit(2);
  }
})();


