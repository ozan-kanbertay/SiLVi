/**
 * Components used on the interface
 */


import {
  showAlertToast,
  showAlertModal,
  getFileNameWithoutExtension, 
  secondsToFrames,
  framesToSeconds,
  formatSeconds,
  showOverlappingTracksToast,
  getRandomLetterNotIn,
  clearEthogramTable,
  showProcessIndicator,
  hideProcessIndicator,
  produceLabelText,
  updateHotkeyDomElement,
  showToastForBehaviorRecording,
  showLastEditForFile,
  handleBehaviorRecordByClick,
  updateTracksFromToast,
  updateTracksFromNameDropdown,
  addEthogramRow,
  updateZoomScaleDomEls,
  getUserConfirmationOnModal,
  hideAlertModal,
  showPopover,
  getRandomColors,
  updateClassEls,

} from './helpers.js';



class Observation {
  /**
   * 
   * @param {Map} entries 
   */
  
  constructor(entries) {

    // Check if the input is given and an instance of Map
    if (entries && entries instanceof Map) {
      this.entries = entries;
    } else {
      // If no input is given or it is not in correct format, initialize the instance
      this.entries = new Map([
        ['index', null],
        ['subjectName', null],
        ['subjectId', null],
        ['subjectClass', null],
        ['action', null],
        ['targetName', null],
        ['targetId', null],
        ['targetClass', null],
        ['startFrame', null],
        ['endFrame', null],
      ]);

    }

    // Track the last update for undo functionality
    this.lastUpdatedKeys = [];

  }


  get(key) {
    return this.entries.get(key);

  }

  /**
   * Updates the observation
   * @param {Array} entries Array of key-value pairs
   */
  update(...entries) {
    let updatedKeys = [];
    for (const [key, value] of entries) {
      this.entries.set(key, value);
      updatedKeys.push(key);
    }

    // Keep track of the last updated keys
    this.lastUpdatedKeys.push(updatedKeys);
    
    // Show the changes on the HTML element
    this.show();

  }

  /**
   * Undoes the last selection
   * @param  {...any} keys 
   */
  undo() {
    // Undo the values of the saved keys from the last selection
    const undoKeyArr = this.lastUpdatedKeys.pop();
    
    // Set the given key's value to null
    if (undoKeyArr) {
      undoKeyArr.forEach(key => this.entries.set(key, null));

    }

    // Show the changes on the HTML element
    this.show();

  }

  /**
   * Gets the entries of an observation
   * @returns {Map} - Map of entries
   */
  getEntries() {
    return this.entries;
  }

  /**
   * Gets the last updated keys of an observation
   * @returns {Array} - Last updated key strings
   */
  getLastSelection() {
    return this.lastUpdatedKeys;
  }


  /**
   * Gets the index of an observation
   * @returns {Number} - Index within the ethogram
  */
  get index() {
   return this.entries.get('index');
  }

  /**
   * Gets the subject name of an observation
   * @returns {String} - Subject name
   */
  get subjectName() {
    return this.entries.get('subjectName');
  }

  /**
   * Gets the subject id of an observation
   * @returns {Number}
   */
  get subjectId() {
    return this.entries.get('subjectId');
  }

  /**
   * Gets the action of an observation
   * @returns {String}
   */
  get action() {
    return this.entries.get('action');
  }

  /**
   * Gets the target name of an observation
   * @returns {String}
   */
  get targetName() {
    return this.entries.get('targetName');
  }

  /**
   * Gets the target id of an observation
   * @returns {Number}
   */
  get targetId() {
    return this.entries.get('targetId');
  }

  /**
   * Gets the target class of an observation
   * @returns {Number} - Target class ID
   */
  get targetClass() {
    return this.entries.get('targetClass');
  }

  /**
   * Gets the starting frame of an observation
   * @returns {Number}
   */
  get startFrame() {
    return this.entries.get('startFrame');
  }

  /**
   * Gets the starting frame of an observation
   * @returns {Number}
   */
  get endFrame() {
    return this.entries.get('endFrame');
  }

  /**
   * Gets the subject ID of an observation
   * @returns {Number} - Subject ID
   */
  get subjectId() {
    return this.entries.get('subjectId');
  }

  /**
   * Gets the subject class of an observation
   * @returns {Number} - Subject class ID
   */
   get subjectClass() {
    return this.entries.get('subjectClass');
  }

  /**
   * Checks if the current observation is empty
   * @returns - True if all values of the current observation is null
   */
  isEmpty() {
    return this.entries.values().every(value => value === null);
  }

  /**
   * Shows the current observation on its associated HTML element
   */
  show() {
    // Get the HTML element for current observation
    const divEl = document.getElementById('current-observation-div');
    if (!divEl) return;
  
    // Check whether the current observation is empty and no previous observation exists
    if (Player.getCurrentObservation().isEmpty()) {
      
      // Hide the div element
      divEl.classList.add('d-none');
      
    } else {
      
      // Get the selection from the current observation
      const subjectName = this.subjectName;
      const action = this.action;
      const targetName = this.targetName;
      const startTime = this.startFrame;
      const endTime = this.endFrame;

      // Make the div element visible
      divEl.classList.remove('d-none');

      // Show the description of the observation (subject name, action, target name)
      const descriptionEl = divEl.querySelector('#current-observation-description');
      if (descriptionEl) {
        // Show the fields which are not null
        const selections = [subjectName, action, targetName].filter(selection => selection !== null);
        descriptionEl.textContent = selections.join('-');
        
      }
      
      // Show the starting and ending time of the observation
      const startTimeEl = divEl.querySelector('#current-observation-start');
      if (startTimeEl) {
        if (startTime !== null) {
          startTimeEl.textContent = formatSeconds(framesToSeconds(startTime));

          // Add starting frame to dataset to allow user to jump to that frame via clicking
          startTimeEl.dataset.frameNumber = startTime;

        }
      }

      // Show the starting and ending time of the observation
      const endTimeEl = divEl.querySelector('#current-observation-end');
      if (endTimeEl) {
        // Hide the element by default
        endTimeEl.classList.add('d-none');
        
        // Check if end time is given
        if (endTime !== null) {
          // Make the element visible
          endTimeEl.classList.remove('d-none');

          // Convert frames to MM:SS
          endTimeEl.textContent = formatSeconds(framesToSeconds(endTime));

          // Add starting frame to dataset to allow user to jump to that frame via clicking
          endTimeEl.dataset.frameNumber = endTime;

        }
      }
        

      // Show the last selected action as a badge
      const badgeEl = divEl.querySelector('#current-observation-badge');
      if (badgeEl) {
        
        // Determine the last selection
        let lastSelection;
        
        if (subjectName !== null) {
          lastSelection = 'subject';
        }
        
        if (action !== null) {
          lastSelection = 'action';
        }
        
        if (targetName !== null && endTime !== null) {
          lastSelection = 'target';
        }

        badgeEl.textContent = lastSelection;

      }
      

    }

  }
  

}

// Player
class Player {
  // get the DOM element id and options for the video
  domId;
  options;

  // Determine whether the operation system is MacOS
  static onMacOS = window.electronAPI.getPlatform() === 'darwin';

  static allInstances = []; // Save all instances of Players
  static secondaryPlayers = [];
  static mainPlayer;
  static skipSeconds = 5;
  // static frameRate = 29.97; // !!Get the frame rate dynamically instead of hard coding!!
  static maxPlaybackRate = 2;
  static minPlaybackRate = 0.25;
  static individualNames; // Names of individual primates
  static actionNameArr; // Names of actions
  static labelingMode = false; // Boolean to activate hotkeys for recording behaviors
  static isTyping = false;// Boolean to determine if user is typing in a text area or input
  static pressedKeys = [];
  static timeoutKeyPress = null;
  static keyState = {}; // Track the state of each pressed key (to determine to combined key presses)
  static statusUpdateFreq = 60000; // Set the update frequency for showing last modified times for file (in milliseconds)
  static ethogramIntervalId;
  static notesIntervalId;
  static appVersion; // App version number

  static zoomDragColor = 'yellow'; // Color for drawing a rectangle on a canvas for zooming into a video
  static zoomScale = 2; // Zoom scale for the main player (2 -> 2x -> 200%)
  static minZoomScale = 1; // Minimum zoom level 
  static maxZoomScale = 6; // Maximum zoom level
  static zoomRequestId; // Request Id for zooming (to be used with requestAnimationFrame and cleared when the player is paused or ended)

  static draggedDist = 0; // Actual distance in pixels for mouse drag to prevent clicks or accidental mouse moves from being registered as drags
  static minDragDist = 10; // Threshold in pixels to register mouse drags
  static mouseDragTimeThreshold = 1000; // Time in ms to check if the previous mouse down event is more than this threshold to prevent accidental clicks from being registered as drags
  static mouseIsDown = false;
  static lastMouseDownTime = 0;
  static isResizing = false;  // Set to true if user is resizing one of the tracking boxes on the canvas

  static settingsModalId = 'settings-modal';
  static snapshotModalId = 'snapshot-modal';

  static drawnBBoxDivId = 'new-bounding-box-confirm-div'; // DOM ID for div for selecting properties of the user-drawn bounding box
  static drawnBBoxClassInputId = 'class-choice-new-bbox'; // DOM ID for input element to change/assign class to the user-drawn bounding box
  static drawnBoundingBox;  // Holds the BoundingBox instance for user-drawn bounding box on the drawing canvas
  static drawingMode = false; // Boolean to determine if user can draw new tracking boxes freely
  static drawingCanvasId = 'main-drawing-canvas';

  static activeBtnClass = 'text-info';

  static toggleLabelingBtnId = 'toggle-labeling-mode-btn';
  static toggleTrackingBtnId = 'toggle-tracking-btn';

  static visibleTracks = true;  // Flag to show/hide bounding boxes on the main canvas

  static zoomingMode = false;

  static resizedBBoxDivId = 'bounding-box-resize-confirm-div';

  static jumpToFrameInputId = 'jump-to-frame-input';
  static jumpToFrameBtnId = 'jump-to-frame-btn';

  static areBoxesInteractive = false; // Tracks whether the bounding boxes on canvas are interactive/clickable

  // Track the current observation for behavior recording
  static currentObservation = new Observation();
  
  // Username for saving to metadata of exported files
  static username;


  static setMouseDown() {
    if (!Player.hasOwnProperty('mouseIsDown')) return;
    Player.mouseIsDown = true;
  }

  static isMouseDown() {
    return Player.mouseIsDown;
  }

  static resetMouseDown() {
    if (!Player.hasOwnProperty('mouseIsDown')) return;
    Player.mouseIsDown = false;

  }

  /**
   * Gets the video with
   * @returns 
   */
  getVideoWidth() {
    return this.el?.videoWidth;
  }

  /**
   * Gets the video height
   * @returns 
   */
  getVideoHeight() {
    return this.el?.videoHeight;
  }

  
   /**
   * Sets the count for the running number of tracks per class across snapshots when exporting labels with snapshots is selected.
   * @param {String | Number} classId Class ID
   * @param {Number | String} runningCount Running count must be non-negative integer
   * @returns {Number | undefined} Updated running count if the operation is successful, undefined otherwise.
   */
  static setClassRunningCount(classId, runningCount) {
    return Player.getMainPlayer?.().getTrackingMap?.()?.setClassRunningCount?.(classId, runningCount);
  }

  /**
   * Gets the running counts of all classes across snapshots previously saved into the config file
   * @returns {Number[] | undefined } Array of running counts or undefined in case of an error.
   */
  static getClassRunningCounts() {
    return Player.getMainPlayer?.().getTrackingMap?.()?.getClassRunningCounts?.();
  }  

  /**
   * Gets the bounding boxes under the mouse
   * @param {Number} mouseX 
   * @param {Number} mouseY 
   * @param {Object[] | undefined} boxArr Array of boxes to search for. If undefined, bounding boxes in the current frame of the main player will be used.
   * @returns {Object[] | undefined} 
   */
  static getBoxesUnderMouse(mouseX, mouseY, boxArr) {
    if (typeof mouseX === 'undefined' || typeof mouseY === 'undefined') return;
    if (mouseX === null || mouseY === null) return;

    const boxesInFrame = Array.isArray(boxArr) ? boxArr : Player.getMainPlayer()?.getTrackingBoxesInFrame();
    if (!Array.isArray(boxesInFrame)) return;
    
    const boxesUnderMouse = [];
    boxesInFrame.forEach(bBox => {
      if ( !(bBox instanceof BoundingBox) ) return;
      
      // Get the coordinates and dimensions and check the validity
      const x = bBox.getX?.();
      const y = bBox.getY?.();
      const width = bBox.getWidth?.();
      const height = bBox.getHeight?.();
      for (const prop of [x, y, width, height]) {
        if (!Number.isFinite(prop)) return;
      }

      // Check if the box is under the mouse
      if ( !(mouseX >= x && mouseX <= x + width && mouseY >= y && mouseY <= y + height) ) return;
        
      // Add the valid bBox to the array
      boxesUnderMouse.push(bBox);
      
    });

    return boxesUnderMouse;

  }

  static getBoxesInFrame() {
    return Player.getMainPlayer()?.getTrackingBoxesInFrame();
  }


  /**
   * Detects whether the mouse is over any of the resizing handles of any of bounding boxes under the mouse
   * @param {BoundingBox[]} bBoxes Bounding boxes under the mouse
   * @param {Number} mouseX x-coordinate of mouse
   * @param {Number} mouseY y-coordinate of mouse
   * @returns {Object | undefined} result object
   * @returns {Object | undefined} result.box Box object
   * @returns {String | undefined} result.handleName Name of the resize handle 
   */
  static isMouseInResizeHandle(bBoxes, mouseX, mouseY) {
    const result = { box: null, handleName: null };

    // Check the validity
    for (const inputVal of [ bBoxes, mouseX, mouseY ]) {
      if (typeof inputVal === 'undefined' || inputVal === null) return;
    }

    // Check if array is given
    if (!Array.isArray(bBoxes)) return result;

    // Get the handle size in pixels for resizing rectangles
    const handleSize = BoundingBox.getResizeHandleSize();

    // Iterate over the bounding boxes
    bBoxes.forEach(bBox => {
      
      // Check the validity
      if (!(bBox instanceof BoundingBox)) return;

      // Get the handles
      const handles = [
        { name: 'tl', x: bBox.getX(), y: bBox.getY() }, // Top-left
        { name: 'tr', x: bBox.getX() + bBox.getWidth(), y: bBox.getY() }, // Top-right
        { name: 'bl', x: bBox.getX(), y: bBox.getY() + bBox.getHeight() },  // Bottom-left
        { name: 'br', x: bBox.getX() + bBox.getWidth(), y: bBox.getY() + bBox.getHeight() }, // Bottom-right
        { name: 'tc', x: bBox.getX() + bBox.getWidth()/2, y: bBox.getY() }, // Top-center
        { name: 'bc', x: bBox.getX() + bBox.getWidth()/2, y: bBox.getY() + bBox.getHeight() }, // Bottom-center
        { name: 'rc', x: bBox.getX() + bBox.getWidth(), y: bBox.getY() + bBox.getHeight()/2 }, // Right-center
        { name: 'lc', x: bBox.getX(), y: bBox.getY() + bBox.getHeight()/2 } // Left-center
      ];

      // Determine which handle the mouse is on
      for (const handle of handles) {
        if (
          mouseX >= handle.x - handleSize/2 && mouseX <= handle.x + handleSize/2 &&
          mouseY >= handle.y - handleSize/2 && mouseY <= handle.y + handleSize/2
        ) {
          result.box = bBox;
          result.handleName = handle.name;
        }
      }
      
    });

    // Return the result
    return result;


    
    // Check if mouse is inside the handle (located at right bottom corner of a tracking box)
    // return (
    //   mouseX >= box.x + box.width - handleSize && 
    //   mouseX <= box.x + box.width + handleSize && 
    //   mouseY >= box.y + box.height - handleSize &&
    //   mouseY <= box.y + box.height + handleSize
    // );

  }

  /**
   * Imports a file containing individual names
   * @param {import("original-fs").PathLike | undefined} filePath If file path is undefined, it will show a dialog to user for file selection
   * @returns 
   */
  static async importNameFile(filePath) {

    let userFilePath = filePath;

    // If no argument is provided, show a dialog for file selection
    if (!userFilePath) {
      const dialogResp = await window.electronAPI.openSingleFile('individuals');
      if (!dialogResp) {
        showAlertToast('Please try again.', 'error', 'Invalid/Inaccessible File');
        return;
      } else if (dialogResp.canceled) {
        return;
      }
      userFilePath = dialogResp.filePath

    }

    // Check validity of the chosen file path
    if (!userFilePath) {
      showAlertToast('Please try again.', 'error', 'File Import Failed');
      return;
    };


    // Read the file
    const readResponse = await window.electronAPI.readNameFile(userFilePath);
    if (!readResponse) {
      showAlertToast('Please try again.', 'error', 'File Import Failed');
      return;
    }

    const { names: nameArr, reason: failureReason } = readResponse;
    if (!nameArr && failureReason) {
      showAlertToast(failureReason, 'error', 'File Import Failed');
      return;
    }
    
    // Save names to Player object
    const individualNames = Player.setIndividualNames(nameArr);
    if (!individualNames) {
      showAlertToast('Please try again.', 'error', 'Failed to Save Names');
      return;
    }

    // Save names to config 
    Config.individualNames = individualNames;
    const response = await Config.saveToFile();
    if (!response) {
      showAlertToast('Please try again.', 'error', 'File Import Failed');
      return;
    };

    showAlertToast('Individual names imported!', 'success', 'File Imported');


  }


  /**
   * Imports a file containing action types
   * @param {import("original-fs").PathLike | undefined} filePath If file path is undefined, it will show a dialog to user for file selection
   * @returns 
   */
  static async importActionFile(filePath) {
    let userFilePath = filePath;

    // If no argument is provided, show a dialog for file selection
    if (!userFilePath) {
      const dialogResp = await window.electronAPI.openSingleFile('actions');
      if (!dialogResp) {
        showAlertToast('Please try again.', 'error', 'Invalid/Inaccessible File');
        return;
      } else if (dialogResp.canceled) {
        return;
      }
      userFilePath = dialogResp.filePath

    }

    // Check validity of the chosen file path
    if (!userFilePath) {
      showAlertToast('Please try again with a valid file!', 'error', 'File Import Failed');
      return;
    }

    // Read the file
    const readResponse = await window.electronAPI.readNameFile(userFilePath);
    if (!readResponse) {
      showAlertToast('Please try again.', 'error', 'File Import Failed');
      return;
    }

    const { names: nameArr, reason: failureReason } = readResponse;
    if (!nameArr && failureReason) {
      showAlertToast(failureReason, 'error', 'File Import Failed');
      return;
    }

    const actionNames = await Player.setActionNames(nameArr); // Save action types
    if (!actionNames) {
      showAlertToast('Please try again.', 'error', 'Failed to Save Names');
      return;
    } 

    // Save to config 
    Config.actionNames = nameArr;
    const response = await Config.saveToFile();
    if (!response) {
      console.log('Action names could not be saved to config file!', 'error');
      return;
    }

    showAlertToast('Action types imported!', 'success', 'File Imported')

  }

  /**
   * Imports a tracking file 
   * @param {import("original-fs").PathLike | undefined} filePath If undefined, user will be shown a dialog for file selection
   */
  static async importTrackingFile(filePath) {
    
    // Warn if no video is opened yet
    const mainPlayer = Player.getMainPlayer();
    if (!mainPlayer) {
      showAlertToast('Open the main video first!', 'warning', 'Tracking Unavailable');
      return;
    }
    
    // Pause the player
    mainPlayer.pause();
    
    let userFilePath = filePath;
    
    // If no argument is provided, show a dialog for file selection
    if (!userFilePath) {
      const dialogResp = await window.electronAPI.openSingleFile('tracking');
      if (!dialogResp) {
        showAlertToast('Please try again.', 'error', 'Invalid/Inaccessible File');
        return;
      } else if (dialogResp.canceled) {
        return;
      }
      userFilePath = dialogResp.filePath
      
    }
    
    showProcessIndicator();

    // Search for metadata file in the user data directory
    let metadataRsp;  // Object to hold response from metadata file reading function
    const metadataFilePath = await window.electronAPI.findMetadataFile(mainPlayer.getSource());
    if (metadataFilePath) {
      metadataRsp = await window.electronAPI.readMetadataFile(metadataFilePath);
      if (metadataRsp) {
        
        if (metadataRsp.timestamp) {
          Player.setCurrentTimeAll(metadataRsp.timestamp);
        }

        // Look for saved individual names first in metadata, then in config if no names in metadata
        const nameArr = metadataRsp.individuals ?? Config.individualNames;
        Player.setIndividualNames(nameArr);
      }

    }

    const trackArr = await window.electronAPI.readTrackingFile(userFilePath);
    if (!trackArr) {
      showAlertToast('Could not process tracking file!', 'error');
      hideProcessIndicator();
      return;
    }

    // Set the tracking map
    // const trackingMap = result.trackingMap;
    // const firstAvailTrackIds = result.firstAvailTrackIds;
    // const idMap = result.idMap;
    mainPlayer.setTrackingMap({
      tracks: trackArr, 
      classNames: metadataRsp?.classNames,
      classColors: metadataRsp?.classColors,
    });

    // Get the video file name
    const fileName = mainPlayer.getName();

    // Copy tracking file to the user directory
    const response = await window.electronAPI.copyToUserDataDir(userFilePath, `${fileName}_tracking.txt`);
    
    // Show notification on success/error
    if (!response) {
      showAlertToast('Please try again.', 'error', 'Failed to Save Tracking Data'); 
      hideProcessIndicator();
      return;
    }

    // Show success
    hideProcessIndicator();
    showAlertToast('Tracking file processed!', 'success'); 


  }

  /**
   * Imports a behavior file 
   * @param {import("original-fs").PathLike | undefined} filePath If undefined, user will be shown a dialog for file selection
   */
  static async importBehaviorFile(filePath) {
    // Check if the main video is opened
    const mainPlayer = Player.getMainPlayer();
    if (!mainPlayer) {
      showAlertToast('Open the main video before importing behaviors!', 'warning');
      return;
    }

    // Check if the Ethogram instance was initialized
    const ethogram = mainPlayer.getEthogram();
    if (!ethogram) {
      console.log('No Behavior instance for this player could be found!');
      return;
    }

    // ---------------------------------------------------------
    // Handle importing a new ethogram when there is already one
    // ---------------------------------------------------------
    // Check if an ethogram file with non-zero observations is already saved
    const mainVideoPath = mainPlayer.getSource();
    const ethogramFilePath = await window.electronAPI.findBehaviorFile(mainVideoPath);
    if (ethogramFilePath) {
      // Read the ethogram file (get the array of observations, each as a Map)
      try {
        const obsArr = await window.electronAPI.readBehaviorFile(ethogramFilePath);
        if (!obsArr) {
          showAlertToast('Behavior file could not be read!', 'error');
          return;
        }

        const obsCount = obsArr.length;
        if (obsCount > 0) {
          const recordText = obsCount === 1 ? 'record' : 'records';
          const mainVideoName = mainPlayer.getName(); 
          // Show modal
          showAlertModal(
            'Behavior File Overwrite', 
            [
              `A record of behaviors with ${obsCount} ${recordText} is already linked to video <span class="badge text-bg-dark">${mainVideoName}</span>.`,
              'Importing a new behavior file will overwrite the existing records. Are you sure you want to continue?'
            ]
          );
    
          // Get the user confirmation
          const alertConfirmBtn = document.getElementById('alert-confirm-btn');
          if (alertConfirmBtn) {
            const confirmed = await getUserConfirmationOnModal(alertConfirmBtn);
            
            // If the user cancels the importing process, do not proceed
            if (!confirmed) return;
            
            // Hide the modal for the alert
            hideAlertModal(); 
            
          }
    
        }

      } catch (err) {
        showAlertToast(err, 'error');
        return;
      }
      
      
    }
    // ----------------------------------------------------------
    // End of handling user confirmation for ethogram overwriting
    // ----------------------------------------------------------


    // If no argument is provided, show a dialog for file selection
    let userFilePath = filePath;
    if (!userFilePath) {
      const dialogResp = await window.electronAPI.openSingleFile('behaviors');
      if (!dialogResp) {
        showAlertToast('Please try again.', 'error', 'Invalid/Inaccessible File');
        return;
      } else if (dialogResp.canceled) {
        return;
      }
      userFilePath = dialogResp.filePath

      try {
        const obsArr = await window.electronAPI.readBehaviorFile(userFilePath);
        // Check if the array is empty
        const obsCount = obsArr.length;
        if (obsCount === 0) {
          showAlertToast('No valid record found!', 'error');
          return;
        }

        // Remove the current observations in the ethogram
        const isCleared = await ethogram.clear();

        if (!isCleared) {
          showAlertToast('Behaviors could not be updated! Please try again.', 'error');
          return;
        }

        // Create an Observation instance for each Map instance in the array
        // Add this Observation instance to the Ethogram
        // Add a new row for each Observation into the HTML table for Ethogram
        obsArr.forEach(obsMap => {
        
          const newObs = new Observation(obsMap);
          ethogram.add(newObs);
          
          // Add a row for each observation in the HTML table for the ethogram
          const hideAlert = true;
          addEthogramRow(newObs, hideAlert);
        
        });


      } catch (err) {
        showAlertToast(err, 'error');
      }

    }

  }

 

  constructor(domId, options) {
    this.domId = domId;
    this.mainPlayer = domId.includes('main');
    this.el = document.getElementById(domId);

    // Default setup options
    this.el.controls = false;
    this.el.autoplay = false;
    this.el.preload = 'auto';

    // Keep track of added events
    this.events = [];

    // Coordinates of rectangle for selecting a region for zoom 
    this.zoomRect = {
      tempX: null, // Temporary top left x-coord (Before mouseup event and during mousemove event)
      tempY: null,
      tempWidth: null, // Temporary width
      tempHeight: null,
      startX: null, // Final top left x-coord (after mouseup event)
      startY: null,
      width: null, // Final width (after mouseup event)
      height: null,
      canvasWidth: null,
      canvasHeight: null,
      aspectRatio: null,
      shouldHideEl: true,
      shouldUpdate: false,
    };
    
    // Coordinates of rectangle for drawing a new tracking bounding box 
    this.drawingRect = {
      tempX: null, // Temporary top left x-coord (Before mouseup event and during mousemove event)
      tempY: null,
      tempWidth: null, // Temporary width
      tempHeight: null,
      startX: null, // Final top left x-coord (after mouseup event)
      startY: null,
      width: null, // Final width (after mouseup event)
      height: null,
      canvasWidth: null,
      canvasHeight: null,
      aspectRatio: null,
      shouldHideEl: true,
      shouldUpdate: false,
    }

    this.instanceDrawnOnCanvas; // Holds the instance to handle the current user-drawable bounding box on canvas

    // Add user options if provided
    if (options !== undefined) {
      this.options = options;
      for (const option in options) {
        this.el[option] = this.options[option]
      }

    }

    // Keep track of whether video DOM element emitted an error
    this.errorOnLoad = undefined;

    // Handle errors
    this.on('error', () => {
      console.log('Video cannot be played!');
      this.errorOnLoad = true;
      this.hideSpinner();

    });

    // Show spinner when the video is loading
    this.on('loadstart', () => {
      this.showSpinner();
    });

    this.on('canplay', () => {
      this.errorOnLoad = false;
    });

    this.on('canplaythrough', () => {
      this.errorOnLoad = false;
      this.hideSpinner();
    });
    
    if (this.mainPlayer) {
      Player.mainPlayer = this;
      this.ethogram = new Ethogram();
      this.trackingMap = new TrackingMap();
      this.metadata = new Metadata();

      // Set up the play-pause btn
      const playPauseButton = new Button('#play-pause-btn');
      playPauseButton.setIcon('play_circle', 'size-48');
      playPauseButton.on('click', () => Player.playPauseAll());

      // Set up the mute button
      const muteButton = new Button('#mute-btn');
      muteButton.setIcon('volume_up');
      muteButton.on('click', () => this.toggleMute());

      // Set up the skip forward button
      const forwardButton = new Button('#forward-btn');
      forwardButton.on('click', () =>  Player.forwardAll());

      // Set up the skip backward button
      const replayButton = new Button('#replay-btn');
      replayButton.on('click', () => Player.replayAll());  

      // Attach the playback buttons
      this.attachButton(playPauseButton, 'play-pause');
      this.attachButton(muteButton, 'mute');
      this.attachButton(forwardButton, 'forward');
      this.attachButton(replayButton, 'replay');
      
      // Attach the control bar
      this.attachControlBar(new ControlBar('#control-bar'));

      // Set up playback speed button
      const playbackRateList = document.getElementById('playback-rate-list');
      if (playbackRateList) {
        const listItems = playbackRateList.querySelectorAll('.dropdown-item');
        if (listItems) {
          listItems.forEach(item => {
            item.addEventListener('click', () => {
              const selectedValue = parseFloat(item.dataset.playbackRate);
              if (selectedValue) {
                this.setPlaybackRate(selectedValue);
              }
            });
          });
        
        }

      }

      // Set up zoom scale button located on the zoomed video region div element
      const zoomScaleDropdownBtn = document.getElementById('zoom-scale-dropdown');
      if (zoomScaleDropdownBtn) {
        const listItems = zoomScaleDropdownBtn.querySelectorAll('.dropdown-item');
        if (listItems) {
          listItems.forEach(item => {
            item.addEventListener('click', async () => {
              const selectedValue = parseFloat(item.dataset.zoomScale);
              if (selectedValue) {
                await Player.setZoomScale(selectedValue);
              }
            });
          });
        
        }

      }

      // Get the default skip forward and back seconds selection
      const skipSecondsList = document.getElementById('skip-seconds-list');
      if (skipSecondsList) {  
        const listItems = skipSecondsList.querySelectorAll('.dropdown-item');
        if (listItems) {
          listItems.forEach(item => {
            item.addEventListener('click', async () => {
              const selectedValue = parseFloat(item.dataset.skipSeconds);
              if (selectedValue) {
                await Player.setSkipSeconds(selectedValue);
              }
            });
          });
        
        }

      }
          
      // // Get the default skip forward and back seconds selection
      // const skipSecondsSelectEl = document.getElementById('skip-seconds-select');
      // if (skipSecondsSelectEl) {        
      //   // Change skip forward and back seconds when user changes the relevant setting
      //   skipSecondsSelectEl.addEventListener('change', async () => {
      //     await Player.setSkipSeconds(skipSecondsSelectEl.selectedOptions[0].value);
          
      //   });
      // }

      const controlBar = this.getControlBar();
      if (!controlBar) return;

      const progressBarEl = controlBar.progressBar;
      if (!progressBarEl) return;

      // Get the click event to change the current time with user input
      progressBarEl.addEventListener('click', (e) => { 
        const progressBarRect = progressBarEl.getBoundingClientRect();
        const clickPosition = e.clientX - progressBarRect.left;
        const videoTime = (clickPosition / progressBarRect.width) * this.getDuration();
        
        Player.setCurrentTimeAll(videoTime)
        // Player.getAllInstances().forEach(player => {
        //   // player.pause();
        //   player.setCurrentTime(videoTime);

        // });


      });
    
      // Show video time when hovering over the progress bar 
      progressBarEl.addEventListener('mousemove', (e) => {
        
        const hoverTimeDivEl = document.getElementById('hover-time-div');
        if (!hoverTimeDivEl) return;

        const hoverTimeTextEl = hoverTimeDivEl.querySelector('.hover-time-text');
        if (!hoverTimeTextEl) return;
        
        const mainPlayer = Player.getMainPlayer();
        if (!mainPlayer) return;

        if (!mainPlayer.getDuration()) return;

        const progressBarRect = progressBarEl.getBoundingClientRect();
        const clickPosition = e.clientX - progressBarRect.left;
        const hoveredTime = (clickPosition / progressBarRect.width) * mainPlayer.getDuration();
        const formattedTime = formatSeconds(hoveredTime);

        // hoverTimeDivEl.style.left = (e.clientX - hoverTimeDivEl.offsetWidth / 2) + 'px';
        
        hoverTimeTextEl.textContent = formattedTime; 
        // hoverTimeTextEl.classList.remove('d-none');
        
        // Show video frame when hovering over the progress bar
        const hoverVideoEl = document.getElementById('hover-video');
        if (!hoverVideoEl) return;

        // Get the DOM element for showing video frames on hover
        const hoverFrameEl = document.getElementById('hover-frame-div');
        if (!hoverFrameEl) return;

        // Get the canvas 
        const hoverFrameCanvas = hoverFrameEl.querySelector('canvas');
        if (!hoverFrameCanvas) return;

        // Check if canvas context exists
        if (!hoverFrameCanvas.getContext) return;

        if ("requestVideoFrameCallback" in HTMLVideoElement.prototype) {

          // Show the hover frame element 
          hoverFrameEl.classList.remove('d-none');
          
          // Update the on-hover time
          hoverVideoEl.currentTime = hoveredTime;
            
          // Update the hover element position values
          hoverFrameEl.style.left = (e.clientX - hoverTimeDivEl.offsetWidth / 2) + 'px';
          hoverFrameEl.style.top = progressBarRect.top - hoverFrameEl.offsetHeight - 10 + 'px';


          // Update the canvas
          const updateCanvas = (now, metadata) => {
            
            const ctx = hoverFrameCanvas.getContext('2d')

            // Draw the relevant video frame to canvas on hover
            ctx.drawImage(hoverVideoEl, 0, 0, hoverFrameCanvas.width, hoverFrameCanvas.height);
            
            // Re-register the callback to run on the next frame
            hoverVideoEl.requestVideoFrameCallback(updateCanvas);
            
          };
          
          // Initial registration of the callback to run on the first frame
          hoverVideoEl.requestVideoFrameCallback(updateCanvas);

        } else {
          alert("Your browser does not support requestVideoFrameCallback().");

        }

      });
  
      // Hide the on-hover element when mouse leaves the progress bar
      progressBarEl.addEventListener('mouseleave', (e) => {
        const hoverFrameEl = document.getElementById('hover-frame-div');
        if (!hoverFrameEl) return;
        hoverFrameEl.classList.add('d-none');

      });

     
      // mainPlayer.on('canplaythrough', () => mainPlayer.hideSpinner());
        
      // Synchronize all videos
      this.on('pause', () => {
        this.updateButtonIcons();
        Player.getSecondaryPlayers().forEach(player => player.pause());
        // Clear request id for zooming
        // window.cancelAnimationFrame(Player.zoomRequestId);
        // Player.zoomRequestId = undefined;
      });
          
      this.on('playing', () => {
        this.updateButtonIcons();
        Player.getSecondaryPlayers().forEach(player => player.play());
      });

        
      this.on('play', Player.drawZoomedVideoRegion);

      this.on('ended', () => {
        window.cancelAnimationFrame(Player.zoomRequestId);
        Player.zoomRequestId = undefined;
      })
      
      this.on('ratechange', () => {
        // Sync playback speed
        const currentSpeed = this.getPlaybackRate();
        Player.getSecondaryPlayers().forEach(player => {
          player.setPlaybackRate(currentSpeed);
        });
        
        // Update the text inside rate button
        const playbackRateButton = document.getElementById('playback-rate-btn');
        playbackRateButton.textContent = `Speed: ${currentSpeed}x`
      
        // Update active states of the selection
        const playbackRateList = document.getElementById('playback-rate-list');
        if (playbackRateList) {
          const listItems = playbackRateList.querySelectorAll('.dropdown-item');
          if (listItems) {
            listItems.forEach(item => {
              // Make the item with the same speed as the main player active
              if (parseFloat(item.dataset.playbackRate) === currentSpeed) {
                item.classList.add('active');
              } else {
                // Remove active states from all items
                item.classList.remove('active');
              }
            });

          }

        }

      });

      // Events when the main video is loaded
      this.on('loadedmetadata', async () => {

        showProcessIndicator();
        this.showSpinner();

        const mainPlayerSrc = this.getSource();
          
        // Set the frame rate
        await this.setFrameRate();

        // TODO: Handle invalid frame rate here

        // Reset the intevals IDs and DOM elements for last edit status
        Player.resetEthogramInterval();
        Player.resetNotesInterval();

        // Get the default skip forward and back seconds selection
        const skipSecondsSelectEl = document.getElementById('skip-seconds-select');
        if (skipSecondsSelectEl) {        
          await Player.setSkipSeconds(skipSecondsSelectEl.selectedOptions[0].value);

        }

        // Search for metadata file in the user data directory
        let metadataRsp;  // Object to hold response from metadata file reading function
        const metadataFilePath = await window.electronAPI.findMetadataFile(mainPlayerSrc);
        if (metadataFilePath) {
          metadataRsp = await window.electronAPI.readMetadataFile(metadataFilePath);
          
          // Look for saved timestamp
          Player.setCurrentTimeAll(metadataRsp?.timestamp);

          // Look for saved individual names first in metadata, then in config if no names in metadata
          const nameArr = metadataRsp.individuals ?? Config.individualNames;
          Player.setIndividualNames(nameArr);


        }

        // Search for tracking or identification file
        // let trackingFilePath, tracks, firstAvailTrackIds, idMap
        let trackingFilePath, tracks;
        const trackingSearchResponse = await window.electronAPI.findTrackingFile(mainPlayerSrc);
        if (trackingSearchResponse) {
          // First check if an identification file was saved before
          if (trackingSearchResponse.idFilePath) {
            trackingFilePath = trackingSearchResponse.idFilePath;
        
          // If no identification file, look for a tracking file
          } else if (trackingSearchResponse.trackFilePath) {
            trackingFilePath = trackingSearchResponse.trackFilePath;
        
          }
          
          // Read the tracking file
          if (trackingFilePath) {
            tracks = await window.electronAPI.readTrackingFile(trackingFilePath);
          }

        }

        // Update the progress bar
        this.getControlBar?.()?.updateProgressBar?.();
      
        // Set the attributes of hidden video element 
        // This hidden video element is used for showing individual video frames when hovering over 
        this.setCanvasOnHover?.();

        // Get the canvas on the main player to show tracking rectangles
        const mainCanvas = document.getElementById('main-tracking-canvas');
        if (mainCanvas) {
          this.attachCanvas(mainCanvas);

          if (tracks) {
            this.setTrackingMap({
              tracks: tracks,
              classNames: metadataRsp?.classNames,
              classColors: metadataRsp?.classColors
            });
          } else {
            // Clear the previous map and tracking file path from config file
            this.resetTrackingMap();
          }
          
          // Make tracking boxes clickable and interactive
          mainCanvas.addEventListener('click', Player.makeBoxesInteractive);

          // Indicate that tracking boxes are clickable
          mainCanvas.addEventListener('mousemove', Player.showCursorOnBoxes);

          // Show dropdown for individuals when right-clicked on tracking boxes
          mainCanvas.addEventListener('contextmenu', Player.showRightClickMenu);

          // Zoom into the selected region of the main video
          const zoomSelectCanvas = document.getElementById('main-zoom-select-canvas');
          const drawingCanvas = document.getElementById(Player.drawingCanvasId);
          if (zoomSelectCanvas && drawingCanvas) {
            zoomSelectCanvas.width = this.el.videoWidth;
            zoomSelectCanvas.height = this.el.videoHeight;
            drawingCanvas.width = this.el.videoWidth;
            drawingCanvas.height = this.el.videoHeight;

            if (this.zoomRect) {
              this.zoomRect.aspectRatio = this.el.videoWidth / this.el.videoHeight;

            }

            // Remove any previous event listeners to avoid duplicates
            // mainCanvas.removeEventListener('mousedown', Player.mousedownOnCanvasHandler); 
            // mainCanvas.removeEventListener('mousemove', Player.mousemoveZoomHandler);
            // mainCanvas.removeEventListener('mouseup', Player.mouseupZoomHandler);
            
            // Detect mouse dragging on the main canvas
            mainCanvas.addEventListener('mousedown', Player.mousedownOnCanvasHandler); 
            mainCanvas.addEventListener('mousemove', Player.mousemoveZoomHandler);
            mainCanvas.addEventListener('mouseup', Player.mouseupZoomHandler);
            
          }

        }

        
        // Setup the maximum duration on the "jump to frame" input element
        const jumpToFrameInput = document.getElementById('jump-to-frame-input');
        if (jumpToFrameInput) {
          const frameCount = secondsToFrames(this.getDuration());
          // jumpToFrameInput.placeholder = `Frame number <${frameCount}`;
          jumpToFrameInput.placeholder = `Frame no.`;
          jumpToFrameInput.max = frameCount;
        }

        
        // Clear the ethogram
        this.clearEthogram();

        // Search for previously recorded ethogram file in user data directory
        const behaviorFilePath = await window.electronAPI.findBehaviorFile(mainPlayerSrc);

        // If the ethogram file has been found
        if (behaviorFilePath) {

          // Read the ethogram file (get the array of observations each as a Map)
          const obsArr = await window.electronAPI.readBehaviorFile(behaviorFilePath);

          // Check if the file can be read
          if (obsArr) {

            // Get the Ethogram instance for the main player
            const ethogram = this.getEthogram();
            if (ethogram) {

              // Create an Observation instance for each Map instance in the array
              // Add this Observation instance to the Ethogram
              // Add a new row for each Observation into the HTML table for Ethogram
              obsArr.forEach(obsMap => {
                const newObs = new Observation(obsMap);

                // Do NOT rewrite imported ethogram entries to ethogram file in user data directory
                const doNotOverwrite = true;
                ethogram.add(newObs, doNotOverwrite);
                
                const hideAlert = true;
                addEthogramRow(newObs, hideAlert);

              });

              // Get the number of observations in the Ethogram
              const obsCount = ethogram.size();

              if (obsCount > 0) {
                
                // Show success notification
                const recordText = obsCount === 1 ? `${obsCount} record` : `${obsCount} records`;
                showAlertToast(`${recordText} imported!`, 'success', 'Behaviors Imported');

                // Show last edit time
                Player.showLastEditForEthogram(behaviorFilePath);

              }

            }

          }


        }

        // Search for saved notes file
        const notesTextArea = document.getElementById('notes-text-area');
        if (notesTextArea) {
          
          // Clear the notes text area
          notesTextArea.value = '';
          
          // showAlertToast('Searching for notes...!', 'info');

          // Search for previously saved notes file in user data directory
          const notesFilePath = await window.electronAPI.findNotesFile(mainPlayerSrc);
          // Fill the notes text area if the notes file was found
          if (notesFilePath) {
            try {
              // Read the file content
              const notesContent = await window.electronAPI.readNotesFile(notesFilePath);
              if (notesContent) {
                // Fill the DOM element
                notesTextArea.value = notesContent;
    
                // Show success
                showAlertToast('Notes imported!', 'success');
    
                // Show last edit time
                Player.showLastEditForNotes(notesFilePath);
              }
            
            } catch (err) {
              console.log('Empty notes file');

            }

          } 

        }

        // Hide the loading indicator element
        hideProcessIndicator?.();
        this.hideSpinner?.();
      
      });
          
      // Update the progress bar when the current time of the main video is changed
      this.on('timeupdate', async () => {
        this.getControlBar?.()?.updateProgressBar?.();
        this.displayTrackingBoxes?.();

        // Update metadata
        Player.getMetadata?.()?.updateTimestamp?.();


      });

      // Buttons on the toast for editing labels
      const behaviorAddBtn = new Button('#label-save-btn');
      behaviorAddBtn.on('click', handleBehaviorRecordByClick)

      const trackingEditButton = new Button('#tracking-edit-btn');
      trackingEditButton.on('click', updateTracksFromToast)

      const nameEditButton = new Button('#name-edit-btn');
      nameEditButton.on('click', updateTracksFromNameDropdown);

      // Reset interval IDs
      Player.resetEthogramInterval();
      Player.resetNotesInterval();

    } else {
      Player.secondaryPlayers.push(this);

      // Set frame rate and dismiss button
      this.on('loadeddata', async () => {
            
        // Set frame rate 
        await this.setFrameRate();

        // TODO: Handle invalid frame rate here

        // Dispose player if close button is clicked
        const playerColDiv = this.el.parentNode.parentNode;
        if (playerColDiv) {
          const disposeButton = playerColDiv.querySelector('.btn-dispose-player');
          if (disposeButton) {
            disposeButton.addEventListener('click', () => this.dispose());
          }
        }
    
      });
      
    }

    // Add this instance to the all instances list
    Player.allInstances.push(this);

  }

  static resetZoomObject() {
    // Reset the zoom rect
    const mainPlayer = Player.getMainPlayer();
    if (!mainPlayer) return;

    const zoomRect = mainPlayer.zoomRect;
    if (!zoomRect) return;
  
    Object.keys(zoomRect).forEach(key => {
      zoomRect[key] = null;
    });

  }

  static getMetadata() {
    const mainPlayer = Player.getMainPlayer();
    if (!mainPlayer) return;
    return mainPlayer.metadata;
  }

  /**
   * Resets the interval Id for showing the last edit time for notes file.
   * Also hides the relevant HTML element
   */
  static resetNotesInterval() {
    if (Player.notesIntervalId) {
      clearInterval(Player.notesIntervalId);
      Player.notesIntervalId = null;
    }

    // Hide the HTML element
    const domEl = document.getElementById('notes-save-status-div');
    if (domEl) {
      domEl.classList.remove('visible');
      domEl.classList.add('invisible');
    }

  }

  /**
   * Gets the DrawnBoundingBox instance for user-drawn bounding box on the drawing canvas over the main video
   * @returns {DrawnBoundingBox} 
   */
  static getDrawnBBox() {
    return Player.drawnBoundingBox;
  }

  /**
   * Sets the DrawnBoundingBox instance for user-drawn bounding box on the drawing canvas over the main video
   * @param {DrawnBoundingBox | undefined} bBox If it is undefined, a new instance of DrawnBoundingBox will be created and assigned
   * @returns {DrawnBoundingBox} Newly Assigned DrawnBoundingBox instance
   */
  static setDrawnBBox(bBox) {
    Player.drawnBoundingBox = bBox ?? new DrawnBoundingBox();
    return Player.drawnBoundingBox;
  }

  

  /**
   * Resets the interval Id for showing the last edit time for ethogram file.
   * Also hides the relevant HTML element
   */
  static resetEthogramInterval() {
    if (Player.ethogramIntervalId) {
      clearInterval(Player.ethogramIntervalId);
      Player.ethogramIntervalId = null;
    }

    // Hide the HTML element
    const domEl = document.getElementById('ethogram-save-status-div');
    if (domEl) {
      domEl.classList.remove('visible');
      domEl.classList.add('invisible');
    }
  }

  /**
   * Show the last edit time for the ethogram file on an HTML element periodically
   * @param {import("original-fs").PathLike} filePath 
   * @param {Boolean | undefined} isFailed Optional flag to indicate success/failure of writing to file
   * @param {Number | undefined} updateFreq Optional update frequency in milliseconds
   */
  static showLastEditForEthogram(filePath, isFailed, updateFreq) {

    // DOM element ID for showing the last edit time
    const domElId = 'ethogram-save-status-div';

    // Get the status update frequency for last modified time
    const statusUpdateFreq = updateFreq ? updateFreq : Player.getStatusUpdateFreq();

    // Show the changes immediately
    showLastEditForFile(filePath, domElId, isFailed);

    // Show last modified time periodically if the relevant function has not been called already
    if (!Player.ethogramIntervalId) {
      Player.ethogramIntervalId = setInterval(showLastEditForFile, statusUpdateFreq, filePath, domElId, isFailed);
    
    }

    if (isFailed) {
      showAlertToast('Unable to save changes! Please try again.', 'error', 'Save Failure');
    }

  }


  /**
   * Show the last edit time for the notes file on an HTML element periodically
   * @param {import("original-fs").PathLike} filePath 
   * @param {Boolean | undefined} isFailed Optional flag to indicate success/failure of writing to file
   * @param {Number | undefined} updateFreq Optional update frequency in milliseconds
   */
  static showLastEditForNotes(filePath, isFailed, updateFreq) {

    // DOM element ID for showing the last edit time
    const domElId = 'notes-save-status-div';

    // Get the status update frequency for last modified time
    const statusUpdateFreq = updateFreq ? updateFreq : Player.getStatusUpdateFreq();

    // Show the changes immediately
    showLastEditForFile(filePath, domElId, isFailed);

    // Show last modified time periodically if the relevant function has not been called already
    if (!Player.notesIntervalId) {
      Player.notesIntervalId = setInterval(showLastEditForFile, statusUpdateFreq, filePath, domElId, isFailed);
    
    }

    if (isFailed) {
      showAlertToast('Unable to save changes! Please try again.', 'error', 'Save Failure');
    }


  }


  /**
   * Loads the main player 
   * @param {import("node:original-fs").PathLike} mainVideoPath 
   * @returns 
   */
  static async loadMainPlayer(mainVideoPath) {

    // Check if a video path is given
    if (!mainVideoPath) return;

    // Create or get the main player
    const mainPlayer = Player.getMainPlayer() ?? new Player('main-video');

    // Save the previous video source
    const prevSource = mainPlayer.getSource();

    // Load the video source
    mainPlayer.setSource(mainVideoPath);
    
    // Check if the video DOM element emitted an error
    try {

      await mainPlayer.load();
      
      // Save main video path to config
      Config.mainVideoPath = mainVideoPath;
      const configResponse = await Config.saveToFile();
      if (!configResponse) return;

      

      const mainVideoName = await getFileNameWithoutExtension(mainVideoPath); 
      if (mainVideoName) {
        const mainVideoTitleEl = document.getElementById('main-video-title');
        if (mainVideoTitleEl) {
          mainVideoTitleEl.textContent = mainVideoName;
        }
        await mainPlayer.setName(mainVideoName);         
        
      }

      // Move the buttons to the main video bar
      const mainVideoBar = document.getElementById('main-video-bar');
      const openMainVideoBtn = document.getElementById('open-main-video-btn'); 
      const openExperimentFolderBtn = document.getElementById('open-experiment-folder-btn');
      const initialPanelDiv = document.getElementById('initial-panel-div');
      if (mainVideoBar) {
        const videoBarBtnDiv = mainVideoBar.querySelector('.button-div');
        if (videoBarBtnDiv) {
          if (openMainVideoBtn) {
            videoBarBtnDiv.appendChild(openMainVideoBtn);
            openMainVideoBtn.classList.remove('size-48');
            openMainVideoBtn.classList.add('main-panel-btn');
          } 

          if (openExperimentFolderBtn) {
            videoBarBtnDiv.appendChild(openExperimentFolderBtn);
            openExperimentFolderBtn.classList.remove('size-48');
            openExperimentFolderBtn.classList.add('main-panel-btn');
          }

        }

      }

      // Remove the initial panel
      if (initialPanelDiv) {
        initialPanelDiv.remove();
      }

    } catch (error) {
      if (prevSource) {
        mainPlayer.setSource(prevSource);
        try {
          await mainPlayer.load();
        } catch (error) {
          console.log(error);
        }
      }
      return new Promise((_, reject) => reject(error));
    }

    // if (errorOnLoad) {
    //   return new Promise((_, reject) => {
    //     reject('Video cannot be played!');
    //   });
    // }

    

    
    

  }

  /**
   * Delete a Player instance
   * @param {Player} player Player instance to be deleted
   */
  static delete(player) {

    if (!player) return;

    if (!player.domId) return;

    if (!player.isMainPlayer()) {
      // Find the item for this player in the secondary player array and remove it
      Player.secondaryPlayers = Player.secondaryPlayers.filter(savedPlayer => savedPlayer.domId !== player.domId);
    }
  
    // Remove the item from all instances array
    Player.allInstances = Player.allInstances.filter(savedPlayer => savedPlayer.domId !== player.domId);

  }

  static getHotkeys() {
    return Player.hotkeys;
  }

  /**
   * Redraws bounding boxes on the main tracking canvas to reflect changes to tracks
   */
  static refreshMainCanvas() {
    const mainPlayer = Player.getMainPlayer();
    if (!mainPlayer) return;

    mainPlayer.displayTrackingBoxes();

  }

  /**
   * Gets the frequency in milliseconds for updating last modified time for files on their corresponding HTML elements
   * @returns {Number}
   */
  static getStatusUpdateFreq() {
    if (!Player.statusUpdateFreq) {
      Player.statusUpdateFreq = 60000; // 1 minute of frequency
    }
    return Player.statusUpdateFreq;
  }

  static setAppVersion(versionNo) {
    if (versionNo) {
      Player.appVersion = versionNo;
    } else {
      const versionNo = window.electronAPI.getVersion();
      if (versionNo) {
        Player.appVersion = versionNo;
      }
    }

  }


  /**
   * Gets the current app version
   * @returns {String} App version in string format
   */
  static getAppVersion() {
    if (Player.appVersion) {
      return Player.appVersion;
    } 
    
    window.electronAPI.getVersion().then(versionNo => {
      if (versionNo) {
        return versionNo;
      }
    });

  }

  // Use for loading all shortcuts from config file
  static setHotkeys(hotkeysObj) {
    if (hotkeysObj) {
      Player.hotkeys = hotkeysObj;
    }

  }

  /**
   * Get the action names
   * @returns {String[]}
   */
  static getActionNames() {
    return Player.actionNameArr;
  }

  /**
   * Gets the zoom scale as a multiplier
   * @returns {Number}
   */
  static getZoomScale() {
    return Player.zoomScale;
  }

  /**
   * Gets the minimum value for zoom scale as a multiplier
   * @returns {Number}
   */
  static getMinZoomScale() {
    return Player.minZoomScale;
  }

  /**
   * Gets the maximum value for zoom scale as a multiplier
   * @returns {Number}
   */
  static getMaxZoomScale() {
    return Player.maxZoomScale;
  }

  /**
   * Sets the zoom scale percentage for the main video to the input value
   * @param {Number | String} zoomScale Number for zoom scale (e.g. 1 -> 1x)
   * @returns 
   */
  static async setZoomScale(zoomScale) {
    if (!zoomScale) return;

    const parsedNum = parseFloat(zoomScale);

    if (!Number.isFinite(parsedNum)) {
      console.log('Input for the zoom scale is not a valid number!');
      return;
    }

    // Get the range for zoom scale
    const minZoomScale = Player.minZoomScale ? Player.minZoomScale : 1;
    const maxZoomScale = Player.maxZoomScale ? Player.maxZoomScale : 6;

    let normalizedScale;
    if (parsedNum < minZoomScale) {
      normalizedScale = minZoomScale;
    } else if (parsedNum <= maxZoomScale) {
      normalizedScale = parsedNum;
    } else {
      normalizedScale = maxZoomScale;
    }

    // Change the zoom scale
    Player.zoomScale = normalizedScale;

    // Update the config
    Config.zoomScale = normalizedScale;
    const response = await Config.saveToFile();
    if (!response) {
      console.log('Zoom scale could not be saved to config file!');
      return;
    }
  
    updateZoomScaleDomEls();
  
    Player.updateZoomedCanvas();
  
    return Player.zoomScale;

    
  }

  /**
   * Gets the username
   * @returns {String}
   */
  static getUsername() {
    return Player.username;
  }

  /**
   * Sets the username
   * @param {String} username 
   */
  static setUsername(username){
    if (!username) return;

    // Add username to the setting modal
    const usernameInputEl = document.getElementById('change-username-input');
    if (usernameInputEl) {
      usernameInputEl.value = username;
      // usernameInputEl.placeholder = configData.username;
    }
    
    Player.username = username;
      
    // Update metadata
    Player.getMetadata?.()?.updateUsername?.();

    // Update config
    Config.username = username;

  }

  /**
   * 
   * @param {*} actionNameArr 
   * @returns 
   */
  static async setActionNames(actionNameArr) {
    if (!actionNameArr) return;
    Player.actionNameArr = actionNameArr;
    const actionNames = Player.getActionNames();
    
    if (!Array.isArray(actionNames) || actionNames.length < 1) return;

    // Update the metadata
    const metadata = Player.getMetadata();
    if (metadata) metadata.updateActions();
    
    // Check if there is at least one assigned hotkey for actions
    const hotkeyCategory = 'actions';
    const hotkeysInCategory = Hotkey.findAll({ category: hotkeyCategory });
    const anyAssignedKey = hotkeysInCategory.some(
      hotkey => hotkey.key !== undefined && hotkey.key !== null && hotkey.key !== ''
    );

    // If there is NO previously assigned hotkeys, create hotkeys for actions automatically
    if (!anyAssignedKey) {
      let keyArr = Hotkey.getAllKeysWithoutModifiers();
      actionNames.forEach(name => {
        let breakExecuted = false;
        let newKey;
        
        // Iterate over the letters of a name
        for (let i = 0; i < name.length; i++) {
          
          // Check whether this was already in the shortcut list and ensure it is not a space character
          // const lowerChar = name[i].toLowerCase();
          const char = name[i];
          const conflictingHotkeys = Hotkey.findConflicts(char, []);
          if (!keyArr.includes(char) && char !== ' ') {
            // If not, add it as a new shortcuts
            newKey = char;
            keyArr.push(newKey);
            breakExecuted = true;
            break;
  
          }
  
        }
  
        // If no suitable letter has been found with traversing the entire string
        if (!breakExecuted) {
          // Assign a random letter
          newKey = getRandomLetterNotIn(keyArr);
          if (newKey) keyArr.push(newKey);
  
        }
  
        // Update the hotkeys 
        const newHotkey = new Hotkey(hotkeyCategory, name, name, newKey);
  
  
      });

    }
   
    // Update list in HTML
    updateHotkeyDomElement(hotkeyCategory);
      
    // Update the action datalist element
    const actionDatalistEl = document.getElementById('action-datalist');
    if (!actionDatalistEl) return;
      
    // Reset the action datalist before updating it
    while (actionDatalistEl.firstChild) {
      actionDatalistEl.removeChild(actionDatalistEl.firstChild);
    }
      
    // Add up-to-date action names to this datalist element
    if (actionNameArr.length < 1) return;
    
    actionNameArr.forEach(actionName => {
      const optionEl = document.createElement('option');
      optionEl.value = actionName;
      actionDatalistEl.append(optionEl);
    });

    return Player.getActionNames();

  }

  static async setSkipSeconds(seconds) {
    
    // Check if an input is provided
    if (!seconds) {
      console.log('No value for skip seconds was provided!');
      return;
    }

    // Convert the input to float (for seconds smaller than 1)
    const skipSeconds = parseFloat(seconds);

    // Check if the provided number is valid
    if (Number.isNaN(skipSeconds) || !Number.isFinite(skipSeconds)) {
      console.log('Skip seconds input is invalid: either NaN or not finite!');
      return;
      
    }
    
    // Save the skip seconds
    Player.skipSeconds = skipSeconds;

    // Update the text inside rate button
    const skipSecondsBtn = document.getElementById('skip-seconds-btn');
    skipSecondsBtn.textContent = `Skip: ${skipSeconds} sec`
  
    // Update active states of the selection
    const skipSecondsList = document.getElementById('skip-seconds-list');
    if (skipSecondsList) {
      const listItems = skipSecondsList.querySelectorAll('.dropdown-item');
      if (listItems) {
        listItems.forEach(item => {
          // Make the item with the same speed as the main player active
          if (parseFloat(item.dataset.skipSeconds) === skipSeconds) {
            item.classList.add('active');
          } else {
            // Remove active states from all items
            item.classList.remove('active');
          }
          
        });

      }

    }
  
    // // Change selected value on the select element
    // const skipSecondsSelectEl = document.getElementById('skip-seconds-select');
    // if (skipSecondsSelectEl) {
    //   for (let i=0; i < skipSecondsSelectEl.options.length; i++) {
    //     if (skipSecondsSelectEl.options[i].value == Player.getSkipSeconds() ) {
    //       skipSecondsSelectEl.options[i].selected = true;
    //       break;
    //     }
    //   } 
    // }

    // Save to config
    Config.skipSeconds = this.skipSeconds;
    const response = await Config.saveToFile();
    if (!response) {
      console.log("Couldn't save the skip seconds to config file!", 'error');
    }

  }

  static setMaxPlaybackRate(rate) {
    Player.maxPlaybackRate = rate;
  }

  static async setAutoUpdateStatus(status) {
    const autoUpdateSwitch = document.getElementById('auto-update-switch');
    if (!autoUpdateSwitch) return;
    autoUpdateSwitch.checked = status !== 'disabled';
      
  }
  
  static setIndividualNames(nameArr) {
    if (!Array.isArray(nameArr)) return;

    if (!Player.hasOwnProperty('individualNames')) return;
    
    Player.individualNames = nameArr;
    const individualNames = Player.getIndividualNames();
    if (!Array.isArray(individualNames)) return;

    // Update metadata
    Player.getMetadata?.()?.updateIndividuals?.();

    // Update the config
    Config.individualNames = nameArr;
    
    // Check if there is at least one assigned hotkey for actions
    const hotkeyCategory = 'individuals';

    // Remove all existing Hotkey instances for this category before creating new ones
    const hotkeysInCategory = Hotkey.findAll({ category: hotkeyCategory });
    hotkeysInCategory.forEach(hotkey => hotkey.delete() )

    // const anyAssignedKey = hotkeysInCategory.some(
    //   hotkey => hotkey.key !== undefined && hotkey.key !== null && hotkey.key !== ''
    // );


    // If there is NO previously assigned hotkeys, create hotkeys automatically
    // if (!anyAssignedKey) {
    let keyArr = Hotkey.getAllKeysWithoutModifiers();
    individualNames.forEach(name => {
      let breakExecuted = false;
      let newKey;
      
      // Iterate over the letters of a name
      for (let i = 0; i < name.length; i++) {
        // Check whether this was already in the shortcut list
        // const lowerChar = name[i].toLowerCase();
        const char = name[i].toLowerCase();
        if (!keyArr.includes(char) && char !== ' ') {
          // If not, add it as a new shortcuts
          newKey = char;
          keyArr.push(newKey);
          breakExecuted = true;
          break;
        }

      }

      // If no suitable letter has been found with traversing the entire string
      if (!breakExecuted) {
        // Assign a random letter
        newKey = getRandomLetterNotIn(keyArr);
        if (newKey) keyArr.push(newKey);  

      }

      // Update the hotkeys 
      const newHotkey = new Hotkey(hotkeyCategory, name, name, newKey);

    });

    // }
      
    // Update the DOM elements
    updateHotkeyDomElement(hotkeyCategory);

    // Update the subject and target datalist elements for autocompletion in ethogram table
    const subjectNameArr = Player.getIndividualNames();
    if (!Array.isArray(subjectNameArr)) return;
      
    // Update the subject datalist element
    const subjectDatalistEl = document.getElementById('subject-datalist');
    if (!subjectDatalistEl) return;
        
    // Reset the subject datalist before updating it
    while (subjectDatalistEl.firstChild) {
      subjectDatalistEl.removeChild(subjectDatalistEl.firstChild);
    }

    // Add up-to-date subject names to this datalist element
    if (subjectNameArr.length < 1) return;
    
    subjectNameArr.forEach(name => {
      const optionEl = document.createElement('option');
      optionEl.value = name;
      subjectDatalistEl.append(optionEl);
    });

    // Update the target datalist element
    const targetDatalistEl = document.getElementById('target-datalist');
    if (!targetDatalistEl) return;
    
    // Add "Box" to the target list
    const targetNameArr = subjectNameArr.concat('Box');
    
    // Reset the target datalist before updating it
    while (targetDatalistEl.firstChild) {
      targetDatalistEl.removeChild(targetDatalistEl.firstChild);
    }
      
    // Add up-to-date target names to this datalist element
    if (targetNameArr.length < 1) return;

    targetNameArr.forEach(name => {
      const optionEl = document.createElement('option');
      optionEl.value = name;
      targetDatalistEl.append(optionEl);
    });

    return individualNames;
    
  }

  /**
   * Indicates that the user is currently typing to temporarily disable the hotkeys to prevent clashes.
   */
  static userIsTyping() {
    Player.setTypingStatus(true);
  }

  /**
   * Indicates that the user is stopped typing to re-enable the hotkeys.
   */
  static userStoppedTyping() {
    Player.setTypingStatus(false);
  }

  /**
   * Sets the typing status of the Player. 
   * Should be set to true when one of the input elements has focus.
   * When none of the input elements has focus, it should be set to false.
   * @param {Boolean} isTyping True if user is typing, False otherwise
   */
  static setTypingStatus(isTyping) {
    Player.isTyping = isTyping;

    // Disable labeling immediately if user starts typing in an input element
    if (isTyping) Player.disableLabeling();
    
  }

  /**
   * Enables labeling mode
   * @param {Event | undefined} event If "clicked" event is given it will show a popover over the toggle button. Otherwise, it will show an alert toast.
   * @returns 
   */
  static enableLabeling(event) {
    // Only enable labeling if user is not typing
    if (Player.isTyping) return;

    // Only enable labeling if it has not been already activated
    if (Player.isInLabelingMode()) return;

    // Get the button for labeling mode
    const btnIconEl = event?.type === 'click' ? event.currentTarget : document.getElementById(Player.toggleLabelingBtnId);
    if (!btnIconEl) return;

    // Prevent enabling labeling mode if user is drawing a bounding box
    if (Player.isInDrawingMode()) {
      showPopover({
        domEl: btnIconEl,
        title: 'Labeling Disabled',
        content: 'Use keyboard shortcuts or click on bounding boxes to start labeling.', 
        placement: 'bottom',
        offset: [0, 20],
        type: 'warning'
      });
      return;
    }

    // Check if action types and individual names exists
    if (!Player.anyActions()) {
      showPopover({
        domEl: btnIconEl,
        title: 'Labeling Disabled',
        content: 'Please upload a files for action types first!', 
        placement: 'bottom',
        offset: [0, 20],
        type: 'warning'
      });
      Player.disableLabeling();
      return;
    } 
    
    if (!Player.getMainPlayer()) {
      showPopover({
        domEl: btnIconEl,
        title: 'Labeling Disabled',
        content: 'Please open a video as the main view first!', 
        placement: 'bottom',
        offset: [0, 20],
        type: 'warning'
      });
      Player.disableLabeling();
      return;
    }
    
    Player.labelingMode = true;

    // Change the labeling button status and update the icon
    btnIconEl.textContent = 'label';
    btnIconEl.classList.add(Player.activeBtnClass);

    showPopover({
      domEl: btnIconEl, 
      title: 'Labeling ON',
      content: 'Use keyboard shortcuts or click on bounding boxes to start labeling.', 
      placement: 'bottom',
      hideTimeout: 2500,
      offset: [0, 20],
      type: 'info'
    });
    return;


  }

  /**
   * Disables labeling mode
   * @param {Event | undefined} event If "clicked" event is given it will show a popover over the toggle button. Otherwise, it will show an alert toast.
   * @returns 
   */
  static disableLabeling(event) {

    // Only disable labeling if it has not been already deactivated
    if (!Player.isInLabelingMode()) return;
    
    Player.labelingMode = false;

    // Change the labeling button status
    const btnIconEl = document.getElementById(Player.toggleLabelingBtnId);
    if (!btnIconEl) return;

    // Update the button icon
    btnIconEl.textContent = 'label_off';
    btnIconEl.classList.remove(Player.activeBtnClass);

    showPopover({
      domEl: btnIconEl, 
      title: 'Labeling OFF',
      content: 'Keyboard shortcuts for labeling are disabled.', 
      placement: 'bottom',
      hideTimeout: 2500,
      offset: [0, 20],
      type: 'info'
    });
    return;


  }

  /**
   * Enabled/disables labeling mode
   * @param {Event | undefined} event "clicked" event. If undefined, it will show an alert toast instead of a popover over the labeling toggle button.
   * @returns 
   */
  static toggleLabelingMode(event) {
    const labelingModeBtn = document.getElementById(Player.toggleLabelingBtnId);
    if (!labelingModeBtn) return;

    if (Player.isInLabelingMode()) {
      Player.disableLabeling(event);
    } else {
      Player.enableLabeling(event);
    }

  }

  static setKeyState(pressedKey, state) {
    Player.keyState[pressedKey] = state;
  }

  static getCurrentObservation() {
    return Player.currentObservation;
  }

  static setCurrentObservation(currentObs) {
    // Expects a Map for current observation
    Player.currentObservation = currentObs;

  }

  static resetCurrentObservation() {
    Player.currentObservation = new Observation();
    Player.currentObservation.show();
  }


  /**
   * Seeks the main player to a given frame number
   * @param {String | Number} frameNumber
   * @returns 
   */
  static jumpToFrame(frameNumber) {
    const mainPlayer = Player.getMainPlayer();
    if (!mainPlayer) return;

    const parsedFrameNumber = parseInt(frameNumber);
    if (!Number.isFinite(parsedFrameNumber) || Number.isNaN(parsedFrameNumber)) return;

    const videoDuration = secondsToFrames(mainPlayer.getDuration());
    if (parsedFrameNumber <= videoDuration) {
      mainPlayer.setCurrentFrame(parsedFrameNumber);
    }
  }

  /**
   * Checks if any action name was imported
   * @returns {Boolean}
   */
  static anyActions() {
    const anyActions = Player.getActionNames() ? Player.getActionNames().length > 0 : false;
    return anyActions;
  }

  /**
   * Checks if any individual name was imported
   * @returns 
   */
  static anyIndividuals() {
    const anyIndividuals = Player.getIndividualNames() ? Player.getIndividualNames().length > 0 : false;
    return anyIndividuals;
  }

  /**
   * Handles click on the button for assigning class names to individuals
   * @param {e} Event Click event
   * @return {Promise}
   * @returns {Boolean | undefined} True if operation is successful, undefined otherwise
   */
  static async handleAssignClassNamesBtnClick(e) {
    showProcessIndicator();

    // Attempt to assign class names to indivs
    const nameArr = await Player.assignClassNamesToIndividuals();

    // Show error
    if (!Array.isArray(nameArr)) {
      showAlertToast('Please try again.', 'error', 'Failed to Assign Class Names to Individuals');
      hideProcessIndicator();
      return;
    }

    // Try to save the changes to tracking file
    const isSaved = await Player.getMainPlayer()?.getTrackingMap?.().saveEditsToFile?.();
    if (!isSaved) {
      showAlertToast('Please try again.', 'error', 'Failed to Save Tracking Changes to File');
      hideProcessIndicator();
      return;
    }
  
    // Show success
    showAlertToast(
      'Class names ' + nameArr.map(nameStr => `<span class="badge text-bg-dark">${nameStr}</span>`).join(', ') + ' assigned as individual names.', 
      'success', 
      'Updated Individual Names'
    );

    hideProcessIndicator();
    return true;


  }

  /**
   * Assigns class names to individuals.
   * @returns {Promise}
   * @returns {String[] | undefined} Newly assigned individual names or undefined in case of any errors.
   */
  static async assignClassNamesToIndividuals() {

    // Get the tracking map  
    const trackingMap = Player.getMainPlayer?.()?.getTrackingMap?.();
    if ( !(trackingMap instanceof TrackingMap) ) return;

    // Get the class names
    const classNameArr = trackingMap.getClassNames?.();
    if (!Array.isArray(classNameArr)) return;

    // Get the ID Map
    const idMap = trackingMap.getIdMap?.();
    if ( !(idMap instanceof Map) ) return;

    // Get the class IDs
    const classIdArr = Array.from(idMap.keys());
    if (!Array.isArray(classIdArr)) return;

    // Makes sure each class has a name
    const classCount = classIdArr.length;
    if (classNameArr.length !== classCount) return;

    const classMap = trackingMap.getClassMap?.();
    if ( !(classMap instanceof Map) ) return;

    // Get the master array
    const masterArr = trackingMap.getTracks?.();
    if (!Array.isArray(masterArr)) return;

    // Update the individual name order of each track by class ID
    // Iterate over class objects
    for (const classObj of Array.from(classMap.values())){

      const classId = classObj?.id ?? undefined;
      if (typeof classId === 'undefined') return;

      // Get the class name
      const className = classObj?.name ?? undefined;
      if (typeof className === 'undefined') return;

      // Find the index of the class name in the name array
      const nameIdx = classNameArr.indexOf(className);
      if (nameIdx < 0) return;

      // Get the indices of tracks belonging each class ID in the master array
      console.log(idMap)
      const indices = idMap.get?.(classId)?.values?.();
      if (typeof indices === 'undefined') return;
      const trackIdxArr = Array.from(indices).flat(Infinity); // Flatten the index array

      console.log('trackIdxArr', trackIdxArr);

      // Name of each track in the master array corresponding to this indices
      for (const trackIdx of trackIdxArr) {
        // console.log('trackIdx', trackIdx)
        const nameOrder = masterArr.at(trackIdx)?.setNameOrder?.(nameIdx);
        if (typeof nameOrder === 'undefined') return;
      }

    }

    // Set class names as individual names
    const individualNameArr = Player.setIndividualNames(classNameArr);
    if (!Array.isArray(individualNameArr)) return;

    // Save to config
    Config.individualNames = individualNameArr;

    const response = await Config.saveToFile();
    if (!response) {
      showAlertToast('Please try again.', 'error', 'Failed to Save Individual Names');
      return;
    }
    Player.refreshMainCanvas();
      
    return individualNameArr;
    

  }

  static savePressedKey(key) {
    Player.pressedKeys.push(key);
  }

  static clearPressedKeys() {
    Player.pressedKeys = [];
  }

  static getPressedKeys() {
    return Player.pressedKeys;
  }

  static getTimeoutKeyPress() {
    return Player.timeoutKeyPress;
  }

  static setTimeoutKeyPress(timeout) {
    Player.timeoutKeyPress = timeout;
  }

  static isInLabelingMode() {
    return Player.labelingMode;
  }

  static isInDrawingMode() {
    return Player.drawingMode;
  }

  static isInZoomingMode() {
    return Player.zoomingMode;
  }

  static getAllInstances() {
    return Player.allInstances;
  }

  static getSecondaryPlayers() {
    return Player.secondaryPlayers;
  }

  static getMainPlayer() {
    return Player.mainPlayer;
  }

  /**
   * Gets the TrackingMap instance linked to the main Player instance
   * @returns {TrackingMap | undefined}
   */
  static getMainTrackingMap() {
    return Player.getMainPlayer?.()?.getTrackingMap?.();
  }

  static getSkipSeconds() {
    return Player.skipSeconds;
  }

  static getMaxPlaybackRate() {
    return Player.maxPlaybackRate;
  }

  static getMinPlaybackRate() {
    return Player.minPlaybackRate;
  }

  static getIndividualNames() {
    return Player.individualNames;
  }

  /**
   * Gets the class in the current tracking file
   * @return {Map} Map of class IDs (key) and names, colors (value)
   */
  static getClassMap() {
    return Player.getMainPlayer?.()?.getTrackingMap?.()?.getClassMap?.();

  }

  /**
   * Gets the names of all class
   * @returns {String[] | undefined} Array of class names or undefined in case of an error.
   */
  static getClassNames() {
    return Player.getMainPlayer?.()?.getTrackingMap?.()?.getClassNames?.();

  }

  /**
   * Gets the hex color codes of all class
   * @returns {String[] | undefined} Array of class colors or undefined in case of an error.
   */
  static getClassColors() {
    return Player.getMainPlayer?.()?.getTrackingMap?.()?.getClassColors?.();

  }

  /**
   * Gets the name of a given class ID
   * @param {Number | String} classId ID of the class
   * @returns {String | undefined} Name of the class
   */
  static getClassName(classId) {
    return Player.getMainPlayer()?.getTrackingMap?.()?.getClassName?.(classId);

  }

  /**
   * Gets the color of a given class ID
   * @param {Number | String} classId ID of the class
   * @returns {String | undefined} Hex color code of the class or undefined in case of an error.
   */
  static getClassColor(classId) {
    return Player.getMainPlayer()?.getTrackingMap?.()?.getClassColor?.(classId);

  }

  /**
   * Gets the IDs of all classes
   * @returns {String[] | undefined} Array of class IDs
   */
  static getClassIds() {
    return Player.getMainPlayer?.()?.getTrackingMap?.()?.getClassIds?.();

  }

  // /**
  //  * Gets the running counts of all classes across snapshots
  //  * @returns {Number[]} Array of running counts
  //  */
  // static getClassRunningCounts() {
  //   return Player.getMainPlayer()?.getTrackingMap()?.getClassRunningCounts();

  // }

  /**
   * Checks if names are assigned to each class Id
   * @return {Boolean} Returns true if all class has a name, false otherwise
   */
  static hasClassNames() {
    const nameArr = Player.getClassNames();
    console.log('Class names:', nameArr)
    return (
      Array.isArray(nameArr) &&
      nameArr.length > 0 &&
      !nameArr.includes(null) &&
      !nameArr.includes(undefined)
    )
  }

  /**
   * Sets the name of a given class ID
   * @param {Number | String} classId ID of the class
   * @param {String} className Name of the class
   * @returns
   */
  static async setClassName(classId, className) {
    const mainPlayer = Player.getMainPlayer();
    if (!mainPlayer) return;
    
    const trackingMap = mainPlayer.getTrackingMap();
    if (!trackingMap) return;

    // Update names in tracking map
    const isSuccess = trackingMap.setClassName(classId, className);
    if (!isSuccess) return;

    const metadata = Player.getMetadata();
    if (!metadata) return;

    // Update names in metadata
    metadata.updateClassNames();

    // Save changes to config
    Config.classIds = Player.getClassIds();
    Config.classNames = Player.getClassNames();
    const response = await Config.saveToFile();

    return response;

  }


  /**
   * Sets the names of given class IDs
   * @param {Number[] | String[]} idArr ID array of the class
   * @param {String[]} nameArr Name array of the class
   * @returns
   */
  static async setClassNames(idArr, nameArr) {
    if (!Array.isArray(idArr) || !Array.isArray(nameArr)) return;

    if (idArr.length === 0 || nameArr.length === 0) return;

    // Check if the ID and name arrays have the same length
    if (idArr.length !== nameArr.length) return;
    
    const mainPlayer = Player.getMainPlayer();
    if (!mainPlayer) return;
    
    const trackingMap = mainPlayer.getTrackingMap();
    if (!trackingMap) return;

    for (let idx = 0; idx < idArr.length; idx++ ) {
      trackingMap.setClassName(idArr[idx], nameArr[idx]);
    }

    // Save changes to config
    Config.classIds = Player.getClassIds();
    Config.classNames = Player.getClassNames();
    const response = await Config.saveToFile();

    return response;

  }


  /**
   * Updates the class attributes in TrackingMap with saved values
   * @returns {Boolean | undefined} True if the operation was successful, undefined otherwise
   */
  // static updateClassMap() {
  //   const idArr = Player.getClassIds();
  //   const nameArr = Player.getClassNames();
  //   const colorArr = Player.getClassColors();
  //   const countArr = Player.getClassRunningCounts();

  //   const result = Player.setClassMap({
  //     ids: idArr,
  //     names: nameArr,
  //     colors: colorArr,
  //     runningCounts: countArr
  //   });

  //   return result;

  // }

  /**
   * Updates the class attributes in TrackingMap with given inputs.
   * @param {Object | undefined} obj
   * @param {String[]} obj.ids Array for class IDs
   * @param {String[] | undefined} obj.names Array for class names
   * @param {String[] | undefined} obj.colors Array for class colors
   * @param {Number[] | String[] | undefined} obj.runningCounts Array for running count of class occurrences across snapshots (optional)
   * @returns {Map | undefined} Updated class Map if the operation was successful, undefined otherwise
   */
  static setClassMap(obj = {}) {

    // If no input is given, return
    if ( !(obj instanceof Object) ) return;

    // Check if TrackingMap exists 
    const trackingMap = Player.getMainPlayer?.()?.getTrackingMap?.();
    if ( !(trackingMap instanceof TrackingMap) ) return;
    
    // Destructure the input object
    const { ids = [], names = [], colors = [], runningCounts = {} } = obj;
    
    // Validate the input arrays by comparing their lengths wth the class count
    const classCount = trackingMap.getClassCount();
    let validIds, validNames, validColors;
    [ validIds, validNames, validColors ] = [ ids, names, colors ].map(arr => Array.isArray(arr) && arr.length === classCount );

    // Class ID array must be given and its length must be equal to class count
    if (!validIds) return;

    // Add valid classes to tracking map
    for (let idx = 0; idx < ids.length; idx++) {
      const classId = ids.at(idx);
      const isAdded = trackingMap.addToClassMap({
        id: classId,
        name: validNames ? names[idx] : null,
        color: validColors ? colors[idx] : null,
        runningCount: Object.hasOwn(runningCounts, classId) ? runningCounts[classId] : -1 // If running count is not given for this class, set it to -1 to start counting from 0
      });
      if (!isAdded) return;
    }

    // Update metadata object
    Player.getMetadata?.()?.updateClassAttributes();

    // Update the config
    Config.classAttributes = obj;

    // Update relevant DOM elements
    updateClassEls();
    
    return trackingMap?.getClassMap?.();


  }


  /**
   * Sets the color of a given class ID
   * @param {Number | String} classId ID of the class
   * @param {String} classColor Color of the class - in hexadecimal
   * @returns {Promise | undefined} Promise from the function for writing changes to the config file
   */
  static async setClassColor(classId, classColor) {
    const mainPlayer = Player.getMainPlayer();
    if (!mainPlayer) return;
    
    const trackingMap = mainPlayer.getTrackingMap();
    if (!trackingMap) return;

    // Update colors in tracking map
    trackingMap.setClassColor(classId, classColor);

    const metadata = Player.getMetadata();
    if (!metadata) return;

    // Update colors in metadata
    metadata.updateClassColors();

    // Save changes to config
    Config.classIds = Player.getClassIds();
    Config.classNames = Player.getClassNames();
    const response = await Config.saveToFile();

    return response;
  }

  static getKeyState() {
    return Player.keyState;
  }

  static getMainCanvas() {
    const mainPlayer = Player.getMainPlayer();
    if (!mainPlayer) return;
    return mainPlayer.getCanvas();
  }

  static updateZoomedCanvas() {
    const mainPlayer = Player.getMainPlayer();
    if (!mainPlayer) return;
    
    // Adjust dimensions of DOM elements for zoomed region before drawing frames into canvas
    const zoomRect = mainPlayer.zoomRect;
    if (!zoomRect) return;
    
    if (zoomRect.shouldHideEl) return;

    const zoomVideoDiv = document.getElementById('zoom-video-div');
    if (!zoomVideoDiv) return;

    const zoomVideoCanvas = zoomVideoDiv.querySelector('#zoom-video-canvas');
    if (!zoomVideoCanvas) return;

    const mainVideoDiv = document.getElementById('main-video-div');
    if (!mainVideoDiv) return;

    // Get the zoom scale in percentages and convert into decimal
    const zoomScale = Player.getZoomScale();
    if (!zoomScale) return;

    const zoomSelectCanvas = document.getElementById('main-zoom-select-canvas');
    if (!zoomSelectCanvas) return;

    const ctx = zoomSelectCanvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = Player.zoomDragColor;
    ctx.lineWidth = 5;
    ctx.clearRect(0, 0, zoomSelectCanvas.width, zoomSelectCanvas.height);

    ctx.strokeRect(zoomRect.startX, zoomRect.startY, zoomRect.width, zoomRect.height);

    // Put a descriptive title
    ctx.beginPath();
    ctx.font = '20px tahoma';
    const canvasText = 'Zoom'
    const labelWidth = ctx.measureText(canvasText).width + 15;
    const labelHeight = 30;
    const padding = 5;
    
    // let labelX = zoomRect.startX;
    // let labelY = zoomRect.startY - labelHeight;

    // Label coordinates - placed on top left corner of the rectangle
    // width < 0 => drawn from right to left
    // height < 0 => drawn from bottom to top
    const labelX = zoomRect.startX + (zoomRect.width < 0 ? zoomRect.width : 0);
    const labelY = zoomRect.startY + (zoomRect.height < 0 ? zoomRect.height : 0) - labelHeight; 

    // if (zoomRect.tempWidth < 0) {
    //   labelX = labelX - labelWidth;
    // }

    // TODO: Handle edge cases (when tracking boxes are on the edges of the canvas)

    ctx.rect(labelX, labelY, labelWidth, labelHeight);
    ctx.fillStyle = 'white'
    ctx.fill();
    ctx.fillStyle = 'black';
    // ctx.textAlign = 'left';
    // ctx.textBaseline = 'middle';
    ctx.fillText(canvasText, labelX+padding, labelY+labelHeight-padding)
    ctx.stroke();

    // Calculate visible and actual video dimensions
    const visibleVideoHeight = mainVideoDiv.getBoundingClientRect().height;
    const actualVideoHeight = mainPlayer.el.videoHeight;

    // Calculate the visible dimensions of the zoomed region
    // These dimensions are relative to the viewport depending on the user device. They are not to the actual video dimensions
    const visibleZoomedHeight = (zoomRect.height / actualVideoHeight) * visibleVideoHeight * zoomScale;
    const visibleZoomedWidth = visibleZoomedHeight * zoomRect.aspectRatio;

    // Adjust the canvas dimensions in the new window to display the zoomed region
    zoomRect.canvasWidth = zoomRect.width * zoomScale;
    zoomRect.canvasHeight = zoomRect.height * zoomScale;
    zoomVideoCanvas.width = zoomRect.canvasWidth;
    zoomVideoCanvas.height = zoomRect.canvasHeight;

    // Draw video frames 
    const zoomVideoCtx = zoomVideoCanvas.getContext('2d');
    zoomVideoCtx.drawImage(mainPlayer.el, zoomRect.startX, zoomRect.startY, zoomRect.width, zoomRect.height, 0, 0, zoomVideoCanvas.width, zoomVideoCanvas.height);

    // Draw tracking boxes
    const zoomTrackingCanvas = zoomVideoDiv.querySelector('#zoom-tracking-canvas');
    if (zoomTrackingCanvas) {
      const zoomTrackingCtx = zoomTrackingCanvas.getContext('2d');
      const mainTrackingCanvas = mainPlayer.canvas;
      zoomTrackingCtx.drawImage(mainTrackingCanvas, zoomRect.startX, zoomRect.startY, zoomRect.width, zoomRect.height, 0, 0, zoomVideoCanvas.width, zoomVideoCanvas.height);

    }

    // Adjust the padding
    const paddingWidth = 5;
    zoomVideoDiv.style.paddingLeft = paddingWidth + 'px';
    zoomVideoDiv.style.paddingRight = paddingWidth + 'px';
    
    // Adjust the outer div dimension for zoom
    zoomVideoDiv.style.width =  visibleZoomedWidth + 2 * paddingWidth + 'px';

    const zoomTitleDiv = zoomVideoDiv.querySelector('.zoom-title');
    if (zoomTitleDiv) {
      // Assign decimal points for displaying coordinates
      const decimals = 2;
      
      // Create info text for coordinates of the selected zoom region
      const titleArr = [
        `x:${zoomRect.startX.toFixed(decimals)}`, 
        `y:${zoomRect.startY.toFixed(decimals)}`, 
        `w:${zoomRect.width.toFixed(decimals)}`, 
        `h:${zoomRect.height.toFixed(decimals)}`
      ];

      const titleHtmlArr = [];
      
      // Create badges for each info text
      titleArr.forEach(text => {
        titleHtmlArr.push(`<span class="badge text-bg-dark fw-light x-small me-1">${text}</span>`);
      });
      zoomTitleDiv.innerHTML = titleHtmlArr.join('');

      // Show the zoom scale info
      const zoomScaleDropdown = zoomVideoDiv.querySelector('#zoom-scale-dropdown');
      if (zoomScaleDropdown) {
        const btnEl = zoomScaleDropdown.querySelector('.dropdown-toggle');
        if (btnEl) btnEl.textContent = zoomScale + 'x';
      }

    }

    // Check the zoom title div width
    const zoomBtnPanelEl = zoomVideoDiv.querySelector('#zoom-btn-panel');
    if (zoomBtnPanelEl) {
      if (visibleZoomedWidth < 500) {
        zoomTitleDiv.classList.add('d-none');
      } else {
        zoomTitleDiv.classList.remove('d-none');
      }
      zoomBtnPanelEl.style.marginTop = paddingWidth + 'px';

    } 

    zoomVideoCanvas.style.paddingBottom = paddingWidth + 'px';

    // Zoom into selected region
    zoomRect.shouldHideEl = false;
    zoomVideoDiv.classList.remove('d-none');


  }


  static drawZoomedVideoRegion() {
    const mainPlayer = Player.getMainPlayer();
    if (!mainPlayer) return;

    const zoomRect = mainPlayer.zoomRect;
    if (!zoomRect) return;
    
    const zoomVideoDiv = document.getElementById('zoom-video-div');
    if (!zoomVideoDiv) return;
    
    // Hide the div element if the zoom is disabled
    if (zoomRect.shouldHideEl || !Player.isInZoomingMode()) {
      zoomVideoDiv.classList.add('d-none');
      return;
    }
      
    const zoomVideoCanvas = zoomVideoDiv.querySelector('#zoom-video-canvas');
    if (!zoomVideoCanvas) return;

    const zoomVideoCtx = zoomVideoCanvas.getContext('2d');

    // Update the request ID
    Player.zoomRequestId = window.requestAnimationFrame(Player.drawZoomedVideoRegion);

    // Draw video frames 
    zoomVideoCtx.drawImage(mainPlayer.el, zoomRect.startX, zoomRect.startY, zoomRect.width, zoomRect.height, 0, 0, zoomVideoCanvas.width, zoomVideoCanvas.height);

    // Display the div element
    zoomVideoDiv.classList.remove('d-none');

  }

  /**
   * Saves secondary video file paths to the config file
   */
  static async saveSecondaryVideosToConfig() {
    // Update secondary video file paths in the config file
    const confirmedSrcArr = Player.getSecondaryPlayers().map(player => player.getSource());

    // Update the config
    Config.secondaryVideoPaths = confirmedSrcArr;
    const response = await Config.saveToFile();

    return response;

  }

  /**
   * Enables drawing mode on main canvas for creating new tracking boxes
   * @param {Event} event "clicked" event
   */
  static enableDrawing(event) {

    if (Player.isInDrawingMode()) return;

    // Disable labeling to prevent hotkey conflicts
    Player.disableLabeling();

    Player.drawingMode = true;
    const iconText = 'edit';

    const mainCanvas = document.getElementById('main-tracking-canvas');
    if (!mainCanvas) return;

    // Remove registered event listener for zooming
    mainCanvas.removeEventListener('mousemove', Player.mousemoveZoomHandler);
    mainCanvas.removeEventListener('mouseup', Player.mouseupZoomHandler);

    // Add event listeners for drawing tracking boxes
    mainCanvas.addEventListener('mousemove', Player.mousemoveDrawingHandler);
    mainCanvas.addEventListener('mouseup', Player.mouseupDrawingHandler);

    // Change the labeling button status
    const btnIconEl = document.getElementById('toggle-drawing-mode-btn');
    if (!btnIconEl) return;

    btnIconEl.textContent = iconText;
    btnIconEl.classList.add(Player.activeBtnClass);

    // Refresh canvas to indicate resizable bounding boxes
    Player.refreshMainCanvas();

    // Show popover
    showPopover({
      domEl: btnIconEl, 
      title: 'Drawing ON',
      content: 'You can now draw or resize tracking boxes.', 
      placement: 'bottom',
      hideTimeout: 3000,
      offset: [0, 20],
      type: 'info'
    });
    
  }

  /** 
   * Disables drawing mode on main canvas for creating new tracking boxes
   * @param {Event} event "clicked" event
   */
  static disableDrawing(event) {

    if (!Player.isInDrawingMode()) return;

    Player.drawingMode = false;
    const iconText = 'edit_off';

    const mainCanvas = document.getElementById('main-tracking-canvas');
    if (!mainCanvas) return;

    // Remove registered event listener for drawing tracking bounding boxes
    mainCanvas.removeEventListener('mousemove', Player.mousemoveDrawingHandler);
    mainCanvas.removeEventListener('mouseup', Player.mouseupDrawingHandler);

    // Add event listeners for zooming
    mainCanvas.addEventListener('mousemove', Player.mousemoveZoomHandler);
    mainCanvas.addEventListener('mouseup', Player.mouseupZoomHandler);

    // Change the labeling button status
    const drawingModeBtn = document.getElementById('toggle-drawing-mode-btn');
    if (drawingModeBtn) {
      drawingModeBtn.textContent = iconText;
      drawingModeBtn.classList.remove(Player.activeBtnClass);
    }

    // Refresh canvas to remove indication for resizable bounding boxes
    Player.refreshMainCanvas();

    // Show popover
    showPopover({
      domEl: drawingModeBtn, 
      title: 'Drawing OFF', 
      content: 'Tracking box drawing or resizing is disabled.',
      placement: 'bottom',
      hideTimeout: 3000,
      offset: [0, 20],
      type: 'info'
    });
  }

  /**
   * Toggles drawing mode for creating new tracking boxes on the main canvas.
   * @param {Event} e
   */
  static toggleDrawingMode(e) {
    if (Player.isInDrawingMode()) {
      Player.disableDrawing(e);
    } else {
      Player.enableDrawing(e);
    }
  }

  static enableZooming(event) {
    // Only enable zooming if it has not been already activated
    if (Player.isInZoomingMode()) return;

    const mainPlayer = Player.getMainPlayer();
    if ( !(mainPlayer instanceof Player)) {
      showAlertToast('Please open a video as the main view!', 'warning', 'Zooming Disabled');
      Player.disableZooming();
      return;
    }

    Player.zoomingMode = true;

    // Get the labeling mode button on the top panel
    const btnEl = document.getElementById('toggle-zooming-mode-btn');
    if (!btnEl) return;
    
    // Update the button icon
    btnEl.textContent = 'select_all';
    btnEl.classList.add(Player.activeBtnClass);

    showPopover({
      domEl: btnEl, 
      title: 'Zooming ON',
      content: 'Draw an area on the main view to zoom.', 
      placement: 'bottom',
      hideTimeout: 2500,
      offset: [0, 20],
      type: 'info'
    });
    return;

  }

  static disableZooming(event) {
    // Only disable zooming if it has not been already deactivated
    if (!Player.isInZoomingMode()) return;

    const mainPlayer = Player.getMainPlayer();
    if ( !(mainPlayer instanceof Player)) {
      showAlertToast('Please open a video as the main view!', 'warning', 'Zooming Disabled');
      Player.disableZooming();
      return;
    }

    Player.zoomingMode = false;
    
    // Get the labeling mode button on the top panel
    const btnIconEl = document.getElementById('toggle-zooming-mode-btn');
    if (!btnIconEl) return;
   
    // Update the button icon
    btnIconEl.textContent = 'deselect';
    btnIconEl.classList.remove(Player.activeBtnClass);


    showPopover({
      domEl: btnIconEl, 
      title: 'Zooming OFF',
      content: 'Zooming into main view disabled.', 
      placement: 'bottom',
      hideTimeout: 2500,
      offset: [0, 20],
      type: 'info'
    });
    return;


  }

  /**
   * Toggles zooming mode.
   * @param {Event} e 
   */
  static toggleZoomingMode(e) {
    if (Player.isInZoomingMode()) {
      Player.disableZooming(e);
    } else {
      Player.enableZooming(e);
    }
  }

  static enableTracking(event) {

    // Get the toggle button element
    const btnIconEl = document.getElementById(Player.toggleTrackingBtnId);
    if (!btnIconEl) return;   

    Player.visibleTracks = true;

    // Main canvas for tracks
    const mainCanvas = document.getElementById('main-tracking-canvas');
    if (!mainCanvas) return;
    
    // Make main canvas visible
    mainCanvas.classList.remove('d-none');

    // Change the button icon and color
    btnIconEl.textContent = 'frame_person';
    btnIconEl.classList.add(Player.activeBtnClass);

    // Show popover
    showPopover({
      domEl: btnIconEl, 
      title: 'Tracking ON',
      content: 'Bounding boxes are now visible.', 
      placement: 'bottom',
      hideTimeout: 1500,
      offset: [0, 20],
      type: 'info'
    });

  }

  static disableTracking(event) {

    Player.visibleTracks = false;

    // Main canvas for tracks
    const mainCanvas = document.getElementById('main-tracking-canvas');
    if (!mainCanvas) return;
    
    // Make main canvas visible
    mainCanvas.classList.add('d-none');

    // Get the toggle button element
    const btnIconEl = document.getElementById(Player.toggleTrackingBtnId);
    if (!btnIconEl) return;

    // Change the button icon and color
    btnIconEl.textContent = 'frame_person_off';
    btnIconEl.classList.remove(Player.activeBtnClass);

     // Show popover
    showPopover({
      domEl: btnIconEl, 
      title: 'Tracking OFF',
      content: 'Bounding boxes are now hidden.', 
      placement: 'bottom',
      hideTimeout: 1500,
      offset: [0, 20],
      type: 'info'
    });


  }



  /**
   * Toggle displaying tracks/bounding boxes
   * @param {Event} e 
   */
  static toggleTracking(e) {
    const mainPlayer = Player.getMainPlayer();
    // Check if the main player exists
    if ( !(mainPlayer instanceof Player) ) {
      showAlertToast('Open the main video first!', 'warning', 'Tracking Unavailable');
      return;
    } 
    
    // if (mainPlayer.getTrackingMap?.()?.isEmpty?.()) {
    //   // If no tracking file is uploaded, show a warning
    //   showAlertToast('No tracks were found!', 'warning', 'Tracking Mode Disabled');
    //   return;
    // }

    if (Player.visibleTracks) {
      Player.disableTracking(e);
    } else {
      Player.enableTracking(e);
    }

  }

  /**
   * Detects mousedown event on the main canvas to start selecting 
   * Saves the status if mousedown to a variable in Player 
   * @param {Event} e mousedown Event
   */
  static mousedownOnCanvasHandler (e) {

    const mainPlayer = Player.getMainPlayer();
    if (!mainPlayer) return;

    const zoomRect = mainPlayer.zoomRect;
    if (!zoomRect) return;

    const zoomSelectCanvas = document.getElementById('main-zoom-select-canvas');
    if (!zoomSelectCanvas) return;

    const canvasRect = zoomSelectCanvas.getBoundingClientRect();
    if (!canvasRect) return;

    const widthRatio = zoomSelectCanvas.width / zoomSelectCanvas.clientWidth;
    const heightRatio =  zoomSelectCanvas.height / zoomSelectCanvas.clientHeight;
    const mouseX = (e.clientX - canvasRect.left) * widthRatio;
    const mouseY = (e.clientY - canvasRect.top) * heightRatio;
    
    zoomRect.tempX = mouseX;
    zoomRect.tempY = mouseY;

    Player.setMouseDown();

    if (!Player.isInDrawingMode()) {
      return;
    }

    const drawingRect = mainPlayer.drawingRect;
    if (!drawingRect) return;

    drawingRect.tempX = mouseX;
    drawingRect.tempY = mouseY;

    // Get the tracks in the current frame
    const boxesInFrame = mainPlayer.getTrackingBoxesInFrame();
      
    // Check if mouse in one of the resizing handles of tracking boxes
    const response = Player.isMouseInResizeHandle(boxesInFrame, mouseX, mouseY);
    const clickedBBox = response?.box;
    const handleName = response?.handleName;
    const handleClicked =  handleName &&  (clickedBBox instanceof BoundingBox);
    
    // If one of the resize handles is clicked
    if (handleClicked) {

      // If there is no previously resized bBox
      if (!DrawnBoundingBox.isInterpolating() && !BoundingBox.isResizing()) {
        
        // Create a DrawnBBox instance for resized box and assign it to the BoundingBox class
        const resizedBBox = BoundingBox.setResizedBBox();
        if ( !(resizedBBox instanceof DrawnBoundingBox) ) {
          showAlertToast('Resizing failed! Please try again.', 'error');
          return;
        }
  
        // Create and save the first BBox on the frame temporarily
        const firstResp = resizedBBox.addFirstBBox(clickedBBox);
        if (!firstResp) {
          showAlertToast('Resizing failed! Please try again.', 'error');
          return;
        }

        // Set the resizing dimensions and coordinates
        const dimResp = BoundingBox.setResizeDims({
          startX: clickedBBox.x,
          startY: clickedBBox.y,
          width: clickedBBox.width,
          height: clickedBBox.height
        });
        if (!dimResp) {
          showAlertToast('Resizing failed! Please try again.', 'error');
          return;
        }
      
        // Set the resize handle
        const handleResp = BoundingBox.setResizeHandle(handleName);
        if (!handleResp) {
          showAlertToast('Resizing failed! Please try again.', 'error');
          return;
        }
  
        // Flag the start of resizing
        BoundingBox.enableResizing();
        return;
  
      }

      // If resizing of a BBox is not confirmed or canceled yet
      if (!DrawnBoundingBox.isInterpolating() && BoundingBox.isResizing()) {
          
        // Get the previously resized instance
        const resizedBBox = BoundingBox.getResizedBBox();
        if ( !(resizedBBox instanceof DrawnBoundingBox) ) {
          showAlertToast('Resizing failed! Please try again.', 'error');
          return;
        }

        // Get the first resized bBox
        const firstBBox = resizedBBox.getFirstBBox();
        if ( !(firstBBox instanceof BoundingBox) ) {
          showAlertToast('Resizing failed! Please try again.', 'error');
          return;
        }
  
        // Check if the clicked bBox matches to the previously resized bBox
        const validTarget = (firstBBox.getClassId() === clickedBBox.getClassId()) && (firstBBox.getTrackId() === clickedBBox.getTrackId());
        if (!validTarget) {
          console.log('resizedBBox', firstBBox);
          showPopover({
            onCanvas: true,
            x: firstBBox.getX(),
            y: firstBBox.getY(),
            title: 'Unfinished Resizing',
            content: 'Before resizing another bounding box, first confirm or cancel resizing of this bounding box.',
            placement: 'right',
            type: 'warning'
          });
          BoundingBox.disableMousemove()
          return;
  
        }

        BoundingBox.enableMousemove();
  
        // Set the resizing dimensions and coordinates
        const dimResp = BoundingBox.setResizeDims({
          startX: clickedBBox.x,
          startY: clickedBBox.y,
          width: clickedBBox.width,
          height: clickedBBox.height
        });
        if (!dimResp) {
          showAlertToast('Resizing failed! Please try again.', 'error');
          return;
        }
      
        // Set the resize handle
        const handleResp = BoundingBox.setResizeHandle(handleName);
        if (!handleResp) {
          showAlertToast('Resizing failed! Please try again.', 'error');
          return;
        }
  
        return;
  
  
      }

      // If user enabled interpolation for a previously resized bounding box
      if (DrawnBoundingBox.isInterpolating() && DrawnBoundingBox.isResizing()) {
        // Prevent resizing with mousemove by default before searching for matching tracks
        // BoundingBox.disableMousemove();
        
        // Get the previously resized bounding box
        const resizedBBox = BoundingBox.getResizedBBox();
        if ( !(resizedBBox instanceof DrawnBoundingBox) ) {
          showAlertToast('Resizing failed! Please try again.', 'error');
          return;
        }
  
        // Get the first resized bBox
        const firstBBox = resizedBBox.getFirstBBox();
        if ( !(firstBBox instanceof BoundingBox) ) {
          showAlertToast('Resizing failed! Please try again.', 'error');
          return;
        }
  
        // Get the selected bBox properties
        const classId = firstBBox.getClassId();
        const trackId = firstBBox.getTrackId();
        const classText = Player.getClassName(classId) ?? `${classId}`;
  
        // Search for class and track IDs of the first resized BBox among the current frame tracks 
        if (!Array.isArray(boxesInFrame) || boxesInFrame.length <= 0) {
          showAlertToast('Resizing failed! Please try again.', 'error');
          return;
        }
        const isTargetInFrame = boxesInFrame.some(bBox => bBox?.classId === classId && bBox?.trackId === trackId);
  
        // If the target track is NOT in the frame, show a warning
        if (!isTargetInFrame) {
          console.log('target is not in frame');
          showPopover({
            domEl: document.getElementById(DrawnBoundingBox.interpolationElOnMainBarId),
            title: 'No matching target',
            content: `Go to another frame with track <span class="badge text-bg-dark">${classText}-${trackId}</span> to resize or cancel interpolation here.`,
            placement: 'bottom',
            type: 'info',
            hideTimeout: 2000
          });
          return;
            
        }

        // Only allow resizing of a box with the same track ID
        const isTargetClicked = clickedBBox?.getClassId?.() === classId && clickedBBox?.getTrackId?.() === trackId;
  
        // If clicked box is not the target box, show a warning
        if (!isTargetClicked) {
          // Show popover 
          console.log('firstBBox', firstBBox)
          showPopover({
            onCanvas: true,
            x: firstBBox.getX?.() + firstBBox.getWidth?.() / 2,
            y: firstBBox.getY?.(),
            title: 'Target Bounding Box',
            content: `You can only resize this bounding box for interpolation.`,
            placement: 'top',
            type: 'info',
            hideTimeout: 2000
          });
          return;
  
        }

        // Re-enable resizing
        BoundingBox.enableMousemove();
  
        // Create and save the first BBox on the frame temporarily
        const firstResp = resizedBBox.addLastBBox(clickedBBox);
        if (!firstResp) {
          showAlertToast('Resizing failed! Please try again.', 'error');
          return;
        }
  
        // Save the copy of the original BBox in case user decides to cancel resizing
        const initResp = resizedBBox.addInitLastBBox(clickedBBox);
        if (!initResp) {
          showAlertToast('Resizing failed! Please try again.', 'error');
          return;
        }
  
  
      }

      

    }    


    
  }

  /**
   * Triggered on mousemove event on the main canvas to draw a rectangle for zooming into the main video
   * @param {Event} e mousemove event
   * @returns 
   */
  static mousemoveZoomHandler (e) {

    // If zooming disabled, stop executing
    if (!Player.isInZoomingMode()) return;

    // Check if the event triggered directly over the canvas to exclude events triggered by other elements when they are over the canvas
    const mainCanvas = document.getElementById('main-tracking-canvas');
    if (!mainCanvas) return;

    if (!e.composedPath().includes(mainCanvas)) {
      console.log('mousemove NOT over main canvas');
      return;
    }

    const mainPlayer = Player.getMainPlayer();
    if (!mainPlayer) return;

    const zoomRect = mainPlayer.zoomRect;
    if (!zoomRect) return;

    const zoomVideoDiv = document.getElementById('zoom-video-div');
    if (!zoomVideoDiv) return;

    const zoomSelectCanvas = document.getElementById('main-zoom-select-canvas');
    if (!zoomSelectCanvas) return;

    // Check if mouse is moving while mouse button is down
    if (e.buttons !== 1 || !Player.isMouseDown()) return;

    if (!Player.getZoomScale()) return;

    // Calculate clicked position relative to canvas  
    const canvasRect = zoomSelectCanvas.getBoundingClientRect();
    const widthRatio = zoomSelectCanvas.width / zoomSelectCanvas.clientWidth;
    const heightRatio =  zoomSelectCanvas.height / zoomSelectCanvas.clientHeight;
    const mouseX = (e.clientX - canvasRect.left) * widthRatio;
    const mouseY = (e.clientY - canvasRect.top) * heightRatio;

    const rectWidth = mouseX - zoomRect.tempX;
    const rectHeight = mouseY - zoomRect.tempY;

    // Update the dragged distance to ignore accidental clicks
    const draggedDist = Math.min(Math.abs(rectWidth), Math.abs(rectHeight)); 

    const ctx = zoomSelectCanvas.getContext('2d');
    if (!ctx) return;

    // Only draw zoom rectangle if user moves the mouse more than the threshold to avoid registering accidental clicks
    if (draggedDist > Player.minDragDist) {
      // Do not alter the zoom canvas when mouse is still moving
      zoomRect.shouldUpdate = false;
          
      // Change the cursor to indicate that user can start drawing 
      mainCanvas.style.cursor = 'crosshair';
      
      const zoomScale = Player.getZoomScale();
      const actualVideoWidth = mainPlayer.el.videoWidth;
      const actualVideoHeight = mainPlayer.el.videoHeight;
      
      // Stop drawing rectangle if the rectangle would be too large for the selected zoom scale
      // Save the zoom rectangle dimensions
      if (Math.abs(rectWidth) * zoomScale <= actualVideoWidth) {
        zoomRect.tempWidth = rectWidth;
      } 
        
      if (Math.abs(rectHeight) * zoomScale <= actualVideoHeight) {
        zoomRect.tempHeight = rectHeight;
      
      }
  
      // Clear the canvas
      ctx.clearRect(0, 0, zoomSelectCanvas.width, zoomSelectCanvas.height);
      
      // Draw the rectangle
      ctx.strokeStyle = Player.zoomDragColor;
      ctx.lineWidth = '5';              
      ctx.strokeRect(zoomRect.tempX, zoomRect.tempY, zoomRect.tempWidth, zoomRect.tempHeight);
      
      zoomRect.shouldUpdate = true;
      zoomRect.shouldHideEl = false;

    }

  }

  /**
   * Triggered on mouseup event on the main canvas to draw a rectangle for zooming into the main video
   * @param {Event} e mouseup event
   */
  static mouseupZoomHandler(e) {

    // Change the cursor back to default (it was changed to 'crosshair' before to indicate that user can start drawing 
    e.target.style.cursor = 'default';

    // Reset the mousedown flag
    Player.resetMouseDown();

    const mainPlayer = Player.getMainPlayer();
    if (!mainPlayer) return;
    
    const zoomRect = mainPlayer.zoomRect;
    if (!zoomRect) return;
   
    if (zoomRect.shouldUpdate && Player.isInZoomingMode()) {

      // Flag to disable accidental clicking over existing bounding boxes
      // Player.interactiveBoxesDisabled = true;
      // setTimeout(() => {
      //   Player.interactiveBoxesDisabled = false;
      // }, 500)

      
      // Update the rectangle dimensions
      // Adjust the aspect ratio for the final rectangle for selection
      const scaledWidth = Math.sign(zoomRect.tempWidth) * Math.round(zoomRect.aspectRatio*Math.abs(zoomRect.tempHeight));
      zoomRect.width = scaledWidth;
      zoomRect.height = zoomRect.tempHeight;
      zoomRect.startX = zoomRect.tempX;
      zoomRect.startY = zoomRect.tempY;

      Player.updateZoomedCanvas();

    }

    // Reset temp coordinates
    zoomRect.tempX = null;
    zoomRect.tempY = null;
    zoomRect.tempWidth = null;
    zoomRect.tempWidth = null
    zoomRect.shouldUpdate = false;

  };

  /**
   * Triggered on mousemove event on the main canvas for drawing a tracking bounding box 
   * @param {*} e mousemove event
   */
  static mousemoveDrawingHandler(e) {
    // Check if mousemove handler is disabled
    if (BoundingBox.isMousemoveDisabled()) return;

    // Check if the event triggered directly over the canvas to exclude events triggered by other elements when they are over the canvas
    const mainCanvas = document.getElementById('main-tracking-canvas');
    if (!mainCanvas) return;

    if (!e.composedPath().includes(mainCanvas)) {
      console.log('mousemove NOT over main canvas');
      return;
    }

    const mainPlayer = Player.getMainPlayer();
    if (!mainPlayer) return;
    
    const drawingRect = mainPlayer.drawingRect;
    if (!drawingRect) return;

    const drawingCanvas = document.getElementById(Player.drawingCanvasId);
    if (!drawingCanvas) return;

    // Check if mouse is moving while mouse button is down
    console.log('ismousedown', Player.isMouseDown())
    if (e.buttons !== 1 || !Player.isMouseDown()) return;

    // Calculate clicked position relative to canvas  
    const canvasRect = drawingCanvas.getBoundingClientRect();
    const widthRatio = drawingCanvas.width / drawingCanvas.clientWidth;
    const heightRatio =  drawingCanvas.height / drawingCanvas.clientHeight;
    const mouseX = (e.clientX - canvasRect.left) * widthRatio;
    const mouseY = (e.clientY - canvasRect.top) * heightRatio;

    const ctx = drawingCanvas.getContext('2d');
    if (!ctx) return;

    // If user is resizing by clicking on one of the resizing handles
    if (DrawnBoundingBox.isResizing()) {

      // Get the resizing dimensions
      const startX = BoundingBox.resizeStartX;
      const startY = BoundingBox.resizeStartY;
      const startWidth = BoundingBox.resizeStartWidth;
      const startHeight = BoundingBox.resizeStartHeight;
      const dx = mouseX - startX;
      const dy = mouseY - startY;

      const draggedDist = Math.min(Math.abs(dx), Math.abs(dy)); 
      if (draggedDist < 2) return;
    
      // Get the resized bounding box
      const resizedBBox = BoundingBox.getResizedBBox();
      if (!resizedBBox) return;

      // If interpolation is enabled, set the last bBox by cloning the first bBox
      const targetBBox = DrawnBoundingBox.isInterpolating() ? resizedBBox.getLastBBox() : resizedBBox.getFirstBBox();
      if (!targetBBox) return;
      
      // Redraw the resized box on canvas
      const mainCtx = mainCanvas.getContext('2d');
      if (!mainCtx) return;
      
      // Get the video element dimensions
      // const actualVideoWidth = mainPlayer.el.videoWidth;
      // const actualVideoHeight = mainPlayer.el.videoHeight;
      
      // Get the resize handle
      const handleName = BoundingBox.getResizeHandle();

      // Save the initial dimensions of bBox in case the user cancels resizing

      // Update the box dimension according to resize corner
      switch (handleName) {
        case 'tl':
          targetBBox.setX(startX + dx);
          targetBBox.setY(startY + dy);
          targetBBox.setWidth(startWidth - dx > 0 ? startWidth - dx : startWidth);
          targetBBox.setHeight(startHeight - dy > 0 ? startHeight - dy : startHeight);
          // resizedBox.x = startX + dx;
          // resizedBox.y = startY + dy;
          // resizedBox.width = (startWidth - dx) > 0 ? (startWidth - dx) : startWidth;
          // resizedBox.height = (startHeight - dy) > 0 ? (startHeight - dy) : startHeight;
          break;
        case 'tr':
          targetBBox.setY(startY + dy);
          targetBBox.setWidth(dx > 0 ? dx: startWidth);
          targetBBox.setHeight((startHeight - dy) > 0 ? (startHeight - dy) : startHeight);
          // resizedBox.y = startY + dy;
          // resizedBox.width = dx > 0 ? dx: startWidth;
          // resizedBox.height = (startHeight - dy) > 0 ? (startHeight - dy) : startHeight;
          break;
        case 'bl':
          targetBBox.setX(startX + dx);
          targetBBox.setWidth(startWidth - dx > 0 ? startWidth - dx : startWidth);
          targetBBox.setHeight(dy > 0 ? dy : startHeight);
          // resizedBox.x = startX + dx;
          // resizedBox.width = (startWidth - dx) > 0 ? (startWidth - dx) : startWidth;
          // resizedBox.height = dy > 0 ? dy : startHeight;
          break;
        case 'br':
          targetBBox.setWidth(dx > 0 ? dx : startWidth);
          targetBBox.setHeight(dy > 0 ? dy : startHeight)
          // resizedBox.width = dx > 0 ? dx : startWidth;
          // resizedBox.height = dy > 0 ? dy : startHeight;
          break;
        case 'tc':
          targetBBox.setY(startY + dy);
          targetBBox.setHeight(startHeight - dy > 0 ? startHeight - dy : startHeight);
          // resizedBox.y = startY + dy;
          // resizedBox.height = (startHeight - dy) > 0 ? (startHeight - dy) : startHeight;
          break;
        case 'bc':
          targetBBox.setHeight(dy > 0 ? dy : startHeight);
          // resizedBox.height = dy > 0 ? dy : startHeight;
          break;
        case 'rc':
          targetBBox.setWidth(dx > 0 ? dx : startWidth);
          // resizedBox.width = dx > 0 ? dx : startWidth;
          break;
        case 'lc':
          targetBBox.setX(startX + dx);
          targetBBox.setWidth(startWidth - dx > 0 ? startWidth - dx : startWidth);
          // resizedBox.x = startX + dx;
          // resizedBox.width = (startWidth - dx) > 0 ? (startWidth - dx) : startWidth;
          break;
        
      }

      // Draw the rectangle
      ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height); 
      // ctx.strokeStyle = Player.getClassColor(targetBBox.classId);
      // ctx.lineWidth = BoundingBox.getLineWidth();
      // ctx.setLineDash([8, 4]); // Show dashed line to 
      // ctx.strokeRect(targetBBox.getX(), targetBBox.getY(), targetBBox.getWidth(), targetBBox.getHeight())
      // Clear the canvas
      mainPlayer.displayTrackingBoxes();

      // // Save the rectangle dimensions
      // if (Math.abs(dx) <= actualVideoWidth) {
      //   resizedBox.width = dx;
      // } 
        
      // if (Math.abs(dy) <= actualVideoHeight) {
      //   resizedBox.height = dy;
      // }
    
      // Only draw rectangle if user moves the mouse more than the threshold to avoid registering accidental clicks
    } else {
      const rectWidth = mouseX - drawingRect.tempX;
      const rectHeight = mouseY - drawingRect.tempY;

      // Update the dragged distance to ignore accidental clicks
      const draggedDist = Math.min(Math.abs(rectWidth), Math.abs(rectHeight)); 
      if (draggedDist < Player.minDragDist) return;
        
      // Change the cursor to indicate that user can start drawing 
      mainCanvas.style.cursor = 'crosshair';
      
      const actualVideoWidth = mainPlayer.el.videoWidth;
      const actualVideoHeight = mainPlayer.el.videoHeight;

      // drawingRect.shouldHideEl = true;
    
      // Save the rectangle dimensions
      if (Math.abs(rectWidth) <= actualVideoWidth) {
        drawingRect.tempWidth = rectWidth;
      } 
        
      if (Math.abs(rectHeight) <= actualVideoHeight) {
        drawingRect.tempHeight = rectHeight;
      }
    
      // Clear the canvas
      ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height); 
      
      // Draw the rectangle
      ctx.strokeStyle = BoundingBox.getDrawingColor();
      ctx.lineWidth = BoundingBox.getLineWidth();
      ctx.strokeRect(drawingRect.tempX, drawingRect.tempY, drawingRect.tempWidth, drawingRect.tempHeight);
      
      
    }   
    
    // Allow updates on canvas
    drawingRect.shouldUpdate = true;

  }

  /**
   * Triggered on mouseup event on the main canvas for drawing a tracking bounding box 
   * @param {Event} e mouseup event
   */
  static mouseupDrawingHandler(e) {

    // Change the cursor back to default (it was changed to 'crosshair' before to indicate that user can start drawing 
    e.target.style.cursor = 'default';

    // Reset the mousedown flag
    Player.resetMouseDown();

    const mainPlayer = Player.getMainPlayer?.();
    if ( !mainPlayer instanceof Player) return;

    const drawingRect = mainPlayer.drawingRect;
    if (!drawingRect) return;
    
    const drawingCanvas = document.getElementById(Player.drawingCanvasId);
    if (!drawingCanvas) return;

    const ctx = drawingCanvas.getContext('2d');
    if (!ctx) return;

    const confirmDiv = document.getElementById('new-bounding-box-confirm-div');
    if (!confirmDiv) return;

    const confirmBtn = confirmDiv.querySelector('.confirm-btn');
    const cancelBtn = confirmDiv.querySelector('.cancel-btn');
    const continueBtn = confirmDiv.querySelector('.continue-btn');  // Continuing interpolation in other frames
    const endBtn = confirmDiv.querySelector('.end-btn');  // Ending interpolation in the current frame
    const interpolateCheck = confirmDiv.querySelector('#interpolate-check');
    const classInputGroup = confirmDiv.querySelector('.new-class-input');
    const interpolateLabel = confirmDiv.querySelector('.interpolate-label');
    // const classInput = confirmDiv.querySelector('#' + Player.drawnBBoxClassInputId);
    const classDatalist = confirmDiv.querySelector('#class-list-new-bbox');
    if (!confirmBtn || !cancelBtn || !interpolateCheck || !continueBtn || !classInputGroup || !classDatalist || !endBtn || !interpolateLabel ) return;
    
    const interpolateCheckDiv = interpolateCheck.parentElement.parentElement;
    if (!interpolateCheckDiv) return;

    // Separate arrays for interpolation-specific elements and others
    const interpolateEls = [ continueBtn, endBtn, interpolateLabel ];
    const otherEls = [ confirmBtn, classInputGroup, interpolateCheckDiv ];
    
    // Hide interpolation-specific elements and show others
    function hideInterpolationEls() {
      interpolateEls.forEach(el => el.classList.add('d-none'));
      otherEls.forEach(el => el.classList.remove('d-none'));
    }

    // Show interpolation-specific elements and hide others
    function showInterpolationEls(classId, trackId) {
      interpolateEls.forEach(el => el.classList.remove('d-none'));
      otherEls.forEach(el => el.classList.add('d-none'));

      // Update interpolation label
      const classStr = classId ?? undefined;
      const trackStr = trackId ?? undefined;
      const isCustomText = classStr && trackStr;
      interpolateLabel.textContent = isCustomText ? `Should interpolation for Track ${classStr}–${trackStr} end here or continue?` : 'End interpolation here or continue?'; 

    }

    const widthRatio = drawingCanvas.width / drawingCanvas.clientWidth;
    const heightRatio = drawingCanvas.height / drawingCanvas.clientHeight;
    const paddingY = 5; // Padding for confirmation div

    if (drawingRect.shouldUpdate) {
      drawingRect.width = drawingRect.tempWidth;
      drawingRect.height = drawingRect.tempHeight;
      drawingRect.startX = drawingRect.tempX;
      drawingRect.startY = drawingRect.tempY;

      // Reset temp coordinates
      drawingRect.tempX = null;
      drawingRect.tempY = null;
      drawingRect.tempWidth = null;
      drawingRect.tempWidth = null;
      drawingRect.shouldUpdate = false;

      // Ask for class selection before allowing user to draw on canvas
      // Clear previous options
      // Reset the datalist before updating it
      while (classDatalist.firstChild) {
        classDatalist.removeChild(classDatalist.firstChild);
      }

      // Add class to options
      const classMap = Player.getClassMap();
      if ( !(classMap instanceof Map) ) return;

      classMap.values().forEach(obj => {
        const { id: classId, name: className, color: classColor } = obj;
        const option = document.createElement('option');
        option.text = classId + '-' + className;
        option.value = className;
        option.dataset.classId = classId;
        option.dataset.className = className;
        option.dataset.classColor = classColor;
        classDatalist.append(option);
      });

      
      // Set the value of the color input element to a value different than previous classes
      const colorInput = classInputGroup.querySelector('input[type="color"');
      if (colorInput) {
        const newColor = BoundingBox.getNewClassColor();  // Get the color different than existing classes
        colorInput.value = newColor ?? '#000000'; // Assign new color (or black if it is not available) to input element
      }

      // Put the confirmation div element to the bottom left corner of the drawn bounding box
      // width < 0 => drawn from right to left, height < 0 => drawn from bottom to top
      const divX = (drawingRect.startX + (drawingRect.width < 0 ? drawingRect.width : 0)) / widthRatio;
      const divY = (drawingRect.startY + (drawingRect.height > 0 ? drawingRect.height : 0)) / heightRatio;
      
      // Adjust confirmation element position
      confirmDiv.style.left = divX + 'px';
      confirmDiv.style.top = divY + paddingY + 'px';

      // Calculate the upper-left X,Y coordinates for the bounding box 
      // It should be relative to the origin on the video canvas upper-left
      // width < 0 => drawn from right to left, height < 0 => drawn from bottom to top
      const x = (drawingRect.startX + (drawingRect.width < 0 ? drawingRect.width : 0));
      const y = (drawingRect.startY + (drawingRect.height < 0 ? drawingRect.height : 0));

      ctx.lineWidth = BoundingBox.getLineWidth();

      // If user drawing a new bBox (i.e. not resizing) and did not enable interpolating 
      if (!DrawnBoundingBox.isResizing() && !DrawnBoundingBox.isInterpolating()) {
       
        // Clear the canvas from previous drawings
        ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        
        // Draw the bounding box 
        ctx.strokeStyle = BoundingBox.getDrawingColor();
        ctx.strokeRect(drawingRect.startX, drawingRect.startY, drawingRect.width, drawingRect.height);
        
        // Hide the buttons relevant to interpolation, show other elements
        hideInterpolationEls();
        // confirmBtn.classList.remove('d-none');
        // interpolateCheckDiv.classList.remove('d-none');
        // classInputGroup.classList.remove('d-none');

        // Move the cancellation button inside of the input group
        // inputGroup.append(cancelBtn);
          
        // Set a new bounding box instance for each new mouse up event
        const drawnBBox = Player.setDrawnBBox();

        // Get the placeholder string for newly drawn bounding boxes without a class or track ID
        const newIdStr = DrawnBoundingBox.getNewIdStr();

        // Get the track number
        const trackNumber = mainPlayer.getCurrentFrame?.();

        // Create and save the first BBox on the frame temporarily
        const firstBBox = BoundingBox.validateAndCreate({
          trackNumber: trackNumber,
          trackId: newIdStr,
          x: x, 
          y: y,
          width: Math.abs(drawingRect.width),
          height: Math.abs(drawingRect.height),
          classId: newIdStr,
          confidenceTrack: 1  // Because users must be certain about their own drawing of a bounding box 
        });

        if ( !(firstBBox instanceof BoundingBox) ) {
          showAlertToast('An error occurred. Please try again.', 'error');
          return;
        }
        drawnBBox.addFirstBBox(firstBBox);

        confirmDiv.classList.remove('d-none');        
        
      }
      
      // If user is drawing a new box (i.e. not resizing) and enabled interpolating (i.e. first bounding box is already drawn and second one is expected)
      else if (!DrawnBoundingBox.isResizing() && DrawnBoundingBox.isInterpolating()) {

        // Clear the canvas from previous drawings
        ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);

        // Get the previously drawn BBox
        const drawnBBox = Player.getDrawnBBox();
        if (!drawnBBox) return;
        
        const firstBBox = drawnBBox.getFirstBBox();
        if (!firstBBox) return;

        const classId = firstBBox.getClassId();
        const trackId = firstBBox.getTrackId();
        
        // Draw the bounding box 
        ctx.lineWidth = BoundingBox.getLineWidth();
        ctx.strokeStyle = Player.getClassColor(classId);
        ctx.strokeRect(drawingRect.startX, drawingRect.startY, drawingRect.width, drawingRect.height);

        // Add the first available track ID for the selected class
        const labelText = `${classId}-${trackId}`;
        ctx.beginPath();
        ctx.font = '20px tahoma';
        const labelWidth = ctx.measureText(labelText).width + 15;
        const labelHeight = 30;
        const padding = 5;
          
        // Label coordinates - placed on top left corner of the rectangle
        // width < 0 => drawn from right to left
        // height < 0 => drawn from bottom to top
        const labelX = drawingRect.startX + (drawingRect.width < 0 ? drawingRect.width : 0);
        const labelY = drawingRect.startY + (drawingRect.height < 0 ? drawingRect.height : 0) - labelHeight; 

        // Continue drawing after edge cases are handled
        ctx.rect(labelX, labelY, labelWidth, labelHeight);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.fillText(labelText, labelX+padding, labelY+labelHeight-padding)
        ctx.stroke();
  
        // Copy class ID and track ID from first BBox to newly drawn BBox
        const lastBBox = BoundingBox.validateAndCreate({
          trackNumber: mainPlayer.getCurrentFrame(),
          trackId: trackId,
          x: x, 
          y: y, 
          width: Math.abs(drawingRect.width),
          height: Math.abs(drawingRect.height),
          classId: classId,
          confidenceTrack: 1  // Because users must be certain about their own drawing of a bounding box 
        });

        if ( (!lastBBox instanceof BoundingBox) ) {
          showAlertToast('An error occurred. Please try again.', 'error');
          return;
        }

        drawnBBox.addLastBBox(lastBBox);
        drawnBBox.addInitLastBBox(lastBBox);

        // Show the buttons relevant to interpolation, hide other elements
        showInterpolationEls();
        
        // Make the confirmation element visible
        confirmDiv.classList.remove('d-none');
        
      }

      // If user is resizing an existing bounding box and is NOT interpolating of a previously resized bounding box
      else if (DrawnBoundingBox.isResizing() && !DrawnBoundingBox.isInterpolating()) {
  
        // Get the resized bBox instance
        const resizedBBox = BoundingBox.getResizedBBox();
        if (!resizedBBox) return;
  
        // Get the previously saved bBox on mousemove event while resizing
        const firstBBox = resizedBBox.getFirstBBox();
        if (!(firstBBox instanceof BoundingBox)) return;
  
        // Put the confirmation div element to the bottom left corner of the drawn bounding box
        const divX = (firstBBox.getX?.() + (firstBBox.getWidth?.() < 0 ? firstBBox.getWidth?.() : 0)) / widthRatio;
        const divY = (firstBBox.getY?.() + (firstBBox.getHeight?.() > 0 ? firstBBox.getHeight?.() : 0)) / heightRatio;
  
        // Adjust confirmation element position
        confirmDiv.style.left = divX + 'px';
        confirmDiv.style.top = divY + paddingY + 'px';
  
        // Hide the interpolation buttons and class select, show other elements
        hideInterpolationEls();
        classInputGroup.classList.add('d-none');
  
        // // Move the cancellation button inside of the input group
        // inputGroup.append(cancelBtn);
  
        // Make the confirmation element visible
        confirmDiv.classList.remove('d-none');
  
      }
  
      // If user checked interpolation for a previously resized bounding box
      else if (DrawnBoundingBox.isResizing() && DrawnBoundingBox.isInterpolating()) {
  
        // Only allow resizing of a box with the same track ID
        // If there is no such a track in the current frame show a warning
  
        // Clear drawing canvas
        // ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
  
        // Get the resized box
        const resizedBBox = BoundingBox.getResizedBBox();
        if ( !(resizedBBox instanceof DrawnBoundingBox) ) return;
  
        // Get the previously saved bBox on mousemove event while resizing
        const lastBBox = resizedBBox.getLastBBox?.();
        if (!(lastBBox instanceof BoundingBox)) return;
  
        // Get the class and track IDs
        const classId = lastBBox.getClassId?.();
        const trackId = lastBBox.getTrackId?.();
        // const trackNumber = lastBBox.getTrackNumber();
  
        // Get the bBox coordinates and dimensions
        const x = lastBBox.getX?.();
        const y = lastBBox.getY?.();
        const width = lastBBox.getWidth?.();
        const height = lastBBox.getHeight?.();
  
        // Put the confirmation div element to the bottom left corner of the drawn bounding box
        const divX = (x + (width < 0 ? width : 0)) / widthRatio;
        const divY = (y + (height > 0 ? height : 0)) / heightRatio;
  
        // Adjust confirmation element position
        confirmDiv.style.left = divX + 'px';
        confirmDiv.style.top = divY + paddingY + 'px';
        
        // Show the interpolate buttons, hide other elements including class input
        showInterpolationEls();
        classInputGroup.classList.add('d-none');
  
        // Make the confirmation div visible
        confirmDiv.classList.remove('d-none');
  
      }  

    }

    // Reset temp coordinates
    drawingRect.tempX = null;
    drawingRect.tempY = null;
    drawingRect.tempWidth = null;
    drawingRect.tempWidth = null;
    drawingRect.shouldUpdate = false;
    
  };

  /**
   * Sets the canvas attributes to show video frames while hovering over the control bar
   * @returns 
   */
  setCanvasOnHover() {
    
    const mainPlayer = Player.getMainPlayer();
    if (!mainPlayer) return;

    // Get the video element for the hidden downsized copy of the main video
    const hoverVideoEl = document.querySelector('video#hover-video');
    if (!hoverVideoEl) return;

    // Calculate the aspect ratio of the video
    const aspectRatio = mainPlayer.el.videoWidth / mainPlayer.el.videoHeight;
     
    // Calculate the downsized video dimensions
    const scaledHeight = 200;
    const scaledWidth = Math.round(aspectRatio * scaledHeight);

    // Set the hover video DOM element attributes
    hoverVideoEl.width = scaledWidth;
    hoverVideoEl.height = scaledHeight;
    
    // Set the hover canvas DOM element attributes
    const hoverFrameCanvas = document.querySelector('#hover-frame-div canvas');
    if (hoverFrameCanvas) {
      hoverFrameCanvas.height = scaledHeight; 
      hoverFrameCanvas.width = scaledWidth;

    }

    // Set the source
    hoverVideoEl.src = mainPlayer.getSource();

    // Load the video 
    hoverVideoEl.load();

  }

  // Setters
  setSource(source) {
    this.el.src = source;
  }

  async setName(name) {
    // Set the player name
    if (name) {
      this.name = name;
    } else {
      // Extract name of the source video without extension
      const videoSrc = this.getSource(); 
      if (videoSrc) {
        const fileName = await getFileNameWithoutExtension(videoSrc);
        if (fileName) {
          this.name = fileName;
        }
      }
    }

    // Update metadata
    Player.getMetadata?.()?.updateVideoName();

  }

  /**
   * Sets the current time to the given value in seconds for all videos
   * @param {Number | String} seconds Time in seconds
   */
  static setCurrentTimeAll(seconds) {
    Player.getAllInstances().forEach(player => { player.setCurrentTime(seconds) });
  }

  setCurrentTime(seconds) {
    if (typeof seconds === 'undefined' || seconds === null || !Number.isFinite(seconds)) return;
    
    this.el.currentTime = seconds;
  }

  /**
   * Sets the current frame to the given value for all videos
   * @param {Number | String} frameNumber Frame number to be converted to seconds
   */
  static setCurrentFrameAll(frameNumber) {
    Player.getAllInstances().forEach(player => {
      player.setCurrentTime(framesToSeconds(frameNumber))
    });
  }

  /**
   * Sets the current frame to the given value for this player
   * @param {Number | String} frameNumber Frame number to be converted to seconds
   */
  setCurrentFrame(frameNumber) {
    this.setCurrentTime(framesToSeconds(frameNumber));
  }
  
  setPlaybackRate(rate) {
    if (rate <= Player.getMaxPlaybackRate() && rate > 0) {
      this.el.playbackRate = rate;
    }
  }

  increaseSpeed(step) {
    const increment = step ? step : 0.25;
    this.setPlaybackRate(this.getPlaybackRate() + increment);
  }

  decreaseSpeed(step) {
    const decrement = step ? step : 0.25;
    this.setPlaybackRate(this.getPlaybackRate() - decrement);
  }


  setMainPlayer() {
    this.mainPlayer = true;
  }

  /**
   * Sets the TrackingMap of the current Player instance
   * @param {Object} obj
   * @param {Object[]} obj.tracks 
   * @param {String[] | undefined} obj.classNames Class name strings 
   * @param {String[] | undefined} obj.classColors Class color strings in hex
   */
  setTrackingMap({ tracks, classNames, classColors } = {}) {
    showProcessIndicator();
    
    this.trackingMap = new TrackingMap({
      tracks: tracks, 
      classNames: classNames,
      classColors: classColors
    });

    const trackingMap = this.trackingMap;
    if ( !(trackingMap instanceof TrackingMap) ) {
      hideProcessIndicator();
      showAlertToast('Processing tracks failed. Please try again.', 'error', 'Failed to Process Tracks')
      return;
    }

    // Check if class IDs have names assigned by the user previously
    const hasAnyClassName = Player.hasClassNames();
    if (!hasAnyClassName) {

      // If no class names from metadata file, check config file for any similar class IDs, names and colors
      const isSet = Player.setClassMap(Config.classAttributes);

      // Find the first frame which contains at least one member from each class
      const frameWithAllClass = trackingMap.findFirstFrameWithAllClass();
  
      // Show the modal
      this.showModalForClassNaming(frameWithAllClass);

    }

    // Enable tracking
    Player.enableTracking();

    // Refresh canvas
    this.displayTrackingBoxes();

    // Hide spinner
    hideProcessIndicator();

  }

  setTrackingBoxesInFrame(boxArr) {
    if (typeof boxArr === 'undefined' || boxArr === null || !Array.isArray(boxArr)) return;
    this.trackingBoxesInFrame = boxArr;
  }

  resetTrackingMap() {
    const trackingMap = this.getTrackingMap();
    if (!trackingMap) return;
    
    trackingMap.clear();

    // Refresh canvas
    this.displayTrackingBoxes();
      
  }

  // Getters
  getName() {
    return this.name;
  }

  /**
   * Gets the frame rate of the player instance.
   * @returns {Number} Frames per second
   */
  getFrameRate() {
    return this.frameRate;

  }

  /**
   * Sets the frame rate (frames per second) of the player. 
   * It uses the input value if it is given. 
   * Otherwise, the video file is processed to calculate its frame rate.
   * @param {Number | String | undefined} frameRate Optional frame rate
   * @returns {Promise}
   * @returns {Number | undefined} Updated frame rate or undefined if the operation is failed
   */
  async setFrameRate(frameRate) {

    // Convert input into a number
    const parsedFPS = parseFloat(frameRate);
    
    // If input is valid, assign it to the instance 
    if (Number.isFinite(parsedFPS) && parsedFPS > 0) {
      this.frameRate = parsedFPS;

      // If input is invalid or not given
    } else {
      // Try to calculate the FPS
      const videoFPS = await this.calculateFrameRate();
      
      // Error checking
      if (!Number.isFinite(videoFPS) || videoFPS <= 0) return;

      this.frameRate = videoFPS;

    }

    // Update metadata
    Player.getMetadata?.().updateVideoFPS?.();

    return this.frameRate;

  }
  
  getControlBar() {
    return this.controlBar;
  }

  getTrackingMap() {
    return this.trackingMap;
  }

  /**
   * Gets the Ethogram instance associated with the main player
   * @returns {Ethogram}
   */
  getEthogram() {
    return this.ethogram;
  }

  setEthogram(obj) {
    if (obj !== null && typeof obj === 'object') {
      this.ethogram = new Ethogram(obj);
      return this.ethogram;
    }
  }

  /**
   * Creates a new Ethogram instance and clears the ethogram HTML table
   */
  clearEthogram() {
    this.ethogram = new Ethogram();
    clearEthogramTable();
  }

  getDuration() {
    return this.el.duration;
  }
  
  getCurrentTime() {
    return this.el.currentTime;
  }

  getCurrentFrame() {
    return secondsToFrames(this.getCurrentTime(), this.getFrameRate())
  }
  
  getPlaybackRate() {
    return this.el.playbackRate;
  }

  /**
   * Gets the error status when loading the video into DOM element
   * @returns {Boolean} True if error event is emitted, False otherwise
   */
  get wasErrorOnLoad() {
    return this.errorOnLoad;
  }

  /**
   * Gets the video source 
   * @returns {String | undefined} | Video file path without the file:// prefix or undefined if no source was found
   */
  getSource() {
    const srcStr = this.el?.src;
    if (srcStr === '' || typeof srcStr === 'undefined') return;
    
    // Remove the "file:/// prefix and handle spaces and other special chars in the filename"
    const fileUrl = new URL(srcStr);
    const parsedSrc = decodeURIComponent(fileUrl.pathname);
    return parsedSrc;
  }

  setFirstAvailTrackIds(trackIds) {
    // Set the first the available track IDs for each class
    // Expects a Map {class: firstAvailTrackId}
    this.trackingMap.firstAvailTrackIds = trackIds;
  }

 
  /**
   * Gets the first the available track ID map
   * @returns {Map} Map with keys from class IDs and values from track IDs
   */
  // getFirstAvailTrackIds() {
  //   return this.trackingMap.firstAvailTrackIds;
  // }

  //!! TODO!!: Move getFirstAvailTrackId to TrackingMap class
  /**
   * Gets the first available track ID for a given class
   * @param {Number | String} classId Class ID will be converted to String
   * @returns {String | undefined} Track ID in String type or undefined if a given class is invalid
   */
  static getFirstAvailTrackId(classId) {
    const parsedId = classId?.toString();
    if (!parsedId) return;

    const mainPlayer = Player.getMainPlayer();
    if (!mainPlayer) return;

    const trackingMap = mainPlayer.getTrackingMap();
    if (!trackingMap) return;
    
    const idMap = trackingMap.idMap;
    if (!idMap || !(idMap instanceof Map)) return;

    // Check the validity of input
    if (!idMap.has(parsedId)) return;

    const classMap = idMap.get(parsedId);
    const trackIdArr = Array.from(classMap.keys()).map(idStr => parseInt(idStr));
    const firstAvailId = Math.max(...trackIdArr) + 1;
    return firstAvailId?.toString();

  }


  /**
   * Gets the tracking boxes for the current frame of the main video
   * @returns {BoundingBox[]} Array of BoundingBox instances
   */
  getTrackingBoxesInFrame() {
    const trackingMap = this.getTrackingMap();
    const boxesInFrame = trackingMap?.getTracksByFrame?.(this.getCurrentFrame());
    if (!Array.isArray(boxesInFrame)) return; 
    return boxesInFrame;
  }

  /**
   * Gets canvas element for displaying tracking bounding boxes
   * @returns {Element} DOM element for tracking canvas
   */
  getCanvas() {
    return this.canvas;
  }

  getEvents() {
    return this.events;
  }
  
  /**
   * Adds an event listener and its callback function to a Player instance if the event has not already been added.
   * Saves the event to the instance to prevent duplicate event listeners.
   * @param {Event} event 
   * @param {Function} callBackFunction 
   */
  on(event, callBackFunction) {

    // Check if this event was already added to prevent duplicates
    if (!this.events.includes(event)) {
      
      // Add the event and callback function
      this.el.addEventListener(event, callBackFunction);
      
      // Add the event to this instance
      this.events.push(event);
      
    }

  }

  /**
   * Checks if this is the main player
   * @returns {Boolean} True if this is the main player, False otherwise
   */
  isMainPlayer() {
    return this.mainPlayer;
  }

  isPaused() {
    return this.el.paused;
  }

  isMuted() {
    return this.el.muted;
  }

  isEnded() {
    return this.el.ended;
  }

  async calculateFrameRate() {
    const frameRate = await window.electronAPI.calcVideoFrameRate(this.getSource());
    return frameRate;

  }

  /**
   * Disposes the player and remove video element from DOM
   */
  async dispose() {

    // Only dispose the secondary players
    if (this.isMainPlayer()) return;

    this.pause();

    Player.delete(this);

    // Find the item for this player in the secondary player array and remove it
    // Player.secondaryPlayers = Player.secondaryPlayers.filter(player => player.domId !== this.domId);

    // Remove the item from all instances array
    // Player.allInstances = Player.allInstances.filter(player => player.domId !== this.domId);

    // Remove the source 
    this.el.removeAttribute('src');

    // Remove the column div for the player
    this.el.parentNode.parentNode.remove(); 
    
    // Save changes to config
    const response = await Player.saveSecondaryVideosToConfig();
    if (response) {
      showAlertToast('Player removed!', 'success');
    } else {
      showAlertToast('Error saving changes!', 'error');
    }

    // If no secondary player is left, move the the button back to the main panel from the title panel
    if (Player.getSecondaryPlayers().length < 1) {
      const openSecondaryVideosBtn = document.getElementById('open-secondary-videos-btn');

      if (openSecondaryVideosBtn) {
        const infoTextEl = document.getElementById('secondary-video-info-text');
        
        if (infoTextEl) {
          infoTextEl.parentNode.prepend(openSecondaryVideosBtn);
          openSecondaryVideosBtn.classList.add('mt-3');
          openSecondaryVideosBtn.classList.replace('btn-icon-small', 'btn-icon-large');
          
          // Show the information text
          infoTextEl.classList.remove('d-none');
        
        }
        
      }

      const openBtnDiv = document.querySelector('#secondary-videos-control-div .button-div')
      if (openBtnDiv) {

      }
    }

    // Delete the instance
    // delete this;

    return response;


  }

  static pauseAll() {
    Player.getAllInstances().forEach(player => player.pause());
  }

  static playAll() {
    Player.getAllInstances().forEach(player => player.play());
  }

  static playPauseAll() {
    Player.getAllInstances().forEach(player => player.playPause());
  }

  static stopAll() {
    Player.getAllInstances().forEach(player => player.stop());
  }

  static forwardAll() {
    Player.getAllInstances().forEach(player => player.forward());
  }

  static replayAll() {
    Player.getAllInstances().forEach(player => player.replay());
  }

  static stepForwardAll() {
    Player.getAllInstances().forEach(player => player.stepForward());
  }

  static stepBackwardAll() {
    Player.getAllInstances().forEach(player => player.stepBackward());
  }

  // Pause the video
  pause() {
    if (!this.isPaused() && !this.isEnded()) {
      this.el.pause();
      // this.updateButtonIcons();
    }
  }

  // Play the video
  play() {
    if (this.isPaused()) {
      this.el.play();
      // this.updateButtonIcons();
    }
  }

  playPause() {
    if (!this.isPaused() && !this.isEnded()) {
      this.pause();
    } else {
      this.play();
    }
    // this.updateButtonIcons();
  }

  stop() {
    this.pause();
    this.setCurrentTime(0);
  }

  forward(seconds) {
    // If no input, get the default skip seconds
    const skipSeconds = seconds ? seconds : Player.getSkipSeconds();

    if (this.getCurrentTime() < this.getDuration() - skipSeconds) {
      this.setCurrentTime(this.getCurrentTime() + skipSeconds);
    } else {
      this.setCurrentTime(this.getDuration());
    }

  }

  replay(seconds) {
    let skipSeconds;
    if (!seconds) {
      // If no input, get the default skip seconds
      skipSeconds = Player.getSkipSeconds();
    } else {
      skipSeconds = seconds;
    }
    
    if (this.getCurrentTime() > skipSeconds) {
      this.setCurrentTime(this.getCurrentTime() - skipSeconds);
    } else {
      this.stop();
    }


  }

  /**
   * Forward by one frame
   */
  stepForward() {
    this.pause();
    this.forward(1 / this.getFrameRate())
  }

  /**
   * Backward by one frame
   */
  stepBackward() {
    this.pause();
    this.replay(1 / this.getFrameRate())
  }

  decreaseVolume(step) {
    // Decrease volume by 0.1 (10%).
    const increment = step ? step : 0.1;

    // Ensure that the volume doesn't go below 0.
    this.el.volume = Math.max(this.el.volume - increment, 0);

    if (this.el.volume < 0.01) {
      this.muteButton.setIcon('volume_off');
      showAlertToast('Muted', 'success');
    } else if (this.el.volume < 0.5) {
      this.muteButton.setIcon('volume_down');
      showAlertToast(`Volume: ${(this.el.volume * 100).toFixed()}%`, 'success');
    } else {
      this.muteButton.setIcon('volume_up');
      showAlertToast(`Volume: ${(this.el.volume * 100).toFixed()}%`, 'success');
    }



  }

  increaseVolume(step) {
    // Increase volume by 0.1 (10%). 
    const increment = step ? step : 0.10;

    // Ensure that the volume doesn't go above 1.
    this.el.volume = Math.min(this.el.volume + increment, 1);
    if (this.el.volume > 0.5) {
      this.muteButton.setIcon('volume_up');
    } else {
      this.muteButton.setIcon('volume_down');
    }

    showAlertToast(`Volume: ${(this.el.volume * 100).toFixed()}%`, 'success');


  }

  mute() {
    this.el.muted = true;
  }
  
  unMute() {
    this.el.muted = false;
  }
  
  toggleMute() {
    // Check if the mute button is attached to player
    if (typeof this.muteButton === 'undefined' || this.muteButton === null) return; 
    
    if (this.isMuted()) {
      this.muteButton.setIcon('volume_up');
      this.unMute();
    } else {
      this.muteButton.setIcon('volume_off');
      this.mute();
    }

  }

  showSpinner() {
    // showProcessIndicator();
    const spinnerParentDiv = this.el.parentNode.querySelector('.spinner-parent-div');
    if (spinnerParentDiv) {
      const spinnerEl = document.createElement('div');
      spinnerEl.classList.add('spinner-grow');
      spinnerEl.setAttribute('role', 'status');
      spinnerEl.style.width = '3rem;'
      spinnerEl.style.height = '3rem;'
      const spinnerSpan = document.createElement('span');
      spinnerSpan.classList.add('visually-hidden');
      spinnerSpan.textContent = 'Loading...';
      spinnerEl.append(spinnerSpan);
      spinnerParentDiv.append(spinnerEl);
      document.body.style.cursor = 'progress';
    }
  }

  hideSpinner() {
    // hideProcessIndicator();
    const spinnerParentDiv = this.el.parentNode.querySelector('.spinner-parent-div');
    if (spinnerParentDiv) {
      const spinnerElList = spinnerParentDiv.querySelectorAll('[class^="spinner"]');
      if (spinnerElList) {
        spinnerElList.forEach(spinnerEl => {spinnerEl.remove()})
      }
    }
    document.body.style.cursor = 'default';
  }
  

  /**
   * Loads the video element source
   * @returns {Promise} Rejected if 'error' event is emitted during loading of the video source
   */
  load() {
    this.el.load();
    
    return new Promise((resolve, reject) => {  
      
      // Check periodically whether wasErrorOnLoad variable is defined
      // This variable will be defined as either true or false
      // when the video element emits either 'error' or 'canplay' event
      let interval = setInterval(() => {
        if (this.wasErrorOnLoad !== undefined){
          clearInterval(interval);
          if (this.wasErrorOnLoad) {
            this.errorOnLoad = undefined; // Reset error status
            reject('Video cannot be played!');
          } else {
            this.errorOnLoad = undefined; // Reset error status
            resolve('Video can be played!');
          }
        }
      }, 50); // Check every 50 ms

    }); 

  }

  switchMainView(mainPlayer) {
    if (!this.isMainPlayer()) {
      this.domId = mainPlayer.domId;
    }
  }
  
  
  // Attach control buttons
  attachButton(buttonObject, buttonType) {
    if (buttonType === 'play-pause') {
      this.playButton = buttonObject;
    } else if (buttonType === 'mute') {
      this.muteButton = buttonObject;
    }
  }
  
  // Attach control bar
  attachControlBar(controlBarObject) {
    this.controlBar = controlBarObject;
    controlBarObject.attachedPlayers.push(this); // Link player to control bar as well
    // this.controlBar.updateProgressBar();
  }

  attachCanvas(canvasObject) {
    this.canvas = canvasObject;
  }

  updateButtonIcons() {
    if (this.playButton) {
      if (this.isPaused() || this.isEnded()) {
        this.playButton.setIcon('play_circle', 'size-48'); // Change the play button icon
      } else {
        this.playButton.setIcon('pause_circle', 'size-48'); // Change the play button icon
      }

    }
  }

  // // Update player with the changes in the control bar
  // updatePlayer(e) {
  //   if (typeof this.controlBar !== 'undefined') {
  //     this.pause();
  //     const progressBarRect = this.controlBar.progressBar.getBoundingClientRect();
  //     const clickPosition = e.clientX - progressBarRect.left;
  //     const percentage = (clickPosition / progressBarRect.width) * 100;
  //     const videoTime = (percentage / 100) * this.getDuration();
  //     this.setCurrentTime(videoTime);
  //   }
  // }

  displayTrackingBoxes() {
    if (this.isEnded()) {
      return false;
    } 

    if (!Player.visibleTracks) return;

    const canvas = this.canvas;
    if (!canvas) return;

    // Draw rectangles on video canvas for each frame with a tracking number
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
      
    canvas.width = this.el.videoWidth;
    canvas.height = this.el.videoHeight;

    // Predefined tracking columns from the output of the model 
    // track_number is the frame number where there is an detection of an object
    // class/class: (0 = lemur, 1 = box/inanimate objects)

    // // Convert currentFrame to string because trackingMap keys are strings (e.g. "372" instead of 372)
    // const currentFrame = this.getCurrentFrame().toString();
    // if (!trackingMap.has(currentFrame)) return;

    const boxesInFrame = this.getTrackingBoxesInFrame();
    if (!Array.isArray(boxesInFrame)) {
      console.log('No tracking object was provided!');
      return;
    }

    // this.setTrackingBoxesInFrame(boxesInFrame);

    // Get Individual subject names
    const individualNames = Player.getIndividualNames(); 
    
    boxesInFrame.forEach(bBox => {
      if (!(bBox instanceof BoundingBox)) return;

      // Get the properties
      const trackNum = bBox.getTrackNumber?.();
      const trackId = bBox.getTrackId?.();
      const x = bBox.getX?.();
      const y = bBox.getY?.();
      const width = bBox.getWidth?.();
      const height = bBox.getHeight?.();
      const classId = bBox.getClassId?.();
      const confidenceTrack = bBox.getConfidenceTrack?.();
      const nameOrder = bBox.getNameOrder?.();
      const confidenceId = bBox.getConfidenceId?.();

      // Check the validity of mandatory properties
      // const mandatoryProps = [ trackNum, trackId, x, y, width, height, classId ];
      // for (const prop of mandatoryProps) {
      //   if (typeof prop === 'undefined' || prop === null) return;
      // }


      // boxesInFrame.push(rectangle);
      
      // Bounding boxes for class
      ctx.beginPath();
      ctx.lineWidth = BoundingBox.getLineWidth();
      const classColor = Player.getClassColor(classId);
      ctx.strokeStyle = classColor ? classColor : 'black';
      ctx.globalAlpha = BoundingBox.getGlobalAlpha();
      ctx.rect(x, y, width, height);
      ctx.stroke();

      // Label box default properties
      const defaultLabel = `${classId}-${trackId}`;
      
      // Add name of the identified individual to the label box if there is one
      let canvasText = defaultLabel;
      if (Number.isSafeInteger(nameOrder) && nameOrder >= 0 && individualNames) {
        const extendedLabel = `${defaultLabel}-${individualNames[nameOrder]}`;
        canvasText = extendedLabel;
      }
        
      // Start drawing label boxes              
      ctx.beginPath();
      ctx.font = '20px tahoma';
      
      // Default label position and dimensions (top left corner)
      let labelWidth = ctx.measureText(canvasText).width + 15;
      let labelHeight = 30;
      let labelX = x;
      let labelY = y - labelHeight;
      let padding = 5;
        
      // Handle edge cases (when tracking boxes are on the edges of the canvas)
      // Overflowing on the top (put the label below)
      if (labelY < 0) {
        
        // Label on the bottom left
        labelY = y + height;
        
        // Overflowing on the left and top
        if (x <= 0) {
          // Label on the bottom right
          labelX = x + height;
        }

      // Overflowing on the middle left
      } else if (labelX <= 0) {
        // Shift label x-coordinate to the right (label box overflow on the left)
        labelX = 0;
        
      } else if (labelX + labelWidth > canvas.width) {
        // Shift label x-coordinate to the left (label box overflow on the right)
        labelX = canvas.width - labelWidth;

      }

          
      // Shift label y-coordinate to the bottom (label box overflow at the top)
      // if (labelY + labelHeight < 0) {
      //   labelY = rectangle.y + rectangle.height - labelHeight;
      // }
      
      // Continue drawing after edge cases are handled
      ctx.rect(labelX, labelY, labelWidth, labelHeight);
      ctx.fillStyle = 'white';
      ctx.fill();
      ctx.fillStyle = 'black';
      ctx.fillText(canvasText, labelX+padding, labelY+labelHeight-padding)
      ctx.stroke();

      function drawHandle(x, y) {
        // const handleSize = Math.max(10, Math.min(rectangle.width, rectangle.height) / 5);
        const handleSize = BoundingBox.getResizeHandleSize();
        // ctx.globalAlpha = 0.5;  // Make it transparent
        ctx.strokeStyle = classColor;
        ctx.strokeRect(x - handleSize/2, y - handleSize/2, handleSize, handleSize);
        // ctx.strokeStyle = classColor;
        ctx.setLineDash([5, 5]);  // Dashed line
        // ctx.strokeRect(x - handleSize/2, y - handleSize/2, handleSize, handleSize);
        ctx.globalAlpha = 1.0;  // Reset the transparency
        ctx.setLineDash([]);  // Change back to solid line

      }

      // If user is in drawing mode, draw resizing handles on the corners
      if (Player.isInDrawingMode()) {
        // Draw handles
        drawHandle(x, y); // top-left
        drawHandle(x + width, y); // top-right
        drawHandle(x, y + height); // bottom-left
        drawHandle(x + width, y + height); // bottom-right
        drawHandle(x + width/2, y); // top-center
        drawHandle(x + width/2, y + height); // bottom-center
        drawHandle(x + width, y + height/2); // right-center
        drawHandle(x, y + height/2); // left-center

      }


    });

    return boxesInFrame 
      

  }

  
  /**
   * Draw on video canvas to indicate whether the labeling mode is enabled
   */
  indicateLabelingModeOnCanvas() {
    if (this.isEnded()) {
      return false;
    } 


    // Draw bounding boxes around the canvas
    const canvas = this.canvas;
    if (canvas && canvas.getContext) {
      const ctx = canvas.getContext('2d');
      
      // Adjust canvas size if no tracking file uploaded yet
      if (this.getTrackingMap()?.isEmpty()) {
        canvas.width = this.el.videoWidth;
        canvas.height = this.el.videoHeight;
      }

      // Highlight the entire frame
      let color;
      if (Player.isInLabelingMode()) {
        color = green;
      } else {
        color = red;
      }
      
      ctx.beginPath();
      ctx.strokeStyle = color 
      ctx.lineWidth = 10;
      ctx.rect(0, 0, canvas.width, canvas.height);
      ctx.stroke();
        
        

      
    }
    
  }

  /**
   * Draw bounding boxes on the frames with annotated behaviors
   */
  indicateAnnotatedBehaviors() {
    if (this.isEnded()) {
      return false;
    } 

    // Get the annotated behaviors with its frame numbers
    const ethogram = this.getEthogram();
    if (ethogram.size() === 0) {
      console.log('No ethogram could be found!');
      return;
    }

    const currentFrame = this.getCurrentFrame();
    let annotations = []; // Save concurrent annotations in an array
    const allObservations = ethogram.getAllObservations();
    for (const [obsIndex, obs] of allObservations) {
      // Check if current frame has any annotated behaviors
      if (currentFrame >= obs.getStartTime() && currentFrame <= obs.getEndTime()) {
        annotations.push(obs.getAction());
      }
    }

    // If so, draw bounding boxes around the canvas on video and label annotations with text boxes
    const canvas = this.canvas;
    if (canvas && canvas.getContext) {
      const ctx = canvas.getContext('2d');
      
      // Adjust canvas size if no tracking file uploaded yet
      if (this.getTrackingMap()?.isEmpty()) {
        canvas.width = this.el.videoWidth;
        canvas.height = this.el.videoHeight;
      }

      if (annotations.length > 0) {
        
        // Produce text for annotations
        let labelText = annotations.join(', ');

        // Highlight the entire frame
        ctx.beginPath();
        ctx.strokeStyle = 'yellow'; 
        ctx.lineWidth = 10;
        ctx.rect(0, 0, canvas.width, canvas.height);
        ctx.stroke();

        // Draw rectangle for labels
        ctx.beginPath();
        ctx.font = '25px tahoma';
        let labelWidth = ctx.measureText(labelText).width + 25;
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 5;

        ctx.rect(0, 0, labelWidth, 30);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)' // Transparent rectangle
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.fillText(labelText, 10, 20)
        ctx.stroke();
        
      }
      
    }
    
  }

  /**
   * Show menu with right-click for individual name edits/additions
   * @param {Event} event contextmenu event
   */
  static showRightClickMenu(event) {

    if (Player.isInDrawingMode()) return;

    event.preventDefault();
    
    // Get individual names
    const individualNames = Player.getIndividualNames();
    if (!individualNames) {
      console.log('No individual name could be found!');
      showAlertToast('Please upload a file for individual names!', 'warning', 'Name Editing Disabled');
      return;
    }

    const mainPlayer = Player.getMainPlayer();
    if (!mainPlayer) return;

    const canvas = mainPlayer.getCanvas();
    if (!canvas) return;

    const boxesInFrame = mainPlayer.getTrackingBoxesInFrame();
    if (typeof boxesInFrame === "undefined" || boxesInFrame.length < 1) return;
    
    mainPlayer.pause();
    const canvasRect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - canvasRect.left;
    const mouseY = event.clientY - canvasRect.top;
    const widthRatio = canvas.width / canvas.clientWidth;
    const heightRatio =  canvas.height / canvas.clientHeight;

    const clickedRectangles = Player.getBoxesUnderMouse(mouseX * widthRatio, mouseY * heightRatio, boxesInFrame);
    if (!clickedRectangles || clickedRectangles.length < 1) {
      return;
    }

    const clickedRectangle = clickedRectangles[0];
    
    const rightClickDiv = document.getElementById('right-click-canvas-div');
    const nameEditSelect = rightClickDiv.querySelector('select');
    if (!rightClickDiv || !nameEditSelect) return;
        
    // Save rectangle info to right click div element
    rightClickDiv.dataset.clickedClassId = clickedRectangle.classId;
    rightClickDiv.dataset.clickedTrackId = clickedRectangle.trackId;
    rightClickDiv.dataset.frameNumber = mainPlayer.getCurrentFrame();
    if (Number.isInteger(parseInt(clickedRectangle.nameOrder))) {
      rightClickDiv.dataset.clickedNameOrder = clickedRectangle.nameOrder;
    }

    const clickedInfoDiv = rightClickDiv.querySelector('.info-text');
    if (clickedInfoDiv) {
      clickedInfoDiv.textContent = produceLabelText(clickedRectangle);
    }

    // Clear previous options
    nameEditSelect.options.length = 0;

    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.text = 'Add name'

    // Change the title for name edit div depending on existence of a name for the clicked individual
    // Check if clicked rectangle includes an individual name 
    if (Number.isInteger(clickedRectangle.nameOrder)) {
      // Change the title 
      defaultOption.text = 'Change name';
    }

    nameEditSelect.add(defaultOption);

    // Add all individual names to the options for editting tracks
    individualNames.forEach(name => {
      const option = document.createElement('option');
      option.text = name;
      option.value = individualNames.indexOf(name); // Order of name in the individual list file
      option.dataset.trackId = clickedRectangle.trackId;
      option.dataset.classId = clickedRectangle.classId;
      option.dataset.nameOrder = individualNames.indexOf(name);
      nameEditSelect.add(option);

    }); 

    // Populate select menu
    rightClickDiv.style.left = mouseX + 'px';
    rightClickDiv.style.top = mouseY + 'px';
    rightClickDiv.classList.remove('d-none');

  }

  /**
   * Show cursor pointer when user moves the mouse over the bounding boxes on the video canvas
   * @param {Event} event mousemove event
   */
  static showCursorOnBoxes(event) {
    const mainPlayer = Player.getMainPlayer();
    if (!mainPlayer) return;

    const boxesInFrame = mainPlayer.getTrackingBoxesInFrame();
    if (!Array.isArray(boxesInFrame)) return;

    const canvas = mainPlayer.getCanvas();
    if (!canvas) return;

    // Calculate clicked position relative to canvas 
    const widthRatio = canvas.width / canvas.clientWidth;
    const heightRatio =  canvas.height / canvas.clientHeight;
    const canvasRect = canvas.getBoundingClientRect();
    const mouseX = (event.clientX - canvasRect.left) * widthRatio;
    const mouseY = (event.clientY - canvasRect.top) * heightRatio;

    // Get the rectangles under the mouse
    const boxesUnderMouse = Player.getBoxesUnderMouse(mouseX, mouseY, boxesInFrame);

    // Reset the cursor style before changing it
    canvas.style.cursor = 'default';

    // Check if user is drawing
    if (!Player.isInDrawingMode()) {
      // Change the cursor style to pointer if mouse is over one of the rectangles
      if (Array.isArray(boxesUnderMouse) && boxesUnderMouse.length > 0) {
        canvas.style.cursor = 'pointer';
      }
      return;
    }
    
    // If drawing is enabled, show handles for resizing within tracking boxes
    if (Player.isInDrawingMode()) {
      // Detect whether mouse is over any of the handles
      const {box: box, handleName: handleName } = Player.isMouseInResizeHandle(boxesInFrame, mouseX, mouseY);
      
      // Get the active handle name
      if (!handleName) return;
      
      // Change the cursor to indicate resizing
      switch (handleName) {
        case 'tl':  // Top-left corner
          canvas.style.cursor = 'nwse-resize';
          break;
        case 'br':  // Bottom-right corner
          canvas.style.cursor = 'nwse-resize';
          break;
        case 'tr':  // Top-right corner
          canvas.style.cursor = 'nesw-resize';
          break;
        case 'bl':  // Bottom-left corner
          canvas.style.cursor = 'nesw-resize';
          break;
        case 'tc':  // Top-center
          canvas.style.cursor = 'ns-resize';
          break;
        case 'bc':  // Bottom-center
          canvas.style.cursor = 'ns-resize';
          break;
        case 'rc':  // Right-center
          canvas.style.cursor = 'ew-resize';
          break;
        case 'lc':  // Left-center
          canvas.style.cursor = 'ew-resize';
          break;
        default:
          canvas.style.cursor = 'default';
      }
  
    }

  }


  static interactiveBoxesEnabled() {
    return Player.areBoxesInteractive;
  }

  static enableInteractiveBoxes() {
    if (Player.areBoxesInteractive) return;
    Player.areBoxesInteractive = true;
  }

  static disableInteractiveBoxes() {
    if (!Player.areBoxesInteractive ) return;
    Player.areBoxesInteractive = false;
  }

  /**
   * Makes bounding boxes on tracking canvas clickable
   * @param {Event} event - clicked event
   * 
   */
  static makeBoxesInteractive(event) {
    // While user is drawing on canvas, prevent clicking on bounding boxes
    if (Player.isInDrawingMode()) return;

    const mainPlayer = Player.getMainPlayer();
    if (!mainPlayer) return;

    const boxesInFrame = mainPlayer.getTrackingBoxesInFrame();
    if (typeof boxesInFrame === "undefined" || !Array.isArray(boxesInFrame) || boxesInFrame.length < 1) return;

    const canvas = mainPlayer.getCanvas();
    if (!canvas) return;
        
    // Pause the video
    mainPlayer.pause();
    
    // Close previously opened menus on canvas
    if (!event.target.matches('#right-click-canvas-div')) {
      const dropdownEl = document.getElementById('right-click-canvas-div');
      if (dropdownEl) {
        dropdownEl.classList.add('d-none');
      }
    }

    if (!event.target.matches('#popover-canvas-div')) {
      const popoverEl = document.getElementById('popover-canvas-div');
      if (popoverEl) {
        const popover = bootstrap.Popover.getOrCreateInstance(popoverEl);
        popover.dispose();
      }
    }
    
    // Calculate clicked position relative to canvas 
    const canvasRect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - canvasRect.left;
    const mouseY = event.clientY - canvasRect.top;
    const widthRatio = canvas.width / canvas.clientWidth;
    const heightRatio =  canvas.height / canvas.clientHeight;

    // Get the clicked bounding boxes
    const clickedBBoxes = Player.getBoxesUnderMouse(mouseX*widthRatio, mouseY*heightRatio, boxesInFrame);
    if (!Array.isArray(clickedBBoxes)) return; 
    if (clickedBBoxes.length < 1) return;

    // Show toast to let user choose one of the overlapping boxes
    if (clickedBBoxes.length > 1) {
      showOverlappingTracksToast(clickedBBoxes);
    } else {
      showToastForBehaviorRecording({
        event: event, 
        clickedBBox: clickedBBoxes[0], 
        timestamp: mainPlayer.getCurrentTime(), 
        frameNumber: mainPlayer.getCurrentFrame()
      });

    }

  }

  /**
   * Disables interactive bounding boxes for a given time. 
   * It is called when user is drawing on a canvas over the main video 
   * to prevent accidental clicking on bounding boxes.
   * @param {Number} milliseconds Time period of non-interactivity in milliseconds
   */
  // disableInteractiveBoxes(milliseconds) {
  //   const delay = milliseconds ? milliseconds : 1000;
  //   Player.interactiveBoxesDisabled = true;
  //   setTimeout(() => {
  //     Player.interactiveBoxesDisabled = false;
  //   }, delay)


  // }
  

  /**
   * Draws snapshots for the current frame to a modal element 
   * @returns 
   */
  drawSnapshot() {
    if (this.wasErrorOnLoad) return;

    this.pause();

    const modalEl = document.getElementById(Player.snapshotModalId);
    if (!modalEl) return;

    // Set the src of the image element to the snapshot
    // HTML Element to show snapshot to user
    const snapshotImg = document.getElementById('snapshot');
    if (!snapshotImg) return;
    
    // Get the tracking boxes from canvas if it is available
    const tracking = this.canvas;

    // Create new canvas for snapshot
    const canvas = document.createElement('canvas');
    
    // Adjust snapshot dimensions
    const video = this.el;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw images to snapshot canvas
    let ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(tracking, 0, 0, canvas.width, canvas.height);
  
    // JPEG quality (1.0 -> highest, 0 -> lowest) 
    const quality = 1.0;
    
    // Convert the canvas to image data
    let imageData = canvas.toDataURL('image/png', quality);
    snapshotImg.src = imageData;
    snapshotImg.classList.remove('d-none'); // Show the snapshot

    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    const playerName = this.name;
    const currentFrame = this.getCurrentFrame();
    const snapshotTitle = modalEl.querySelector('#snapshot-modal-title');
    if (snapshotTitle) {
      snapshotTitle.textContent = `Snapshot for ${playerName} at frame ${currentFrame}`
    }

    // Save the snapshot data to Player instance to write it to a file later
    this.snapshotData = {
      videoName: playerName, 
      canvasData: snapshotImg.src, // 'image/png' for PNG format,
      frameNumber: currentFrame,
      fileExtension: 'png',
      labelRows: null
    }

    // Handle hiding tracking boxes with user input
    const hideTrackingBtn = modalEl.querySelector('#hide-tracking-btn');
    if (hideTrackingBtn) {
      hideTrackingBtn.checked = this.canvas.classList.contains('d-none');
      hideTrackingBtn.addEventListener('change', () => {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        if (!hideTrackingBtn.checked) {
          ctx.drawImage(tracking, 0, 0, canvas.width, canvas.height);
        }
        // Save canvas data to image element
        imageData = canvas.toDataURL('image/png', quality);
        snapshotImg.src = imageData; 
        snapshotImg.classList.remove('d-none');// Show the snapshot

        // Update the snapshot source
        this.snapshotData.canvasData = snapshotImg.src;
        

      })
    }

    // Show the modal
    modal.show();


  }

  /**
   * Updates the label data for the tracks on the snapshot depending on the user choice by toggling the checkbox on the modal.
   * @returns {Object | undefined} result Object with withLabels and countObj keys.
   * @returns {Object} result.countObj Object with the updated (classId, runningCount) key-value pairs if exporting labels is selected. Undefined if an error occurs.
   * @returns {Boolean} result.withLabels False if exporting labels option is deselected, true otherwise.
   * 
   */
  updateLabelDataForSnapshot() {
    const trackingMap = this.getTrackingMap();
    if (!(trackingMap instanceof TrackingMap)) {
      showAlertToast('No tracking data could be found! Please try again.', 'error', 'Failed to Export Snapshot Data');
      return;
    } 

    const modalEl = document.getElementById(Player.snapshotModalId);
    if (!modalEl) {
      showAlertToast('DOM element for snapshots could not be found! Please try again.', 'error', 'Failed to Export Snapshot Data');
      return;
    }
    
    // Export tracking labels with the screenshot if that option is selected by the user
    const exportLabelsBtn = modalEl.querySelector('#export-snapshots-labels-btn');
    if (!exportLabelsBtn) {
      showAlertToast('No button for exporting labels could be found!', 'error', 'Failed to Export Snapshot Data');
      return;
    }

    // Get the check button for resetting class counts
    const resetCountsBtn = modalEl.querySelector('#reset-class-running-counts-btn');
    if (!resetCountsBtn) {
      showAlertToast('No button for resetting class counts could be found!', 'error', 'Failed to Export Snapshot Data');
      return;
    }
    
    // Reset the class running counts if that option is selected
    if (resetCountsBtn.checked) {
      const isReset = trackingMap.resetClassRunningCounts();
      if (!isReset) {
        showAlertToast('Failed to reset class counts! Please try again.', 'error', 'Failed to Export Snapshot Data');
        return;
      }
    }

    // Initialize the result object
    const result = {
      withLabels: true,
      countObj: {}  // Initialize a object for {classID, runningCount} pairs
    };

    // If the export label option is not selected, reset the label data and return
    if (!exportLabelsBtn.checked){
      this.snapshotData.labelRows = null;
      result.withLabels = false;
      return result;
    }

    // Get the data for tracks in the frame if the option is selected
    const tracksInFrame = trackingMap.getTracksByFrame?.(this.getCurrentFrame());
    if (!Array.isArray(tracksInFrame)) return;

    // Get the video dimensions for normalization
    const videoWidth = this.getVideoWidth?.();
    const videoHeight = this.getVideoHeight?.();

    // Initialize the result array consisting of Arrays for each track
    // Each inner array will be a row in the exported file
    // Each element of each inner array will be a column in the exported file
    // Each inner array has the following elements in the following order.
      // Class ID, 
      // Running occurrences per class, 
      // Normalized x-center, 
      // Normalized y-center, 
      // Normalized width,
      // Normalized height
      // Individual ID (optional)
    const labelArr = []

    // Construct the title array
    const titleArr = [
      'class_id', 
      'running_count', 
      'x_center_norm', 
      'y_center_norm', 
      'width_norm',
      'height_norm', 
      'individual_id',
      'individual_name'
    ];

    labelArr.push(titleArr);

    // Iterate over each track/bounding box in the frame
    tracksInFrame.forEach(bBox => {
      if ( !(bBox instanceof BoundingBox) ) return;

      // Get the track width and height
      const trackWidth = bBox.getWidth?.();
      const trackHeight = bBox.getHeight?.();

      // Get the class ID
      const classId = bBox.getClassId?.();

      // Calculate the current running count
      // If class ID is in the Count Map, get its count and add 1 
      // If class ID is NOT in the Count Map, get its value from TrackingMap, add 1, and finally add it to the Map
      console.log(trackingMap)
      const runningCount = 1 + (result.countObj.hasOwnProperty(classId) ? result.countObj[classId] : trackingMap.getClassRunningCount?.(classId));
      if (!Number.isSafeInteger(runningCount)) return; // Error checking
      result.countObj[classId] = runningCount;  // Update the return Object

      // Calculate the normalized x-center 
      const xCenterNorm = (bBox.getX?.() + trackWidth / 2) / videoWidth;

      // Calculate the normalized y-center 
      const yCenterNorm = (bBox.getY?.() + trackHeight / 2) / videoHeight;

      // Calculate the normalized width
      const widthNorm = trackWidth / videoWidth;

      // Calculate the normalized height
      const heightNorm = trackHeight / videoHeight;

      // Add individual ID (i.e. nameOrder if it exists)
      const individualId = bBox.getNameOrder() ?? '';
      const individualName = individualId === '' ? '' : Player.getIndividualNames()?.at?.(individualId);
      
      // Populate the values of the object for each track
      const trackDataArr = [
        classId, // classId
        runningCount,  // Running occurrences per class across screenshots
        xCenterNorm,  // Normalized X-center (X-center of track divided by video width)
        yCenterNorm,  // Normalized Y-center (Y-center of track divided by video height)
        widthNorm,  // Normalized width (width of track divided by video width)
        heightNorm, // Normalized height (height of track divided by video height)
        individualId, // Integer index of individual name in the name array
        individualName  // Name of the individual
      ];

      // Add object to the final array
      labelArr.push(trackDataArr);

    });

    // // If some classes are not present in the snapshot, add their running count to final data
    // const classIds = trackingMap.getClassIds();
    // classIds.forEach(classId => {
    //   if (result.countObj.hasOwnProperty(classId)) return;
    //   result.countObj[classId] = trackingMap.getClassRunningCount(classId);
    // });

    // Add the label data to the snapshot data
    this.snapshotData.labelRows = labelArr;

    // Always hide bounding boxes on the snapshot when exporting label data is selected
    // Create a canvas to draw snapshot from video
    const canvas = document.createElement('canvas');
    
    // Adjust canvas/image dimensions
    const videoEl = this.el;
    canvas.width = videoEl?.videoWidth;
    canvas.height = videoEl?.videoHeight;
    
    // Draw image without tracking
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
      
      // Update the canvas data
      this.snapshotData.canvasData = canvas.toDataURL('image/png', 1.0);

    }

    return result;

  }

  /**
   * Saves the drawn snapshot on the modal element to a image file
   * @returns 
   */
  async saveSnapshot() {
    const modalEl = document.getElementById(Player.snapshotModalId);
    if (!modalEl) return;

    if (!this.snapshotData) {
      showAlertToast('No data for snapshot could be found!', 'error');
      return;
    }
    
    // Export tracking labels with the screenshot if that option is selected by the user
    const exportLabelsBtn = modalEl.querySelector('#export-snapshots-labels-btn');
    if (!exportLabelsBtn) {
      showAlertToast('No button for exporting labels could be found!', 'error');
      return;
    }

    // Update the label data before exporting the file(s)
    const result = this.updateLabelDataForSnapshot();
    if (typeof result === 'undefined') {
      showAlertToast('Please try again!', 'error', 'Failed to Export Snapshot Data');
      return;
    }

    const exportDirPath = await window.electronAPI.saveSnapshot(this.snapshotData);
    if (!exportDirPath) {
      showAlertToast('Export directory is invalid! Please try again.', 'error', 'Failed to Export Snapshot Data');
      return;
    }

    // If label export option is selected
    if (result.withLabels) {
      // Get the count object
      const countObj = result.countObj;
      console.log('count object from snapshot data:', countObj);
      if ( (!countObj instanceof Object) ) {
        showAlertToast('Please try again!', 'error', 'Failed to Export Snapshot Data');
        return; 
      }

      // Get the TrackingMap
      const trackingMap = this.getTrackingMap?.();
      if ( !(trackingMap instanceof TrackingMap) ) {
        showAlertToast('No tracking data could be found! Please try again.', 'error', 'Failed to Export Snapshot Data');
        return
      }

      // Update the running counts in TrackingMap
    for (const [classId, runningCount] of Object.entries(countObj)) {
      // Attempt the set the new count
      const newCount = trackingMap.setClassRunningCount(classId, runningCount);
      if (!Number.isSafeInteger(newCount)) {
        showAlertToast(
          `Failed to set the running count of <span class="badge text-bg-dark">Class ${classId}</span> to <span class="badge text-bg-dark">${runningCount}</span>! Please try again.`, 
          'error', 
          'Failed to Export Snapshot Data'
        );
        return;
      }
    }

    // Save the changes to the Player class
    const updatedCounts = trackingMap.getClassRunningCounts?.();
    console.log('Updated class running counts: ', updatedCounts);
    if ( !(updatedCounts instanceof Object) ) {
      showAlertToast(
        'Saving class running counts failed! Please try again.', 
        'error', 
        'Failed to Save Class Running Counts'
      );
      return;
    }
  
    // Save the changes to the config
    Config.classRunningCounts = updatedCounts;
    const response = await Config.saveToFile();
    if (!response) {
      showAlertToast(
        'Saving class running counts failed! Please try again.', 
        'error', 
        'Failed to Save Class Running Counts'
      );
      return;
    }
      
  }

    

    
   
    // Hide the modal
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.hide();

    // Show success alert
    showAlertToast(
      `Snapshot data exported to <span class="badge text-bg-dark xx-small">${exportDirPath}</span>`,
      'success', 
      'Snapshot Data Exported'
    );

  }

  /**
   * Shows modal with a frame which contains all class and lets user assign names to each class
   * @param {Number | String | undefined} frameWithAllClass Number of frame in which there is at least one member from each class
   */
  showModalForClassNaming(frameWithAllClass) {
    const modalEl = document.getElementById('class-names-modal');
    if (!modalEl) return;
    
    // Draw this frame into the modal                
    const videoEl = this.el;  // Get the video element
    const trackingCanvas = this.canvas; // Get the tracking canvas
    if (!videoEl || !trackingCanvas) return;

    const formEl = modalEl.querySelector('#class-names-colors-form');
    if (!formEl) return;

    const trackingMap = Player.getMainPlayer()?.getTrackingMap();
    if (!trackingMap) return;
    
    const classMap = trackingMap.getClassMap();
    if (!(classMap instanceof Map)) return; 

    // Get the class count
    const classCount = classMap.size;
    if (classCount < 1) return;

    const inputColEl = formEl.querySelector('.input-col');
    if (!inputColEl) return;

    // Clear the outer element contents to avoid duplicates
    while (inputColEl.firstChild) {
      inputColEl.removeChild(inputColEl.firstChild);
    }

    // Get random colors for each class
    const colorCodes = getRandomColors(classCount);
    if (!colorCodes || !Array.isArray(colorCodes)) return;
    
    // Iterate over all class in the tracking file
    classMap.values().forEach((valueObj, idx) => {
      // Destructuring assignment
      const { id: classId, name: className, color: classColor } = valueObj;

      // Assign a random color if no class color was assigned before
      if (!classColor) {
        const isColorChanged = trackingMap.setClassColor(classId, colorCodes[idx]);
        if (!isColorChanged) return;
      }

      // Get the updated color
      const newColor = trackingMap.getClassColor(classId);
      
      const idText = `class-id-${classId}`;
      // Create input elements for each class
      const outerRow = document.createElement('div');
      outerRow.classList.add('row', 'mb-2');

      const colorCol = document.createElement('div');
      colorCol.classList.add('col-auto');

      const colorInput = document.createElement('input');
      colorInput.type = 'color';
      colorInput.classList.add('form-control', 'form-control-sm', 'form-control-color', 'class-color-input', idText);
      colorInput.value = newColor;
      colorInput.id = `color-${idText}-class-modal` ;
      colorInput.alpha = 'true';

      // const colorLabel = document.createElement('label');
      // colorLabel.setAttribute('for', colorInput.id);
      // colorLabel.textContent = `Color of class ${classId}`;
      // colorLabel.classList.add('col-form-label', 'col-form-label-sm');
      
      const validColorEl = document.createElement('div');
      validColorEl.classList.add('valid-feedback');
      validColorEl.textContent = 'Looks good!';

      const invalidColorEl = document.createElement('div');
      invalidColorEl.classList.add('invalid-feedback');
      invalidColorEl.textContent = 'Please pick a color.';

      const nameCol = document.createElement('div');
      nameCol.classList.add('col-auto');
      
      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.classList.add('form-control', 'form-control-sm', 'class-name-input', idText);
      nameInput.id = `name-${idText}-class-modal`;
      nameInput.placeholder = `Name of class ${classId}`;
      
      // Get the text element for brief explanation
      const textEl = modalEl.querySelector('.modal-text');
      
      // Assign value to name input if it has a predefined value
      if (className) {
        nameInput.value = className;
        
        // Change the modal text if name input has a predefined value
        if (textEl) textEl.textContent = 'Saved class data found. Please verify or update.'

      } else {
        // Change the modal text if name input does not have any predefined value
       if (textEl) textEl.textContent = 'Please pick a color and assign a name for each class.';

      }
      nameInput.required = true;

      // const nameLabel = document.createElement('label');
      // nameLabel.textContent = `Name of class ${classId}`;
      // nameLabel.classList.add('col-form-label', 'col-form-label-sm');
      // nameLabel.setAttribute('for', nameInput.id);

      const labelCol = document.createElement('div');
      labelCol.classList.add('col-sm-3', 'col-form-label', 'col-form-label-sm');
      labelCol.textContent = `Class ${classId}`;
      labelCol.setAttribute('for', nameInput.id);

      // Prevent clashes with hotkeys when user is typing
      nameInput.addEventListener('focus', Player.userIsTyping);
      nameInput.addEventListener('blur', Player.userStoppedTyping);

      // Event listener for color change
      colorInput.addEventListener('change', async () => {
        const response = await Player.setClassColor(classId, colorInput.value);
        if (!response) {
          showAlertToast('Please try again.', 'error', 'Failed to Assign Colors');
          return;
        }

        // Reflect the change immediately to the snapshot
        // Save the current frame before going to the frame with all class
        const currentFrame = this.getCurrentFrame();
        const frameToSeek = frameWithAllClass ? frameWithAllClass : currentFrame;

        // Redraw the snapshot with updated colors
        videoEl.addEventListener('seeked', videoSeekedHandler)
        
        // Go the first frame which contains at least one of each class
        this.setCurrentFrame(frameToSeek);

      })

      // const textLabel = document.createElement('label');
      // textLabel.setAttribute('for', colorInput.id);
      // textLabel.textContent = `Color and name of class ${classId}`;
      // textLabel.classList.add('form-label');
      // textLabel.setAttribute('for', colorInput.id);
      
      const invalidNameEl = document.createElement('div');
      invalidNameEl.classList.add('invalid-feedback');
      invalidNameEl.textContent = 'Please provide a name.';
      
      const validNameEl = document.createElement('div');
      validNameEl.classList.add('valid-feedback');
      validNameEl.textContent = 'Looks good!';

      // Append DOM elements to this modal
      // nameCol.append(nameLabel, nameInput, invalidNameEl, validNameEl);
      // colorCol.append(colorLabel, colorInput, invalidColorEl, validColorEl);


      // Populate the outer element with newly created DOM elements
      nameCol.append(nameInput, invalidNameEl, validNameEl);
      colorCol.append(colorInput, invalidColorEl, validColorEl);
      outerRow.append(labelCol, nameCol, colorCol);
      inputColEl.append(outerRow);

        
      // // Append DOM elements to settings modal
      // if (settingsOuterEl) {
      //   const clonedRow = outerRow.cloneNode(true);
      //   settingsOuterEl.append(clonedRow);
      // }


    });

    // Move the class name assigning button inside the col element
    const btnNameAssign = modalEl.querySelector('#btn-assign-class-names-modal');
    const rowNameAssign = btnNameAssign?.parentElement?.parentElement?.parentElement;
    if (rowNameAssign) {
      inputColEl.appendChild(rowNameAssign);
    }

    // Save the current frame before going to the frame with all class
    const currentFrame = this.getCurrentFrame();
    const frameToSeek = frameWithAllClass ? frameWithAllClass : currentFrame;

    // Go the first frame which contains at least one of each class
    videoEl.addEventListener('seeked', videoSeekedHandler)

    this.setCurrentFrame(frameToSeek);
    
    function videoSeekedHandler(e) {
      const bootstrapModal = bootstrap.Modal.getOrCreateInstance(modalEl);
     
      // Check if the frame is loaded
      if (e.target.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        
        // Create new canvas for holding image data 
        const dataCanvas = document.createElement('canvas');  
        dataCanvas.width = videoEl.videoWidth;
        dataCanvas.height = videoEl.videoHeight;
        const ctx = dataCanvas.getContext('2d');
        if (!ctx) return;
        
        // Draw the frame to canvas
        ctx.drawImage(videoEl, 0, 0, dataCanvas.width, dataCanvas.height);
        ctx.drawImage(trackingCanvas, 0, 0, dataCanvas.width, dataCanvas.height);
    
        // Convert the canvas to image data
        const imageData = dataCanvas.toDataURL();
        const imageEl = modalEl.querySelector('img');

        // Set the image source to image data
        if (imageEl) {
          imageEl.src = imageData;
          imageEl.classList.remove('d-none')
        }

        // Go back to the last frame
        Player.setCurrentFrameAll(currentFrame);

        // Show the modal
        bootstrapModal.show();

      }

      videoEl.removeEventListener('seeked', videoSeekedHandler);

    }


  }


  /**
   * Checks the user input for class attributes (names, colors, etc.) and saves the valid input.
   * @param {Event} e Click event over class name change confirm button
   */
  static async handleClassAttrChange(e) {
    const mainPlayer = Player.getMainPlayer();
    if (!mainPlayer) return;

    // Get the form element for class colors and names
    const outerEl = document.getElementById('class-names-colors-form');
    if (!outerEl) return;

    // Get the modal element
    const modalEl = document.getElementById('class-names-modal');
    
    // Get the name input element for each class
    const nameInputEls = outerEl.querySelectorAll('.class-name-input');

    // Extract the name input values
    const nameValues = Array.from(nameInputEls).map(inputEl => inputEl.value);

    // Check if user provided a value for each class
    if (nameValues.some(value => value === '')) {
      const popover = new bootstrap.Popover(nameInputEls[0], {
        container: 'body',
        content: 'Each class must have a name!',
        placement: 'top',
        title: 'Empty Field',
        customClass: 'error-popover',
        trigger: 'manual'
      });

      popover.show();
      setTimeout(() => {
        popover.hide();
      }, 3000);
      return;
    }

    // Check for duplicate values
    const duplicateNames = nameValues.filter((value, index) => nameValues.indexOf(value) !== index && nameValues.lastIndexOf(value) === index);
    if (duplicateNames.length > 0 && !duplicateNames.every(el => el === '')) {
      const popover = new bootstrap.Popover(nameInputEls[0], {
        container: 'body',
        content: 'Each class must have a unique name!',
        placement: 'top',
        title: 'Duplicate Names',
        customClass: 'error-popover',
        trigger: 'manual'
      });

      popover.show();
      setTimeout(() => {
        popover.hide();
      }, 3000);
      return;

    }

    let hasError;
    nameInputEls.forEach(nameInputEl => {
      const nameInput = nameInputEl.value;
      
      // Check whether the user provided any name
      if (nameInput !== '') {

        // Extract the class ID from the DOM elements
        const classSuffix = 'class-id-'
        const classIdStr = Array.from(nameInputEl.classList).find(className => className.includes(classSuffix));
        if (!classIdStr) return;
        const classId = classIdStr.split(classSuffix)[1];

        // Save the new name to TrackingMap class, to settings menu and to metadata file
        Player.setClassName(classId, nameInput).then(response => {
          if (!response) {
            showAlertToast('Failed to save class name!', 'error');
            hasError = true;
            return;
          }
        });

        // Get the relevant color input element
        const colorInputEl = outerEl.querySelector(`.class-color-input.${classSuffix}${classId}`);
        if (!colorInputEl) return;
        
        // Set color of the class
        const classColor = colorInputEl.value;        
        Player.setClassColor(classId, classColor).then(response => {
          if (!response) {
            showAlertToast('Please try again.', 'error', 'Failed to Assign Color');
            hasError = true;
            return;
          }
        });

      }

    });

    if (modalEl && !hasError) {
      const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

      const isSuccess = Player.setClassMap({
        ids: Player.getClassIds(), 
        names: Player.getClassNames(), 
        colors: Player.getClassColors(), 
        runningCounts: Player.getClassRunningCounts()
      });

      if (!isSuccess) {
        showAlertToast('Please try again.', 'error', 'Failed to Save Class Attributes');
        return;
      }

      // Check if the class name assigning to indivs button is checked
      const nameAssignBtn = modalEl.querySelector('#btn-assign-class-names-modal');
      if (nameAssignBtn && nameAssignBtn.checked) {
        const response = await Player.handleAssignClassNamesBtnClick();
        if (!response) {
          showAlertToast('Please try again.', 'error', 'Failed to Save Class Attributes');
          return;
        }
      }
      
      modal.hide();
      showAlertToast('Class names and colors saved!', 'success');

    }    


  }

  
}


// Button
class Button {
  cssSelector;

  constructor(cssSelector) {
    this.el = document.querySelector(cssSelector);
    if (!this.el.querySelector('span')) {
      this.iconEl = document.createElement('span');
      this.el.appendChild(this.iconEl);
    }
    this.iconEl = this.el.querySelector('span');

  }

  // Add an event listener and its callback function
  on(event, callBackFunction) {
    this.el.addEventListener(event, callBackFunction);
  }

  setIcon(iconText, iconSize = 'size-24', iconClass = 'material-symbols-rounded', iconColor = 'text-black') {
    this.iconEl.innerText = iconText;
    this.iconEl.classList.add(iconClass, iconSize, iconColor);
  }

  addClass(className) {
    this.iconEl.classList.add(className);
  }

  removeClass(className) {
    this.iconEl.classList.remove(className);
  }

}

// Input class for range elements (and maybe others)
class Input {
  cssSelector;

  constructor(cssSelector) {
    this.el = document.querySelector(cssSelector);
  }

   // Add an event listener and its callback function
   on(event, callBackFunction) {
    this.el.addEventListener(event, callBackFunction);
  }

  getValue() {
    return this.el.value;
  }

  getMax() {
    return this.el.max;
  }

  getMin() {
    return this.el.min;
  }

  setValue(value) {
    this.el.value = value;
  }

  setMax(value) {
    this.el.max = value;
  }

  setMin(value) {
    this.el.min = value;
  }

  setLabels(textArray) {
    const labelEls = this.el.labels;

    if (labelEls && labelEls.length === textArray.length) {
      for (let i = 0; i < labelEls.length; i++) {
        labelEls[i].textContent = textArray[i];
      }
      // return labelEls.map((labelEl, index) => {
      //   labelEl.textContent = textArray[index];
      // });
    } else {
      console.log("Provide a string array as the number of labels for the input!")
      return
    }
  }

}


class ControlBar {
  cssSelector;

  constructor(cssSelector) {
    this.el = document.querySelector(cssSelector);
    this.progressBar = this.el.querySelector('#progress-bar');
    this.progress = this.el.querySelector('#progress');
    this.currentTimeDiv = this.el.querySelector('#current-time'); // Current time in minutes and seconds
    this.currentFrameDiv = this.el.querySelector('#current-frame'); // Current time in frames
    this.totalTimeDiv = this.el.querySelector('#total-time'); // Total time in minutes and seconds
    this.totalFramesDiv = this.el.querySelector('#total-frames'); // Total time in frames
    this.attachedPlayers = [];
  }

  // Add an event listener and its callback function
  on(event, callBackFunction) {
    this.el.addEventListener(event, callBackFunction);
  }

  updateProgressBar() {
    // Move progress bar according to the current time 
    if (this.attachedPlayers.length > 0) {
      const currentTimeRatio = (this.attachedPlayers[0].getCurrentTime() / this.attachedPlayers[0].getDuration()) * 100; // Calculate the percentage
      this.progress.style.width = currentTimeRatio + '%'; // Move the bar according to this percentage

      // Show current and remaining time
      const currentTime = this.attachedPlayers[0].getCurrentTime();
      const duration = this.attachedPlayers[0].getDuration();
      this.currentTimeDiv.textContent = formatSeconds(currentTime);
      this.currentFrameDiv.textContent = secondsToFrames(currentTime);
      this.totalTimeDiv.textContent = formatSeconds(duration);
      this.totalFramesDiv.textContent = secondsToFrames(duration);


      // const progressRange = document.getElementById('progress-range');
      // progressRange.min = 0;
      // progressRange.max = this.attachedPlayers[0].getDuration()
      // progressRange.value = this.attachedPlayers[0].getCurrentTime();

    }
    
  }

  updatePlayer(e) {
    if (this.attachedPlayers.length > 0) {
      this.attachedPlayers.foreach(player => player.pause());
      const progressBarRect = this.progressBar.getBoundingClientRect();
      const clickPosition = e.clientX - progressBarRect.left;
      const percentage = (clickPosition / progressBarRect.width) * 100;
      const videoTime = (percentage / 100) * this.attachedPlayers[0].getDuration();
      this.attachedPlayers.foreach(player => player.setCurrentTime(videoTime));
    }
  }


}





class Ethogram {

  constructor(obj) {
    
    // Ethogram file path in user data directory
    this.pathInUserDataDir;

    // Observations
    this.observations = new Map();
    
    // Update insertionIndex if an object is given in the constructor
    // Useful for retrieving JSON data as object from config files
    if (obj) {
      this.observations = new Map(Object.entries(obj));
    
    }
  }

  getInsertionIndex() {
    // Get the keys and convert them to integers
    const keyIndices = Array.from(this.observations.keys()).map(key => parseInt(key));

    // Set the insertion index to 0 by default
    // Check if the key array is not empty
    // Find the largest index and add 1 to get the insertion index for new observation 
    const newObsIndex = keyIndices.length <= 0 ? 0 : Math.max(...keyIndices) + 1;

    // Return the insertion index
    return newObsIndex;
    
  }

  getAllObservations() {
    return this.observations;
  }

  /**
   * Converts all custom Observation instances to ordinary Objects
   * Necessary to pass observation to functions in the main.js
   * @returns {Object[]} - Array of objects converted from observations
   */
  getAllAsObjects() {
    const observationArr = [...this.observations.values()]
    .map(observation => Object.fromEntries(observation.entries));

    return observationArr;

  }


  
  getObservation(obsIndex) {
    if (!Number.isInteger(parseInt(obsIndex))) {
      console.log('Observation index must be provided!')
      return;
    }

    return this.observations.get(obsIndex.toString());

  }

  /**
   * Adds an observation to the ethogram
   * @param {Observation} obs - Observation to be added 
   * @param {Boolean | undefined} doNotWriteToFile - Do not write observation to file if true 
   * @returns {Boolean} - True if the insertion is successful, False otherwise
   */
  async add(obs, doNotWriteToFile) {
    // Get the insertion index from the Observation to be added
    const indexInObs = parseInt(obs.get('index'));
    
    // If no index exists inside the Observation, get the insertion index from Ethogram
    const newObsIndex = Number.isInteger(indexInObs) ? indexInObs : this.getInsertionIndex();

    // Add new observation object as the value of this insertion key index
    const newObs = this.observations.set(newObsIndex.toString(), obs);

    // Save changes to the file
    if (!doNotWriteToFile) await this.saveToFile();

    return newObs.has(newObsIndex.toString());

  }

  /**
   * Update an observation 
   * @param {*} obsIndex - Observation index
   * @param  {...Array} entries - Array of key-value pairs
   */
  async update(obsIndex, ...entries) {
    // Get the Observation at the given index
    const observation = this.observations.get(obsIndex.toString());
    
    // Validate the selected observation
    if (observation && observation instanceof Observation) {
      
      // Update the entries of the observation
      for (const [key, value] of entries) {
        observation.update([key, value]);
      }

    }

    // Return confirmation
    const isSuccess = [...entries].every(([key, value], index, entries) => { 
      if (this.observations.has(obsIndex.toString())) {
        return this.observations.get(obsIndex.toString()).get(key) === value;

      }
    });

    if (isSuccess) {
      const response = await this.saveToFile();
    }

    return isSuccess;


  }

  /**
   * Removes an observation from the ethogram
   * @param {Number | String} obsIndex - Index of the observation to be removed
   * @returns {Boolean} - True if the removal was successful
   */
  async remove(obsIndex) {
    const isDeleted = this.observations.delete(obsIndex.toString());
    if (isDeleted) {

      const response = await this.saveToFile();

      if (response) return true;

    }

  }

  /**
   * Gets the number of records in the ethogram
   * @returns {Number} - Size of the ethogram
   */
  size() {
    return this.observations.size;
  }

  /**
   * Removes all observations from the ethogram
   * @returns 
   */
  async clear() {
    this.observations.clear();

    const response = await this.saveToFile();
    if (response) {
      // Clear behavior table
      clearEthogramTable();
      return 'Ethogram cleared!';
    }

  }

  async saveToFile() {
    
    // Get the recorded behaviors and 
    // Convert each Observation object to regular JS Object
    // const observationArr = [...this.getAllObservations().values()]
    //   .map(observation => Object.fromEntries(observation.entries));
    const observationArr = this.getAllAsObjects();

    const mainPlayer = Player.getMainPlayer();
    if (mainPlayer) {
      // Get the metadata
      const videoName = mainPlayer.getName();
      const videoFPS = mainPlayer.getFrameRate();
      const username = Player.getUsername();

      // Write the metadata
      const withMetadata = false;

      // Save the recorded behavior to the file in user data directory
      const filePath = await window.electronAPI.writeBehaviorsToFile(observationArr, videoName, videoFPS, username, withMetadata);
      
      // Flag success or failure
      const isFailed = !filePath;

      if (filePath) {
        // Show last edit time for the ethogram file
        Player.showLastEditForEthogram(filePath, isFailed);

      }

      return filePath;

    }

  
  }


}

class TrackingMap {

  // Color palette for bounding 
  static colorPalette = new Map([
    [ 'Cyan', '#00FFFF' ], 
    [ 'Red', '#FF0000' ],
    [ 'Orange', '#FFA500' ], 
    [ 'Blue', '#0000FF'],
    [ 'White', '#FFFFFF'], 
    [ 'LightGray', '#D3D3D3'], 
    [ 'Lime', '#00FF00' ], 
    [ 'Fuchsia', '#FF00FF']
  ]); 

  /**
   * Editing the tracks
   * Functions:
   *  1. Deletion
   *  2. Changing track ID
   *  3. Changing class ID
   *  4. Changing name
   */
  
  /**
   * Set the tracking map for an instance
   * @param {Object | undefined} obj
   * @param {Object[] | undefined} obj.tracks Array of track objects
   * @param {String[] | undefined} obj.classNames 
   * @param {String[] | undefined} obj.classColors
   */
  constructor({ tracks, classNames, classColors } = {}) {
    this.masterArr = new Array();
    // Create a Frame Map with frame numbers as keys and relevant elements from the master track Array as values
    // key: track/frame numbers in String type, values: trackArr[idx]
    this.idMap = new Map();
    this.frameMap = new Map();
    this.classMap = new Map();
    this.createMasterArr(tracks); // It also creates ID and Class Maps
    // this.createIdAndFrameMaps();
    this.createClassMap({
      classNames: classNames,
      classColors: classColors
    }); // classId: { id: classId, name: className, color: classColor } 

  }

  /**
   * Convert track Objects to BoundingBox instances
   * @param {Object[]} objArr Array of track Objects
   * @returns {BoundingBox[]} Array of BoundingBox instances
   */
  createMasterArr(objArr) {
    if (!Array.isArray(objArr)) return;
    
    const masterArr = this.masterArr;
    if (!Array.isArray(masterArr)) return;

    // Convert tracking objects to BoundingBoxes and add them to TrackingMap, update. ID and Class maps
    this.add(objArr);
    
    
  }

  /**
   * Creates ID and Frame Maps. 
   * frameMap: Frame numbers as keys and sub-array of track objects as values from a given track array.
   * idMap: Class and track IDs as keys and sub-array of track objects as values from a given track array.
   * @param {Object[] | undefined} trackObjArr If no argument is given, it will use the master array of this instance
   * @returns 
   */
  createIdAndFrameMaps(trackObjArr) {
    const masterArr = trackObjArr ?? this.masterArr;
    if (!masterArr || !Array.isArray(masterArr)) return;
    
    // Get the ID Map (class and track IDs as keys)
    const idMap = new Map();

    // Get the frame Map (track/frame numbers as keys)
    const frameMap = new Map();

    // Populate the frameMap
    masterArr.forEach((bBox, idx) => {

      // Create a Map with classes and track IDs as the keys
      // const idObj = { classId: { trackId: idxArr (array of indices in the master array for this track ID) }}
      this.updateIdAndFrameMaps({
        bBox: bBox,
        index: idx,
        idMap: idMap,
        frameMap: frameMap
      });

    });

    // Set ID and Frame Maps
    this.idMap = idMap;
    this.frameMap = frameMap;

  }

  /**
   * Creates a Map with frame numbers as keys and sub-array of track objects as values from a given track array
   * @param {Object[] | undefined} trackObjArr If no argument is given, it will use the track array of this instance
   * @returns {Map<String, Number[]> | undefined}
   */
  createFrameMap(trackObjArr) {
    // Validity check
    const trackArr = trackObjArr ?? this.masterArr;
    if (!trackArr || !Array.isArray(trackArr)) return;
    
    // Get the frame Map (track/frame numbers as keys)
    // const frameMap = this.frameMap;
    // if (!frameMap || !(frameMap instanceof Map)) return;
    const frameMap = new Map();
    
    // Populate the frameMap
    trackArr.forEach((trackObj, idx) => {
      // Convert frame/track number to String to be used in the Map for consistency
      // Use optional chaining: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining
      const trackNumber = trackObj.trackNumber?.toString(); 
      if (!trackNumber) return;

      if (!frameMap.has(trackNumber)) {
        frameMap.set(trackNumber, [idx]);  // Initialize an array for indices of track objects in the master array
      } else {
        const idxArr = frameMap.get(trackNumber);
        if (idxArr && Array.isArray(idxArr)) {
          idxArr.push(idx);  // Add indices of track objects in the master array
        }
      }

    });

    return frameMap;

  }

  /**
   * Creates a Map with class and track IDs as keys and sub-array of track objects as values from a given track array
   * @param {BoundingBox[] | undefined} bBoxArr If no argument is given, it will use the track array of this instance
   * @returns 
   */
  createIdMap(bBoxArr) {
    // Validity check
    const trackArr = bBoxArr ?? this.masterArr;
    if (!trackArr || !Array.isArray(trackArr)) return;
    
    // Get the ID Map (class and track IDs as keys)
    // const idMap = this.idMap;
    // if (!idMap || !(idMap instanceof Map)) return;
    const idMap = new Map();

    // Populate the frameMap
    trackArr.forEach((trackObj, idx) => {
      // Convert frame/track number to String to be used in the Map for consistency
      // Use optional chaining: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining
      
      this.updateIdMap({
        classId: trackObj.getClassId?.()?.toString(),
        trackId: trackObj.getTrackId?.()?.toString(),
        index: idx,
        idMap: idMap
      });


    });

    return idMap;

  }

  /**
   * Updates the ID Map for a given class ID, track ID and index of the track object in the master array
   * @param {Object} obj 
   * @param {BoundingBox} obj.bBox BoundingBox object for the track 
   * @param {Number | String | undefined} obj.index (Optional) Index of the BoundingBox in the master array. If it is not given, the BoundingBox instance should contain a "index" property.
   * @param {Map | undefined} obj.idMap (Optional) If it is not given, the idMap of this instance will be used.
   * @param {Map | undefined} obj.frameMap (Optional) If it is not given, the frameMap of this instance will be used.
   * @returns {Boolean} True if the operation was successful, false otherwise
   */
  updateIdAndFrameMaps(obj) {

    // Get the BoundingBox instance
    const bBox = obj.bBox;
    if (!(bBox instanceof BoundingBox)) return;

    // Get the idMap
    const idMap = obj.idMap ?? this.getIdMap();
    if (!(idMap instanceof Map)) return;

    // Get the frameMap
    const frameMap = obj.frameMap ?? this.getFrameMap();
    if (!(frameMap instanceof Map)) return;

    // Get the index of the BoundingBox in the master array
    const parsedIdx = parseInt(obj.index);
    const idx = Number.isSafeInteger(parsedIdx) && parsedIdx >= 0 ? parsedIdx : bBox.getIndex();
    if (!Number.isSafeInteger(idx) || idx < 0) return;

    // Get the class and track IDs and track number
    const classId = bBox.getClassId?.(); 
    const trackId = bBox.getTrackId?.(); 
    const trackNumber = bBox.getTrackNumber?.(); 

    // Check the validity of the IDs
    for (const idProp of [classId, trackId, trackNumber]) {
      if (typeof idProp === 'undefined' || idProp === null) return;
    }

    // If class ID is absent from the Map
    if (!idMap.has(classId)) {
      
      // Initialize the inner map for a given class
      idMap.set(classId, new Map([[ trackId, [idx] ]]));

    } else {
      // If class ID is already present, get the inner Map
      const classMap = idMap.get(classId);
      
      // If classMap does not contain the track ID
      if (!classMap.has(trackId)) {
        
        // Add track ID as a key to the inner map for a given class
        classMap.set(trackId, [idx]);

      } else {
        // If track ID is already in the inner Map
        // Add index of a track in the master array
        const idxArr = classMap.get(trackId);
        if (idxArr && Array.isArray(idxArr)) {
          idxArr.push(idx);
        }

      }

    }

    if (!frameMap.has(trackNumber)) {
      frameMap.set(trackNumber, [idx]);  // Initialize an array for indices of track objects in the master array
    } else {
      const idxArr = frameMap.get(trackNumber);
      if (Array.isArray(idxArr)) {
        idxArr.push(idx);  // Add indices of track objects in the master array
      }
    }

    return true;


  }

  /**
   * Creates a new class Map for the TrackingMap instance
   * @param {Object[] | undefined} obj 
   * @param {Object[] | undefined} obj.trackObjArr 
   * @param {String[] | undefined} obj.classNames
   * @param {String[] | undefined} obj.classColors
   * @returns {<String, Object>} Newly created Map with ( classId, { id, name, color, runningCount } ) key-value pairs
   */
  createClassMap({ trackObjArr, classNames, classColors } = {}) {
    // Validity check
    const trackArr = trackObjArr ?? this.masterArr;
    if (!Array.isArray(trackArr)) return;

    const idMap = this.getIdMap();
    if ( !(idMap instanceof Map) ) return;

    const classMap = this.getClassMap();
    if ( !(classMap instanceof Map) ) return;

    // Check if class name and color array length match with the class count
    const classCount = idMap.size;
    const nameCount = Array.isArray(classNames) ? classNames.length : Infinity;
    const colorCount = Array.isArray(classColors) ? classColors.length : Infinity;
    const matchingCounts = classCount === nameCount && classCount === colorCount;

    // Calculate and update class running counts from the config file depending on the classes in the current tracks
    const countConfigObj = Config.classRunningCounts;
    console.log('countConfigObj', countConfigObj);

    // Get the unique class IDs;
    idMap.keys().forEach((key, idx) => {
      const classId = key.toString(); 
      console.log(classId)
      console.log(`classId ${classId} in config?`, countConfigObj?.hasOwnProperty(classId))

      classMap.set(classId, {
        id: classId,
        name: matchingCounts ? classNames[idx] : null,
        color: matchingCounts ? classColors[idx] : null,
        runningCount: countConfigObj?.hasOwnProperty(classId) ? countConfigObj[classId] : -1  // Count the running number of tracks per class ID across snapshots when exporting labels with snapshots is selected
      });
      console.log(`runningCount for class ${classId}`, this.classMap?.get(classId)?.runningCount);
    });

    updateClassEls();

    return classMap;

  }

  /**
   * Resets the counts for the running number of tracks per class across snapshots when exporting labels with snapshots is selected.
   * @returns {Boolean | undefined} True if the operation is successful, undefined otherwise.
   */
  resetClassRunningCounts() {
    const classMap = this.getClassMap();
    if (!(classMap instanceof Map)) return;

    for (const classObj of Array.from(classMap.values())) {
      // In case of errors, return immediately
      if (!Object.hasOwn(classObj, 'runningCount')) return;

      // Reset the count to -1
      classObj.runningCount = -1;
    }

    return true;

  }

   /**
   * Gets the counts for the running number of tracks per class across snapshots when exporting labels with snapshots is selected.
   * @param {String | Number} classId Class ID
   * @returns {Number | undefined} Current running count if the operation is successful, undefined otherwise.
   */
  getClassRunningCount(classId) {
    // Validate the input
    const parsedClassId = classId ? classId.toString() : undefined;
    if (typeof parsedClassId === 'undefined') return;

    // Get the class Map
    const classMap = this.getClassMap();
    if (!(classMap instanceof Map)) return;

    // Check if the class ID is in the class Map
    if (!classMap.has(parsedClassId)) return;

    // Get the class object
    const classObj = classMap.get(parsedClassId);

    // In case of errors, return immediately
    if (!Object.hasOwn(classObj, 'runningCount')) return;

    return classObj.runningCount;

  }

   /**
   * Sets the count for the running number of tracks per class across snapshots when exporting labels with snapshots is selected.
   * @param {String | Number} classId Class ID
   * @param {Number | String} runningCount Running count must be non-negative integer
   * @returns {Number | undefined} Updated running count if the operation is successful, undefined otherwise.
   */
  setClassRunningCount(classId, runningCount) {
    // Validate the input
    const parsedClassId = classId ? classId.toString() : undefined;
    if (typeof parsedClassId === 'undefined') return;

    const parsedRunningCount = parseInt(runningCount);
    if (!Number.isSafeInteger(parsedRunningCount) || parsedRunningCount < 0) return;

    // Get the class Map
    const classMap = this.getClassMap();
    if ( !(classMap instanceof Map) ) return;

    // Check if the class ID is in the class Map
    if (!classMap.has(parsedClassId)) return;

    // Get the class object
    const classObj = classMap.get(parsedClassId);

    // In case of errors, return immediately
    if ( !(classObj instanceof Object) ) return;

    classObj.runningCount = parsedRunningCount;

    console.log(this.classMap)

    return classObj.runningCount;

  }

  /**
   * Gets the running counts of all classes across snapshots.
   * @returns {Object | undefined} Object of running counts with (classId, runningCount) key-value pairs or undefined if an error occurs.
   */
  getClassRunningCounts() {
    const classMap = this.getClassMap?.();
    if ( !(classMap instanceof Map) ) return;

    const countObj = {};
    for (const [classId, valueObj] of classMap.entries()) {
      countObj[classId] = valueObj['runningCount'];
    }
    return countObj;
  }


  /**
   * For given class IDs, increments the count for the running number of tracks per class across snapshots when exporting labels with snapshots is selected.
   * @param {String | Number} classId
   * @returns {Number | undefined} Updated count if the operation is successful, undefined otherwise.
   */
  incrementClassRunningCount(classId) {
    // Validate the input
    const parsedClassId = classId ? classId.toString() : undefined;
    if (typeof parsedClassId === 'undefined') return;

    // Get the class Map
    const classMap = this.getClassMap();
    if (!(classMap instanceof Map)) return;

    // Check if the class ID is in the class Map
    if (!classMap.has(parsedClassId)) return;

    // Get the class object
    const classObj = classMap.get(parsedClassId);

    // In case of errors, return immediately
    if (!Object.hasOwn(classObj, 'runningCount')) return;

    // Increment the counts and add return it
    return ++classObj.runningCount

   
  }

  getFrameMap() {
    return this.frameMap;
  }

  getIdMap() {
    return this.idMap;
  }  

  /**
   * Gets the first available class ID
   * @returns {String | undefined} Class ID in String type or undefined if an error occurs
   */
  getFirstAvailClassId() {
    // Get the class ID strings
    const idArr = this.getClassIds();
    if (!Array.isArray(idArr)) return;

    // Calculate the maximum value
    // If no classes are added yet, assign 0 to the first class ID
    // Math.max attempts to convert strings into numbers, no need to use parseInt on string class IDs
    const firstAvailId = idArr.length < 1 ? 0 : Math.max(...idArr) + 1; 
    if (!Number.isSafeInteger(firstAvailId)) return;

    // Return the result
    return firstAvailId?.toString();

  }

  

  // /**
  //  * @param {Object} obj
  //  * @param {Number | String} obj.frameNum
  //  * @param {Array} obj.trackArr
  //  */
  // updateByFrameNum(obj) {
  //   if (typeof obj.frameNum === 'undefined' || obj.frameNum === null) return;
  //   if (typeof obj.trackArr === 'undefined' || obj.trackArr === null || !Array.isArray(obj.trackArr)) return;
  //   const frameNumStr = obj.frameNum.toString();
  //   const trackArr = obj.trackArr;
  // }


  /**
   * Gets indices of tracks in the master array according to input class ID and track ID
   * @param {Object} obj
   * @param {Number | String} obj.classId Class ID
   * @param {Number | String} obj.trackId Track ID
   * @param {Number | String | undefined} obj.startFrame First frame number for filtering (optional)
   * @param {Number | String | undefined} obj.endFrame Last frame number for filtering (optional)
   * @returns {Number[] | undefined} Array of indices of tracks in the master array or undefined if no hits were found
   */
  getIndices(obj) {
    if (typeof obj.classId === 'undefined' || obj.classId === null) return;
    if (typeof obj.trackId === 'undefined' || obj.trackId === null) return;

    // Get the ID Map
    const idMap = this.getIdMap();
    if (!idMap || !(idMap instanceof Map)) return;

    // Convert inputs to strings to correctly query ID Map
    const classId = obj.classId.toString();
    const trackId = obj.trackId.toString();

    const idxArr = idMap.get(classId)?.get?.(trackId);
    if (!Array.isArray(idxArr)) return;

    // If no start and end frame is given return the array filtered by only class and track ID
    const startFrame = parseInt(obj.startFrame);
    const endFrame = parseInt(obj.endFrame);
    if (!Number.isSafeInteger(startFrame) || !Number.isSafeInteger(endFrame)) {
      return idxArr;
    }

    // Get the master array and its length
    const masterArr = this.getTracks();
    if (!masterArr || !Array.isArray(masterArr)) return;
    const masterArrLen = masterArr.length;

    // Filter the indices by start and end frames
    const filteredArr = idxArr
    .filter(idx => {
      // Check the validity of indices
      if (!Number.isSafeInteger(idx) || idx < 0 || idx >= masterArrLen) return false;
      
      // Get the track object from master array for filtered indices 
      const bBox = masterArr[idx];

      // Check the validity
      if (!(bBox instanceof BoundingBox)) return false;

      // Finally test the condition
      const trackNumber = bBox.getTrackNumber?.();

      return trackNumber >= startFrame && trackNumber <= endFrame;

    });
      
    return Array.isArray(filteredArr) && filteredArr.length > 0 ? filteredArr : undefined;

  
  }


  /**
   * Gets the track objects by their indices from the master array
   * @param {Number[]} idxArr Array of indices of the tracks
   * @returns {Object[] | undefined} Array of track objects
   */
  getTracksByIndex(idxArr) {
    if (!idxArr || !Array.isArray(idxArr)) {
      console.log('Track indices must be provided as an Array!');
      return;
    }
    // Get the master array
    const trackArr = this.getTracks();
    if (!trackArr || !Array.isArray(trackArr)) return;

    // Filter out indices that are larger than the length of the master array
    // Then get the tracks objects from the master array by these indices
    const resultArr = idxArr.filter(idx => idx < trackArr.length)
      .map(idx => trackArr[idx]);

    return resultArr;
    

  }
  
  // /**
  //  * 
  //  * @param {*} key 
  //  * @param {*} value 
  //  */
  // set(key, value) {
  //   // this.history.push(new Map(this.tracks));
  //   this.tracks.set(key.toString(), value);  // Keys are always strings 
  // }

  /**
   * Add an entry from a BoundingBox instance
   * @param {BoundingBox} bBox BoundingBox instance
   */
  // addFromBBox(bBox) {
  //   if (!(bBox instanceof BoundingBox)) {
  //     console.log('Input must be an instance of the BoundingBox class!');
  //     return;
  //   }

  //   const frameNumber = parseInt(bBox.getTrackNumber());
  //   if (Number.isNaN(frameNumber)) return;
    
  //   this.get(frameNumber).push({
  //     'trackNumber': bBox.trackNumber,
  //     'trackId': bBox.trackId,
  //     'x': bBox.x,
  //     'y': bBox.y,
  //     'width': bBox.width,
  //     'height': bBox.height,
  //     'confidenceTrack': bBox.confidenceTrack,
  //     'classId': bBox.classId,
  //     'nameOrder': bBox.nameOrder,
  //     'confidenceId': bBox.confidenceId
  //   });


  // }

  /**
   * Sets the individual name array for tracks
   * @param {String[]} nameArr 
   * @returns {String[] | undefined} Updated name array or undefined in case of an error.
   */
  setIndividualNames(nameArr) {
    if (!Array.isArray(nameArr)) return;
    this.individualNames = nameArr;
    return this.individualNames;
  }

  /**
   * Gets the master Array of track Objects 
   * @returns {BoundingBox[] | undefined}
   */
  getTracks() {
    return this.masterArr;
  }

  /**
   * Gets the Array of BoundingBox instances linked to a given frame number
   * @param {Number | String} frameNumber 
   * @returns {BoundingBox[] | undefined} Array of BoundingBox instances or undefined if the operation was unsuccessful
   */
  getTracksByFrame(frameNumber) {
    if (typeof frameNumber === 'undefined' || frameNumber === null) return;
    
    // Get the frame map
    const frameMap = this.getFrameMap();
    if (!(frameMap instanceof Map)) return;
    
    // Get the indices of track objects in the master array for this frame number
    const indices = frameMap.get(parseInt(frameNumber)) ?? frameMap.get(frameNumber.toString());
    if(!Array.isArray(indices)) return; 

    // Get the actual elements from the master array
    const masterArr = this.getTracks();
    if (!Array.isArray(masterArr)) return;

    const bBoxArr = indices
      .filter(idx => Number.isSafeInteger(idx) && idx >= 0 && idx < masterArr.length)
      .map((idx) => {return masterArr[idx]});

    return bBoxArr;
    
  }

  
  /**
   * Gets the Array of track Objects of a given class and track ID
   * @param {Number | String} classId 
   * @param {Number | String} trackId 
   * @returns {Object[]} Array of track objects
   */
  // getTrackObjectsById(classId, trackId) {
  //   if (typeof classId === 'undefined' || classId === null) return;
  //   if (typeof trackId === 'undefined' || trackId === null) return;
    
  //   // Get the ID map
  //   const idMap = this.getIdMap();
  //   if (!idMap || !(idMap instanceof Map)) {
  //     console.log('idMap is not a Map!');
  //     return;
  //   }
    
  //   // Get the class of track objects in the master array for this frame number
  //   const classIdStr = classId.toString();
  //   const trackIdStr = trackId.toString();

  //   const classMap = idMap.get(classIdStr);
  //   if (!classMap || !(classMap instanceof Map)) {
  //     console.log(`classMap for ${classIdStr} is not a Map!`);
  //     return;
  //   }

  //   // Get the index array for this track ID
  //   const idxArr = classMap.get(trackIdStr);
  //   if(!idxArr || !Array.isArray(idxArr)) {
  //     console.log(`idxArr for ${trackIdStr} is not an Array!`);
  //     return;
  //   }

  //   // Get the actual elements from the master array
  //   const trackObjArr = this.getTracks();
  //   if (!trackObjArr || !Array.isArray(trackObjArr)) return;

  //   const objArr = idxArr
  //     .filter(idx => Number.isSafeInteger(idx) && idx >= 0 && idx < trackObjArr.length)
  //     .map(idx => trackObjArr[idx]);

  //   return objArr;

  // }



  /**
   * Finds the bounding box for a given track ID, frame number, etc.
   * @param {Number | String} trackId 
   * @param {Number | String} trackNumber 
   */
  // find(trackId, trackNumber) {
  //   if (typeof trackId === 'undefined') return;
  //   if (typeof trackNumber === 'undefined') return;
    
  //   const tracksInFrame = this.get(trackNumber);
  //   const resultArr = tracksInFrame.find(trackObj => parseInt(trackObj.trackId) === parseInt(trackId));



  // }

  getIndividualNames() {
    return this.individualNames;
  }

  // has(key) {
  //   return this.tracks.has(key);
  // }

  // keys() {
  //   return this.tracks.keys();
  // }

  getClassMap() {
    return this.classMap;
  }

  /**
   * Determines whether a given class ID exists in the current instance
   * @param {String | Number} classId
   * @return {Boolean} True if the input class is an existing class, false otherwise.
   */
  hasClassId(classId) {
    if (typeof classId === 'undefined' || classId === null) return;
    return this.getClassIds?.()?.includes(classId.toString());
  }

   /**
   * Determines whether a given class name exists in the current instance
   * @param {String} className
   * @return {Boolean} True if the input class is an existing class, false otherwise.
   */
  hasClassName(className) {
    if (typeof className === 'undefined' || className === null) return;
    return this.getClassNames?.()?.includes(className.toString());
  }

  /**
   * Adds a new class to the Class Map.
   * @param {Object | undefined} obj
   * @param {String | Number} obj.id Class ID
   * @param {String | undefined} obj.name Class name
   * @param {String | undefined} obj.color Class color code in hex
   * @param {Number | String | undefined} obj.runningCount Running count of class occurrences across snapshots
   * @returns {Map | undefined} Updated class map if the operation was successful, undefined otherwise.
   */
  addToClassMap(obj = {}) {
    const { id: classId, name: className, color, runningCount } = obj;
    if (typeof classId === 'undefined') return;

    const classMap = this.getClassMap();
    if ( !(classMap instanceof Map) ) return;
    
    const isAdded = classMap.set(classId.toString(), {
      id: classId.toString(),
      name: className ? className.toString().toLowerCase() : null,
      color: color ? color.toString() : null,
      runningCount: Number.isSafeInteger(parseInt(runningCount)) ? parseInt(runningCount) : -1  // Start counting from zero
    });

    if (!isAdded) return;

    // Update relevant DOM elements
    updateClassEls();

    return classMap;
    
  }

  /**
   * Gets all class names
   * @returns {String[] | undefined}
   */
  getClassNames() {
    const classMap = this.getClassMap();
    if (!(classMap instanceof Map)) return;
    
    return Array.from(classMap.values()?.map(valueObj => valueObj?.name));
  } 

  /**
   * Gets all class IDs
   * @returns {String[] | undefined}
   */
  getClassIds() {
    return Array.from(this.classMap?.keys());
  } 

  /**
   * Gets the number of unique classes
   * @returns {Number | undefined}
   */
  getClassCount() {
    return this.classMap?.size;
  }

  /**
   * Gets the all class colors in hex format
   * @returns {String[] | undefined}
   */
  getClassColors() {
    return Array.from(this.classMap?.values?.().map(valueObj => valueObj.color));
  }

  /**
   * Gets the class ID, name and color arrays and runningCount object with (classId, runningCount) key-value pairs.
   * @returns {Object} Object with ids, names, colors and runningCounts properties.
   */
  getClassAttributes() {
    return {
      ids: this.getClassIds(),
      names: this.getClassNames(),
      colors: this.getClassColors(), 
      runningCounts: this.getClassRunningCounts()
    }
  }

  /**
   * Sets the color of a given class ID
   * @param {Number | String} classId ID of the class
   * @param {String} classColor Color of the class in hexadecimal
   * @returns {String | undefined} New color code if change was successful, undefined otherwise
   */
  setClassColor(classId, classColor) {
    for (const input of [classId, classColor]) {
      if (typeof input === 'undefined' || input === null) return;
    }

    const classMap = this.getClassMap();
    if (!classMap || !(classMap instanceof Map)) return;
    
    // Convert classId to string in case a number is given
    const classIdStr = classId.toString();  
    
    // Check if class ID and color keys exist
    const classObj = classMap.get(classIdStr);
    if (!classObj || !Object.hasOwn(classObj, 'color')) return; 

    // Set the color
    classObj.color = classColor;

    // Confirm the color change
    return classMap.get(classIdStr)?.color === classColor ? classColor : undefined;

  }

  /**
   * Sets the name of a given class ID.
   * @param {Number | String} classId ID of the class
   * @param {String} className Name of the class
   * @returns {String | undefined} Class name if the operation is successful, undefined otherwise.
   */
  setClassName(classId, className) {
    if (typeof classId === 'undefined' || classId === null || typeof className === 'undefined') return;
    
    const classIdStr = classId.toString();  // Convert classId to string in case a number is given
    if (!this.classMap.has(classIdStr)) return;
    
    this.classMap.get(classIdStr).name = className.toString().toLowerCase();

    return this.classMap.get(classIdStr).name;

  }

  /**
   * Gets the name of a given class ID
   * @param {Number | String} classId ID of the class
   * @returns {String | undefined} Name of the class
   */
  getClassName(classId) {
    if (typeof classId === 'undefined') return;
    
    const classIdStr = classId.toString();  // Convert classId to string in case a number is given
    if (!this.classMap.has(classIdStr)) return;
    
    return this.classMap.get(classIdStr).name;
  }

  /**
   * Gets the color of a given class ID
   * @param {Number | String} classId ID of the class
   * @returns {String | undefined} Hex code of the color of the class
   */
  getClassColor(classId) {
    if (typeof classId === 'undefined') return;

    const classMap = this.getClassMap();
    if (!classMap || !(classMap instanceof Map)) return;
   
    // Convert classId to string in case a number is given
    const classIdStr = classId.toString();  
   
    return classMap.get(classIdStr)?.color;
  }

  // Delete an entry
  // delete(key) {
  //   if (this.tracks.has(key)) {
  //     // this.history.push(new Map(this.tracks));
  //     this.tracks.delete(key);
  //   }
  // }

  /**
   * Deletes tracks by its index of the master array.
   * Sets the corresponding track objects in the master array to null.
   * @param {Number[]} indices Array of indices or a singular index
   * @returns {Boolean | undefined} True if operation is successful, false otherwise
   */
  deleteByIndices(indices) {
    // Get the master array
    const masterArr = this.getTracks();
    if (!masterArr || !Array.isArray(masterArr)) return;

    // Check if the input is an array of indices
    if (!Array.isArray(indices)) return;

    // Attempt to delete objects from the master array corresponding to each index
    for (const idx of indices) {   
      const isDeleted = this.deleteByIndex(idx);

      // Return immediately to signal any failure
      if (!isDeleted) return false;

    }

    // Return success
    return true;

    
  }

  /**
   * Deletes track by its index of the master array.
   * Sets the corresponding track objects in the master array to null.
   * @param {Number[]} idx Array of indices or a singular index
   * @returns {Boolean | undefined} True if operation is successful, false otherwise
   */
  deleteByIndex(idx) {
    // Get the master array
    const masterArr = this.getTracks();
    if (!masterArr || !Array.isArray(masterArr)) return;

    const parsedIdx = parseInt(idx);
    if (Number.isNaN(parsedIdx) || !Number.isFinite(parsedIdx)) return;

    // If a track object is missing, return immediately to signal failure
    if (typeof masterArr[idx] === 'undefined') return false;

    // Set the track object to null
    masterArr[idx] = null;

    // Return success/failure
    return true;

  }

  /**
   * Adds tracks to the TrackingMap.
   * Also updates the ID and Frame Maps for the newly added track
   * @param {BoundingBox[] | BoundingBox | Object[]} tracks Single BoundingBox instance or array of BoundingBoxes
   * @returns {Boolean} True if the operation is successful, false otherwise
   */
  add(tracks) {
    // Get the master array
    const masterArr = this.getTracks();
    if (!Array.isArray(masterArr)) return;

    // Construct the array from the input
    const objArr = Array.isArray(tracks) ? tracks : [tracks];

    const idMap = this.getIdMap();
    const frameMap = this.getFrameMap();

    // Iterate over the tracks
    objArr.forEach(obj => {

      // If an object is not a BoundingBox instance, try to convert it to one
      const bBox = (obj instanceof BoundingBox) ? obj : BoundingBox.validateAndCreate(obj);
      
      // Check the validity
      if (!(bBox instanceof BoundingBox)) return;
      
      // Add the bounding box to the master array
      masterArr.push(bBox);
  
      // Get the index
      const idx = masterArr.indexOf(bBox);

      bBox.setIndex?.(idx);

      // Update the ID and Frame Maps
      this.updateIdAndFrameMaps({
        bBox: bBox,
        index: idx,
        idMap: idMap,
        frameMap: frameMap
      });

      
    });
    

  }

  /**
   * Updates a single track by its index of the master array. 
   * Use the function updateByIndices to modify multiple tracks. 
   * @param {Object} args
   * @param {Number} args.index Index of the track object in the master array
   * @param {Object} args.entries Object with key-value pairs
   * @returns {Boolean | undefined} True if operation is successful, undefined otherwise
   */
  updateByIndex(args) {
    // Check if the arguments are given
    if ( !(args instanceof Object)) return;

    // Get the master array
    const masterArr = this.getTracks();
    if (!masterArr || !Array.isArray(masterArr)) return;

    // Get the arguments
    const index = args.index ?? undefined;
    const entries = args.entries ?? undefined;

    // Check the validity of arguments
    if (typeof index === 'undefined' ||
      typeof entries === 'undefined'
    ) return;

    // Get the bounding box object
    const bBox = masterArr[index];

    // If the bounding box is missing, return immediately to signal failure
    if (typeof bBox === 'undefined' || bBox === null) return false;

    // Update the bounding box properties and values
    const isSuccess = bBox.set(entries);

    // Return success
    return isSuccess;


  }

  /**
   * Updates tracks by its index of the master array. 
   * It only alters the master array and does not reflect the changes to the ID Map.
   * @param {Object} args
   * @param {Number[]} args.indices Array of indices or a singular index
   * @param {Object} args.entries Object of key-value pairs for track property names as keys and its new values as values.
   * @returns {Boolean | undefined} True if operation is successful, false otherwise
   */
  updateByIndices(args) {
    // Check if the arguments are given
    if (!args) return;

    // Get the index array
    const indices = args.indices;
    
    // Check the validity of indices
    if (typeof indices === 'undefined' || 
      indices === null ||
      !Array.isArray(indices)
    ) return;
    
    // Get the entry array
    const entries = args.entries;
  
    // For each index
    for (const idx of indices) {
      // Get the result of the operation
      const isSuccess = this.updateByIndex({ 
        index: idx, 
        entries: entries
      });

      // If the update has failed, return immediately
      if (!isSuccess) return false;

    }

    // Return success
    return true;


  }


  /**
   * Updates tracks by its class and track IDs. 
   * It alters both the master array and ID Map.
   * @param {Object} args
   * @param {String | Number} args.oldClassId Existing class ID
   * @param {String | Number} args.oldTrackId Existing track ID 
   * @param {String | Number | undefined} args.newClassId New track ID. Should only be given if track ID is to be changed.
   * @param {String | Number | undefined} args.newTrackId New track ID. Should only be given if track ID is to be changed. Will be ignored if newClassId is given as well.
   * @param {Number[]} args.indices Array of indices for track objects with the given IDs in the master array
   * @param {Number | undefined} args.startFrame Frame number to start including tracks (inclusive). It will be ignored if an index array is given.
   * @param {Number | undefined} args.endFrame Frame number to end including tracks (inclusive). It will be ignored if an index array is given.
   * @returns {Boolean | undefined} True if operation is successful, false otherwise
   */
  updateByTrackId(args) {
    // Get the ID Map
    const idMap = this.getIdMap();
    if (!idMap || !(idMap instanceof Map)) return;
    
    // Validate the inputs
    const oldClassId = args.oldClassId?.toString();
    const oldTrackId = args.oldTrackId?.toString();
    if (!oldTrackId || !oldClassId) return; // Both old class ID and track ID should be given

    // Validate new class ID
    // Get a new track ID for the new class if it is given and ignore the input track ID
    // Otherwise get the input track ID
    const newClassId = args.newClassId?.toString();
    const newTrackId = newClassId ? Player.getFirstAvailTrackId(newClassId).toString() : args.newTrackId?.toString();
    if (!newClassId && !newTrackId) return; // Either new class ID or track ID should be given

    // Check if the given class ID is valid
    if (!idMap.has(oldClassId)) return;

    // Get the inner class map for the existing class ID
    const oldClassMap = idMap.get(oldClassId);
    if (!oldClassMap || !(oldClassMap instanceof Map)) return;

    // Get the index array corresponding the given class and track ID
    const idxArr = args.indices ?? oldClassMap.get(oldTrackId);

    // Check the validity of the index array
    if (!Array.isArray(idxArr)) return;

    // Check whether the class ID should be changed
    if (typeof newClassId !== 'undefined') {
      
      // If the new class ID is not in the ID Map, add it
      if (!idMap.has(newClassId)) {
        idMap.set(newClassId, new Map([
          [ oldTrackId, idxArr ]
        ]));
      } else {
        // If the new class ID is in the ID Map, get the inner Map
        const newClassMap = idMap.get(newClassId);
        if (!newClassMap || !(newClassMap instanceof Map)) return;
        
        // Remove the old track ID 
        if (!oldClassMap.delete(oldTrackId)) return;
        
        // Add the new track ID to the map
        newClassMap.set(newTrackId, idxArr);

      }

      // Also update the IDs of tracks in the master array
      // Determine which properties of tracks should be updated 
      // Save 'classId' and 'trackId' and their new values as key-value pairs in the Map  
      const isSuccess = this.updateByIndices({
        indices: args.indices,
        entries: {
          'classId': newClassId,
          'trackId': newTrackId,
        }
      });

      // Return the result
      return isSuccess;

    }

    // Check whether the track ID should be changed
    if (typeof newTrackId !== 'undefined') {

      // Remove the old track ID 
      if (!oldClassMap.delete(oldTrackId)) return;

      // Add the new track ID to the map
      oldClassMap.set(newTrackId, idxArr);

      // Also update the IDs of tracks in the master array 
      const isSuccess = this.updateByIndices({
        indices: args.indices,
        entries: {
          'trackId': newTrackId
        }
      });

      // Return the result
      return isSuccess;
    }


  }



  findFirstFrameWithAllClass() {
    // Get the frame map
    const frameMap = this.getFrameMap();
    if (!frameMap || !(frameMap instanceof Map)) return;

    const masterArr = this.getTracks();
    if (!masterArr || !Array.isArray(masterArr)) return;

    const classIdArr = this.getClassIds();
    if (!classIdArr) return;

    /**
     * Start searching from the middle of the video 
     * to try to avoid misidentified objects.
     * This is common in the beginning of a video 
     * For example, feet of experimenters can be misidentified as lemurs by the model
    */
    const middleIndex = Math.floor(frameMap.size / 2);
    const trackKeyArr = Array.from(frameMap.keys()).slice([middleIndex]);
    const firstFrameNumber = trackKeyArr[middleIndex];
   
    let searchResult;
    // Iterate over values in trackingMap object to find the first frame with all class
    for (const frameNumber of trackKeyArr) {
      const idxArr = frameMap.get(frameNumber);

      const classCounts = idxArr.reduce((acc, idx) => {
        const classId = masterArr[idx]?.classId;
        if (classId) {
          acc.set(classId, (acc.get(classId) || 0) + 1);
          return acc;
        }
      }, new Map());

      if (classCounts instanceof Map) {
        // Minimum class count across all class (at least one member from each class)
        if (Math.min(...classCounts.values()) >= 1) {
          searchResult = frameNumber;
          break;
        }

      }


    }

    // If no valid frame was found, return the frame in the middle
    return searchResult ? searchResult : firstFrameNumber;

  }

  // Undo the last change
  async undo() {
    if (this.history.length > 0) {

      const latestEditArr = this.history.pop();
      latestEditArr.forEach(edit => {
        this.set(edit.frameNumber, edit.trackInfoArr);
      })
      
      // Refresh tracking boxes on canvas
      Player.refreshMainCanvas();
      
      // Update tracking file
      await this.saveEditsToFile();

    }

  }

  // Get the current size of the map
  size() {
    return this.frameMap?.size;
  }

  // Check if the map is empty
  isEmpty() {
    return this.size() === 0;
  }

  anyEditHistory() {
    return this.history.length > 0;
  }

  // Clear the map
  async clear() {
    this.history = [];
    this.masterArr = [];
  }

  async saveEditsToFile() {

    // Save edits to file in user directory
    const mainPlayer = Player.getMainPlayer();
    if (mainPlayer) {
      const fileName = mainPlayer.getName();
      if (fileName) {
        
        // Show spinner before the process starts
        showProcessIndicator();

        // const trackObjArr = this.getTracks()?.map(bBox => bBox.toObject());
        
        const response = await window.electronAPI.saveTrackingEdits(this.getTracks(), fileName, Player.getIndividualNames(), Player.getUsername());
        
        // if (response) {
        //   // Show success if edited tracking file copied to export directory
        //   isSaved = response.pathInUserDataDir ? true : false;
        // }
          
        // By changing the relevant icon on tracking table
        // showTrackingSaveStatus(isSaved);
        
        // Hide the spinner
        hideProcessIndicator();

        return response;


      }
    }
  }

  

}


class Hotkey {
  /**
   * Hotkey for playback, behavior recording, app navigation, etc.
   * @param {String} category - Category of the hotkey (e.g. playback, labeling, individuals, actions)
   * @param {String} name - Name of the hotkey
   * @param {String} description - Description of the function of the hotkey
   * @param {Array} keys - Keyboard keys excluding modifiers (ctrl, cmd, meta, shift, alt, option)
   * @param {Array} modifiers - Optional modifier keys (ctrl, cmd, meta, shift, alt, option)
   */

  // Keep track of all Hotkey instances
  static allInstances = [];

  // Define fixed categories to prevent hotkey change by user
  static fixedCategories = ['playback', 'labeling', 'drawing'];

  // Handle hotkey change by user by adding/removing event listener to keypress
  static keypressListener = null;
  
  // Define the properties of the default hotkeys
  // Hotkey objects will be constructed for each of them
  static defaultHotkeyPropArr = [
    {
      category: 'playback',
      name: 'stepBackward',
      description: 'Go back to previous frame',
      key: 'ArrowLeft',
      modifiers: [],
    },
    {
      category: 'playback',
      name: 'stepForward',
      description: 'Skip to next frame',
      key: 'ArrowRight',
      modifiers: [],
    },
    {
      category: 'playback',
      name: 'playPause',
      description: 'Play/pause',
      key: ' ', // Spacebar
      modifiers: [],
    },
    {
      category: 'playback',
      name: 'replay',
      description: 'Seek backward',
      key: 'ArrowLeft',
      modifiers: ['Shift'],
    },
    {
      category: 'playback',
      name: 'forward',
      description: 'Seek forward',
      key : 'ArrowRight',
      modifiers: ['Shift'],
    },
    {
      category: 'playback',
      name: 'increaseVolume',
      description: 'Increase volume',
      key: 'ArrowUp',
      modifiers: ['Alt']
    },
    {
      category: 'playback',
      name: 'decreaseVolume',
      description: 'Decrease volume',
      key: 'ArrowDown',
      modifiers: ['Alt']
    },
    {
      category: 'playback',
      name: 'muteUnmute',
      description: 'Mute/unmute',
      key: 'm',
      modifiers: []
    },
    {
      category: 'playback',
      name: 'increaseSpeed',
      description: 'Increase playback speed',
      key: 'ArrowUp',
      modifiers: ['Shift']
    },
    {
      category: 'playback',
      name: 'decreaseSpeed',
      description: 'Decrease playback speed',
      key: 'ArrowDown',
      modifiers: ['Shift']
    },
    {
      category: 'playback',
      name: 'toggleZooming',
      description: 'Enable/disable zooming',
      key: '0',
      modifiers: Player.onMacOS ? ['Meta'] : ['Control']
    },
    {
      category: 'drawing',
      name: 'toggleDrawing',
      description: 'Enable/disable drawing',
      key: 'd',
      modifiers: Player.onMacOS ? ['Meta'] : ['Control']
    },
    {
      category: 'labeling',
      name: 'toggleLabeling',
      description: 'Enable/disable labeling',
      key: 'l',
      modifiers: Player.onMacOS ? ['Meta'] : ['Control']
    },
    {
      category: 'labeling',
      name: 'takeSnapshot',
      description: 'Take a snapshot ',
      key: 's',
      modifiers: Player.onMacOS ? ['Meta'] : ['Control']
    },
    {
      category: 'labeling',
      name: 'endObservation',
      description: 'End current observation',
      key: 'Enter',
      modifiers: []
    },
    {
      category: 'labeling',
      name: 'boxSelection',
      description: 'Choose box as target',
      key: 'b',
      modifiers: []

    },
    {
      category: 'labeling',
      name: 'undo',
      description: 'Undo last step',
      key: 'z',
      modifiers: Player.onMacOS ? ['Meta'] : ['Control']
    }

  ];

  // Map shortcuts to HTML code
  static htmlMap = new Map([
    ['Meta', '&#8984;'],
    ['metaKey', '&#8984;'],
    ['ctrlKey', 'Ctrl'],
    ['shiftKey', 'Shift'],
    ['ArrowUp', '&uarr;'],
    ['ArrowDown', '&darr;'],
    ['ArrowRight', '&rarr;'],
    ['ArrowLeft', '&larr;'],
    ['>', '&gt;'],
    ['<', '&lt;'],
    [' ', '&#9141;'],
    ['Alt', Player.onMacOS ? '&#8997;' : 'Alt'],
    ['Enter', '&#8629;']
    // ['Shift', '&#8679;'],

  ]);

  constructor(category, name, description, key, modifiers) {
    this._category = category;
    this._name = name;
    this._description = description;
    this._key = key; 
    this._modifiers = modifiers ? modifiers : []; 

    // Add the newly created hotkey to the array containing all instances
    Hotkey.allInstances.push(this);

  }

  get category() {
    return this._category;
  }

  get name() {
    return this._name;
  }

  get description() {
    return this._description;
  }

  get key() {
    return this._key;
  }

  get modifiers() {
    return this._modifiers;
  }

  set category(category) {
    this._category = category;
  }

  set name(name) {
    this._name = name;
  }

  set description(description) {
    this._description = description;
  }

  set key(key) {
    this._key = key;
  }

  set modifiers(modifiers) {
    if (!Array.isArray(modifiers)) return;
    this._modifiers = modifiers;
  }

  /**
   * Creates a Hotkey instance from a given Object
   * @param {Object} obj Object with hotkey properties
   * @param {String} obj.category Category
   * @param {String} obj.name Name
   * @param {String} obj.key Key
   * @param {String} obj.description Description
   * @param {String} obj.modifiers Modifiers
   */
  static objectToHotkey(obj) {

    // Get the properties 
    // First check the prop name without "_" in front, if it is null check with "_". 
    // This is helpful reading from config data because hotkeys might be saved directly to config with "_" in prop names.
    const category = obj.category ?? obj._category;
    const name = obj.name ?? obj._name;
    const key = obj.key ?? obj._key;
    const description = obj.description ?? obj._description;
    const modifiers = obj.modifiers ?? obj._modifiers;

    if (!category || !name || !description || !key || !modifiers) return;

    // Check if Hotkey is already exists
    const prevHotkey = Hotkey.findOne({ category: category, name: name, key: key, modifiers: modifiers });

    // If any hits, update them
    if (prevHotkey) {
      prevHotkey.category = category;
      prevHotkey.name = name;
      prevHotkey.description = description;
      prevHotkey.key = key;
      prevHotkey.modifiers = modifiers;
    } else {
      // If not create a new instance
      const hotkey = new Hotkey(category, name, description, key, modifiers);
    }
    
  }

  /**
   * Create Hotkey objects with the default values
   */
  static createDefaultHotkeys() {
   
    Hotkey.defaultHotkeyPropArr.forEach(obj => Hotkey.objectToHotkey(obj));    

  }

  static getAll() {
    return Hotkey.allInstances;
  }

  /**
   * Creates Hotkey instances from objects of the input array. This is mainly used to set hotkeys from config file on app restart.
   * @param {Object[]} objArr 
   */
  static setHotkeysFromObjectArr(objArr) {
    if (!Array.isArray(objArr)) return;
    objArr.forEach(obj => Hotkey.objectToHotkey(obj));
  }

  /**
   * Updates a Hotkey instance
   * @param {Object} props 
   * @param {String | undefined} props.name Name
   * @param {String | undefined} props.description Description
   * @param {String | undefined} props.key Key
   * @param {String[] | undefined} props.modifiers Modifier array
   * @param {String | undefined} props.category Category
   * @returns {Promise}
   */
  async update(props) {
    const { name: name, description: description, key: key, modifiers: modifiers, category: category } = props;
    if (name) this.name = name;
    if (description) this.description = description;
    if (key) this.key = key;
    if (modifiers) this.modifiers = modifiers;
    if (category) this.category = category;
    
    // Update the DOM elements
    this.updateDomEls();

    // Save changes to config
    const response = await Hotkey.saveToConfig();
    return response;

  }

  /**
   * Finds conflicting hotkeys by comparing all Hotkey instances with the input key and modifier combination.
   * @param {String} refKey Reference key
   * @param {String[]} refModifiers Reference modifier key(s)
   * @returns {Hotkey[] | undefined} Array of conflicting Hotkey instances or undefined if no input was given
   */
  static findConflicts(refKey, refModifiers) {
    if (!refKey || !refModifiers) return;

    // If reference has no modifiers, only compare with hotkeys without any modifiers
    if (refModifiers.length < 1) {
      return Hotkey.getAllInstancesWithoutModifiers().filter(
        hotkey => hotkey.key === refKey
      );
    }

    // If reference has modifiers, only compare with hotkeys with modifiers
    if (refModifiers.length > 0) {
      return Hotkey.getAllInstancesWithModifiers().filter(hotkey => 
        hotkey.key === refKey && 
        refModifiers.every(refModifier => hotkey.modifiers.includes(refModifier))
      );
    }



  }

  /**
   * Reflect the update on a Hotkey to its associated HTML elements
   */
  updateDomEls() {

    // Combine the modifiers and keys of the Hotkey object
    const keysAndModifiers = this.modifiers.concat(this.key);
    
    // Find the all associated DOM elements
    const domEls = document.querySelectorAll(`[data-hotkey-name=${this.name}][data-hotkey-category=${this.category}]`);
    domEls.forEach(domEl => {
      
      const kbdEl = domEl.querySelector('.hotkey-kbd');

      if (kbdEl) {
        kbdEl.innerHTML = keysAndModifiers.map(key => {
          const keyName = Hotkey.htmlMap.has(key) ? Hotkey.htmlMap.get(key) : key;
          return (`<kbd>${keyName}</kbd>`);        
        }).join(' + ');

      }


      
      // // Get the kdb element
      // const kbdEls = domEl.querySelectorAll('kbd');

      // if (Array.from(kbdEls).length !== keysAndModifiers.length) {
      //   console.log(`kbd HTML element count must be equal to the total count of keys and modifiers for each Hotkey! kbd count: ${Array.from(kbdEls).length}, key count: ${keysAndModifiers.length}`);
      //   return;
      // }

      // kbdEls.forEach((kbdEl, index) => {

      //   const key = keysAndModifiers[index];

      //   console.log(key);
        
      //   // Fill the kbd element depending on whether key is a special element or not
      //   kbdEl.innerHTML = Hotkey.htmlMap.has(key) ? Hotkey.htmlMap.get(key) : key;

      // })

      
    })

  }



  /**
   * Gets the all Hotkey instances with modifier(s)
   * @returns {Hotkey[]} Array of Hotkey instances
  */
  static getAllInstancesWithModifiers() {
   
    return Hotkey.getAll().filter(hotkey => hotkey.key && hotkey.modifiers.length)

  }

  /**
   * Gets the all Hotkey instances without any modifiers
   * @returns {Hotkey[]} Array of Hotkey instances
  */
  static getAllInstancesWithoutModifiers() {
   
    return Hotkey.getAll().filter(hotkey => hotkey.key && !hotkey.modifiers.length)

  }

  /**
   * Gets the all key strings linked to the Hotkeys without any modifiers
   * @returns {String[]} Array of keys associated with each Hotkey instance
  */
  static getAllKeysWithoutModifiers() {
   
    return Hotkey.getAllInstancesWithoutModifiers().map(hotkey => hotkey.key);

  }

  /**
   * Gets the all key strings linked to the Hotkeys with modifier(s)
   * @returns {String[]} Array of keys associated with each Hotkey instance
  */
  static getAllKeysWithModifiers() {
   
    return Hotkey.getAllInstancesWithModifiers().map(hotkey => hotkey.key);

  }

  /**
   * Finds the multiple Hotkey objects according to a search criteria
   * @param {Object} - Object consisting of optional Strings for category, name, key and modifiers
   * @returns {Hotkey[]} - Array of Hotkey objects matching the search criteria. Returns an empty array if no hits have been found.
   */
  static findAll({category, name, key, modifiers}) {
    const resultArr = Hotkey.getAll().filter(hotkey => {
      if (category || name || key || modifiers) {
        const selectedCategory = category ? hotkey.category === category : true;
        const selectedName = name ? hotkey.name === name : true;
        const selectedKey = key ? hotkey.key === key : true;
        const selectedModifiers = modifiers ? hotkey.modifiers === modifiers : true;
        return selectedCategory && selectedName && selectedKey && selectedModifiers

      }
      
    });

    return resultArr;



  }

  /**
   * Finds a single Hotkey object according to a search criteria
   * @param {Object} - Object consisting of optional Strings for category, name, key and modifiers
   * @returns {Hotkey} -  Single Hotkey object or undefined if no hits have been found.
   */
  static findOne({category, name, key, modifiers}) {
    const resultArr = Hotkey.getAll().filter(hotkey => {
      if (category || name || key || modifiers) {
        const selectedCategory = category ? hotkey.category === category : true;
        const selectedName = name ? hotkey.name === name : true;
        const selectedKey = key ? hotkey.key === key : true;
        const selectedModifiers = modifiers ? hotkey.modifiers === modifiers : true;
        return selectedCategory && selectedName && selectedKey && selectedModifiers

      }
      
    });

    if (resultArr.length === 1) {
      return resultArr[0];
    }


  }

  /**
   * Gets all Hotkey names
   * @returns {String[]} Array of names
   */
  static getNames() {
    const hotkeys = Hotkey.getAll();
    if (!hotkeys) return;
    const names = hotkeys.map(hotkey => hotkey.name);
    return names;

  }


  /**
   * Get the unique hotkey categories
   * @returns {String[]} - Array of category strings
   */
  static getUniqueCategories() {
    const uniqueCategories = [];

    Hotkey.getAll().forEach(hotkey => {
      if (!uniqueCategories.includes(hotkey.category)) {
        uniqueCategories.push(hotkey.category);
      }
    });
    
    return uniqueCategories;
  }

  /**
   * Gets the all pressed keys in a Keyboard Event including modifiers
   * @param {KeyboardEvent} event 
   * @returns {Object} result - Object consisting of pressed modifiers and keys
   * @returns {String[]} - result.modifiers - Array of Strings for pressed modifier keys
   * @returns {String} - result.key - String for pressed keys excluding modifiers
   */
  static getUserKeyPress(event) {
    let modifiersPressed = [];
    let keyPressed;

    if (event.ctrlKey) modifiersPressed.push('Control');
    if (event.shiftKey) modifiersPressed.push('Shift');
    if (event.altKey) modifiersPressed.push('Alt');
    if (event.metaKey) modifiersPressed.push('Meta');
    if (!['Control', 'Alt', 'Meta', 'Shift', 'CapsLock', 'Tab'].includes(event.key)) keyPressed = event.key;

    return {modifiers: modifiersPressed, key: keyPressed}

  }

  /**
   * Find the Hotkey object associated with the pressed key combination
   * @param {Event} event - Keyboard event
   * @returns {Hotkey} - Selected Hotkey object
   */
  static getSelected(event) {
    const selectedArr = Hotkey.getAll().filter(hotkey => hotkey.isPressed(event));
    if (selectedArr.length === 1) {
      return selectedArr[0];
    }
  }

   /**
   * Checks whether any modifier is defined on the Hotkey
   * @returns {Boolean} True if the Hotkey has modifiers, false otherwise
   */
   hasModifiers() {
    return this._modifiers.length > 0;
  }

  /**
   * Checks whether the key combination of the Hotkey object is pressed
   * @param {KeyboardEvent} event - Keyboard event
   * @returns {Boolean} - True if the Hotkey is pressed, False otherwise.
   */
  isPressed(event) {

    // Prevent default action for space bar
    if (event.key === ' ' && !Player.isTyping) {
      event.preventDefault();
    }

    // Check if modifiers is assigned to the Hotkey
    if (this.hasModifiers()) {

      // Get the modifiers assigned to the Hotkey
      const modifierKeys = this.modifiers;

      // Check if the main key and all modifier keys of the Hotkey are pressed in the same event
      return event.key === this.key && modifierKeys.every(key => event.getModifierState(key))

    // If no modifiers is assigned to the Hotkey
    } else {

      // Actions and individuals can have upper case characters
      // In this case, ignore modifiers (Shift, CapsLock) and compare the keys directly
      if (['actions', 'individuals'].includes(this.category)) {
        if (/^[A-Z]$/.test(this.key)) {
          return event.key === this.key;
        }
      }
      
      // Otherwise, check if the main key of the Hotkey and none of the modifier keys is pressed
      const modifierKeys = ['Control', 'Alt', 'Shift', 'Meta', 'CapsLock'];
      return event.key === this.key && modifierKeys.every(key => !event.getModifierState(key))

    }

  }

  /**
   * Execute the function of the hotkey
   */
  execute() {

    if (Player.isTyping) return;

    // Get all players to sync playback 
    const allPlayers = Player.getAllInstances();

    switch (this.name){
      case 'stepBackward':
        // Go back to the previous frame
        allPlayers.forEach(player => player.stepBackward());
        break;
      case 'stepForward':
        // Skip to the next frame
        allPlayers.forEach(player => player.stepForward());
        break;
      case 'playPause':
        allPlayers.forEach(player => player.playPause());
        break;
      case 'replay':
        allPlayers.forEach(player => player.replay());
        break;
      case 'forward':
        allPlayers.forEach(player => player.forward());
        break;
      case 'increaseVolume':
        allPlayers.forEach(player => player.increaseVolume());
        break;
      case 'decreaseVolume':
        allPlayers.forEach(player => player.decreaseVolume());
        break;
      case 'muteUnmute':
        allPlayers.forEach(player => player.toggleMute());
        break;
      case 'increaseSpeed':
        allPlayers.forEach(player => player.increaseSpeed());
        break;
      case 'decreaseSpeed':
        allPlayers.forEach(player => player.decreaseSpeed());
        break;
      case 'toggleLabeling':
        Player.toggleLabelingMode();
        break;
      case 'toggleDrawing':
        Player.toggleDrawingMode();
        break;
      case 'takeSnapshot':
        Player.getMainPlayer?.().drawSnapshot();
        break;
      case 'toggleZooming':
        Player.toggleZoomingMode();
        break;
      default:
        console.log('No function to execute could be found for this hotkey!'); 

    }

  }

  /**
   * Delete a Hotkey instance
   * @param {Hotkey} hotkey 
   */
  delete() {

      // Get all instances
      const allHotkeys = Hotkey.getAll();
      
      // Compare input hotkey with all others
      for (let i = 0; i < allHotkeys.length; i++) {
        const hotkey = allHotkeys[i];
        if (hotkey.category === this.category && hotkey.name === this.name) {
          allHotkeys.splice(i, 1);
          break;
        }

      }



    
  }

  /**
   * Handles changing Hotkeys by the user via click and keypress events
   * @param {Event} event - Click event
   */
  static handleHotkeyChangeByUser(event) {

    // Get the clicked DOM element
    const itemEl = event.target;
    if (!itemEl) return;

    // Get the all hotkey badge elements
    const badgeEls = document.querySelectorAll('.hotkey-badge');

    // Clear previously showed badges
    badgeEls.forEach(badgeEl => badgeEl.classList.add('d-none'));
    
    // Show badge to inform user that you are waiting for a hotkey input
    const infoBadge = itemEl.querySelector('.hotkey-badge');
    if (infoBadge) infoBadge.classList.remove('d-none');

    // Remove the old keypress event listener, if it exists
    if (Hotkey.keypressListener) {
      itemEl.removeEventListener('keydown', Hotkey.keypressHandler);
    } else {
      Hotkey.keypressListener = Hotkey.keypressHandler;
    }

    // Listen to user key press
    itemEl.addEventListener('keydown', Hotkey.keypressHandler);

    // // Check if the DOM element is a modal
    // if (domEl.classList.contains('modal')) {
      
    //   // Remove the event listener when the modal is closed
    //   domEl.addEventListener('hidden.bs.modal', () => {
    //     if (Hotkey.keypressListener) {
    //       itemEl.removeEventListener('keyup', Hotkey.keypressHandler);
    //     }

    //   });

    // }

  }

  /**
   * Handles keypress event for changing hotkeys
   * @param {Event} event Keypress event
   */
  static async keypressHandler(event) {

    event.preventDefault();
    
    const itemEl = event.target;
    if (!itemEl) return;

    const badgeEl = itemEl.querySelector('.hotkey-badge');
    if (!badgeEl) return;

    // Get the pressed keys and modifiers in the Keyboard Event
    const pressedObj = Hotkey.getUserKeyPress(event);

    if (!pressedObj) {
      // Remove listening to keypress after user pressed a key
      itemEl.removeEventListener('keydown', Hotkey.keypressHandler);

      // Hide the info badge
      badgeEl.classList.add('d-none');

      // Remove the focus from the element
      itemEl.blur();

      return;
    }
    
    // Keep track of pressed keys and modifiers
    const pressedModifiers = pressedObj.modifiers;
    const pressedKey = pressedObj.key;

    // If user pressed a modifier but not any key, do not proceed and wait until a key is pressed
    if (typeof pressedKey === 'undefined' && pressedModifiers.length > 0) {
      // itemEl.removeEventListener('keydown', keypressHandler);
      return;
    };

    const pressedModifiersTextArr = pressedModifiers.map(
      pressedModifier => Hotkey.htmlMap.has(pressedModifier) ? Hotkey.htmlMap.get(pressedModifier) : pressedModifier
    );

    // For characters outside the alphabet, get the HTML code for it from shortcuts map
    const pressedKeyText = Hotkey.htmlMap.has(pressedKey) ? Hotkey.htmlMap.get(pressedKey) : pressedKey;

    // Check if input conflicts with another hotkey
    // Get the category and name of the clicked element
    const hotkeyCategory = itemEl.dataset.hotkeyCategory;
    const hotkeyName = itemEl.dataset.hotkeyName;

    // Keep track of conflicting hotkeys
    // const conflictingHotkeys = Hotkey.getAll().filter(hotkey => 
    //   hotkey.key === pressedKey && 
    //   pressedModifiers.length && 
    //   pressedModifiers.every(pressedModifier => hotkey.modifiers.includes(pressedModifier))
    // );
    const conflictingHotkeys = Hotkey.findConflicts(pressedKey, pressedModifiers);

    // If there are conflicting hotkeys
    if (conflictingHotkeys && conflictingHotkeys.length > 0) {

      // Get the description of the first conflicting hotkey
      const conflictDesc = conflictingHotkeys[0].description;

      // Construct HTML code for the conflicting modifiers
      const conflictingModifierHtml = pressedModifiersTextArr.map(
        modifierText =>  `<span class="badge text-bg-dark">${modifierText}</span>`
      ).join('+');

      // Construct HTML code for the conflicting key
      const conflictingKeyHtml = `<span class="badge text-bg-dark">${pressedKeyText}</span>`;

      // // Put the two together
      const conflictHtml = conflictingModifierHtml ? `${conflictingModifierHtml} + ${conflictingKeyHtml}` : conflictingKeyHtml;
      
      // Show alert if user input is in conflict with another hotkey
      showPopover({
        domEl: itemEl,
        title: 'Conflicting Shortcut',
        content: `${conflictHtml} is already assigned to <span class="badge text-bg-dark">${conflictDesc}</span>. Try another shortcut.`, 
        type: 'error',
        placement: 'bottom',
        hideTimeout: 3000
      });

      // showAlertToast(
      //   `${conflictHtml} is already assigned to <span class="badge text-bg-dark">${conflictDesc}</span>! Please choose another shortcut.`, 
      //   'error', 
      //   'Conflicting Shortcut'
      // );

      // Remove listening to keypress after user pressed a key
      itemEl.removeEventListener('keydown', Hotkey.keypressHandler);

      // Hide the info badge
      badgeEl.classList.add('d-none');

      // Remove the focus from the element
      itemEl.blur();

      return;

    }

    // If there are no conflicts, assign the user input key to the clicked shortcut
    // Get the Hotkey object linked to the clicked DOM element
    const hotkey = Hotkey.findOne({category: hotkeyCategory, name: hotkeyName});
    if (!hotkey) {

      // Remove listening to keypress after user pressed a key
      itemEl.removeEventListener('keydown', Hotkey.keypressHandler);

      // Hide the info badge
      badgeEl.classList.add('d-none');

      // Remove the focus from the element
      itemEl.blur();

      console.log('No Hotkey object linked to this DOM element could be found!')
      
      return;

    }

    // If Escape is pressed, do not continue with editing
    if (pressedKey === 'Escape') {

      // Remove listening to keypress after user pressed a key
      itemEl.removeEventListener('keydown', Hotkey.keypressHandler);

      // Hide the info badge
      badgeEl.classList.add('d-none');

      // Remove the focus from the element
      itemEl.blur();

      // Show feedback
      showAlertToast('Shortcut change canceled!', 'success');
      
      return;

    }

    // Check if hotkey is either an action or an individual
    // if (['individuals', 'actions'].includes(hotkey.category)) {
      
    //   // Only allow alphabetic characters for individuals and actions
    //   if (!pressedKey.match(/^[a-zA-Z]$/)) {
    //     // Show warning
    //     showAlertToast(
    //       'Only alphabetic characters are allowed for individuals and actions!', 
    //       'error',
    //       'Invalid Shortcut'
    //     );

    //     // Remove listening to keypress after user pressed a key
    //     itemEl.removeEventListener('keydown', Hotkey.keypressHandler);

    //     // Hide the info badge
    //     badgeEl.classList.add('d-none');

    //     // Remove the focus from the element
    //     itemEl.blur();

    //     return;

    //   }

    //   // Ignore modifiers for actions and individuals (e.g. in case of upper case letters)
    //   hotkey.modifiers = [];

    // } else {
    //   hotkey.modifiers = pressedObj.modifiers;
    // }


    // Handle valid user key press
    // Assign the new hotkey values
    const response = await hotkey.update({ key : pressedKey, modifiers: pressedModifiers });
    if (!response) {
      // Show popover
      showPopover({
        domEl: itemEl,
        content: `Assignment of ${hotkeyHtml} to ${hotkeyDescHtml} failed. Try again.`, 
        title: 'Failed to Change Shortcut',
        type: 'error',
        placement: 'bottom'
      });
      return;
    }

    // Show user feedback 
    // Get the hotkey description
    const hotkeyDesc = hotkey.description;

    // Construct HTML code for the modifiers
    const modifierHtml = hotkey.modifiers.map(
      modifierText => `<span class="badge text-bg-dark">${modifierText}</span>`
    ).join('+');

    // Construct HTML code for the conflicting key
    const keyHtml = `<span class="badge text-bg-dark">${pressedKey}</span>`

    // Put the two together
    const hotkeyHtml = modifierHtml ? modifierHtml.concat('+', keyHtml) : keyHtml;
    const hotkeyDescHtml = `<span class="badge text-bg-dark">${hotkeyDesc}</span>`;

    // Show popover
    showPopover({
      domEl: itemEl,
      content: `${hotkeyHtml} is assigned to ${hotkeyDescHtml}.`, 
      title: 'Shortcut Changed',
      placement: 'bottom',
      type: 'success'
    });
  
    // Remove listening to keypress after user pressed a key
    itemEl.removeEventListener('keydown', Hotkey.keypressHandler);

    // Hide the info badge
    badgeEl.classList.add('d-none');

    // Remove the focus from the element
    itemEl.blur();

  }



  /**
   * Handles the cancellation of the hotkey assignment when the relevant DOM element is no longer focused
   * @param {Event} event blur event on the target DOM element
   */
  static handleHotkeyItemBlur(event) {
    const itemEl = event.target;
    if (!itemEl) return;

    const badgeEl = itemEl.querySelector('.hotkey-badge');
    if (!badgeEl) return;

    // Hide the info badge
    badgeEl.classList.add('d-none');

    // Remove listening to keypress after user pressed a key
    itemEl.removeEventListener('keydown', Hotkey.keypressHandler);

  }

  /**
   * Saves hotkeys to the config file
   * @returns {Promise}
   */
  static async saveToConfig() {
    const hotkeys = Hotkey.getAll();
    if (!hotkeys) return;

    // Update the config
    Config.shortcuts = hotkeys;
    const response = await Config.saveToFile();
    if(!response) {
      console.log('Shortcuts could not be saved to the config file!', 'error');
      return;
    }

    return response;

  }


}

class Metadata {

  constructor() {
    this.entries = new Map([
      ['videoName', null],
      ['videoFPS', null],
      ['timestamp', null],
      ['username', null],
      ['actions', null],
      ['individuals', null],
      ['appVersion', null],
      ['classIds', null],
      ['classNames', null],
      ['classColors', null],
      ['classRunningCounts', null],
    ]);
    
    const mainPlayer = Player.getMainPlayer();
    if (mainPlayer) {
      this.entries.set('videoName', mainPlayer.getName());
      this.entries.set('videoFPS', mainPlayer.getFrameRate());
      this.entries.set('timestamp', mainPlayer.getCurrentTime());
    }

    this.entries.set('username', Player.getUsername());
    this.entries.set('actions', Player.getActionNames());
    this.entries.set('individuals', Player.getIndividualNames());
    this.entries.set('appVersion', Player.getAppVersion());
    
  }

  get(key) {
    return this.entries.get(key);
  }

  get timestamp() {
    return this.entries.get('timestamp');
  }

  get videoName() {
    return this.entries.get('videoName');
  }

  get videoFPS() {
    return this.entries.get('videoFPS');
  }

  get username() {
    return this.entries.get('username');
  }

  get actions() {
    return this.entries.get('actions');
  }

  get individuals() {
    return this.entries.get('individuals');
  }

  get classIds() {
    return this.entries.get('classIds');
  }
   
  get classNames() {
    return this.entries.get('classNames');
  }

  get classColors() {
    return this.entries.get('classColors');
  }

  get classRunningCounts() {
    return this.entries.get('classRunningCounts');
  }

  has(key) {
    return this.entries.has(key);
  }

  update(key, value) {
    if (this.has(key)) {
      this.entries.set(key, value);
    }
  }

  updateAppVersion() {
    this.update('appVersion', Player.getAppVersion());
  }

  updateVideoName() {
    const mainPlayer = Player.getMainPlayer();
    if (mainPlayer) {
      this.update('videoName', mainPlayer.getName());
    }
  }

  updateVideoFPS() {
    const mainPlayer = Player.getMainPlayer();
    if (mainPlayer) {
      this.update('videoFPS', mainPlayer.getFrameRate());
    }
  }

  updateTimestamp() {
    const mainPlayer = Player.getMainPlayer();
    if (mainPlayer) {
      this.update('timestamp', mainPlayer.getCurrentTime());

    }
  }

  updateUsername() {
    this.update('username', Player.getUsername());
  }

  updateActions() {
    this.update('actions', Player.getActionNames());
  }

  updateIndividuals() {
    this.update('individuals', Player.getIndividualNames());
  }

  updateClassIds() {
    this.update('classIds', Player.getClassIds());
  }

  updateClassNames() {
    this.update('classNames', Player.getClassNames());
  }

  updateClassColors() {
    this.update('classColors', Player.getClassColors());
  }

  updateClassAttributes() {
    this.update('classIds', Player.getClassIds());
    this.update('classNames', Player.getClassNames());
    this.update('classColors', Player.getClassColors());
  }

  async writeToFile() {

    // Always update the timestamp
    this.updateTimestamp();
    
    // Convert entries from a Map to an Object and finally to a JSON string
    let jsonString = JSON.stringify(Object.fromEntries(this.entries), (key, value) => {
      if (value === undefined) {
        return null;
      }
      return value;
    });

    const response = await window.electronAPI.saveMetadata(jsonString, this.videoName);
    return response;

  }

}

class BoundingBox {

  static allInstances = [];
  static lineWidth = 3;
  static maxLineWidth = 10;
  static minLineWidth = 1;
  static opacity = 100;   // Default opacity value in percentage 
  static maxOpacity = 100;  // Max opacity value in percentage 
  static minOpacity = 10; // Min opacity value in percentage 
  static globalAlpha; // Alpha (opacity in decimals)
  static drawingColor = '#FF10F0' // Color for bounding boxes drawn by the user manually on the canvas
  static resizeHandleSize = 15; // Size in pixel for a handle within a bounding box on canvas for resizing it
  static resizeHandle;  // Keeps track of which corner of the bounding box user is resizing the bounding box
  static resizedInstance;
  static resizing = false;
  static resizeStartX;
  static resizeStartY;
  static resizeStartWidth;
  static resizeStartHeight;
  static naString = 'NA';  // String representation for undefined track properties

  static mousemoveDisabled = false; // Keeps tracks of whether mousemove handler on bounding boxes is disabled for resizing. This is used to prevent resizing wrong boxes when interpolation is enabled for resizing.
  
  // Resize handle names
  static resizeHandleNames = [
    'tr', // top-right
    'tl', // top-left
    'br', // bottom-right
    'bl', // bottom-left 
    'tc', // top-center
    'bc', // bottom-center
    'rc', // right-center
    'lc'  // left-center
  ];  

  

  /**
   * Populates the properties of a bounding box instance
   * @param {Object} obj 
   * @param {Number | String} obj.trackNumber Video frame number for this bounding box
   * @param {Number | String} obj.trackId Unique ID for this bounding box
   * @param {Number | String} obj.x Upper-left x coordinate (origin is assumed to be the top left corner of the video)
   * @param {Number | String} obj.y Upper-left y coordinate (origin is assumed to be the top left corner of the video)
   * @param {Number | String} obj.width Width in pixels
   * @param {Number | String} obj.height Height in pixels
   * @param {Number | String} obj.classId Class ID of the subject/object within the bounding box
   * @param {Number | String | undefined} obj.confidenceTrack (Optional) Confidence in tracking for this bounding box (0: lowest, 1: highest)
   * @param {Number | String | undefined} obj.nameOrder (Optional) The position (index) of the name that corresponds to the identified individual within the array of names for all individual in the relevant video
   * @param {Number | String | undefined} obj.confidenceId (Optional) Confidence in identification of the individual within this bounding box (0: lowest, 1: highest)
   * @param {Number | String | undefined} obj.index (Optional) Index of the bounding box in the master track array
   */
  constructor(obj = {}) {

    this.classId = obj.classId?.toString();
    this.trackId = obj.trackId?.toString();
    this.trackNumber = parseInt(obj.trackNumber);
    this.x = parseFloat(obj.x);
    this.y = parseFloat(obj.y);
    this.width = parseFloat(obj.width);
    this.height = parseFloat(obj.height);
    this.confidenceTrack = Number.isFinite(parseFloat(obj.confidenceTrack)) ? parseFloat(obj.confidenceTrack) : 0;
    this.nameOrder = Number.isSafeInteger(parseInt(obj.nameOrder)) ? parseInt(obj.nameOrder) : null;
    this.confidenceId = obj.confidenceId ? parseFloat(obj.confidenceId) : null;
    this.index = Number.isSafeInteger(parseInt(obj.index)) ? parseInt(obj.index) : null;
  }

  /**
   * Validates a given track Object and creates a new BoundingBox instance from it.
   * @param {Object} trackObj 
   * @returns {BoundingBox | undefined} Created BoundingBox instance if the input object is valid, undefined otherwise
   */
  static validateAndCreate(trackObj = {}) {

    // Get the string for invalid/unavailable properties
    const naString = BoundingBox.naString ?? 'NA';
    
    // String properties 
    // Because they are keys in the ID Map and can be falsy (i.e. number 0) which might cause issues for checking their validity
    const classId = trackObj['classId'] ?? naString;
    if (classId === naString) return;

    const trackId = trackObj['trackId'] ?? naString;
    if (trackId === naString) return;

    // Integer properties
    const intPropNames = ['trackNumber'];
    for (const propName of intPropNames) {
      const propVal = parseInt(trackObj[propName]) ?? naString;
      if (!Number.isSafeInteger(propVal) || propVal === naString) return;
    }

    // Numeric properties
    const numPropNames = [ 'x', 'y', 'width', 'height' ];
    for (const propName of numPropNames) {
      const propVal = parseFloat(trackObj[propName]) ?? naString;
      if (Number.isNaN(propVal) || !Number.isFinite(propVal) || propVal === naString) return;
    }

    // If every test was successful, create a new bBox instance
    const bBox = new BoundingBox(trackObj);
    if ( !(bBox instanceof BoundingBox) ) return;

    return bBox;


  }

  /**
   * Returns a random color code in hex which is different than all the existing class colors
   * @return {String | undefined} Color code in hex or undefined if the operation is failed
   */
  static getNewClassColor() {
    // Get the current colors
    const classColors = Player.getClassColors();
    if (!Array.isArray(classColors)) return;

    // Count the classes
    const classCount = classColors.length;

    // Get random colors more than the current class count
    const randomColors = getRandomColors(classCount+1);

    // Try to find a different color for new class
    const filteredColors = randomColors.filter(randomColor => !classColors.includes(randomColor));
    
    // If no unique random color could be found, return hex code for black 
    const newColor = filteredColors.at?.(0) ?? '#000000';

    return newColor;

  }
    



  /**
   * Enables the mousemove handler to execute on the main canvas to resize bounding boxes
   */
  static enableMousemove() {
    if (BoundingBox.hasOwnProperty('mousemoveDisabled')) {
      BoundingBox.mousemoveDisabled = false;
    }
  }

  /**
   * Disables the mousemove handler to execute on the main canvas to resize bounding boxes
   */
  static disableMousemove() {
    if (BoundingBox.hasOwnProperty('mousemoveDisabled')) {
      BoundingBox.mousemoveDisabled = true;
    }
  }

  /**
   * Gets the status for mousemove handler on bounding boxes 
   * @returns {Boolean} True if mousemove handler is disabled, false otherwise
   */
  static isMousemoveDisabled() {
    return BoundingBox.mousemoveDisabled;
  }

  static getMinLineWidth() {
    return BoundingBox.minLineWidth;
  }

  static getMaxLineWidth() {
    return BoundingBox.maxLineWidth;
  }

  static getLineWidth() {
    return BoundingBox.lineWidth;
  }

  /**
   * Gets the opacity value in percentage
   * @returns {Number} In percentage
   */
  static getOpacity() {
    return BoundingBox.opacity;
  }

  /**
   * Gets the alpha (opacity) value that is applied to shapes and images before they are drawn onto the canvas. 
   * @return {Number} 0.0 (fully transparent) and 1.0 (fully opaque), inclusive. 
   */
  static getGlobalAlpha() {
    const globalAlpha = BoundingBox.globalAlpha ?? BoundingBox.setGlobalAlpha();

    return globalAlpha;

  }

  /**
   * Sets the alpha (opacity) value that is applied to shapes and images before they are drawn onto the canvas. 
   * Converts the opacity from percentage to decimal.
   * @return {Number} Newly assigned alpha value
   */
  static setGlobalAlpha() {

    // Get the opacity in percentage
    const opacity = BoundingBox.getOpacity() ?? 100;

    // Get the range of opacity
    const minOpacity = BoundingBox.getMinOpacity() ?? 10;
    const maxOpacity = BoundingBox.getMaxOpacity() ?? 100;

    // Convert percentages to decimals
    const alpha = Math.max(minOpacity, Math.min(maxOpacity, opacity)) / 100; 

    // Set the global alpha
    BoundingBox.globalAlpha = alpha;

    return BoundingBox.globalAlpha;

  }

  static getMaxOpacity() {
    return BoundingBox.maxOpacity;
  }

  static getMinOpacity() {
    return BoundingBox.minOpacity;
  }

  /**
   * Sets the DrawnBoundingBox instance for resized bounding box on the drawing canvas over the main video
   * @param {DrawnBoundingBox | undefined} bBox If it is undefined, a new instance of DrawnBoundingBox will be created and assigned
   * @returns {DrawnBoundingBox} Newly Assigned DrawnBoundingBox instance
   */
  static setResizedBBox(bBox) {
    BoundingBox.resizedInstance = (bBox instanceof DrawnBoundingBox) ? bBox : new DrawnBoundingBox();
    return BoundingBox.resizedInstance;
  }

  /**
   * Gets the DrawnBoundingBox instance for the resized bounding box on the drawing canvas over the main video
   * @returns {DrawnBoundingBox} 
   */
  static getResizedBBox() {
    return BoundingBox.resizedInstance;
  }

  /**
   * Determines whether the user is resizing of a Bounding Box or not
   * @returns {Boolean} True if user resizing, false otherwise
   */
  static isResizing() {
    return BoundingBox.resizing;
  }

  /**
   * Mark that user is resizing of a Bounding Box
   */
  static enableResizing() {
    BoundingBox.resizing = true;
  }

  /**
   * Mark that user stopped resizing of a Bounding Box
   */
  static disableResizing() {
    BoundingBox.resizing = false;
  }

  /**
   * Gets the color code in hex for bounding boxes drawn by the user on the canvas
   * @returns 
   */
  static getDrawingColor() {
    return BoundingBox.drawingColor;
  }

  /**
   * Gets the size in pixel for handles within bounding boxes on the canvas for resizing them
   * @returns {Number} Pixel count
   */
  static getResizeHandleSize() {
    return BoundingBox.resizeHandleSize ?? 25;
  }

  /**
   * Gets the clicked/dragged resizing handle
   * @returns {String}
   */
  static getResizeHandle() {
    return BoundingBox.resizeHandle;
  }

  static getResizeHandleNames() {
    return BoundingBox.resizeHandleNames;
  }

  /**
   * Sets the corner for resizing
   * @param {String} handle Should be either tr, tl, br or bl (top-right, top-left, bottom-right, bottom-left)
   * @returns {String | undefined} Resize handle name or undefined if an error occurs
   */
  static setResizeHandle(handle) {
    if (!handle) return;

    const handleNames = BoundingBox.getResizeHandleNames();
    if (!handleNames) return;

    if (!handleNames.includes(handle)) return;

    if (!BoundingBox.hasOwnProperty('resizeHandle')) return;

    BoundingBox.resizeHandle = handle;

    return BoundingBox.resizeHandle;

  }

  /**
   * Sets the resizing dimensions
   * @param {Object} obj 
   * @param {Number} obj.startX
   * @param {Number} obj.startY
   * @param {Number} obj.width
   * @param {Number} obj.height
   * @returns {Boolean | undefined} True if the assignment is successful, undefined otherwise
   */
  static setResizeDims ({ startX, startY, width, height } = {}) {
    // Validate the arguments
    for (const arg of [ startX, startY, width, height ]) {
      if (typeof arg === 'undefined' || arg === null) return;
    }

    // Check if all target properties exists in the BoundingBox Class
    const props = [ 'resizeStartX', 'resizeStartY', 'resizeStartWidth', 'resizeStartHeight' ];
    for (const prop of props) {
      if (!BoundingBox.hasOwnProperty(prop)) return;
    }

    // Set the props
    BoundingBox.resizeStartX = startX;
    BoundingBox.resizeStartY = startY;
    BoundingBox.resizeStartWidth = width;
    BoundingBox.resizeStartHeight = height;

    return true;
  }

  /**
   * Sets the line width for all bounding boxes when drawing them on canvas elements
   * @param {Number | String} lineWidth Line width in pixels
   * @returns {Promise<Number | undefined>} Updated line width if successful or undefined if unsuccessful
   */
  static async setLineWidth(lineWidth) {
    if (typeof BoundingBox.lineWidth === 'undefined' || BoundingBox.lineWidth === null) return;

    // Convert the input to float
    const parsedVal = Number.parseFloat(lineWidth);
    
    // Check the validity of the input
    if (Number.isNaN(parsedVal) || !Number.isFinite(parsedVal)) return;

    if (parsedVal < BoundingBox.getMinLineWidth() ||
     parsedVal > BoundingBox.getMaxLineWidth()
    ) return;

    // Set the new line width
    BoundingBox.lineWidth = parsedVal;

    // Try to save the new value to the config
    Config.boundingBoxLineWidth = BoundingBox.lineWidth;
    const response = await Config.saveToFile();
    if (!response) return;

    // Update the settings modal element
    const boundBoxLineWidthInput = document.getElementById('bounding-box-line-width-input');
    if (boundBoxLineWidthInput) {
      boundBoxLineWidthInput.value = BoundingBox.lineWidth;
    }

    return BoundingBox.lineWidth;

  }

  /**
   * Sets the opacity for all bounding boxes when drawing them on canvas elements
   * @param {Number | String} opacity Opacity value as percentage
   * @returns {Promise<Number | undefined>} Updated opacity if successful or undefined if unsuccessful
   */
  static async setOpacity(opacity) {
    if (typeof BoundingBox.opacity === 'undefined' || BoundingBox.opacity === null) return;

    // Convert the input to float
    const parsedVal = Number.parseFloat(opacity);
    
    // Check the validity of the input
    if (Number.isNaN(parsedVal) || !Number.isFinite(parsedVal)) return;

    // Get the range of opacity
    const minOpacity = BoundingBox.getMinOpacity();
    const maxOpacity = BoundingBox.getMaxOpacity();
    
    // Bound the parsed value to be between min and max values
    const normalizedVal = Math.max(minOpacity, Math.min(maxOpacity, parsedVal)); 

    // Set the new opacity and alpha values
    BoundingBox.opacity = normalizedVal;
    BoundingBox.setGlobalAlpha();

    // Try to save the new value to the config file
    Config.boundingBoxOpacity = BoundingBox.opacity;
    const response = await Config.saveToFile();
    if (!response) return;

    // Update the settings modal element
    const boundBoxOpacityInput = document.getElementById('bounding-box-opacity');
    if (boundBoxOpacityInput) {
      boundBoxOpacityInput.value = BoundingBox.opacity;
    }

    return BoundingBox.opacity;

  }

  /**
   * Converts BoundingBox instance to an Object for robust file I/0 (e.g. sending data to main.js)
   * @returns { Object | undefined }
   */
  toObject() {
    return {
      trackNumber: this.getTrackNumber(),
      trackId: this.getTrackId(),
      x: this.getX(),
      y: this.getY(),
      width: this.getWidth(),
      height: this.getHeight(),
      confidenceTrack: this.getConfidenceTrack(),
      classId: this.getClassId(),
      nameOrder: this.getNameOrder(),
      confidenceId: this.getConfidenceId()
    }
  }

  clone(changes = {}) {
    return new BoundingBox({
      trackNumber: changes.trackNumber ?? this.trackNumber,
      trackId: changes.trackId ?? this.trackId,
      x: changes.x ?? this.x,
      y: changes.y ?? this.y,
      width: changes.width ?? this.width,
      height: changes.height ?? this.height,
      classId: changes.classId ?? this.classId,
      confidenceTrack: changes.confidenceTrack ?? this.confidenceTrack,
      nameOrder: changes.nameOrder ?? this.nameOrder,
      confidenceId: changes.confidenceId ?? this.confidenceId,
      index: changes.index ?? this.index
    }); 
  }


  /**
   * Sets an arbitrary properties of a bounding box
   * @param {Object} obj Object with key-value pairs
   * @returns {Boolean} True if all keys and values are valid, false otherwise
   */
  set(obj = {}) {

    // Iterate over given entries (Object with key-value pairs)
    for (const [key, value] of Object.entries(obj)) {

      // Flag for tracking success/failures
      let isSuccess;

      switch (key) {
        case 'classId':
          isSuccess = this.setClassId(value);
          break;
        case 'x':
          isSuccess = this.setX(value);
          break;
        case 'y':
          isSuccess = this.setY(value);
          break;
        case 'width':
          isSuccess = this.setWidth(value);
          break;
        case 'height':
          isSuccess = this.setHeight(value);
          break;
        case 'trackId':
          isSuccess = this.setTrackId(value);
          break;
        case 'trackNumber':
          isSuccess = this.setTrackNumber(value);
          break;
        case 'confidenceTrack':
          isSuccess = this.setConfidenceTrack(value);
          break;
        case 'confidenceId':
          isSuccess = this.setConfidenceId(value);
          break;
        case 'nameOrder':
          isSuccess = this.setNameOrder(value);
          break;
        default:
          isSuccess = undefined;
      }

      if (typeof isSuccess === 'undefined') return false;

    }

    // Return true if all key-values are valid
    return true;

  }

  /**
   * Sets the index of a bounding box in the master array
   * @param {Number | String} idx 
   * @returns {Boolean} True if the operation is successful, false otherwise
   */
  setIndex(idx) {
    const parsedIdx = parseInt(idx);
    if (!Number.isSafeInteger(idx) || !Number.isFinite(idx)) return;
    this.index = parsedIdx;
    
    return true;

  }


  /**
   * Sets the class ID of a bounding box
   * @param {String | Number} classId Always converted to String
   * @returns {String | undefined} Class ID in String type if the assignment was successful, otherwise undefined
   * 
   */
  setClassId(classId) {
    if (typeof classId === 'undefined' || classId === null) return;
    this.classId = classId.toString();
    return this.classId;
  }

  /**
   * Sets the x-coordinate of a bounding box
   * @param {Number | String } x X-coordinate value 
   * @returns {Number | undefined} X-coordinate in Number type if the assignment was successful, otherwise undefined
   */
  setX(x) {
    const parsedVal = parseFloat(x);
    if (Number.isNaN(parsedVal) || !Number.isFinite(parsedVal)) return;
    this.x = parsedVal;
    return this.x;
  }

  /**
   * Sets the y-coordinate of a bounding box
   * @param {Number | String } x Y-coordinate value 
   * @returns {Number | undefined} Y-coordinate in Number type if the assignment was successful, otherwise undefined
   */
  setY(y){
    const parsedVal = parseFloat(y);
    if (Number.isNaN(parsedVal) || !Number.isFinite(parsedVal)) return;
    this.y = parsedVal;
    return this.y;
  }

  /**
   * Sets the width of a bounding box
   * @param {Number | String } x Width value 
   * @returns {Number | undefined} Width in Number type if the assignment was successful, otherwise undefined
   */
  setWidth(width) {
    const parsedVal = parseFloat(width);
    if (Number.isNaN(parsedVal) || !Number.isFinite(parsedVal)) return;
    this.width = parsedVal;
    return this.width;
  }

  /**
   * Sets the height of a bounding box
   * @param {Number | String } height Height value 
   * @returns {Number | undefined} Height in Number type if the assignment was successful, otherwise undefined
   */
  setHeight(height) {
    const parsedVal = parseFloat(height);
    if (Number.isNaN(parsedVal) || !Number.isFinite(parsedVal)) return;
    this.height = parsedVal;
    return this.height;
  }

  /**
   * Sets the track ID of a bounding box
   * @param {String | Number} trackId Always converted to String
   * @returns {String | undefined} Track ID in String type if the assignment was successful, undefined otherwise
   */
  setTrackId(trackId) {
    if (typeof trackId === 'undefined' || trackId === null) return;
    this.trackId = trackId.toString();
    return this.trackId;
  }

  /**
   * Sets the track/frame number of a bounding box
   * @param {Number | String} trackNumber Always converted to an integer
   * @returns {Number | undefined} Track/frame number if the assignment was successful, otherwise undefined
   */
  setTrackNumber(trackNumber) {
    const parsedVal = parseInt(trackNumber);
    if (Number.isNaN(parsedVal)) return;
    this.trackNumber = parsedVal;
    return this.trackNumber;
  }

  /**
   * Sets the confidence value for tracking a bounding box
   * @param {Number | String} confidence Always converted to a float
   * @returns {Number | undefined} Confidence value if the assignment was successful, undefined otherwise
   */
  setConfidenceTrack(confidence) {
    const parsedVal = parseFloat(confidence);
    if (Number.isNaN(parsedVal)) return;
    this.confidenceTrack = parsedVal;
    return this.confidenceTrack;
  }

  /**
   * Sets the confidence value for identifying a bounding box
   * @param {Number | String} confidence Always converted to a float
   * @returns {Number | undefined} Confidence value if the assignment was successful, undefined otherwise
   */
  setConfidenceId(confidence) {
    const parsedVal = parseFloat(confidence);
    if (Number.isNaN(parsedVal)) return;
    this.confidenceId = parsedVal;
    return this.confidenceId;
  }
  
  /**
   * Sets the index (order) of the assigned name of this instance in the name array
   * @param {Number | String} nameOrder
   * @returns {Number | undefined} Name order if the assignment was successful, undefined otherwise
   */
  setNameOrder(nameOrder) {
    const parsedVal = parseInt(nameOrder);
    if (!Number.isSafeInteger(parsedVal) || parsedVal < 0) return;
    this.nameOrder = parsedVal;
    return this.nameOrder;
  }

  /**
   * Gets the index of a bounding box in the master array
   * @returns {Number | undefined}
   */
  getIndex() {
    return this.index;
  }

  /**
   * Gets the track ID
   * @returns {String} String representation of an integer
   */
  getTrackId() {
    return this.trackId;
  }

  /**
   * Gets the frame/track number
   * @returns {Number} Integer
   */
  getTrackNumber() {
    return parseInt(this.trackNumber);
  }

  /**
   * Gets the class ID
   * @returns {String} String representation of an integer
   */
  getClassId() {
    return this.classId;
  }

  /**
   * Confidence in producing this sBoundingBox for the subject.
   * Given as a decimal between 0 (lowest confidence) and 1 (highest confidence)
   * @returns {Number} Float
   */
  getConfidenceTrack() {
    return this.confidenceTrack;
  }

  /**
   * Confidence in naming the subject associated with the BoundingBox.
   * Given as a decimal between 0 (lowest confidence) and 1 (highest confidence)
   * @returns {Number} Float
   */
  getConfidenceId() {
    return this.confidenceId;
  }

  /**
   * Gets the index of the name assigned to a BoundingBox in the array for all names
   * @returns {Number} Index of the name in the name array
   */
  getNameOrder() {
    return this.nameOrder;
  }


  /**
   * Gets the color of class for drawing its bounding box
   * @returns {String | undefined} Hex color code
   */
  getColor() {
    return Player.getClassColor(this.classId);
  }

  /**
   * Gets the top-left x-coordinate of BoundingBox instance relative to canvas origin
   * @returns {Number | undefined}
   */
  getX() {
    return this.x;
  }

  /**
   * Gets the top-left y-coordinate of BoundingBox instance relative to canvas origin
   * @returns {Number | undefined}
   */
  getY() {
    return this.y;
  }

  /**
   * Gets the width in pixels
   * @returns {Number | undefined}
   */
  getWidth() {
    return this.width;
  }

  /**
   * Gets the height in pixels
   * @returns {Number | undefined}
   */
  getHeight() {
    return this.height;
  }

  


  // Creating new bounding boxes (BB)
    // Go to the first frame for the new BB
    // Draw BB on the canvas
    // Ask for user confirmation
    // Save the first BB on the frame temporarily
    // Ask user to go to another frame to draw a second BB
    // Draw the second  BB
    // Save the second and first BB 
    // Extrapolate BBs for the frames in-between


  // Resizing bounding boxes
    // On mousedown over the main canvas
      // If mouse is over one of the the resizing handles
        // Flag isResizing to true
    // On mousemove over the main canvas
      // If isResizing is set to true
        // Change the size of resized BB with mousemove
    // On mouseup over the main canvas
      // If isResizing is set to true
        // Save the new dimensions of the resized BB




}

class DrawnBoundingBox extends BoundingBox {

  static interpolating; // Set to true if user choose interpolation and is expected draw the last BBox. Otherwise, set to false.
  static interpolationElOnMainBarId = 'interpolation-main-bar-div';
  static newIdStr = 'NEW';  // Placeholder string for class and track IDs that are yet to be assigned by the user
  static canCreateNewInstance = true;  // Set to true when user is allowed to create a new instance by entering all-valid inputs for the instance properties
  static errorTitle;  // Title for the error message when user enters an invalid input
  static errorContent;  // Content for the error message when user enters an invalid input

  constructor(trackProps = {}) {
    super(trackProps);
    this.interpolatedBBoxes = [];
    this.initialFirstBBox = null;  // Save the initial first bounding box with its properties before any modification by the user for the cancellation 
    this.initialLastBBox = null;  // Save the initial last bounding box (when interpolating) with its properties before any modification by the user for the cancellation 
  }

  /**
   * Gets the Placeholder string for class and track IDs that are yet to be assigned by the user
   */
  static getNewIdStr() {
    return DrawnBoundingBox.newIdStr;
  }

  /**
   * Disables new bounding box creation or addition to TrackingMap. 
   * Usually called when user enters an invalid input for bounding box creation on the canvas.
   * @param {Object} reason
   * @param {String | undefined} reason.title Error message title
   * @param {String | undefined} reason.content Error message content
   */
  static disableCreation(reason = {}) {
    DrawnBoundingBox.canCreateNewInstance = false;
    
    // Add error reason strings
    DrawnBoundingBox.errorTitle = reason?.title;
    DrawnBoundingBox.errorContent = reason?.content;
  }

  /**
   * Enables new bounding box creation or addition to TrackingMap. 
   * Usually called when user enters valid inputs for bounding box creation on the canvas.
   */
  static enableCreation() {
    DrawnBoundingBox.canCreateNewInstance = true;

    // Reset error reason strings
    DrawnBoundingBox.errorTitle = null;
    DrawnBoundingBox.errorContent = null;
  }

  /**
   * Gets the status for creating a new instance
   * @returns {Boolean} 
   */
  static canCreateNew() {
    return DrawnBoundingBox.canCreateNewInstance;
  }

  /**
   * Gets the error title and content
   * @returns {Object | undefined} Object with title and content properties. Returns undefined if no error occurred.
   */
  static getErrorReason() {
    const title = DrawnBoundingBox.errorTitle;
    const content = DrawnBoundingBox.errorContent;

    if (typeof title === 'undefined' || title === null || typeof content === 'undefined' || content === null) return;

    return {
      title: title,
      content: content
    }

  }

  static enableInterpolation() {
    DrawnBoundingBox.interpolating = true;

    // Make interpolation div on the main video bar visible
    const interpolationBarDiv = document.getElementById(DrawnBoundingBox.interpolationElOnMainBarId);
    if (!interpolationBarDiv) return;
    
    // Get the badge element to display track information
    const badgeEl = interpolationBarDiv.querySelector('.badge');
    if (!badgeEl) return;
    
    // Get the bounding box that is being interpolated
    const drawnBBox = BoundingBox.isResizing() ? BoundingBox.getResizedBBox() : Player.getDrawnBBox();
    if (!drawnBBox) return;

    const firstBBox = drawnBBox.getFirstBBox();
    if (!firstBBox) return;
    
    // Populate the badge with track information
    const classText = Player.getClassName(firstBBox.classId) ?? firstBBox.classId;

    badgeEl.textContent = classText + '-' + firstBBox.getTrackId();
    interpolationBarDiv.classList.remove('d-none');
    
  }

  static disableInterpolation() {
    DrawnBoundingBox.interpolating = false;
    
    // Hide interpolation div on the main video bar
    const interpolationBarDiv = document.getElementById(DrawnBoundingBox.interpolationElOnMainBarId);
    if (interpolationBarDiv) interpolationBarDiv.classList.add('d-none');

  }

  static isInterpolating() {
    return DrawnBoundingBox.interpolating;
  }

  /**
   * Saves a clone of the original first BoundingBox instance (while resizing a single instance or interpolating) with its properties before any modification by the user. To be used for revert ing user edits. If a BoundingBox instance is already saved, it does not change it.
   * @param {BoundingBox} bBox Initial BoundingBox instance
   * @returns {BoundingBox | undefined} Saved BoundingBox instance or undefined if an error occurs. 
   */
  addInitFirstBBox(bBox) {
    if ( !(bBox instanceof BoundingBox) ) return;

    // Only change the initial BBox when it was not set before
    if ( (this.initialFirstBBox instanceof BoundingBox) ) return;
    this.initialFirstBBox = bBox.clone();
    return this.initialFirstBBox;

  }

  /**
   * Saves a clone of the original last BoundingBox instance (when interpolating) with its properties before any modification by the user. To be used for revert ing user edits. If a BoundingBox instance is already saved, it does not change it.
   * @param {BoundingBox} bBox Initial BoundingBox instance
   * @returns {BoundingBox | undefined} Saved BoundingBox instance or undefined if an error occurs. 
   */
  addInitLastBBox(bBox) {
    if ( !(bBox instanceof BoundingBox) ) return;

    // Only change the initial BBox when it was not set before
    if ( (this.initialLastBBox instanceof BoundingBox) ) return;
    this.initialLastBBox = bBox.clone();
    return this.initialLastBBox;

  }

  /**
   * Gets the clone of the original first BoundingBox instance with its properties before any modification by the user. To be used for revert ing user edits.
   * @returns {BoundingBox | undefined} Saved BoundingBox instance or undefined if an error occurs.
   */
  getInitFirstBBox() {
    return this.initialFirstBBox;
  }

  /**
   * Gets the clone of the original last BoundingBox instance with its properties before any modification by the user. To be used for revert ing user edits.
   * @returns {BoundingBox | undefined} Saved BoundingBox instance or undefined if an error occurs.
   */
  getInitLastBBox() {
    return this.initialLastBBox;
  }

  /**
   * Saves the BoundingBox instance in the initial frame for interpolation 
   * @param {BoundingBox} boundingBox BoundingBox instance
   * @returns {BoundingBox | undefined} Newly added BoundingBox instance or undefined if the operation was failed
   */
  addFirstBBox(boundingBox) {
    if (!(boundingBox instanceof BoundingBox)) {
      console.log('Input must be an instance of the BoundingBox class!');
      return;
    }
    this.firstBBox = boundingBox;
    this.addInitFirstBBox(boundingBox);
    return this.firstBBox;
  }

  /**
   * Saves the BoundingBox instance in the last frame for interpolation 
   * @param {BoundingBox | undefined} boundingBox BoundingBox instance
   * @returns {BoundingBox | undefined} Newly added BoundingBox instance or undefined if the operation was failed
   */
  addLastBBox(boundingBox) {
    if (!(boundingBox instanceof BoundingBox)) {
      console.log('Input must be an instance of the BoundingBox class!');
      return;
    }
    this.lastBBox = boundingBox;
    this.addInitLastBBox(boundingBox);
    return this.lastBBox;
  }

  /**
   * Gets the BoundingBox instance in the initial frame for interpolation 
   * @returns {BoundingBox}
   */
  getFirstBBox() {
    return this.firstBBox;
  }

  /**
   * Gets the BoundingBox instance in the last frame for interpolation 
   * @returns {BoundingBox}
   */
  getLastBBox() {
    return this.lastBBox;
  }

  /**
   * Saves the interpolated BoundingBox instance from the given two frames
   * @param {BoundingBox} boundingBox BoundingBox instance
   */
  addInterpolated(boundingBox) {
    if (!(boundingBox instanceof BoundingBox)) {
      console.log('Input must be an instance of the BoundingBox class!');
      return;
    }
    this.interpolatedBBoxes.push(boundingBox);
  }

  /**
   * Interpolates the positions of BoundingBoxes between two given frames
   * @returns {BoundingBox[]} Array of interpolated bounding box instances
   */
  interpolate() {
    const firstBBox = this.getFirstBBox();
    const lastBBox = this.getLastBBox(); 
    if ( !(firstBBox instanceof BoundingBox) || !(lastBBox instanceof BoundingBox) ) return;

    // Find the number of frames between the first and last frames
    const frameDiff = parseInt(lastBBox.getTrackNumber()) - parseInt(firstBBox.getTrackNumber()) - 1;
    // If the last frame number is smaller than the first, start counting from the last frame
    const earlierBBox = frameDiff < 0 ? lastBBox : firstBBox;
    const laterBBox = frameDiff < 0 ? firstBBox : lastBBox;
    
    // Check if there is more than 1 frame of difference
    const frameCount = Math.abs(frameDiff);
    if (!Number.isSafeInteger(frameCount) || frameCount < 1) return;
    
    // Calculate speed of change for coordinates and dimensions
    const xSpeed = (laterBBox.x - earlierBBox.x) / frameCount;
    const ySpeed = (laterBBox.y - earlierBBox.y) / frameCount;
    const widthSpeed = (laterBBox.width - earlierBBox.width) / frameCount;
    const heightSpeed = (laterBBox.height - earlierBBox.height) / frameCount;

    const trackingMap = Player.getMainPlayer()?.getTrackingMap();
    if (!trackingMap || trackingMap.isEmpty()) return;

    // If interpolation is for a resized bounding box
    if (BoundingBox.isResizing()) {

      // Get the indices of BoundingBoxes in frames between
      const idxArr = trackingMap.getIndices({
        classId: earlierBBox.getClassId(),
        trackId: earlierBBox.getTrackId(),
        startFrame: earlierBBox.getTrackNumber(),
        endFrame: laterBBox.getTrackNumber()
      });
      
      // Attempt to delete the tracks before creating new ones
      const isDeleted = trackingMap.deleteByIndices(idxArr);
      if (!isDeleted) return;

      // Update their dimensions
      // this.interpolatedBBoxes.forEach(bBox => )

    }

    // Linear interpolation
    for (let t = 1; t <= frameCount; t++) {
      // Create a new BoundingBox with the calculated coordinates
      const newBBox = earlierBBox.clone({ 
        x: earlierBBox.x + xSpeed * t,  // Calculate the x-coordinate
        y: earlierBBox.y + ySpeed * t,  // Calculate the y-coordinate
        trackNumber: earlierBBox.getTrackNumber() + t, // Progress one frame
        width: earlierBBox.width + widthSpeed * t,  // Increment width
        height: earlierBBox.height + heightSpeed * t, // Increment height
      });

      // Save the newly created BoundingBox
      this.addInterpolated(newBBox);

    }

    // Reset interpolation
    DrawnBoundingBox.disableInterpolation();

    return this.interpolatedBBoxes;

  }

  /**
   * Handles change on the input element for choosing a class for the bounding box drawn by the user.
   * Redraws the bounding box with the validated color and adds the label with the validated class ID and track ID.
   * @param {Event} e "change" event on the input element
   * @returns 
   */
   static handleClassChange(e) {
    
    // Get the canvas
    const drawingCanvas = document.getElementById(Player.drawingCanvasId);
    if (!drawingCanvas) return;

    // Get the context
    const ctx = drawingCanvas.getContext('2d');
    if (!ctx) return;

    // Get the temporary object which contains the drawn bounding box properties
    const drawingRect = Player.getMainPlayer?.()?.drawingRect;
    if (!drawingRect) return;

    // Get the result
    const result = DrawnBoundingBox.validateClassInput();
    if (!result) return;
    
    // Get valid class input properties
    const { classId, trackId, classColor } = result;

    // Redraw the bounding box with colors for the selected class
    ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    ctx.strokeStyle = classColor ?? 'black';
    ctx.strokeRect(drawingRect.startX, drawingRect.startY, drawingRect.width, drawingRect.height);
    ctx.beginPath();

    // Create the label
    const labelText = `${classId}-${trackId}`;
    ctx.font = '20px tahoma';
    const labelWidth = ctx.measureText(labelText).width + 15;
    const labelHeight = 30;
    const padding = 5;
    
    // Label coordinates - placed on top left corner of the rectangle
    // width < 0 => drawn from right to left
    // height < 0 => drawn from bottom to top
    const labelX = drawingRect.startX + (drawingRect.width < 0 ? drawingRect.width : 0);
    const labelY = drawingRect.startY + (drawingRect.height < 0 ? drawingRect.height : 0) - labelHeight; 

    // Continue drawing after edge cases are handled
    ctx.rect(labelX, labelY, labelWidth, labelHeight);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.fillText(labelText, labelX+padding, labelY+labelHeight-padding)
    ctx.stroke();

  }


  /**
   * Handles change on the input element for choosing a class for the bounding box drawn by the user
   * @param {Event} e "change" event on the input element
   * @returns 
   */
  // static handleClassChange(e) {

  //   const mainPlayer = Player.getMainPlayer();
  //   if (!mainPlayer) return;

  //   const trackingMap = mainPlayer.getTrackingMap();
  //   if (!(trackingMap instanceof TrackingMap)) return;

  //   const drawingRect = mainPlayer.drawingRect;
  //   if (!drawingRect) return;
    
  //   const drawingCanvas = document.getElementById(Player.drawingCanvasId);
  //   if (!drawingCanvas) return;

  //   const ctx = drawingCanvas.getContext('2d');
  //   if (!ctx) return;

  //   const drawnBBox = Player.getDrawnBBox();
  //   if (!drawnBBox) return;

  //   const firstBBox = drawnBBox.getFirstBBox();
  //   if (!firstBBox) return;

  //   // Get the select element for class selection
  //   const classInput = e.target;
  //   if (!classInput) return;

  //   const outerDiv = document.getElementById(Player.drawnBBoxDivId);
  //   if (!outerDiv) return;

  //   // Color input element for a new class
  //   const colorInput = outerDiv.querySelector('input[type="color"]');
  //   if (!colorInput) return;

  //   // Datalist element containing options for existing classes
  //   const dataList = outerDiv.querySelector('datalist');
  //   if (!dataList) return;

  //   // Add event listener to select element within the div 
  //   //  to confirm drawing of a new bounding box to detect class selection change
  //   // Get the selected class ID
  //   // const selectedEl = classInput.options[selectedIdx];
  //   const inputClassName = classInput.value.trim();

  //   // If no input is given, do nothing
  //   if (inputClassName === '') {
  //     DrawnBoundingBox.disableCreation({ 
  //       title: 'Empty Class Input', 
  //       content: 'Please enter a class name!'
  //     });
  //     return;
  //   }

  //   // Validate the input: Only allow letters, numbers, dash and underscore
  //   const isValidName = DrawnBoundingBox.validateClassNameInput(inputClassName);
  //   if (!isValidName) {
  //     showPopover({
  //       domEl: classInput,
  //       title: 'Invalid Class Name',
  //       content: `Class names must contain only <span class="badge text-bg-dark">letters</span>, <span class="badge text-bg-dark">numbers</span>, <span class="badge text-bg-dark">underscores</span>, or <span class="badge text-bg-dark">dashes</span>.`,
  //       placement: 'top',
  //       type: 'error',
  //     });
  //     DrawnBoundingBox.disableCreation();
  //     return;
  //   }

  //   // Get the DOM element for new class selection
  //   const newClassCheck = outerDiv.querySelector('.new-class-check');
  //   if (!newClassCheck) return;
    
  //   // Determine whether the new class option is selected or not
  //   const isNewClassChecked = newClassCheck.checked;

  //   // Check if the input class name is an existing class
  //   const isInputNew = !(trackingMap.hasClassName?.(inputClassName));

  //   // Keep track of class properties
  //   let classId, trackId, classColor;

  //   // If the new class option is selected,
  //   if (isNewClassChecked) {
      
  //     // If input is not new but new class option is checked, warn user
  //     if (!isInputNew) {
  //       showPopover({
  //         domEl: classInput,
  //         title: 'Failed to Create New Class',
  //         content: `Class <span class="badge text-bg-dark">${inputClassName}</span> already exist! Either uncheck the option <span class="badge text-bg-dark">New</span> or enter a different name.`,
  //         placement: 'top',
  //         type: 'error',
  //       });
  //       DrawnBoundingBox.disableCreation();
  //       return;
  //     } 

  //     // If input is new
  //     // Calculate the class ID for the new class name
  //     // Try adding the new class and track IDs to firstBBox instance
  //     classId = firstBBox.setClassId(trackingMap.getFirstAvailClassId());
  //     trackId = firstBBox.setTrackId('0'); // Set the track ID to 0 since this is the first track that belong the newly created class
      
  //     // Try setting the class color
  //     classColor = colorInput.value;

  //     // Show alert if an error occurs
  //     for (const classProp of [classId, trackId, classColor]) {
  //       if (typeof classProp === 'undefined' || classProp === null) {
  //         showPopover({
  //           domEl: classInput,
  //           title: 'Failed to Create New Class',
  //           content: `Class <span class="badge text-bg-dark">${inputClassName}</span> could not be created! Please try again.`,
  //           placement: 'top',
  //           type: 'error',
  //         });

  //         // Disable bounding box creation
  //         DrawnBoundingBox.disableCreation();
  //         return;
  //       }
  //     }
      
  //     // If the new class option is NOT selected
  //   } else {

  //     // Make sure the input is an existing class
  //     const isInputValid = !isInputNew;

  //     // If input is not valid, give feedback
  //     if (!isInputValid) {
  //       showPopover({
  //         domEl: classInput,
  //         title: 'Invalid Class',
  //         content: `Class <span class="badge text-bg-dark">${inputClassName}</span> does not exist! Either select an existing class or check <span class="badge text-bg-dark">New</span> option to create a new class.`,
  //         placement: 'top',
  //         type: 'error',
  //         hideTimeout: 5000
  //       });
  //       DrawnBoundingBox.disableCreation();
  //       return;
  //     }
      
  //     // If input is valid
  //     // Get the track ID and color for the selected class
  //     // Update the properties of the first drawn BoundingBox
  //     classId = firstBBox.setClassId(dataList.querySelector(`option[value='${inputClassName}']`).dataset.classId);
  //     trackId = firstBBox.setTrackId(Player.getFirstAvailTrackId(classId));
  //     classColor = Player.getClassColor(classId);

  //     // console.log('classId, trackId, classColor', classId, trackId, classColor)
      
  //     // Show alert if an error occurs
  //     for (const classProp of [classId, trackId, classColor]) {
  //       if (typeof classProp === 'undefined' || classProp === null) {
  //         showPopover({
  //           domEl: classInput,
  //           title: 'Failed to Assign Class',
  //           content: `Assignment to class <span class="badge text-bg-dark">${inputClassName}</span> failed! Please try again.`,
  //           placement: 'top',
  //           type: 'error',
  //         });
  //         DrawnBoundingBox.disableCreation();
  //         return;
  //       }

  //     }

  //   }

  //   // If no errors, allow BoundingBox creation when user confirms the input by clicking the Save button
  //   DrawnBoundingBox.enableCreation();

  //   // Redraw the bounding box with colors for the selected class
  //   ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
  //   ctx.strokeStyle = classColor;
  //   ctx.strokeRect(drawingRect.startX, drawingRect.startY, drawingRect.width, drawingRect.height);
  //   ctx.beginPath();

  //   // Create the label
  //   const labelText = `${classId}-${trackId}`;
  //   ctx.font = '20px tahoma';
  //   const labelWidth = ctx.measureText(labelText).width + 15;
  //   const labelHeight = 30;
  //   const padding = 5;
    
  //   // Label coordinates - placed on top left corner of the rectangle
  //   // width < 0 => drawn from right to left
  //   // height < 0 => drawn from bottom to top
  //   const labelX = drawingRect.startX + (drawingRect.width < 0 ? drawingRect.width : 0);
  //   const labelY = drawingRect.startY + (drawingRect.height < 0 ? drawingRect.height : 0) - labelHeight; 

  //   // Continue drawing after edge cases are handled
  //   ctx.rect(labelX, labelY, labelWidth, labelHeight);
  //   ctx.fillStyle = 'white';
  //   ctx.fill();
  //   ctx.fillStyle = 'black';
  //   ctx.fillText(labelText, labelX+padding, labelY+labelHeight-padding)
  //   ctx.stroke();



  // }

  /**
   * Handles change on the color input element for creating a new class for the bounding box drawn by the user. It only redraws the bounding box with the selected color and does not change the color properties of the class.
   * @param {Event} e e "change" event on the color input element
   */
  static handleColorChange(e) {
    const drawingRect = Player.getMainPlayer()?.drawingRect;
    if (!drawingRect) return;

    const drawingCanvas = document.getElementById(Player.drawingCanvasId);
    if (!drawingCanvas) return;

    const ctx = drawingCanvas.getContext('2d');
    if (!ctx) return;

    // Get the color input element
    const inputEl = e.target;
    if (!inputEl) return;

    // Redraw the bounding box with colors for the selected class
    ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    ctx.strokeStyle = inputEl.value;
    ctx.strokeRect(drawingRect.startX, drawingRect.startY, drawingRect.width, drawingRect.height);

    // Create the label if class and track IDs are already available
    const firstBBox = Player.getDrawnBBox?.()?.getFirstBBox();
    if (!(firstBBox instanceof BoundingBox)) return; 

    // Get the class ID
    const classId = firstBBox.getClassId();
    if (typeof classId === 'undefined' || classId === null) return;
    
    // Get the track ID
    const trackId = firstBBox.getTrackId();
    if (typeof trackId === 'undefined' || trackId === null) return;

    // Construct the label
    const labelText = `${classId}-${trackId}`;
  
    ctx.beginPath();

    ctx.font = '20px tahoma';
    const labelWidth = ctx.measureText(labelText).width + 15;
    const labelHeight = 30;
    const padding = 5;

    // Label coordinates - placed on top left corner of the rectangle
    // width < 0 => drawn from right to left
    // height < 0 => drawn from bottom to top
    const labelX = drawingRect.startX + (drawingRect.width < 0 ? drawingRect.width : 0);
    const labelY = drawingRect.startY + (drawingRect.height < 0 ? drawingRect.height : 0) - labelHeight; 

    // Continue drawing after edge cases are handled
    ctx.rect(labelX, labelY, labelWidth, labelHeight);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.fillText(labelText, labelX+padding, labelY+labelHeight-padding)
    ctx.stroke();


  }

  /**
   * Check the validity of the user input for assigning a new or existing class to a newly-drawn BoundingBox. 
   * For class name, only numbers, letters, underscores and dashes are allowed.
   * If the input is valid, updates the BoundingBox instance with user input and returns class ID, track ID and color of the class of the BoundingBox. 
   * If the input is invalid, returns undefined.
   * @returns {Object | undefined} result
   * @returns {String}  result.classId
   * @returns {String}  result.className
   * @returns {String}  result.classColor
   * @returns {String}  result.trackId
   * @returns {Boolean} result.isNewClass | true if new class is to be created, false otherwise
   */
  static validateClassInput() {

    // Allow only numbers, letters, underscores and dashes in the class name
    const regex = /^[a-zA-Z0-9_-]+$/;

    const mainPlayer = Player.getMainPlayer();
    if (!mainPlayer) return;

    const trackingMap = mainPlayer.getTrackingMap();
    if (!(trackingMap instanceof TrackingMap)) return;

    const firstBBox = Player.getDrawnBBox?.()?.getFirstBBox();
    if (!firstBBox) return;

    // Main div on canvas to input new class properties
    const outerDiv = document.getElementById(Player.drawnBBoxDivId);
    if (!outerDiv) return;

    const classInput = outerDiv.querySelector('input[name="class-choice-new-bbox"]');
    if (!classInput) return;

    // Datalist element containing options for existing classes
    const dataList = outerDiv.querySelector('datalist');
    if (!dataList) return;

    // Color input element for a new class
    const colorInput = outerDiv.querySelector('input[type="color"]');
    if (!colorInput) return;
    
    // If no input is given, warn user
    const className = classInput.value?.trim?.();
    console.log('Input class name', className);
    if (className === '' || !className) {
      showPopover({
        domEl: classInput,
        title: 'Empty Class Input',
        content: 'Please enter a class name!',
        placement: 'top',
        type: 'error',
      });
      return;
    }

    const isNameValid = regex.test(className);
    if (!isNameValid) {
      showPopover({
        domEl: classInput,
        title: 'Invalid Class Name',
        content: `Class names must contain only <span class="badge text-bg-dark">letters</span>, <span class="badge text-bg-dark">numbers</span>, <span class="badge text-bg-dark">underscores</span>, or <span class="badge text-bg-dark">dashes</span>.`,
        placement: 'top',
        type: 'error',
      });
      return;
    }

    // Get the DOM element for new class selection
    const newClassCheck = outerDiv.querySelector('.new-class-check');
    if (!newClassCheck) return;
    
    // Determine whether the new class option is selected or not
    const isNewClassChecked = newClassCheck.checked;

    // Check if the input class name is an existing class
    const isInputNew = !(trackingMap.hasClassName?.(className));

    // Invalid input when new class is checked
    // If input is not new but new class option is checked, warn user
    if (isNewClassChecked && !isInputNew) {
      showPopover({
        domEl: classInput,
        title: 'Failed to Create New Class',
        content: `Class <span class="badge text-bg-dark">${className}</span> already exists!<br>Either uncheck the option <span class="badge text-bg-dark">New</span> or enter a different name.`,
        placement: 'top',
        type: 'error',
      });
      return;

    }

    // Invalid input when new class is NOT checked
    // If the new class option is NOT selected, make sure the input is an existing class
    if (!isNewClassChecked && isInputNew) {
      showPopover({
        domEl: classInput,
        title: 'Invalid Class',
        content: `Class <span class="badge text-bg-dark">${className}</span> does not exist!<br>Either select an existing class or check <span class="badge text-bg-dark">New</span> option to create a new class.`,
        placement: 'top',
        type: 'error',
        hideTimeout: 5000
      });
      return;
    }


    // Valid new class
    if (isNewClassChecked && isInputNew) {

      // Get the first available class ID for new class creation
      const classId = firstBBox.setClassId(trackingMap.getFirstAvailClassId());

      // Set the track ID to 0 since this is the first track that belong the newly
      const trackId = firstBBox.setTrackId('0'); 

      // Get the input color
      const color = colorInput.value;

      // Show alert if an error occurs
      for (const classProp of [classId, trackId, color]) {
        if (typeof classProp === 'undefined' || classProp === null) {
          showPopover({
            domEl: classInput,
            title: 'Failed to Create New Class',
            content: `Class <span class="badge text-bg-dark">${className}</span> could not be created! Please try again.`,
            placement: 'top',
            type: 'error',
          });
          return;
        }
      }

      // Return the result
      return {
        trackId: trackId,
        classId: classId,
        className: className,
        classColor: color,
        isNewClass: true
      }

    }


    // Valid existing class
    if (!isNewClassChecked && !isInputNew) {

      // Get the track ID and color for the selected class
      // Update the properties of the first drawn BoundingBox
      const classId = firstBBox.setClassId(dataList.querySelector(`option[value='${className}']`)?.dataset?.classId);
      const trackId = firstBBox.setTrackId(Player.getFirstAvailTrackId(classId));
      const color = Player.getClassColor(classId);
      
      // Show alert if an error occurs
      for (const classProp of [classId, trackId, color]) {
        if (typeof classProp === 'undefined' || classProp === null) {
          showPopover({
            domEl: classInput,
            title: 'Failed to Assign Class',
            content: `Assignment to class <span class="badge text-bg-dark">${className}</span> failed! Please try again.`,
            placement: 'top',
            type: 'error',
          });
          return;
        }
      }

      // Return the result
      return {
        trackId: trackId,
        classId: classId,
        className: className,
        classColor: color,
        isNewClass: false
      }


    }


  }
  /**
   * Handles saving newly drawn bounding box when user confirms it via a button
   * @param {Event} e "click" event
   * @returns 
   */
  static async handleConfirmation(e) {

    const mainPlayer = Player.getMainPlayer();
    if (!mainPlayer) return;

    const drawingRect = mainPlayer.drawingRect;
    if (!drawingRect) return;
    
    const drawingCanvas = document.getElementById(Player.drawingCanvasId);
    if (!drawingCanvas) return;

    const ctx = drawingCanvas.getContext('2d');
    if (!ctx) return;

    const confirmDiv = document.getElementById(Player.drawnBBoxDivId);
    if (!confirmDiv) return;

    // Get the interpolation check element
    const interpolateEl = confirmDiv.querySelector('#interpolate-check');
    if (!interpolateEl) return;
    
    // Get the tracking map
    const trackingMap = mainPlayer.getTrackingMap();
    if (!trackingMap) return;

    // Determine the previously drawn or resized bounding box
    const firstBBox = BoundingBox.isResizing() ? BoundingBox.getResizedBBox?.()?.getFirstBBox?.() : Player.getDrawnBBox?.().getFirstBBox?.();

    // Show user feedback if an error has occurred
    if (!(firstBBox instanceof BoundingBox)) {
       showPopover({
        domEl: drawingCanvas,
        title: 'Failed to Edit Tracks',
        content: 'Target bounding box could not be found! Please try again.',
        placement: 'right',
        type: 'error',
        hideTimeout: 2500,
      });
      return;
    } 

    // Determine the popover position according to the bBox dimensions
    const xPopover = firstBBox.getX() + firstBBox.getWidth();
    const yPopover = firstBBox.getY() + firstBBox.getHeight() / 2;

    // const widthRatio = drawingCanvas.width / drawingCanvas.clientWidth;
    // const heightRatio =  drawingCanvas.height / drawingCanvas.clientHeight;

    const canvasRect = drawingCanvas.getBoundingClientRect();
    if (!canvasRect) return;

    // -------------------------------
    // Handle resizing an existing box
    // -------------------------------
    if (DrawnBoundingBox.isResizing()) {

      // Get the properties of resized box
      const trackNumber = firstBBox.getTrackNumber();
      const trackId = firstBBox.getTrackId();
      const classId = firstBBox.getClassId();

      // If interpolation is NOT selected, save the single resized bounding box and give user feedback
      if (!interpolateEl.checked) {

        // Get indices of BoundingBoxes for the current frame
        const idxArr = trackingMap.getIndices({
          classId: classId,
          trackId: trackId,
          startFrame: trackNumber,
          endFrame: trackNumber
        });

        if (!Array.isArray(idxArr)){
          showPopover({
            onCanvas: true,
            x: xPopover,
            y: yPopover,
            title: 'Failed to Save Tracking Changes',
            content: 'Please try again!',
            placement: 'right',
            type: 'error',
            hideTimeout: 2500,
          });
          return;
        };

        // Try to update the trackingMap
        const isSuccess = trackingMap.updateByIndices({
          indices: idxArr, 
          entries: {
            x: firstBBox.getX(), 
            y: firstBBox.getY(),
            width: firstBBox.getWidth(),
            height: firstBBox.getHeight()
          }
        });

        // Error checking
        if (!isSuccess) {
          showPopover({
            onCanvas: true,
            x: xPopover,
            y: yPopover,
            title: 'Failed to Save Tracking Changes',
            content: 'Please try again!',
            placement: 'right',
            type: 'error',
            hideTimeout: 2500,
          });
          return;
        }
        
        // Save edits to file
        trackingMap.saveEditsToFile().then(response => {
          
          // Show error feedback
          if (!response) {
            showPopover({
              onCanvas: true,
              x: xPopover,
              y: yPopover,
              title: 'Failed to Save Tracking Changes',
              content: 'Please try again!',
              placement: 'right',
              type: 'error',
              hideTimeout: 2500,
            });
            return;
          }

          // Show success feedback
          showPopover({
            onCanvas: true,
            x: xPopover,
            y: yPopover,
            title: 'Tracking Changes Saved',
            content: `Dimensions updated for <br> <span class="badge text-bg-secondary">Class ${classId}</span>-<span class="badge text-bg-primary">Track ID ${trackId}</span>-<span class="badge text-bg-dark">frame ${trackNumber}`,
            placement: 'right',
            type: 'success',
            hideTimeout: 2500,
          });

          // Remove the drawing rectangle from the canvas
          ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);

          // Make the confirmation element (inc. buttons, select, etc.) invisible
          confirmDiv.classList.add('d-none');

          DrawnBoundingBox.disableResizing();
          
          // Refresh the canvas
          Player.refreshMainCanvas();

          return;

        });

      }
        
      // If interpolation is checked
      if (interpolateEl.checked) {
        // Enable interpolating to wait for another user-drawn bounding box
        DrawnBoundingBox.enableInterpolation();
  
        // Show feedback over newly drawn bounding box
        // If interpolation is selected, ask user to go to another frame to draw a second BBox
        showPopover({
          onCanvas: true,
          x: xPopover,
          y: yPopover,
          title: 'Interpolation Enabled',
          content: 'Resize another box with the same track ID in another frame for interpolation.',
          placement: 'right',
          type: 'success',
          hideTimeout: 2500,
        });

        // Make the confirmation element (inc. buttons, select, etc.) invisible
        confirmDiv.classList.add('d-none');

        return;

      }
      
    }
     
    // ----------------------
    // Handle drawing a new bounding box (i.e. not resizing)
    // ----------------------
    if (!DrawnBoundingBox.isResizing()) {

      // Check the validate of the input
      const result = DrawnBoundingBox.validateClassInput();
      if (!result) return;

      // Add the bounding box to tracking map
      trackingMap.add(firstBBox);

      // If it is new class is created, save its properties to the config and metadata files
      const isNewClass = result.isNewClass;
      if (isNewClass) {

        // Get the class properties
        const { classId, className, classColor } = result;

        // Attempt to add the new class to the Class Map
        const isAdded = trackingMap.addToClassMap({
          id: classId, 
          name: className, 
          color: classColor
        });

        if (!isAdded) {
          showAlertToast('Please try again.', 'error', 'Failed to Save Class Name');
          return;
        }

        // Update config with the new class
        Config.classAttributes = trackingMap.getClassAttributes();
        const response = await Config.saveToFile();
        if (!response) {
          showAlertToast('Please try again.', 'error', 'Failed to Save Tracking Changes');
          return;
        }
        
      }

      // Save edits to file
      const response = await trackingMap.saveEditsToFile();
      if (!response) {
        showAlertToast('Please try again.', 'error', 'Failed to Save Tracking Changes');
        return;
      }

      // Clear drawing canvas
      ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);

      // Refresh the tracking canvas to show newly added BBox
      mainPlayer.displayTrackingBoxes();

      // Make the confirmation div invisible
      confirmDiv.classList.add('d-none');

      // If interpolation is NOT selected, give feedback and return
      if (!interpolateEl.checked) {
        const classText = Player.getClassName(firstBBox.getClassId()) ?? `Class ${firstBBox.getClassId()}`;
        showPopover({
          onCanvas: true,
          x: xPopover,
          y: yPopover,
          title: 'Bounding Box Created',
          content: `Created for <span class="badge text-bg-secondary">${classText}</span>-<span class="badge text-bg-primary">Track ID ${firstBBox.getTrackId()}</span>-<span class="badge text-bg-dark">Frame ${firstBBox.getTrackNumber()}</span>`,
          placement: 'right',
          type: 'success',
          hideTimeout: 2000
        });

        // Update the relevant DOM els
        updateClassEls();

        DrawnBoundingBox.disableInterpolation();

        return;

      } 
      
      // If interpolation is selected
      if (interpolateEl.checked) {
        // Enable interpolating to wait for another user-drawn bounding box
        DrawnBoundingBox.enableInterpolation();
  
        // Show feedback over newly drawn bounding box
        // If interpolation is selected, ask user to go to another frame to draw a second BBox
        showPopover({
          onCanvas: true,
          x: xPopover,
          y: yPopover,
          title: 'Interpolation Enabled',
          content: 'Draw another box in another frame for interpolation.',
          placement: 'right',
          type: 'info',
          hideTimeout: 3000
        });

        return;

      }
        

    }


  }
  
  
  static handleCancellation(e) {

    const drawingCanvas = document.getElementById(Player.drawingCanvasId);
    if (!drawingCanvas) return;

    const ctx = drawingCanvas.getContext('2d');
    if (!ctx) return;

    // Remove the drawing rectangle from the canvas
    ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);

    // Make the confirmation element (inc. buttons, select, etc.) invisible
    const confirmDiv = document.getElementById(Player.drawnBBoxDivId);
    if (confirmDiv) confirmDiv.classList.add('d-none');

    // Get the drawn bBox
    const drawnBBox = BoundingBox.isResizing() ? BoundingBox.getResizedBBox() : Player.getDrawnBBox();
    if ( !(drawnBBox instanceof DrawnBoundingBox) ) return;

    // Get the tracking map
    const trackingMap = Player.getMainTrackingMap?.();
    if ( (!trackingMap instanceof TrackingMap) ) return;

    // Get the master array
    const masterArr = trackingMap.getTracks();
    if (!Array.isArray(masterArr)) return;

    // If resizing should be cancelled
    if (BoundingBox.isResizing()) {
      // Get the firstBBox and its index in the master array to revert user edits
      const firstBBox = drawnBBox.getFirstBBox();
      const firstIdx = firstBBox?.getIndex();

      // Attempt to place the initial bBox into the master array
      if (!Number.isSafeInteger(firstIdx) || firstIdx < 0 || firstIdx >= masterArr.length) {
        // Give error feedback
        showAlertToast('An error occurred! Please try again.', 'error', 'Cancellation Failed');
        return;
      }

      // Get the clone of the initial bBox to revert user edits
      const firstInitBBox = drawnBBox.getInitFirstBBox();
      if ( !(firstInitBBox instanceof BoundingBox) ) {
        // Give error feedback
        showAlertToast('An error occurred. Please try again.', 'error', 'Cancellation Failed');
        return;
      }
      masterArr[firstIdx] = firstInitBBox.clone();
     
      // Get the clone of the initial bBox (it may not exists if not interpolation) to revert user edits
      const lastInitBBox = drawnBBox.getLastBBox();
      if ( (lastInitBBox instanceof BoundingBox) ) {
        // Get the lastBBox and its index in the master array to revert user edits
        const lastBBox = drawnBBox.getLastBBox();
        const lastIdx = lastBBox?.getIndex();
  
        // Attempt to place the initial bBox into the master array
        if (!Number.isSafeInteger(firstIdx) || firstIdx < 0 || firstIdx >= masterArr.length) {
          // Give error feedback
          showAlertToast('An error occurred! Please try again.', 'error', 'Cancellation Failed');
          return;
        }
  
        masterArr[lastIdx] = lastInitBBox.clone();
  
      }

      BoundingBox.setResizedBBox()
      BoundingBox.disableResizing();

    } else {
      Player.setDrawnBBox();

    }

    // Disable interpolating
    DrawnBoundingBox.disableInterpolation();

    // Enable mousemove
    BoundingBox.enableMousemove();

    // Refresh the canvas
    Player.refreshMainCanvas();

    // Give user feedback
    showAlertToast('Bounding box assignment canceled!', 'success');

    return;
    
    // If only a single bBox was resized
    // if (!DrawnBoundingBox.isInterpolating() && DrawnBoundingBox.isResizing()) {
    //   // Get the firstBBox and its index in the master array to revert user edits
    //   const firstBBox = drawnBBox.getFirstBBox();
    //   const idx = firstBBox?.getIndex();

    //   // Attempt to place the initial bBox into the master array
    //   if (!Number.isSafeInteger(idx) || idx < 0 || idx >= masterArr.length) {
    //     // Give error feedback
    //     showAlertToast('An error occurred! Please try again.', 'error', 'Cancellation Failed');
    //     return;
    //   }

    //   // Get the clone of the initial bBox to revert user edits
    //   const initFirstBBox = drawnBBox.getInitFirstBBox();
    //   if ( !(initFirstBBox instanceof BoundingBox) ) {
    //     // Give error feedback
    //     showAlertToast('An error occurred. Please try again.', 'error', 'Cancellation Failed');
    //     return;
    //   }

    //   masterArr[idx] = initFirstBBox.clone();

     

    // }

    // // If a new bounding box is drawn in the first frame
    // if (!DrawnBoundingBox.isInterpolating() && !DrawnBoundingBox.isResizing()) {

    // }

    // // If a bounding box in the last frame is resized for interpolation
    // // Or if a new bounding box is drawn in the last frame for interpolation
    // if ( (DrawnBoundingBox.isInterpolating() && DrawnBoundingBox.isResizing()) ||
    //   (DrawnBoundingBox.isInterpolating() && !DrawnBoundingBox.isResizing()) 
    // ) {
      

    //   }

    //   // Reset the resized bBox
    //   BoundingBox.setResizedBBox();

    //   // Enable mousemove
    //   BoundingBox.enableMousemove();

    //   // Refresh the canvas
    //   Player.refreshMainCanvas();

    //   // Give user feedback
    //   showAlertToast('Bounding box assignment canceled!', 'success');

    //   return;


    // } 


    // // Reset the bounding box
    // Player.setDrawnBBox();

    // // Disable interpolating
    // DrawnBoundingBox.disableInterpolation();

    // // Enable mousemove
    // BoundingBox.enableMousemove();

    // // Refresh the canvas
    // Player.refreshMainCanvas();

    // // Give user feedback
    // showAlertToast('Bounding box assignment canceled!', 'success');

  }

  /**
   * Handles interpolation logic when user click on a button relevant to interpolation — either "Continue" or "End".
   * @param {Event} e click event
   * @returns 
   */
  static async handleInterpolation(e) {
    DrawnBoundingBox.disableInterpolation();
    const mainPlayer = Player.getMainPlayer();
    if ( !(mainPlayer instanceof Player) ) return;

    const drawingRect = mainPlayer.drawingRect;
    if (!drawingRect) return;
    
    const drawingCanvas = document.getElementById(Player.drawingCanvasId);
    if (!drawingCanvas) return;

    const ctx = drawingCanvas.getContext('2d');
    if (!ctx) return;

    const confirmDiv = document.getElementById(Player.drawnBBoxDivId);
    if (!confirmDiv) return;

    // Check whether interpolating is for a resized or newly drawn bounding box
    const drawnBBox = BoundingBox.isResizing() ? BoundingBox.getResizedBBox() : Player.getDrawnBBox();
    if ( !(drawnBBox instanceof DrawnBoundingBox) ) return;

    // Get the tracking map
    const trackingMap = mainPlayer.getTrackingMap();
    if ( !(trackingMap instanceof TrackingMap) ) return;

    // First drawn bBox
    const firstBBox = drawnBBox.getFirstBBox();
    if ( !(firstBBox instanceof BoundingBox) )return;

    // Last drawn bBox
    const lastBBox = drawnBBox.getLastBBox();
    if ( !(lastBBox instanceof BoundingBox) ) return;

    // Calculate clicked position relative to canvas  
    const canvasRect = drawingCanvas.getBoundingClientRect();
    if (!canvasRect) return;

    // Clear drawing canvas
    ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);

    // Make the confirmation div invisible
    confirmDiv.classList.add('d-none');

    // Reset interpolation status
    DrawnBoundingBox.disableInterpolation();

    // Attempt to interpolate
    const interpolatedBBoxes = drawnBBox.interpolate();
    if (!Array.isArray(interpolatedBBoxes)) {
      showAlertToast('Frame count must be larger than 1!', 'warning', 'Failed to Interpolate');
      return;
    };

     // Add the fist bounding box to tracking map
    trackingMap.add(firstBBox);

    // Add the interpolated boxes in between
    trackingMap.add(interpolatedBBoxes);

    // Add the last bounding box to tracking map
    trackingMap.add(lastBBox);

    // Default popover properties for user feedback
    let popoverTitle = `Interpolation Ended for Track ${lastBBox.getClassId()}-${lastBBox.getTrackId()}</strong>.`;
    let popoverContent = `Interpolated ${interpolatedBBoxes.length} boxes between frames ${firstBBox.getTrackNumber()} and ${lastBBox.getTrackNumber()}.`;
    const popoverX = lastBBox.getX?.() + lastBBox.getWidth?.();
    const popoverY = lastBBox.getY() + lastBBox.getHeight?.() / 2;

    // Check if user clicked "continue" or "end" button for interpolation
    const shouldContinue = e?.target?.classList?.contains?.('continue-btn');

    // If interpolation should continue,
    if (shouldContinue) {
      // Save the last BBox for next steps
      const newFirstBBox = lastBBox.clone();

      // Reset the drawnBBox in the Player Class
      const newDrawnBBox = BoundingBox.isResizing() ? BoundingBox.setResizedBBox() : Player.setDrawnBBox();

      if ( !(newDrawnBBox instanceof DrawnBoundingBox) ) {
        showPopover({
          onCanvas: true,
          x: popoverX,
          y: popoverY,
          title: 'Failed to Continue Interpolation',
          content: 'Unable to continue interpolation for this track.',
          placement: 'right',
          type: 'error',
          hideTimeout: 3000
        });
        return;
      }

      // Assign the lastBBox from previous step as the new firstBBox
      newDrawnBBox.addFirstBBox(newFirstBBox);

      // Re-enable interpolation and wait for new lastBBox selection by the user
      DrawnBoundingBox.enableInterpolation();

      // Change the popover title and content
      popoverTitle = `Interpolation Continues for Track ${newFirstBBox.getClassId()}-${newFirstBBox.getTrackId()}`;
      popoverContent = 'Draw another box in another frame to continue interpolating. ' + popoverContent;

    }

    // Refresh the tracking canvas to show newly added BBox
    mainPlayer.displayTrackingBoxes();

    // Show success
    // showAlertToast(`Interpolated ${interpolatedBBoxes.length} frames!`, 'success');
    showPopover({
      onCanvas: true,
      x: popoverX,
      y: popoverY,
      title: popoverTitle,
      content: popoverContent,
      placement: 'right',
      type: 'success',
      hideTimeout: 3000
    });

    // Save edits to file
    const response = await trackingMap.saveEditsToFile();
    if (!response) {
      showAlertToast('Please try again.', 'error', 'Failed to Save Tracking Changes');
      return;
    }

  }

}

class Config {
  // Define private fields to be saved to the config file
  static #classIds = [];
  static #classNames = [];
  static #classColors = [];
  static #classRunningCounts = {};
  static #individualNames = [];
  static #actionNames = [];
  static #mainVideoPath = null;
  static #secondaryVideoPaths = [];
  static #zoomScale = 2.0;
  static #skipSeconds = 0.1;
  static #shortcuts = [];
  static #boundingBoxLineWidth = 1.0;
  static #boundingBoxOpacity = 100;
  static #exportDirPath = null;
  static #version;
  static #username;
  
  
  /**
   * 
   * @param {Object | undefined} obj 
   * @param {String[] | undefined} obj.classIds Class ID array
   * @param {String[] | undefined} obj.classNames Class name array
   * @param {String[] | undefined} obj.classColors Class color array in hex code
   * @param {Object | undefined} obj.classRunningCounts Object to hold running counts with (classId, runningCount) key-value pairs
   * @param {String[] | undefined} obj.individualNames Individual/subject name array
   * @param {String[] | undefined} obj.actionNames Action/ethogram array
   * @param {import('original-fs').PathLike | undefined} obj.mainVideoPath File path of the main video
   * @param {import('original-fs').PathLike[] | undefined} obj.secondaryVideoPaths File path array of the secondary videos
   * @param {Number | undefined} obj.zoomScale Zoom scale for the main player (2 -> 2x -> 200%)
   * @param {Number | undefined} obj.skipSeconds Time in seconds to skip forward and backward when corresponding buttons/hotkeys are used
   * @param {Hotkey[] | undefined} obj.shortcuts Hotkey array
   * @param {Number | undefined} obj.boundingBoxLineWidth Width of bounding box lines in pixel
   * @param {Number | undefined} obj.boundingBoxOpacity Opacity of bounding boxes in percentage 
   * @param {import('original-fs').PathLike | undefined} obj.exportDirPath Path for directory to export user files
   * @param {import('original-fs').PathLike | undefined} obj.version Current app version
   * @param {import('original-fs').PathLike | undefined} obj.username Username
   */

  constructor({ 
    classIds, classNames, classColors, classRunningCounts,
    individualNames, actionNames, mainVideoPath, secondaryVideoPaths,
    zoomScale, skipSeconds, shortcuts, boundingBoxLineWidth, boundingBoxOpacity, exportDirPath, version, username
  } = {}) {
    Config.#classIds = classIds;  
    Config.#classNames = classNames;  
    Config.#classColors = classColors; 
    Config.#classRunningCounts = classRunningCounts; 
    Config.#individualNames = individualNames;
    Config.#actionNames = actionNames;
    Config.#mainVideoPath = mainVideoPath;
    Config.#secondaryVideoPaths = secondaryVideoPaths;
    Config.#zoomScale = zoomScale;
    Config.#skipSeconds = skipSeconds;
    Config.#shortcuts = shortcuts;
    Config.#boundingBoxLineWidth = boundingBoxLineWidth;
    Config.#boundingBoxOpacity = boundingBoxOpacity;
    Config.#exportDirPath = exportDirPath;
    Config.#version = version;
    Config.#username = username;

  }

  /**
   * Creates a new Config instance from the config file in the user data directory
   * @returns {Config | undefined} Newly created Config instance or undefined if an error occurred.
   */
  static async fromFile() {
    const response = await window.electronAPI.getFromConfig();
    const confData = (response instanceof Object) ? response : {};
    const newConf = new Config(confData);
    return newConf;
  }

  static get classIds() {
    return Config.#classIds;
  }

  static set classIds(arr) {
    if (Array.isArray(arr) && arr.length > 0) {
      Config.#classIds = arr.map(el => el?.toString());
    }
  }

  static get classNames() {
    return Config.#classNames;
  }

  static set classNames(arr) {
    if (Array.isArray(arr) && arr.length > 0) {
      Config.#classNames = arr.map(el => el?.toString());
    }
  }

  static get classColors() {
    return Config.#classColors;
  }

  static set classColors(arr) {
    if (Array.isArray(arr) && arr.length > 0) {
      Config.#classColors = arr.map(el => el?.toString());
    }
  }

  static get classRunningCounts() {
    return Config.#classRunningCounts;
  }

  static set classRunningCounts(obj) {
    if ( !(obj instanceof Object) ) return;
    Config.#classRunningCounts = obj;
  }
  
  /**
   * Gets the class ID, name and color arrays and runningCount object with (classId, runningCount) key-value pairs.
   * @returns {Object} Object with ids, names, colors and runningCounts properties.
   */
  static get classAttributes() {
    return {
      ids: Config.classIds,
      names: Config.classNames,
      colors: Config.classColors, 
      runningCounts: Config.classRunningCounts
    }
  }

  /**
   * Sets the class ID, name and color arrays and runningCount object with (classId, runningCount) key-value pairs.
   * @param {Object | undefined} obj with ids, names, colors and runningCounts properties which holds the respective arrays or undefined if the properties are empty.
   * @param {String[] | undefined} obj.ids ID array
   * @param {String[] | undefined} obj.names Name array
   * @param {String[] | undefined} obj.color Color array (in hex)
   * @param {Object | undefined} obj.runningCounts Object with (classId, runningCount) key-value pairs
   */
  static set classAttributes({ ids, names, colors, runningCounts } = {}) {
    Config.classIds = ids;
    Config.classNames = names;
    Config.classColors = colors;
    Config.runningCounts = runningCounts;
  }

  static get individualNames() {
    return Config.#individualNames;
  }

  static set individualNames(arr) {
    Config.#individualNames = Array.isArray(arr) && arr.length > 0 ? arr.map(el => el?.toString()) : [];
  }

  static get actionNames() {
    return Config.#actionNames;
  }

  static set actionNames(arr) {
    Config.#actionNames = Array.isArray(arr) && arr.length > 0 ? arr.map(el => el?.toString()) : [];
  }

  static get mainVideoPath() {
    return Config.#mainVideoPath;
  }

  static set mainVideoPath(filePath) {
    Config.#mainVideoPath = filePath;
  }

  static get secondaryVideoPaths() {
    return Config.#secondaryVideoPaths;
  }

  static set secondaryVideoPaths(arr) {
    Config.#secondaryVideoPaths = Array.isArray(arr) && arr.length > 0 ? arr : [];
  }
  
  static get zoomScale() {
    return Config.#zoomScale;
  }

  static set zoomScale(val) {
    const parsedVal = Math.abs(Number.parseFloat(val));
    if (Number.isFinite(parsedVal)) Config.#zoomScale = parsedVal;
  }

  static get skipSeconds() {
    return Config.#skipSeconds;
  }

  static set skipSeconds(val) {
    const parsedVal = Math.abs(Number.parseFloat(val));
    if (Number.isFinite(parsedVal)) Config.#skipSeconds = parsedVal;
  }

  static get shortcuts() {
    return Config.#shortcuts;
  }

  static set shortcuts(arr) {
    Config.#shortcuts = Array.isArray(arr) && arr.length > 0 ? arr : [];
  }

  static get boundingBoxLineWidth() {
    return Config.#boundingBoxLineWidth;
  }

  static set boundingBoxLineWidth(val) {
    const parsedVal = Math.abs(Number.parseFloat(val));
    if (Number.isFinite(parsedVal)) Config.#boundingBoxLineWidth = parsedVal;
  }

  static get boundingBoxOpacity() {
    return Config.#boundingBoxOpacity;
  }

  static set boundingBoxOpacity(val) {
    const parsedVal = Math.abs(Number.parseFloat(val));
    if (Number.isFinite(parsedVal)) Config.#boundingBoxOpacity = parsedVal;
  }

  static get exportDirPath() {
    return Config.#exportDirPath;
  }

  static set exportDirPath(dirPath) {
    Config.#exportDirPath = dirPath;
  }

  static get version() {
    return Config.#version;
  }

   static set version(val) {
    Config.#version = val?.toString();
  }

  static get username() {
    return Config.#username;
  }

  static set username(val) {
    Config.#username = val?.toString();
  }

  static toObject() {
    return {
      classIds: Config.classIds,
      classNames: Config.classNames,
      classColors: Config.classColors,
      classRunningCounts: Config.#classRunningCounts,
      individualNames: Config.individualNames,
      actionNames: Config.actionNames,
      mainVideoPath: Config.mainVideoPath,
      secondaryVideoPaths: Config.secondaryVideoPaths,
      zoomScale: Config.zoomScale,
      skipSeconds: Config.skipSeconds,
      shortcuts: Config.shortcuts,
      boundingBoxLineWidth: Config.boundingBoxLineWidth,
      boundingBoxOpacity: Config.boundingBoxOpacity,
      exportDirPath: Config.exportDirPath,
      version: Config.version,
      username: Config.username,
    }
  }

  /**
   * Saves/updates given properties in the config file.
   * @returns {Promise | undefined} Promise from main.js
   */
  static async saveToFile() {
    const response = await window.electronAPI.saveToConfig(Config.toObject());
    return response;
    
  }

}




// Export the components
export {
  Player, 
  Observation, 
  Ethogram, 
  Hotkey, 
  Button, 
  Input, 
  ControlBar, 
  Metadata, 
  BoundingBox, 
  DrawnBoundingBox,
  Config
}