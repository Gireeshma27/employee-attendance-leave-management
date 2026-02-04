import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      enum: ["LEAVE_REQUEST", "LEAVE_RESPONSE", "ATTENDANCE_UPDATE", "SYSTEM"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId, // ID of the leave request, attendance record, etc.
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
