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
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        expand: false,
        builder: (_, controller) => ZoneDetailSheet(zone: zone),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // OUT_OF_COVERAGE — never display as LOW risk
    if (zone.isOutOfCoverage) {
      return _OutOfCoverageSheet(zone: zone);
    }

    final isCritical = zone.riskLevel == RiskLevel.critical;
    final isHigh = zone.riskLevel == RiskLevel.high;
    final riskColor = isCritical
        ? AppColors.riskCritical
        : (isHigh ? AppColors.riskHigh : AppColors.riskMedium);

    final riskLabel = isCritical
        ? 'Critical Landslide Risk'
        : isHigh
            ? 'High Landslide Risk'
            : '${_capitalize(zone.riskLevel.name)} Landslide Risk';

    final scoreText = zone.riskScore != null
        ? '${(zone.riskScore! * 100).toInt()}%'
        : '--';

    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(26)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      child: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Drag handle
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

              // Zone header
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          riskLabel,
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
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: riskColor.withAlpha(25),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Text(
                      '$scoreText Risk',
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
              const SizedBox(height: 14),

              // ----------------------------------------------------------------
              // Model 3 Historical Pre-Event Condition (truthful label)
              // ----------------------------------------------------------------
              if (zone.historicalConditionWindow.isNotEmpty)
                _InfoBanner(
                  icon: Icons.history_rounded,
                  label: 'Historical Pre-Event Condition Similarity',
                  value: zone.historicalConditionWindow,
                  color: AppColors.deepBlue,
                ),

              const SizedBox(height: 14),

              // ----------------------------------------------------------------
              // Model Outputs — 4-panel breakdown
              // ----------------------------------------------------------------
              const Text(
                'ML Model Results:',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 10),

              _ModelResultCard(
                modelLabel: 'Model 1 · Static Susceptibility',
                statusLabel: zone.modelOutputs.staticSusceptibility.category,
                scoreText: zone.modelOutputs.staticSusceptibility.score != null
                    ? '${(zone.modelOutputs.staticSusceptibility.score! * 100).toStringAsFixed(1)}%'
                    : null,
                statusColor: _categoryColor(
                    zone.modelOutputs.staticSusceptibility.category),
                modelType:
                    zone.modelOutputs.staticSusceptibility.modelType,
                isAvailable: zone.modelOutputs.staticSusceptibility.status ==
                    'AVAILABLE',
              ),
              const SizedBox(height: 8),

              _ModelResultCard(
                modelLabel: 'Model 2 · Dynamic Hazard Trigger',
                statusLabel: zone.modelOutputs.dynamicHazard.triggerState,
                scoreText: zone.modelOutputs.dynamicHazard.score != null
                    ? '${(zone.modelOutputs.dynamicHazard.score! * 100).toStringAsFixed(1)}%'
                    : null,
                statusColor:
                    _triggerColor(zone.modelOutputs.dynamicHazard.triggerState),
                modelType: zone.modelOutputs.dynamicHazard.modelType,
                isAvailable:
                    zone.modelOutputs.dynamicHazard.status == 'AVAILABLE',
              ),
              const SizedBox(height: 8),

              _ModelResultCard(
                modelLabel: 'Model 3 · Historical Pre-Event Similarity',
                statusLabel: _model3Label(
                    zone.modelOutputs.leadWindow.conditionClass),
                scoreText: zone.modelOutputs.leadWindow.similarityScore != null
                    ? '${(zone.modelOutputs.leadWindow.similarityScore! * 100).toStringAsFixed(1)}% match'
                    : null,
                statusColor: _conditionClassColor(
                    zone.modelOutputs.leadWindow.conditionClass),
                modelType: zone.modelOutputs.leadWindow.modelType,
                isAvailable:
                    zone.modelOutputs.leadWindow.status == 'AVAILABLE',
                subtitle: zone.modelOutputs.leadWindow.description.isNotEmpty
                    ? zone.modelOutputs.leadWindow.description
                    : null,
              ),
              const SizedBox(height: 8),

              _ModelResultCard(
                modelLabel: 'Model 4 · Multi-Modal Fused Risk',
                statusLabel: zone.modelOutputs.fusion.riskLevel,
                scoreText: zone.modelOutputs.fusion.score != null
                    ? '${zone.modelOutputs.fusion.score!.toStringAsFixed(1)}/100'
                    : null,
                statusColor:
                    _riskLevelColor(zone.modelOutputs.fusion.riskLevel),
                modelType: zone.modelOutputs.fusion.modelType,
                isAvailable:
                    zone.modelOutputs.fusion.status == 'AVAILABLE',
              ),

              const SizedBox(height: 16),
              const Divider(color: AppColors.divider, height: 1),
              const SizedBox(height: 14),

              // ----------------------------------------------------------------
              // Sensor / Data Source Status
              // ----------------------------------------------------------------
              const Text(
                'Data Source Status:',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 10),

              _SensorStatusRow(
                label: 'NISAR InSAR (80m)',
                source: 'ISRO-NASA Joint Mission · Bhoonidhi',
                status: zone.nisarStatus.status,
                qualityLabel: _nisarQualityLabel(zone.nisarStatus),
                qualityColor: _nisarQualityColor(zone.nisarStatus),
                valueLabel: zone.nisarStatus.deformationMm != null
                    ? '${zone.nisarStatus.deformationMm!.toStringAsFixed(1)} mm LOS'
                    : null,
                coherenceLabel: zone.nisarStatus.coherence != null
                    ? 'Coherence: ${zone.nisarStatus.coherence!.toStringAsFixed(3)}'
                    : null,
                icon: Icons.radar_outlined,
              ),
              const SizedBox(height: 8),

              _SensorStatusRow(
                label: 'EOS-04 Soil Moisture (500m)',
                source: 'ISRO Bhoonidhi SAR MRS Level-4',
                status: zone.eos04Status.status,
                qualityLabel: zone.eos04Status.isAvailable ? 'GOOD' : 'NOT_APPLICABLE',
                qualityColor: zone.eos04Status.isAvailable
                    ? const Color(0xFF059669)
                    : const Color(0xFF94A3B8),
                valueLabel: zone.eos04Status.soilMoisturePct != null
                    ? '${zone.eos04Status.soilMoisturePct!.toStringAsFixed(1)}% saturation'
                    : null,
                icon: Icons.grass_outlined,
              ),

              const SizedBox(height: 16),
              const Divider(color: AppColors.divider, height: 1),
              const SizedBox(height: 14),

              // ----------------------------------------------------------------
              // Sensor Telemetry Chips (rainfall, soil, slope)
              // ----------------------------------------------------------------
              const Text(
                'Detected Factors:',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 10),

              Row(
                children: [
                  Expanded(
                    child: _buildFactorChip(
                      '24h Rainfall',
                      zone.factors.rainfall24hMm != null
                          ? '${zone.factors.rainfall24hMm!.toStringAsFixed(1)} mm'
                          : 'N/A',
                      Icons.water_drop_outlined,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _buildFactorChip(
                      'Soil Saturation',
                      zone.factors.soilMoisturePct != null
                          ? '${zone.factors.soilMoisturePct!.toStringAsFixed(1)}%'
                          : 'UNAVAILABLE',
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
                      zone.factors.slopeDegrees != null
                          ? '${zone.factors.slopeDegrees!.toStringAsFixed(1)}°'
                          : 'N/A',
                      Icons.landscape_outlined,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _buildFactorChip(
                      'NISAR InSAR',
                      zone.nisarStatus.isAvailable &&
                              zone.nisarStatus.deformationMm != null
                          ? '${zone.nisarStatus.deformationMm!.toStringAsFixed(1)} mm'
                          : 'UNAVAILABLE',
                      Icons.radar_outlined,
                    ),
                  ),
                ],
              ),

              // Contributing factors
              if (zone.contributingFactors.isNotEmpty) ...[
                const SizedBox(height: 16),
                const Text(
                  'Contributing Factors:',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                ...zone.contributingFactors.take(4).map(
                      (f) => Padding(
                        padding: const EdgeInsets.only(bottom: 4),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('• ',
                                style: TextStyle(
                                    color: AppColors.textSecondary,
                                    fontSize: 12)),
                            Expanded(
                              child: Text(
                                f,
                                style: const TextStyle(
                                  fontSize: 11.5,
                                  color: AppColors.textSecondary,
                                  height: 1.4,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
              ],

              const SizedBox(height: 14),
              Row(
                children: [
                  const Icon(Icons.access_time_rounded,
                      size: 14, color: AppColors.textMuted),
                  const SizedBox(width: 6),
                  Text(
                    'Last Updated: ${DateFormatter.formatDateTime(zone.lastUpdated)}',
                    style: const TextStyle(
                        fontSize: 12, color: AppColors.textMuted),
                  ),
                ],
              ),

              const SizedBox(height: 18),

              ElevatedButton.icon(
                onPressed: () async {
                  final uri = Uri.parse('tel:1077');
                  if (await canLaunchUrl(uri)) {
                    await launchUrl(uri);
                  }
                },
                icon: const Icon(Icons.phone_in_talk_rounded,
                    color: Colors.white, size: 18),
                label: const Text('Call Disaster Helpline (1077)'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.blue,
                  minimumSize: const Size.fromHeight(50),
                ),
              ),
              const SizedBox(height: 8),
            ],
          ),
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
                Text(label,
                    style: const TextStyle(
                        fontSize: 11, color: AppColors.textSecondary)),
                Text(value,
                    style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _capitalize(String s) =>
      s.isEmpty ? s : '${s[0].toUpperCase()}${s.substring(1)}';

  Color _categoryColor(String cat) {
    switch (cat.toUpperCase()) {
      case 'VERY_HIGH':
      case 'HIGH':
        return const Color(0xFFDC2626);
      case 'MODERATE':
        return const Color(0xFFD97706);
      case 'LOW':
        return const Color(0xFF059669);
      default:
        return const Color(0xFF94A3B8);
    }
  }

  Color _triggerColor(String state) {
    switch (state.toUpperCase()) {
      case 'CRITICAL_TRIGGER':
        return const Color(0xFFDC2626);
      case 'WARNING_TRIGGER':
        return const Color(0xFFD97706);
      case 'WATCH':
        return const Color(0xFFF59E0B);
      case 'BASELINE':
        return const Color(0xFF059669);
      default:
        return const Color(0xFF94A3B8);
    }
  }

  Color _conditionClassColor(int? cls) {
    if (cls == 2) return const Color(0xFFDC2626);
    if (cls == 1) return const Color(0xFFD97706);
    if (cls == 0) return const Color(0xFF059669);
    return const Color(0xFF94A3B8);
  }

  Color _riskLevelColor(String level) {
    switch (level.toUpperCase()) {
      case 'CRITICAL':
        return const Color(0xFFDC2626);
      case 'HIGH':
        return const Color(0xFFEA580C);
      case 'MEDIUM':
        return const Color(0xFFD97706);
      case 'LOW':
        return const Color(0xFF059669);
      default:
        return const Color(0xFF94A3B8);
    }
  }

  String _model3Label(int? cls) {
    if (cls == 2) return 'Critical Pre-Event Pattern';
    if (cls == 1) return 'Elevated Antecedent Buildup';
    if (cls == 0) return 'Baseline Non-Triggering';
    return 'UNAVAILABLE';
  }

  String _nisarQualityLabel(NisarStatus nisar) {
    if (nisar.status == 'OUT_OF_COVERAGE') return 'OUT_OF_COVERAGE';
    if (!nisar.isAvailable) return 'UNAVAILABLE';
    return nisar.quality;
  }

  Color _nisarQualityColor(NisarStatus nisar) {
    if (!nisar.isAvailable) return const Color(0xFF94A3B8);
    switch (nisar.quality) {
      case 'GOOD':
        return const Color(0xFF059669);
      case 'MODERATE':
        return const Color(0xFFD97706);
      case 'LOW_QUALITY':
        return const Color(0xFFDC2626);
      default:
        return const Color(0xFF94A3B8);
    }
  }
}

// ---------------------------------------------------------------------------
// OUT_OF_COVERAGE Sheet
// ---------------------------------------------------------------------------

class _OutOfCoverageSheet extends StatelessWidget {
  final ZoneRiskModel zone;
  const _OutOfCoverageSheet({required this.zone});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(26)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
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
            const SizedBox(height: 24),
            const Icon(Icons.location_off_outlined,
                size: 48, color: Color(0xFF94A3B8)),
            const SizedBox(height: 16),
            const Text(
              'Outside Supported Monitoring Area',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 10),
            Text(
              zone.zoneName.isNotEmpty ? zone.zoneName : 'Unknown Location',
              textAlign: TextAlign.center,
              style: const TextStyle(
                  fontSize: 14, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Text(
                'This coordinate is outside the operational Meghalaya / NER '
                'monitoring domain. ISRO CartoDEM, IMD radar, NISAR, and '
                'EOS-04 sensor feeds are unavailable for this location.\n\n'
                'No risk score can be computed. Parvaah does not invent '
                'predictions for unsupported areas.',
                textAlign: TextAlign.center,
                style: TextStyle(
                    fontSize: 13,
                    color: AppColors.textSecondary,
                    height: 1.5),
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Close'),
              ),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Shared sub-widgets
// ---------------------------------------------------------------------------

class _InfoBanner extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _InfoBanner({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withAlpha(20),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withAlpha(40)),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: color)),
                const SizedBox(height: 2),
                Text(value,
                    style: const TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w500,
                        color: AppColors.navy,
                        height: 1.4)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ModelResultCard extends StatelessWidget {
  final String modelLabel;
  final String statusLabel;
  final String? scoreText;
  final Color statusColor;
  final String modelType;
  final bool isAvailable;
  final String? subtitle;

  const _ModelResultCard({
    required this.modelLabel,
    required this.statusLabel,
    this.scoreText,
    required this.statusColor,
    required this.modelType,
    required this.isAvailable,
    this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(modelLabel,
                        style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary)),
                    Text(modelType,
                        style: const TextStyle(
                            fontSize: 10, color: AppColors.textMuted)),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: isAvailable
                          ? statusColor.withAlpha(25)
                          : const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      statusLabel,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: isAvailable
                            ? statusColor
                            : const Color(0xFF94A3B8),
                      ),
                    ),
                  ),
                  if (scoreText != null) ...[
                    const SizedBox(height: 2),
                    Text(scoreText!,
                        style: const TextStyle(
                            fontSize: 11, color: AppColors.textSecondary)),
                  ],
                ],
              ),
            ],
          ),
          if (subtitle != null && subtitle!.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(subtitle!,
                style: const TextStyle(
                    fontSize: 10.5,
                    color: AppColors.textSecondary,
                    height: 1.3)),
          ],
        ],
      ),
    );
  }
}

class _SensorStatusRow extends StatelessWidget {
  final String label;
  final String source;
  final String status;
  final String qualityLabel;
  final Color qualityColor;
  final String? valueLabel;
  final String? coherenceLabel;
  final IconData icon;

  const _SensorStatusRow({
    required this.label,
    required this.source,
    required this.status,
    required this.qualityLabel,
    required this.qualityColor,
    this.valueLabel,
    this.coherenceLabel,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final isAvailable = status == 'AVAILABLE';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: isAvailable
                  ? const Color(0xFFDBEAFE)
                  : const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon,
                size: 18,
                color: isAvailable
                    ? const Color(0xFF2563EB)
                    : const Color(0xFF94A3B8)),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary)),
                Text(source,
                    style: const TextStyle(
                        fontSize: 10, color: AppColors.textMuted)),
                if (valueLabel != null) ...[
                  const SizedBox(height: 2),
                  Text(valueLabel!,
                      style: const TextStyle(
                          fontSize: 11, color: AppColors.textSecondary)),
                ],
                if (coherenceLabel != null)
                  Text(coherenceLabel!,
                      style: const TextStyle(
                          fontSize: 10, color: AppColors.textMuted)),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                decoration: BoxDecoration(
                  color: isAvailable
                      ? const Color(0xFFDCFCE7)
                      : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  status,
                  style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: isAvailable
                          ? const Color(0xFF059669)
                          : const Color(0xFF94A3B8)),
                ),
              ),
              const SizedBox(height: 3),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                decoration: BoxDecoration(
                  color: qualityColor.withAlpha(20),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  qualityLabel,
                  style: TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.w600,
                      color: qualityColor),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
