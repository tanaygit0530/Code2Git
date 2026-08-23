class NotificationService {
  show(title, message, isSuccess = true) {
    if (typeof chrome !== 'undefined' && chrome.notifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon128.png'),
        title: `Code2Git AI - ${title}`,
        message: message,
        priority: 2
      });
    } else {
      console.log(`[Notification] ${title}: ${message}`);
    }
  }
}

export default new NotificationService();
