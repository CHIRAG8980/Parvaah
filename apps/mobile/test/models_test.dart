import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/data/models/alert_model.dart';
import 'package:mobile/data/models/auth_tokens_model.dart';
import 'package:mobile/data/models/notification_item_model.dart';
import 'package:mobile/data/models/road_status_model.dart';
import 'package:mobile/data/models/user_profile_model.dart';
import 'package:mobile/data/models/weather_forecast_model.dart';
import 'package:mobile/data/models/zone_risk_model.dart';

void main() {
  group('ZoneRiskModel Tests', () {
    test('Correctly normalizes 0-100 score from backend', () {
      final json = {
        'zone_id': 'NER-MEG-001',
        'name': 'Sohra Sector A',
        'district': 'East Khasi Hills',
        'state': 'Meghalaya',
        'latitude': 25.27,
        'longitude': 91.73,
        'risk_score': 85.5,
        'risk_level': 'CRITICAL',
        'confidence': 'high',
        'time_to_failure_window': '1-3 days',
        'factors': {
          'rainfall_24h_mm': 198.4,
          'soil_moisture_pct': 88.5,
          'slope_degrees': 38.2,
          'insar_deformation_mm_yr': -24.6,
          'ndvi_index': 0.38,
        },
      };

      final model = ZoneRiskModel.fromJson(json);
      expect(model.zoneId, 'NER-MEG-001');
      expect(model.riskScore, closeTo(0.855, 0.001));
      expect(model.riskLevel, RiskLevel.critical);
      expect(model.confidence, ConfidenceLevel.high);
      expect(model.factors.rainfall24hMm, 198.4);
    });

    test('Handles already normalized 0.0-1.0 score gracefully', () {
      final json = {
        'zone_id': 'NER-MEG-002',
        'risk_score': 0.45,
        'risk_level': 'MEDIUM',
      };
      final model = ZoneRiskModel.fromJson(json);
      expect(model.riskScore, 0.45);
      expect(model.riskLevel, RiskLevel.medium);
    });
  });

  group('AlertModel Tests', () {
    test('Deserializes ActiveAlertMobileResponse format accurately', () {
      final json = {
        'alert_id': 'ALT-2026-001',
        'title': 'High Landslide Risk Warning',
        'message': 'Continuous downpour in Sohra canyon.',
        'severity': 'Critical',
        'zone_id': 'NER-MEG-001',
        'zone_name': 'Sohra Sector A',
        'district': 'East Khasi Hills',
        'state': 'Meghalaya',
        'dispatched_at': '2026-09-13T10:00:00.000Z',
        'language': 'en',
        'available_languages': ['en', 'as', 'bn'],
      };

      final model = AlertModel.fromJson(json);
      expect(model.id, 'ALT-2026-001');
      expect(model.severity, AlertSeverity.critical);
      expect(model.availableLanguages.length, 3);
    });

    test('Converts to NotificationItemModel cleanly', () {
      final alert = AlertModel(
        id: 'ALT-1',
        title: 'Test Alert',
        message: 'Test description',
        region: 'Sohra',
        severity: AlertSeverity.critical,
        timestamp: DateTime.now(),
      );

      final notif = NotificationItemModel.fromAlert(alert);
      expect(notif.id, 'ALT-1');
      expect(notif.severity, NotificationSeverity.critical);
      expect(notif.group, NotificationTimeGroup.today);
    });
  });

  group('RoadStatusModel & WeatherForecastModel Tests', () {
    test('RoadStatusModel parses road points when provided or remains empty', () {
      final json = {
        'road_id': 'RD-NH-106-SOHRA',
        'name': 'Shillong - Sohra Link',
        'road_class': 'state_highway',
        'status': 'blocked',
        'blockage_reason': 'Rockfall near km 44',
      };

      final road = RoadStatusModel.fromJson(json);
      expect(road.status, RoadCondition.blocked);
      expect(road.points.isEmpty, true);

      final jsonWithPoints = {
        ...json,
        'points': [
          {'lat': 25.5788, 'lng': 91.8933}
        ],
      };
      final roadWithPoints = RoadStatusModel.fromJson(jsonWithPoints);
      expect(roadWithPoints.points.length, 1);
    });

    test('WeatherForecastModel deserializes 14-day timeline points', () {
      final json = {
        'zone_id': 'NER-MEG-001',
        'zone_name': 'Sohra',
        'current_24h_rainfall_mm': 120.0,
        'cumulative_72h_rainfall_mm': 250.0,
        'rainfall_trend': 'rising',
        'community_gauges_count': 5,
        'timeline': [
          {
            'date': '2026-09-13',
            'day_label': 'Sun',
            'rainfall_imd_mm': 45.0,
            'rainfall_community_mm': 42.0,
            'predicted_risk_score': 0.75,
            'is_forecast': false,
          }
        ],
      };

      final weather = WeatherForecastModel.fromJson(json);
      expect(weather.rainfallTrend, 'rising');
      expect(weather.timeline.length, 1);
      expect(weather.timeline.first.rainfallImdMm, 45.0);
    });
  });

  group('AuthTokensModel & UserProfileModel Tests', () {
    test('AuthTokensModel parses JWT and officer roles', () {
      final json = {
        'access_token': 'test-token-123',
        'token_type': 'bearer',
        'user_id': 'officer-01',
        'username': 'dmo_shillong',
        'full_name': 'Disaster Officer',
        'role': 'dmo',
        'district': 'East Khasi Hills',
        'escalation_level': 2,
      };

      final model = AuthTokensModel.fromJson(json);
      expect(model.accessToken, 'test-token-123');
      expect(model.username, 'dmo_shillong');
      expect(model.escalationLevel, 2);
    });

    test('UserProfileModel maps backend profile fields', () {
      final json = {
        'user_id': 'u-1',
        'username': 'officer',
        'full_name': 'Senior DMO',
        'contact_number': '+91-9876543210',
        'role': 'dmo',
        'district': 'West Kameng',
      };

      final profile = UserProfileModel.fromJson(json);
      expect(profile.name, 'Senior DMO');
      expect(profile.phone, '+91-9876543210');
      expect(profile.district, 'West Kameng');
    });
  });
}
