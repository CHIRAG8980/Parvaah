import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/constants/app_strings.dart';
import 'package:mobile/data/models/zone_risk_model.dart';
import 'package:mobile/data/models/alert_model.dart';
import 'package:mobile/data/models/road_status_model.dart';
import 'package:mobile/data/models/safety_article_model.dart';
import 'package:mobile/data/models/notification_item_model.dart';

void main() {
  group('Parvaah Brand & Theme Tests', () {
    test('Official brand color codes match specification', () {
      expect(AppColors.navy.toARGB32(), 0xFF0C274A);
      expect(AppColors.deepBlue.toARGB32(), 0xFF1769AA);
      expect(AppColors.blue.toARGB32(), 0xFF1E88E5);
      expect(AppColors.background.toARGB32(), 0xFFF6F8FB);
    });

    test('Risk colors are separate from brand colors', () {
      expect(AppColors.riskLow.toARGB32(), 0xFF168A4A);
      expect(AppColors.riskMedium.toARGB32(), 0xFFC58A00);
      expect(AppColors.riskHigh.toARGB32(), 0xFFC62828);
      expect(AppColors.riskLow != AppColors.blue, isTrue);
    });

    test('Supports all 8 North Eastern Regional languages', () {
      expect(AppStrings.supportedLanguages.length, 8);
      expect(AppStrings.supportedLanguages.containsKey('en'), isTrue);
      expect(AppStrings.supportedLanguages.containsKey('hi'), isTrue);
      expect(AppStrings.supportedLanguages.containsKey('as'), isTrue);
      expect(AppStrings.supportedLanguages.containsKey('bn'), isTrue);
      expect(AppStrings.supportedLanguages.containsKey('mni'), isTrue);
      expect(AppStrings.supportedLanguages.containsKey('kha'), isTrue);
      expect(AppStrings.supportedLanguages.containsKey('lus'), isTrue);
      expect(AppStrings.supportedLanguages.containsKey('nag'), isTrue);
    });
  });

  group('Parvaah Data Models Tests', () {
    test('ZoneRiskModel parses correctly with high risk level', () {
      final json = {
        'zone_id': 'NER-TEST-01',
        'zone_name': 'Test Ridge',
        'state': 'Meghalaya',
        'district': 'East Khasi Hills',
        'risk_score': 0.88,
        'time_to_failure': 'Critical warning in 24h',
      };
      final model = ZoneRiskModel.fromJson(json);
      expect(model.zoneId, 'NER-TEST-01');
      expect(model.riskLevel, RiskLevel.critical);
      expect(model.riskScore, 0.88);
    });

    test('AlertModel parses critical severity correctly', () {
      final json = {
        'id': 'ALT-01',
        'title': 'Active Landslide Alert',
        'message': 'Road blocked near tunnel approach',
        'severity': 'critical',
      };
      final model = AlertModel.fromJson(json);
      expect(model.id, 'ALT-01');
      expect(model.severity, AlertSeverity.critical);
    });

    test('RoadStatusModel parses statuses correctly', () {
      final json = {
        'road_id': 'RD-01',
        'road_name': 'NH-2',
        'corridor': 'Kohima Corridor',
        'status': 'blocked',
      };
      final model = RoadStatusModel.fromJson(json);
      expect(model.status, RoadCondition.blocked);
    });

    test('Safety articles include Before, During, and After points', () {
      final articles = SafetyArticleModel.defaultArticles;
      expect(articles.isNotEmpty, isTrue);
      final first = articles.first;
      expect(first.beforeGuidelines.isNotEmpty, isTrue);
      expect(first.duringGuidelines.isNotEmpty, isTrue);
      expect(first.afterGuidelines.isNotEmpty, isTrue);
    });

    test('Notification items group correctly', () {
      final notifs = NotificationItemModel.defaultNotifications();
      expect(notifs.isNotEmpty, isTrue);
      expect(notifs.any((n) => n.group == NotificationTimeGroup.today), isTrue);
    });
  });
}
