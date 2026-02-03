import express from "express";
import {
  getAllOffices,
  createOffice,
  updateOffice,
  deleteOffice,
} from "../controllers/office.controller.js";

const router = express.Router();

router.get("/", getAllOffices);
router.post("/", createOffice);
router.put("/:id", updateOffice);
router.delete("/:id", deleteOffice);

export default router;
