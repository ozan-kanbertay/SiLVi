const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: true,
    icon: 'icons/icon',
    ignore: [
      // 'examples', 
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
        iconUrl: 'https://github.com/ozan-kanbertay/silvi/blob/8ed93440afd5bee3e7e3e75ecfaed5b394bb4015/icons/icon.ico',
        // The ICO file to use as the icon for the generated Setup.exe
        setupIcon: 'icons/icon.ico',
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
        icon: 'icons/icon.icns'
      },
      platforms: ['darwin']
      
    },
    // {
    //   name: '@electron-forge/maker-pkg',
    //   config: {
    //     icon: 'icons/icon.icns'
    //   },
    //   // platforms: ['darwin']
    // },
    {
      name: '@electron-forge/maker-flatpak',
      config: {
        options: {
          categories: ['Science', 'Video'],
          icon: 'icons/icon.png',
          name: 'SILVI',
          // id: 'org.flatpak.silvi',
          description: 'SILVI enables researchers to annotate behaviors and interactions directly within video data, generating structured outputs suitable for training and validating computer vision models.',
          // base: 'org.flatpak.silvi.BaseApp'
        }
      }
    },
    // {
    //   name: '@electron-forge/maker-snap',
    //   config: {
    //     features: {
    //       audio: true,
    //       video: true,
    //       webgl: true
    //     },
    //     summary: 'Pretty Awesome'
    //   }
    // },
    // {
    //   name: '@electron-forge/maker-deb',
    //   config: {
    //     options: {
    //       maintainer: 'Ozan Kanbertay',
    //       homepage: 'https://github.com/ozan-kanbertay/silvi',
    //       icon: 'icons/icon.png',
    //       name: 'SILVI',
    //       title: 'SILVI',
    //       summary: 'Simple Interface for Labeling Video Interactions',
    //       description: 'SILVI enables researchers to annotate behaviors and interactions directly within video data, generating structured outputs suitable for training and validating computer vision models.',
    //       categories: [ 'Science', 'Video' ]
    //     }
    //   },
    // },
    // {
    //   name: '@electron-forge/maker-rpm',
    //   config: {},
    // },
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'ozan-kanbertay',
          name: 'silvi',
          authToken: process.env.GITHUB_TOKEN,
        },
        prerelease: false,
        draft: true
      }
    }
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
