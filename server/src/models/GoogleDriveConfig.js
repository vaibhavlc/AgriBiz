import mongoose from 'mongoose';

const googleDriveConfigSchema = new mongoose.Schema(
  {
    companyId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    refreshToken: {
      type: String,
      required: false,
      default: '',
      select: false, // Prevent returning refresh token in queries by default
    },
    googleEmail: {
      type: String,
      default: '',
    },
    customClientId: {
      type: String,
      default: '',
    },
    customClientSecret: {
      type: String,
      default: '',
      select: false,
    },
    status: {
      type: String,
      enum: ['CONNECTED', 'DISCONNECTED'],
      default: 'DISCONNECTED',
      index: true,
    },
    folderIds: {
      rootFolderId: { type: String, default: '' },
      companyFolderId: { type: String, default: '' },
      dailyFolderId: { type: String, default: '' },
      weeklyFolderId: { type: String, default: '' },
      monthlyFolderId: { type: String, default: '' },
    },
    connectedAt: {
      type: Date,
      default: Date.now,
    },
    lastAutoBackupAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const GoogleDriveConfig = mongoose.model('GoogleDriveConfig', googleDriveConfigSchema);
export default GoogleDriveConfig;
