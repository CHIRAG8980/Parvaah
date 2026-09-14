import 'package:flutter/material.dart';
import '../alerts/alerts_screen.dart';

class NotificationCenterScreen extends StatelessWidget {
  const NotificationCenterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const AlertsScreen(showBackButton: true);
  }
}
