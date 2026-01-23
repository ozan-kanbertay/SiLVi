// Modules to control application life and create native browser window
const { app, BrowserWindow, Menu, MenuItem, ipcMain, dialog } = require('electron');
const { MediaInfo , mediaInfoFactory} = require('mediainfo.js');
const ffmpegPath = require('ffmpeg-static');
// const { updateElectronApp, UpdateSourceType } = require('update-electron-app');
require('update-electron-app')();


// run this as early in the main process as possible 
// https://www.electronforge.io/config/makers/squirrel.windows
if (require('electron-squirrel-startup')) app.quit();

// updateElectronApp({
//   updateSource: {
//     type: UpdateSourceType.StaticStorage,
//     baseUrl: `https://bitbucket.org/kanbertay/ethowatch/downloads/`,
//   },
// });


const isMac = process.platform === 'darwin'

const menuTemplate = [
  // { role: 'appMenu' }
  ...(isMac
    ? [{
        label: app.name,
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' }
        ]
      }]
    : []),
  // { role: 'fileMenu' }
  {
    label: 'File',
    submenu: [
      isMac ? { role: 'close' } : { role: 'quit' }
    ]
  },
  // { role: 'editMenu' }
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      // { role: 'redo' },
      // { type: 'separator' },
      // { role: 'cut' },
      // { role: 'copy' },
      // { role: 'paste' },
      // ...(isMac
      //   ? [
      //       // { role: 'pasteAndMatchStyle' },
      //       { role: 'delete' },
      //       // { role: 'selectAll' },
      //       // { type: 'separator' },
      //     ]
      //   : [
      //       { role: 'delete' },
      //       // { type: 'separator' },
      //       // { role: 'selectAll' }
      //     ])
    ]
  },
  // { role: 'viewMenu' }
  {
    label: 'View',
    submenu: [
      // { role: 'reload' },
      // { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      // { role: 'resetZoom' },
      // { role: 'zoomIn' },
      // { role: 'zoomOut' },
      // { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  // { role: 'windowMenu' }
  {
    label: 'Window',
    submenu: [
      { role: 'minimize' },
      { role: 'zoom' },
      ...(isMac
        ? [
            { type: 'separator' },
            { role: 'front' },
            { type: 'separator' },
            { role: 'window' }
          ]
        : [
            { role: 'close' }
          ])
    ]
  },
  // {
  //   role: 'help',
  //   submenu: [
  //     {
  //       label: 'Learn More',
  //       click: async () => {
  //         const { shell } = require('electron')
  //         await shell.openExternal('https://electronjs.org')
  //       }
        
  //     }
  //   ]
  // }
]


// Use win32 property for consistency across Windows and MacOS
// https://nodejs.org/api/path.html#windows-vs-posix

const path = process.platform === 'win32' ? require('node:path/win32') : require('node:path/posix');
const fs = require('node:fs')
const readline = require('node:readline');

const videoFormatNames = ['mkv', 'avi', 'mp4'];
const videoExtensions = videoFormatNames.map(name => '.' + name)
const configFileName = 'config.json';

// Define column headers for behavior records
const behaviorColHeaderRow  = [
  'Subject', 'Action', 'Target', 
  'StartFrame', 'EndFrame', 'DurationInFrames', 
  'StartSecond', 'EndSecond', 'DurationInSeconds'
];

// Define the tracking data columns
const trackingColNames = [
  'trackNumber', 'trackId', 'x', 'y', 'width', 'height', 'confidenceTrack', 
  'classId', 'nameOrder', 'confidenceId'
];

// Define the value for variables which do not have defined values
const naStr = 'NA';

// Define CSV delimiter
const csvDelimiter = ',';

// Numbers after decimal point for time-related values in exported files
const precisionForSeconds = 4;

// User data directory path for the app
const userDataDir = app.getPath('userData');
const appDataDir = path.join(userDataDir, 'appData');

// Create the app data folder if it does not exist already
if (!fs.existsSync(appDataDir)) {
  try {
    fs.mkdirSync(appDataDir);
  } catch (err) {
    console.error(err);
  }

}








/**
 * 
 * @param {*} folderPath 
 * @returns 
 */
async function getFilesInFolder(folderPath) {
  try {
    if (fs.existsSync(folderPath)) {
      const isFile = fileName => {
        return fs.lstatSync(fileName).isFile();
      };
      const files = fs.readdirSync(folderPath)
        .map(fileName => {
          return path.join(folderPath, fileName);
        })
        .filter(isFile);
      return files
    }
  } catch (err) {
    console.error(err);
  }

}


function handleClearAppData() {
  
  try {
    fs.rmSync(appDataDir, { recursive: true, force: true });
    console.log(`${appDataDir} is deleted!`);
    return 'success';
  } catch (err) {
    console.error(`${appDataDir} could not be deleted!`, err);
  }


}


function handleResetSettings() {
  const configFilePath = path.join(appDataDir, configFileName);
  try {
    fs.unlinkSync(configFilePath);
    console.log('Config file deleted successfully!', configFileName)
    return configFilePath;
  } catch (err) {
    console.log('Error deleting config file!', err);
    return;
  }
}

/**
 * Copies a file to the user data directory with a given name
 * @param {import('node:fs').PathLike} filePath File path of the original file
 * @param {String} fileName File name of the copy in the user data directory
 * @returns
 */
function handleCopyToUserDataDir(filePath, fileName) {
  const pathInUserDataDir = path.join(appDataDir, fileName);
  
  try {
    fs.copyFileSync(filePath, pathInUserDataDir);
    console.log(`${filePath} was copied to ${pathInUserDataDir}`);
    return {success: true};
  } catch {
    console.error('The file could not be copied to the user data directory!');
  }

}

async function handleOpenDirectory () {      
  const { canceled, filePaths } = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    title: 'Choose a directory',
    // filters: [{ name: 'Movies', extensions: ['mkv', 'avi', 'mp4'] }],
    properties: ['openDirectory'],
    message: "Choose a directory"
  })

  if (canceled) {
    return { canceled: true }
  }
  
  if (!canceled) {
    const dirPath = filePaths[0];

    // Check read/write access
    try {
      fs.accessSync(dirPath, fs.constants.R_OK | fs.constants.W_OK);
      console.log(`${dirPath} is readable/writable`);
      return { dirPath: dirPath };
    } catch (err) {
      console.error(`${dirPath} is NOT accessible!`);
    } 
    
  }
}


// Get video file path list if user placed them in the specific folder
async function handleGetVideosFromDir(experimentDir) {
  
  const isFile = filePath => {
    return fs.lstatSync(filePath).isFile()
  }
  
  const isVideo = filePath => {
    return videoExtensions.includes(path.extname(filePath))
  }
  
  // const videoDirPath = path.join(__dirname, 'Experiment', 'Videos')
  const videoDirPath = path.join(experimentDir, 'Videos')

  if (fs.existsSync(videoDirPath)) {
    const videoFilePaths = fs.readdirSync(videoDirPath)
    .map(fileName => {return path.join(videoDirPath, fileName)})
    .filter(isFile)
    .filter(isVideo);
    return videoFilePaths
  } else {
    console.log('No video folder could be found!')
    return 
  }

    

}

/**
 * 
 * Function to determine delimiter
 * @param {*} line - A line in a file
 * @returns {String} - file delimiter
 */
function determineDelimiter(line) {

  // Array of potential delimiters to test
  const potentialDelimiters = [',', ';', '\t', '|', ' ', ':'];

  // Iterate through each potential delimiter and count occurrences
  let maxCount = 0;
  let delimiter = '';
  potentialDelimiters.forEach(potentialDelimiter => {
    let count = line.split(potentialDelimiter).length - 1;
    if (count > maxCount) {
      maxCount = count;
      delimiter = potentialDelimiter;
    }

  });

  return delimiter;

}

async function handleReadInteractionFile(filePath) {
  const data = fs.readFileSync(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
  });
  
  const delimiter = determineDelimiter(filePath);
  
  // Split the file content into rows
  const rows = data.split('\n').map(row => row.split(delimiter));
  
  // Array to save observations
  let observationArr = [];
  
  // Initialize last observation properties
  let lastSubjectId;
  let lastObjectId;
  let lastLabel;
  let lastFrameNumber;
  let lastObservation;

  // Iterate over rows to collapse each observation (with consecutive properties) into a single entry
  rows.forEach(row => {
    const [frameNumber, subjectId, objectId, label] = row;

    // Check if you encountered a new observation
    if (subjectId !== lastSubjectId || objectId !== lastObjectId || lastLabel !== label) {
      
      // Complete the last observation and add it to the array
      if (lastObservation) {
        lastObservation.timeEnd = lastFrameNumber;
        observationArr.push(lastObservation);
      }

      // Start a new observation
      let newObservation = {
        subjectId: subjectId,
        objectId: objectId,
        label: label,
        timeStart: parseInt(frameNumber),
        timeEnd: 'TBD'
      }

      lastSubjectId = subjectId;
      lastObjectId = objectId;
      lastLabel = label;

      lastObservation = newObservation;

    }

    // Always keep track of frame number
    lastFrameNumber = parseInt(frameNumber);

  })

  if (observationArr.length > 0) {
    return observationArr;
  }

}

/**
 * Reads a tracking file with or without identification labels (i.e. individual IDs/names)
 * @param {import('node:fs').PathLike} filePath Absolute file path of the tracking file
 * @returns {Object[] | undefined} Array of Objects for all tracks or undefined if the operation was unsuccessful
 */
function handleReadTrackingFile(filePath) {
  // Reads all tracks into a master Array which consists of track Objects. 
  // The master Array will be referenced by two lookup tables/Maps in the front end.
    // 1. idMap: { classId: { trackId: masterArray[idx] }
    // 2. frameMap: { trackNumber: masterArray[idx] }

  if (!trackingColNames) return;

  return new Promise((resolve, reject) => {

    // Check if a file path is given
    if (!filePath) {
      const reason = 'No file path was given for the tracking file!';
      console.log(reason);
      reject(reason);
      return;
    }

    // Check if the given path exists
    if (!fs.existsSync(filePath)) {
      const reason = `Given path for the tracking file does not exist! ${filePath}`;
      console.log(reason);
      reject(reason);
      return;
    }

    // Check if the given path is accessible
    try {
      fs.accessSync(filePath, fs.constants.R_OK)
    } catch (err) {
      console.log(err);
      const reason = `Given path for the tracking file cannot be read! ${filePath}`;
      reject(reason);
      return;
    }

    // Define the variables that should be Strings or have float and integer values
    const floatVarNames = ['width', 'height', 'w', 'h', 'x', 'y', 'confidence'];
    const intVarNames = ['nameOrder', 'order'];
    const idVarNames = ['classId', 'trackId'];
    const masterVarNames = ['trackNumber', 'frameNumber']; // These are the main values to determine the validity of the row

    const readStream = fs.createReadStream(filePath);

    const rl = readline.createInterface({
      input: readStream,
      // output: stdout,
      crlfDelay: Infinity // For reading files with \r\n line delimiter
    });

    // Initialize an array for holding track objects
    const tracks = [];

    // Read and process each line
    rl.on('line', (line) => {

      // Skip header lines (metadata) starting with "#" character
      if (!line.startsWith('#')) {

        // Split the line into columns
        const delimiter = line.includes(';') ? ';' : ',';
        // console.log('Delimiter:', delimiter);
        const lineArr = line.split(new RegExp('\\s*' + delimiter + '\\s*'));
        // console.log('Splitted line regex', new RegExp('\\s*' + delimiter + '\\s*'));

        // Skip the empty line
        if (lineArr.length === 0) return;

        // Object for each track to contain key-value pairs 
        const trackObj = {}; 

        // Iterate over the tracking data column names
        for (let idx = 0; idx < trackingColNames.length; idx++) {

          // Get the column name
          const colName = trackingColNames[idx];
        
          // Link each column of the row to its corresponding variable name
          // First convert everything to string and remove all white spaces
          trackObj[colName] = lineArr[idx] ? lineArr[idx].toString().replace(/\s+/g, '') : naStr;  

          // Convert column name to lower case for robust comparison
          const lowColName = colName.toLowerCase();

          // Skip an iteration which corresponds to an invalid row
          const isMasterVar = masterVarNames.some(varName => lowColName.includes(varName));
          if (isMasterVar && Number.isNaN(parseInt(trackObj[colName]))) {
            return;
          };

          // Format float columns
          const isFloat = floatVarNames.some(varName => lowColName.includes(varName));
          if (isFloat) {
            const parsedVal = parseFloat(trackObj[colName]);
            trackObj[colName] = Number.isNaN(parsedVal) ? naStr : parsedVal;
          }

          // Format integer columns
          const isInt = intVarNames.some(varName => lowColName.includes(varName));
          if (isInt) {
            const parsedVal = parseInt(trackObj[colName]);
            trackObj[colName] = Number.isNaN(parsedVal) ? naStr : parsedVal;
          }

          // If all track object values are empty, ignore the line
          const isInvalidObj = Object.values(trackObj).every(value => value === naStr || value === null || typeof value === 'undefined');
          if (isInvalidObj) return;
  
        }

        // Add the extracted track data to final array
        tracks.push(trackObj);

      }

    });

    // Return the result if process was successful
    rl.on('close', () => {
      console.log('File reading finished');
      // readStream.destroy();
      resolve(tracks);
  
    });
  
    // Check for line reading errors
    rl.on('error', (err) => {
      console.error('Cleaning up:', err);
      readStream.destroy();
      reject(err);
    });

    // Handle read stream errors
    readStream.on('error', (err) => {
      console.log('Failed to open the stream:', err);
      readStream.destroy();
      reject(err);
    });

  });

}


  
/**
 * Reads a tracking file with or without identification labels (i.e. individual IDs/names)
 * @param {import('node:fs').PathLike} filePath Absolute file path of the tracking file
 * @returns {Object[] | undefined} Array of Objects for all tracks or undefined if the operation was unsuccessful
 */
function handleReadTrackingFileOld(filePath) {
  // Reads all tracks into a master Array which consists of track Objects. 
  // The master Array will be referenced by two lookup tables/Maps in the front end.
    // 1. idMap: { classId: { trackId: masterArray[idx] }
    // 2. frameMap: { trackNumber: masterArray[idx] }

  if (!filePath) return;

  if (!trackingColNames) return;
  
  const data = fs.readFileSync(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
  });

  
  // Skip header lines (metadata) starting with "#" character
  const filteredRows = data.split('\n').filter(row => !row.startsWith('#')) 
  
  // Create an array of rows separated by file delimiter
  const delimiter = determineDelimiter(filteredRows[0]);
  const rows = filteredRows.map(row => row.split(delimiter));

  // const trackingMap = new Map();  // Tracking map track/frame numbers as keys
  // let uniqueSpecies = new Set(); // Find unique class values
  // const uniqueTrackIds = new Map(); // Find unique track ID values
  
  // Tracking map with class and track IDs as keys. 
  // Each class has an inner Map as its value.
  // Each inner Map has track IDs as keys and arrays of Objects for track info as values.
  // idMap structure: Map(classId: Map(trackId: Array of Obj(trackInfo)))
  // const idMap = new Map(); 

  // Define the variables that should be Strings or have float and integer values
  const floatVarNames = ['width', 'height', 'w', 'h', 'x', 'y', 'confidence'];
  const intVarNames = ['nameOrder', 'order'];
  const idVarNames = ['classId', 'trackId'];
  const masterVarNames = ['trackNumber', 'frameNumber']; // These are the main values to determine the validity of the row

  // Initialize an array for holding track objects
  const tracks = [];

  rows.forEach(row => {
    // const [trackNumber, trackId, x, y, width, height, confidenceTrack, classId, nameOrder, confidenceId] = row;
    
    // Flag for skipping empty/invalid rows
    let shouldSkip = true;

    // Object for each track to contain key-value pairs 
    const trackObj = {}; 

    // Iterate over the tracking data column names
    for (let idx = 0; idx < trackingColNames.length; idx++) {

      // Get the column name
      const colName = trackingColNames[idx];
     
      // Link each column of the row to its corresponding variable name
      // First convert everything to string and remove all white spaces
      trackObj[colName] = row[idx] ? row[idx].toString().replace(/\s+/g, '') : naStr;  

      // Convert column name to lower case for robust comparison
      const lowColName = colName.toLowerCase();

      // Skip an iteration which corresponds to an invalid row
      const isMasterVar = masterVarNames.some(varName => lowColName.includes(varName));
      if (isMasterVar && Number.isNaN(parseInt(trackObj[colName]))) {
        shouldSkip = true;
        break;
      };

      // Format float columns
      const isFloat = floatVarNames.some(varName => lowColName.includes(varName));
      if (isFloat) {
        const parsedVal = parseFloat(trackObj[colName]);
        trackObj[colName] = Number.isNaN(parsedVal) ? naStr : parsedVal;
      }

      // Format integer columns
      const isInt = intVarNames.some(varName => lowColName.includes(varName));
      if (isInt) {
        const parsedVal = parseInt(trackObj[colName]);
        trackObj[colName] = Number.isNaN(parsedVal) ? naStr : parsedVal;
      }

      // Add values 
      // trackObj[colName] = variables[colName];
      
    }
    
    // Skip the invalid row
    if (shouldSkip) return;

    // Add the data
    tracks.push(trackObj);
      

    // // Convert Strings to Numbers and back to Strings for consistency to remove white spaces
    // const parsedId = parseInt(trackId).toString();
    // const parsedSpecies = parseInt(class).toString();
    // const parsedFrame = parseInt(trackNumber).toString();

    // // Create the track info object
    // let trackInfo = {
    //   trackNumber: trackNumber ? parseInt(trackNumber) : naStr,
    //   trackId: trackId ? parseInt(trackId) : naStr,
    //   x: x ? parseFloat(x) : naStr,
    //   y: y ? parseFloat(y) : naStr,
    //   width: width ? parseFloat(width) : naStr,
    //   height: height ? parseFloat(height) : naStr,
    //   confidenceTrack: confidenceTrack ? parseFloat(confidenceTrack): naStr,
    //   classId: classId ? classId.toString() : naStr
    // }

    // // Check if it is a identification file
    // if (nameOrder && confidenceId) {
    //   trackInfo.nameOrder = parseInt(nameOrder);
    //   trackInfo.confidenceId = parseFloat(confidenceId);
    // }

    // Add it to the master array
    // tracks.push(trackInfo);
  
    // // Populate the tracking map
    // if (!trackingMap.has(parsedFrame)) {
    //   trackingMap.set(parsedFrame, [trackInfo]);
    // } else {
    //   trackingMap.get(parsedFrame).push(trackInfo);
    // }


    // // Create a Map with classes and track IDs as the keys
    // if (!idMap.has(parsedSpecies)) {
    //   idMap.set(parsedSpecies, new Map([[parsedId, [trackInfo]]]));
    // } else {
    //   const innerMap = idMap.get(parsedSpecies);
    //   if (!innerMap.has(parsedId)) {
    //     innerMap.set(parsedId, [trackInfo]);
    //   } else {
    //     const trackInfoArr = innerMap.get(parsedId);
    //     if (trackInfoArr && Array.isArray(trackInfoArr)) trackInfoArr.push(trackInfo);
    //   }

    // }

    //   uniqueSpecies.add(parseInt(trackInfo['classId']));
      
    //   if (!isNaN(trackInfo.trackId)) {
    //     if (!uniqueTrackIds.has(trackInfo.classId)) {
    //       uniqueTrackIds.set(trackInfo.classId, new Set())
    //     }
    //     uniqueTrackIds.get(trackInfo.classId).add(trackInfo.trackId);
    //   }
    // })
    
    // let firstAvailTrackIds = new Map();
    // for (let [class, trackIds] of uniqueTrackIds) {
    //   const firstAvailId = Math.max(...uniqueTrackIds.get(class)) + 1;
    //   firstAvailTrackIds.set(class, firstAvailId)
    // }

    // return {
    //   trackingMap: trackingMap, 
    //   idMap: idMap,
    //   uniqueSpecies: uniqueSpecies, 
    //   uniqueTrackIds: uniqueTrackIds,
    //   firstAvailTrackIds: firstAvailTrackIds
    // }
  });

  return tracks
}

/**
 * 
 * @param {*} filePath 
 * @returns - dictionary with rows in the tracking file
 */
// async function handleReadIdentificationFile(filePath) {
//   // Same structure in tracking file until the end of last tracking coordinate
//   // File structure after tracking boxes coordinates:
//   // confidence of tracking: ?
//   // class id: (e.g. 0)
//   // order of identified individual in the individuals.txt file: (e.g. 7)
//   // confidence in detection: (e.g. 0.6600000262260437)

  
//   // Read the file
//   const data = fs.readFileSync(filePath, 'utf8', (err, data) => {
//     if (err) {
//       console.error(err);
//       return;
//     }
//   });
  
  
//   // Determine file delimiter
//   const delimiter = determineDelimiter(filePath);
//   console.log(delimiter)
//   if (!delimiter) {
//     console.log('File delimiter could not be detected!');
//     return;
//   }
  
//   let idMap = new Map();
  
//   // Split file content into rows and then list of entries for each row
//   const rows = data.split('\n').map(row => row.split(delimiter));
//   rows.forEach(row => {
//     const [trackNumber, trackId, x, y, width, height, confidenceTrack, classId, nameOrder, confidenceId] = row;
//     const trackInfo = {
//       'trackNumber': parseInt(trackNumber),
//       'trackId': parseInt(trackId),
//       'x': parseFloat(x),
//       'y': parseFloat(y),
//       'width': parseFloat(width),
//       'height': parseFloat(height),
//       'confidenceTrack': parseFloat(confidenceTrack),
//       'classId': parseInt(classId),
//       'nameOrder': parseInt(nameOrder),
//       'confidenceId': parseFloat(confidenceId)
//     }

//     // Populate the map
//     if (!idMap.has(parseInt(trackNumber))) {
//       idMap.set(parseInt(trackNumber), [trackInfo]);
//     } else {
//       idMap.get(parseInt(trackNumber)).push(trackInfo);
//     }

//   })

//   return {idMap: idMap, fileDelimiter: delimiter}


// }

function handleReadNameFile(filePath) {
  const data = fs.readFileSync(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
  });

  // Split the data into rows
  const rows = data.split('\n');

  // Get the first line to determine file delimiter
  // const delimiter = determineDelimiter(rows[0]);
  // if (!delimiter) {
  //   console.log('File delimiter could not be detected!');
  //   return;
  // }

  const names = rows
  .map(row => row.split(csvDelimiter))
  .filter(row => row.length > 0)
  .flat(Infinity)
  .map(name => name.trim());

  // Attempt to verify the validity of the name file
  const nameCount = names.length;
  const upperThreshold = 1000; // Too many entries
  const lowerThreshold = 1; // Too few entries
  const maxStrLength = 50; // Too long strings - Maximum string length 

  // Result object
  const result = {
    names: null,  // Read names array
    reason: null  // Reason for failure
  }
  
  if (nameCount > upperThreshold) {
    result.reason = `Likely not a valid name file! More than ${upperThreshold} names detected.`;;
  } else if (nameCount < lowerThreshold) {
    result.reason = `Likely not a valid name file! Fewer than ${lowerThreshold} names detected.`;
  } else if (names.some(name => name.length > maxStrLength)) {
    result.reason = `Likely not a valid name file! Some entries have more then ${maxStrLength} characters.`;
  } else {
    result.names = names;
  }

  return result;


}



/**
 * Search for the ethogram file for a video in a given directory
 * @param {import('node:fs').PathLike} videoFilePath | Path of the opened video
 * @param {import('node:fs').PathLike} dirPathToSearch | Optional path of the directory to search for. If no path is given, the default user data directory will be searched.
 * @returns {import('node:fs').PathLike} |  File path or undefined if no path was found
 */
function handleFindBehaviorFile(videoFilePath, dirPathToSearch) {

  // Search user data directory by default
  const dirPath = dirPathToSearch ? dirPathToSearch : appDataDir;

  // console.log('Dir path', dirPath);
  // console.log('Video file path', videoFilePath);
  
  try {
    // Check access
    try {
      fs.accessSync(dirPath, fs.constants.R_OK | fs.constants.W_OK);
    } catch (err) {
      console.log(err);
    }

    // Get the filename without extension
    const videoFileName = path.parse(videoFilePath).name; 

    // Read the directory contents including any subdirectories within it
    const dirContentPaths = fs.readdirSync(dirPath, {recursive: true});

    // Find directory that have an identical name to the video
    // Return the absolute path of the ethogram file
    const filePaths = dirContentPaths
    .filter(entry => {
      const parsedEntry = path.parse(entry);
      return parsedEntry.name.includes(videoFileName) && 
        (parsedEntry.name.includes('behavior') || parsedEntry.name.includes('ethogram')) &&
        parsedEntry.ext.includes('csv'); 
    })
    .map(filteredEntry => path.join(dirPath, filteredEntry))
    return filePaths[0]

  } catch (err) {
    console.log(err);
  }


}

/**
 * Search for the notes file for a video in a given directory
 * @param {import('node:fs').PathLike} videoFilePath | Path of the opened video
 * @param {import('node:fs').PathLike} dirPathToSearch | Optional path of the directory to search for. If no path is given, the default user data directory will be searched.
 * @returns {import('node:fs').PathLike} |  File path or undefined if no path was found
 */
function handleFindNotesFile(videoFilePath, dirPathToSearch) {

  // Search user data directory by default
  const dirPath = dirPathToSearch ? dirPathToSearch : appDataDir;

  
  try {
    // Check access
    try {
      fs.accessSync(dirPath, fs.constants.R_OK | fs.constants.W_OK);
    } catch (err) {
      console.log(err);
    }

    // Get the filename without extension
    const videoFileName = path.parse(videoFilePath).name; 

    // Read the directory contents including any subdirectories within it
    const dirContentPaths = fs.readdirSync(dirPath, {recursive: true});

    // Find directory that have an identical name to the video
    // Return the absolute path of the notes file
    const filePaths = dirContentPaths
    .filter(entry => {
      const parsedEntry = path.parse(entry);
      return parsedEntry.name.includes(videoFileName) && 
        parsedEntry.name.includes('notes') &&
        parsedEntry.ext.includes('txt'); 
    })
    .map(filteredEntry => path.join(dirPath, filteredEntry))
    return filePaths[0]

  } catch (err) {
    console.log(err);
  }


}


/**
 * Search for the metadata file for a video in a given directory
 * @param {import('node:fs').PathLike} videoFilePath | Path of the opened video
 * @param {import('node:fs').PathLike} dirPathToSearch | Optional path of the directory to search for. If no path is given, the default user data directory will be searched.
 * @returns {import('node:fs').PathLike} |  File path or undefined if no path was found
 */
function handleFindMetadataFile(videoFilePath, dirPathToSearch) {

  // Search user data directory by default
  const dirPath = dirPathToSearch ? dirPathToSearch : appDataDir;

  
  try {

    // Check access
    try {
      fs.accessSync(dirPath, fs.constants.R_OK | fs.constants.W_OK);
    } catch (err) {
      console.log(err);
    }

    // Get the filename without extension
    const videoFileName = path.parse(videoFilePath).name; 

    // Read the directory contents including any subdirectories within it
    const dirContentPaths = fs.readdirSync(dirPath, {recursive: true});

    // Find directory that have an identical name to the video
    // Return the absolute path of the notes file
    const filePaths = dirContentPaths
    .filter(entry => {
      const parsedEntry = path.parse(entry);
      return parsedEntry.name.includes(videoFileName) && 
        parsedEntry.name.includes('metadata') &&
        parsedEntry.ext.includes('json'); 
    })
    .map(filteredEntry => path.join(dirPath, filteredEntry))
    return filePaths[0]

  } catch (err) {
    console.log(err);
  }


}


/**
 * Search for tracking files for a video in a given directory
 * @param {import('node:fs').PathLike} videoFilePath Path of the opened video
 * @param {import('node:fs').PathLike} dirPathToSearch Optional path of the directory to search for. If no path is given, the default user data directory will be searched.
 * @returns {Object | undefined} Object with tracking file path and identification file path
 * @returns {import('node:fs').PathLike | undefined} Tracking file path
 * @returns {import('node:fs').PathLike | undefined} Identification file path
 */
function handleFindTrackingFile(videoFilePath, dirPathToSearch) {
  
  // Search user data directory by default
  const dirPath = dirPathToSearch ? dirPathToSearch : appDataDir;
  
  try {

    // Check access
    try {
      fs.accessSync(dirPath, fs.constants.R_OK | fs.constants.W_OK);
    } catch (err) {
      console.log(err);
    }

    // Get the filename without extension
    const videoFileName = path.parse(videoFilePath).name; 

    // Read the directory contents including any subdirectories within it
    const dirContentPaths = fs.readdirSync(dirPath, {recursive: true});

    // Find directory that have an identical name to the video
    // Return the absolute path of the tracking file
    const filePaths = dirContentPaths
    .filter(entry => {
      const parsedEntry = path.parse(entry);
      return parsedEntry.name.includes(videoFileName) && 
        (parsedEntry.name.includes('tracking') || parsedEntry.name.includes('identification')) &&
        parsedEntry.ext.includes('txt'); 
    })
    .map(filteredEntry => path.join(dirPath, filteredEntry))

    // Return the identification file path if it exists
    const idFilePath = filePaths.filter(path => path.includes('identification'))[0];

    // Return the tracking file path if it exists
    const trackFilePath = filePaths.filter(path => path.includes('tracking'))[0];
    
    return {
      idFilePath: idFilePath,
      trackFilePath: trackFilePath
    }

  } catch (err) {
    console.log(err);
  }


}

function handleGetFileNameWithoutExtension(filePath) {
  
  if (!filePath) return;
    
  // Get the base name of the file (including extension)
  const baseName = path.basename(filePath);
  
  // Get the extension of the file
  const ext = path.extname(filePath);

  // Return the base name without the extension
  return baseName.slice(0, -ext.length);


}

async function handleOpenSingleVideo() {      
  const { canceled, filePaths } = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    title: 'Choose a video',
    filters: [{ name: 'Movies', extensions: ['mkv', 'avi', 'mp4'] }],
    properties: ['openFile'],
    message: "Choose a video"
  })
  
  if (!canceled) {
    return filePaths[0]
  }
}

async function handleOpenSingleFile(fileType) {
  const title  = 'Choose a file';
  let message = 'Choose a file';
  if (fileType) {
    message = `Choose a file for ${fileType}`
  }  

  const { canceled, filePaths } = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    title: title,
    filters: [{ name: 'Text', extensions: ['txt', 'csv', 'tsv'] }],
    properties: ['openFile'],
    message: message
  })

  return {
    canceled: canceled,
    filePath: !canceled ? filePaths[0] : null
  }

}

async function handleOpenMultipleVideos() {      
  const { canceled, filePaths } = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    title: 'Choose video files as secondary views',
    filters: [{ name: 'Movies', extensions: ['mkv', 'avi', 'mp4'] }],
    properties: ['openFile', 'multiSelections'],
    message: "Choose video files as secondary views"
  })
  
  if (!canceled) {
    return filePaths
  }
}




/**
 * Exports the behavior records when user clicks the relevant button
 * @param {Object[]} observations - Observations
 * @param {String} fileName - Video filename without extension
 * @param {Number} videoFPS - Video frame rate
 * @returns {Object} Return object consisting of the file path and canceled status
 * @returns {import('node:fs').PathLike | undefined} Path of the exported file or undefined if the operation has failed
 * @returns {boolean} True if the operation is canceled by the user, False otherwise
 */
async function handleExportBehaviors(observations, fileName, videoFPS, username, withMetadata) {
  const result = await dialog.showSaveDialog(BrowserWindow.getFocusedWindow(), {
    title: 'Export Behavior Records',
    defaultPath: `${fileName}_behaviors.csv`,
    filters: [{ name: 'CSV Files', extensions: ['csv'] }]
  });

  // Handle cancellation
  if (result.canceled) {
    return { canceled: true }
  }

  // Check if a valid file path was chosen
  if (!result.canceled && result.filePath) {
    
    // Get the selected file path
    const filePath = result.filePath;

    // Pass the arguments to the writer function
    const confirmedPath = handleWriteBehaviorsToFile(observations, fileName, videoFPS, username, withMetadata, filePath);
    
    return { filePath: confirmedPath, canceled: false };
  
  }

  // Return nothing if dialog is canceled or no valid path was selected
  // return;


}


async function handleSaveInteractionTable(tableContent, fileName) {
  const result = await dialog.showSaveDialog(BrowserWindow.getFocusedWindow(), {
    title: 'Export Interaction Table',
    defaultPath: `${fileName}_behaviors.csv`,
    filters: [{ name: 'CSV Files', extensions: ['csv'] }]
  })

  if (!result.canceled) {
    try {
      fs.writeFileSync(result.filePath, tableContent);
      console.log('File written successfully');
      // return tableContent
      return result.filePath
    } catch (err) {
      console.error(err);
    }
  }

}


/**
 * Writes the notes to a file associated with the main video.
 * If no file path is given, a hidden file in the user data directory is chosen by default.
 * @param {String} text - Note content
 * @param {String} fileName - File name of the main video
 * @param {String} username - Username
 * @param {import('node:fs').PathLike} filePath - Optional file path for saving the file other than user data directory
 * @returns {import('node:fs').PathLike} - File path
 */
function handleWriteNotesToFile(text, fileName, username, filePath) {

  // Get the date in ISO format
  const date = new Date().toISOString();

  // Construct the metadata header text
  const headerRow = `# Notes for ${fileName}`;
  const usernameRow = `# Username: ${username ? username : 'anonymous'}`;

  // Determine the file name with extension
  const fileNameWithExt = fileName ? `${fileName}_notes.txt` : 'notes.txt';

  // Determine the full file path for the notes file
  // Write either to the user data directory (invisible to user) or some other directory chosen by the user
  const pathInUserDataDir = path.join(appDataDir, fileNameWithExt);
  const filePathToWrite = filePath ? filePath: pathInUserDataDir;

  // Write to the ethogram file in the user data directory 
  // Directory is hidden from user, used as a backup against accidental deletions 
  let writeStream = fs.createWriteStream(filePathToWrite);

  if (!writeStream) {
    console.log('Failed to find the file path for the notes!');
    return;
  }

  try {

    // Write the metadata
    writeStream.write(`${headerRow}\n`);
    writeStream.write(`${usernameRow}\n`);

    // Write the main text
    writeStream.write(text);

    // Close the file stream
    writeStream.end();

    // Check if writing to stream is finished
    writeStream.on('finish', () => {
      console.log(`Finished writing to ${filePathToWrite}`);

    });

    // Handle error with the stream
    writeStream.on('error', (err) => {
      console.error('Cleaning up:', err);
      writeStream.destroy();
      return;
    })
  
    // Return the file path
    return filePathToWrite;
  
  } catch (err) {
    console.error(err);
    return;

  }

}

/**
 * Writes the metadata linked to the main video to a file in the user data directory
 * @param {JSON} metadata Metadata in JSON string format
 * @param {String} fileName File name of the main video
 * @returns {Object} Metadata object
 */
async function handleSaveMetadata(metadata, fileName) {
  if (!fileName) return;

  // Construct file path in user data dir
  if (!fs.existsSync(appDataDir)) {
    try {
      fs.mkdirSync(appDataDir);
    } catch (err) {
      console.log(err);
      return;
    }
  }

  // Write metadata to file
  const filePath = path.join(appDataDir, `${fileName}_metadata.json`);
      
  try {
    fs.writeFileSync(filePath, metadata);
    console.log(`Metadata written to file ${filePath}:`, metadata)
    return JSON.parse(metadata);
  } catch (err) {
    console.log(`Metadata could not be written to file ${filePath}`, err);

    return;
  }
  
}


/**
 * Exports notes to a file chosen by the user via dialog menu
 * @param {String} text Main text for the notes
 * @param {String} fileName Video name associated with the notes
 * @param {String} username Username 
 * @returns {Object} Return object consisting of the file path and canceled status
 * @returns {import('node:fs').PathLike} Path of the exported file or undefined if the operation has failed
 * @returns {boolean} True if the operation is canceled by the user, False otherwise
 */
async function handleExportNotes(text, fileName, username) {
  
  // Show dialog for export
  const result = await dialog.showSaveDialog(BrowserWindow.getFocusedWindow(), {
    title: 'Export Notes',
    defaultPath: `${fileName}_notes.txt`,
    filters: [{ name: 'Text Files', extensions: ['txt'] }]
  });

  // Handle cancellation
  if (result.canceled) {
    return { canceled: true }
  }

  // Check if a valid file path was chosen
  if (!result.canceled && result.filePath) {
    
    // Get the selected file path
    const filePath = result.filePath;

    // Pass the arguments to the writer function
    const confirmedPath = handleWriteNotesToFile(text, fileName, username, filePath);
    return { filePath: confirmedPath, canceled: false }
  
  }


}


/**
 * Save modified tracking data to a file in user directory without a dialog
 * @param {Object[]} trackArr | Array of track objects
 * @param {String | undefined} fileName | Video file name without extension
 * @param {Object[] | undefined} orderedNamesArr | Video file name without extension
 * @param {String | undefined} fileDelimiter | Video file name without extension
 * @returns 
 */
async function handleSaveTrackingEdits(trackArr, fileName, orderedNamesArr, username, fileDelimiter) {

  if (!Array.isArray(trackArr)) return;

  // Get the date in ISO format
  const date = new Date().toISOString();
 
  // Assign -1 for name order and confidence ID for the individuals with no identified names
  const numForUnknownIndiv = -1;

  // Set string for empty cells
  const emptyValueString = '';
  
  // if (Array.isArray(orderedNamesArr) && orderedNamesArr.length > 0) {
  //   // Convert ordered name string array to lowercase
  //   const lowerOrderedNamesArr = orderedNamesArr.map(name => name.toLowerCase());
    
  //   // If Unsure string was not in the input array for ordered names
  //   if (lowerOrderedNamesArr.indexOf(unsureString.toLowerCase()) < 0) {
      
  //     // Add Unsure string to name array
  //     orderedNamesArr.push(unsureString);
  //   }

  // }
  
  // Define header for file metadata
  const trackingHeader = {
    // Get the ordered individual names later within the function for outputting tracking file
    username: username ? username : 'anonymous',
    editDate: date, 
    orderedNames: orderedNamesArr,
    dataColumns: trackingColNames
  }

  // Determine file name of the output
  let fileOutName = fileName ? fileName : 'modified';

  // Determine the delimiter
  let delimiter = fileDelimiter ? fileDelimiter : ', ';

  // Determine output path for modified tracking file
  
  // Save path to user data directory by default
  const pathInUserDataDir = path.join(appDataDir, `${fileOutName}_identification.txt`);

  // Write to the tracking file in the user data directory 
  // Directory is hidden from user, used as a backup against accidental deletions 
  let writeStreamUserData
  if (pathInUserDataDir) {
    writeStreamUserData = fs.createWriteStream(pathInUserDataDir);
  }

  if (!writeStreamUserData) {
    console.log('Failed to find the path for tracking file edits!');
    console.log('Tracking file path in user data directory', pathInUserDataDir);
    return;
  }

  try {
    // Write header for metadata
    for (let [key, value] of Object.entries(trackingHeader)) {

      // Separate array values with a comma and space
      const data = Array.isArray(value) ? value.join(', ') : value;
      
      // Write header to both files
      writeStreamUserData.write(`# ${key}: ${data}\n`);

    }

    // Write tracking rows to both files
    trackArr.forEach(trackObj => {
      // Check if track object is valid
      if (typeof trackObj === 'undefined' || trackObj === null) return;   

      const rowUserDataArr = [];

      // Make sure the values in columns align with the order of data columns in the header
      trackingHeader.dataColumns.forEach(colName => {
        
        // Get the value of of each column in the input object  
        const inVal = trackObj[colName];
        
        // Determine column value to be written to the output file
        let outVal;

        if (trackObj.hasOwnProperty(colName)) {
          // If no name is assigned, assign -1 for the name order and confidence ID
          outVal = ['nameOrder', 'confidenceId'].includes(colName) && Number.isNaN(parseInt(inVal)) ? numForUnknownIndiv : inVal;
          rowUserDataArr.push(outVal);
        } else if (['nameOrder', 'confidenceId'].includes(colName)) {
          // If no name order or confidence ID columns exist in the input, assign -1 to them in the output
          rowUserDataArr.push(numForUnknownIndiv);
        }
      });


      // Write each row to file stream
      // const row = Object.values(trackObj).join(delimiter);
      writeStreamUserData.write(`${rowUserDataArr.join(delimiter)}\n`);

    });
  
    writeStreamUserData.on('finish', () => {
      console.log(`Finished writing to ${pathInUserDataDir}`);
    })

    writeStreamUserData.on('error', (err) => {
      console.error('Cleaning up:', err);
      writeStreamUserData.destroy();
    })

    // Close the streams
    writeStreamUserData.end();

    return { 
      pathInUserDataDir: pathInUserDataDir,
    };

  
  } catch (err) {
    console.error(err);
    return;
  }


}

/**
 * 
 * @param {Object} behaviorObj 
 * @param {*} precision 
 * @param {*} videoFPS 
 * @param {*} delimiter 
 * @returns 
 */
function generateEthogramRow(behaviorObj, precision, videoFPS, delimiter) {

  let fileDelimiter = delimiter ? delimiter : csvDelimiter;

  // Get the subject name and action of the behavior
  const subjectName = behaviorObj.subjectName;
  const action = behaviorObj.action;
  
  // Use frames for start and end of an action by default
  const startFrame = parseInt(behaviorObj.startFrame);
  const endFrame = parseInt(behaviorObj.endFrame);

  if (subjectName && action &&
    Number.isSafeInteger(startFrame) && Number.isSafeInteger(endFrame)
  ) {

    const targetName = behaviorObj.targetName ? behaviorObj.targetName : 'NA';
    
    const durationInFrames = (endFrame - startFrame);
  
    const rowArr = [
      subjectName, action, targetName, 
      startFrame, endFrame, durationInFrames
    ];
  
    // If video FPS is given convert frames to seconds
    if (videoFPS) {
      const startSecond = (startFrame / parseFloat(videoFPS)).toFixed(precision);
      const endSecond = (endFrame / parseFloat(videoFPS)).toFixed(precision);
  
      const durationInSeconds = (endSecond - startSecond).toFixed(precision);
  
      rowArr.push(startSecond, endSecond, durationInSeconds);
    
    } else {
      // If no video FPS is given, add "NA" to columns related to time in seconds
      rowArr.push('NA', 'NA', 'NA');
    }

    return rowArr.join(fileDelimiter);
  
  }

  // Return nothing if any expected field in behavior object is missing
  return;

}


/**
 * Gets example file paths for the main video, a secondary video, actions and individual files
 * @returns {Object} Object for file paths
 * @returns {import('node:fs').PathLike} Main video path
 * @returns {import('node:fs').PathLike} Secondary video path
 * @returns {import('node:fs').PathLike} Individuals file path
 * @returns {import('node:fs').PathLike} Actions file path
 */
function handleGetExampleFilePaths() {

  // Directory path for examples
  // const dirPath = path.join(appDataDir, 'examples');
  const dirPath = path.join(__dirname, 'examples');

  // Construct file paths
  const filePaths = {
    mainVideo: path.join(dirPath, 'e7_c4_0_0_1740.mp4'),
    tracking: path.join(dirPath, 'e7_c4_0_0_1740.txt'),
    secondaryVideos: [ path.join(dirPath, 'e7_c9_0_0_1740.mp4') ],
    individuals: path.join(dirPath, 'individuals.txt'),
    actions: path.join(dirPath, 'action_types.txt')
  }

  return filePaths;

}

/**
 * Gets the last modified time of a file
 * @param {import('node:fs').PathLike} filePath - File path
 * @returns {Date} - Last modified date
 */
async function getLastModifiedTime(filePath) { 

  return new Promise((resolve, reject) => {
    try {
      const stats = fs.statSync(filePath);
      const lastModTime = stats.mtime;
      console.log(`File data last modified: ${lastModTime}`);
      resolve(lastModTime);
    } catch (err) {
      console.log(err);
      // reject(err);
    }

  })


}


/**
 * Reads a notes file in plain text format
 * @param {import('node:fs').PathLike} filePath File path for the notes
 * @returns {String} HTML string for the main file content
 */
async function handleReadNotesFile(filePath) {

  return new Promise((resolve, reject) => {

    // Check if a file path is given
    if (!filePath) {
      const reason = 'No file path was given for the notes!';
      console.log(reason);
      reject(reason);
      return;
    }
  
    // Check if the given path exists
    if (!fs.existsSync(filePath)) {
      const reason = `Given path for the notes does not exist! ${filePath}`;
      console.log(reason);
      reject(reason);
      return;
    }
  
    // Check if the given path is accessible
    try {
      fs.accessSync(filePath, fs.constants.R_OK)
    } catch (err) {
      console.log(err);
      const reason = `Given path for the notes cannot be read! ${filePath}`;
      reject(reason);
      return;
  
    }
  
    const readStream = fs.createReadStream(filePath);
  
    const rl = readline.createInterface({
      input: readStream,
      // output: stdout,
      crlfDelay: Infinity // For reading files with \r\n line delimiter

    });
      
    // Array of lines
    const lineArr = [];

    // Read and process each line
    rl.on('line', (line) => {
      // Skip the metadata rows
      if (!line.startsWith('#')){
        lineArr.push(line);
      }
  
    });

    rl.on('close', () => {
      console.log('File reading finished');

      // Join the separate lines with the "\n" element
      // Return a single string for the textarea element
      resolve(lineArr.join('\n'));
  
    });
  
    rl.on('error', (err) => {
      console.error('Cleaning up:', err);
      readStream.destroy();
      reject(err);

    });

    // Handle read stream errors
    readStream.on('error', (err) => {
      console.log('Failed to open the stream:', err);
      readStream.destroy();
      reject(err);

    });


  });


}

/**
 * Reads a metadata file in JSON format
 * @param {import('node:fs').PathLike} filePath File path for the notes
 * @returns {Object} Metadata object
 */
async function handleReadMetadataFile(filePath) {

  // Check if config file exists
  if (!fs.existsSync(filePath)) {
    console.log('Metadata file could not be found!');
    return;
  }

  try {
    const metadata = JSON.parse(fs.readFileSync(filePath), 'utf8');
    return metadata;
  } catch (err) {
    console.log('Metadata file could not be found!', err);  
  }


}


/**
 * Reads an ethogram file in CSV format
 * @param {import('node:fs').PathLike} filePath File path for the ethogram
 * @return {Map[]} Array of observations 
 */
async function handleReadBehaviorFile(filePath) {

  // Skip the metadata and header rows
  // Read each row
    // Generate an observation from each row in Map format
    // Push each observation to the array
  // Return the resulting array


  return new Promise((resolve, reject) => {
    
    // Check if a file path is given
    if (!filePath) {
      const reason = 'No file path was given for the behavior file!';
      console.log(reason);
      reject(reason);
      return;
    }

    // Check if the given path exists
    if (!fs.existsSync(filePath)) {
      const reason = `Given path for the behavior file does not exist! ${filePath}`;
      console.log(reason);
      reject(reason);
      return;
    }

    // Check if the given path is accessible
    try {
      fs.accessSync(filePath, fs.constants.R_OK)
    } catch (err) {
      console.log(err);
      const reason = `Given path for the behavior file cannot be read! ${filePath}`;
      reject(reason);
      return;
    }

    const readStream = fs.createReadStream(filePath);

    const rl = readline.createInterface({
      input: readStream,
      // output: stdout,
      crlfDelay: Infinity // For reading files with \r\n line delimiter
    });
      
    // Keep track of observations constructed from each row
    let obsArr = [];
  
    // Initialize the line number counter
    let lineNumber = 0;
    
    // Initialize the column indices
    let subjectIdx, actionIdx, targetIdx, startFrameIdx, endFrameIdx;
    
    // Read and process each line
    rl.on('line', (line) => {

      // Skip the metadata rows
      if (!line.startsWith('#')) {
        
        // Split the line into columns
        const delimiter = line.includes(';') ? ';' : ',';
        console.log('Delimiter:', delimiter);
        const lineArr = line.split(new RegExp('\\s*' + delimiter + '\\s*'));
        console.log('Splitted line regex', new RegExp('\\s*' + delimiter + '\\s*'));
      
        
        // Get the headers from the first row
        if (lineNumber === 0) {
          
          // Get the indices of the relevant columns (e.g. find the column containing the string "subject")
          const subjectRegex = /subject/i;
          const actionRegex = /action/i;
          const targetRegex = /target/i;
          const startFrameRegex = /.*start.*frame.*/i;
          const endFrameRegex = /.*end.*frame.*/i;

          // findIndex returns -1 if an element could not be found in the array
          subjectIdx = lineArr.findIndex((column) => subjectRegex.test(column));
          actionIdx = lineArr.findIndex((column) => actionRegex.test(column));
          targetIdx = lineArr.findIndex((column) => targetRegex.test(column));
          startFrameIdx = lineArr.findIndex((column) => startFrameRegex.test(column));
          endFrameIdx = lineArr.findIndex((column) => endFrameRegex.test(column));
          
          // Check for index -1 (indicates element not being found)
          const indexNames = ['Subject', 'Action', 'Target', 'Start Frame', 'End Frame']
          const indices = [subjectIdx, actionIdx, targetIdx, startFrameIdx, endFrameIdx];
          console.log(indices);
          const missingIdx = indices.indexOf(-1);
          if (missingIdx >= 0) {
            const missingName = indexNames.at(missingIdx);
            console.log(`Column for ${missingName} could not be found!`);
            reject(`Column for ${missingName} could not be found!`);
            return;
          }          

        } else {

          // Get the observation properties via their indices in each line array 
          // They should be found by searching the first row in the step above
          const indices = [subjectIdx, actionIdx, targetIdx, startFrameIdx, endFrameIdx];
          if (!indices.every(index => index >= 0)) {
            console.log(`One or more of the required columns are missing!`);
            reject(`One or more of the required columns are missing!`);
            return;
          }

          // Get the observation properties given at specified indices
          const subjectName = lineArr.at(subjectIdx);
          const action = lineArr.at(actionIdx);
          const targetName = lineArr.at(targetIdx) ? lineArr.at(targetIdx) : 'NA';
          const startFrame = parseInt(lineArr.at(startFrameIdx));
          const endFrame = parseInt(lineArr.at(endFrameIdx));

          // Check if line has an element at the specified index
          if (!subjectName || !action || !targetName || !Number.isSafeInteger(startFrame) ||  !Number.isSafeInteger(endFrame)) {
            console.log(`Skipping line ${lineNumber} because at least one of the required columns is missing!`);
            return;
          }

          // Construct a new observation
          const newObs = new Map([
            ['index', lineNumber],
            ['subjectName', subjectName],
            ['subjectId', null],
            ['subjectSpecies', null],
            ['action', action],
            ['targetName', targetName],
            ['targetId', null],
            ['targetSpecies', null],
            ['startFrame', startFrame],
            ['endFrame', endFrame],
          ]);

          obsArr.push(newObs);

        }

        // Increment line number count
        lineNumber++;


      }
  
    });
    
    rl.on('close', () => {
      console.log('File reading finished');
      // readStream.destroy();
      resolve(obsArr);
  
    });
  
    rl.on('error', (err) => {
      console.error('Cleaning up:', err);
      readStream.destroy();
      reject(err);
    });

    // Handle read stream errors
    readStream.on('error', (err) => {
      console.log('Failed to open the stream:', err);
      readStream.destroy();
      reject(err);
    });
  
  
  });
 


}



/**
 * Writes the record of behaviors to a file. 
 * If no file path is given, a hidden file in the user data directory is chosen by default.
 * @param {Array} observations - Map of Observations (key: observationIndex, value: Observation instance)
 * @param {String} fileName - File name of the main video without the extension
 * @param {Number} videoFPS - Frames per second of the main video
 * @param {String} username - Username
 * @param {String} filePath - Optional file path for saving the file other than user data directory
 * @param {Boolean} withMetadata - If true, write metadata header
 * @returns {import('node:fs').PathLike | undefined} - File path where the ethogram was written successfully or undefined if the operation failed
 */
function handleWriteBehaviorsToFile(observations, fileName, videoFPS, username, withMetadata, filePath) {

  // Get the date in ISO format
  const date = new Date().toISOString();

  // Define header for file metadata
  const metadata = {
    // Get the ordered individual names later within the function for outputting tracking file
    username: username ? username : 'anonymous',
    editDate: date,
    videoName: fileName,
    videoFPS: videoFPS 
  }

  // Determine file name of the output
  const fileOutName = fileName ? fileName : 'unknown';

  // Determine the delimiter
  const delimiter = csvDelimiter;

  // Add the extension to the file name
  const fileNameWithExt = `${fileOutName}_behaviors.csv`;
  
  // Determine the full file path for the ethogram file
  // Write either to the user data directory (invisible to user) or some other directory chosen by the user
  const pathInUserDataDir = path.join(appDataDir, fileNameWithExt);
  const filePathToWrite = filePath ? filePath: pathInUserDataDir;

  // Write to the ethogram file in the user data directory 
  // Directory is hidden from user, used as a backup against accidental deletions 
  let writeStream = fs.createWriteStream(filePathToWrite);

  if (!writeStream) {
    console.log('Failed to find the path for the ethogram file!');
    return;
  }

  try {
    
    // Write header for metadata if preferred
    if (withMetadata) {
      for (let [key, value] of Object.entries(metadata)) {
  
        // Separate array values with a comma and space
        const data = Array.isArray(value) ? value.join(delimiter) : value;
        
        // Write header to the file
        writeStream.write(`# ${key}: ${data}\n`);
  
      }

    }

    // Write column headers
    const colHeaderRow = behaviorColHeaderRow.join(delimiter);
    writeStream.write(`${colHeaderRow}\n`);

    // Write behavior rows to the file
    observations.forEach(observation => {

      // Produce a row in CSV format from the behavior object
      const row = generateEthogramRow(observation, precisionForSeconds, videoFPS, delimiter);
      if (row) {
        // Write rows to files
        writeStream.write(`${row}\n`);
      }

    });

    // Check if writing to stream is finished
    writeStream.on('finish', () => {
      console.log(`Finished writing to ${filePathToWrite}`);

    });

    // Handle error with the stream
    writeStream.on('error', (err) => {
      console.error('Cleaning up:', err);
      writeStream.destroy();
      return;
    })

    // Close the streams
    writeStream.end();

    // Return the file path 
    return filePathToWrite;

  } catch (err) {
    console.error(err);
    return;
  }

}

/**
 * Exports modified tracking data to a file
 * @param {Map} trackingMap | keys: framenumber, values: Array of 
 * @param {String} fileName | Video file name without extension
 * @returns 
 */
async function handleOutputTrackingFile(trackingMap, fileName, individualNamesArr, fileDelimiter) {

  // Get the date in ISO format
  const date = new Date().toISOString();

  // Get the ordered array for indvidual names
  const orderedNamesArr = individualNamesArr ? individualNamesArr : []

  // Define header for file metadata
  const trackingHeader = {
    // Get the ordered individual names later within the function for outputting tracking file
    username: 'anonymous',
    editDate: date, 
    orderedNames: orderedNamesArr,
    dataColumns: trackingColNames
  }

  // Determine file name of the output
  let fileNameOutput = fileName ? fileName : 'modified';

  // Determine the delimiter
  let delimiter = fileDelimiter ? fileDelimiter : ', ';

  const result = await dialog.showSaveDialog(BrowserWindow.getFocusedWindow(), {
    title: 'Export Modified Tracking File',
    defaultPath: `${fileNameOutput}_tracking.txt`,
    filters: [{ name: 'Text Files', extensions: ['txt'] }]
  })


  if (!result.canceled) {
    const writeStream = fs.createWriteStream(result.filePath);
    try {

      // Write header for metadata
      for (let [key, value] of Object.entries(trackingHeader)) {

        // Separate array values with a comma and space
        const data = Array.isArray(value) ? value.join(', ') : value
        writeStream.write(`# ${key}: ${data}\n`);
      }

      for (const trackInfoArr of trackingMap.values()) {
        trackInfoArr.forEach(trackInfoObj => {
          // console.log(trackInfo);
          // if (trackInfoObj.trackNumber) {
            // fileContentArr.push(Object.values(trackInfoObj).join(fileDelimiter));
            const row = Object.values(trackInfoObj).join(delimiter);
            writeStream.write(`${row}\n`);
          // }
        });
      }
      // const fileContent = fileContentArr.join('\n');
      // fs.writeFileSync(result.filePath, fileContent);
      writeStream.end();
      console.log('File written successfully');
      return result.filePath;
    } catch (err) {
      console.error(err);
      return;
    }
  }
}

async function handleOutputTrackingTable(tableContent, fileName) {
  const result = await dialog.showSaveDialog(BrowserWindow.getFocusedWindow(), {
    title: 'Export Tracking Modifications',
    defaultPath: `${fileName}_tracking_log.txt`,
    filters: [{ name: 'Text Files', extensions: ['txt'] }]
  })

  if (!result.canceled) {
    try {
      fs.writeFileSync(result.filePath, tableContent);
      console.log('File written successfully');
      // return tableContent
      return result.filePath;
    } catch (err) {
      console.error(err);
      return;
    }
  }


}

/**
 * 
 * @param {Object} settings | Settings to be saved to config file
 */
async function handleSaveToConfig(inputData) {
  const configFilePath = path.join(appDataDir, configFileName);

  let configData = inputData;

  try {
    // Parse config file if exists
    configData = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
    for (const [key, value] of Object.entries(inputData)) {
      configData[key] = value;
    }
  } catch (err) {
    console.log(err);
  }

  try {
    fs.writeFileSync(configFilePath, JSON.stringify(configData, null, 2));
    return {configData: configData, success: true}
  } catch (err) {
    console.log(err)
  }

}



/**
 * 
 * @param {Array} inputData | Keys whose values to be removed from the config file
 * @returns 
 */
async function handleRemoveFromConfig(keys) {
  const configFilePath = path.join(appDataDir, configFileName);

  // let configData = inputData;

  let configData;
  
  try {
    // Parse config file if exists
    configData = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
    
    if (Array.isArray(keys) && keys.length > 0) {
      // Remove user defined keys from config data
      keys.forEach(key => {
        if (key in configData) {
          delete configData[key]
        }
      })
    } else if (keys === 'all') {
      // Remove all keys from config data
      // Object.keys(configData).forEach(key => delete configData[key]);
      configData = {};
    } 
  } catch (err) {
    console.log(err);
    return
  }

  try {
    fs.writeFileSync(configFilePath, JSON.stringify(configData));
    return {configData: configData, success: true}
  } catch (err) {
    console.log(err)
  }

  
}

function handleGetFromConfig() {
  if (!fs.existsSync(appDataDir)) {
    try {
      fs.mkdirSync(appDataDir)
    } catch (err) {
      console.err(err);
    }
  }
  const configFilePath = path.join(appDataDir, configFileName);

  // Check if config file exists
  if (!fs.existsSync(configFilePath)) {
    console.log('Config file could not be found!');
    console.log('Attempting to create a new config file...');
    try {
      // Create empty fie
      fs.writeFileSync(configFilePath, JSON.stringify({}));
      console.log('Config file created', configFilePath);

    } catch (err) {
      console.log(err);
      return;
    }
  }

  try {
    const data = JSON.parse(fs.readFileSync(configFilePath, 'utf8'))
    return data;
  } catch (err) {
    console.log('Config file could not be found!', err);  
  }
  
}

/**
 * Export the snapshot image in PNG format and optional label data linked to this image in CSV format.
 * @param {Object} data - Expects canvasData, videoName, fileExtension, frameNumber and optionally labelData
 * @param {String} data.videoName
 * @param {} data.canvasData Binary image data
 * @param {String} data.fileExtension
 * @param {Number} data.frameNumber
 * @param {Array[]} data.labelRows An array of arrays for each row for each track in the resulting file
 * @returns {import('node:fs').PathLike} Path of the export directory
 */
async function handleSaveSnapshot(data) {
  if (typeof data === 'undefined' || data === null) return;

  // Get the image-related metadata and construct the image file name
  const frameNum = data.frameNumber ?? 0; // Frame number of the snapshot
  const imgExt = data.fileExtension ?? 'png'; // Image extension
  const imgPrefix = data.videoName ?? 'snapshot'; // Image filename prefix (either video name or 'snapshot')
  const imgFileName = `${imgPrefix}_${frameNum}.${imgExt}`;

  // Get the label-related metadata and construct the label file name
  const labelExt = 'csv';
  const labelPrefix = data.videoName ?? 'labels';
  const labelFileName = `${labelPrefix}_${frameNum}.${labelExt}`;

  const response = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    title: 'Folder for snapshot data',
    message: 'Choose a folder for snapshot data',
    properties: ['openDirectory', 'createDirectory']
  });

  if (!response.canceled && response.filePaths?.length > 0) {
    try {

      // Get the selected directory
      const outerDirPath = response.filePaths[0];

      // Create a folder for images if it does not exist
      const imgDirPath = path.join(outerDirPath, 'images');
      if (!fs.existsSync(imgDirPath)) {
        try {
          fs.mkdirSync(imgDirPath);
        } catch (err) {
          console.log(err);
          return;
        }
      }
      // Attempt to write image file
      const base64Data = data.canvasData.replace(/^data:image\/png;base64,/, "");
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(path.join(imgDirPath, imgFileName), buffer, {encoding: 'base64'});

      // Attempt to write label data if it is given
      const labelRows = data.labelRows;
      if (Array.isArray(labelRows) && labelRows.length > 0) {
        // Create a folder for label data if it does not exist
        const labelDirPath = path.join(outerDirPath, 'labels_with_ids');
        if (!fs.existsSync(labelDirPath)) {
          try {
            fs.mkdirSync(labelDirPath);
          } catch (err) {
            console.log(err);
            return;
          }
        }
        fs.writeFileSync(path.join(labelDirPath, labelFileName), labelRows.map(row => row.join(csvDelimiter)).join('\n'));
      }
      return outerDirPath;
    } catch (err) {
      console.log(err);
    }

  }
  
}


/**
 * Exports all user-edited files by copying them from user data directory to the chosen export directory.
 * If no export directory path is given, searches the config file for previously saved export directory.
 * @param {import('node:fs').PathLike | undefined} dirPath Optional export directory
 * @returns {Object} 
 */
function handleExportAll(dirPath) {
  
  const configData = handleGetFromConfig();
  
  // Check if the main video path exists
  if (!configData.mainVideoPath) return;
    
  // Get the main video path
  const mainVideoPath = configData.mainVideoPath;

  const mainVideoName = handleGetFileNameWithoutExtension(mainVideoPath)
    
  // Sub directory path to export all files for current experiment
  let experimentDirPath;
  
  // Create a directory for the current main video by appending video name to the export directory
  // Either under export directory saved to config or under input directory of this function
  if (dirPath) {
    experimentDirPath = path.join(dirPath, mainVideoName);

  } else {

    if (!configData.exportDirPath) {
      console.error('No export directory path could be found in the config file!')
      return;
    }

    if (!fs.existsSync(configData.exportDirPath)) {
      console.error('Selected export directory path does not exist!');
      return;
      
    }

    experimentDirPath = path.join(configData.exportDirPath, mainVideoName);

  }
  
  // Indicate success/failure for all file exports
  const response = {
    outDirPath: experimentDirPath,
    behaviors: {
      found: false, // True if file was found in user data directory
      exported: false, // True if file was successfully exported
    },
    tracking: {
      found: false,
      exported: false,
    },
    identification: {
      found: false,
      exported: false,
    },
    notes: {
      found: false,
      exported: false,
    },
    metadata: {
      found: false,
      exported: false,
    },
  };

  try {
    if (!fs.existsSync(experimentDirPath)) {
      
      // Create the subdirectory
      fs.mkdirSync(experimentDirPath);

    }
      
    // Find the ethogram file
    const ethogramPathInUserData = handleFindBehaviorFile(mainVideoPath);
    if (ethogramPathInUserData) {

      // Mark file search result
      response.behaviors.found = true;
      
      try {

        // Copy ethogram file to the output path
        const outFilePath = path.join(experimentDirPath, path.basename(ethogramPathInUserData));
        fs.copyFileSync(ethogramPathInUserData, outFilePath);

        // Mark export as success
        response.behaviors.exported = true;
        console.log(`Ethogram file was exported to ${outFilePath}`)
  
      } catch (err) {
        console.error('Ethogram file could not be exported!', err);

      }
  
    }

    // Find the tracking file
    const trackingSearchResponse = handleFindTrackingFile(mainVideoPath);
    if (trackingSearchResponse && trackingSearchResponse.trackFilePath) {
      
      // Mark file search result
      response.tracking.found = true;

      try {

        // Copy tracking file to the output path       
        const trackingPathInUserData = trackingSearchResponse.trackFilePath;        
        const outFilePath = path.join(experimentDirPath, path.basename(trackingPathInUserData));

        fs.copyFileSync(trackingPathInUserData, outFilePath);

        // Mark export as success
        response.tracking.exported = true;

        console.log(`Tracking file was exported to ${outFilePath}`)
  
      } catch (err) {
        console.error('Tracking file could not be exported!', err);

      }
  
    }

    // Find the identification file
    if (trackingSearchResponse && trackingSearchResponse.idFilePath) {
      
      // Mark the file search result
      response.identification.found = true;
      
      try {

        // Copy identification file to the output path
        const idPathInUserData = trackingSearchResponse.idFilePath;        
        const outFilePath = path.join(experimentDirPath, path.basename(idPathInUserData));
        fs.copyFileSync(idPathInUserData, outFilePath);

        // Mark export as success
        response.identification.exported = true;

        console.log(`Identification file was exported to ${outFilePath}`)
  
      } catch (err) {
        console.error('Identification file could not be exported!', err);

      }
  
    }

    // Find the notes file
    const notesPathInUserData = handleFindNotesFile(mainVideoPath);
    if (notesPathInUserData) {

      // Mark the file search result
      response.notes.found = true;

      try {

        // Copy notes file to the output path     
        const outFilePath = path.join(experimentDirPath, path.basename(notesPathInUserData));
        fs.copyFileSync(notesPathInUserData, outFilePath);

        // Mark export as success
        response.notes.exported = true;

        console.log(`Notes file was exported to ${outFilePath}`)
  
      } catch (err) {
        console.error('Notes file could not be exported!', err);

      }
  
    }

    
    const metadataPathInUserData = handleFindMetadataFile(mainVideoPath);
    if (metadataPathInUserData) {

      // Mark the file search result
      response.metadata.found = true;

      try {

        // Copy notes file to the output path     
        const outFilePath = path.join(experimentDirPath, path.basename(metadataPathInUserData));
        fs.copyFileSync(metadataPathInUserData, outFilePath);

        // Mark export as success
        response.metadata.exported = true;

        console.log(`Metadata file was exported to ${outFilePath}`)
  
      } catch (err) {
        console.error('Metadata file could not be exported!', err);

      }
  
    }
    
    
    
    // Return success/failure status for all exports
    return response;


  } catch (err) {
    console.error(err);

  }
    

}


let mainWindow;
let quitting = false;

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    // remove the default titlebar
    titleBarStyle: 'hidden',
    // expose window controlls in Windows/Linux
    ...(process.platform !== 'darwin' ? { titleBarOverlay: {
      color: 'rgba(33,37,41,1)', // Bootstrap bg-dark color code
      symbolColor: 'white',
      // height: 100
    } } : {}),
    trafficLightPosition: {x: 10 , y: 10 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      nodeIntegrationInWorker: true
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  const menu = Menu.buildFromTemplate(menuTemplate)
  Menu.setApplicationMenu(menu)

  mainWindow.on('close', (e) => {
    if (quitting) return;
    e.preventDefault();

    const choice = dialog.showMessageBoxSync(mainWindow, {
      type: 'question',
      buttons: ['Cancel', 'Quit'],
      defaultId: 1,
      cancelId: 0,
      // title: 'Confirm',
      message: 'Are you sure you want to quit the app?'
    });


    // Confirm button
    if (choice === 1) {
      // If "Quit" is chosen, app closes as normal
      mainWindow.webContents.send('before-quit');

    }
    
    
  })


  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

function handleRelaunch() {
  if (mainWindow) {
    app.relaunch();
    app.quit();
  }
}

function handleExit() {
  app.exit();
}

function handleQuit() {
  app.quit();
}

/**
 * Gets the current app version
 * @returns App version
 */
function handleGetVersion() {
  return app.getVersion();
}

/**
 * Calculates video frame rate (per second)
 * @param {import('node:fs').PathLike} videoPath
 * @returns {Number | undefined} Frames per second
 */
async function handleCalcVideoFrameRate(videoPath) {

  // Remove leading "/" on Windows
  const parsedPath = process.platform === 'win32' ? videoPath.replace(/^\//, '') : videoPath;

  // Get the absolute path of the parsed path
  const absPath = path.normalize(parsedPath);
  
  // Initialize mediaInfo object
  const mediaInfo = await mediaInfoFactory({ format: 'JSON' });

  // Get the file size
  const stat = fs.statSync(absPath);
  const getSize = () => stat?.size;

  // Read the video file
  const fd = fs.openSync(absPath, 'r');
  
  // Read the chunk of data
  async function readChunk(chunkSize, offset) {
    const buffer = Buffer.alloc(chunkSize);
    const bytesRead = fs.readSync(fd, buffer, 0, chunkSize, offset);
    return new Uint8Array(buffer.subarray(0, bytesRead));
  }

  // Analyze the video file
  const result = await mediaInfo.analyzeData(getSize, readChunk);
  
  // Close the file stream
  fs.closeSync(fd);

  // Get the info in JSON
  const info = typeof result === 'string' ? JSON.parse(result) : result;

  // Find the video track
  const videoTrack = (info.media.track || []).find(t => t['@type'] === 'Video' || t.type === 'Video');

  // Try to get the frame directly
  let frameRate = videoTrack?.FrameRate || videoTrack?.FrameRateString;

  // Verify that the frame rate is constant
  const isConstantFrameRate = videoTrack?.FrameRate_Mode === 'CFR' || videoTrack?.FrameRate_Mode_String === 'CFR';
  if (!isConstantFrameRate) {
    console.log('Only videos with constant frame rates are supported!');
    return;
  }

  // If no direct reading of frame rate is possible, try to calculate it from numerator and denominator properties
  if (!frameRate && videoTrack?.FrameRate_Num && videoTrack?.FrameRate_Den) {
    frameRate = parseFloat(videoTrack.FrameRate_Num) / parseFloat(videoTrack.FrameRate_Den);
  }

  console.log('Video frame rate:', frameRate);
  // Return the frame rate
  return parseFloat(frameRate);

  
}



// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  ipcMain.handle('getVersion', (e) => {
    const response = handleGetVersion();
    return response
  })
  ipcMain.handle('dialog:openSingleVideo', handleOpenSingleVideo),
  ipcMain.handle('dialog:openMultipleVideos', handleOpenMultipleVideos),
  ipcMain.handle('getVideosFromDir', async (e, dirPath) => {
    const videoPaths = await handleGetVideosFromDir(dirPath)
    return videoPaths
  })
  ipcMain.handle('findTrackingFile', (e, videoFilePath, dirPath) => {
    const trackingFile = handleFindTrackingFile(videoFilePath, dirPath)
    return trackingFile
  })
  ipcMain.handle('readTrackingFile', (e, trackingFilePath) =>{
    const response = handleReadTrackingFile(trackingFilePath)
    return response
  })
  ipcMain.handle('readInteractionFile', async (e, filePath) => {
    const response = await handleReadInteractionFile(filePath)
    return response
  })
  // ipcMain.handle('readIdentificationFile', async (e, filePath) => {
  //   const response = await handleReadIdentificationFile(filePath)
  //   return response
  // })
  ipcMain.handle('readNameFile', (e, filePath) => {
    const response = handleReadNameFile(filePath)
    return response
  })
  ipcMain.handle('saveTrackingEdits', async (e, trackingMap, fileName, orderedNamesArr, username) => {
    const response = await handleSaveTrackingEdits(trackingMap, fileName, orderedNamesArr, username);
    return response
  })
  ipcMain.handle('findBehaviorFile', (e, videoFilePath, dirPath) => {
    const response = handleFindBehaviorFile(videoFilePath, dirPath);
    return response;
  })
  ipcMain.handle('writeBehaviorsToFile', (e, observations, fileName, videoFPS, username, withMetadata) => {
    const response = handleWriteBehaviorsToFile(observations, fileName, videoFPS, username, withMetadata);
    return response;
  })
  ipcMain.handle('readBehaviorFile', (e, filePath) => {
    const response = handleReadBehaviorFile(filePath);
    return response;
  })
  ipcMain.handle('dialog:exportBehaviors', async(e, observations, fileName, videoFPS, username, withMetadata) => {
    const response = await handleExportBehaviors(observations, fileName, videoFPS, username, withMetadata);
    return response;
  })
  ipcMain.handle('dialog:outputTrackingFile', async (e, trackingMap, fileName, individualNamesArr) => {
    const filePath = await handleOutputTrackingFile(trackingMap, fileName, individualNamesArr)
    return filePath;
  })
  ipcMain.handle('dialog:saveInteractionTable', async (e, tableContent, fileName) => {
    const filePath = await handleSaveInteractionTable(tableContent, fileName);
    return filePath;
  })
  ipcMain.handle('dialog:outputTrackingTable', async (e, tableContent, fileName) => {
    const filePath = await handleOutputTrackingTable(tableContent, fileName);
    return filePath;
  })
  ipcMain.handle('dialog:openSingleFile', async (e, fileType) => {
    const filePath = await handleOpenSingleFile(fileType);
    return filePath;
  })
  ipcMain.handle('getFileNameWithoutExtension', (e, fileType) => {
    const filePath = handleGetFileNameWithoutExtension(fileType);
    return filePath;
  })
  ipcMain.handle('dialog:openDirectory', async (e) => {
    const directoryPath = await handleOpenDirectory();
    return directoryPath;
  })
  // ipcMain.handle('dialog:getExperimentDirPath', handleGetExperimentDirPath)
  // ipcMain.handle('dialog:openExperimentDir', handleOpenExperimentDir)
  ipcMain.handle('resetSettings', async (e) => {
    const configFilePath = await handleResetSettings();
    return configFilePath;
  })
  ipcMain.handle('saveToConfig', async (e, settingsObj) => {
    const response = await handleSaveToConfig(settingsObj);
    return response;
  })
  ipcMain.handle('getFromConfig', (e) => {
    const response = handleGetFromConfig();
    return response;
  })
  ipcMain.handle('removeFromConfig', async (e, configKeys) => {
    const response = await handleRemoveFromConfig(configKeys);
    return response;
  })
  ipcMain.handle('dialog:saveSnapshot', async (e, imageData) => {
    const response = await handleSaveSnapshot(imageData);
    return response;
  })
  ipcMain.handle('relaunch', (e) => {
    handleRelaunch();
  })
  ipcMain.handle('quit', (e) => {
    handleQuit();
  })
  ipcMain.handle('exit', (e) => {
    handleExit();
  })
  ipcMain.handle('findNotesFile', (e, videoFilePath, dirPath) => {
    const response = handleFindNotesFile(videoFilePath, dirPath);
    return response;
  })
  ipcMain.handle('readNotesFile', (e, filePath) => {
    const response = handleReadNotesFile(filePath);
    return response;
  })
  ipcMain.handle('writeNotesToFile', (e, text, fileName, username) => {
    const response = handleWriteNotesToFile(text, fileName, username);
    return response;
  })
  ipcMain.handle('dialog:exportNotes', (e, text, fileName, username) => {
    const response = handleExportNotes(text, fileName, username);
    return response;
  })
  ipcMain.handle('saveTrackingHTML', async (e, tableHTML, videoName) => {
    const response = await handleSaveTrackingHTML(tableHTML, videoName);
    return response;
  })
  ipcMain.handle('getLastModifiedTime', (e, filePath) => {
    const response = getLastModifiedTime(filePath);
    return response;
  })
  ipcMain.handle('copyToUserDataDir', (e, filePath, fileName) => {
    const response = handleCopyToUserDataDir(filePath, fileName);
    return response;
  })
  ipcMain.handle('dialog:exportAll', (e, dirPath) => {
    const response = handleExportAll(dirPath);
    return response;
  })
  ipcMain.handle('findMetadataFile', (e, videoFilePath, dirPath) => {
    const response = handleFindMetadataFile(videoFilePath, dirPath);
    return response;
  })
  ipcMain.handle('readMetadataFile', (e, filePath) => {
    const response = handleReadMetadataFile(filePath);
    return response;
  })
  ipcMain.handle('saveMetadata', (e, metadata, fileName) => {
    const response = handleSaveMetadata(metadata, fileName);
    return response;
  })
  ipcMain.handle('clear-app-data', (e) => {
    const response = handleClearAppData();
    return response;
  })
  ipcMain.on('response-before-quit', (e) => {
    quitting = true;
    app.quit();
    mainWindow.close();
  })
  ipcMain.handle('getExampleFilePaths', (e) => {
    const response = handleGetExampleFilePaths();
    return response;
  })
  ipcMain.handle('calcVideoFrameRate', (e, videoFilePath) => {
    const response = handleCalcVideoFrameRate(videoFilePath);
    return response;
  })
  
  createWindow();

  app.on('activate', function() {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })


})

// app.on('before-quit', function (e) {
//   if (quitting) return;
//   e.preventDefault();
//   if (mainWindow) {
//     mainWindow.webContents.send('before-quit');
//   }
// })

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
// app.on('window-all-closed', function() {
//   if (process.platform !== 'darwin') app.quit()
// })
