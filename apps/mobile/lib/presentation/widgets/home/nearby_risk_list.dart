import 'package:flutter/material.dart';

class NearbyRiskRowData {
  final String title;
  final String location;
  final String level;
  final Color levelColor;
  final Color levelBg;
  final IconData icon;
  final Color iconColor;
  final Color iconBg;

  const NearbyRiskRowData({
    required this.title,
    required this.location,
    required this.level,
    required this.levelColor,
    required this.levelBg,
    required this.icon,
    required this.iconColor,
    required this.iconBg,
  });
}

class NearbyRiskList extends StatelessWidget {
  final List<NearbyRiskRowData> items;
  final VoidCallback? onViewAll;
  final Function(NearbyRiskRowData)? onItemTap;

  const NearbyRiskList({
    super.key,
    this.items = const [],
    this.onViewAll,
    this.onItemTap,
  });

  @override
  Widget build(BuildContext context) {

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section Header: "Nearby Risk Status" and "View All >"
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            const Text(
              'Nearby Risk Status',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: Color(0xFF0F243E),
                letterSpacing: -0.4,
              ),
            ),
            if (onViewAll != null)
              GestureDetector(
                onTap: onViewAll,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: const [
                    Text(
                      'View All',
                      style: TextStyle(
                        fontSize: 13.5,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF1E88E5),
                      ),
                    ),
                    SizedBox(width: 2),
                    Icon(
                      Icons.chevron_right_rounded,
                      size: 17,
                      color: Color(0xFF1E88E5),
                    ),
                  ],
                ),
              ),
          ],
        ),
        const SizedBox(height: 14),

        // List Container Card
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(0xFFE2E8F0), width: 1.0),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF0F243E).withAlpha(10),
                blurRadius: 12,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: items.isEmpty
              ? Padding(
                  padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
                  child: Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: const [
                        Icon(
                          Icons.check_circle_outline_rounded,
                          color: Color(0xFF10B981),
                          size: 32,
                        ),
                        SizedBox(height: 8),
                        Text(
                          'No immediate hazards detected nearby',
                          style: TextStyle(
                            fontSize: 13.5,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              : ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                  itemCount: items.length,
            separatorBuilder: (context, index) => const Divider(
              color: Color(0xFFF1F5F9),
              height: 1,
              thickness: 1,
            ),
            itemBuilder: (context, index) {
              final row = items[index];
              return InkWell(
                onTap: () => onItemTap?.call(row),
                borderRadius: BorderRadius.circular(12),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
                  child: Row(
                    children: [
                      // Hazard Icon
                      Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          color: row.iconBg.withAlpha(160),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Center(
                          child: Icon(
                            row.icon,
                            color: row.iconColor,
                            size: 20,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),

                      // Title
                      Expanded(
                        flex: 5,
                        child: Text(
                          row.title,
                          style: const TextStyle(
                            fontSize: 13.5,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF0F243E),
                            letterSpacing: -0.2,
                          ),
                        ),
                      ),

                      // Location Pin + District Name
                      Expanded(
                        flex: 4,
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.location_on_rounded,
                              size: 13,
                              color: Color(0xFF64748B),
                            ),
                            const SizedBox(width: 3),
                            Flexible(
                              child: Text(
                                row.location,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                  color: Color(0xFF64748B),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),

                      // Risk Status Pill Badge
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: row.levelBg,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          row.level,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: row.levelColor,
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),

                      // Trailing Chevron
                      const Icon(
                        Icons.chevron_right_rounded,
                        size: 18,
                        color: Color(0xFF94A3B8),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
