/**
 * The preload script runs before. It has access to web APIs
 * as well as Electron's renderer process modules and some
 * polyfilled Node.js functions.
 *
 * https://www.electronjs.org/docs/latest/tutorial/sandbox
 */


const { contextBridge, ipcRenderer, shell} = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getPlatform: () => {return process.platform},
  openPath: (path) => shell.openPath(path),
  showItemInFolder: (path) => shell.showItemInFolder(path),
  getVersion: () => ipcRenderer.invoke('getVersion'),
  openSingleVideo: () => ipcRenderer.invoke('dialog:openSingleVideo'),
  openMultipleVideos: () => ipcRenderer.invoke('dialog:openMultipleVideos'),
  getVideosFromDir: (dirPath) => ipcRenderer.invoke('getVideosFromDir', dirPath),
  copyToUserDataDir: (filePath, fileName) => ipcRenderer.invoke('copyToUserDataDir', filePath, fileName),
  findTrackingFile: (videoFilePath, dirPath) => ipcRenderer.invoke('findTrackingFile', videoFilePath, dirPath),
  readTrackingFile: (trackingFilePath) => ipcRenderer.invoke('readTrackingFile', trackingFilePath),
  readInteractionFile: (interactionFilePath) => ipcRenderer.invoke('readInteractionFile', interactionFilePath),
  readNameFile: (nameFilePath) => ipcRenderer.invoke('readNameFile', nameFilePath),
  saveTrackingEdits: (trackArr, fileName, individualNamesArr, username) => ipcRenderer.invoke('saveTrackingEdits', trackArr, fileName, individualNamesArr, username),
  findMetadataFile: (videoFilePath, dirPath) => ipcRenderer.invoke('findMetadataFile', videoFilePath, dirPath),
  readMetadataFile: (filePath) => ipcRenderer.invoke('readMetadataFile', filePath),
  saveMetadata: (metadata, fileName) => ipcRenderer.invoke('saveMetadata', metadata, fileName),
  findBehaviorFile: (videoFilePath, dirPath) => ipcRenderer.invoke('findBehaviorFile', videoFilePath, dirPath),
  writeBehaviorsToFile: (observations, fileName, videoFPS, username, withMetadata) => ipcRenderer.invoke('writeBehaviorsToFile', observations, fileName, videoFPS, username, withMetadata),
  readBehaviorFile: (filePath) => ipcRenderer.invoke('readBehaviorFile', filePath),
  exportBehaviors: (observations, fileName, videoFPS, username, withMetadata) => ipcRenderer.invoke('dialog:exportBehaviors', observations, fileName, videoFPS, username, withMetadata),
  outputTrackingFile: (trackingMap, fileName, individualNamesArr) => ipcRenderer.invoke('dialog:outputTrackingFile', trackingMap, fileName, individualNamesArr),
  outputTrackingTable: (tableContent, fileName) => ipcRenderer.invoke('dialog:outputTrackingTable', tableContent, fileName),
  saveInteractionTable: (tableContent, fileName) => ipcRenderer.invoke('dialog:saveInteractionTable', tableContent, fileName),
  findNotesFile: (videoFilePath, dirPath) => ipcRenderer.invoke('findNotesFile', videoFilePath, dirPath),
  readNotesFile: (filePath) => ipcRenderer.invoke('readNotesFile', filePath),
  writeNotesToFile: (text, fileName, username) => ipcRenderer.invoke('writeNotesToFile', text, fileName, username),
  exportNotes: (text, fileName, username) => ipcRenderer.invoke('dialog:exportNotes', text, fileName, username),
  openSingleFile: (fileType) => ipcRenderer.invoke('dialog:openSingleFile', fileType),
  getExperimentDirPath: () => ipcRenderer.invoke('dialog:getExperimentDirPath'),
  getFileNameWithoutExtension: (filePath) => ipcRenderer.invoke('getFileNameWithoutExtension', filePath),
  saveToConfig: (settingData) => ipcRenderer.invoke('saveToConfig', settingData),
  getFromConfig: () => ipcRenderer.invoke('getFromConfig'),
  removeFromConfig: (configKeys) => ipcRenderer.invoke('removeFromConfig', configKeys),
  saveSnapshot: (imageData) => ipcRenderer.invoke('dialog:saveSnapshot', imageData),
  relaunch: () => ipcRenderer.invoke('relaunch'),
  quit: () => ipcRenderer.invoke('quit'),
  exit: () => ipcRenderer.invoke('exit'),
  openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  saveTrackingHTML: (tableHTML, videoName) => ipcRenderer.invoke('saveTrackingHTML', tableHTML, videoName),
  getLastModifiedTime: (filePath) => ipcRenderer.invoke('getLastModifiedTime', filePath),
  exportAll: (dirPath) => ipcRenderer.invoke('dialog:exportAll', dirPath),
  calcVideoFrameRate: (videoFilePath) => ipcRenderer.invoke('calcVideoFrameRate', videoFilePath),
  onAppQuit: (callback) => ipcRenderer.on('before-quit', (_event, value) => callback(value)),
  respondBeforeQuit: () => ipcRenderer.send('response-before-quit'),
  clearAppData: () => ipcRenderer.invoke('clear-app-data'),
  checkUpdates: () => ipcRenderer.invoke('check-updates'),
  getExampleFilePaths: () => ipcRenderer.invoke('getExampleFilePaths'),
  // getUpdates: (callback) => ipcRenderer.on('update-available',  (_event, value) => callback(value))

});
































// })