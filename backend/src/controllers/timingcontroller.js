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

    // Normalise branch for case-insensitive duplicate detection
    const normBranch = branch?.trim().toLowerCase();

    // Check for duplicate timing (same location + branch + department overlap)
    const existingTiming = await Timing.findOne({
      location,
      $expr: { $eq: [{ $toLower: { $trim: { input: "$branch" } } }, normBranch] },
    });

    if (existingTiming) {
      // Check if any selected department already exists in that timing
      const overlap = departments?.filter((d) =>
        existingTiming.departments.includes(d)
      );
      if (overlap && overlap.length > 0) {
        return sendError(
          res,
          `A timing for location '${location}' and branch '${branch}' already has departments: ${overlap.join(", ")}`,
          "Duplicate Entry",
          400
        );
      }
    }

    const timing = new Timing({
      location,
      branch: branch?.trim(),
      teamName: teamName?.trim() || "",
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

    // If updating location or branch, check for department overlap
    if (updateData.location || updateData.branch || updateData.departments) {
      const targetLocation = updateData.location || timing.location;
      const targetBranch = (updateData.branch || timing.branch)?.trim().toLowerCase();
      const targetDepts = updateData.departments || timing.departments;

      const checkDuplicate = await Timing.findOne({
        _id: { $ne: id },
        location: targetLocation,
        $expr: { $eq: [{ $toLower: { $trim: { input: "$branch" } } }, targetBranch] },
      });

      if (checkDuplicate) {
        const overlap = targetDepts.filter((d) =>
          checkDuplicate.departments.includes(d)
        );
        if (overlap.length > 0) {
          return sendError(
            res,
            `Another timing at the same location+branch already has departments: ${overlap.join(", ")}`,
            "Duplicate Entry",
            400
          );
        }
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
 * @desc    Get all unique locations from existing timings
 * @route   GET /api/v1/timings/locations
 * @access  Private (Admin)
 */
const getLocations = async (req, res) => {
  try {
    const locations = await Timing.distinct("location");
    return sendSuccess(res, "Locations retrieved successfully", locations);
  } catch (error) {
    return sendError(res, "Failed to retrieve locations", error.message);
  }
};

/**
 * @desc    Get timing by location + branch (case-insensitive, trimmed)
 * @route   GET /api/v1/timings/by-location-branch?location=x&branch=y
 * @access  Private
 */
const getTimingByLocationBranch = async (req, res) => {
  try {
    const { location, branch } = req.query;

    if (!location || !branch) {
      return sendError(res, "location and branch query params are required", "Bad Request", 400);
    }

    const normBranch = branch.trim().toLowerCase();

    const timing = await Timing.findOne({
      location,
      $expr: { $eq: [{ $toLower: { $trim: { input: "$branch" } } }, normBranch] },
      isActive: true,
    });

    if (!timing) {
      return sendSuccess(res, "No timing configured for this location and branch", null);
    }

    return sendSuccess(res, "Timing retrieved successfully", timing);
  } catch (error) {
    return sendError(res, "Failed to retrieve timing", error.message);
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
  getTimingByLocationBranch,
};
