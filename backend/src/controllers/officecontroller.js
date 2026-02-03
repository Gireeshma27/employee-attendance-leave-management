import Office from "#models/office.model";
import { sendSuccess, sendError } from "#utils/api_response_fix";

const getAllOffices = async (req, res) => {
  try {
    const offices = await Office.find();
    return sendSuccess(res, "Offices fetched successfully", offices);
  } catch (error) {
    return sendError(res, "Failed to fetch offices", error.message);
  }
};

const createOffice = async (req, res) => {
  try {
    const { name, description, address, coords, radius, status } = req.body;

    const office = await Office.create({
      name,
      description,
      address,
      coords,
      radius,
      status,
    });

    return sendSuccess(res, "Office created successfully", office, 201);
  } catch (error) {
    return sendError(res, "Failed to create office", error.message);
  }
};

const updateOffice = async (req, res) => {
  try {
    const office = await Office.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!office) return sendError(res, "Office not found", "Not Found", 404);

    return sendSuccess(res, "Office updated successfully", office);
  } catch (error) {
    return sendError(res, "Failed to update office", error.message);
  }
};

const deleteOffice = async (req, res) => {
  try {
    const office = await Office.findByIdAndDelete(req.params.id);
    if (!office) return sendError(res, "Office not found", "Not Found", 404);

    return sendSuccess(res, "Office deleted successfully");
  } catch (error) {
    return sendError(res, "Failed to delete office", error.message);
  }
};

export { getAllOffices, createOffice, updateOffice, deleteOffice };
