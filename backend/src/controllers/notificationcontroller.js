import Notification from "#models/notification";
import { sendSuccess, sendError } from "#utils/api_response_fix";

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);

    return sendSuccess(
      res,
      "Notifications fetched successfully",
      notifications,
    );
  } catch (error) {
    return sendError(res, "Failed to fetch notifications", error.message);
  }
};

const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { isRead: true },
      { new: true },
    );

    if (!notification) {
      return sendError(res, "Notification not found", "Not Found", 404);
    }

    return sendSuccess(res, "Notification marked as read", notification);
  } catch (error) {
    return sendError(res, "Failed to update notification", error.message);
  }
};

const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { isRead: true },
    );

    return sendSuccess(res, "All notifications marked as read");
  } catch (error) {
    return sendError(res, "Failed to update notifications", error.message);
  }
};

const clearAll = async (req, res) => {
  try {
    await Notification.deleteMany({ recipient: req.user.id });
    return sendSuccess(res, "All notifications cleared");
  } catch (error) {
    return sendError(res, "Failed to clear notifications", error.message);
  }
};

export { getNotifications, markAsRead, markAllAsRead, clearAll };
