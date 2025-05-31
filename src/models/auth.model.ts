import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IAuth extends Document {
  userName: string;
  password?: string; // Make password optional in interface
  role: 'admin' | 'manager' | 'staff';
  createdAt: Date;
  updatedAt: Date;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  correctPassword(candidatePassword: string, userPassword: string): Promise<boolean>;
}

const authSchema = new Schema<IAuth>({
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
    type: Schema.Types.ObjectId,
    ref: 'Auth'
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Auth'
  }
}, {
  timestamps: true
});

authSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password!, Number(process.env.BCRYPT_SALT_ROUNDS) || 12);
  next();
});

authSchema.methods.correctPassword = async function(candidatePassword: string, userPassword: string) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

export const Auth = mongoose.model<IAuth>('Auth', authSchema);