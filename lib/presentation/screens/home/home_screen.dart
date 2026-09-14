import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/models/zone_risk_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/risk_provider.dart';
import '../../providers/alert_provider.dart';
import '../../providers/road_provider.dart';
import '../../providers/safety_provider.dart';
import '../../providers/location_provider.dart';
import '../../providers/notification_provider.dart';
import '../../../data/models/road_status_model.dart';
import '../../widgets/common/parvaah_logo.dart';
import '../../widgets/home/active_alert_card.dart';
import '../../widgets/home/quick_action_grid.dart';
import '../../widgets/home/overview_metrics.dart';
import '../../widgets/home/nearby_risk_list.dart';
import '../../widgets/home/safety_carousel.dart';
import '../../widgets/map/zone_detail_sheet.dart';
import '../safety/safety_detail_screen.dart';
import '../notifications/notification_center_screen.dart';

class HomeScreen extends StatelessWidget {
  final Function(int)? onNavigateTab;

  const HomeScreen({super.key, this.onNavigateTab});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final riskProvider = context.watch<RiskProvider>();
    final alertProvider = context.watch<AlertProvider>();
    final locationProvider = context.watch<LocationProvider>();
    final notifProvider = context.watch<NotificationProvider>();

    final activeZone = locationProvider.selectedZone;

    // Determine initial letter for avatar (default 'P' for Parvaah or user initial)
    final avatarLetter = auth.user.name.isNotEmpty ? auth.user.name[0].toUpperCase() : 'P';
    final roadProvider = context.watch<RoadProvider>();
    final safetyProvider = context.watch<SafetyProvider>();

    final primaryAlert = alertProvider.primaryActiveAlert;
    final hasActiveAlert = primaryAlert != null;

    final alertTitle = hasActiveAlert ? primaryAlert.title : 'All Monitored Zones Stable';
    final alertSubtitle = hasActiveAlert
        ? '${primaryAlert.region} • ${primaryAlert.severity.name.toUpperCase()}'
        : 'No critical hazard alerts detected';

    final nearbyRiskRows = riskProvider.zones.map((zone) {
      final isCritOrHigh = zone.riskLevel == RiskLevel.critical || zone.riskLevel == RiskLevel.high;
      final isElevated = zone.riskLevel == RiskLevel.elevated;

      final Color levelColor = isCritOrHigh
          ? const Color(0xFFDC2626)
          : (isElevated ? const Color(0xFFD97706) : const Color(0xFF059669));
      final Color levelBg = isCritOrHigh
          ? const Color(0xFFFEE2E2)
          : (isElevated ? const Color(0xFFFEF3C7) : const Color(0xFFDCFCE7));

      IconData icon;
      Color iconColor;
      Color iconBg;

      if (isCritOrHigh) {
        icon = Icons.landslide_rounded;
        iconColor = const Color(0xFFEA580C);
        iconBg = const Color(0xFFFFEDD5);
      } else if (isElevated) {
        icon = Icons.water_drop_rounded;
        iconColor = const Color(0xFF2563EB);
        iconBg = const Color(0xFFDBEAFE);
      } else {
        icon = Icons.shield_rounded;
        iconColor = const Color(0xFF059669);
        iconBg = const Color(0xFFD1FAE5);
      }

      return NearbyRiskRowData(
        title: '${zone.riskLevel.name[0].toUpperCase()}${zone.riskLevel.name.substring(1)} Risk Alert',
        location: '${zone.zoneName}, ${zone.state}',
        level: zone.riskScore != null ? '${(zone.riskScore! * 100).toInt()}% Risk' : 'N/A',
        levelColor: levelColor,
        levelBg: levelBg,
        icon: icon,
        iconColor: iconColor,
        iconBg: iconBg,
      );
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC), // Crisp light slate background matching theme
      body: AnnotatedRegion<SystemUiOverlayStyle>(
        value: const SystemUiOverlayStyle(
          statusBarColor: Colors.transparent,
          statusBarIconBrightness: Brightness.dark,
        ),
        child: RefreshIndicator(
          onRefresh: () async {
            await riskProvider.loadRisks();
            await alertProvider.loadAlerts();
            await roadProvider.loadRoads();
            await safetyProvider.loadArticles();
            notifProvider.syncFromAlerts(alertProvider.allAlerts);
          },
          color: const Color(0xFF1E88E5),
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 1. Pristine Scenic Mountain Hero Section with Integrated Header, Slogan & Search Bar
                _buildHeroHeader(context, activeZone, locationProvider, notifProvider, avatarLetter),

                // 2. Main Content Body with 18px horizontal padding
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 16),

                      // Urgent Hazard Alert Banner or Normal Status Banner
                      ActiveAlertCard(
                        title: alertTitle,
                        subtitle: alertSubtitle,
                        isSafe: !hasActiveAlert,
                        onTap: () {
                          if (hasActiveAlert && onNavigateTab != null) {
                            onNavigateTab!(2); // Alerts tab
                          } else {
                            ZoneDetailSheet.show(context, activeZone);
                          }
                        },
                      ),

                      const SizedBox(height: 18),

                      // Single Horizontal Row of 4 Quick Action Cards (Risk Map, Weather, Road Status, Alerts)
                      QuickActionGrid(
                        onMapTap: () {
                          if (onNavigateTab != null) onNavigateTab!(1); // Map tab
                        },
                        onWeatherTap: () {
                          _showWeatherSheet(context, activeZone);
                        },
                        onRoadStatusTap: () {
                          _showRoadsSheet(context, roadProvider);
                        },
                        onAlertsTap: () {
                          if (onNavigateTab != null) onNavigateTab!(2); // Alerts tab
                        },
                      ),

                      const SizedBox(height: 22),

                      // Today's Overview (3 Cards: High Risk, Affected Roads, Safe Routes)
                      OverviewMetrics(
                        highRiskCount: riskProvider.highRiskAreasCount,
                        affectedRoadsCount: roadProvider.blockedRoads.length + roadProvider.atRiskRoads.length,
                        safeRoutesCount: roadProvider.openRoads.length,
                        onViewAll: () {
                          if (onNavigateTab != null) onNavigateTab!(1); // Map tab
                        },
                      ),

                      const SizedBox(height: 22),

                      // Nearby Risk Status List
                      NearbyRiskList(
                        items: nearbyRiskRows,
                        onViewAll: () {
                          if (onNavigateTab != null) onNavigateTab!(1); // Map tab
                        },
                        onItemTap: (item) {
                          ZoneDetailSheet.show(context, activeZone);
                        },
                      ),

                      const SizedBox(height: 22),

                      // Safety Tips
                      SafetyCarousel(
                        articles: safetyProvider.articles,
                        onViewAll: () {
                          if (onNavigateTab != null) onNavigateTab!(3); // Safety tab
                        },
                        onArticleTap: (article) {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => SafetyDetailScreen(article: article),
                            ),
                          );
                        },
                      ),

                      const SizedBox(height: 32),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  /// Builds the top hero section with high-resolution pristine scenic mountain background,
  /// brand header, location pill, slogan, and floating search bar without clipping or ghosting.
  Widget _buildHeroHeader(
    BuildContext context,
    dynamic activeZone,
    LocationProvider locationProvider,
    NotificationProvider notifProvider,
    String avatarLetter,
  ) {
    return Stack(
      children: [
        // 1. Pristine Scenic Mountain Artwork Backdrop (expands dynamically to exact height of content)
        Positioned.fill(
          child: Image.asset(
            'assets/images/home_hero_scenic_hd.png',
            fit: BoxFit.cover,
            alignment: Alignment.topCenter,
          ),
        ),

        // 2. Atmospheric Gradient Overlay (soft sky blue tint at top, fading to crisp page background at bottom)
        Positioned.fill(
          child: Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  const Color(0xFFF1F7FD).withAlpha(120),
                  const Color(0xFFF1F7FD).withAlpha(45),
                  const Color(0xFFF8FAFC).withAlpha(220),
                  const Color(0xFFF8FAFC),
                ],
                stops: const [0.0, 0.35, 0.88, 1.0],
              ),
            ),
          ),
        ),

        // 3. Foreground Content with Native Interactive Widgets
        SafeArea(
          bottom: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(18, 12, 18, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                // Top Header Row: [Logo] Parvaah ... [Bell] [Avatar]
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    // Brand Logo + Name + Tagline
                    Row(
                      children: [
                        const ParvaahLogo(
                          size: 38,
                          borderRadius: 10,
                          showShadow: true,
                        ),
                        const SizedBox(width: 10),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: const [
                            Text(
                              'Parvaah',
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.w900,
                                color: Color(0xFF0F243E),
                                letterSpacing: -0.4,
                              ),
                            ),
                            Text(
                              'Safer Northeast Together',
                              style: TextStyle(
                                fontSize: 11.5,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF64748B),
                                letterSpacing: -0.1,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),

                    // Actions: Bell with Badge + Avatar Circle
                    Row(
                      children: [
                        // Notification Bell Button
                        GestureDetector(
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => const NotificationCenterScreen(),
                              ),
                            );
                          },
                          child: Container(
                            width: 38,
                            height: 38,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFF0F243E).withAlpha(16),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Stack(
                              clipBehavior: Clip.none,
                              children: [
                                const Center(
                                  child: Icon(
                                    Icons.notifications_none_rounded,
                                    color: Color(0xFF1E293B),
                                    size: 21,
                                  ),
                                ),
                                // Red Notification Dot
                                if (notifProvider.unreadCount > 0)
                                  Positioned(
                                    right: 9,
                                    top: 8,
                                    child: Container(
                                      width: 7.5,
                                      height: 7.5,
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFEF4444),
                                        shape: BoxShape.circle,
                                        border: Border.all(color: Colors.white, width: 1.2),
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ),

                        const SizedBox(width: 10),

                        // Avatar Circle
                        GestureDetector(
                          onTap: () {
                            if (onNavigateTab != null) onNavigateTab!(4); // Switch to Profile tab
                          },
                          child: Container(
                            width: 38,
                            height: 38,
                            decoration: BoxDecoration(
                              color: const Color(0xFF007BFF), // Vibrant Blue Avatar matching theme
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFF007BFF).withAlpha(50),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Center(
                              child: Text(
                                avatarLetter,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),

                const SizedBox(height: 14),

                // Location Selector Pill: "📍 East Khasi Hills, Meghalaya v"
                GestureDetector(
                  onTap: () => _showZoneSelector(context, locationProvider),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                    decoration: BoxDecoration(
                      color: Colors.white.withAlpha(235),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Colors.white, width: 1.2),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF0F243E).withAlpha(14),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.location_on_rounded,
                          size: 16,
                          color: Color(0xFF0066FF),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          '${activeZone.district}, ${activeZone.state}',
                          style: const TextStyle(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF0F243E),
                            letterSpacing: -0.2,
                          ),
                        ),
                        const SizedBox(width: 4),
                        const Icon(
                          Icons.keyboard_arrow_down_rounded,
                          size: 17,
                          color: Color(0xFF0F243E),
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 18),

                // Slogan Row: "Safer People / Safer Roads / Stronger Communities" + Script Annotation
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    // 3-Line Bold Slogan
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text(
                          'Safer People',
                          style: TextStyle(
                            fontSize: 23,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF0F243E),
                            height: 1.15,
                            letterSpacing: -0.6,
                          ),
                        ),
                        Text(
                          'Safer Roads',
                          style: TextStyle(
                            fontSize: 23,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF1E88E5), // Royal Parvaah Blue
                            height: 1.15,
                            letterSpacing: -0.6,
                          ),
                        ),
                        Text(
                          'Stronger Communities',
                          style: TextStyle(
                            fontSize: 15.5,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF475569),
                            height: 1.25,
                            letterSpacing: -0.3,
                          ),
                        ),
                      ],
                    ),

                    // Cursive / Script Style Annotation: "For a Resilient Northeast"
                    Padding(
                      padding: const EdgeInsets.only(bottom: 6, right: 6),
                      child: Text(
                        'For a\nResilient\nNortheast',
                        textAlign: TextAlign.right,
                        style: TextStyle(
                          fontStyle: FontStyle.italic,
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF5B8CB5),
                          height: 1.14,
                          letterSpacing: 0.2,
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 18),

                // Floating Search Bar: Fully integrated inside the column layout with zero clipping
                GestureDetector(
                  onTap: () => _showZoneSelector(context, locationProvider),
                  child: Container(
                    height: 52,
                    padding: const EdgeInsets.symmetric(horizontal: 18),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(26),
                      border: Border.all(color: const Color(0xFFE2E8F0), width: 1.0),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF0F243E).withAlpha(16),
                          blurRadius: 16,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Row(
                      children: const [
                        Icon(
                          Icons.search_rounded,
                          color: Color(0xFF94A3B8),
                          size: 22,
                        ),
                        SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Search location, district or road...',
                            style: TextStyle(
                              color: Color(0xFF94A3B8),
                              fontSize: 14,
                              fontWeight: FontWeight.w400,
                            ),
                          ),
                        ),
                        Icon(
                          Icons.tune_rounded,
                          color: Color(0xFF334155),
                          size: 20,
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  void _showZoneSelector(BuildContext context, LocationProvider location) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return DraggableScrollableSheet(
          initialChildSize: 0.65,
          maxChildSize: 0.9,
          minChildSize: 0.4,
          expand: false,
          builder: (_, controller) {
            return Column(
              children: [
                const SizedBox(height: 12),
                Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.border,
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                const SizedBox(height: 14),
                const Text(
                  'Select Monitored Region',
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 12),
                Expanded(
                  child: ListView.separated(
                    controller: controller,
                    padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
                    itemCount: location.availableZones.length,
                    separatorBuilder: (context, index) => const Divider(height: 1),
                    itemBuilder: (context, index) {
                      final item = location.availableZones[index];
                      final isSelected = item.zoneId == location.selectedZone.zoneId;
                      return ListTile(
                        onTap: () {
                          location.selectZone(item);
                          Navigator.pop(ctx);
                        },
                        leading: Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            color: isSelected ? const Color(0xFF1E88E5) : AppColors.background,
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            Icons.location_on_rounded,
                            color: isSelected ? Colors.white : AppColors.textSecondary,
                            size: 18,
                          ),
                        ),
                        title: Text(
                          item.zoneName,
                          style: TextStyle(
                            fontSize: 14.5,
                            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                            color: isSelected ? const Color(0xFF1E88E5) : AppColors.textPrimary,
                          ),
                        ),
                        subtitle: Text(
                          '${item.district}, ${item.state}',
                          style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                        ),
                        trailing: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: item.riskLevel == RiskLevel.critical
                                ? AppColors.riskHighBg
                                : (item.riskLevel == RiskLevel.high
                                    ? AppColors.riskElevatedBg
                                    : AppColors.riskLowBg),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            '${item.riskScore != null ? (item.riskScore! * 100).toInt() : '--'}% Risk',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: item.riskLevel == RiskLevel.critical ||
                                      item.riskLevel == RiskLevel.high
                                  ? AppColors.riskHigh
                                  : AppColors.riskLow,
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _showWeatherSheet(BuildContext context, dynamic zone) {
    final factors = zone is ZoneRiskModel ? zone.factors : null;
    final rainfall = factors?.rainfall24hMm ?? 0.0;
    final moisture = factors?.soilMoisturePct ?? 0.0;
    final zoneName = zone is ZoneRiskModel && zone.zoneName.isNotEmpty ? zone.zoneName : 'Current Monitored Region';

    String weatherSummary;
    IconData weatherIcon;
    Color iconColor;

    if (rainfall > 50) {
      weatherSummary = 'Heavy Rainfall Alert';
      weatherIcon = Icons.thunderstorm_rounded;
      iconColor = const Color(0xFF3B82F6);
    } else if (rainfall > 15) {
      weatherSummary = 'Moderate Showers';
      weatherIcon = Icons.grain_rounded;
      iconColor = const Color(0xFF0284C7);
    } else {
      weatherSummary = 'Normal Atmospheric Conditions';
      weatherIcon = Icons.cloud_outlined;
      iconColor = const Color(0xFF10B981);
    }

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.border,
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Weather & Precipitation Radar',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 14),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFEFF6FF),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: [
                    Icon(weatherIcon, size: 40, color: iconColor),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '$weatherSummary • $zoneName',
                            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Precipitation: ${rainfall.toStringAsFixed(1)} mm (24h cumulative)\nSoil Saturation: ${moisture.toStringAsFixed(0)}% • Live Telemetry Active',
                            style: const TextStyle(fontSize: 12.5, color: AppColors.textSecondary),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1E88E5),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Close Weather Details', style: TextStyle(color: Colors.white)),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  void _showRoadsSheet(BuildContext context, RoadProvider roadProvider) {
    final roads = roadProvider.roads;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.border,
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Highway Network Status',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 14),
              if (roads.isEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(vertical: 24),
                  alignment: Alignment.center,
                  child: const Text(
                    'No active road corridor advisories reported.',
                    style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
                  ),
                )
              else
                ...roads.map((road) {
                  Color color;
                  String statusLabel;
                  switch (road.status) {
                    case RoadCondition.blocked:
                      color = const Color(0xFFDC2626);
                      statusLabel = 'BLOCKED';
                      break;
                    case RoadCondition.atRisk:
                      color = const Color(0xFFD97706);
                      statusLabel = 'AT RISK';
                      break;
                    case RoadCondition.open:
                      color = const Color(0xFF059669);
                      statusLabel = 'OPEN';
                      break;
                  }
                  return Column(
                    children: [
                      _buildRoadItem(road.roadName, statusLabel, road.reason.isNotEmpty ? road.reason : road.corridor, color),
                      const Divider(height: 1),
                    ],
                  );
                }),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1E88E5),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Close Road Status', style: TextStyle(color: Colors.white)),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildRoadItem(String name, String status, String note, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text(note, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: color.withAlpha(25),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              status,
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: color),
            ),
          ),
        ],
      ),
    );
  }
}
