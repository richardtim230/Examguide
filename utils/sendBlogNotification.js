import fetch from 'node-fetch';

export default async function sendBlogNotification({ title, message, url }) {
  const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
  const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY;

  const payload = {
    app_id: ONESIGNAL_APP_ID,
    included_segments: ["Subscribed Users"],
    headings: { en: title },
    contents: { en: message },
    url: url,
    chrome_web_image: "https://oau.examguard.com.ng/logo.png"
  };

  await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${ONESIGNAL_API_KEY}`
    },
    body: JSON.stringify(payload)
  });
}
