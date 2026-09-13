import 'package:intl/intl.dart';

class DateFormatter {
  DateFormatter._();

  static String formatRelative(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inMinutes < 1) {
      return 'Just now';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes} min ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours} hours ago';
    } else if (difference.inDays == 1) {
      return 'Yesterday';
    } else {
      return DateFormat('dd MMM, yyyy').format(dateTime);
    }
  }

  static String formatDateTime(DateTime dateTime) {
    return DateFormat('dd MMM yyyy, hh:mm a').format(dateTime);
  }

  static String formatTime(DateTime dateTime) {
    return DateFormat('hh:mm a').format(dateTime);
  }

  static bool isStale(DateTime? lastSyncTime) {
    if (lastSyncTime == null) return true;
    final age = DateTime.now().difference(lastSyncTime);
    return age.inHours >= 24;
  }
}
