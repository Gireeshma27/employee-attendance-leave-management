import Notification from "#models/notification";

const _sendPushNotification = async (recipientId, title, message) => {
  try {
    console.log(
      `[PUSH NOTIFICATION] To: ${recipientId} | Title: ${title} | Message: ${message}`,
    );
    return true;
  } catch (error) {
    console.error("Push notification failed:", error);
    return false;// In a real implementation, you might want to log this error to a monitoring service
  }
};

const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    let limit = parseInt(req.query.limit) || 10;
    if (limit > 50) limit = 50;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: "Unauthorized access" },
        data: null,
      });
    }

    const totalCount = await Notification.countDocuments({ recipient: userId });
    if (totalCount > 50) {
      const oldestToKeep = await Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .skip(49)
        .limit(1);

      if (oldestToKeep.length > 0) {
        await Notification.deleteMany({
          recipient: userId,
          createdAt: { $lt: oldestToKeep[0].createdAt },
        });
      }
    }

    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.status(200).json({
      success: true,
      error: null,
      data: notifications,
    });
  } catch (error) {
    console.error("Error in getNotifications:", error);
    return res.status(500).json({
      success: false,
      error: { message: "Internal server error while fetching notifications" },
      data: null,
    });
  }
};

const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    if (!notificationId) {
      return res.status(400).json({
        success: false,
        error: { message: "Notification ID is required" },
        data: null,
      });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isRead: true },
      { new: true },
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: { message: "Notification not found" },
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      error: null,
      data: notification,
    });
  } catch (error) {
    console.error("Error in markAsRead:", error);
    return res.status(500).json({
      success: false,
      error: { message: "Internal server error while updating notification" },
      data: null,
    });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true },
    );

    return res.status(200).json({
      success: true,
      error: null,
      data: { message: "All notifications marked as read" },
    });
  } catch (error) {
    console.error("Error in markAllAsRead:", error);
    return res.status(500).json({
      success: false,
      error: { message: "Internal server error while updating notifications" },
      data: null,
    });
  }
};

const clearAll = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.deleteMany({ recipient: userId });

    return res.status(200).json({
      success: true,
      error: null,
      data: { message: "All notifications cleared successfully" },
    });
  } catch (error) {
    console.error("Error in clearAll:", error);
    return res.status(500).json({
      success: false,
      error: { message: "Internal server error while clearing notifications" },
      data: null,
    });
  }
};

export { getNotifications, markAsRead, markAllAsRead, clearAll };
