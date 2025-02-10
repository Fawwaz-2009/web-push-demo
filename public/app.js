import { state } from "./state.js";

export async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission();
    state.notificationPermission = permission;
    if (permission === "granted") {
      state.currentStep = 2;
    }
  } catch (error) {
    console.error("Error requesting permission:", error);
  }
}

export async function registerServiceWorker() {
  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.register("/sw.js");
      
      // If there's a waiting or installing worker, trigger skipWaiting
      if (registration.waiting || registration.installing) {
        const worker = registration.waiting || registration.installing;
        if (worker) {
          console.log("New service worker installing/waiting, activating immediately");
          worker.postMessage({ type: 'SKIP_WAITING' });
        }
      }

      // Listen for new service workers
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              console.log("New service worker installed, activating immediately");
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        }
      });

      state.serviceWorkerRegistration = registration;
      state.currentStep = 4;
      console.log("Service Worker registered:", registration);
    }
  } catch (error) {
    console.error("Service Worker registration failed:", error);
  }
}

async function unsubscribeFromPushNotifications() {
  try {
    const registration = state.serviceWorkerRegistration;
    if (!registration) {
      throw new Error("Service Worker not registered");
    }

    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      state.isSubscribed = false;
      state.subscriptionObject = null;
    }
  } catch (error) {
    console.error("Error unsubscribing from push notifications:", error);
    throw error;
  }
}

export async function subscribeForPushNotifications() {
  try {
    const registration = state.serviceWorkerRegistration;
    if (!registration) {
      throw new Error("Service Worker not registered");
    }

    // Check for existing subscription and unsubscribe if exists
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      console.log("Unsubscribing from existing subscription...");
      await unsubscribeFromPushNotifications();
    }

    // Now subscribe with the new application server key
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: await getPublicKey(),
    });

    // Send subscription to server
    const response = await fetch("/api/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(subscription),
    });

    if (response.ok) {
      state.isSubscribed = true;
      state.subscriptionObject = subscription;
      state.currentStep = 5;
    }
  } catch (error) {
    console.error("Error subscribing to push notifications:", error);
  }
}

async function getPublicKey() {
  const VAPID_PUBLIC_KEY = "BBJmwrFMHkEN6cRXJOrDJv5eTkeWOCjEvpCznDgoaSGTHWaaBX-FeMkjJKq6KpGoL_XxS1LHYKzFILxfcsZmRbQ";
  return urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
}

export async function sendTestNotification() {
  try {
    const response = await fetch("/api/send-notification", {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Failed to send notification");
    }
  } catch (error) {
    console.error("Error sending notification:", error);
  }
}

// Utility function to convert URL-safe base64 to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
