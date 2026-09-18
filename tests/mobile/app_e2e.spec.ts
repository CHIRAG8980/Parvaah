import { test, expect } from 'mobilewright';

test.describe('Parvaah Mobile E2E Test Suite', () => {
  test('1. Verify Home Screen Metrics & Quick Actions', async ({ screen, device }) => {
    // Check brand header & jurisdiction
    await expect(screen.getByText('Parvaah')).toBeVisible();
    await expect(screen.getByText('Safer Northeast Together')).toBeVisible();
    await expect(screen.getByText('East Khasi Hills, Meghalaya')).toBeVisible();

    // Verify Quick Action Dock
    await expect(screen.getByText('Risk Map')).toBeVisible();
    await expect(screen.getByText('Weather')).toBeVisible();
    await expect(screen.getByText('Road Status')).toBeVisible();
    await expect(screen.getByText('Alerts')).toBeVisible();

    // Verify Today's Overview cards
    await expect(screen.getByText("Today's Overview")).toBeVisible();
    await expect(screen.getByText('High Risk')).toBeVisible();
    await expect(screen.getByText('Affected Roads')).toBeVisible();
    await expect(screen.getByText('Safe Routes')).toBeVisible();
  });

  test('2. Verify GIS Risk Map & Marker Telemetry', async ({ screen }) => {
    // Tap on Map bottom tab
    await screen.getByLabel('Map').tap();

    // Verify Map title & Controls
    await expect(screen.getByText('Risk Map')).toBeVisible();

    // Verify Sohra-Shillong marker card is present
    await expect(screen.getByText('Sohra-Shillong')).toBeVisible();

    // Verify rainfall telemetry is loaded from real factors (e.g. 80mm Rain)
    await expect(screen.getByText(/80mm Rain|Rain:/i)).toBeVisible();

    // Open Zone Details Sheet
    await screen.getByText('View Details').tap();

    // Verify authentic multi-model ML inference scores
    await expect(screen.getByText('High Landslide Risk')).toBeVisible();
    await expect(screen.getByText('46% Risk')).toBeVisible();
    await expect(screen.getByText('Model 1 · Static Susceptibility')).toBeVisible();
    await expect(screen.getByText('Model 2 · Dynamic Hazard Trigger')).toBeVisible();
    await expect(screen.getByText('Model 3 · Historical Pre-Event Similarity')).toBeVisible();
    await expect(screen.getByText('Model 4 · Multi-Modal Fused Risk')).toBeVisible();
  });

  test('3. Verify Emergency Alerts Queue & Filtering', async ({ screen }) => {
    // Tap on Alerts tab
    await screen.getByLabel('Alerts').tap();

    // Verify Alerts title & active warnings
    await expect(screen.getByText('Emergency Alerts')).toBeVisible();
    await expect(
      screen.getByText(/HIGH LANDSLIDE WARNING: Prepare for Precautionary Measures/i)
    ).toBeVisible();

    // Verify emergency actions
    await expect(screen.getByText('Helpline 1077')).toBeVisible();
    await expect(screen.getByText('Acknowledge')).toBeVisible();

    // Test filter chips
    await screen.getByText('High').tap();
    await expect(
      screen.getByText(/HIGH LANDSLIDE WARNING: Prepare for Precautionary Measures/i)
    ).toBeVisible();

    await screen.getByText('All').tap();
  });

  test('4. Verify Safety & Preparedness Protocols', async ({ screen }) => {
    // Tap on Safety tab
    await screen.getByLabel('Safety').tap();

    // Verify Safety title & protocols
    await expect(screen.getByText('Safety & Preparedness')).toBeVisible();
    await expect(screen.getByText('Landslide Early Warning & Hill Safety')).toBeVisible();
    await expect(screen.getByText('Monsoon Torrential Rain & Inundation')).toBeVisible();
    await expect(screen.getByText('Riverine Flash Floods & Dam Surges')).toBeVisible();
  });

  test('5. Verify User Profile & Administrative Role', async ({ screen }) => {
    // Tap on Profile tab
    await screen.getByLabel('Profile').tap();

    // Verify Profile details
    await expect(screen.getByText('My Profile')).toBeVisible();
    await expect(screen.getByText('pratham rajbhar')).toBeVisible();
    await expect(screen.getByText('Role: ADMIN')).toBeVisible();
    await expect(screen.getByText('Jurisdiction: East Khasi Hills')).toBeVisible();

    // Verify Emergency Action Helplines
    await expect(screen.getByText('Disaster Helpline (1077)')).toBeVisible();
    await expect(screen.getByText('National Emergency (112)')).toBeVisible();
    await expect(screen.getByText('Sign Out')).toBeVisible();
  });
});
