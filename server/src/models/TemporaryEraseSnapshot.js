import mongoose from 'mongoose';

const temporaryEraseSnapshotSchema = new mongoose.Schema(
  {
    eraseId: {
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
    erasedBy: {
      type: String,
      required: true,
    },
    erasedAt: {
      type: Date,
      default: Date.now,
    },
    dataSummary: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'UNDONE', 'SUPERSEDED', 'EXPIRED'],
      default: 'ACTIVE',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

temporaryEraseSnapshotSchema.index({ companyId: 1, status: 1, createdAt: -1 });

const TemporaryEraseSnapshot = mongoose.model('TemporaryEraseSnapshot', temporaryEraseSnapshotSchema);
export default TemporaryEraseSnapshot;
