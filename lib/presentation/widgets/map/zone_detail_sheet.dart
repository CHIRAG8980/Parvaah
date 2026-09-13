import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/models/zone_risk_model.dart';
import '../../../core/utils/date_formatter.dart';

class ZoneDetailSheet extends StatelessWidget {
  final ZoneRiskModel zone;

  const ZoneDetailSheet({super.key, required this.zone});

  static void show(BuildContext context, ZoneRiskModel zone) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => ZoneDetailSheet(zone: zone),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isCritical = zone.riskLevel == RiskLevel.critical;
    final isHigh = zone.riskLevel == RiskLevel.high;
    final riskColor = isCritical
        ? AppColors.riskCritical
        : (isHigh ? AppColors.riskHigh : AppColors.riskMedium);

    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(26)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Center drag handle
            Center(
              child: Container(
                width: 44,
                height: 4.5,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
            const SizedBox(height: 18),

            // Header with severity and zone name
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isCritical ? 'Critical Landslide Risk' : 'High Landslide Risk',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: riskColor,
                          letterSpacing: -0.3,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        zone.zoneName,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${zone.district}, ${zone.state}',
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: riskColor.withAlpha(25),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Text(
                    '${(zone.riskScore * 100).toInt()}% Risk',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      color: riskColor,
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 16),
            const Divider(color: AppColors.divider, height: 1),
            const SizedBox(height: 16),

            // Time to Failure & Failure Warning
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.lightBlueBg,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.deepBlue.withAlpha(30)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.timer_outlined, color: AppColors.deepBlue, size: 20),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      zone.timeToFailure,
                      style: const TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w600,
                        color: AppColors.navy,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),
            const Text(
              'Detected Factors:',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 10),

            // Sensor Telemetry Grid
            Row(
              children: [
                Expanded(
                  child: _buildFactorChip(
                    '24h Rainfall',
                    '${zone.factors.rainfall24hMm.toStringAsFixed(1)} mm',
                    Icons.water_drop_outlined,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _buildFactorChip(
                    'Soil Saturation',
                    '${zone.factors.soilMoisturePct.toStringAsFixed(1)}%',
                    Icons.grass_outlined,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: _buildFactorChip(
                    'Slope Angle',
                    '${zone.factors.slopeDegrees.toStringAsFixed(1)}°',
                    Icons.landscape_outlined,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _buildFactorChip(
                    'InSAR Drift',
                    '${zone.factors.insarDeformationMmYr.toStringAsFixed(1)} mm/yr',
                    Icons.radar_outlined,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 18),
            Row(
              children: [
                const Icon(Icons.access_time_rounded, size: 14, color: AppColors.textMuted),
                const SizedBox(width: 6),
                Text(
                  'Last Updated: ${DateFormatter.formatDateTime(zone.lastUpdated)}',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textMuted,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 18),

            // Primary Emergency Helpline Action
            ElevatedButton.icon(
              onPressed: () async {
                final uri = Uri.parse('tel:1077');
                if (await canLaunchUrl(uri)) {
                  await launchUrl(uri);
                }
              },
              icon: const Icon(Icons.phone_in_talk_rounded, color: Colors.white, size: 18),
              label: const Text('Call Disaster Helpline (1077)'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.blue,
                minimumSize: const Size.fromHeight(50),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFactorChip(String label, String value, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppColors.deepBlue),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.textSecondary,
                  ),
                ),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
