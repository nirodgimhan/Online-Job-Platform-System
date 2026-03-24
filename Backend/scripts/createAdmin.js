const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/JobPortal');
        console.log('✅ Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ role: 'admin' });
        
        if (existingAdmin) {
            console.log('✅ Admin already exists:');
            console.log('📧 Email:', existingAdmin.email);
            console.log('👤 Name:', existingAdmin.name);
            console.log('🆔 ID:', existingAdmin._id);
            
            // Test login credentials
            console.log('\n🔑 Login credentials:');
            console.log('Email:', existingAdmin.email);
            console.log('Password: [use the password you set]');
            
            process.exit(0);
        }

        // Create admin user
        const admin = new User({
            name: 'System Administrator',
            email: 'admin@jobportal.com',
            password: 'Admin@123', // Change this to a secure password
            role: 'admin',
            isVerified: true,
            isActive: true,
            phoneNumber: '+94771234567'
        });

        await admin.save();
        
        console.log('✅ Admin user created successfully!');
        console.log('\n📧 Email: admin@jobportal.com');
        console.log('🔑 Password: Admin@123');
        console.log('👤 Name: System Administrator');
        console.log('\n⚠️  PLEASE CHANGE THIS PASSWORD AFTER FIRST LOGIN!');
        
    } catch (error) {
        console.error('❌ Error creating admin:', error);
    } finally {
        await mongoose.disconnect();
        console.log('📦 Disconnected from MongoDB');
        process.exit();
    }
};

createAdmin();