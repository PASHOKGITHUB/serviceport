// scripts/seedAdmin.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Define the Auth schema directly in the script
const authSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'staff'],
    required: [true, 'Role is required']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auth'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auth'
  }
}, {
  timestamps: true
});

// Add password hashing middleware
authSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, Number(process.env.BCRYPT_SALT_ROUNDS) || 12);
  next();
});

// Add password comparison method
authSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const Auth = mongoose.model('Auth', authSchema);

// Define Branch schema for sample data
const branchSchema = new mongoose.Schema({
  branchName: { type: String, required: true },
  location: { type: String, required: true },
  address: { type: String, required: true },
  contactNumber: { type: String, required: true },
  managerName: { type: String, required: true },
  action: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  staffName: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Staff' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth' }
}, { timestamps: true });

const Branch = mongoose.model('Branch', branchSchema);

// Define Staff schema with authentication
const staffSchema = new mongoose.Schema({
  staffName: { type: String, required: true, trim: true },
  contactNumber: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['Technician', 'Staff', 'Manager'], required: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  address: { type: String, required: true, trim: true },
  action: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth' }
}, { timestamps: true });

// Add password hashing middleware for staff
staffSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, Number(process.env.BCRYPT_SALT_ROUNDS) || 12);
  next();
});

// Add password comparison method for staff
staffSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const Staff = mongoose.model('Staff', staffSchema);

const seedData = async () => {
  try {
    // Connect to MongoDB
    const dbUrl = process.env.DATABASE_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/servicehub';
    await mongoose.connect(dbUrl);
    console.log('✅ Connected to database');

    // 1. Create Admin User
    const existingAdmin = await Auth.findOne({ userName: 'admin' });
    let adminUser;
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      adminUser = existingAdmin;
    } else {
      adminUser = await Auth.create({
        userName: 'admin',
        password: 'admin123',
        role: 'admin',
        createdBy: null
      });
      console.log('🎉 Admin user created successfully!');
    }

    // 2. Create Sample Branch
    let branch = await Branch.findOne({ branchName: 'Main Branch' });
    if (!branch) {
      branch = await Branch.create({
        branchName: 'Main Branch',
        location: 'Downtown',
        address: '123 Main Street, City, State 12345',
        contactNumber: '1234567890',
        managerName: 'John Manager',
        action: 'Active',
        createdBy: adminUser._id
      });
      console.log('🏢 Sample branch created successfully!');
    } else {
      console.log('⚠️  Sample branch already exists');
    }

    // 3. Create Sample Staff Members
    const sampleStaff = [
      {
        staffName: 'Alice Johnson',
        contactNumber: '9876543210',
        password: 'staff123',
        role: 'Manager',
        address: '456 Oak Avenue, City, State 12345'
      },
      {
        staffName: 'Bob Smith',
        contactNumber: '8765432109',
        password: 'tech123',
        role: 'Technician',
        address: '789 Pine Street, City, State 12345'
      },
      {
        staffName: 'Carol Davis',
        contactNumber: '7654321098',
        password: 'staff456',
        role: 'Staff',
        address: '321 Elm Street, City, State 12345'
      }
    ];

    for (const staffData of sampleStaff) {
      const existingStaff = await Staff.findOne({ contactNumber: staffData.contactNumber });
      
      if (!existingStaff) {
        await Staff.create({
          ...staffData,
          branch: branch._id,
          createdBy: adminUser._id
        });
        console.log(`👤 Staff member '${staffData.staffName}' created successfully!`);
      } else {
        console.log(`⚠️  Staff member with contact number '${staffData.contactNumber}' already exists`);
      }
    }

    console.log('\n🎉 Seeding completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👑 ADMIN LOGIN:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('');
    console.log('👥 STAFF LOGINS:');
    console.log('   Manager - Contact: 9876543210, Password: staff123');
    console.log('   Technician - Contact: 8765432109, Password: tech123');
    console.log('   Staff - Contact: 7654321098, Password: staff456');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  IMPORTANT: Change all passwords after first login!');

  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
    if (error.code === 11000) {
      console.log('Some data already exists in database');
    }
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
    process.exit(0);
  }
};

seedData();