import SystemSettings from "#models/systemsettings";
import { sendSuccess, sendError } from "#utils/api_response_fix";

/**
 * GET /api/v1/settings
 * Returns current system settings / admin-configurable defaults.
 * Accessible by all authenticated users (needed for Add Employee form defaults).
 */
const getSettings = async (req, res) => {
  try {
    const settings = await SystemSettings.getSingleton();
    return sendSuccess(res, "Settings retrieved successfully", settings);
  } catch (error) {
    return sendError(res, "Failed to retrieve settings", error.message);
  }
};

/**
 * PUT /api/v1/settings
 * Updates system-wide default settings. Admin only.
 * Body (all optional):
 *   defaultWFHAllowed       boolean
 *   defaultTotalWFHDays     number (0-30)
 *   defaultCLQuota          number (0-60)
 *   defaultSLQuota          number (0-60)
 *   defaultPLQuota          number (0-60)
 *   defaultRole             "EMPLOYEE" | "MANAGER"
 */
const updateSettings = async (req, res) => {
  try {
    const {
      defaultWFHAllowed,
      defaultTotalWFHDays,
      defaultCLQuota,
      defaultSLQuota,
      defaultPLQuota,
      defaultRole,
    } = req.body;

    let settings = await SystemSettings.findOne();

    if (!settings) {
      settings = await SystemSettings.create({});
    }

    if (defaultWFHAllowed !== undefined) settings.defaultWFHAllowed = defaultWFHAllowed;
    if (defaultTotalWFHDays !== undefined) settings.defaultTotalWFHDays = defaultTotalWFHDays;
    if (defaultCLQuota !== undefined) settings.defaultCLQuota = defaultCLQuota;
    if (defaultSLQuota !== undefined) settings.defaultSLQuota = defaultSLQuota;
    if (defaultPLQuota !== undefined) settings.defaultPLQuota = defaultPLQuota;
    if (defaultRole !== undefined) settings.defaultRole = defaultRole;

    await settings.save();

    return sendSuccess(res, "Settings updated successfully", settings);
  } catch (error) {
    return sendError(res, "Failed to update settings", error.message);
  }
};

export { getSettings, updateSettings };
