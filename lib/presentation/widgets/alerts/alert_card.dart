import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../data/models/alert_model.dart';

class AlertCard extends StatelessWidget {
  final AlertModel alert;
  final VoidCallback onAcknowledge;
  final VoidCallback? onViewDetails;

  const AlertCard({
    super.key,
    required this.alert,
    required this.onAcknowledge,
    this.onViewDetails,
  });

  @override
  Widget build(BuildContext context) {
    final sev = alert.severity;
    final isCritical = sev == AlertSeverity.critical;
    final isHigh = sev == AlertSeverity.high;
    final isMedium = sev == AlertSeverity.medium;
    final isLow = sev == AlertSeverity.low;

    // Severity specific colors matching the reference design
    final Color cardBorderColor;
    final Color cardGlowColor;
    final Color iconBgColor;
    final Color iconColor;
    final IconData hazardIcon;
    final Color tagBgColor;
    final Color tagTextColor;
    final String tagLabel;
    final Color? viewButtonBg;
    final Color? viewButtonText;

    if (isCritical) {
      cardBorderColor = const Color(0xFFFEE2E2);
      cardGlowColor = const Color(0xFFEF4444).withAlpha(14);
      iconBgColor = const Color(0xFFEF4444);
      iconColor = Colors.white;
      hazardIcon = Icons.warning_rounded;
      tagBgColor = const Color(0xFFFEE2E2);
      tagTextColor = const Color(0xFFDC2626);
      tagLabel = 'Critical';
      viewButtonBg = const Color(0xFFFEE2E2);
      viewButtonText = const Color(0xFFDC2626);
    } else if (isHigh) {
      cardBorderColor = const Color(0xFFFFEDD5);
      cardGlowColor = const Color(0xFFF97316).withAlpha(14);
      iconBgColor = const Color(0xFFF97316);
      iconColor = Colors.white;
      hazardIcon = Icons.warning_rounded;
      tagBgColor = const Color(0xFFFFEDD5);
      tagTextColor = const Color(0xFFC2410C);
      tagLabel = 'High';
      viewButtonBg = const Color(0xFFFFEDD5);
      viewButtonText = const Color(0xFFEA580C);
    } else if (isMedium) {
      cardBorderColor = const Color(0xFFFEF08A);
      cardGlowColor = const Color(0xFFEAB308).withAlpha(12);
      iconBgColor = const Color(0xFFFEF3C7);
      iconColor = const Color(0xFF1E293B);
      hazardIcon = Icons.cloudy_snowing;
      tagBgColor = const Color(0xFFFEF3C7);
      tagTextColor = const Color(0xFFB45309);
      tagLabel = 'Medium';
      viewButtonBg = const Color(0xFFFEF9C3);
      viewButtonText = const Color(0xFFB45309);
    } else {
      cardBorderColor = const Color(0xFFDCFCE7);
      cardGlowColor = const Color(0xFF10B981).withAlpha(12);
      iconBgColor = const Color(0xFF10B981);
      iconColor = Colors.white;
      hazardIcon = Icons.info_rounded;
      tagBgColor = const Color(0xFFDCFCE7);
      tagTextColor = const Color(0xFF15803D);
      tagLabel = 'Low';
      viewButtonBg = null;
      viewButtonText = null;
    }

    final hasHelpline = (isCritical || isHigh) && alert.helpline != null;
    final hasViewButton = !isLow;

    return GestureDetector(
      onTap: () => _handleViewDetails(context),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: cardBorderColor, width: 1.2),
          boxShadow: [
            BoxShadow(
              color: cardGlowColor,
              blurRadius: 18,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Upper row: Icon + Details + Thumbnail
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Squircle Hazard Icon
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: iconBgColor,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Center(
                    child: Icon(
                      hazardIcon,
                      color: iconColor,
                      size: 24,
                    ),
                  ),
                ),
                const SizedBox(width: 12),

                // Middle detail column
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Tag and time row
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                            decoration: BoxDecoration(
                              color: tagBgColor,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              tagLabel,
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: tagTextColor,
                              ),
                            ),
                          ),
                          const Spacer(),
                          Text(
                            alert.timeAgoFormatted,
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                              color: Color(0xFF64748B),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),

                      // Title
                      Text(
                        alert.title,
                        style: const TextStyle(
                          fontSize: 16.5,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF0F243E),
                          letterSpacing: -0.2,
                        ),
                      ),
                      const SizedBox(height: 4),

                      // Location Pin and Region
                      Row(
                        children: [
                          const Icon(
                            Icons.location_on,
                            size: 14,
                            color: Color(0xFF64748B),
                          ),
                          const SizedBox(width: 3),
                          Expanded(
                            child: Text(
                              alert.region,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontSize: 12.5,
                                fontWeight: FontWeight.w500,
                                color: Color(0xFF64748B),
                              ),
                            ),
                          ),
                        ],
                      ),

                      // Subtitle / message for Low severity or brief note
                      if (isLow && alert.message.isNotEmpty) ...[
                        const SizedBox(height: 5),
                        Text(
                          alert.message,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(width: 12),

                // Right Thumbnail Image
                _buildThumbnail(context),
              ],
            ),

            // Bottom Action Row
            if (hasHelpline || hasViewButton) ...[
              const SizedBox(height: 14),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  if (hasHelpline)
                    _buildPillButton(
                      backgroundColor: const Color(0xFFEFF6FF),
                      textColor: const Color(0xFF2563EB),
                      icon: Icons.phone,
                      iconColor: const Color(0xFF2563EB),
                      label: 'Helpline ${alert.helpline ?? "1077"}',
                      onTap: () => _callHelpline(alert.helpline ?? '1077'),
                    )
                  else
                    const SizedBox.shrink(),

                  if (hasViewButton && viewButtonBg != null && viewButtonText != null)
                    _buildPillButton(
                      backgroundColor: viewButtonBg,
                      textColor: viewButtonText,
                      icon: Icons.chevron_right_rounded,
                      iconTrailing: true,
                      iconColor: viewButtonText,
                      label: 'View',
                      onTap: () => _handleViewDetails(context),
                    ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildThumbnail(BuildContext context) {
    Widget imageWidget;

    if (alert.assetImage != null && alert.assetImage!.isNotEmpty) {
      imageWidget = Image.asset(
        alert.assetImage!,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) => _buildFallbackThumbnail(),
      );
    } else if (alert.imageUrl != null && alert.imageUrl!.isNotEmpty) {
      imageWidget = Image.network(
        alert.imageUrl!,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) => _buildFallbackThumbnail(),
      );
    } else {
      final fallbackAsset = _getSmartAssetForAlert(alert);
      imageWidget = Image.asset(
        fallbackAsset,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) => _buildFallbackThumbnail(),
      );
    }

    return ClipRRect(
      borderRadius: BorderRadius.circular(14),
      child: SizedBox(
        width: 76,
        height: 76,
        child: imageWidget,
      ),
    );
  }

  Widget _buildFallbackThumbnail() {
    return Container(
      width: 76,
      height: 76,
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(14),
      ),
      child: const Icon(
        Icons.terrain_rounded,
        size: 32,
        color: Color(0xFF94A3B8),
      ),
    );
  }

  String _getSmartAssetForAlert(AlertModel item) {
    final title = item.title.toLowerCase();
    if (title.contains('landslide')) {
      return 'assets/images/alert_landslide.jpg';
    } else if (title.contains('road') || title.contains('blocked') || title.contains('nh-2')) {
      return 'assets/images/alert_road_blocked.jpg';
    } else if (title.contains('rain') || title.contains('flood') || title.contains('storm')) {
      return 'assets/images/alert_heavy_rainfall.jpg';
    } else {
      return 'assets/images/alert_normal_conditions.jpg';
    }
  }

  Widget _buildPillButton({
    required Color backgroundColor,
    required Color textColor,
    required String label,
    required VoidCallback onTap,
    IconData? icon,
    Color? iconColor,
    bool iconTrailing = false,
  }) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7.5),
        decoration: BoxDecoration(
          color: backgroundColor,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null && !iconTrailing) ...[
              Icon(icon, size: 14.5, color: iconColor ?? textColor),
              const SizedBox(width: 6),
            ],
            Text(
              label,
              style: TextStyle(
                fontSize: 12.5,
                fontWeight: FontWeight.w700,
                color: textColor,
              ),
            ),
            if (icon != null && iconTrailing) ...[
              const SizedBox(width: 4),
              Icon(icon, size: 16, color: iconColor ?? textColor),
            ],
          ],
        ),
      ),
    );
  }

  Future<void> _callHelpline(String number) async {
    final uri = Uri.parse('tel:$number');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  void _handleViewDetails(BuildContext context) {
    if (onViewDetails != null) {
      onViewDetails!();
      return;
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _buildDetailSheet(ctx),
    );
  }

  Widget _buildDetailSheet(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 44,
              height: 4,
              margin: const EdgeInsets.only(bottom: 18),
              decoration: BoxDecoration(
                color: const Color(0xFFCBD5E1),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: alert.severity == AlertSeverity.critical
                      ? const Color(0xFFFEE2E2)
                      : (alert.severity == AlertSeverity.high
                          ? const Color(0xFFFFEDD5)
                          : const Color(0xFFFEF3C7)),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  alert.severity.name.toUpperCase(),
                  style: TextStyle(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w800,
                    color: alert.severity == AlertSeverity.critical
                        ? const Color(0xFFDC2626)
                        : (alert.severity == AlertSeverity.high
                            ? const Color(0xFFC2410C)
                            : const Color(0xFFB45309)),
                  ),
                ),
              ),
              const Spacer(),
              Text(
                alert.timeAgoFormatted,
                style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            alert.title,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: Color(0xFF0F243E),
            ),
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              const Icon(Icons.location_on, size: 15, color: Color(0xFF64748B)),
              const SizedBox(width: 4),
              Text(
                alert.region,
                style: const TextStyle(fontSize: 13, color: Color(0xFF64748B), fontWeight: FontWeight.w500),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: SizedBox(
              height: 160,
              width: double.infinity,
              child: Image.asset(
                alert.assetImage ?? _getSmartAssetForAlert(alert),
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => Container(
                  color: const Color(0xFFF1F5F9),
                  child: const Center(
                    child: Icon(Icons.terrain_rounded, size: 48, color: Color(0xFF94A3B8)),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'Situation Overview',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF0F243E)),
          ),
          const SizedBox(height: 4),
          Text(
            alert.message,
            style: const TextStyle(fontSize: 13.5, color: Color(0xFF334155), height: 1.4),
          ),
          if (alert.instructions != null && alert.instructions!.isNotEmpty) ...[
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFEFF6FF),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFBFDBFE)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.shield_outlined, size: 18, color: Color(0xFF2563EB)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Safety Instructions',
                          style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: Color(0xFF1E40AF)),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          alert.instructions!,
                          style: const TextStyle(fontSize: 12, color: Color(0xFF1E3A8A), height: 1.35),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 20),
          Row(
            children: [
              if (alert.helpline != null)
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => _callHelpline(alert.helpline!),
                    icon: const Icon(Icons.phone, size: 16),
                    label: Text('Call ${alert.helpline}'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF2563EB),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      padding: const EdgeInsets.symmetric(vertical: 13),
                    ),
                  ),
                ),
              if (alert.helpline != null) const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton(
                  onPressed: () {
                    onAcknowledge();
                    Navigator.pop(context);
                  },
                  style: OutlinedButton.styleFrom(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    padding: const EdgeInsets.symmetric(vertical: 13),
                    side: const BorderSide(color: Color(0xFFCBD5E1)),
                  ),
                  child: const Text('Dismiss Alert'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
