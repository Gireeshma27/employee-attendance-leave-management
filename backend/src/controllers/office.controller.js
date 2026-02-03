import Office from "../models/office.model.js";
import ApiResponse from "../utils/apiResponse.js";

// @desc    Get all offices
// @route   GET /api/v1/offices
export const getAllOffices = async (req, res) => {
  try {
    const offices = await Office.find();
    return ApiResponse.success(
      res,
      200,
      "Offices fetched successfully",
      offices,
    );
  } catch (error) {
    return ApiResponse.serverError(res, error.message);
  }
};

// @desc    Create new office
// @route   POST /api/v1/offices
export const createOffice = async (req, res) => {
  try {
    const { name, description, address, coords, radius, status } = req.body;

    if (!name || !address || !coords || !radius) {
      return ApiResponse.badRequest(res, "Please provide all required fields");
    }

    const office = await Office.create({
      name,
      description,
      address,
      coords,
      radius,
      status,
    });

    return ApiResponse.created(res, "Office created successfully", office);
  } catch (error) {
    return ApiResponse.serverError(res, error.message);
  }
};

// @desc    Update office
// @route   PUT /api/v1/offices/:id
export const updateOffice = async (req, res) => {
  try {
    const office = await Office.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!office) {
      return ApiResponse.notFound(res, "Office not found");
    }

    return ApiResponse.success(res, 200, "Office updated successfully", office);
  } catch (error) {
    return ApiResponse.serverError(res, error.message);
  }
};

// @desc    Delete office
// @route   DELETE /api/v1/offices/:id
export const deleteOffice = async (req, res) => {
  try {
    const office = await Office.findByIdAndDelete(req.params.id);

    if (!office) {
      return ApiResponse.notFound(res, "Office not found");
    }

    return ApiResponse.success(res, 200, "Office deleted successfully");
  } catch (error) {
    return ApiResponse.serverError(res, error.message);
  }
};
