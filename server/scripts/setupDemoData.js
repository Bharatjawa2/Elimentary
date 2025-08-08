const mongoose = require('mongoose');
const User = require('../models/User');
const Company = require('../models/Company');
require('dotenv').config();

const connectDB = require('../config/database');

const setupDemoData = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to MongoDB');

    // Create companies
    const reliance = await Company.findOneAndUpdate(
      { name: 'Reliance Industries' },
      {
        name: 'Reliance Industries',
        industry: 'Conglomerate',
        type: 'Parent',
        address: 'Mumbai, Maharashtra, India',
        website: 'https://www.ril.com'
      },
      { upsert: true, new: true }
    );

    const tata = await Company.findOneAndUpdate(
      { name: 'Tata Group' },
      {
        name: 'Tata Group',
        industry: 'Conglomerate',
        type: 'Parent',
        address: 'Mumbai, Maharashtra, India',
        website: 'https://www.tata.com'
      },
      { upsert: true, new: true }
    );

    const infosys = await Company.findOneAndUpdate(
      { name: 'Infosys' },
      {
        name: 'Infosys',
        industry: 'Technology',
        type: 'Subsidiary',
        address: 'Bangalore, Karnataka, India',
        website: 'https://www.infosys.com'
      },
      { upsert: true, new: true }
    );

    console.log('Companies created/updated');

    // Create demo users
    const demoUsers = [
      {
        fullName: 'Financial Analyst',
        email: 'analyst@financeai.com',
        password: 'password123',
        role: 'Financial Analyst',
        company: reliance._id
      },
      {
        fullName: 'Mukesh Ambani',
        email: 'ceo@reliance.com',
        password: 'password123',
        role: 'Company CEO',
        company: reliance._id
      },
      {
        fullName: 'Ratan Tata',
        email: 'ambani@reliance.com',
        password: 'password123',
        role: 'Group Executive',
        company: tata._id
      }
    ];

    for (const userData of demoUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`User ${userData.email} already exists, updating...`);
        existingUser.fullName = userData.fullName;
        existingUser.role = userData.role;
        existingUser.company = userData.company;
        existingUser.password = userData.password;
        await existingUser.save();
      } else {
        console.log(`Creating user ${userData.email}...`);
        await User.create(userData);
      }
    }

    console.log('Demo users created/updated successfully');
    console.log('\nDemo Credentials:');
    console.log('1. Financial Analyst: analyst@financeai.com / password123');
    console.log('2. Company CEO: ceo@reliance.com / password123');
    console.log('3. Group Executive: ambani@reliance.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('Error setting up demo data:', error);
    process.exit(1);
  }
};

setupDemoData();
