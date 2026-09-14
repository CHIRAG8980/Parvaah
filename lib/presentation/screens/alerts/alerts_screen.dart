import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../data/models/alert_model.dart';
import '../../providers/alert_provider.dart';
import '../../providers/view_state.dart';
import '../../widgets/alerts/alert_card.dart';
import '../../widgets/common/state_empty_view.dart';
import '../../widgets/common/state_error_view.dart';
import '../../widgets/common/state_loading_view.dart';

class AlertsScreen extends StatefulWidget {
  final bool showBackButton;

  const AlertsScreen({
    super.key,
    this.showBackButton = false,
  });

  @override
  State<AlertsScreen> createState() => _AlertsScreenState();
}

class _AlertsScreenState extends State<AlertsScreen> with SingleTickerProviderStateMixin {
  late AnimationController _refreshAnimController;

  @override
  void initState() {
    super.initState();
    _refreshAnimController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 650),
    );
  }

  @override
  void dispose() {
    _refreshAnimController.dispose();
    super.dispose();
  }

  void _triggerRefresh(AlertProvider provider) {
    _refreshAnimController.forward(from: 0.0);
    provider.loadAlerts(forceRefresh: true);
  }

  @override
  Widget build(BuildContext context) {
    final alertProvider = context.watch<AlertProvider>();
    final alerts = alertProvider.alerts;
    final state = alertProvider.viewState;

    return Scaffold(
      backgroundColor: const Color(0xFFF7F9FC),
      body: SafeArea(
        bottom: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header: Emergency Alerts + Refresh button
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  if (widget.showBackButton) ...[
                    GestureDetector(
                      onTap: () => Navigator.maybePop(context),
                      behavior: HitTestBehavior.opaque,
                      child: Container(
                        width: 40,
                        height: 40,
                        margin: const EdgeInsets.only(right: 12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF0F172A).withAlpha(10),
                              blurRadius: 10,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.arrow_back_rounded,
                          size: 20,
                          color: Color(0xFF0F243E),
                        ),
                      ),
                    ),
                  ],
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text(
                          'Emergency Alerts',
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF0F243E),
                            letterSpacing: -0.5,
                          ),
                        ),
                        SizedBox(height: 3),
                        Text(
                          'Stay informed. Stay safe.',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Circular Refresh Button
                  GestureDetector(
                    onTap: () => _triggerRefresh(alertProvider),
                    behavior: HitTestBehavior.opaque,
                    child: Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        border: Border.all(color: const Color(0xFFE2E8F0), width: 1.2),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF0F172A).withAlpha(10),
                            blurRadius: 10,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Center(
                        child: RotationTransition(
                          turns: _refreshAnimController,
                          child: const Icon(
                            Icons.refresh_rounded,
                            size: 22,
                            color: Color(0xFF0F243E),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Horizontal Filter Chips Bar
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
              child: Row(
                children: [
                  _buildPillFilter(
                    label: 'All',
                    severity: null,
                    dotColor: null,
                    provider: alertProvider,
                  ),
                  const SizedBox(width: 8),
                  _buildPillFilter(
                    label: 'Critical',
                    severity: AlertSeverity.critical,
                    dotColor: const Color(0xFFEF4444),
                    provider: alertProvider,
                  ),
                  const SizedBox(width: 8),
                  _buildPillFilter(
                    label: 'High',
                    severity: AlertSeverity.high,
                    dotColor: const Color(0xFFF97316),
                    provider: alertProvider,
                  ),
                  const SizedBox(width: 8),
                  _buildPillFilter(
                    label: 'Medium',
                    severity: AlertSeverity.medium,
                    dotColor: const Color(0xFFEAB308),
                    provider: alertProvider,
                  ),
                  const SizedBox(width: 8),
                  _buildPillFilter(
                    label: 'Low',
                    severity: AlertSeverity.low,
                    dotColor: const Color(0xFF10B981),
                    provider: alertProvider,
                  ),
                ],
              ),
            ),

            const SizedBox(height: 6),

            // Alerts Body List
            Expanded(
              child: _buildBody(context, alertProvider, state, alerts),
            ),
          ],
        ),
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
        actionLabel: 'Reset Filter',
        onAction: () => provider.filterBySeverity(null),
      );
    }

    return RefreshIndicator(
      onRefresh: () => provider.loadAlerts(forceRefresh: true),
      color: const Color(0xFF1E88E5),
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 6, 16, 24),
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        itemCount: alerts.length,
        separatorBuilder: (context, index) => const SizedBox(height: 14),
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

  Widget _buildPillFilter({
    required String label,
    required AlertSeverity? severity,
    required Color? dotColor,
    required AlertProvider provider,
  }) {
    final isSelected = provider.selectedSeverity == severity;

    return GestureDetector(
      onTap: () => provider.filterBySeverity(severity),
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected
              ? (dotColor != null ? dotColor.withAlpha(28) : const Color(0xFF1E88E5))
              : Colors.white,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(
            color: isSelected
                ? (dotColor ?? const Color(0xFF1E88E5))
                : const Color(0xFFE2E8F0),
            width: isSelected ? 1.4 : 1.0,
          ),
          boxShadow: isSelected && severity == null
              ? [
                  BoxShadow(
                    color: const Color(0xFF1E88E5).withAlpha(40),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ]
              : [
                  BoxShadow(
                    color: const Color(0xFF0F172A).withAlpha(6),
                    blurRadius: 6,
                    offset: const Offset(0, 1),
                  ),
                ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (dotColor != null) ...[
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: dotColor,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 6),
            ],
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                color: isSelected
                    ? (severity == null
                        ? Colors.white
                        : (dotColor ?? const Color(0xFF0F243E)))
                    : const Color(0xFF334155),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
