import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/app_colors.dart';
import '../../providers/alert_provider.dart';
import '../../../data/models/alert_model.dart';
import '../../../core/utils/date_formatter.dart';

class AlertsScreen extends StatelessWidget {
  const AlertsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final alertProvider = context.watch<AlertProvider>();
    final alerts = alertProvider.alerts;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Emergency Alerts'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => alertProvider.loadAlerts(),
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter pills row matching prompt Section 26: All | High | Medium | Low
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
            child: Row(
              children: [
                _buildFilterChip('All', null, alertProvider),
                const SizedBox(width: 8),
                _buildFilterChip('Critical', AlertSeverity.critical, alertProvider),
                const SizedBox(width: 8),
                _buildFilterChip('High', AlertSeverity.high, alertProvider),
                const SizedBox(width: 8),
                _buildFilterChip('Medium', AlertSeverity.medium, alertProvider),
                const SizedBox(width: 8),
                _buildFilterChip('Low', AlertSeverity.low, alertProvider),
              ],
            ),
          ),

          const SizedBox(height: 8),

          // Alerts List
          Expanded(
            child: alerts.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: const [
                        Icon(Icons.check_circle_outline_rounded, size: 54, color: AppColors.emerald),
                        SizedBox(height: 12),
                        Text(
                          'No Active Alerts',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                        ),
                        SizedBox(height: 4),
                        Text(
                          'There are currently no active warnings matching your filter.',
                          style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
                        ),
                      ],
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
                    itemCount: alerts.length,
                    separatorBuilder: (context, index) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final item = alerts[index];
                      return _buildAlertCard(context, item, alertProvider);
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, AlertSeverity? severity, AlertProvider provider) {
    final isSelected = provider.selectedSeverity == severity;
    return GestureDetector(
      onTap: () => provider.filterBySeverity(severity),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.blue : AppColors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppColors.blue : AppColors.border,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: isSelected ? Colors.white : AppColors.textPrimary,
          ),
        ),
      ),
    );
  }

  Widget _buildAlertCard(BuildContext context, AlertModel item, AlertProvider provider) {
    final isCritical = item.severity == AlertSeverity.critical;
    final isHigh = item.severity == AlertSeverity.high;
    final sevColor = isCritical
        ? AppColors.riskCritical
        : (isHigh ? AppColors.riskHigh : AppColors.riskMedium);
    final sevBg = isCritical
        ? AppColors.riskHighBg
        : (isHigh ? AppColors.riskElevatedBg : AppColors.riskMediumBg);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isCritical ? AppColors.riskHigh.withAlpha(50) : AppColors.borderSubtle,
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.navy.withAlpha(10),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top row with Severity pill and relative timestamp
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: sevBg,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.circle, size: 8, color: sevColor),
                    const SizedBox(width: 6),
                    Text(
                      isCritical
                          ? 'Critical Risk'
                          : (isHigh ? 'High Risk' : 'Moderate Warning'),
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: sevColor,
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                DateFormatter.formatRelative(item.timestamp),
                style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Title
          Text(
            item.title,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
              letterSpacing: -0.2,
            ),
          ),

          const SizedBox(height: 6),

          // Location
          Row(
            children: [
              const Icon(Icons.location_on_rounded, size: 14, color: Color(0xFFEF4444)),
              const SizedBox(width: 4),
              Text(
                item.region,
                style: const TextStyle(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w500,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),

          const SizedBox(height: 8),

          // Message
          Text(
            item.message,
            style: const TextStyle(
              fontSize: 13,
              color: AppColors.textSecondary,
              height: 1.4,
            ),
          ),

          if (item.instructions != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.lightBlueBg,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.info_outline_rounded, size: 18, color: AppColors.deepBlue),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      item.instructions!,
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.navy,
                        height: 1.35,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 14),

          // Action row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              ElevatedButton.icon(
                onPressed: () async {
                  final uri = Uri.parse('tel:1077');
                  if (await canLaunchUrl(uri)) await launchUrl(uri);
                },
                icon: const Icon(Icons.phone_rounded, size: 15, color: Colors.white),
                label: const Text('Helpline 1077'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.blue,
                  minimumSize: const Size(130, 38),
                  textStyle: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600),
                ),
              ),
              TextButton(
                onPressed: () => provider.markAsRead(item.id),
                child: const Text('Acknowledge'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
