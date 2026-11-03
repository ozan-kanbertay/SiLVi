const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

const commonLinuxConfig = {
  name: 'silvi',
  productName: 'SiLVi',
  genericName: 'Video Annotation Tool',
  title: 'SiLVi',
  description: 'Simple Interface for Labeling Video Interactions',
  productDescription: 'SiLVi enables researchers to annotate behaviors and interactions directly within video data, generating structured outputs suitable for training and validating computer vision models.',
  homepage: 'https://silvi.eckerlab.org',
  maintainer: 'Ozan Kanbertay',
  icon: 'icons/icon.png',
  categories: [ 'Science', 'Video' ],
  section: 'science',
};

const fs = require('fs');
const path = require('path');

const removeForeignOnnxBinaries = async (_buildPath, electronVersion, platform, arch) => {
  if (platform !== 'linux' || arch !== 'arm64') return;

  const onnxBin = path.join(
    _buildPath,
    'resources/app.asar.unpacked',
    'node_modules',
    'onnxruntime-node',
    'bin',
    'napi-v6',
    'linux',
    'x64',
    'onnxruntime_binding.node'
  );

  if (fs.existsSync(onnxBin)) fs.rmSync(onnxBin);
};


module.exports = {
  packagerConfig: {
    asar: true,
    afterCopy: [removeForeignOnnxBinaries],
    icon: 'icons/icon',
    ignore: [
      // 'examples',
      'installers',
      'docs',
      '.github'
    ],
    osxSign: {
      identity: 'Developer ID Application'
    },
    osxNotarize: {
      appleId: process.env.APPLE_ID_EMAIL,
      appleIdPassword: process.env.APPLE_ID_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID
    }
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: (arch) => ({
        // An URL to an ICO file to use as the application icon (displayed in Control Panel > Programs and Features).
        iconUrl: 'https://raw.githubusercontent.com/ozan-kanbertay/silvi/8ed93440afd5bee3e7e3e75ecfaed5b394bb4015/icons/icon.ico',
        // The ICO file to use as the icon for the generated Setup.exe
        setupIcon: 'icons/icon.ico',
      }),
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
      config: (arch) => ({
        // macUpdateManifestBaseUrl: `https://bitbucket.org/kanbertay/ethowatch/downloads`
      }),
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        format: 'ULMO',
        icon: 'icons/icon.icns'
      },
      platforms: ['darwin']
    },
    {
      name: '@electron-forge/maker-deb',
      config: commonLinuxConfig,
      platforms: ['linux'],
    },
    {
      name: '@electron-forge/maker-rpm',
      config: commonLinuxConfig,
      platforms: ['linux'],
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
