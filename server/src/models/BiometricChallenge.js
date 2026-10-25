import mongoose from 'mongoose';

const biometricChallengeSchema = new mongoose.Schema(
  {
    challenge: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      index: true,
      default: null,
    },
    companyId: {
      type: String,
      index: true,
      default: null,
    },
    type: {
      type: String,
      enum: ['registration', 'authentication'],
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-delete challenges after expiry (5 minutes)
biometricChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const BiometricChallenge = mongoose.model('BiometricChallenge', biometricChallengeSchema);
export default BiometricChallenge;
