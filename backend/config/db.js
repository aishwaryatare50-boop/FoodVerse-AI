const mongoose = require('mongoose');
const dns = require('dns');

// Configure public DNS servers to resolve MongoDB Atlas SRV records reliably across all Windows environments
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  // Fall back to system resolver if restricted
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host} / ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB connection warning: ${error.message}`);
    console.warn('⚠️ Server will stay alive. Please ensure your current IP is whitelisted on MongoDB Atlas (Network Access -> Add IP -> Allow from Anywhere 0.0.0.0/0).');
  }
};

module.exports = connectDB;
