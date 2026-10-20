import mongoose from 'mongoose';

const pushSubscriptionSchema = new mongoose.Schema(
  {
    subscriptionId: {
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
    userId: {
      type: String,
      required: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    keys: {
      p256dh: {
        type: String,
        required: true,
      },
      auth: {
        type: String,
        required: true,
      },
    },
    userAgent: {
      type: String,
      default: '',
    },
    deviceType: {
      type: String,
      enum: ['mobile', 'tablet', 'desktop', 'unknown'],
      default: 'mobile',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastDeliveredAt: {
      type: Date,
      default: null,
    },
    failedAttempts: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

pushSubscriptionSchema.index({ companyId: 1, userId: 1, isActive: 1 });
pushSubscriptionSchema.index({ companyId: 1, isActive: 1 });

const PushSubscription = mongoose.model('PushSubscription', pushSubscriptionSchema);
export default PushSubscription;
