import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/models/alert_model.dart';
import '../../providers/alert_provider.dart';
import '../../providers/view_state.dart';
import '../../widgets/alerts/alert_card.dart';
import '../../widgets/common/state_empty_view.dart';
import '../../widgets/common/state_error_view.dart';
import '../../widgets/common/state_loading_view.dart';

class AlertsScreen extends StatelessWidget {
  const AlertsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final alertProvider = context.watch<AlertProvider>();
    final alerts = alertProvider.alerts;
    final state = alertProvider.viewState;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Emergency Alerts'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => alertProvider.loadAlerts(forceRefresh: true),
          ),
        ],
      ),
      body: Column(
        children: [
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
                _buildFilterChip('Moderate', AlertSeverity.medium, alertProvider),
                const SizedBox(width: 8),
                _buildFilterChip('Low', AlertSeverity.low, alertProvider),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: _buildBody(context, alertProvider, state, alerts),
          ),
        ],
      ),
    );
  }

  Widget _buildBody(
    BuildContext context,
    AlertProvider provider,
    ViewState state,
    List<AlertModel> alerts,
  ) {
    if (state.isLoading && alerts.isEmpty) {
      return const StateLoadingView(message: 'Loading active early warning alerts...');
    }

    if (state.isFailure && alerts.isEmpty) {
      return StateErrorView(
        errorMessage: provider.errorMessage ?? 'Unable to connect to alert service.',
        onRetry: () => provider.loadAlerts(forceRefresh: true),
      );
    }

    if (alerts.isEmpty) {
      return StateEmptyView(
        icon: Icons.check_circle_outline_rounded,
        title: 'No Active Warnings',
        message: 'There are currently no hazard warnings matching your filter.',
        actionLabel: 'Refresh Alerts',
        onAction: () => provider.loadAlerts(forceRefresh: true),
      );
    }

    return RefreshIndicator(
      onRefresh: () => provider.loadAlerts(forceRefresh: true),
      color: const Color(0xFF1E88E5),
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
        itemCount: alerts.length,
        separatorBuilder: (context, index) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final item = alerts[index];
          return AlertCard(
            alert: item,
            onAcknowledge: () => provider.markAsRead(item.id),
          );
        },
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
}
