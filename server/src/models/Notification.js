import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    notificationId: {
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
      default: null,
      index: true,
    },
    targetRole: {
      type: String,
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        'DUE_REMINDER',
        'OVERDUE_PAYMENT',
        'PAYMENT_RECEIVED',
        'LOW_STOCK',
        'OUT_OF_STOCK',
        'STOCK_RECOVERY',
        'NEW_ORDER',
        'ORDER_STATUS',
        'BUSINESS_ALERT',
      ],
      required: true,
      index: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    isDelivered: {
      type: Boolean,
      default: false,
    },
    deliveredCount: {
      type: Number,
      default: 0,
    },
    eventReference: {
      type: String,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ companyId: 1, createdAt: -1 });
notificationSchema.index({ companyId: 1, userId: 1, isRead: 1 });
notificationSchema.index({ companyId: 1, eventReference: 1 }, { unique: true, sparse: true });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
