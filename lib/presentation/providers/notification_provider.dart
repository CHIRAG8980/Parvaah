import 'package:flutter/material.dart';
import '../../data/models/alert_model.dart';
import '../../data/models/notification_item_model.dart';

class NotificationProvider extends ChangeNotifier {
  List<NotificationItemModel> _notifications = [];

  List<NotificationItemModel> get notifications => _notifications;

  int get unreadCount => _notifications.where((item) => !item.isRead).length;

  List<NotificationItemModel> get todayNotifications =>
      _notifications.where((item) => item.group == NotificationTimeGroup.today).toList();

  List<NotificationItemModel> get yesterdayNotifications =>
      _notifications.where((item) => item.group == NotificationTimeGroup.yesterday).toList();

  List<NotificationItemModel> get earlierNotifications =>
      _notifications.where((item) => item.group == NotificationTimeGroup.earlier).toList();

  void syncFromAlerts(List<AlertModel> alerts) {
    if (alerts.isEmpty) return;

    final existingIds = _notifications.map((item) => item.id).toSet();
    final newItems = alerts
        .where((alert) => !existingIds.contains(alert.id))
        .map(NotificationItemModel.fromAlert)
        .toList();

    if (newItems.isNotEmpty) {
      _notifications = [...newItems, ..._notifications];
      notifyListeners();
    }
  }

  void markAsRead(String id) {
    final index = _notifications.indexWhere((item) => item.id == id);
    if (index != -1) {
      _notifications[index] = _notifications[index].copyWith(isRead: true);
      notifyListeners();
    }
  }

  void markAllAsRead() {
    _notifications = _notifications.map((item) => item.copyWith(isRead: true)).toList();
    notifyListeners();
  }

  void dismissNotification(String id) {
    _notifications.removeWhere((item) => item.id == id);
    notifyListeners();
  }
}
