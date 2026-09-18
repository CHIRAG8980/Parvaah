import { defineConfig } from 'mobilewright';

export default defineConfig({
  platform: 'android',
  bundleId: 'com.landslide.mobile',
  deviceName: 'Pixel 9',
  timeout: 60_000,
  testDir: './tests/mobile',
});
