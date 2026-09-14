import 'package:flutter/material.dart';
import '../../../data/models/zone_risk_model.dart';
import '../../../core/utils/date_formatter.dart';

class RiskMapBottomCard extends StatelessWidget {
  final ZoneRiskModel zone;
  final VoidCallback onViewDetails;

  const RiskMapBottomCard({
    super.key,
    required this.zone,
    required this.onViewDetails,
  });

  @override
  Widget build(BuildContext context) {
    // OUT_OF_COVERAGE — never display as Low Risk
    if (zone.isOutOfCoverage) {
      return _buildOutOfCoverageCard();
    }

    final isCritical = zone.riskLevel == RiskLevel.critical;
    final isHigh = zone.riskLevel == RiskLevel.high;
    final isModerate = zone.riskLevel == RiskLevel.elevated || zone.riskLevel == RiskLevel.medium;

    Color badgeColor;
    Color badgeBg;
    String badgeText;

    if (isCritical || isHigh) {
      badgeColor = const Color(0xFFDC2626); // Crimson/Red
      badgeBg = const Color(0xFFFEE2E2);
      badgeText = 'High';
    } else if (isModerate) {
      badgeColor = const Color(0xFFD97706); // Amber
      badgeBg = const Color(0xFFFEF3C7);
      badgeText = 'Moderate';
    } else {
      badgeColor = const Color(0xFF16A34A); // Green
      badgeBg = const Color(0xFFDCFCE7);
      badgeText = 'Safe';
    }

    // Extract clean display name (e.g. "Sohra" from "Sohra (Cherrapunji) Sector A")
    final displayName = zone.zoneName.contains('(')
        ? zone.zoneName.split('(').first.trim()
        : zone.zoneName.split(' ').first.trim();

    return Container(
      padding: const EdgeInsets.fromLTRB(18, 10, 18, 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F243E).withAlpha(25),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
        border: Border.all(color: const Color(0xFFE2E8F0), width: 1.0),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag Handle
          Center(
            child: Container(
              width: 38,
              height: 4,
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(
                color: const Color(0xFFCBD5E1),
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),

          // First Row: Red Squircle Badge + Title/District + Risk Pill
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Left Hazard Squircle Badge
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: badgeBg,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Center(
                  child: Icon(
                    Icons.terrain_rounded,
                    color: badgeColor,
                    size: 26,
                  ),
                ),
              ),
              const SizedBox(width: 14),

              // Title & District
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      displayName,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF0F243E),
                        letterSpacing: -0.4,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Row(
                      children: [
                        const Icon(
                          Icons.location_on_rounded,
                          size: 14,
                          color: Color(0xFF64748B),
                        ),
                        const SizedBox(width: 3),
                        Text(
                          zone.district,
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                            color: Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // Right Risk Badge Pill (e.g. "High")
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                decoration: BoxDecoration(
                  color: badgeBg,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Text(
                  badgeText,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: badgeColor,
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 14),
          const Divider(color: Color(0xFFF1F5F9), height: 1, thickness: 1),
          const SizedBox(height: 12),

          // Second Row: 3 Info Chips with Vertical Dividers
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              // Chip 1: Landslide Risk
              Row(
                mainAxisSize: MainAxisSize.min,
                children: const [
                  Icon(
                    Icons.landscape_rounded,
                    size: 16,
                    color: Color(0xFF475569),
                  ),
                  SizedBox(width: 6),
                  Text(
                    'Landslide Risk',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF475569),
                    ),
                  ),
                ],
              ),

              // Vertical Divider
              Container(width: 1, height: 16, color: const Color(0xFFE2E8F0)),

              // Chip 2: Heavy Rain
              Row(
                mainAxisSize: MainAxisSize.min,
                children: const [
                  Icon(
                    Icons.water_drop_rounded,
                    size: 16,
                    color: Color(0xFF0284C7),
                  ),
                  SizedBox(width: 6),
                  Text(
                    'Heavy Rain',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF475569),
                    ),
                  ),
                ],
              ),

              // Vertical Divider
              Container(width: 1, height: 16, color: const Color(0xFFE2E8F0)),

              // Chip 3: Updated time
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.access_time_rounded,
                    size: 15,
                    color: Color(0xFF64748B),
                  ),
                  const SizedBox(width: 5),
                  Text(
                    'Updated ${DateFormatter.formatRelative(zone.lastUpdated)}',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ],
          ),

          const SizedBox(height: 14),

          // Third Row: Full-width Blue Action Button "View Details >"
          GestureDetector(
            onTap: onViewDetails,
            child: Container(
              width: double.infinity,
              height: 48,
              decoration: BoxDecoration(
                color: const Color(0xFF1E88E5), // Parvaah Blue
                borderRadius: BorderRadius.circular(14),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF1E88E5).withAlpha(80),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: const [
                  Text(
                    'View Details',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -0.2,
                    ),
                  ),
                  SizedBox(width: 6),
                  Icon(
                    Icons.chevron_right_rounded,
                    color: Colors.white,
                    size: 20,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOutOfCoverageCard() {
    return Container(
      padding: const EdgeInsets.fromLTRB(18, 10, 18, 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F243E).withAlpha(25),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
        border: Border.all(color: const Color(0xFFE2E8F0), width: 1.0),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Center(
            child: Container(
              width: 38,
              height: 4,
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(
                color: const Color(0xFFCBD5E1),
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
          Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Center(
                  child: Icon(
                    Icons.location_off_outlined,
                    color: Color(0xFF94A3B8),
                    size: 24,
                  ),
                ),
              ),
              const SizedBox(width: 14),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'Outside Monitoring Area',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF0F243E),
                      ),
                    ),
                    SizedBox(height: 3),
                    Text(
                      'Not within Meghalaya / NER operational zone',
                      style: TextStyle(
                        fontSize: 12,
                        color: Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text(
                  'N/A',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF94A3B8),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          GestureDetector(
            onTap: onViewDetails,
            child: Container(
              width: double.infinity,
              height: 44,
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Center(
                child: Text(
                  'View Coverage Details',
                  style: TextStyle(
                    color: Color(0xFF475569),
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
