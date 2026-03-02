import WeekendConfig from "#models/weekendconfig";
import { sendSuccess, sendError } from "#utils/api_response_fix";

/**
 * @description Weekend configuration controller — singleton pattern.
 * @module controllers/weekendconfigcontroller
 */

/**
 * GET /api/v1/weekend-config
 * Returns current weekend config (or default if none exists).
 * Accessible by all authenticated users.
 */
const getWeekendConfig = async (req, res) => {
  try {
    const config = await WeekendConfig.getSingleton();
    return sendSuccess(res, "Weekend config retrieved successfully", config);
  } catch (error) {
    return sendError(res, "Failed to retrieve weekend config", error.message);
  }
};

/**
 * PUT /api/v1/weekend-config
 * Updates weekend config. Admin only.
 * Body: { saturdayWorking: boolean, sundayWorking: boolean }
 */
const updateWeekendConfig = async (req, res) => {
  try {
    const { saturdayWorking, sundayWorking } = req.body;

    let config = await WeekendConfig.findOne();

    if (!config) {
      config = await WeekendConfig.create({
        saturdayWorking: saturdayWorking ?? false,
        sundayWorking: sundayWorking ?? false,
      });
    } else {
      if (saturdayWorking !== undefined) config.saturdayWorking = saturdayWorking;
      if (sundayWorking !== undefined) config.sundayWorking = sundayWorking;
      await config.save();
    }

    return sendSuccess(res, "Weekend config updated successfully", config);
  } catch (error) {
    return sendError(res, "Failed to update weekend config", error.message);
  }
};

export { getWeekendConfig, updateWeekendConfig };
