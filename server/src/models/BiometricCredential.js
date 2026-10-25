import mongoose from 'mongoose';

const biometricCredentialSchema = new mongoose.Schema(
  {
    credentialId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    companyId: {
      type: String,
      required: true,
      index: true,
    },
    publicKey: {
      type: Buffer,
      required: true,
    },
    counter: {
      type: Number,
      required: true,
      default: 0,
    },
    deviceType: {
      type: String,
      default: 'singleDevice',
    },
    backedUp: {
      type: Boolean,
      default: false,
    },
    transports: {
      type: [String],
      default: [],
    },
    deviceName: {
      type: String,
      default: 'Fingerprint / Platform Authenticator',
      trim: true,
    },
    aaguid: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastUsedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

biometricCredentialSchema.index({ companyId: 1, userId: 1, isActive: 1 });

const BiometricCredential = mongoose.model('BiometricCredential', biometricCredentialSchema);
export default BiometricCredential;
