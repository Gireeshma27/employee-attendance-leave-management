import express from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  clearAll,
} from "#controllers/notificationcontroller";
import protect from "#middlewares/protectmiddleware";

const router = express.Router();

router.use(protect); // All notification routes require authentication

router.get("/", getNotifications);
router.patch("/:id/read", markAsRead);
router.patch("/read-all", markAllAsRead);
router.delete("/clear-all", clearAll);

export default router;
