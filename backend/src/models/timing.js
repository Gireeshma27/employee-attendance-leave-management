import mongoose from "mongoose";

/**
 * Timing Schema
 * Stores login/logout timing configurations for different locations, branches, and teams.
 * Each timing can be assigned to multiple departments.
 */
const timingSchema = new mongoose.Schema(
  {
    location: {
      type: String,
      required: true,
      enum: ["Mysore", "Bangalore", "Mangalore"],
      trim: true,
    },
    branch: {
      type: String,
      required: true,
      trim: true,
    },
    teamName: {
      type: String,
      required: true,
      trim: true,
    },
    loginTime: {
      type: String,
      required: true,
      // Format: "HH:mm" (24-hour format)
    },
    logoutTime: {
      type: String,
      required: true,
      // Format: "HH:mm" (24-hour format)
    },
    departments: {
      type: [String],
      required: true,
      validate: {
        validator: function (arr) {
          return arr && arr.length > 0;
        },
        message: "At least one department must be assigned",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Indexes for efficient querying
timingSchema.index({ location: 1 });
timingSchema.index({ location: 1, branch: 1 });
timingSchema.index({ departments: 1 });
timingSchema.index({ isActive: 1 });

const Timing = mongoose.model("Timing", timingSchema);

export default Timing;
