// ============ services/notificationService.js ============

import OneSignal from "onesignal-node";

// Validate environment variables
function validateOneSignalConfig() {
  const appId = process.env.ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_API_KEY;

  if (!appId || !apiKey) {
    console.warn("⚠ OneSignal environment variables missing. Notifications disabled.");
    console.warn("Set ONESIGNAL_APP_ID and ONESIGNAL_API_KEY in .env");
    return false;
  }

  // Validate app_id format (should be UUID)
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(appId)) {
    console.warn("⚠ ONESIGNAL_APP_ID appears to be malformed (invalid UUID format)");
    console.warn("Expected format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx");
    return false;
  }

  return true;
}

// Initialize OneSignal Client only if config is valid
let oneSignalClient = null;

if (validateOneSignalConfig()) {
  try {
    oneSignalClient = new OneSignal.Client({
      userAuthKey: process.env.ONESIGNAL_API_KEY.trim(),
      app: {
        appAuthKey: process.env.ONESIGNAL_API_KEY.trim(),
        id: process.env.ONESIGNAL_APP_ID.trim()
      }
    });
    console.log("✓ OneSignal client initialized successfully");
  } catch (err) {
    console.error("❌ Failed to initialize OneSignal client:", err.message);
    oneSignalClient = null;
  }
}

/**
 * Send Notification to All Users
 * @param {Object} notificationData - { title, message, image, icon, url, type, examCode }
 */
export async function sendNotificationToAllUsers(notificationData) {
  try {
    // Skip if OneSignal is not initialized
    if (!oneSignalClient) {
      console.warn("⚠ OneSignal not initialized. Skipping notification.");
      return null;
    }

    const notification = {
      contents: { en: notificationData.message || "New update available" },
      headings: { en: notificationData.title || "OAU ExamGuard" },
      big_picture: notificationData.image || "https://oau.examguard.com.ng/logo.png",
      large_icon: notificationData.icon || "https://oau.examguard.com.ng/logo.png",
      data: {
        url: notificationData.url || "",
        type: notificationData.type || "exam",
        examCode: notificationData.examCode || ""
      },
      included_segments: ["All"],
      ios_badgeType: "Increase",
      ios_badgeCount: 1,
      android_channel_id: "exam_notifications",
      priority: 10
    };

    const response = await oneSignalClient.createNotification(notification);
    console.log("✓ OneSignal notification sent:", response.body.id);
    return response.body;
  } catch (err) {
    console.error("❌ OneSignal notification failed:", err.message);
    // Don't throw - allow app to continue
    return null;
  }
}

/**
 * Send Notification to Specific Segment
 * @param {String} segment - Segment name (e.g., "students", "tutors")
 * @param {Object} notificationData - { title, message, image, icon, url, type, examCode }
 */
export async function sendNotificationToSegment(segment, notificationData) {
  try {
    if (!oneSignalClient) {
      console.warn("⚠ OneSignal not initialized. Skipping notification.");
      return null;
    }

    const notification = {
      contents: { en: notificationData.message || "New update available" },
      headings: { en: notificationData.title || "OAU ExamGuard" },
      big_picture: notificationData.image || "https://oau.examguard.com.ng/logo.png",
      large_icon: notificationData.icon || "https://oau.examguard.com.ng/logo.png",
      data: {
        url: notificationData.url || "",
        type: notificationData.type || "exam",
        examCode: notificationData.examCode || ""
      },
      included_segments: [segment],
      ios_badgeType: "Increase",
      ios_badgeCount: 1,
      android_channel_id: "exam_notifications",
      priority: 10
    };

    const response = await oneSignalClient.createNotification(notification);
    console.log(`✓ Notification sent to segment '${segment}':`, response.body.id);
    return response.body;
  } catch (err) {
    console.error(`❌ Notification to segment '${segment}' failed:`, err.message);
    return null;
  }
}

/**
 * Send Notification to Specific User
 * @param {String} userId - OneSignal External ID
 * @param {Object} notificationData - { title, message, image, icon, url, type, examCode }
 */
export async function sendNotificationToUser(userId, notificationData) {
  try {
    if (!oneSignalClient) {
      console.warn("⚠ OneSignal not initialized. Skipping notification.");
      return null;
    }

    const notification = {
      contents: { en: notificationData.message || "New update available" },
      headings: { en: notificationData.title || "OAU ExamGuard" },
      big_picture: notificationData.image || "https://oau.examguard.com.ng/logo.png",
      large_icon: notificationData.icon || "https://oau.examguard.com.ng/logo.png",
      data: {
        url: notificationData.url || "",
        type: notificationData.type || "exam",
        examCode: notificationData.examCode || ""
      },
      include_external_user_ids: [userId],
      ios_badgeType: "Increase",
      ios_badgeCount: 1,
      android_channel_id: "exam_notifications",
      priority: 10
    };

    const response = await oneSignalClient.createNotification(notification);
    console.log(`✓ Notification sent to user '${userId}':`, response.body.id);
    return response.body;
  } catch (err) {
    console.error(`❌ Notification to user '${userId}' failed:`, err.message);
    return null;
  }
}

// Export initialization status for debugging
export function isOneSignalEnabled() {
  return oneSignalClient !== null;
  }
