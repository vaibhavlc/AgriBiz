import mongoose from 'mongoose';

const backupHistorySchema = new mongoose.Schema(
  {
    historyId: {
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
    backupType: {
      type: String,
      enum: ['Daily', 'Weekly', 'Monthly', 'Manual'],
      required: true,
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED'],
      required: true,
      index: true,
    },
    availabilityStatus: {
      type: String,
      enum: ['AVAILABLE', 'UNAVAILABLE', 'EXPIRED_BY_RETENTION', 'FAILED'],
      default: 'AVAILABLE',
      index: true,
    },
    fileName: {
      type: String,
      default: '',
    },
    driveFileId: {
      type: String,
      default: '',
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    failureReason: {
      type: String,
      default: '',
    },
    dataSummary: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

backupHistorySchema.index({ companyId: 1, backupType: 1, status: 1, availabilityStatus: 1, createdAt: -1 });

const BackupHistory = mongoose.model('BackupHistory', backupHistorySchema);
export default BackupHistory;
