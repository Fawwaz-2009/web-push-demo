import { state, subscribe } from "./state.js";
import { requestNotificationPermission, registerServiceWorker, subscribeForPushNotifications, sendTestNotification } from "./app.js";

// Update UI based on state changes
const updateUI = () => {
  // Update permission status badge
  const permissionStatus = document.getElementById("permission-status");
  if (permissionStatus) {
    const statusClasses = {
      granted: "bg-green-100 text-green-800",
      denied: "bg-red-100 text-red-800",
      default: "bg-yellow-100 text-yellow-800",
    };
    permissionStatus.className = `px-2 py-1 rounded-full text-sm font-medium ${statusClasses[state.notificationPermission]}`;
    permissionStatus.textContent = state.notificationPermission;
  }

  // Update active step
  document.querySelectorAll('[id^="step-"]').forEach((step, index) => {
    if (index + 1 === state.currentStep) {
      step.classList.add("border-blue-500", "bg-blue-50");
      step.classList.remove("border-gray-200");
    } else {
      step.classList.remove("border-blue-500", "bg-blue-50");
      step.classList.add("border-gray-200");
    }
  });
};

// Handle button clicks
document.addEventListener("click", async (e) => {
  const button = e.target.closest("button[data-action]");
  if (!button) return;

  const action = button.dataset.action;
  switch (action) {
    case "requestPermission":
      await requestNotificationPermission();
      break;
    case "registerServiceWorker":
      await registerServiceWorker();
      break;
    case "subscribe":
      await subscribeForPushNotifications();
      break;
    case "sendNotification":
      await sendTestNotification();
      break;
  }
});

// Subscribe to state changes
subscribe((property, value) => {
  updateUI();
});

// Initial UI update
updateUI();
