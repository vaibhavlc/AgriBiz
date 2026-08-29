import mongoose from 'mongoose';

const pendingVerificationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      expires: 86400, // MongoDB TTL index auto-clears expired docs after 24 hours
    },
  },
  { timestamps: true }
);

const PendingVerification = mongoose.models.PendingVerification || mongoose.model('PendingVerification', pendingVerificationSchema);

export default PendingVerification;
