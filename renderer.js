/**
 * Communication processes between modules to handle interactive bounding boxes
 * -------------------------------
 *  - User clicks on a box
 *  - Toast with options showed 
 *    with showToastForBehaviorRecording() in helpers.js
 *    - User confirms selection for recording behaviors
 *      with updateInteractionTable() in helpers.js via click event on #label-save-btn (renderer.js)
 *    - User confirms selection for editting track IDs
 *      with updateTrackingTable in helpers.js via click event on #tracking-edit-btn (renderer.js)
 * 
 */ 


/**
 * Processes when the app window is refreshed
 * --------------------------------
 *  Check for properties in the config file (saved in user directory)
 *  Load them if they exist
 * 
 * 
 * 
 */


/**
 * Tracking file edits
 * --------------------
 *  Create a copy of the opened tracking file
 *  Save the path of this file to config file
 *  Write tracking edits by the user to this file
 *  Save the state of tracking table to config file
 *  Read this file when app is restarted
 *  Populate tracking table with entries in the config
 * 
 */

/**
 * Exporting modified tracking files automatically
 * ----------------------------------------------- 
 *  Make user choose a folder for exported files (in the very beginning)
 *  Tracking file edits are saved to user data folder on the background
 *  Copy these file to the user folder at each edit with the metadata headers
 *  Show UI feedback about successful saving
 */

/**
 * Opening a main video
 * ---------------------
 * Make sure all work is saved to export directory
 * Search for previously opened tracking and behavior files linked to video in user data directory
 * If there is any, load them
 * If this is a different video, clear tracking and behavior maps/tables
 */


import { 
  Player, 
  Observation, 
  BoundingBox, 
  DrawnBoundingBox, 
  Hotkey,
  Config
} from './components.js';

import {
  // createSecondaryVideoDivs, 
  getFileNameWithoutExtension,
  formatSeconds,
  showAlertToast,
  showAlertModal,
  secondsToFrames,
  framesToSeconds, 
  updatePlaybackRateList,
  showShortcutsModal,
  showNamesModal,
  showHelpModal,
  showProcessIndicator,
  hideProcessIndicator,
  addInfoRow,
  handleKeyPress,
  showToastForBehaviorRecording,
  validateInputs,
  loadSecondaryVideos,
  dragElement,
  getUserConfirmationOnModal,
  showPopover,
  updateClassEls,
} from './helpers.js';

// Save metadata before user quits the app
window.electronAPI.onAppQuit(async () => {
  
  const metadata = Player.getMetadata();
  if (metadata) {
    // Show information
    showAlertToast('Saving metadata before quitting...', 'info');
    
    // Save metadata to file
    const response = await metadata.writeToFile();
    if (response) {
      // Show information
      showAlertToast('Quitting the app...', 'success', 'Metadata Saved');
      
    } else {
      // Show information
      showAlertToast('Quitting the app...', 'error', 'Saving Metadata Failed');
    }

  }

  // Introduce delay for better user experience
  await new Promise(resolve => setTimeout(resolve, 500));

  // Clear all intervals IDs
  Player.resetEthogramInterval();
  Player.resetNotesInterval();
  
  // Signal to the main process to quit the app
  await window.electronAPI.respondBeforeQuit();


});

// Validate form inputs
validateInputs();

// Get the current version and write it to HTML elements and save to Player instance
const currentVersion = await window.electronAPI.getVersion();
if (currentVersion) {
  const versionInfoEls = document.querySelectorAll('.version-info');
  versionInfoEls.forEach(el => {
    el.textContent = `v${currentVersion}`;
  });

  Player.setAppVersion(currentVersion);

}


// Listen for key press for playback and other app shortcuts
// Behavior recording shortcuts are handled separately
document.addEventListener('keydown', handleKeyPress, true);

// If a path was saved to config file, get the videos from that
// let experimentPath = await window.electronAPI.getExperimentDirPath();
// const config = await Config.fromFile();
const confResp = await window.electronAPI.getFromConfig();
const confData = (confResp instanceof Object) ? confResp : {};
const config = new Config(confData);
console.log('Config instance: ', config);
if (config instanceof Config) {
  // Check if app has just been updated
  const isUpdated = Config.version ? Player.getAppVersion() !== Config.version : true;

  // Show release notes if the app has just been updated
  if (isUpdated) {
    const releaseNotesModalEl = document.getElementById('release-notes-modal');
    if (releaseNotesModalEl) {
      const modal = bootstrap.Modal.getOrCreateInstance(releaseNotesModalEl);
      modal.show();
    }

    // Update config
    Config.version = Player.getAppVersion();
    const response = await Config.saveToFile();
    if (!response) {
      console.log('App version could not be saved to config file!', 'error');
    }

  }

  // Add export directory path to the settings menu
  const exportDirPathInputEl = document.getElementById('change-export-dir-input');
  const openExportDirBtn = document.querySelector('#open-export-dir-btn');
  if (exportDirPathInputEl && Config.exportDirPath) {
    exportDirPathInputEl.value = Config.exportDirPath;
    openExportDirBtn.dataset.path = Config.exportDirPath;
  }

  // Add zoom scale (in percentage) to the settings menu
  const zoomScaleInputEl = document.getElementById('change-zoom-scale-input');
  const configZoomScale = Config.zoomScale;
  if (zoomScaleInputEl && configZoomScale) {
    zoomScaleInputEl.value = configZoomScale;
    await Player.setZoomScale(configZoomScale);
  }


  // Check if username and export folder was chosen 
  // for saving modified tracking/behavior files automatically
  if (Config.username) {
    // Save username from config to Player
    Player.setUsername(Config.username);

  // Otherwise, prompt user to choose one
  } else {

    // Ask for a username and export directory path
    const modalBootstrap = bootstrap.Modal.getOrCreateInstance('#username-modal');
    
    // Show modal (inputs in modal will be validated by validateInput() funcion)
    modalBootstrap.show();

  } 
  
  if (Config.boundingBoxLineWidth) {
    await BoundingBox.setLineWidth(Config.boundingBoxLineWidth);
  }

  if (Config.boundingBoxOpacity) {
    await BoundingBox.setOpacity(Config.boundingBoxOpacity);
  }

  // Check if individual names, actions and shortcuts were already saved into config file before
  if (Config.shortcuts) {
    Hotkey.setHotkeysFromObjectArr(Config.shortcuts);
  } else {
    // Create the default hotkeys
    Hotkey.createDefaultHotkeys();
  }

  if (Config.actionNames) {
    await Player.setActionNames(Config.actionNames);
  }

  if (Config.skipSeconds) {
    await Player.setSkipSeconds(Config.skipSeconds);
  }

  if (Config.autoUpdateStatus) {
    await Player.setAutoUpdateStatus(Config.autoUpdateStatus);
  }

  // Check if main video path is saved in config file
  if (Config.mainVideoPath) {
    const mainPlayerSrc = Config.mainVideoPath;
    
    // Load the main video
    try {
      await Player.loadMainPlayer(mainPlayerSrc);
    } catch (error) {
      console.log(error);
    }

  } 

  if (Config.secondaryVideoPaths) {
    await loadSecondaryVideos(Config.secondaryVideoPaths);
  }

}

// Handle reloading the window
const relaunchBtn = document.getElementById('relaunch-btn');
if (relaunchBtn) {
  relaunchBtn.addEventListener('click', async () => await window.electronAPI.relaunch());
}

// Handle changing username
const changeUsernameBtn = document.getElementById('change-username-btn');
if (changeUsernameBtn) {
  changeUsernameBtn.addEventListener('click', async () => {
    const changeUsernameInput = document.getElementById('change-username-input');
    if (changeUsernameInput) {
      const newUsername = changeUsernameInput.value;
      if (newUsername === '' || typeof newUsername === 'undefined' || newUsername === null ) {
        showAlertToast('Please enter a valid username!', 'error');
        return;
      }

      // Update the username
      Player.setUsername(newUsername);
      
      // Update the config file
      const response = await Config.saveToFile();
      if (!response) {
      showAlertToast(`Failed to set username to <span class="badge text-bg-success">${newUsername}</span>. Please try again.`, 'error');
        return;
      }

      showAlertToast(`Username set to <span class="badge text-bg-success">${newUsername}</span>`, 'success');
    }

  });
}


// Handle changing export directory
const changeExportDirBtn = document.getElementById('change-export-dir-btn');
if (changeExportDirBtn) {
  changeExportDirBtn.addEventListener('click', async () => {

    const dialogResp = await window.electronAPI.openDirectory();
    if (!dialogResp) return;
   
    // Check if directory selection is canceled by the user
    if (dialogResp.canceled) {  
      showAlertToast(`Export directory selection canceled!`, 'info');
      return;
    } 

    // Check if the selected directory is accessible
    const exportDirPath = dialogResp.dirPath;
    if (!exportDirPath) {
      // Show alert
      showAlertToast(`Selection <span class="badge text-bg-dark">${exportDirPath}</span> could not be read!`, 'error', 'Export Directory Inaccessible');
      return;
    }
    
    // Update config
    Config.exportDirPath = exportDirPath;
    const response = await Config.saveToFile();

    // Show error for writing to config
    if (!response) {
      showAlertToast(`Selected directory <span class="badge text-bg-dark">${exportDirPath}</span> could not be saved! Please try again.`, 'error', 'Export Directory Change Unsuccessful');
      return;
    }
        
    // Check if the selected directory was saved to config successfully
    // Add export directory path to the menu
    const exportDirPathInputEl = document.getElementById('change-export-dir-input');
    if (exportDirPathInputEl) {
      exportDirPathInputEl.value = exportDirPath;
    }

    // Add path to HTML element for opening the directory with OS file manager
    const openExportDirPathEl = document.getElementById('open-export-dir-btn');
    if (openExportDirPathEl) {
      openExportDirPathEl.dataset.path = exportDirPath;
    }

    // Show success for writing to config
    showAlertToast(`New directory: <span class="badge text-bg-success">${exportDirPath}</span>`, 'success', 'Export Directory Changed');

  });

}

// Handle toggling tracking frames
const toggleTrackingBtn = document.getElementById(Player.toggleTrackingBtnId);
if (toggleTrackingBtn) {
  toggleTrackingBtn.addEventListener('click', Player.toggleTracking);

}

// Handle saving modified tracking file
const outputTrackingFile = document.getElementById('save-tracking-file-btn');
if (outputTrackingFile) {
  const mainPlayer = Player.getMainPlayer();
  outputTrackingFile.addEventListener('click' , async () => {
    const tracks = mainPlayer.getTrackingMap().getTracks();
    if (tracks) {
      const mainVideoFileName = await getFileNameWithoutExtension(mainPlayer.getSource());
      if (mainVideoFileName) {
        const individualNamesArr = Player.getIndividualNames();
        const output = await window.electronAPI.outputTrackingFile(tracks, mainVideoFileName, individualNamesArr);
      }
       
    }
  })
}

// Handle showing list of keyboard shortcuts
const showKeyboardShortcutsBtn = document.getElementById('show-keyboard-shortcuts-btn');
if (showKeyboardShortcutsBtn) {
  showKeyboardShortcutsBtn.addEventListener('click', () => showShortcutsModal(Player.getHotkeys()))
}

// Handle showing help
const showHelpBtn = document.getElementById('show-help-btn');
if (showHelpBtn) {
  showHelpBtn.addEventListener('click', showHelpModal);
  
  // Only play videos in the help modal when user is hovering over them
  const helpModalEl = document.getElementById('help-modal');
  if (helpModalEl) {
    const helpVideoEls = helpModalEl.querySelectorAll('.help-video');
    helpVideoEls.forEach(video => {
      video.addEventListener('mouseenter', () => video.play());
      video.addEventListener('mouseleave', () => video.pause());
    })

  }

}



// Handle showing feedback modal
// const showFeedbackBtn = document.getElementById('show-feedback-btn');
// if (showFeedbackBtn) {
//   showFeedbackBtn.addEventListener('click', () => {
//     const feedbackModalEl = document.getElementById('feedback-modal');
//     if (feedbackModalEl) {
//       const modal = bootstrap.Modal.getOrCreateInstance(feedbackModalEl);
//       modal.show();
//     }

//   });

// }

// Handle showing individual names modal
const showNamesBtn = document.getElementById('show-names-btn');
if (showNamesBtn) {
  showNamesBtn.addEventListener('click', showNamesModal)
}


// Handle opening secondary views
const openSecondaryVideosBtn = document.getElementById('open-secondary-videos-btn');

if (openSecondaryVideosBtn) {
  openSecondaryVideosBtn.addEventListener('click', async () => {    
    
    const mainPlayer = Player.getMainPlayer();
    if (!mainPlayer) {
      showAlertToast(
        'Please open the main video first!',
        'warning',
        'Secondary Views Disabled'
      );
      return;
    }
    
    // Pause main player
    mainPlayer.pause();
    // Get the secondary video file paths
    const videoSrcArr = await window.electronAPI.openMultipleVideos();
    
    // Load the secondary videos
    await loadSecondaryVideos(videoSrcArr);
    
    // Save/update the secondary video paths to the config file
    await Player.saveSecondaryVideosToConfig();
    
  });
}

// Adjust column size of secondary videos by user input
const secondaryVidColSizeBtn = document.getElementById('secondary-video-colsize-btn');
if (secondaryVidColSizeBtn) {

  secondaryVidColSizeBtn.addEventListener('click', () => {

    // Get the secondary row
    const secondaryVideoRow = document.getElementById('secondary-video-row');

    // Get the status of view type (grid or list)
    const buttonIcon = secondaryVidColSizeBtn.querySelector('span');
    const tooltip = bootstrap.Tooltip.getInstance(secondaryVidColSizeBtn);
    
    if (buttonIcon.dataset.viewType === 'grid') {
      secondaryVideoRow.classList.replace('row-cols-1', 'row-cols-2'); // Adjust column numbers
      buttonIcon.textContent = 'view_list' // Change the icon to list view
      tooltip.setContent({ '.tooltip-inner': 'List view' }); // Change the tooltip
      buttonIcon.dataset.viewType = 'list' // Update dataset
    
    } else if (buttonIcon.dataset.viewType === 'list') {
      secondaryVideoRow.classList.replace('row-cols-2', 'row-cols-1'); // Adjust column numbers
      buttonIcon.textContent = 'grid_view' // Change the icon to grid view
      tooltip.setContent({ '.tooltip-inner': 'Grid view' }); // Change the tooltip
      buttonIcon.dataset.viewType = 'grid' // Update dataset
    }

  });

}


// Handle entering labeling mode (to activate keyboard shortcuts for recording observations)
const labelingModeBtn = document.getElementById(Player.toggleLabelingBtnId);
if (labelingModeBtn) {
  labelingModeBtn.addEventListener('click', Player.toggleLabelingMode);
}

// Handle entering zooming mode 
const zoomingModeBtn = document.getElementById('toggle-zooming-mode-btn');
if (zoomingModeBtn) {
  zoomingModeBtn.addEventListener('click', Player.toggleZoomingMode);
}

// Handle saving tracking table to file
// Handle saving interaction table to file
const saveTrackingTableBtn = document.getElementById('save-tracking-table-btn');
const trackingTable = document.getElementById('tracking-table');
if (saveTrackingTableBtn && trackingTable) {
  saveTrackingTableBtn.addEventListener('click', async () => {
    // File delimiter for output file
    const fileDelimiter = ' '; 
    
    // Initialize array for expanded table content
    // It is required to pass on the main process to save the file
    let tableContentArr = []
    
    // Iterate over table cells to format them
    for (let row of trackingTable.rows) {
      const timeStartCell = row.querySelector('.edit-start');
      const timeEndCell = row.querySelector('.edit-end');
      const oldIdCell = row.querySelector('.old-id');
      const newIdCell = row.querySelector('.new-id');
      const typeCell = row.querySelector('.edit-type');

      if (timeStartCell && timeEndCell && oldIdCell && newIdCell && typeCell) {
          // Get the values of cells saved in datasets
          const startFrame = row.dataset.editStartFrame;
          const endFrame = row.dataset.editEndFrame;
          // const editType = row.dataset.editType.value;
          // const oldId = row.dataset.oldId.value;
          // const newId = row.dataset.newId.value;

          let rowContentArr = [];
          rowContentArr.push(startFrame, endFrame)

          // Add space between the cells
          tableContentArr.push(rowContentArr.join(fileDelimiter));
          
          
        }
    }
      
    // Save the tracking table to file
    const mainPlayerSrc = Player.getMainPlayer().getSource();
    const mainVideoFileName = await getFileNameWithoutExtension(mainPlayerSrc);
    const tableContent = tableContentArr.join('\n');
    const output = await window.electronAPI.outputTrackingTable(tableContent, mainVideoFileName);


  });

}


// Handle saving interaction table to file
const exportBehaviorsBtn = document.getElementById('export-ethogram-btn');
const ethogramTableEl = document.getElementById('behavior-table');
if (exportBehaviorsBtn && ethogramTableEl) {
  exportBehaviorsBtn.addEventListener('click', async () => {

    // Get the main player
    const mainPlayer = Player.getMainPlayer();
    if (!mainPlayer) return;

    // Export the behavior records to a CSV file named after experiment/video name
    const ethogram = mainPlayer.getEthogram();
    if (!ethogram) return;

    // Get all observations in the ethogram as Objects
    const obsArr = ethogram.getAllAsObjects()

    // Get the video name without extension
    const fileName = mainPlayer.getName();

    // Get the username
    const username = Player.getUsername();

    // Get the video frame rate
    const videoFPS = mainPlayer.getFrameRate();

    // Do not write metadata by default
    const withMetadata = false;

    // Attempt to export the ethogram to a CSV file
    const response = await window.electronAPI.exportBehaviors(obsArr, fileName, videoFPS, username, withMetadata);
    
    // Handle the intentional cancellation by users quitely
    if (response.canceled) return;

    // Show failure
    if (!response) {
      showAlertToast(
        `Behaviors could <strong>NOT</strong> be exported! Please try again.`, 
        'error', 
        'Behaviors Export Failed'
      );

      return;

    }

    // Show success
    if (response.filePath) {
      
      // Construct the badge for file path
      const filePathHtml = `<span class="badge text-bg-success">${response.filePath}<span>`;
      
      showAlertToast(`Behaviors exported to: ${filePathHtml}`, 'success', `Behaviors Exported`);
      
      return;

    }




  });


}



// Handle settings button
const settingsModal = document.getElementById(Player.settingsModalId);
const showSettingsBtn = document.getElementById('show-settings-btn');
if (showSettingsBtn) {
  showSettingsBtn.addEventListener('click', () => {
    if (!settingsModal) return;
    updateClassEls();
    const modalBootstrap = bootstrap.Modal.getOrCreateInstance(settingsModal);
    modalBootstrap.show();
  });
}

// Handle assigning class names to individuals on settings modal
const assignClassNamesToIndivsnBtn = settingsModal.querySelector('#assign-class-names-to-indivs-settings-btn');
if (assignClassNamesToIndivsnBtn) {
  assignClassNamesToIndivsnBtn.addEventListener('click', async (e) => await Player.handleAssignClassNamesBtnClick(e));
}


const clearAppDataBtn = document.getElementById('clear-app-data-btn');
if (clearAppDataBtn) {
  // Remove the config file from user folder
  clearAppDataBtn.addEventListener('click', async() => {

    // Hide the settings modal
    const settingsModalEl = document.getElementById(Player.settingsModalId);
    if (settingsModalEl) {
      const settingsModal = bootstrap.Modal.getOrCreateInstance(settingsModalEl);
      settingsModal.hide();
    }

    // Show alert modal
    showAlertModal(
      'Proceed with Caution', 
      [
        `This will result in losing all unexported work! The exported files will remain. This action cannot be undone.`,
        'Are you sure you want to continue?'
      ]
    );

    // Get user confirmation
    const alertConfirmBtn = document.getElementById('alert-confirm-btn');
    if (alertConfirmBtn) {
      const confirmed = await getUserConfirmationOnModal(alertConfirmBtn);
      
      // Do NOT proceed if not confirmed
      if (!confirmed) return;

      // Clear the app data folder and its contents
      const response = await window.electronAPI.clearAppData();
      if (response) {
        showAlertToast('Quitting...', 'success', 'App Data Cleared');
        await window.electronAPI.exit();
      }

    }
  });
}

// Handle opening name file with a list of the names of individuals
const importNameFileBtn = document.getElementById('open-name-list-file-btn');
if (importNameFileBtn) {
  importNameFileBtn.addEventListener('click', async () => await Player.importNameFile());
}

// Handle opening tracking file
const importTrackingFileBtn = document.getElementById('import-tracking-file-btn');
if (importTrackingFileBtn) {
  importTrackingFileBtn.addEventListener('click', async() => await Player.importTrackingFile());

}

// Handle opening action types file
const importActionFileBtn = document.getElementById('open-action-types-btn');
if (importActionFileBtn) {
  importActionFileBtn.addEventListener('click', async() => await Player.importActionFile());

}

// Handle tracking and interaction nav tab clicks (sync toast and table nav active states)
const trackingToastTabBtn = document.getElementById('tracking-toast-tab');
if (trackingToastTabBtn) {
  trackingToastTabBtn.addEventListener('click', () => {
    const trackingTableTab = document.getElementById('tracking-table-tab');
    if (trackingTableTab) trackingTable.click();
  });

}

const interactionToastTabBtn = document.getElementById('interaction-toast-tab');
if (interactionToastTabBtn) {
  interactionToastTabBtn.addEventListener('click', () => {
    const interactionTableTab = document.getElementById('interaction-table-tab');
    if (interactionTableTab) interactionTableTab.click();

  });

}

// // Handle showing seconds or frames for time
// const timeFormatButtons = document.querySelectorAll('.time-format-btn');
// if (timeFormatButtons) {
//   timeFormatButtons.forEach(button => {button.addEventListener('click', toggleTimeFormat)});
// }

// Handle exporting notes
const notesExportBtn = document.getElementById('export-notes-btn');
if (notesExportBtn) {
  
  notesExportBtn.addEventListener('click', async () => {
    
    const mainPlayer = Player.getMainPlayer();
    if (!mainPlayer) return;

    const notesTextArea = document.getElementById('notes-text-area');
    if (!notesTextArea) return;
    
    const text = notesTextArea.value;
    if (!text) return;

    const fileName = mainPlayer.getName();
    if (!fileName) return;

    const username = Player.getUsername();
          
    const response = await window.electronAPI.exportNotes(text, fileName, username);

    // Handle the intentional cancellation by users quitely
    if (response.canceled) return;

    // Show failure
    if (!response) {
      showAlertToast(
        `Notes could <strong>NOT</strong> be exported! Please try again.`, 
        'error', 
        'Notes Export Failed'
      );

      return;

    }
    
    // Show success
    if (response.filePath) {
      
      // Construct the badge for file path
      const filePathHtml = `<span class="badge text-bg-success">${response.filePath}<span>`;

      showAlertToast(`Notes exported to: ${filePathHtml}!`, 'success', `Notes Exported`);
      
      return;

    }



  })

}



// Keep track of interval ID for updating save status for notes
let notesIntervalId;

const notesTextAreaEl = document.getElementById('notes-text-area');
if (notesTextAreaEl) {
  // Handle saving edits to notes
  notesTextAreaEl.addEventListener('input', async () => {

    // Check if the main player exists
    const mainPlayer = Player.getMainPlayer();
    if (!mainPlayer) return;

    // Check if the file name exists
    const fileName = mainPlayer.getName();
    if (!fileName) return;

    // Get the note content
    const text = notesTextAreaEl.value;

    // Get the username
    const username = Player.getUsername();

    // Save changes to a file in the user data directory
    const filePath = await window.electronAPI.writeNotesToFile(text, fileName, username);
    if (filePath) {

      // Show last edit time
      Player.showLastEditForNotes(filePath);

    }

          

  });

  // // Disable/enable labeling when notes DOM element is focused/blurred
  // notesTextAreaEl.addEventListener('focus', () => {
  //   Player.setTypingStatus(true);
  // });

  // notesTextAreaEl.addEventListener('blur', () => {
  //   Player.setTypingStatus(false);
  // });



}





// Handle opening interaction labeling file
// const openInteractionFileBtn = document.getElementById('open-interaction-file-btn');
// if (openInteractionFileBtn) {
//   openInteractionFileBtn.addEventListener('click', async () => {
//     const  = await window.electronAPI.openSingleFile('interactions');
//     if () {
//       const observations = await window.electronAPI.readInteractionFile();
//       if (observations) {
//         observations.forEach(observation => {
//           addInteractionRow(interactionTable, observation)
//         })
//       }
//     }
//   })
// }





// Handle overlapping track selection button
const overlappingTracksSelectBtn = document.getElementById('overlapping-track-select-btn');
if (overlappingTracksSelectBtn) {
  overlappingTracksSelectBtn.addEventListener('click', (event) => {
    const trackSelect = document.getElementById('overlapping-track-select');
    if (trackSelect) {
      
      // Show warning if no track id is selected
      if (trackSelect.selectedIndex === 0) {
        const alertDiv = document.getElementById('overlapping-toast-alert-div');
        if (alertDiv) {
          alertDiv.textContent = 'A track ID must be selected!';
          alertDiv.classList.remove('d-none');
        }
      } else {
        const selectedOption = trackSelect.options[trackSelect.selectedIndex];
        // Get the selected track id and class
        const classId = selectedOption.dataset.classId;
        const trackId = selectedOption.value;
        
        // Find the selection in boxes in the current frame
        const mainPlayer = Player.getMainPlayer();
        if (mainPlayer) {
          const boxesInFrame = mainPlayer.getTrackingBoxesInFrame();
          if (boxesInFrame) {
            const selectedBox = boxesInFrame.filter(box => box.getClassId() === classId && box.getTrackId() === trackId)[0]
            if (selectedBox) {
              const toastEl = document.getElementById('overlapping-tracks-toast');
              const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastEl);
              toastBootstrap.dispose();

              // Show the toast for recording a behavior
              showToastForBehaviorRecording({ 
                event: event, 
                clickedBBox: selectedBox, 
                timestamp: mainPlayer.getCurrentTime(), 
                frameNumber: mainPlayer.getCurrentFrame()
              });

            }
          }
        }
        return {classId: classId, trackId: trackId}
      }
    }
  } )
}

// Handle canceling adding an action to table 
// const cancelActionSaveBtn = document.getElementById('cancel-label-save-btn');
// if (cancelActionSaveBtn) {
//   // Clear toast content
//   const actionTab = toast.querySelector('#interaction-toast-tab');
//   if (actionTab) {
//     actionTab.dataset.obsStatus = 'new';
//   }

//   // Remove the incomplete observation from table

//   // Dispose toast
// }





/**
 * Change time format to frames to seconds (MM:SS) and vice versa
 */
function toggleTimeFormat() {
  const timeFormatButtons = document.querySelectorAll('.time-format-btn');
  
  // Get the time format status (frames or seconds)
  const currentFormat = this.dataset.timeFormat;
  // const tooltip = bootstrap.Tooltip.getInstance(this);

  let iconText;
  let timeFormat;
  let tooltipTitle;

  // Get the cells with time in them (either frame numbers or minutes:seconds)
  const timeCells = document.querySelectorAll('.time-cell');
  if (currentFormat === 'frames') {
    timeFormat = 'seconds';
    iconText = 'timer_off';
    tooltipTitle = 'Hide seconds';


    if (timeCells.length > 0) {
      // Convert frames to seconds
      timeCells.forEach(cell => {
        if (cell.dataset.frameNumber) {
          cell.textContent = formatSeconds(framesToSeconds(cell.dataset.frameNumber));
        } else {
          cell.textContent = '-'; // If no data is on the cell element yet

        }
      })
    }
  } else if (currentFormat === 'seconds') {
    timeFormat = 'frames';
    iconText = 'timer';
    tooltipTitle = 'Show seconds';
    
    if (timeCells.length > 0) {
      // Convert seconds to frames
      timeCells.forEach(cell => {
        if (cell.dataset.frameNumber) {
          cell.textContent = cell.dataset.frameNumber;
        } else {
          cell.textContent = '-'; // If no data is on the cell element yet
        }
      })
    }
  }

  

  // Update the button status
  if (timeFormatButtons) {
    timeFormatButtons.forEach(button => {
      button.dataset.timeFormat = timeFormat; // Update the time format status
      button.querySelector('span').textContent = iconText; // Change the icon
      const tooltip = bootstrap.Tooltip.getInstance(button);
      tooltip.setContent({ '.tooltip-inner': tooltipTitle })
    })
  }
}

function resizeMainPanel(arg) {
  const secondaryPanelEl = document.getElementById('secondary-video-col');
  if (secondaryPanelEl) {
    const currentClassName = secondaryPanelEl.className;
    let secondaryColSize = parseInt(currentClassName.match(/\d+/)[0]); // Get the current column size of the secondary panel
    const minColSize = 3;
    const maxColSize = 6;

    if (arg === 'enlarge') {
      if (secondaryColSize > minColSize && secondaryColSize < 12) {
        // Decrease the secondary column size
        secondaryColSize = secondaryColSize - 1; 
      } else {
        // Place the secondary panel below main panel if user enlarges the main panel too much
        secondaryColSize = 12; 
      }

    } else if (arg === 'shrink') {
      if (secondaryColSize < maxColSize) {
        secondaryColSize = secondaryColSize + 1; // Increase the secondary column size
      } else if (secondaryColSize === 12) {
        // Place the secondary panel to the right of the main panel if user shrinks the main panel too much
        secondaryColSize = 3;
      }
    } else if (arg === 'reset') {
      secondaryColSize = 4;
    }

    const newClassName = `col-${secondaryColSize}`
    secondaryPanelEl.classList.remove(currentClassName) // Remove the old class (e.g. col-4)
    secondaryPanelEl.classList.add(newClassName) // Add the new class (e.g. col-3)
  }




}



/**
 * Enlarge and shrink main panel
 */
const enlargeMainPanelBtn = document.getElementById('enlarge-main-panel-btn');
if (enlargeMainPanelBtn) {
  enlargeMainPanelBtn.addEventListener('click', () => resizeMainPanel('enlarge'))
}

const shrinkMainPanelBtn = document.getElementById('shrink-main-panel-btn');
if (shrinkMainPanelBtn) {
  shrinkMainPanelBtn.addEventListener('click', () => resizeMainPanel('shrink'))
}

const resetMainPanelBtn = document.getElementById('reset-main-panel-btn');
if (resetMainPanelBtn) {
  resetMainPanelBtn.addEventListener('click', () => resizeMainPanel('reset'));
}

// Handle changing maximum playback rate
const maxPlaybackRateSelectEl = document.getElementById('max-playback-rate-select');
if (maxPlaybackRateSelectEl) {
  // Change the maximum playback rate when user changes the relevant setting
  maxPlaybackRateSelectEl.addEventListener('change', () => {
    let selectedMaxRate = parseFloat(maxPlaybackRateSelectEl.selectedOptions[0].value);
    // playbackRateInput.setMax(selectedMaxRate);
    Player.setMaxPlaybackRate(selectedMaxRate);
    updatePlaybackRateList();

  });

}

// Handle jumping to a specific frame in a video
const jumpToFrameBtn = document.getElementById(Player.jumpToFrameBtnId);
const jumpToFrameInput = document.getElementById(Player.jumpToFrameInputId);
if (jumpToFrameBtn && jumpToFrameInput) {

  jumpToFrameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      Player.userIsTyping();
      Player.jumpToFrame(jumpToFrameInput.value);
      Player.userStoppedTyping();
    }
  });
  
  jumpToFrameBtn.addEventListener('click', () => Player.jumpToFrame(jumpToFrameInput.value));


}

// Disable/enable labeling when text input element is focused/blurred
const textInputEls = document.querySelectorAll('input[type="text"], textarea');
textInputEls.forEach(inputEl => {
  inputEl.addEventListener('focus', Player.userIsTyping);
  inputEl.addEventListener('blur', Player.userStoppedTyping);
});


// Handle tooltips to show info over buttons and other elements
// Only show tooltip while hovering not after clicking (default is "hover focus"
const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl, {'trigger': 'hover'}));

// Initialize popovers
// const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
// const popoverList = [...popoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl));

// Handle undo tracking edits
const undoTrackEditBtn = document.getElementById('undo-tracking-change-btn');
if (undoTrackEditBtn) {
  undoTrackEditBtn.addEventListener('click', () => {
    // Remove the last change from tracking table
    const firstRow = trackingTable.querySelector('tbody tr:not(.empty-table-info)'); // O-th zero is info row (invisible if there are data on table)
    if (firstRow) {
      Player.getMainPlayer().getTrackingMap().undo();
      firstRow.remove();
    }

    // Show info row if the table is empty of data
    if (!trackingTable.querySelector('tbody tr:not(.empty-table-info)')) {
      const infoRow = addInfoRow(trackingTable, 'Modified tracking labels will appear here');
    }


  })
}


function saveTableToFile(fileDelimiter) {
  const saveLabelTableBtn = document.getElementById('save-label-table-btn');
  if (!fileDelimiter) {
    fileDelimiter = ' ';
  }

  if (saveLabelTableBtn) {
    const labelTable = document.getElementById('interaction-table');
    saveLabelTableBtn.addEventListener('click', async () => {
      let tableContentArr = []

      // Iterate over table cells to format them
      for (let row of labelTable.rows) {
        let rowContentArr = [];
        for (let cell of row.cells) {
          // Convert MM:SS to seconds or maybe frames for the start and end of an interaction
          // let cellContent = cell.textContent;
          // if (cellContent.includes(':')) {
          //   cellContent = formatMinutes(cellContent)
          // } 
          // rowContent.push(cellContent);
          rowContentArr.push(cell.textContent)
        }
        const rowContent = rowContentArr.join(fileDelimiter); // Add tab between the cells and a newline after each row
        tableContentArr.push(rowContent);

      }
      const mainPlayerSrc = Player.getMainPlayer().getSource();
      const mainVideoFileName = await getFileNameWithoutExtension(mainPlayerSrc);
      const tableContent = tableContentArr.join('\n');
      const output = await window.electronAPI.outputTrackingTable(tableContent, mainVideoFileName);
    })
  }
}







// Handle opening a new main video
const openMainVideoBtn = document.getElementById('open-main-video-btn'); 
if (openMainVideoBtn) {
  openMainVideoBtn.addEventListener('click', async () => {
    
    // Pause the main video
    const mainPlayer = Player.getMainPlayer();
    if (mainPlayer) {
      mainPlayer.pause();   
      // Save the metadata of the existing video before opening a new video
      // Update metadata
      const metadata = Player.getMetadata();
      if (metadata) {
        await metadata.writeToFile();
      }

    }
    
    // Let user open a new video
    const mainVideoPath = await window.electronAPI.openSingleVideo();
    if (mainVideoPath) {
     
      // Show the spinner
      showProcessIndicator();
      
      // Show info
      showAlertToast('Loading the main video...', 'info');
  
      // Load the new video
      try {
        await Player.loadMainPlayer(mainVideoPath);
        showAlertToast('Video loaded!', 'success');
  
      } catch (error) {
        showAlertModal(
          'Unsupported Video Type', 
          [
            'Selected video is not supported!',
            'Please try again with another video.'
          ],
          true,
          'Continue',
          false,
          'Dismiss'
        );

        showAlertToast('Video could not be loaded!', 'error');

        // Hide the spinner
        hideProcessIndicator();

      }

      // Hide the spinner
      hideProcessIndicator();


    }

  });

}



// Handle taking a snapshot
const snapshotModalBtn = document.getElementById('snapshot-btn');
if (snapshotModalBtn) {
  snapshotModalBtn.addEventListener('click', () => {
    const mainPlayer = Player.getMainPlayer();
    if (!mainPlayer) {
      showAlertToast('Please open the main video first!', 'warning', 'Snapshots Disabled');
      return;
    }

    mainPlayer.drawSnapshot();

  });

}

// Handle saving a snapshot
const saveSnapshotBtn = document.getElementById('save-snapshot-btn');
if (saveSnapshotBtn) {
  saveSnapshotBtn.addEventListener('click', async () => {
    showProcessIndicator(); // Show indicator
    
    const mainPlayer = Player.getMainPlayer();
    if (!mainPlayer) {
      showAlertToast('Please open the main video first!', 'warning', 'Snapshots Disabled');
      hideProcessIndicator(); // Hide indicator
      return;
    }

    // Save the snapshot
    await mainPlayer.saveSnapshot();

    hideProcessIndicator(); // Hide indicator
    
  });

}


// Handle collapsing panels
const collapseElementList = document.querySelectorAll('.collapse');
if (collapseElementList) {
  collapseElementList.forEach(collapseEl => {
    collapseEl.addEventListener('hide.bs.collapse', () => {
      // Get the button which controls collapsing of this element
      const collapseBtn = document.querySelector(collapseEl.dataset.collapseButton);
      collapseBtn.querySelector('span').textContent = 'visibility_off';
    })
    collapseEl.addEventListener('show.bs.collapse', () => {
      // Get the button which controls collapsing of this element
      const collapseBtn = document.querySelector(collapseEl.dataset.collapseButton);
      collapseBtn.querySelector('span').textContent = 'visibility';
    })
  })
}


// Handle undo button for recording an observation
const undoCurrentObsBtn = document.getElementById('undo-current-observation-btn');
if (undoCurrentObsBtn) {
  undoCurrentObsBtn.addEventListener('click', () => {
    const currentObs = Player.getCurrentObservation();
    if (!currentObs.isEmpty()) currentObs.undo();
  })
}

// Handle jumping to the starting frame of the current observation
const startTimeCurrentObsEl = document.getElementById('current-observation-start');
if (startTimeCurrentObsEl) {
  startTimeCurrentObsEl.addEventListener('click', () => {
    // Get the starting frame from dataset
    const startFrame = parseInt(startTimeCurrentObsEl.dataset.frameNumber);

    // Check if it is valid
    if (Number.isInteger(startFrame)) {

      Player.pauseAll();
      Player.setCurrentFrameAll(startFrame);

      // // Get the all players
      // const allPlayers = Player.getAllInstances();
      
      // if (allPlayers.length > 0) {
      //   allPlayers.forEach(player => {  
      //     // Pause the player
      //     player.pause();
          
      //     // Convert frames to seconds and set the time of each players
      //     player.setCurrentTime(framesToSeconds(startFrame));
  
      //   });
      // }
        
    }

  });

}

// Handle jumping to the ending frame of the current observation
const endTimeCurrentObsEl = document.getElementById('current-observation-end');
if (endTimeCurrentObsEl) {
  endTimeCurrentObsEl.addEventListener('click', () => {
    // Get the starting frame from dataset
    const endFrame = parseInt(endTimeCurrentObsEl.dataset.frameNumber);

    // Check if it is valid
    if (Number.isInteger(endFrame)) {

      Player.pauseAll();
      Player.setCurrentFrameAll(endFrame);

      // // Get the all players
      // const allPlayers = Player.getAllInstances();
      
      // if (allPlayers.length > 0) {
      //   allPlayers.forEach(player => {  
      //     // Pause the player
      //     player.pause();
          
      //     // Convert frames to seconds and set the time of each players
      //     player.setCurrentTime(framesToSeconds(endFrame));
  
      //   });
      // }
        
    }

  });

}



// Trial for reading the ethogram
const importBehaviorsBtn = document.getElementById('import-behaviors-btn');
if (importBehaviorsBtn) {
  importBehaviorsBtn.addEventListener('click', async () => await Player.importBehaviorFile());
  
}



// Handle exporting all saved files to a directory
const exportAllBtn = document.getElementById('export-all-btn');
if (exportAllBtn) {

  // Get the modal element
  const modalEl = document.getElementById('export-all-modal');
  
  if (modalEl) {

    const showExportFilesBtn = modalEl.querySelector('#show-exported-files-btn');

    // Show a modal to inform the user when export all button is clicked
    exportAllBtn.addEventListener('click', () => {
  
      const mainPlayer = Player.getMainPlayer();
      if (!mainPlayer) return;

      const exportInfoEl = modalEl.querySelector('#export-dir-info');
      if (exportInfoEl) {
        const videoName = mainPlayer.getName();
        if (videoName) {
          exportInfoEl.innerHTML = `Subdirectory <span class="badge text-bg-info">${videoName}</span> will be created under the selected directory`
        }

      }
  
      // Get the modal instance
      const modalBootstrap = bootstrap.Modal.getOrCreateInstance(modalEl);
      if (!modalBootstrap) return;
      
      // Hide the result indicator elements
      const errorEls = Array.from(modalEl.querySelectorAll('.error-indicator'));
      const successEls = Array.from(modalEl.querySelectorAll('.success-indicator'));
      const warningEls = Array.from(modalEl.querySelectorAll('.warning-indicator'));
      errorEls.forEach(el => el.classList.add('d-none'));
      successEls.forEach(el => el.classList.add('d-none'));
      warningEls.forEach(el => el.classList.add('d-none'));
    
      // Hide the button for showing exported files
      if (showExportFilesBtn) showExportFilesBtn.classList.add('invisible');

      // Show the pending indicator elements
      const pendingEls = Array.from(modalEl.querySelectorAll('.pending-indicator'));
      pendingEls.forEach(el => el.classList.remove('d-none'));
  
      // Show the modal
      modalBootstrap.show(); 
  
    });

    // Export all files linked to main video
    const exportConfirmBtn = modalEl.querySelector('#export-confirm-btn');
    if (exportConfirmBtn) {
      
      exportConfirmBtn.addEventListener('click', async() => {

        const mainPlayer = Player.getMainPlayer();
        if (!mainPlayer) return;

        // First update the metadata file
        const metadata = Player.getMetadata();
        if (metadata) {
          await metadata.writeToFile();
        }

        // Check if an export directory was chosen
        // const configData = await window.electronAPI.getFromConfig();
        // if (!configData?.exportDirPath) {
        if (!Config.exportDirPath) {
          // showAlertToast('Please select an export directory first!', 'warning');
          showPopover({
            domEl: modalEl.querySelector('#change-export-dir-input'),
            title: 'Empty Input for Export Directory',
            content: 'Please select an export directory first!',
            type: 'error',
            placement: 'top'
          });
          return;
        }
        
        // Hide pending indicators
        const pendingEls = modalEl.querySelectorAll('.pending-indicator');
        pendingEls.forEach(el => el.classList.add('d-none'));

        // Hide error indicators
        const errorEls = modalEl.querySelectorAll('.error-indicator');
        errorEls.forEach(el => el.classList.add('d-none'));

        // Show loading indicators
        const loadingEls = modalEl.querySelectorAll('.loading-indicator');
        loadingEls.forEach(el => el.classList.remove('d-none'));
  
        // Get the response
        const response = await window.electronAPI.exportAll();
  
        // Hide the loading indicators - with delay for better user experience
        await new Promise(resolve => setTimeout(resolve, 1000));
        loadingEls.forEach(el => el.classList.add('d-none'));
        
        // If no response, show error icon for all files
        if (!response) {
          errorEls.forEach(el => el.classList.remove('d-none'));
          showAlertToast('Selected export directory either does not exist or inaccessible!', 'error', 'Invalid Export Directory')
          return;
  
        }

        // Save the final output directory path to the relevant button to open it in the OS file manager
        const showExportFilesBtn = modalEl.querySelector('#show-exported-files-btn');
        if (showExportFilesBtn && response.outDirPath) {
          showExportFilesBtn.classList.remove('invisible');
          showExportFilesBtn.dataset.path = response.outDirPath;
        }
        
        // Get the HTML element for behavior
        const behaviorEl = modalEl.querySelector('[data-file-type="behaviors"]');
        if (!behaviorEl) return;
  
        // Check if the behavior file was exported
        if (response.behaviors.exported) {
          const successEl = behaviorEl.querySelector('.success-indicator');
          if (successEl) successEl.classList.remove('d-none');
        
        // Check if the behavior file was found but not exported
        } else if (response.behaviors.found) {
          const errorEl = behaviorEl.querySelector('.error-indicator');
          if (errorEl) errorEl.classList.remove('d-none');
          
        // Check if the behavior file was not found or exported
        } else {
          const warningEl = behaviorEl.querySelector('.warning-indicator');
          if (warningEl) warningEl.classList.remove('d-none');
          
        }
  
        // Get the HTML element for tracking
        const trackingEl = modalEl.querySelector('[data-file-type="tracking"]');
        if (!trackingEl) return;

        // Check if the tracking file is exported
        if (response.tracking.exported) {
          const successEl = trackingEl.querySelector('.success-indicator');
          if (successEl) successEl.classList.remove('d-none');

        // Check if the tracking file was found but not exported
        } else if (response.tracking.found) {
          const errorEl = trackingEl.querySelector('.error-indicator');
          if (errorEl) errorEl.classList.remove('d-none');
          
        // Check if the tracking file was not found or exported
        } else {
          const warningEl = trackingEl.querySelector('.warning-indicator');
          if (warningEl) warningEl.classList.remove('d-none');
          
        }
  
        // Get the HTML element for identification
        const identificationEl = modalEl.querySelector('[data-file-type="identification"]');
        if (!identificationEl) return;
  
        // Check if the identification file is exported
        if (response.identification.exported) {
          const successEl = identificationEl.querySelector('.success-indicator');
          if (successEl) successEl.classList.remove('d-none');

        // Check if the identification file was found but not exported
        } else if (response.identification.found) {
          const errorEl = identificationEl.querySelector('.error-indicator');
          if (errorEl) errorEl.classList.remove('d-none');
          
        // Check if the identification file was not found or exported
        } else {
          const warningEl = identificationEl.querySelector('.warning-indicator');
          if (warningEl) warningEl.classList.remove('d-none'); 
          
        }
  
        // Get the HTML element for notes
        const notesEl = modalEl.querySelector('[data-file-type="notes"]');
        if (!notesEl) return;
  
        // Check if the notes file is exported
        if (response.notes.exported) {
          const successEl = notesEl.querySelector('.success-indicator');
          if (successEl) successEl.classList.remove('d-none');

        // Check if the notes file was found but not exported
        } else if (response.notes.found) {
          const errorEl = notesEl.querySelector('.error-indicator');
          if (errorEl) errorEl.classList.remove('d-none');
          
        // Check if the notes file was not found or exported
        } else {
          const warningEl = notesEl.querySelector('.warning-indicator');
          if (warningEl) warningEl.classList.remove('d-none');
          
        }

        // Get the HTML element for metadata
        const metadataEl = modalEl.querySelector('[data-file-type="metadata"]');
        if (!metadataEl) return;
  
        // Check if the notes file is exported
        if (response.metadata.exported) {
          const successEl = metadataEl.querySelector('.success-indicator');
          if (successEl) successEl.classList.remove('d-none');

        // Check if the notes file was found but not exported
        } else if (response.metadata.found) {
          const errorEl = metadataEl.querySelector('.error-indicator');
          if (errorEl) errorEl.classList.remove('d-none');
          
        // Check if the notes file was not found or exported
        } else {
          const warningEl = metadataEl.querySelector('.warning-indicator');
          if (warningEl) warningEl.classList.remove('d-none');
          
        }
  
      });
  
    }

    // Open the output directory under the main export directory with OS file manager
    if (showExportFilesBtn) {
      showExportFilesBtn.addEventListener('click', async () => {
        const dirPath = showExportFilesBtn.dataset.path;
        if (dirPath) {
          await window.electronAPI.openPath(dirPath);
        }

      });
    }

    // Open the main export directory with OS file manager
    const openExportDirBtn = modalEl.querySelector('#open-export-dir-btn');
    if (openExportDirBtn) {
      openExportDirBtn.addEventListener('click', async () => {
        const dirPath = openExportDirBtn.dataset.path;
        if (dirPath) {
          const response = await window.electronAPI.openPath(dirPath);
          if (response != '') {
            showAlertToast(response, 'error');

          }
        }

      });
    }

  }

}

// Show release notes
const showReleaseNotesModalBtn = document.getElementById('show-release-notes-btn');
if (showReleaseNotesModalBtn) {
  showReleaseNotesModalBtn.addEventListener('click', () => {
    const releaseNotesModalEl = document.getElementById('release-notes-modal');
    if (releaseNotesModalEl) {
      const modal = bootstrap.Modal.getOrCreateInstance(releaseNotesModalEl);
      modal.show();
    }
  });

}

// Make the zoomed canvas div draggable
const zoomVideoDiv = document.getElementById('zoom-video-div');
if (zoomVideoDiv) {
  dragElement(zoomVideoDiv);

  // Dismiss the entire element for the zoomed region
  const btnDismiss = zoomVideoDiv.querySelector('.btn-dismiss');
  if (btnDismiss) {
    btnDismiss.addEventListener('click', () => {
      const mainPlayer = Player.getMainPlayer();
      if (!mainPlayer) return;

      const zoomRect = mainPlayer.zoomRect;
      if (!zoomRect) return;

      // Save zoom display status
      zoomRect.shouldHideEl = true;

      // Hide the zoom element
      zoomVideoDiv.classList.add('d-none');
      
      // Clear the zoom selection rectangle on the main video
      const zoomSelectCanvas = document.getElementById('main-zoom-select-canvas');
      if (zoomSelectCanvas) {
        const ctx = zoomSelectCanvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, zoomSelectCanvas.width, zoomSelectCanvas.height);
        }
      }

      // Clear request id for zooming
      window.cancelAnimationFrame(Player.zoomRequestId);
      Player.zoomRequestId = undefined;

    });

  }

  // Collapse only the canvas. Show the panel for control buttons
  const zoomCollapseBtn = zoomVideoDiv.querySelector('.btn-collapse');
  if (zoomCollapseBtn) {
    zoomCollapseBtn.addEventListener('click', () => {
      const canvas = zoomVideoDiv.querySelector('canvas');
      if (!canvas) return;
      
      const iconEl = zoomCollapseBtn.querySelector('span');
      if (!iconEl) return;
      
      if (!canvas.parentElement.classList.contains('d-none')){
        canvas.parentElement.classList.add('d-none');
        iconEl.textContent = 'expand_content';

      } else {
        canvas.parentElement.classList.remove('d-none');
        iconEl.textContent = 'collapse_content'
      }

    });

  }

}

// Handle changing the zoom scale
const changeZoomScaleInput = document.getElementById('change-zoom-scale-input');
if (changeZoomScaleInput) {
  // Set up the min, max and current values
  changeZoomScaleInput.value = Player.getZoomScale();
  changeZoomScaleInput.min = Player.getMinZoomScale();
  changeZoomScaleInput.max = Player.getMaxZoomScale();

  changeZoomScaleInput.addEventListener('change', async () => {
    const newValue = changeZoomScaleInput.value;
    if (newValue) {
      const confirmedValue = await Player.setZoomScale(newValue);
      if (!confirmedValue) {
        showAlertToast(`Zoom scale must be between ${Player.minZoomScale} and ${Player.maxZoomScale}!`, 'error', 'Invalid Zoom Scale Input')
        return;
      }

      showAlertToast(`Zoom scale set to <span class="badge text-bg-success">${confirmedValue}x</span>`, 'success', 'Zoom Scale Updated');

    }

  });

}

// // Handle enabling/disabling auto updates
// const autoUpdateSwitch = document.getElementById('auto-update-switch');
// if (autoUpdateSwitch) {
//   autoUpdateSwitch.addEventListener('change', async () => {
//     const autoUpdateStatus = autoUpdateSwitch.checked ? 'enabled' : 'disabled';
//     const response = await window.electronAPI.saveToConfig({ autoUpdateStatus: autoUpdateStatus});
//     if (!response) {
//       showAlertToast('Please try again!', 'error', 'Automatic Update Status Change Unsuccessful!');
//     } else if (autoUpdateSwitch.checked) {
//       showAlertToast('Automatic updates ENABLED!', 'info');
//     } else {
//       showAlertToast('Automatic updates DISABLED!', 'info');
//     }

//   })


// }

// Handle checking updates manually
const checkUpdatesBtn = document.getElementById('check-updates-btn');
if (checkUpdatesBtn) {
  checkUpdatesBtn.addEventListener('click', () => {
    window.electronAPI.checkUpdates();
  })
}

const drawTrackingBoxBtn = document.getElementById('toggle-drawing-mode-btn');
if (drawTrackingBoxBtn) {
  drawTrackingBoxBtn.addEventListener('click', Player.toggleDrawingMode);

}

// Handle changing class names (and colors)
const classNamesModal = document.getElementById('class-names-modal');
if (classNamesModal) {
  const saveBtn = classNamesModal.querySelector('.confirm-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => await Player.handleClassAttrChange());
  }
}

// Handle changing bounding box line width
const boundBoxLineWidthInput = document.getElementById('bounding-box-line-width-input');
if (boundBoxLineWidthInput) {
  // Set the min and max values
  boundBoxLineWidthInput.value = BoundingBox.getLineWidth();
  boundBoxLineWidthInput.min = BoundingBox.getMinLineWidth();
  boundBoxLineWidthInput.max = BoundingBox.getMaxLineWidth();

  boundBoxLineWidthInput.addEventListener('change', async () => {
    const userInput = boundBoxLineWidthInput.value;
    const newWidth = await BoundingBox.setLineWidth(userInput);

    // Show warning in case of an invalid input
    if (!newWidth) {
      showAlertToast(
        `Line width must be between ${BoundingBox.getMinLineWidth()} and ${BoundingBox.getMaxLineWidth()}`, 
        'warning', 
        'Invalid Input'
      );
      return;
    }

    // Show success
    showAlertToast(
      `Line width set to <span class="badge text-bg-success">${newWidth} px</span>`, 
      'success',
      'Bounding Box Line Width Updated'
    );

    // Refresh canvas
    Player.refreshMainCanvas();

  });

}

// Handle changing bounding box opacity
const boundBoxOpacityInput = document.getElementById('bounding-box-opacity');
if (boundBoxOpacityInput) {
  
  // Get the min and max
  const minOpacity = BoundingBox.getMinOpacity();
  const maxOpacity = BoundingBox.getMaxOpacity();
  
  // Set the min and max values
  boundBoxOpacityInput.value = BoundingBox.getOpacity();
  boundBoxOpacityInput.min = minOpacity;
  boundBoxOpacityInput.max = maxOpacity

  boundBoxOpacityInput.addEventListener('change', async () => {
    const userInput = boundBoxOpacityInput.value;
    const newOpacity = await BoundingBox.setOpacity(userInput);

    // Show warning in case of an invalid input
    if (!newOpacity) {
      showAlertToast(
        `Opacity must be between ${minOpacity} and ${maxOpacity}`, 
        'warning', 
        'Invalid Input'
      );
      return;
    }

    // Show success
    showAlertToast(
      `Line width set to <span class="badge text-bg-success">${newOpacity}%</span>`, 
      'success',
      'Bounding Box Opacity Updated'
    );

    // Refresh canvas
    Player.refreshMainCanvas();

  });

}

// Handle importing example files
const importExamplesFilesBtn = document.getElementById('import-example-files-btn');
if (importExamplesFilesBtn) {
  importExamplesFilesBtn.addEventListener('click', async () => {
    
    // Show loading indicator 
    showProcessIndicator();
    
    const filePaths = await window.electronAPI.getExampleFilePaths();
    if (!filePaths) {
      showAlertToast('Please try again.', 'error', 'Failed to Import Examples');
      hideProcessIndicator();
      return;
    }

    const { 
      mainVideo: mainPlayerSrc, 
      tracking: trackingPath,
      secondaryVideos: secPlayerSrcArr, 
      individuals: individualsPath, 
      actions: actionsPath 
    } = filePaths;

    if (!mainPlayerSrc || !trackingPath || !secPlayerSrcArr || !individualsPath || !actionsPath) {
      showAlertToast('Please try again.', 'error', 'Failed to Import Examples');
      hideProcessIndicator();
      return;
    } 

    try {
      await Player.loadMainPlayer(mainPlayerSrc);
      await loadSecondaryVideos(secPlayerSrcArr);
      await Player.importTrackingFile(trackingPath);
      await Player.importActionFile(actionsPath);
      await Player.importNameFile(individualsPath);

    } catch (error) {
      console.log(error);
      hideProcessIndicator();
    }

  })
}

// Event listeners for select element within the div for confirming drawing of a new bounding box to detect class selection change
const drawnBBoxDiv = document.getElementById(Player.drawnBBoxDivId);
if (drawnBBoxDiv) {
  const classInput = drawnBBoxDiv.querySelector(`#${Player.drawnBBoxClassInputId}`);
  if (classInput) {
    classInput.addEventListener('change', DrawnBoundingBox.handleClassChange);
    classInput.addEventListener('focus', Player.userIsTyping);  // Disable hotkeys when user is typing
    classInput.addEventListener('blur', Player.userStoppedTyping);  // Enable hotkeys after user stopped typing
  }

  const colorInput = drawnBBoxDiv.querySelector('input[type="color"]');
  if (colorInput) {
    colorInput.addEventListener('change', DrawnBoundingBox.handleColorChange);
  }

  const confirmBtn = drawnBBoxDiv.querySelector('.confirm-btn');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', async (e) => await DrawnBoundingBox.handleConfirmation(e));
  }

  const cancelBtn = drawnBBoxDiv.querySelector('.cancel-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', DrawnBoundingBox.handleCancellation);
  }

  const interpolationMainBarDiv = document.getElementById(DrawnBoundingBox.interpolationElOnMainBarId);
  if (interpolationMainBarDiv) {
    const cancelBtn = interpolationMainBarDiv.querySelector('.cancel-btn');
    if (cancelBtn) cancelBtn.addEventListener('click', DrawnBoundingBox.handleCancellation);
     
  }

  const interpolateBtnEls = drawnBBoxDiv.querySelectorAll('.interpolate-btn');
  if (interpolateBtnEls) {
    interpolateBtnEls.forEach?.(btnEl => btnEl.addEventListener('click', async (e) => await DrawnBoundingBox.handleInterpolation(e)));
  }

}

// Handle clicking the buttons for assigning class names to individuals 
const assignClassNamesToIndivsBtn = document.getElementById('assign-class-names-btn');  // Main button
if (assignClassNamesToIndivsBtn) {
  assignClassNamesToIndivsBtn.addEventListener('click', async (e) => await Player.handleAssignClassNamesBtnClick(e));
}


// Remove keypressHandler for changing hotkeys upon Modal dismissal 
const modalEls = document.querySelectorAll('.modal');
modalEls.forEach(modalEl => {
  modalEl.addEventListener('hidden.bs.modal', () => {
    window.removeEventListener('keydown', Hotkey.keypressHandler, true)
  });
});


