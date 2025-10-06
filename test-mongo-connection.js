// scripts/test-mongo-connection.js
require('dotenv').config({ path: '.env.local' });
console.log('📂 Current working directory:', process.cwd());

require('dotenv').config({ path: '.env.local' }); // reads .env.local from project root
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('❌ MONGODB_URI not set. Put MONGODB_URI in .env.local (no quotes).');
  process.exit(1);
}

async function run() {
  try {
    console.log('🔌 Attempting to connect to MongoDB Atlas...');
    // Use short timeout so failures show quickly in dev
    await mongoose.connect(uri, { 
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000 // 5 seconds
    });

    console.log('✅ Connected to MongoDB Atlas successfully.');

    // Optional: show the current database and list collections (sanity checks)
    const db = mongoose.connection.db;
    const admin = mongoose.connection.db.admin();

    const buildInfo = await admin.serverStatus();
    console.log('ℹ️  MongoDB server info:', {
      version: buildInfo.version,
      host: buildInfo.localTime?.toString?.() || '(serverTime unavailable)'
    });

    const dbName = db.databaseName;
    console.log('📛 current database:', dbName);

    const collections = await db.listCollections().toArray();
    console.log('📚 Collections in DB:', collections.map(c => c.name));

    // Optional quick insert -> delete test to ensure writes work
    const testColl = db.collection('test_connection_ping');
    const insertResult = await testColl.insertOne({ ping: true, time: new Date() });
    console.log('📝 Insert test OK, inserted id:', insertResult.insertedId.toString());

    await testColl.deleteOne({ _id: insertResult.insertedId });
    console.log('🗑️  Cleanup OK - test document removed.');

    await mongoose.disconnect();
    console.log('🔒 Disconnected. All checks passed ✅');
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection test failed:\n', err.message || err);
    // Print some details for common errors
    if (err.name === 'MongooseServerSelectionError') {
      console.error('\nPossible causes:\n - Wrong URI\n - Network access (IP whitelist) not configured\n - Atlas cluster paused or not available\nCheck Network Access in Atlas and your MONGODB_URI.');
    }
    process.exit(2);
  }
}

run();
