import mongoose from "mongoose";

/**
 * @description Singleton model for system-wide admin-configurable defaults.
 * Only one document should ever exist. Use SystemSettings.getSingleton()
 * to retrieve (or auto-create) the settings.
 */
const systemSettingsSchema = new mongoose.Schema(
  {
    // WFH Defaults
    defaultWFHAllowed: {
      type: Boolean,
      default: false,
    },
    defaultTotalWFHDays: {
      type: Number,
      default: 5,
      min: 0,
      max: 30,
    },

    // Leave Quota Defaults
    defaultCLQuota: {
      type: Number,
      default: 12,
      min: 0,
      max: 60,
    },
    defaultSLQuota: {
      type: Number,
      default: 8,
      min: 0,
      max: 60,
    },
    defaultPLQuota: {
      type: Number,
      default: 18,
      min: 0,
      max: 60,
    },

    // Employee Defaults
    defaultRole: {
      type: String,
      enum: ["EMPLOYEE", "MANAGER"],
      default: "EMPLOYEE",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

/**
 * Static helper — returns the singleton settings, creating with defaults if none exist.
 */
systemSettingsSchema.statics.getSingleton = async function () {
  let settings = await this.findOne().lean();
  if (!settings) {
    const created = await this.create({});
    settings = created.toObject();
  }
  return settings;
};

const SystemSettings = mongoose.model("SystemSettings", systemSettingsSchema);
export default SystemSettings;
