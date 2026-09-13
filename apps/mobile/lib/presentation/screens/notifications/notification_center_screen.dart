import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/date_formatter.dart';
import '../../../data/models/notification_item_model.dart';
import '../../providers/alert_provider.dart';
import '../../providers/notification_provider.dart';
import '../../widgets/common/state_empty_view.dart';

class NotificationCenterScreen extends StatelessWidget {
  const NotificationCenterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final notifProvider = context.watch<NotificationProvider>();
    final alertProvider = context.watch<AlertProvider>();

    if (alertProvider.allAlerts.isNotEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        notifProvider.syncFromAlerts(alertProvider.allAlerts);
      });
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          if (notifProvider.unreadCount > 0)
            TextButton(
              onPressed: () => notifProvider.markAllAsRead(),
              child: const Text('Mark all read'),
            ),
        ],
      ),
      body: notifProvider.notifications.isEmpty
          ? const StateEmptyView(
              icon: Icons.notifications_off_outlined,
              title: 'No Notifications',
              message: 'You are fully up to date with Northeast safety bulletins.',
            )
          : ListView(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
              children: [
                if (notifProvider.todayNotifications.isNotEmpty) ...[
                  _buildSectionHeader('TODAY'),
                  ...notifProvider.todayNotifications.map(
                    (n) => _buildNotificationTile(context, n, notifProvider),
                  ),
                  const SizedBox(height: 14),
                ],
                if (notifProvider.yesterdayNotifications.isNotEmpty) ...[
                  _buildSectionHeader('YESTERDAY'),
                  ...notifProvider.yesterdayNotifications.map(
                    (n) => _buildNotificationTile(context, n, notifProvider),
                  ),
                  const SizedBox(height: 14),
                ],
                if (notifProvider.earlierNotifications.isNotEmpty) ...[
                  _buildSectionHeader('EARLIER'),
                  ...notifProvider.earlierNotifications.map(
                    (n) => _buildNotificationTile(context, n, notifProvider),
                  ),
                ],
              ],
            ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10, top: 4),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 11.5,
          fontWeight: FontWeight.w700,
          color: AppColors.textMuted,
          letterSpacing: 0.6,
        ),
      ),
    );
  }

  Widget _buildNotificationTile(
    BuildContext context,
    NotificationItemModel item,
    NotificationProvider provider,
  ) {
    Color sevColor;
    switch (item.severity) {
      case NotificationSeverity.critical:
        sevColor = AppColors.riskCritical;
        break;
      case NotificationSeverity.high:
        sevColor = AppColors.riskHigh;
        break;
      case NotificationSeverity.moderate:
        sevColor = AppColors.riskMedium;
        break;
      case NotificationSeverity.info:
        sevColor = AppColors.blue;
        break;
    }

    return Dismissible(
      key: Key(item.id),
      direction: DismissDirection.endToStart,
      onDismissed: (_) => provider.dismissNotification(item.id),
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        decoration: BoxDecoration(
          color: const Color(0xFFEF4444),
          borderRadius: BorderRadius.circular(16),
        ),
        child: const Icon(Icons.delete_outline_rounded, color: Colors.white),
      ),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: item.isRead ? AppColors.borderSubtle : AppColors.blue.withAlpha(80),
            width: item.isRead ? 1.0 : 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: AppColors.navy.withAlpha(8),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 10,
              height: 10,
              margin: const EdgeInsets.only(top: 4, right: 12),
              decoration: BoxDecoration(
                color: sevColor,
                shape: BoxShape.circle,
              ),
            ),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          item.title,
                          style: TextStyle(
                            fontSize: 14.5,
                            fontWeight: item.isRead ? FontWeight.w600 : FontWeight.w700,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ),
                      Text(
                        DateFormatter.formatTime(item.timestamp),
                        style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    item.message,
                    style: const TextStyle(
                      fontSize: 12.5,
                      color: AppColors.textSecondary,
                      height: 1.35,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
