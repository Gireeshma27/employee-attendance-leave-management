import mongoose from "mongoose";

/**
 * @description Singleton model for weekend working configuration.
 * Only one document should ever exist. Use WeekendConfig.getSingleton()
 * to retrieve (or auto-create) the config.
 * @module models/weekendconfig
 */
const weekendConfigSchema = new mongoose.Schema(
  {
    saturdayWorking: {
      type: Boolean,
      default: false,
    },
    sundayWorking: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

/**
 * Static helper — returns the singleton config, creating it if it doesn't exist.
 * Default: both Saturday and Sunday are NOT working days.
 */
weekendConfigSchema.statics.getSingleton = async function () {
  let config = await this.findOne().lean();
  if (!config) {
    config = await this.create({ saturdayWorking: false, sundayWorking: false });
    config = config.toObject();
  }
  return config;
};

const WeekendConfig = mongoose.model("WeekendConfig", weekendConfigSchema);
export default WeekendConfig;
