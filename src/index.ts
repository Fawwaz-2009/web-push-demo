import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import webpush from "web-push";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = new Hono();

// Configure web-push with your VAPID keys
const VAPID_PUBLIC_KEY = "BBJmwrFMHkEN6cRXJOrDJv5eTkeWOCjEvpCznDgoaSGTHWaaBX-FeMkjJKq6KpGoL_XxS1LHYKzFILxfcsZmRbQ";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (!VAPID_PRIVATE_KEY) {
  throw new Error("VAPID_PRIVATE_KEY must be set in environment variables");
}

webpush.setVapidDetails("mailto:your-email@example.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// Store subscriptions in memory (in a real app, you'd use a database)
const subscriptions = new Set();

// Endpoint to handle push notification subscriptions
app.post("/api/subscribe", async (c) => {
  try {
    const subscription = await c.req.json();
    subscriptions.add(subscription);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error saving subscription:', error);
    return c.json({ success: false, error: 'Failed to save subscription' }, 500);
  }
});

// Endpoint to send push notifications
app.post("/api/send-notification", async (c) => {
  try {
    const notifications = Array.from(subscriptions).map(async (subscription: any) => {
      try {
        await webpush.sendNotification(
          subscription,
          JSON.stringify({
            title: 'Test Notification',
            body: 'This is a test push notification!',
            icon: '/icon.png',
            badge: '/badge.png',
            data: {
              url: 'http://localhost:3000'
            }
          })
        );
      } catch (error: any) {
        console.error('Error sending notification:', error);
        if (error.statusCode === 410) {
          // Subscription has expired or is no longer valid
          subscriptions.delete(subscription);
        }
      }
    });

    await Promise.all(notifications);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error sending notifications:', error);
    return c.json({ success: false, error: 'Failed to send notifications' }, 500);
  }
});

app.use("/*", serveStatic({ root: "./public" }));

const port = 3000;
console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
