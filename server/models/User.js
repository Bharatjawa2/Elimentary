const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: ['Financial Analyst', 'Company CEO', 'Group Executive'],
    required: [true, 'Role is required']
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company is required']
  },
  parentCompany: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    default: null
  },
  permissions: {
    canViewAllCompanies: {
      type: Boolean,
      default: false
    },
    canEditBalanceSheets: {
      type: Boolean,
      default: false
    },
    canGenerateReports: {
      type: Boolean,
      default: true
    },
    canAccessAI: {
      type: Boolean,
      default: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Set permissions based on role
userSchema.pre('save', function(next) {
  if (this.isModified('role')) {
    switch (this.role) {
      case 'Group Executive':
        this.permissions.canViewAllCompanies = true;
        this.permissions.canEditBalanceSheets = true;
        this.permissions.canGenerateReports = true;
        this.permissions.canAccessAI = true;
        break;
      case 'Company CEO':
        this.permissions.canViewAllCompanies = false;
        this.permissions.canEditBalanceSheets = true;
        this.permissions.canGenerateReports = true;
        this.permissions.canAccessAI = true;
        break;
      case 'Financial Analyst':
        this.permissions.canViewAllCompanies = false;
        this.permissions.canEditBalanceSheets = false;
        this.permissions.canGenerateReports = true;
        this.permissions.canAccessAI = true;
        break;
    }
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
