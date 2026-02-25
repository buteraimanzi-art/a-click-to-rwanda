// Notification utilities for device notifications

// Generate alarm sound using Web Audio API
const playAlarmSound = (type: 'wake' | 'meal' | 'reminder' = 'reminder') => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;

    const patterns: Record<string, { freqs: number[]; durations: number[]; gap: number; repeats: number }> = {
      wake: { freqs: [880, 1100, 880, 1100], durations: [0.15, 0.15, 0.15, 0.15], gap: 0.1, repeats: 3 },
      meal: { freqs: [660, 880], durations: [0.2, 0.3], gap: 0.15, repeats: 2 },
      reminder: { freqs: [523, 659, 784], durations: [0.15, 0.15, 0.2], gap: 0.1, repeats: 1 },
    };

    const pattern = patterns[type];
    let t = now;

    for (let r = 0; r < pattern.repeats; r++) {
      pattern.freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + pattern.durations[i]);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + pattern.durations[i]);
        t += pattern.durations[i] + pattern.gap;
      });
      t += 0.3; // gap between repeats
    }

    // Close context after playback
    setTimeout(() => ctx.close(), (t - now) * 1000 + 500);
  } catch (e) {
    console.warn('Could not play alarm sound:', e);
  }
};

// Determine alarm type from notification tag
const getAlarmType = (tag: string): 'wake' | 'meal' | 'reminder' => {
  if (tag.startsWith('wake-')) return 'wake';
  if (tag.startsWith('breakfast-') || tag.startsWith('lunch-') || tag.startsWith('dinner-')) return 'meal';
  return 'reminder';
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export interface ScheduledNotification {
  date: Date;
  title: string;
  body: string;
  tag: string;
}

export const scheduleItineraryNotifications = (
  itinerary: Array<{
    id: string;
    date: string;
    day_type: string;
    destination_id: string;
    wake_time?: string;
    breakfast_time?: string;
    lunch_time?: string;
    dinner_time?: string;
  }>,
  destinations: Array<{ id: string; name: string }>
): ScheduledNotification[] => {
  const notifications: ScheduledNotification[] = [];

  itinerary.forEach((day, index) => {
    const destination = destinations.find((d) => d.id === day.destination_id);
    const destinationName = destination?.name || 'Unknown';
    const dayDate = new Date(day.date);

    // Daily reminder (7 AM on the day)
    const dailyReminder = new Date(dayDate);
    dailyReminder.setHours(7, 0, 0, 0);
    notifications.push({
      date: dailyReminder,
      title: `Day ${index + 1}: ${destinationName}`,
      body: day.day_type === 'transfer' 
        ? `Transfer day - Check your itinerary for details`
        : `Your adventure continues! Check today's activities.`,
      tag: `day-${day.id}`,
    });

    // Wake time notification
    if (day.wake_time) {
      const [hours, minutes] = day.wake_time.split(':');
      const wakeNotification = new Date(dayDate);
      wakeNotification.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      notifications.push({
        date: wakeNotification,
        title: '⏰ Wake Up Time',
        body: `Good morning! Time to start your day in ${destinationName}`,
        tag: `wake-${day.id}`,
      });
    }

    // Breakfast time notification
    if (day.breakfast_time) {
      const [hours, minutes] = day.breakfast_time.split(':');
      const breakfastNotification = new Date(dayDate);
      breakfastNotification.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      notifications.push({
        date: breakfastNotification,
        title: '🍳 Breakfast Time',
        body: `Time for breakfast! Enjoy your meal.`,
        tag: `breakfast-${day.id}`,
      });
    }

    // Lunch time notification
    if (day.lunch_time) {
      const [hours, minutes] = day.lunch_time.split(':');
      const lunchNotification = new Date(dayDate);
      lunchNotification.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      notifications.push({
        date: lunchNotification,
        title: '🍽️ Lunch Time',
        body: `Time for lunch! Stay energized for your activities.`,
        tag: `lunch-${day.id}`,
      });
    }

    // Dinner time notification
    if (day.dinner_time) {
      const [hours, minutes] = day.dinner_time.split(':');
      const dinnerNotification = new Date(dayDate);
      dinnerNotification.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      notifications.push({
        date: dinnerNotification,
        title: '🍷 Dinner Time',
        body: `Time for dinner! Reflect on today's adventures.`,
        tag: `dinner-${day.id}`,
      });
    }
  });

  return notifications;
};

export const sendNotification = (title: string, body: string, tag: string) => {
  if (Notification.permission === 'granted') {
    // Play audible alarm based on notification type
    playAlarmSound(getAlarmType(tag));

    const notification = new Notification(title, {
      body,
      tag,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      requireInteraction: true,
      silent: false,
    } as NotificationOptions);

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }
  }
};

// Store notifications in localStorage for periodic checking
export const saveScheduledNotifications = (notifications: ScheduledNotification[]) => {
  localStorage.setItem('itinerary-notifications', JSON.stringify(notifications));
};

export const getScheduledNotifications = (): ScheduledNotification[] => {
  const stored = localStorage.getItem('itinerary-notifications');
  if (!stored) return [];
  return JSON.parse(stored).map((n: any) => ({
    ...n,
    date: new Date(n.date),
  }));
};

// Check and trigger due notifications (1 hour before scheduled time)
export const checkAndTriggerNotifications = () => {
  const notifications = getScheduledNotifications();
  const now = new Date();
  const triggered: string[] = [];

  notifications.forEach((notification) => {
    const timeDiff = notification.date.getTime() - now.getTime();
    // Trigger if within 1 hour before scheduled time (3600000ms = 1 hour)
    if (timeDiff <= 3600000 && timeDiff >= 0) {
      sendNotification(notification.title, notification.body, notification.tag);
      triggered.push(notification.tag);
    }
  });

  // Remove triggered notifications
  if (triggered.length > 0) {
    const remaining = notifications.filter((n) => !triggered.includes(n.tag));
    saveScheduledNotifications(remaining);
  }
};

// Send a test notification to verify device notifications are working
export const sendTestNotification = async (): Promise<boolean> => {
  const hasPermission = await requestNotificationPermission();
  
  if (hasPermission) {
    playAlarmSound('reminder');
    sendNotification(
      '🔔 Test Notification',
      'Great! Your device notifications and alarm sounds are working. You will receive reminders for your itinerary.',
      'test-notification'
    );
    return true;
  }
  
  return false;
};

// Set up interval to check notifications every minute
export const startNotificationChecker = () => {
  // Check immediately
  checkAndTriggerNotifications();
  
  // Then check every minute
  const interval = setInterval(checkAndTriggerNotifications, 60000);
  
  return () => clearInterval(interval);
};
