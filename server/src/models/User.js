import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    companyId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    mobile: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
    },
    pin: {
      type: String,
    },
    role: {
      type: String,
      enum: ['Owner', 'Accounts', 'Cashier'],
      required: true,
    },
    customPermissions: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
    presenceStatus: {
      type: String,
      enum: ['online', 'busy', 'away'],
      default: 'online',
    },
    avatar: {
      type: String,
      default: '',
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ companyId: 1, updatedAt: -1 });

// Ensure null/empty mobile is never stored — sparse unique index treats null as a value
userSchema.pre('save', function (next) {
  if (this.mobile === null || this.mobile === '' || this.mobile === undefined) {
    this.mobile = undefined;
    this.markModified('mobile');
  }
  next();
});

// Also handle insertMany / bulkWrite paths via pre('insertMany')
userSchema.pre('insertMany', function (next, docs) {
  docs.forEach(doc => {
    if (!doc.mobile) delete doc.mobile;
  });
  next();
});

const User = mongoose.model('User', userSchema);
export default User;
