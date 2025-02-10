const createState = (initialState = {}) => {
  const listeners = new Set();

  const state = new Proxy(initialState, {
    set(target, property, value) {
      target[property] = value;
      listeners.forEach(listener => listener(property, value));
      return true;
    }
  });

  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return { state, subscribe };
};

// Initial state without service worker registration
const initialState = {
  notificationPermission: Notification.permission,
  serviceWorkerRegistration: null,
  isSubscribed: false,
  subscriptionObject: null,
  currentStep: 1,
};

export const { state, subscribe } = createState(initialState);

// Check for existing service worker registration and subscription
async function initializeState() {
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        state.serviceWorkerRegistration = registration;
        
        // Check if already subscribed
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          state.isSubscribed = true;
          state.subscriptionObject = subscription;
          // Update step based on subscription status
          state.currentStep = 5; // Move to test notification step
        } else if (state.notificationPermission === 'granted') {
          state.currentStep = 4; // Move to subscription step
        }
      }
    }
  } catch (error) {
    console.error('Error initializing state:', error);
  }
}

// Run initialization when the page loads
initializeState(); 