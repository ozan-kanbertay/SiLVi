const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: true,
    icon: 'images/icon',
    ignore: [
      'examples', 
      'installers'
    ],
    osxSign: {},
    osxNotarize: {
      keychainProfile: 'notarization'
    }
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: (arch) => ({
        // An URL to an ICO file to use as the application icon (displayed in Control Panel > Programs and Features).
        iconUrl: '',
        // The ICO file to use as the icon for the generated Setup.exe
        setupIcon: 'images/icon.ico',
        // remoteReleases: `https://bitbucket.org/kanbertay/ethowatch/downloads`
      }),
    },
    {
      name: '@electron-forge/maker-zip',
      config: (arch) => ({
        // macUpdateManifestBaseUrl: `https://bitbucket.org/kanbertay/ethowatch/downloads`
      }),
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        format: 'ULMO',
        icon: 'images/icon.icns'
      },
      platforms: ['darwin']
      
    },
    // {
    //   name: '@electron-forge/maker-pkg',
    //   config: {
    //     icon: 'images/icon.icns'
    //   },
    //   // platforms: ['darwin']
    // },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          maintainer: 'Ozan Kanbertay',
          homepage: 'https://github.com/ozan-kanbertay/silvi',
          icon: 'images/icon.png',
          name: 'SILVI',
          title: 'SILVI',
          summary: 'Simple Interface for Labeling Video Interactions',
          description: 'SILVI enables researchers to annotate behaviors and interactions directly within video data, generating structured outputs suitable for training and validating computer vision models.',
          categories: [ "Science", "Video" ]
        }
      },
    },
    // {
    //   name: '@electron-forge/maker-rpm',
    //   config: {},
    // },
  ],
  // publishers: [
  //   {
  //     name: '@electron-forge/publisher-bitbucket',
  //     platforms: ['darwin', 'linux'],
  //     config: {
  //       repository: {
  //         owner: 'kanbertay',
  //         name: 'ethowatch-updates',
  //       },
  //       replaceExistingFiles: true,
  //       auth: {
  //         username: process.env.BITBUCKET_USERNAME, 
  //         appPassword: process.env.BITBUCKET_APP_PASSWORD 
  //       },
  //     }
  //   }
  // ],
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
