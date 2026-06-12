

import OneSignal from "onesignal-node";

// Initialize OneSignal Client
const oneSignalClient = new OneSignal.Client({
  userAuthKey: process.env.ONESIGNAL_USER_AUTH_KEY,
  app: {
    appAuthKey: process.env.ONESIGNAL_APP_AUTH_KEY,
    id: process.env.ONESIGNAL_APP_ID
  }
});

/**
 * Send Notification to All Users
 * @param {Object} notificationData - { title, message, image, icon, url, type, examCode }
 */
export async function sendNotificationToAllUsers(notificationData) {
  try {
    const notification = {
      contents: { en: notificationData.message },
      headings: { en: notificationData.title },
      big_picture: notificationData.image || "",
      large_icon: notificationData.icon || "",
      data: {
        url: notificationData.url || "",
        type: notificationData.type || "exam",
        examCode: notificationData.examCode || ""
      },
      included_segments: ["All"],
      ios_badgeType: "Increase",
      ios_badgeCount: 1,
      android_channel_id: "exam_notifications"
    };

    const response = await oneSignalClient.createNotification(notification);
    console.log("✓ OneSignal notification sent:", response.body.id);
    return response.body;
  } catch (err) {
    console.error("❌ OneSignal notification failed:", err.message);
    throw err;
  }
}

/**
 * Send Notification to Specific Segment
 * @param {String} segment - Segment name (e.g., "students", "tutors")
 * @param {Object} notificationData - { title, message, image, icon, url, type, examCode }
 */
export async function sendNotificationToSegment(segment, notificationData) {
  try {
    const notification = {
      contents: { en: notificationData.message },
      headings: { en: notificationData.title },
      big_picture: notificationData.image || "",
      large_icon: notificationData.icon || "",
      data: {
        url: notificationData.url || "",
        type: notificationData.type || "exam",
        examCode: notificationData.examCode || ""
      },
      included_segments: [segment],
      ios_badgeType: "Increase",
      ios_badgeCount: 1,
      android_channel_id: "exam_notifications"
    };

    const response = await oneSignalClient.createNotification(notification);
    console.log(`✓ Notification sent to segment '${segment}':`, response.body.id);
    return response.body;
  } catch (err) {
    console.error(`❌ Notification to segment '${segment}' failed:`, err.message);
    throw err;
  }
}

/**
 * Send Notification to Specific User
 * @param {String} userId - OneSignal External ID
 * @param {Object} notificationData - { title, message, image, icon, url, type, examCode }
 */
export async function sendNotificationToUser(userId, notificationData) {
  try {
    const notification = {
      contents: { en: notificationData.message },
      headings: { en: notificationData.title },
      big_picture: notificationData.image || "",
      large_icon: notificationData.icon || "",
      data: {
        url: notificationData.url || "",
        type: notificationData.type || "exam",
        examCode: notificationData.examCode || ""
      },
      include_external_user_ids: [userId],
      ios_badgeType: "Increase",
      ios_badgeCount: 1,
      android_channel_id: "exam_notifications"
    };

    const response = await oneSignalClient.createNotification(notification);
    console.log(`✓ Notification sent to user '${userId}':`, response.body.id);
    return response.body;
  } catch (err) {
    console.error(`❌ Notification to user '${userId}' failed:`, err.message);
    throw err;
  }
}
