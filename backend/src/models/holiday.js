import mongoose from "mongoose";

/**
 * @description Holiday schema for Festival and Company holidays (admin-controlled).
 * Fixed public holidays (Republic Day, Independence Day, Gandhi Jayanti) are NOT
 * stored here — they live in utils/fixedPublicHolidays.js.
 * @module models/holiday
 */
const holidaySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["FESTIVAL", "COMPANY"],
      default: "FESTIVAL",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isSaturdayWorking: {
      type: Boolean,
      default: false,
    },
    isSundayWorking: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Indexes for range queries
holidaySchema.index({ startDate: 1, endDate: 1 });

const Holiday = mongoose.model("Holiday", holidaySchema);
export default Holiday;
