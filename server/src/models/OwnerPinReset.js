import mongoose from 'mongoose';

const ownerPinResetSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    companyId: { type: String, required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, expires: 1800 }, // Auto-remove after 30 mins
  },
  { timestamps: true }
);

const OwnerPinReset = mongoose.models.OwnerPinReset || mongoose.model('OwnerPinReset', ownerPinResetSchema);
export default OwnerPinReset;
