import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from './models/User.js';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const users = await User.find({});
  console.log('--- ALL USERS IN DB ---');
  users.forEach(u => {
    console.log(`Name: ${u.name}, Mobile: ${u.mobile}, Role: ${u.role}, Status: ${u.status}, PresenceStatus: ${u.presenceStatus}`);
  });
  await mongoose.disconnect();
}

check();
