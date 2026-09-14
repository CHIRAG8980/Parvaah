import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/safety_provider.dart';
import '../../../data/models/safety_article_model.dart';
import 'safety_detail_screen.dart';

class SafetyScreen extends StatefulWidget {
  const SafetyScreen({super.key});

  @override
  State<SafetyScreen> createState() => _SafetyScreenState();
}

class _SafetyScreenState extends State<SafetyScreen> {
  bool _isSearchOpen = false;
  final TextEditingController _searchCtrl = TextEditingController();

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final safetyProvider = context.watch<SafetyProvider>();
    final articles = safetyProvider.articles;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: Stack(
        children: [
          // Top Scenic Background Banner
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: 160,
            child: ShaderMask(
              shaderCallback: (rect) => const LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Colors.black, Colors.black, Colors.transparent],
                stops: [0.0, 0.65, 1.0],
              ).createShader(rect),
              blendMode: BlendMode.dstIn,
              child: Image.asset(
                'assets/images/safety_header_bg.jpg',
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => Container(
                  color: const Color(0xFFE2E8F0),
                ),
              ),
            ),
          ),

          // Main Scrollable Content
          SafeArea(
            bottom: false,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header Area
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Top Row: Title + Search Button
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: const [
                                Text(
                                  'Safety & Preparedness',
                                  style: TextStyle(
                                    fontSize: 24,
                                    fontWeight: FontWeight.w800,
                                    color: Color(0xFF0F243E),
                                    letterSpacing: -0.4,
                                  ),
                                ),
                                SizedBox(height: 3),
                                Text(
                                  'Be Aware. Be Prepared. Stay Safer.',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w500,
                                    color: Color(0xFF64748B),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          // Circular Search Button
                          GestureDetector(
                            onTap: () {
                              setState(() {
                                _isSearchOpen = !_isSearchOpen;
                                if (!_isSearchOpen) {
                                  _searchCtrl.clear();
                                  safetyProvider.setSearchQuery('');
                                }
                              });
                            },
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
                              child: Icon(
                                _isSearchOpen ? Icons.close_rounded : Icons.search_rounded,
                                size: 21,
                                color: const Color(0xFF0F243E),
                              ),
                            ),
                          ),
                        ],
                      ),

                      // Resilience Shield Badge (Right-aligned below title)
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.white.withAlpha(210),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: const Color(0xFFE2E8F0).withAlpha(180)),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(
                                  Icons.shield_rounded,
                                  size: 18,
                                  color: Color(0xFF0284C7),
                                ),
                                const SizedBox(width: 6),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisSize: MainAxisSize.min,
                                  children: const [
                                    Text(
                                      'Prepared Communities',
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w700,
                                        color: Color(0xFF0F243E),
                                        height: 1.15,
                                      ),
                                    ),
                                    Text(
                                      'Resilient Northeast',
                                      style: TextStyle(
                                        fontSize: 9.5,
                                        fontWeight: FontWeight.w600,
                                        color: Color(0xFF0284C7),
                                        height: 1.15,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),

                      // Animated Search Field if open
                      if (_isSearchOpen) ...[
                        const SizedBox(height: 10),
                        Container(
                          height: 42,
                          padding: const EdgeInsets.symmetric(horizontal: 14),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: const Color(0xFF0284C7)),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF0284C7).withAlpha(20),
                                blurRadius: 10,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: TextField(
                            controller: _searchCtrl,
                            autofocus: true,
                            onChanged: (val) => safetyProvider.setSearchQuery(val),
                            decoration: const InputDecoration(
                              hintText: 'Search hazard protocols...',
                              hintStyle: TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
                              border: InputBorder.none,
                              isDense: true,
                              contentPadding: EdgeInsets.symmetric(vertical: 10),
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),

                // Category Filter Chips
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 6),
                  child: Row(
                    children: [
                      _buildCategoryChip(
                        label: 'All',
                        categoryKey: 'All',
                        icon: Icons.check_rounded,
                        safetyProvider: safetyProvider,
                        showIconWhenSelectedOnly: true,
                      ),
                      const SizedBox(width: 8),
                      _buildCategoryChip(
                        label: 'Geological',
                        categoryKey: 'Geological',
                        icon: Icons.terrain_rounded,
                        safetyProvider: safetyProvider,
                      ),
                      const SizedBox(width: 8),
                      _buildCategoryChip(
                        label: 'Meteorological',
                        categoryKey: 'Meteorological',
                        icon: Icons.cloudy_snowing,
                        safetyProvider: safetyProvider,
                      ),
                      const SizedBox(width: 8),
                      _buildCategoryChip(
                        label: 'Hydrological',
                        categoryKey: 'Hydrological',
                        icon: Icons.waves_rounded,
                        safetyProvider: safetyProvider,
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 6),

                // Guide Cards List
                Expanded(
                  child: ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 6, 16, 24),
                    physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                    itemCount: articles.length + 1, // +1 for Awareness banner
                    separatorBuilder: (context, index) => const SizedBox(height: 14),
                    itemBuilder: (context, index) {
                      if (index == articles.length) {
                        return _buildAwarenessBanner(context);
                      }
                      final item = articles[index];
                      return _buildScenicGuideCard(context, item);
                    },
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryChip({
    required String label,
    required String categoryKey,
    required IconData icon,
    required SafetyProvider safetyProvider,
    bool showIconWhenSelectedOnly = false,
  }) {
    final isSelected = safetyProvider.selectedCategory.toLowerCase() == categoryKey.toLowerCase();

    return GestureDetector(
      onTap: () => safetyProvider.selectCategory(categoryKey),
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF1E88E5) : Colors.white,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(
            color: isSelected ? const Color(0xFF1E88E5) : const Color(0xFFE2E8F0),
            width: isSelected ? 1.4 : 1.0,
          ),
          boxShadow: [
            BoxShadow(
              color: isSelected
                  ? const Color(0xFF1E88E5).withAlpha(40)
                  : const Color(0xFF0F172A).withAlpha(6),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (!showIconWhenSelectedOnly || isSelected) ...[
              Icon(
                icon,
                size: 15,
                color: isSelected ? Colors.white : const Color(0xFF1E293B),
              ),
              const SizedBox(width: 6),
            ],
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                color: isSelected ? Colors.white : const Color(0xFF334155),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildScenicGuideCard(BuildContext context, SafetyArticleModel item) {
    final isGeological = item.category.toLowerCase().contains('geo');
    final isMeteorological = item.category.toLowerCase().contains('meteo');

    // Category styling matching the reference mockup
    final Color cardBgColor;
    final Color cardBorderColor;
    final Color squircleBgColor;
    final Color squircleIconColor;
    final IconData squircleIcon;
    final Color tagBgColor;
    final Color tagTextColor;
    final String tagLabel;

    if (isGeological) {
      cardBgColor = const Color(0xFFFFFDF7);
      cardBorderColor = const Color(0xFFFEF3C7);
      squircleBgColor = const Color(0xFFFFEDD5);
      squircleIconColor = const Color(0xFFC2410C);
      squircleIcon = Icons.landscape_rounded;
      tagBgColor = const Color(0xFFFFEDD5);
      tagTextColor = const Color(0xFFC2410C);
      tagLabel = 'GEOLOGICAL';
    } else if (isMeteorological) {
      cardBgColor = const Color(0xFFF7FBFF);
      cardBorderColor = const Color(0xFFE0F2FE);
      squircleBgColor = const Color(0xFFE0F2FE);
      squircleIconColor = const Color(0xFF0284C7);
      squircleIcon = Icons.cloudy_snowing;
      tagBgColor = const Color(0xFFE0F2FE);
      tagTextColor = const Color(0xFF0284C7);
      tagLabel = 'METEOROLOGICAL';
    } else {
      cardBgColor = const Color(0xFFF7FDF9);
      cardBorderColor = const Color(0xFFDCFCE7);
      squircleBgColor = const Color(0xFFD1FAE5);
      squircleIconColor = const Color(0xFF059669);
      squircleIcon = Icons.waves_rounded;
      tagBgColor = const Color(0xFFD1FAE5);
      tagTextColor = const Color(0xFF059669);
      tagLabel = 'HYDROLOGICAL';
    }

    final screenWidth = MediaQuery.of(context).size.width;

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => SafetyDetailScreen(article: item)),
        );
      },
      child: Container(
        height: 172,
        decoration: BoxDecoration(
          color: cardBgColor,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: cardBorderColor, width: 1.2),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF0F172A).withAlpha(10),
              blurRadius: 16,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(22),
          child: Stack(
            children: [
              // Right-aligned Scenic Artwork Image
              Positioned(
                right: 0,
                top: 0,
                bottom: 0,
                width: screenWidth * 0.52,
                child: Image.asset(
                  item.assetImage,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) => Container(
                    color: const Color(0xFFE2E8F0),
                    child: const Icon(Icons.terrain_rounded, size: 40, color: Color(0xFF94A3B8)),
                  ),
                ),
              ),

              // Seamless Gradient Overlay from left to right
              Positioned.fill(
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.centerLeft,
                      end: Alignment.centerRight,
                      colors: [
                        cardBgColor,
                        cardBgColor,
                        cardBgColor.withAlpha(240),
                        cardBgColor.withAlpha(180),
                        cardBgColor.withAlpha(0),
                      ],
                      stops: const [0.0, 0.44, 0.54, 0.68, 0.88],
                    ),
                  ),
                ),
              ),

              // Foreground Text and Controls
              Padding(
                padding: const EdgeInsets.fromLTRB(18, 16, 18, 16),
                child: SizedBox(
                  width: screenWidth * 0.54,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Top Row: Squircle Icon + Tag Pill
                      Row(
                        children: [
                          Container(
                            width: 42,
                            height: 42,
                            decoration: BoxDecoration(
                              color: squircleBgColor,
                              borderRadius: BorderRadius.circular(13),
                            ),
                            child: Center(
                              child: Icon(
                                squircleIcon,
                                size: 22,
                                color: squircleIconColor,
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3.5),
                            decoration: BoxDecoration(
                              color: tagBgColor,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              tagLabel,
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w800,
                                color: tagTextColor,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                        ],
                      ),

                      // Middle: Title & Description
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item.title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF0F243E),
                              letterSpacing: -0.2,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            item.shortDescription,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 12.5,
                              fontWeight: FontWeight.w500,
                              color: Color(0xFF64748B),
                              height: 1.35,
                            ),
                          ),
                        ],
                      ),

                      // Bottom: View Guide Link
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: const [
                          Text(
                            'View Guide',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF2563EB),
                            ),
                          ),
                          SizedBox(width: 4),
                          Icon(
                            Icons.arrow_forward_rounded,
                            size: 15,
                            color: Color(0xFF2563EB),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAwarenessBanner(BuildContext context) {
    return GestureDetector(
      onTap: () => _showAwarenessModal(context),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFFF0F6FD),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFDBEAFE), width: 1.2),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF0F172A).withAlpha(8),
              blurRadius: 12,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Row(
          children: [
            // Lightbulb Squircle
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: const Color(0xFFDBEAFE),
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Center(
                child: Icon(
                  Icons.lightbulb_rounded,
                  size: 24,
                  color: Color(0xFF2563EB),
                ),
              ),
            ),
            const SizedBox(width: 14),
            // Text Column
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Text(
                    'A safer tomorrow',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF0F243E),
                    ),
                  ),
                  Text(
                    'starts with awareness.',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ),
            const Icon(
              Icons.chevron_right_rounded,
              size: 24,
              color: Color(0xFF2563EB),
            ),
          ],
        ),
      ),
    );
  }

  void _showAwarenessModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
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
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.lightbulb_rounded, color: Color(0xFF2563EB), size: 24),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text(
                        'Community Preparedness Checklist',
                        style: TextStyle(fontSize: 16.5, fontWeight: FontWeight.w800, color: Color(0xFF0F243E)),
                      ),
                      Text(
                        'Essential actions for Northeast households',
                        style: TextStyle(fontSize: 12.5, color: Color(0xFF64748B)),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),
            _buildChecklistItem(Icons.backpack_outlined, 'Emergency Go-Bag packed with 72h dry food, water & meds.'),
            _buildChecklistItem(Icons.contact_phone_outlined, 'Local District Emergency Helpline (1077) saved in phone.'),
            _buildChecklistItem(Icons.power_settings_new_rounded, 'Main electricity & gas shutoff location identified.'),
            _buildChecklistItem(Icons.alt_route_rounded, 'High-ground pedestrian evacuation route mapped with family.'),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(ctx),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2563EB),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 13),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: const Text('I Understand', style: TextStyle(fontWeight: FontWeight.w700)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildChecklistItem(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: const Color(0xFF2563EB)),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(fontSize: 13, color: Color(0xFF334155), height: 1.35),
            ),
          ),
        ],
      ),
    );
  }
}
