import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../providers/location_provider.dart';
import '../../providers/risk_provider.dart';
import '../../providers/road_provider.dart';
import '../../../data/models/zone_risk_model.dart';
import '../../../data/models/road_status_model.dart';
import '../../widgets/map/risk_map_bottom_card.dart';
import '../../widgets/map/zone_detail_sheet.dart';

class LiveGisMapScreen extends StatefulWidget {
  final bool showBackButton;

  const LiveGisMapScreen({super.key, this.showBackButton = false});

  @override
  State<LiveGisMapScreen> createState() => _LiveGisMapScreenState();
}

class _LiveGisMapScreenState extends State<LiveGisMapScreen>
    with SingleTickerProviderStateMixin {
  final MapController _mapController = MapController();
  int _selectedTileLayer = 0; // 0 = CartoDB Voyager, 1 = Satellite (Esri), 2 = Topographic
  String _activeFilter = 'All'; // 'All', 'High', 'Moderate', 'Safe', 'Landslide'

  late AnimationController _pulseController;

  final List<Map<String, String>> _tileOptions = [
    {
      'name': 'Street (Voyager)',
      'url': 'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
    },
    {
      'name': 'Satellite (Esri)',
      'url': 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    },
    {
      'name': 'Topographic',
      'url': 'https://tile.opentopomap.org/{z}/{x}/{y}.png',
    },
  ];

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..repeat();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _mapController.dispose();
    super.dispose();
  }

  void _toggleSatellite() {
    setState(() {
      _selectedTileLayer = (_selectedTileLayer == 1) ? 0 : 1;
    });
  }

  @override
  Widget build(BuildContext context) {
    final locationProvider = context.watch<LocationProvider>();
    final riskProvider = context.watch<RiskProvider>();
    final roadProvider = context.watch<RoadProvider>();
    final selectedZone = locationProvider.selectedZone;

    final centerPoint = LatLng(
      selectedZone.latitude != 0.0 ? selectedZone.latitude : 25.5788,
      selectedZone.longitude != 0.0 ? selectedZone.longitude : 91.8933,
    );

    final roadPolylines = <Polyline>[];
    final roadBadges = <Marker>[];

    for (final road in roadProvider.roads) {
      if (road.points.isNotEmpty) {
        Color strokeColor = const Color(0xFF10B981);
        switch (road.status) {
          case RoadCondition.blocked:
            strokeColor = const Color(0xFFEF4444);
            break;
          case RoadCondition.atRisk:
            strokeColor = const Color(0xFFF59E0B);
            break;
          case RoadCondition.open:
            strokeColor = const Color(0xFF10B981);
            break;
        }

        final points = road.points.map((p) => LatLng(p.lat, p.lng)).toList();
        roadPolylines.add(
          Polyline(
            points: points,
            strokeWidth: 4.5,
            color: strokeColor,
          ),
        );

        if (points.isNotEmpty) {
          final midPoint = points[points.length ~/ 2];
          roadBadges.add(
            Marker(
              point: midPoint,
              width: 58,
              height: 22,
              child: _RoadLabelBadge(label: road.roadName.split(' ').first),
            ),
          );
        }
      }
    }

    // Filter zones based on active chip
    final filteredZones = riskProvider.zones.where((z) {
      if (_activeFilter == 'All') return true;
      if (_activeFilter == 'High') {
        return z.riskLevel == RiskLevel.critical || z.riskLevel == RiskLevel.high;
      }
      if (_activeFilter == 'Moderate') {
        return z.riskLevel == RiskLevel.elevated || z.riskLevel == RiskLevel.medium;
      }
      if (_activeFilter == 'Safe') {
        return z.riskLevel == RiskLevel.low;
      }
      if (_activeFilter == 'Landslide') {
        return true; // All default NER zones are landslide monitored
      }
      return true;
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      body: AnnotatedRegion<SystemUiOverlayStyle>(
        value: const SystemUiOverlayStyle(
          statusBarColor: Colors.transparent,
          statusBarIconBrightness: Brightness.dark,
        ),
        child: Stack(
          children: [
            // 1. Interactive Real Map Layer (FlutterMap)
            FlutterMap(
              mapController: _mapController,
              options: MapOptions(
                initialCenter: centerPoint,
                initialZoom: 9.8,
                minZoom: 6.0,
                maxZoom: 16.0,
              ),
              children: [
                // Base Tile Layer (Real vector street or satellite)
                TileLayer(
                  urlTemplate: _tileOptions[_selectedTileLayer]['url']!,
                  userAgentPackageName: 'com.parvaah.safety.mobile',
                ),

                // Arterial Highways Polylines (dynamically loaded from RoadProvider)
                if (roadPolylines.isNotEmpty)
                  PolylineLayer(
                    polylines: roadPolylines,
                  ),

                // Road Badge Markers (dynamically positioned at corridor midpoint)
                if (roadBadges.isNotEmpty)
                  MarkerLayer(
                    markers: roadBadges,
                  ),

                // Interactive Risk Markers & Location Pins
                MarkerLayer(
                  markers: [
                    // Active Monitored Zone Pin Marker
                    Marker(
                      point: centerPoint,
                      width: 54,
                      height: 54,
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          AnimatedBuilder(
                            animation: _pulseController,
                            builder: (context, child) {
                              return Container(
                                width: 22 + (_pulseController.value * 28),
                                height: 22 + (_pulseController.value * 28),
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: const Color(0xFF007BFF).withAlpha(
                                    ((1.0 - _pulseController.value) * 110).toInt(),
                                  ),
                                ),
                              );
                            },
                          ),
                          Container(
                            width: 18,
                            height: 18,
                            decoration: BoxDecoration(
                              color: const Color(0xFF007BFF),
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white, width: 3.5),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFF007BFF).withAlpha(120),
                                  blurRadius: 10,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Active Selected Zone Weather Tooltip Card Marker
                    if (selectedZone.latitude != 0.0 && selectedZone.longitude != 0.0)
                      Marker(
                        point: LatLng(selectedZone.latitude, selectedZone.longitude),
                        width: 146,
                        height: 52,
                        child: GestureDetector(
                          onTap: () {
                            ZoneDetailSheet.show(context, selectedZone);
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: const Color(0xFFE2E8F0), width: 1.0),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withAlpha(25),
                                  blurRadius: 10,
                                  offset: const Offset(0, 3),
                                ),
                              ],
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  width: 28,
                                  height: 28,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFE0F2FE),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                   child: Icon(
                                    (selectedZone.factors.rainfall24hMm ?? 0) > 30
                                        ? Icons.thunderstorm_rounded
                                        : Icons.grain_rounded,
                                    color: const Color(0xFF0284C7),
                                    size: 18,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Text(
                                        selectedZone.zoneName,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                          fontSize: 11.5,
                                          fontWeight: FontWeight.w800,
                                          color: Color(0xFF0F243E),
                                        ),
                                      ),
                                      Text(
                                        selectedZone.factors.rainfall24hMm != null
                                            ? '${selectedZone.factors.rainfall24hMm!.toStringAsFixed(0)}mm Rain'
                                            : 'Rain: N/A',
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.w500,
                                          color: Color(0xFF64748B),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 4),
                                const Icon(
                                  Icons.chevron_right_rounded,
                                  size: 16,
                                  color: Color(0xFF94A3B8),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),

                    // Risk Zones Markers
                    ...filteredZones.map((zone) {
                      final isSelected = zone.zoneId == selectedZone.zoneId;
                      final isHigh = zone.riskLevel == RiskLevel.critical ||
                          zone.riskLevel == RiskLevel.high;
                      final isModerate = zone.riskLevel == RiskLevel.elevated ||
                          zone.riskLevel == RiskLevel.medium;

                      Color markerColor;
                      if (isHigh) {
                        markerColor = const Color(0xFFDC2626); // Crimson/Red
                      } else if (isModerate) {
                        markerColor = const Color(0xFFF59E0B); // Amber/Orange
                      } else {
                        markerColor = const Color(0xFF10B981); // Emerald Green
                      }

                      return Marker(
                        point: LatLng(zone.latitude, zone.longitude),
                        width: isHigh ? 64 : 44,
                        height: isHigh ? 64 : 44,
                        child: GestureDetector(
                          onTap: () {
                            locationProvider.selectZone(zone);
                            _mapController.move(
                              LatLng(zone.latitude, zone.longitude),
                              _mapController.camera.zoom,
                            );
                          },
                          child: isHigh
                              ? _PulsingRadarMarker(
                                  animation: _pulseController,
                                  color: markerColor,
                                  isSelected: isSelected,
                                )
                              : _StandardRiskMarker(
                                  color: markerColor,
                                  isSelected: isSelected,
                                ),
                        ),
                      );
                    }),
                  ],
                ),
              ],
            ),

            // 2. Top Header & Search Bar & Filters Overlay
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Top App Bar: [<] "Risk Map" [Layers Icon]
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        // Left: Back button (if can pop and enabled) or Spacer
                        if (widget.showBackButton && Navigator.canPop(context))
                          GestureDetector(
                            onTap: () => Navigator.pop(context),
                            child: Container(
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(14),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withAlpha(15),
                                    blurRadius: 10,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: const Center(
                                child: Icon(
                                  Icons.chevron_left_rounded,
                                  size: 28,
                                  color: Color(0xFF0F243E),
                                ),
                              ),
                            ),
                          )
                        else
                          const SizedBox(width: 44, height: 44),

                        // Center: Title & Subtitle
                        Column(
                          mainAxisSize: MainAxisSize.min,
                          children: const [
                            Text(
                              'Risk Map',
                              style: TextStyle(
                                fontSize: 21,
                                fontWeight: FontWeight.w900,
                                color: Color(0xFF0F243E),
                                letterSpacing: -0.4,
                              ),
                            ),
                            SizedBox(height: 2),
                            Text(
                              'Explore. Stay Aware. Stay Safer.',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                                color: Color(0xFF64748B),
                                letterSpacing: -0.1,
                              ),
                            ),
                          ],
                        ),

                        // Right: Layers selector button
                        GestureDetector(
                          onTap: _showLayerSelector,
                          child: Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(14),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withAlpha(15),
                                  blurRadius: 10,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: const Center(
                              child: Icon(
                                Icons.layers_outlined,
                                size: 22,
                                color: Color(0xFF0F243E),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 12),

                    // Floating Search Bar: Capsule pill with tune icon
                    GestureDetector(
                      onTap: () => _showZonePickerModal(context, locationProvider),
                      child: Container(
                        height: 48,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(color: const Color(0xFFE2E8F0), width: 1.0),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withAlpha(16),
                              blurRadius: 14,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Row(
                          children: const [
                            Icon(
                              Icons.search_rounded,
                              color: Color(0xFF94A3B8),
                              size: 21,
                            ),
                            SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                'Search location, district or road...',
                                style: TextStyle(
                                  color: Color(0xFF94A3B8),
                                  fontSize: 13.5,
                                  fontWeight: FontWeight.w400,
                                ),
                              ),
                            ),
                            Icon(
                              Icons.tune_rounded,
                              color: Color(0xFF334155),
                              size: 19,
                            ),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 10),

                    // Filter Chips Row: [All] [🔴 High] [🟡 Moderate] [🟢 Safe] [▲ Landslide]
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          _buildFilterChip('All', null),
                          const SizedBox(width: 8),
                          _buildFilterChip('High', const Color(0xFFDC2626)),
                          const SizedBox(width: 8),
                          _buildFilterChip('Moderate', const Color(0xFFD97706)),
                          const SizedBox(width: 8),
                          _buildFilterChip('Safe', const Color(0xFF16A34A)),
                          const SizedBox(width: 8),
                          _buildFilterChip('Landslide', null, icon: Icons.terrain_rounded),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // 3. Floating Compass / Center Location Button (Top Right below header)
            Positioned(
              right: 18,
              top: 195,
              child: GestureDetector(
                onTap: () {
                  _mapController.move(centerPoint, 10.5);
                },
                child: Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withAlpha(20),
                        blurRadius: 10,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: const Center(
                    child: Icon(
                      Icons.my_location_rounded,
                      color: Color(0xFF0F243E),
                      size: 22,
                    ),
                  ),
                ),
              ),
            ),

            // 4. Floating Risk Legend Capsule (Bottom Left above card)
            Positioned(
              left: 18,
              bottom: 236,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                decoration: BoxDecoration(
                  color: Colors.white.withAlpha(240),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.white, width: 1.0),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withAlpha(15),
                      blurRadius: 10,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: const [
                    _LegendDot(color: Color(0xFFDC2626), label: 'High'),
                    SizedBox(width: 10),
                    _LegendDot(color: Color(0xFFF59E0B), label: 'Moderate'),
                    SizedBox(width: 10),
                    _LegendDot(color: Color(0xFF10B981), label: 'Safe'),
                  ],
                ),
              ),
            ),

            // 5. Floating Satellite / Vector Map Switcher Button (Bottom Right above card)
            Positioned(
              right: 18,
              bottom: 232,
              child: GestureDetector(
                onTap: _toggleSatellite,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E293B).withAlpha(235), // Dark sleek card styling
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.white.withAlpha(40), width: 1.0),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withAlpha(35),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Thumbnail icon
                      Container(
                        width: 26,
                        height: 26,
                        decoration: BoxDecoration(
                          color: const Color(0xFF334155),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: Colors.white.withAlpha(60), width: 1.0),
                        ),
                        child: const Center(
                          child: Icon(
                            Icons.satellite_alt_rounded,
                            size: 16,
                            color: Colors.white,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        _selectedTileLayer == 1 ? 'Street' : 'Satellite',
                        style: const TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // 6. Floating Bottom Detail Card
            Positioned(
              left: 16,
              right: 16,
              bottom: 12,
              child: RiskMapBottomCard(
                zone: selectedZone,
                onViewDetails: () {
                  ZoneDetailSheet.show(context, selectedZone);
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(String label, Color? dotColor, {IconData? icon}) {
    final isSelected = _activeFilter == label;

    return GestureDetector(
      onTap: () => setState(() => _activeFilter = label),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFE0F2FE) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? const Color(0xFF0284C7) : const Color(0xFFE2E8F0),
            width: isSelected ? 1.4 : 1.0,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withAlpha(isSelected ? 10 : 8),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (dotColor != null) ...[
              Container(
                width: 7,
                height: 7,
                decoration: BoxDecoration(
                  color: dotColor,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 6),
            ] else if (icon != null) ...[
              Icon(
                icon,
                size: 14,
                color: isSelected ? const Color(0xFF0284C7) : const Color(0xFF475569),
              ),
              const SizedBox(width: 6),
            ],
            Text(
              label,
              style: TextStyle(
                fontSize: 12.5,
                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                color: isSelected ? const Color(0xFF0284C7) : const Color(0xFF1E293B),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showLayerSelector() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 38,
                    height: 4,
                    decoration: BoxDecoration(
                      color: const Color(0xFFCBD5E1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                const Text(
                  'Map Base Layers',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF0F243E),
                  ),
                ),
                const SizedBox(height: 14),
                ...List.generate(_tileOptions.length, (index) {
                  final isSelected = _selectedTileLayer == index;
                  return ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(
                      _tileOptions[index]['name']!,
                      style: TextStyle(
                        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                        color: isSelected ? const Color(0xFF1E88E5) : const Color(0xFF0F243E),
                      ),
                    ),
                    trailing: isSelected
                        ? const Icon(Icons.check_circle_rounded, color: Color(0xFF1E88E5))
                        : null,
                    onTap: () {
                      setState(() => _selectedTileLayer = index);
                      Navigator.pop(ctx);
                    },
                  );
                }),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showZonePickerModal(BuildContext context, LocationProvider location) {
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
                  'Jump to Location',
                  style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
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
                      return ListTile(
                        onTap: () {
                          location.selectZone(item);
                          _mapController.move(
                            LatLng(item.latitude, item.longitude),
                            11.0,
                          );
                          Navigator.pop(ctx);
                        },
                        title: Text(item.zoneName, style: const TextStyle(fontWeight: FontWeight.w600)),
                        subtitle: Text('${item.district}, ${item.state}'),
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
}

/// Pulsing radar hazard marker for high-risk zones (e.g. Sohra)
class _PulsingRadarMarker extends StatelessWidget {
  final Animation<double> animation;
  final Color color;
  final bool isSelected;

  const _PulsingRadarMarker({
    required this.animation,
    required this.color,
    required this.isSelected,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: animation,
      builder: (context, child) {
        final scale = 1.0 + animation.value * 0.45;
        final opacity = (1.0 - animation.value).clamp(0.0, 1.0);

        return Stack(
          alignment: Alignment.center,
          children: [
            // Outer radar pulse
            Transform.scale(
              scale: scale,
              child: Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: color.withAlpha(((opacity * 0.35) * 255).toInt()),
                  shape: BoxShape.circle,
                ),
              ),
            ),
            // Solid Core
            Container(
              width: isSelected ? 46 : 40,
              height: isSelected ? 46 : 40,
              decoration: BoxDecoration(
                color: color,
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 3.5),
                boxShadow: [
                  BoxShadow(
                    color: color.withAlpha(120),
                    blurRadius: 10,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: const Center(
                child: Icon(
                  Icons.terrain_rounded,
                  color: Colors.white,
                  size: 22,
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}

/// Standard circular risk marker
class _StandardRiskMarker extends StatelessWidget {
  final Color color;
  final bool isSelected;

  const _StandardRiskMarker({
    required this.color,
    required this.isSelected,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: isSelected ? 40 : 34,
      height: isSelected ? 40 : 34,
      decoration: BoxDecoration(
        color: color,
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white, width: 3.0),
        boxShadow: [
          BoxShadow(
            color: color.withAlpha(100),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: const Center(
        child: Icon(
          Icons.terrain_rounded,
          color: Colors.white,
          size: 18,
        ),
      ),
    );
  }
}

/// Highway route name pill badge (e.g. NH-6)
class _RoadLabelBadge extends StatelessWidget {
  final String label;

  const _RoadLabelBadge({required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: const Color(0xFF64748B), width: 0.8),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(20),
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Center(
        child: Text(
          label,
          style: const TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w800,
            color: Color(0xFF0F243E),
          ),
        ),
      ),
    );
  }
}

class _LegendDot extends StatelessWidget {
  final Color color;
  final String label;

  const _LegendDot({required this.color, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 7,
          height: 7,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 5),
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: Color(0xFF334155),
          ),
        ),
      ],
    );
  }
}
