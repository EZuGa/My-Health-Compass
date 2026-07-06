import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.b8265ded822a4e8e9ebe71ec2335869a',
  appName: 'medical-record',
  webDir: 'dist',
  server: {
    // Hot-reload from the Lovable preview while developing on a device.
    // Remove `url` (or point to your published domain) to ship a fully offline native build.
    url: 'https://b8265ded-822a-4e8e-9ebe-71ec2335869a.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
};

export default config;
