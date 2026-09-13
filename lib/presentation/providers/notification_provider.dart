import 'package:flutter/material.dart';
import '../../data/models/notification_item_model.dart';

class NotificationProvider extends ChangeNotifier {
  List<NotificationItemModel> _notifications = NotificationItemModel.defaultNotifications();

  List<NotificationItemModel> get notifications => _notifications;

  int get unreadCount => _notifications.where((n) => !n.isRead).length;

  List<NotificationItemModel> get todayNotifications =>
      _notifications.where((n) => n.group == NotificationTimeGroup.today).toList();

  List<NotificationItemModel> get yesterdayNotifications =>
      _notifications.where((n) => n.group == NotificationTimeGroup.yesterday).toList();

  List<NotificationItemModel> get earlierNotifications =>
      _notifications.where((n) => n.group == NotificationTimeGroup.earlier).toList();

  void markAsRead(String id) {
    final index = _notifications.indexWhere((n) => n.id == id);
    if (index != -1) {
      _notifications[index] = _notifications[index].copyWith(isRead: true);
      notifyListeners();
    }
  }

  void markAllAsRead() {
    _notifications = _notifications.map((n) => n.copyWith(isRead: true)).toList();
    notifyListeners();
  }

  void dismissNotification(String id) {
    _notifications.removeWhere((n) => n.id == id);
    notifyListeners();
  }
}
