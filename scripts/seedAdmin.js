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

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    const dbUrl = process.env.DATABASE_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/servicehub';
    await mongoose.connect(dbUrl);
    console.log('✅ Connected to database');

    // Check if admin already exists
    const existingAdmin = await Auth.findOne({ userName: 'admin' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      console.log('You can login with:');
      console.log('Username: admin');
      console.log('Password: admin123 (if you used the default)');
      process.exit(0);
    }

    // Create admin user
    const adminUser = await Auth.create({
      userName: 'admin',
      password: 'admin123', // This will be automatically hashed
      role: 'admin',
      createdBy: null
    });

    console.log('🎉 Admin user created successfully!');
    console.log({
      id: adminUser._id,
      userName: adminUser.userName,
      role: adminUser.role,
      createdAt: adminUser.createdAt
    });

    console.log('\n✨ You can now login with:');
    console.log('👤 Username: admin');
    console.log('🔑 Password: admin123');
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    if (error.code === 11000) {
      console.log('Admin user already exists in database');
    }
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
    process.exit(0);
  }
};

createAdminUser();