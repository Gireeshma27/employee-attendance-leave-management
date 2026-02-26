import Timing from "#models/timing";
import { sendSuccess, sendError } from "#utils/api_response_fix";

/**
 * @desc    Get all timings
 * @route   GET /api/v1/timings
 * @access  Private (Admin)
 */
const getAllTimings = async (req, res) => {
  try {
    const { location, isActive, department } = req.query;

    // Build filter object
    const filter = {};
    if (location) filter.location = location;
    if (isActive !== undefined) filter.isActive = isActive === "true";
    if (department) filter.departments = department;

    const timings = await Timing.find(filter).sort({ createdAt: -1 });

    return sendSuccess(res, "Timings retrieved successfully", timings);
  } catch (error) {
    return sendError(res, "Failed to retrieve timings", error.message);
  }
};

/**
 * @desc    Get timing by ID
 * @route   GET /api/v1/timings/:id
 * @access  Private (Admin)
 */
const getTimingById = async (req, res) => {
  try {
    const { id } = req.params;

    const timing = await Timing.findById(id);

    if (!timing) {
      return sendError(res, "Timing not found", "Not Found", 404);
    }

    return sendSuccess(res, "Timing retrieved successfully", timing);
  } catch (error) {
    return sendError(res, "Failed to retrieve timing", error.message);
  }
};

/**
 * @desc    Create a new timing
 * @route   POST /api/v1/timings
 * @access  Private (Admin)
 */
const createTiming = async (req, res) => {
  try {
    const { location, branch, teamName, loginTime, logoutTime, departments } = req.body;

    // Check for duplicate timing (same location, branch, teamName)
    const existingTiming = await Timing.findOne({
      location,
      branch,
      teamName,
    });

    if (existingTiming) {
      return sendError(
        res,
        "A timing with this location, branch, and team name already exists",
        "Duplicate Entry",
        400
      );
    }

    const timing = new Timing({
      location,
      branch,
      teamName,
      loginTime,
      logoutTime,
      departments,
    });

    await timing.save();

    return sendSuccess(res, "Timing created successfully", timing, 201);
  } catch (error) {
    return sendError(res, "Failed to create timing", error.message);
  }
};

/**
 * @desc    Update a timing
 * @route   PATCH /api/v1/timings/:id
 * @access  Private (Admin)
 */
const updateTiming = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const timing = await Timing.findById(id);

    if (!timing) {
      return sendError(res, "Timing not found", "Not Found", 404);
    }

    // If updating location, branch, or teamName, check for duplicates
    if (updateData.location || updateData.branch || updateData.teamName) {
      const checkDuplicate = await Timing.findOne({
        _id: { $ne: id },
        location: updateData.location || timing.location,
        branch: updateData.branch || timing.branch,
        teamName: updateData.teamName || timing.teamName,
      });

      if (checkDuplicate) {
        return sendError(
          res,
          "A timing with this location, branch, and team name already exists",
          "Duplicate Entry",
          400
        );
      }
    }

    // Apply updates
    Object.keys(updateData).forEach((key) => {
      timing[key] = updateData[key];
    });

    await timing.save();

    return sendSuccess(res, "Timing updated successfully", timing);
  } catch (error) {
    return sendError(res, "Failed to update timing", error.message);
  }
};

/**
 * @desc    Delete a timing
 * @route   DELETE /api/v1/timings/:id
 * @access  Private (Admin)
 */
const deleteTiming = async (req, res) => {
  try {
    const { id } = req.params;

    const timing = await Timing.findByIdAndDelete(id);

    if (!timing) {
      return sendError(res, "Timing not found", "Not Found", 404);
    }

    return sendSuccess(res, "Timing deleted successfully", { id });
  } catch (error) {
    return sendError(res, "Failed to delete timing", error.message);
  }
};

/**
 * @desc    Get timing by department
 * @route   GET /api/v1/timings/department/:department
 * @access  Private (Admin, Manager, Employee)
 */
const getTimingByDepartment = async (req, res) => {
  try {
    const { department } = req.params;

    const timing = await Timing.findOne({
      departments: department,
      isActive: true,
    });

    if (!timing) {
      return sendSuccess(res, "No timing configuration found for this department", null);
    }

    return sendSuccess(res, "Timing retrieved successfully", timing);
  } catch (error) {
    return sendError(res, "Failed to retrieve timing", error.message);
  }
};

/**
 * @desc    Get all unique locations
 * @route   GET /api/v1/timings/locations
 * @access  Private (Admin)
 */
const getLocations = async (req, res) => {
  try {
    const locations = ["Mysore", "Bangalore", "Mangalore"];
    return sendSuccess(res, "Locations retrieved successfully", locations);
  } catch (error) {
    return sendError(res, "Failed to retrieve locations", error.message);
  }
};

export {
  getAllTimings,
  getTimingById,
  createTiming,
  updateTiming,
  deleteTiming,
  getTimingByDepartment,
  getLocations,
};
