/**
 * Helper functions
 */

// const fs = require('node:fs');
// const path = require('node:path');
// const bootstrap = require('bootstrap');
import { Player, Observation, Hotkey, BoundingBox, Config } from './components.js';



// Offset in pixels for drawing highlight rectangles on canvas around selected tracking boxes
// const offsetHighlight = 5; 

/**
 * 
 * @param {Array} objects
 * @param {*} field
 * @returns - Unique values in specified field
 */
function getUniqueFieldValues(objects, field) {
  const uniqueValues = new Set();
  
  objects.forEach(object => {
      uniqueValues.add(object[field]);
  });
  
  return Array.from(uniqueValues);
}





/**
 * Displays toast elements for alerts
 * @param {String} message Alert message to be shown
 * @param {String | undefined } type Success, error, warning or undefined (for info) to style the toast element accordingly
 * @param {String} title Title of the alert
 */
function showAlertToast(message, type, title) {
  const toastEl = document.getElementById('alert-toast');
  if (!toastEl) return;

  const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastEl);
  const toastBody = toastEl.querySelector('.toast-body');
  const toastMessage = toastEl.querySelector('.toast-message');
  const toastIcon = toastEl.querySelector('.toast-icon');
  if (!toastIcon) return;

  const toastHeader = toastEl.querySelector('.toast-header');
  const alertTitle = toastEl.querySelector('.alert-title');
  const closeBtn = toastEl.querySelector('#no-header-toast-close-btn');


  if (type === 'success') {
    toastIcon.textContent = 'check_circle';
    toastIcon.classList.remove('text-danger', 'text-info', 'text-warning');
    toastIcon.classList.add('text-success');
  } else if (type === 'error') {
    toastIcon.textContent = 'error';
    toastIcon.classList.remove('text-success', 'text-info', 'text-warning');
    toastIcon.classList.add('text-danger');
  } else if (type === 'warning') {
    toastIcon.textContent = 'warning';
    toastIcon.classList.remove('text-danger', 'text-success', 'text-info');
    toastIcon.classList.add('text-warning');
  } else {
    toastIcon.textContent = 'info';
    toastIcon.classList.remove('text-danger', 'text-success', 'text-warning');
    toastIcon.classList.add('text-info');
  }

  if (toastBody) {
    toastBody.insertBefore(toastIcon, toastMessage);
  }

  // Show the close button in the simplied toast by default
  if (closeBtn) closeBtn.classList.remove('d-none');
  
  // Hide the header by default
  if (toastHeader) {
    toastHeader.classList.add('d-none');
    if (title && alertTitle) {
      // Move the icon to the header
      const firstChild = toastHeader.firstChild;
      toastHeader.insertBefore(toastIcon, firstChild);
      
      // Show the title and header element
      alertTitle.textContent = title;
      toastHeader.classList.remove('d-none');
      
      // Hide close button in the simplified toast to prevent duplication
      if (closeBtn) closeBtn.classList.add('d-none');
    }
  }


  toastMessage.innerHTML = message;
  toastBootstrap.show();
  
}


/**
 * Shows a popover over the given DOM element
 * @param {Object} options 
 * @param {Boolean | undefined} options.onCanvas If true, shows the popover over main canvas and ignores "domEl" argument
 * @param {Number | undefined} options.x X-coordinate for the DOM element's origin (i.e. style.left). Mandatory if onCanvas is true
 * @param {Number | undefined} options.y Y-coordinate for the DOM element's origin (i.e. style.top). Mandatory if onCanvas is true
 * @param {Element} options.domEl DOM element for the popover
 * @param {String} options.title Title of the popover
 * @param {String} options.content Content of the popover
 * @param {String | undefined} options.placement Location of popover relative to the DOM element. Should be either "top", "bottom", "right" or "left".
 * @param {Number | undefined} options.hideTimeout Timeout in milliseconds for hiding the popover 
 * @param {String | undefined} options.customClass Class name for styling. Overrides "type" if both are given. 
 * @param {Number[] | undefined} options.offset Offset of the popover relative to its target [skidding, distance]
 * @param {String | undefined} options.type Type of the alert for styling. Should be either "success", "error", "info", "warning" or "response". The default value is "info". If "response" is selected, it will show confirmation/cancellation buttons to get user feedback and ignore hideTimeout option. 
 */
function showPopover(options) {
  const { 
    onCanvas = false, x, y, title, content,
    placement, hideTimeout, offset, 
    customClass, type, showResponseBtn
  } = options;

  // Determine the DOM element depending on whether the popover should be shown on the main canvas
  let domEl = options.domEl;
  if (onCanvas) {
    
    // Check if the coordinates are given
    for (const coord of [x, y]) {
      if (coord === null || typeof coord === 'undefined' || 
        Number.isNaN(coord) || !Number.isFinite(coord)
      ) {
        console.log('X and Y coordinates must be provided to display a popover on the main canvas');
        return;
      }

    }

    const mainCanvas = Player.getMainCanvas();
    if (!mainCanvas) return;

    const canvasRect = mainCanvas.getBoundingClientRect();
    if (!canvasRect) return;

    const widthRatio = mainCanvas.width / mainCanvas.clientWidth;
    const heightRatio =  mainCanvas.height / mainCanvas.clientHeight;

    domEl = document.getElementById('alert-popover-canvas-div');
    domEl.style.left = parseFloat(x) / widthRatio - canvasRect.left + 'px';
    domEl.style.top = parseFloat(y) / heightRatio + 'px';
    domEl.style.width = '20px';
    domEl.style.height = '20px';
    domEl.classList.remove('d-none');

  }

  const prevPopover = bootstrap.Popover.getInstance(domEl);
  if (prevPopover) {
    prevPopover.dispose();
  }

  // Determine the popover class for styling depending on the type
  let popoverClass;
  switch (type) {
    case 'success':
      popoverClass = 'success-subtle-popover';
      break;
    case 'error':
      popoverClass = 'error-popover';
      break;
    case 'warning':
      popoverClass = 'warning-subtle-popover';
      break;
    case 'response':
      popoverClass = 'primary-popover';
      break;
    default:
      popoverClass = 'info-subtle-popover';
  }

  // Add confirmation/cancellation buttons to the content if they should be shown
  const isResponse = type === 'response';
  const responseBtnHtml = `<div id="new-bounding-box-response-div" class="mt-1 d-flex justify-content-start align-items-center"><a role="button" class="btn btn-sm btn-secondary me-1 confirm-btn">Dismiss</a><a role="button" class="btn btn-sm btn-success dismiss-btn">Confirm</a></div>`

  // Create the Popover instance
  const popover = new bootstrap.Popover(domEl, {
    container: 'body',
    content: content + (isResponse ? responseBtnHtml : ''),
    placement: placement ?? 'top',
    title: title,
    customClass: customClass ?? popoverClass,
    trigger: 'manual',
    offset: offset ?? [0, 8],
    html: true
  });

  // Show the popover
  popover.show();

  // Hide the popover if user is not expected to interact with the popover
  if (!isResponse) {
    setTimeout(() => {
      popover.hide();
    }, hideTimeout ?? 3000);
  }
  
}

/**
 * 
 * @param {String} title Title of the modal
 * @param {String[]} messages Alert message array
 * @param {Boolean} hideConfirmBtn True if confirmation button must be hidden
 * @param {String} confirmBtnText Text for the confirmation button
 * @param {Boolean} hideCancelBtn True if cancellation button must be hidden
 * @param {String} cancelBtnText Text for the cancellation button
 * 
 */
function showAlertModal(title, messages, hideConfirmBtn, confirmBtnText, hideCancelBtn, cancelBtnText) {
  const modal = document.getElementById('alert-modal');
  const modalBootstrap = bootstrap.Modal.getOrCreateInstance(modal);
  const modalTitle = modal.querySelector('.modal-title'); 
  const modalBody = modal.querySelector('.modal-body');
  const confirmBtn = modal.querySelector('#alert-confirm-btn');
  const cancelBtn = modal.querySelector('#alert-cancel-btn');

  // Show cancel button by default
  cancelBtn.classList.remove('d-none');

  // Hide cancel and/or confirm button if necessary
  
  if (hideCancelBtn) {
    cancelBtn.classList.add('d-none');
  } else {
    cancelBtn.classList.remove('d-none');
  }

  if (hideConfirmBtn) {
    confirmBtn.classList.add('d-none');
  } else{
    confirmBtn.classList.remove('d-none');
  }

  // Default text for confirm button
  confirmBtn.textContent = confirmBtnText ? confirmBtnText : 'Continue';

  // Default text for cancel button
  cancelBtn.textContent = cancelBtnText ? cancelBtnText : 'Cancel';

  // Add the title
  modalTitle.textContent = title;

  // Reset modal's content
  modalBody.textContent = '';

  // Add a paragraph to modal body for each argument for message
  messages.forEach(message => {
    const paragraph = document.createElement('p');
    paragraph.innerHTML = message;
    modalBody.append(paragraph);

  });

  modalBootstrap.show();


}


/**
 * Hide the alert modal
 */
function hideAlertModal() {
  const modal = document.getElementById('alert-modal');
  const modalBootstrap = bootstrap.Modal.getOrCreateInstance(modal);
  modalBootstrap.hide();
}


/**
 * 
 * @param {*} videoDirPath 
 * @returns - Video file names without the extension
 */
function getVideoFilePaths(videoDirPath) {
  const files = fs.readdirSync(videoDirPath, (err, files) => {
    if (err) {
      console.error('Error reading directory:', err);
      return;
    }
  });

  // Filter files with the .mp4 extension (more to be added)
  const videoFiles = files.filter(file => path.extname(file).toLowerCase() === '.mp4');
  return videoFiles
}


/**
 * 
 * @param {*} minutesString - MM:SS
 * @returns - seconds in total
 */
function formatMinutes(minutesString) {
  const splitStrArray = minutesString.split(':');
  if (splitStrArray.length === 2) {
    const minutes = Number(splitStrArray[0]);
    const seconds = Number(splitStrArray[1]);

    return minutes * 60 + seconds; // return total time

  }

}

function minutesToFrames(minutesString, frameRate) {
  const splitStrArray = minutesString.split(':');
  if (splitStrArray.length === 2) {
    const minutes = Number(splitStrArray[0]);
    const seconds = Number(splitStrArray[1]);
    const totalSeconds = minutes * 60 + seconds;
    // Convert seconds to frame numbers
    return secondsToFrames(totalSeconds, frameRate)
  }

}

function secondsToFrames(seconds, frameRate = Player.getMainPlayer?.()?.getFrameRate?.()) {
  const parsedSeconds = parseFloat(seconds);
  if (!Number.isFinite(parsedSeconds)) return;

  const parsedFrameRate = parseFloat(frameRate ?? Player.getMainPlayer?.()?.getFrameRate?.());
  if (!Number.isFinite(parsedFrameRate)) return;

  const frames = Math.round(parsedSeconds * parsedFrameRate);
  return frames;
}

/**
 * Coverts frame number to seconds for a given frame rate
 * @param {Number | String} frames Frame number
 * @param {Number | String} frameRate Frame rate of the video
 * @returns {Number} Returns the result in seconds
 */
function framesToSeconds(frames, frameRate) {
  if (!frames) return;

  if (!Number.isSafeInteger(parseInt(frames))) return;

  if (!frameRate) {
    frameRate = Player.getMainPlayer().getFrameRate();
  }
  
  const seconds = parseInt(frames) / parseFloat(frameRate);
  return seconds;
  

}

/**
 * @param {*} secondsString
 * @returns - MM:SS
 */
function formatSeconds(secondsString) {
  const seconds = parseFloat(secondsString);
  let minutes = Math.floor(seconds / 60);
  let remainingSeconds = Math.floor(seconds % 60);

  // Add leading zero if needed
  minutes = (minutes < 10 ? '0' : '') + minutes;
  remainingSeconds = (remainingSeconds < 10 ? '0' : '') + remainingSeconds;

  // Return the formatted time
  return minutes + ':' + remainingSeconds;
}


function getFrameFromVideo(videoElement) {
  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;

  const context = canvas.getContext('2d');
  context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL();
}

async function createVideoDivs(domElRow, filePaths) {
  const numberOfVideos = filePaths.length;
  const columnClass = 'col-4';

  
  for (let i = 0; i < numberOfVideos; i++) {
    const fileName = await getFileNameWithoutExtension(filePaths[i])
    const videoColDiv = [
      `<div class="${columnClass} border rounded p-2">`,
        '<div class="d-flex justify-content-between">',
          `<small>${fileName}</small>`,
          '<btn class="btn btn-sm btn-player-frame">Main</btn>',
        '</div>',
        '<div class="position-relative">',
          `<video id="video-${i}" class="video-selection" width="320" height="180" src="${filePaths[i]}" preload="metadata">`,
            'Your browser does not support the video tag.',
          '</video>',         
          '<div class="video-spinner spinner-grow text-primary position-absolute start-50 bottom-50 d-none" role="status">',
            '<span class="visually-hidden">Loading...</span>',
          '</div>',
        '</div>',
      '</div>'
    ].join('')


    // Add this div to the secondary video row
    domElRow.innerHTML += videoColDiv;

  }

  return domElRow.querySelectorAll('video');


}

/**
 * Loads the secondary videos 
 * @param {String[]} videoSrcArr - Array of secondary video source paths
 */
async function loadSecondaryVideos(videoSrcArr) {

  if (!videoSrcArr) return;

  if (!Array.isArray(videoSrcArr) || videoSrcArr.length < 1) return;

  const openSecondaryVideosBtn = document.getElementById('open-secondary-videos-btn');
  if (!openSecondaryVideosBtn) return;

  const secondaryVideoRow = document.querySelector('#secondary-video-row');
  if (!secondaryVideoRow) return;

  // Filter video sources that are already opened
  let filteredArr = [];

  for (const videoSrc of videoSrcArr) {
    // Get the video file name to construct DOM IDs
    const videoFileName = await getFileNameWithoutExtension(videoSrc);
    if (!videoFileName) return;
    const isDuplicate = Player.getSecondaryPlayers().filter(player => player.getName() === videoFileName).length > 0;
    if (!isDuplicate) {
      filteredArr.push({src: videoSrc, name: videoFileName});
    }

  }


  if (filteredArr.length < 1) {
    showAlertToast('Selected videos already opened!', 'info');
    return;
  } 

  // Set the number of columns depending on the number of players
  const rowColsNumber = filteredArr.length === 1 ? 'row-cols-1' : 'row-cols-2';
  secondaryVideoRow.classList.add(rowColsNumber);
  
  // Get the button for changing column number
  const secondaryVidColSizeBtn = document.getElementById('secondary-video-colsize-btn');
  if (secondaryVidColSizeBtn) {
    const buttonIcon = secondaryVidColSizeBtn.querySelector('span');
    const tooltip = bootstrap.Tooltip.getOrCreateInstance(secondaryVidColSizeBtn);
    
    if (rowColsNumber === 'row-cols-1') {
      buttonIcon.textContent = 'grid_view'; // Change the icon to list view
      tooltip.setContent({ '.tooltip-inner': 'Grid view' }); // Change the tooltip
      buttonIcon.dataset.viewType = 'grid'; // Update dataset

    } else {
      buttonIcon.textContent = 'view_list' // Change the icon to list view
      tooltip.setContent({ '.tooltip-inner': 'List view' }); // Change the tooltip
      buttonIcon.dataset.viewType = 'list' // Update dataset
    }

  }



  // Create secondary video HTML divs
  // const secondaryVideoElList = await createSecondaryVideoDivs(videoSrcArr);\
  const filteredDomIdArr = [];
  for (const obj of filteredArr) {
    // Get the video name and source
    const videoName = obj.name;
    const videoSrc = obj.src;
    const domId = `video_${videoName}`;
    filteredDomIdArr.push(domId);

    // Construct the column HTML
    const videoColEl = document.createElement('div');
    videoColEl.classList.add('col');

    const videoContainerEl = document.createElement('div');
    videoContainerEl.classList.add('ratio', 'ratio-16x9', 'video-container');

    const spinnerEl = document.createElement('div');
    spinnerEl.classList.add('position-absolute', 'spinner-parent-div');

    const videoEl = document.createElement('video');
    videoEl.id = domId;
    videoEl.classList.add('secondary-video');
    videoEl.src = videoSrc;
    videoEl.textContent = 'Your browser does not support the video tag.';

    const buttonDivEl = document.createElement('div');
    buttonDivEl.classList.add('overlay', 'px-2');

    const videoTitleEl = document.createElement('small');
    videoTitleEl.classList.add('secondary-video-title');
    videoTitleEl.textContent = videoName;

    const disposeBtnEl = document.createElement('button');
    disposeBtnEl.type = 'button';
    disposeBtnEl.classList.add('btn', 'btn-sm', 'btn-icon-small', 'btn-dispose-player');

    const btnIconEl = document.createElement('span');
    btnIconEl.classList.add('material-symbols-rounded', 'dark');
    btnIconEl.textContent = 'close';

    disposeBtnEl.append(btnIconEl);
    buttonDivEl.append(videoTitleEl, disposeBtnEl);
    videoContainerEl.append(spinnerEl, videoEl, buttonDivEl)
    videoColEl.append(videoContainerEl);

    secondaryVideoRow.append(videoColEl);


    // const videoColDiv = [
    //   `<div class="col">`,
    //     '<div class="ratio ratio-16x9 video-container">',
    //       '<div class="position-absolute spinner-parent-div"></div>',
    //       `<video id="${domId}" class="secondary-video" src="${videoSrc}">`,
    //         'Your browser does not support the video tag.',
    //       '</video>',
    //       '<div class="overlay px-2">',
    //         // '<div class="d-flex justify-content-between">',
    //           `<small class="secondary-video-title">${videoName}</small>`,
    //           '<button type="button" class="btn btn-sm btn-icon-small btn-dispose-player">',
    //             '<span class="material-symbols-rounded dark">close</span>',
    //           '</button>',
    //         // '</div>',
    //       '</div>', 
    //     '</div>',
    //   '</div>'
    // ].join('');
    
  
    // // Add this div to the secondary video row
    // secondaryVideoRow.innerHTML += videoColDiv;

  }


  const videoElArr = filteredDomIdArr.map(domId => secondaryVideoRow.querySelector(`#${domId}`));

  if (videoElArr.length < 1) return;

  for (const videoEl of videoElArr) {
    
    const player = new Player(videoEl.id);
    player.setSource(videoEl.src);
    
    try {
      await player.load();
      player.mute();
      player.setCurrentTime(Player.getMainPlayer().getCurrentTime());
      player.setPlaybackRate(Player.getMainPlayer().getPlaybackRate());
      await player.setName();

      // // Set frame rate and dismiss button
      // player.on('loadeddata', async () => {
            
      //   // Set frame rate 
      //   await player.setFrameRate();

      //   // Dispose player if close button is clicked
      //   const playerColDiv = player.el.parentNode.parentNode;
      //   if (playerColDiv) {
      //     const disposeButton = playerColDiv.querySelector('.btn-dispose-player');
      //     if (disposeButton) {
      //       disposeButton.addEventListener('click', () => player.dispose());
      //     }
      //   }
    
      // });
      

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
      // videoEl.parentElement.parentElement.classList.add('d-none');
      videoEl.parentNode.parentNode.remove();
      Player.delete(player);
      return;
    }

    // videoEl.parentElement.parentElement.classList.remove('d-none');

  }

  // If there are valid videos, show grid view button and move button for opening videos to upper bar
  if (Player.getSecondaryPlayers().length > 0) {
    // Show the column sizing button
    const colSizeBtn = document.getElementById('secondary-video-colsize-btn');
    if (colSizeBtn) colSizeBtn.classList.remove('d-none');
  
    // Move the button for opening videos to the control bar above
    const openBtnDiv = document.querySelector('#secondary-videos-control-div .button-div')
    if (!openBtnDiv) return;
  
    openBtnDiv.prepend(openSecondaryVideosBtn);
    openSecondaryVideosBtn.classList.remove('mt-3');
    openSecondaryVideosBtn.classList.replace('btn-icon-large', 'btn-icon-small');
    
    // Hide the information text
    const infoTextEl = document.getElementById('secondary-video-info-text');
    if (infoTextEl) infoTextEl.classList.add('d-none');

    secondaryVideoRow.classList.remove('d-none');

  }
    


}


// async function createSecondaryVideoDivs(videoFilePaths) {
  
//   if (!videoFilePaths) return;

//   const numberOfVideos = videoFilePaths.length;
//   const secondaryVideoRow = document.querySelector('#secondary-video-row');

//   for (let i = 0; i < numberOfVideos; i++) {
    
//     const videoFileName = await getFileNameWithoutExtension(videoFilePaths[i]);
//     if (!videoFileName) return;
    
//     // Don't proceed if the the same video has already been opened
//     const domId = `video_${videoFileName}`;
//     const isDuplicate = Player.getSecondaryPlayers().filter(player => player.domId === domId).length > 0;
//     if (isDuplicate) return;
    
//     // Set the column size for each secondary player
//     const columnSize = "col";

//     // Construct the column HTML
//     const videoColDiv = [
//       `<div class="${columnSize}">`,
//         '<div class="ratio ratio-16x9 video-container">',
//           '<div class="position-absolute spinner-parent-div"></div>',
//           `<video id="${domId}" class="secondary-video" src="${videoFilePaths[i]}">`,
//             'Your browser does not support the video tag.',
//           '</video>',
//           '<div class="overlay px-2">',
//             // '<div class="d-flex justify-content-between">',
//               `<small class="secondary-video-title">${videoFileName}</small>`,
//               '<button type="button" class="btn btn-sm btn-icon-small btn-dispose-player">',
//                 '<span class="material-symbols-rounded dark">close</span>',
//               '</button>',
//             // '</div>',
//           '</div>', 
//         '</div>',
//       '</div>'
//     ].join('')

//     // Add this div to the secondary video row
//     secondaryVideoRow.innerHTML += videoColDiv;
  

//   }

//   return document.querySelectorAll('.secondary-video');
  
// }


async function getFileNameWithoutExtension(filePath) {
    const fileName = await window.electronAPI.getFileNameWithoutExtension(filePath);
    return fileName
  
}




function showOverlappingTracksToast(boxesUnderMouse) {
  const toastEl = document.getElementById('overlapping-tracks-toast');
  if (toastEl) {
    const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastEl);

    // Show choices for overlapping boxes
    const trackSelect = toastEl.querySelector('#overlapping-track-select');

    if (trackSelect) {

      // Clear previous options
      trackSelect.options.length = 0;
  
      // Add default object option
      const defaultOption = document.createElement("option");
      defaultOption.text = 'Choose a subject ID';
      defaultOption.selected = true;
      trackSelect.add(defaultOption);
  
      // Add objects on the current frame as options 
      boxesUnderMouse.forEach(rectangle => {
        // Check the validity of the rectangle
        const labelText = produceLabelText(rectangle);
        if (!labelText) return;
        const option = document.createElement("option");
        option.text = labelText;
        option.dataset.classId = rectangle['classId'];
        option.value = rectangle['trackId'];
        trackSelect.add(option);
      });
  
      toastBootstrap.show();
    }


  }
}

/**
 * Produce a label string from a bounding box object
 * @param {BoundingBox} bBox
 * @returns 
 */
function produceLabelText(bBox) {
  // Check the validity of the object
  if (!(bBox instanceof BoundingBox)) return;

  // Check if the class and track IDs are valid
  const classId = bBox.getClassId();
  const trackId = bBox.getTrackId();
  for (const idStr of [ classId, trackId ]) {
    if (typeof idStr === 'undefined' || idStr === null) return;
  }

  // Get the name order
  const nameOrder = bBox['nameOrder'] ? parseInt(bBox['nameOrder']) : undefined;
  
  // Start constructing label with class and track IDs
  let labelText = classId + '–' + trackId;
  
  // Add individual name if it exists
  const individualNames = Player.getIndividualNames();
  if (Array.isArray(individualNames) && Number.isSafeInteger(nameOrder)) {
    const subjectName = individualNames[nameOrder];
    if (subjectName) labelText += '–' + subjectName;
  }
  
  // Add class name if it exists
  const className = Player.getClassName(classId);
  if (className) {
    labelText +=  ' | ' + className;
  }

  return labelText;


}

/**
 * 
 * @param {Object} options 
 * @param {Event} options.event 
 * @param {BoundingBox} options.clickedBBox
 * @param {String | Number} options.timestamp 
 * @param {String | Number} options.frameNumber 
 * @returns 
 */
function showToastForBehaviorRecording (options) {
  // If this is a new observation (i.e. no subject and actions are selected)
    // Show the clicked subject and action options
    // Save the user choice to the Current Observation object
    // Listen for undo key and also show undo button
  // If this is not a new observation (i.e. subject and action are already selected)
    // Listen for user clicks on the whole video frame (to provide no target option) 
    // Show the clicked target option 
    // Show also no target option if user clicks outside of a tracking box
    // Listen for undo key and also show undo button
    // Update the current observation
    // Save the user choice to the Ethogram
  const { event, clickedBBox, timestamp, frameNumber } = options;

  // Check if toast element exists
  const toastEl = document.getElementById('labeling-toast');
  if (!toastEl) return;
  
  // Get the relevant DOM elements
  const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastEl);
  const trackingInfoEl = toastEl.querySelector('#tracking-info-text');
  const toastTitle = toastEl.querySelector('.toast-title');
  const toastAlert = toastEl.querySelector('#toast-alert');
  const behaviorTab = toastEl.querySelector('#behavior-toast-tab');
  const trackingTab = toastEl.querySelector('#tracking-toast-tab');
  const timeStampDiv = toastEl.querySelector('#toast-timestamp');
  const subjectSelect = toastEl.querySelector('#subject-select');
  const targetSelect = toastEl.querySelector('#target-select');
  const actionSelect = toastEl.querySelector('#action-select');
  const nameEditSelect = toastEl.querySelector('#name-edit-select');  // Selection for editing the individual name in a track
  const nameEditDiv = toastEl.querySelector('#name-edit-div');  // Input group div for name edit
  const classEditSelect = toastEl.querySelector('#class-edit-select');  // Selection for editing the class of a track
  const classEditDiv = toastEl.querySelector('#class-edit-div');  // Input group div for class edit
  const firstAvailTrackIdInputEl = toastEl.querySelector('#next-unused-track-id');
  const behaviorRecordBtn = toastEl.querySelector('#label-save-btn');

  // Check if DOM elements within the toast exist
  if (!subjectSelect || !actionSelect || !targetSelect || !nameEditSelect ||
      !nameEditDiv || !classEditSelect || !classEditDiv || !behaviorRecordBtn || 
      !behaviorTab || !trackingTab
  ) return;

  // Fill the timestamp element with the time of the start of the current observation
  timeStampDiv.textContent = formatSeconds(timestamp);

  // Add a title 
  // TODO: Add observation ID to the title
  if (toastTitle) toastTitle.textContent = 'Observation'

  const classMap = Player.getClassMap();
  if (!classMap || !(classMap instanceof Map)) return;

  // Show track information on the tracking tab
  if (trackingInfoEl) {
    trackingInfoEl.textContent = 'Selection: ' + produceLabelText(clickedBBox);
  }

  // Get the actions and individuals
  const actionNames = Player.getActionNames();
  const individualNames = Player.getIndividualNames();

  // Determine if any action is imported
  const anyAction = Array.isArray(actionNames) && actionNames.length > 0;

  // Hide the toast alert by default
  toastAlert.classList.add('d-none');

  // Fill elements for editing names of clicked bounding boxes
  // Hide and disable name edit selection by default 
  // activate only if tracking box contains a name
  nameEditDiv.classList.add('d-none');
  nameEditSelect.disabled = true;
  
  // Make the div for selection visible
  nameEditDiv.classList.remove('d-none');

  // Enable name select element
  nameEditSelect.disabled = false;

  // Clear previous options
  nameEditSelect.options.length = 0;
  classEditSelect.options.length = 0;
      
  // Add all individual names to the options for editing tracks
  individualNames?.forEach?.(name => {
    const option = document.createElement('option');
    option.text = name; 
    option.value = individualNames.indexOf(name); // Order of name in the individual list file
    option.dataset.trackId = clickedBBox.trackId;
    option.dataset.classId = clickedBBox.classId;
    option.dataset.nameOrder = individualNames.indexOf(name);
    nameEditSelect.add(option);
  }); 

  // Add all class names to the options for editing tracks
  classMap.values().forEach(classObj => {
    const classId = classObj.id;
    if (!classId) return;
    
    const className = classObj.name;
    const option = document.createElement('option');
    option.text = className ? classId + '–' + className : classId;  // Display the class name if available 
    option.value = classId; // Order of name in the individual list file
    option.dataset.trackId = clickedBBox.trackId;  // Add track ID to dataset
    option.dataset.classId = clickedBBox.classId;  // Add class ID to dataset
    classEditSelect.add(option);
  });

  // Change the title for name edit div depending on existence of a name for the clicked individual
  // Check if clicked rectangle includes an individual name 
  if (Number.isSafeInteger(clickedBBox.getNameOrder())) {

    // Change the title 
    nameEditDiv.querySelector('.description').textContent = 'Change name';
    
  // If clicked rectangle has no individual name assigned by the model, show an option to add it
  } else {

    // Change the title 
    nameEditDiv.querySelector('.description').textContent = 'Add name';
  }

  // Check if main player is initialized
  const mainPlayer = Player.getMainPlayer();
  if (!mainPlayer) return;

  // Assign the value for the first available track ID input element
  if (firstAvailTrackIdInputEl) {
    // const firstAvailTrackId = mainPlayer.getFirstAvailTrackIds().get(clickedBBox.classId);
    const firstAvailTrackId = Player.getFirstAvailTrackId(clickedBBox.classId);
    if (typeof firstAvailTrackId !== 'undefined') {
      firstAvailTrackIdInputEl.value = firstAvailTrackId;
    }
  }

  // Check if current observation is initialized
  const currentObs = Player.getCurrentObservation();
  if (!currentObs) return;

  // Check if the behaviors are initialized
  const ethogram = mainPlayer.getEthogram();
  if (!ethogram) {
    console.log('No record of behaviors was found!'); 
    return;
  }

  // Save information about clicked rectangle
  toastEl.dataset.clickedTrackId = clickedBBox.trackId;
  toastEl.dataset.clickedClassId = clickedBBox.classId;
  toastEl.dataset.timestamp = timestamp;
  toastEl.dataset.frameNumber = frameNumber;
  toastEl.dataset.clickedNameOrder  = 'none'; // Assign none to clickedNameOrder by default

  if (clickedBBox.hasOwnProperty('nameOrder')) {
    toastEl.dataset.clickedNameOrder = clickedBBox.nameOrder; // If clicked rectangle has a name assigned to the model or user before, use it
  }

  // Get the undo Hotkey
  const undoHotkey = Hotkey.findOne({category: 'labeling', name: 'undo'});

  /**
   * Forces user to add names to unidentified tracks before recording an observation
   * @param {String | undefined} trackSpecies Which class to apply. Applies to all class by default. Can be "box", "primate".
   * @returns {Boolean} True if popover has been shown, False otherwise
   */
  function showPopoverForUnnamedTrack(trackSpecies) {

    // Determine if the clicked track is identified as a box
    const isBoxClicked = Player.getClassName(clickedBBox.classId) === 'box';

    // Return if the input class and clicked class do not match - i.e. do not show a popover
    if (trackSpecies) {

      if (trackSpecies.toLowerCase() === 'box' && !isBoxClicked) {
        return;
      }

      if (trackSpecies.toLowerCase() === 'primate' && isBoxClicked) {
        return;
      }

    } 

    if (!clickedBBox.hasOwnProperty('nameOrder')) {

      // Get the canvas element
      const canvas = mainPlayer.getCanvas();
      if (!canvas) return;
      
      // Get the mouse position
      const canvasRect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - canvasRect.left;
      const mouseY = event.clientY - canvasRect.top;
      
      // Show a popover over the unnamed tracking box
      const popoverDivEl = document.getElementById('popover-canvas-div');
      if (popoverDivEl) {
        popoverDivEl.style.left = mouseX + 'px';
        popoverDivEl.style.top = mouseY + 'px';
        popoverDivEl.style.width = '20px';
        popoverDivEl.style.height = '20px';
        popoverDivEl.classList.remove('d-none');

      }

      const popover = new bootstrap.Popover(popoverDivEl, {
        container: 'body',
        content: 'Assign a name to proceed!',
      });

      popover.show();

      return true;

    }

    return false;

  }

  // Get the observation status - whether this is a new observation (i.e. no subject and actions are selected)
  const isNewObs = (!currentObs.subjectName || !Number.isSafeInteger(parseInt(currentObs.subjectId)));

  // ==================================
  // 1. Show options for subject and action
  // ==================================
  // Check if this is a new observation (i.e. no subject and actions are selected)
  const boxesInFrame = Player.getBoxesInFrame();
    
  if (isNewObs) {

    // Change the text of the behavior recording button 
    behaviorRecordBtn.textContent = 'Mark start';

    // Force user to add a name to unnamed track to choose it as the subject - valid even if it is a "box"
    if (showPopoverForUnnamedTrack('all')) return;

    // Hide the alert the if the selection is a primate
    toastAlert.classList.add('d-none'); 

    // Warn users if they choose a box as the subject
    const className = Player.getClassName(clickedBBox.classId);
    // const isBoxClicked = speciesName ? speciesName === 'box' : false;
    // if (isBoxClicked) {
    //   toastAlert.textContent = "Selected subject is identified as a box!";
    //   toastAlert.classList.remove('d-none');
    // }

    // Enable subject select element
    subjectSelect.disabled = false;

    // Clear previous options
    subjectSelect.options.length = 0;
    
    // Add default label option
    const defaultSubjectOption = document.createElement('option');
    defaultSubjectOption.text = 'Choose a subject';
    defaultSubjectOption.selected = true;
    subjectSelect.add(defaultSubjectOption);
  
    // Add all label options
    boxesInFrame.forEach(bBox => { 
      if (!(bBox instanceof BoundingBox)) return;

      // Get the IDs
      const trackId = bBox.getTrackId?.();
      const classId = bBox.getClassId?.();

      // Validate the IDs
      for (const idStr of [ trackId, classId ]) {
        if (typeof idStr === 'undefined' || idStr === null) return;
      }

      // Create the option DOM element
      const option = document.createElement('option');
      option.text = produceLabelText(bBox);
      option.value = trackId;
      option.dataset.classId = classId;
      
      // Add subject name if it exists
      const nameOrder = bBox.getNameOrder?.();
      if (Number.isSafeInteger(nameOrder)) {
        option.dataset.nameOrder = nameOrder; 
      }
      
      // Add option element to the list
      subjectSelect.add(option);

      // Make the clicked object default option
      if (clickedBBox.getTrackId() === trackId && clickedBBox.getClassId() === classId) {
        option.selected = true; 
      }

    });

    // Show options for all actions
    // Enable action select element
    actionSelect.disabled = false;

    // Clear previous options
    actionSelect.options.length = 0;

    // Add default label option
    const defaultLabelOption = document.createElement('option');
    defaultLabelOption.text = 'Choose an action';
    defaultLabelOption.selected = true;
    actionSelect.add(defaultLabelOption);

    // Add all action options
    actionNames?.forEach?.(action => { 
      const option = document.createElement('option');
      option.text = action;
      option.value = action;
      actionSelect.add(option);
    });


    // Hide target selection input group div 
    // Target selection will be shown to the user in the last step when user chooses the ending frame of the observation
    targetSelect.parentElement.classList.add('d-none');

  // ==================================
  // 2. Show options for target
  // ==================================
  // If this is an observation in progress (i.e. subject and action are already selected)
  // show the options for target selection
  } else {

    // Reset the button text for marking the start
    behaviorRecordBtn.textContent = 'Mark end'

    // Force user to name an unnamed track ONLY if it is a "primate"
    if (showPopoverForUnnamedTrack('primate')) return;

    // Check if ending frame is later than the starting frame
    if (mainPlayer.getCurrentFrame() < parseInt(currentObs.startFrame)) {
      showAlertToast('End frame must be greater than start frame!', 'error', 'Invalid End Frame');
      return;
    }
    
    // Clear previous options
    targetSelect.options.length = 0;

      // Add default object option
    const defaultObjectOption = document.createElement('option');
    defaultObjectOption.text = 'Choose a target ID';
    defaultObjectOption.selected = true;
    targetSelect.add(defaultObjectOption);

    // TODO: SHOW NAME instead of TRACK ID if it exists!!
  
    // Add target on the current frame as options 
    boxesInFrame.forEach(bBox => {
      if (!(bBox instanceof BoundingBox)) return;

      // Get the IDs
      const trackId = bBox.getTrackId?.();
      const classId = bBox.getClassId?.();

      // Validate the IDs
      for (const idStr of [ trackId, classId ]) {
        if (typeof idStr === 'undefined' || idStr === null) return;
      }

      // Create the DOM option element
      const option = document.createElement('option');
      option.text = produceLabelText(bBox);
      option.value = trackId;
      option.dataset.classId = classId;

      // Add target name if it exists
      const nameOrder = bBox.getNameOrder?.();
      if (Number.isSafeInteger(nameOrder)) {
        option.dataset.nameOrder = nameOrder; 
      }

      // Add option element to the list
      targetSelect.add(option);

      // Make the clicked target default option
      if (clickedBBox.getTrackId?.() === trackId && clickedBBox.getClassId?.() === classId) {
        option.selected = true;
      }

    });

    // Show object selection input group element
    targetSelect.parentElement.classList.remove('d-none');

  }

  // Get the tab panes containing the tab data
  const behaviorTabPane = toastEl.querySelector(behaviorTab.dataset.bsTarget);
  const trackingTabPane = toastEl.querySelector(trackingTab.dataset.bsTarget);
  
  // Get the popover to show info when labeling is disabled
  const infoPopover = bootstrap.Popover.getOrCreateInstance(behaviorTab.parentElement);

  // If actions are imported enable labeling. Otherwise, disable the behavior tab.
  if (anyAction) {
    behaviorTab.classList.remove('disabled');
    trackingTab.classList.remove('active');
    behaviorTab.classList.add('active');
    trackingTabPane?.classList?.remove?.('show', 'active');
    behaviorTabPane?.classList?.add?.('show', 'active');
    infoPopover.disable();
    Player.enableLabeling();
  } else {
    // If no action is imported, disable the behavior tab and labeling.
    behaviorTab.classList.add('disabled');
    behaviorTab.classList.remove('active');
    trackingTab.classList.add('active');
    behaviorTabPane?.classList?.remove?.('show', 'active');
    trackingTabPane?.classList?.add?.('show', 'active');
    infoPopover.enable();
    Player.disableLabeling(); 

  }

  toastBootstrap.show();



  

}


/**
 * Update tracking table from dropdown menu opened with right clicking on bounding boxes
 * @returns 
 */
async function updateTracksFromNameDropdown() {
  // Show loading indicator
  showProcessIndicator();
    
  // Get the tracking table
  const trackingTable = document.getElementById('tracking-table');

  const mainPlayer = Player.getMainPlayer();
  if (!mainPlayer) {
    console.log('No video has been opened yet!');
    hideProcessIndicator();
    return;
  }

  const rightClickDiv = document.getElementById('right-click-canvas-div');
  const nameEditSelect = rightClickDiv.querySelector('select');

  if (!rightClickDiv || !nameEditSelect) {
    hideProcessIndicator();
    return;
  }

  // Get the selected option 
  const selectedOption = nameEditSelect.options[nameEditSelect.selectedIndex];

  // If default option is selected warn user
  if (selectedOption.index == 0) {
    showPopover({
      domEl: nameEditSelect,
      content: 'Please select a name!',
      customClass: 'error-popover',
      title: 'No option selected'
    });
    hideProcessIndicator();
    return;
  } 

  // Get the clicked rectangle info from div dataset
  const oldClassId = parseInt(rightClickDiv.dataset.clickedClassId);
  const oldTrackId = parseInt(rightClickDiv.dataset.clickedTrackId);
  const frameNumber = parseInt(rightClickDiv.dataset.frameNumber);
  
  // Name order of track in the individual name list
  let oldNameOrder = null;
  if ("clickedNameOrder" in rightClickDiv.dataset) {
    oldNameOrder = parseInt(rightClickDiv.dataset.clickedNameOrder); 
  }

  // Which frames to apply
  const applyForValue = 'all';

  // Object for a row in tracking edit table
  let rowArgs = {
    'timeStart': null, 
    'timeEnd': null,
    'frameNumber': frameNumber, 
    'oldTrackId': oldTrackId,
    'newTrackId': null,
    'oldNameOrder': oldNameOrder,
    'newNameOrder': null,
    'oldClassId': oldClassId,
    'newClassId': null,
    'applyFor': applyForValue,
    
  }

  // Get the tracking dict to save user edits on tracks
  const trackingMap = Player.getMainPlayer()?.getTrackingMap();
  // console.log('Tracking map inside dropdown helper:', trackingMap)

  // Quit if no tracking file exists
  if (!trackingMap || trackingMap.isEmpty()) {
    console.log('No tracking object could be found!');
    hideProcessIndicator();
    showAlertToast(
      'Unable to access tracking data! Please try again.', 
      'error', 
      'Failed to Save Changes'
    );
    return;
  }

  

  // Get video duration to find the end frame number
  const videoDuration = Player.getMainPlayer()?.getDuration();
  
  // Update rowArgs
  rowArgs.timeEnd = secondsToFrames(videoDuration);
  rowArgs.timeStart = 0;
  rowArgs.newNameOrder = parseInt(selectedOption.dataset.nameOrder);
  rowArgs.newTrackId = parseInt(selectedOption.dataset.trackId);
  rowArgs.editType = 'newName';

  // Update the tracking table
  if (trackingTable) {
    // Get the table body
    const tableBody = trackingTable.querySelector('tbody');

    // Check if table was empty before
    const infoRow = tableBody.querySelector('.empty-table-info');
    if (infoRow) {
      // Hide info row before adding new rows
      // infoRow.classList.add('d-none');
      infoRow.remove();
    }

    // Add a new row to tracking table
    const newRow = tableBody.insertRow(0);
    
    // Add cells to this new row
    const typeCell = newRow.insertCell(0);
    const oldIdCell = newRow.insertCell(1);
    const newIdCell = newRow.insertCell(2);
    const timeStartCell = newRow.insertCell(3);
    const timeEndCell = newRow.insertCell(4);
    // const buttonCell = newRow.insertCell(5);

    typeCell.classList.add('edit-type');
    oldIdCell.classList.add('old-id');
    newIdCell.classList.add('new-id');
    timeStartCell.classList.add('edit-start', 'time-cell');
    timeEndCell.classList.add('edit-end', 'time-cell');

    // const tableLength = trackingTable.rows.length;

    // Add data attributes to return to timestamp in the row when it is clicked
    // newRow.setAttribute('data-frame-number', frameNumber);
    const currentSeconds = Player.getMainPlayer().getCurrentTime();
    newRow.setAttribute('data-timestamp-start', currentSeconds); 

    // Populate the cells
    timeStartCell.textContent = frameNumber;

    // Produce text for old Id (only class + track ID by default)
    let oldIdCellText = `${rowArgs.oldClassId}-${rowArgs.oldTrackId}`;
    
    // Add the individual name if available
    const individualNames = Player.getIndividualNames();
    if (Number.isInteger(rowArgs.oldNameOrder) && individualNames) {
      oldIdCellText += '-' + individualNames[rowArgs.oldNameOrder];
    }
    oldIdCell.textContent = oldIdCellText;
  
    // Get video duration to find the end frame number
    // const videoDuration = Player.getMainPlayer().getDuration();

    // Get the selected time format (frames or seconds)
    let timeFormat = 'frames';
    const trackingTimeFormatBtn = document.querySelector('.time-format-btn');
    if (trackingTimeFormatBtn) {
      timeFormat = trackingTimeFormatBtn.dataset.timeFormat;
    }

    // Change the text content of time depending on the current format
    let videoDurationText, currentFrameText, zeroSecondText;
    if (timeFormat === 'frames') {
      videoDurationText = secondsToFrames(videoDuration);
      currentFrameText = frameNumber;
      zeroSecondText = 0;
    } else if (timeFormat === 'seconds') {
      videoDurationText = formatSeconds(videoDuration);
      currentFrameText = formatSeconds(framesToSeconds(frameNumber));
      zeroSecondText = formatSeconds(0);
    }

    // // Update rowArgs
    // rowArgs.timeEnd = secondsToFrames(videoDuration);
    // rowArgs.timeStart = 0;
    // rowArgs.newNameOrder = parseInt(selectedOption.dataset.nameOrder);
    // rowArgs.newTrackId = parseInt(selectedOption.dataset.trackId);
    // rowArgs.editType = 'newName';

    // Fill the new tracking table row and cells within it
    timeStartCell.textContent = zeroSecondText;
    timeEndCell.textContent = videoDurationText;
    timeEndCell.setAttribute('data-frame-number', secondsToFrames(videoDuration));
    timeStartCell.setAttribute('data-frame-number', 0);
    typeCell.textContent = 'new-name';
    newRow.setAttribute('data-edit-start-frame', 0); 
    newRow.setAttribute('data-edit-end-frame', secondsToFrames(videoDuration)); 
    const newName = individualNames[rowArgs.newNameOrder];
    newIdCell.textContent = `${rowArgs.oldClassId}-${rowArgs.newTrackId}-${newName}`

  }
  

  // Get the ID Map 
  // where key: classNumber, value: Map{key: trackId, value: trackIdxArr}
  // const idMap = trackingMap.getIdMap();
  // if (!idMap || !(idMap instanceof Map)) return;

  // Get the master array of tracks
  const masterArr = trackingMap.getTracks();
  if (!masterArr || !Array.isArray(masterArr)) {
    // Hide the right click menu 
    rightClickDiv.classList.add('d-none');
    hideProcessIndicator();
    showAlertToast('Unable to access tracking data! Please try again.', 'error', 'Failed to Save Changes')
    return;
  }

  // Get the frame Map 
  // where keys are frame numbers and values are indices of track objects in the master track array
  // const frameMap = trackingMap.getFrameMap();
  // if (!frameMap || !(frameMap instanceof Map)) {
  //    // Hide the right click menu 
  //   rightClickDiv.classList.add('d-none');
  //   hideProcessIndicator();
  //   showAlertToast('Unable to access tracking data! Please try again.', 'error', 'Failed to Save Changes')
  //   return;
  // }

  // Filter entries according to user choice for edit time span (i.e. start frame to end frame)
  // const filteredFrameNumbers = Array.from(frameMap.keys())
  //   .filter(frameNumber => frameNumber >= rowArgs.timeStart && frameNumber <= rowArgs.timeEnd);
  // const filteredFrameCount = filteredFrameNumbers.length;

  // Keep track of (frameNumber, trackInfoArr) pairs before changes by user to undo changes later
  // let oldFramesArr = [];

  // Count the tracks for which the changes are applied
  let trackCount = 0;

  // Get the indices of master track array from the id Map
  const idxArr = trackingMap.getIndices({
    classId: rowArgs.oldClassId, 
    trackId: rowArgs.oldTrackId
  });

  if (!idxArr) {
    showAlertToast('Please try again!', 'error', 'Failed to Edit Tracks');
    rightClickDiv.classList.add('d-none');
    hideProcessIndicator();
    return;
  }

  idxArr.forEach(idx => {
    const trackObj = masterArr[idx];
    if (trackObj && 
      trackObj['trackNumber'] >= rowArgs.timeStart && 
      trackObj['trackNumber'] <= rowArgs.timeEnd
    ) {
      // Use the name order (integer) of the selected new name
      trackObj['nameOrder'] = rowArgs.newNameOrder; 

      // Put the confidence id as 1 after user corrects the name
      trackObj['confidenceId'] = 1.0; 

      // Increment the edited track count
      trackCount++;
    
    }

  });

  // Show changes on canvas by modifying tracking dict on Player component
  // filteredFrameNumbers.forEach(frameNum => {
  //   // Get the indices for 
  //   const trackIdxArr = frameMap.get(frameNum);

  //   // Iterate over tracks in each filtered frame
  //   trackArr.forEach((trackInfo, index) => {

  //     // Check for tracks with targeted track IDs and class
  //     if (trackInfo['trackId'] === rowArgs.oldTrackId && trackInfo['classId'] === rowArgs.oldClassId) {
        
  //       // Add old (key, value) pair in tracking map to history array (to undo the change later)
  //       // const oldTrackInfoArr = JSON.parse(JSON.stringify(trackArr)); // Create a deep copy to loose any reference to original array

  //       // const oldFrameObj = {frameNumber: frameNum, trackInfoArr: oldTrackInfoArr};
  //       // oldFramesArr.push(oldFrameObj);
            
  //       // Create a deep copy to loose any reference to original array
  //       const newTrackInfoArr = JSON.parse(JSON.stringify(trackArr));

  //       // Use the name order (integer) of the selected new name
  //       newTrackInfoArr[index]['nameOrder'] = rowArgs.newNameOrder; 

  //       // Put the confidence id as 1 after user corrects the name
  //       newTrackInfoArr[index]['confidenceId'] = 1.0; 

  //       // Update the tracking map
  //       trackingMap.set(frameNum, newTrackInfoArr);

  //     }
      

  //   });


    
  // })
  
  // Add all edited frames to history with their properties prior to edits
  // if (oldFramesArr.length > 0) {
  //   trackingMap.addToHistory(oldFramesArr); 
  // }

  // Save tracking edits to file
  const response = await trackingMap.saveEditsToFile();
  if (!response) {
    showAlertToast('Please try again!', 'error', 'Failed to Save Tracking Changes');
    rightClickDiv.classList.add('d-none');
    hideProcessIndicator();
    return;
  }

  if (trackCount > 0) {
    const frameText = trackCount === 1 ? 'track' : 'tracks';
    showAlertToast(`Changes applied for <strong>${trackCount}</strong> ${frameText}`, 'success', 'Tracking Changes Saved');

  }
  
  // If saving successful, refresh tracking boxes on canvas
  mainPlayer.displayTrackingBoxes();

  // Hide the right click menu 
  rightClickDiv.classList.add('d-none');
  hideProcessIndicator();

}

/**
 * Update tracking table from toast menu
 * @returns 
 */
function updateTracksFromToast() {
  showProcessIndicator();
  
  // Get the DOM elements
  const trackingTable = document.getElementById('tracking-table');
  const toast = document.getElementById('labeling-toast');
  const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toast);
  const trackEditSelectEl = document.querySelector("input[name=track-edit-options]:checked");
  const applyForSelect = document.querySelector("input[name=apply-for-selection]:checked");
  const manualNewIdInputEl = toast.querySelector('#manual-new-id');
  // const toastAlert = toast.querySelector('#toast-alert');
  // const behaviorTab = toast.querySelector('#behavior-toast-tab');
  
  // Get the main canvas for showing popover next to it
  const mainCanvas = Player.getMainCanvas();

  // Verify user selection
  if (!trackEditSelectEl) {
    hideProcessIndicator();
    showPopover({
      domEl: toast,
      title: 'Empty Selection',
      content: 'Please select an option!',
      placement: 'right',
      type: 'error'
    });
    return;
  }

  // Get the tracking dict to save user edits on tracks
  const trackingMap = Player.getMainPlayer()?.getTrackingMap();

  // Quit if no tracking file exists
  if (!trackingMap || trackingMap.isEmpty()) {
    hideProcessIndicator();
    showAlertToast(
      'Unable to access tracking data! Please try again.', 
      'error', 
      'Failed to Save Changes'
    );
    return;
  }

  // Get user selection 
  const selectedOption = trackEditSelectEl.value;
  const currentSeconds = Player.getMainPlayer()?.getCurrentTime();
  const frameNumber = parseInt(toast.dataset.frameNumber);
  const oldClassId = parseInt(toast.dataset.clickedClassId);
  const oldTrackId = parseInt(toast.dataset.clickedTrackId);

  // Name order of track in the individual name list
  let oldNameOrder = null;
  if ("clickedNameOrder" in toast.dataset) {
    oldNameOrder = parseInt(toast.dataset.clickedNameOrder); 
  }

  // Which frames to apply
  const applyForValue = applyForSelect.value;

  // Object for a row in tracking edit table
  let rowArgs = {
    'timeStart': null, 
    'timeEnd': null,
    'frameNumber': frameNumber, 
    'oldTrackId': oldTrackId,
    'newTrackId': null,
    'oldNameOrder': oldNameOrder,
    'newNameOrder': null,
    'oldClassId': oldClassId,
    'newClassId': null,
    'applyFor': applyForValue,
    
  }

  // Validate manual new id input
  if (selectedOption === 'manual-new-id') {
    // Reject invalid input
    if (!manualNewIdInputEl.value) {
      showPopover({
        domEl: manualNewIdInputEl,
        title: 'Empty Input',
        content: 'Please enter a valid track ID!',
        placement: 'right',
        offset: [0, 25],
        type: 'error'
      });
      hideProcessIndicator();
      return;
    }
  }
    

  // Get the individual names
  const individualNames = Player.getIndividualNames();

  // Get video duration to find the end frame number
  const videoDuration = Player.getMainPlayer()?.getDuration();

  // If "after-current" is selected, assign video duration for end of edit timestamp
  if (applyForValue === 'after-current') {
    rowArgs.timeEnd = secondsToFrames(videoDuration);
    rowArgs.timeStart = frameNumber;
    
  } else if (applyForValue === 'only-current') {
    rowArgs.timeEnd = frameNumber;
    rowArgs.timeStart = frameNumber;

  } else if (applyForValue === 'all') {
    rowArgs.timeEnd = secondsToFrames(videoDuration);
    console.log('timeEnd', rowArgs.timeEnd)

    rowArgs.timeStart = 0;

  }

  // Update tracking table
  if (trackingTable) {
    // Get the table body
    const tableBody = trackingTable.querySelector('tbody');
    
    // Check if table was empty before
    const infoRow = tableBody.querySelector('.empty-table-info');
    if (infoRow) {
      infoRow.remove();
    }
  
    // Add a new row to tracking table
    const newRow = tableBody.insertRow(0);
    
    // Add cells to this new row
    const typeCell = newRow.insertCell(0);
    const oldIdCell = newRow.insertCell(1);
    const newIdCell = newRow.insertCell(2);
    const timeStartCell = newRow.insertCell(3);
    const timeEndCell = newRow.insertCell(4);
    // const buttonCell = newRow.insertCell(5);

    typeCell.classList.add('edit-type');
    oldIdCell.classList.add('old-id');
    newIdCell.classList.add('new-id');
    timeStartCell.classList.add('edit-start', 'time-cell');
    timeEndCell.classList.add('edit-end', 'time-cell');
    
    // const tableLength = trackingTable.rows.length;

    // Add data attributes to return to timestamp in the row when it is clicked
    // newRow.setAttribute('data-frame-number', frameNumber);
    newRow.setAttribute('data-timestamp-start', currentSeconds); 

    // Populate the cells
    timeStartCell.textContent = frameNumber;
    
    // Produce text for old Id (only class + track ID by default)
    let oldIdCellText = `${rowArgs.Id}-${rowArgs.oldTrackId}`;
    
    // Add the individual name if available
    // const individualNames = Player.getIndividualNames();
    if (Number.isInteger(rowArgs.oldNameOrder) && individualNames) {
      oldIdCellText += '-' + individualNames[rowArgs.oldNameOrder];
    }
    oldIdCell.textContent = oldIdCellText;
  
    // Get video duration to find the end frame number
    // const videoDuration = Player.getMainPlayer().getDuration();

    // Get the selected time format (frames or seconds)
    let timeFormat = 'frames';
    const trackingTimeFormatBtn = document.querySelector('.time-format-btn');
    if (trackingTimeFormatBtn) {
      timeFormat = trackingTimeFormatBtn.dataset.timeFormat;
    }
    
    // Change the text content of time depending on the current format
      let videoDurationText;
      let currentFrameText;
      let zeroSecondText;
      if (timeFormat === 'frames') {
        videoDurationText = secondsToFrames(videoDuration);
        currentFrameText = frameNumber;
        zeroSecondText = 0;
      } else if (timeFormat === 'seconds') {
        videoDurationText = formatSeconds(videoDuration);
        currentFrameText = formatSeconds(framesToSeconds(frameNumber));
        zeroSecondText = formatSeconds(0);
      }
      
      // If "after-current" is selected, assign video duration for end of edit timestamp
      if (applyForValue === 'after-current') {
        timeStartCell.textContent = currentFrameText;
        timeEndCell.textContent = videoDurationText;
        timeStartCell.setAttribute('data-frame-number', frameNumber);
        timeEndCell.setAttribute('data-frame-number', secondsToFrames(videoDuration));
        // rowArgs.timeEnd = secondsToFrames(videoDuration);
        // rowArgs.timeStart = frameNumber;
        newRow.setAttribute('data-edit-start-frame', frameNumber); 
        newRow.setAttribute('data-edit-end-frame', secondsToFrames(videoDuration)) ;
        
      } else if (applyForValue === 'only-current') {
        timeStartCell.textContent = currentFrameText;
        timeEndCell.textContent = currentFrameText;
        timeEndCell.setAttribute('data-frame-number', frameNumber);
        timeStartCell.setAttribute('data-frame-number', frameNumber);
        // rowArgs.timeEnd = frameNumber;
        // rowArgs.timeStart = frameNumber;
        newRow.setAttribute('data-edit-start-frame', frameNumber); 
        newRow.setAttribute('data-edit-end-frame', frameNumber) 
      } else if (applyForValue === 'all') {
        timeStartCell.textContent = zeroSecondText;
        timeEndCell.textContent = videoDurationText;
        timeEndCell.setAttribute('data-frame-number', secondsToFrames(videoDuration));
        timeStartCell.setAttribute('data-frame-number', 0);
        // rowArgs.timeEnd = secondsToFrames(videoDuration);
        // rowArgs.timeStart = 0;
        newRow.setAttribute('data-edit-start-frame', 0); 
        newRow.setAttribute('data-edit-end-frame', secondsToFrames(videoDuration)); 
  
      }

    }
    
  
    // const firstAvailTrackId = parseInt(document.getElementById('next-unused-track-id').value);
    // let firstAvailTrackIdMap = Player.getMainPlayer().getFirstAvailTrackIds();
    const firstAvailTrackId = Player.getFirstAvailTrackId(rowArgs.oldClassId);
    
    // Process selection depending on edit type (remove track, auto new ID, manual new id)
    if (selectedOption === 'remove') {
      rowArgs.editType = 'remove';
      rowArgs.newTrackId = 'REMOVED';
    
    } else if (selectedOption === 'auto-new-id') {
      rowArgs.editType = 'autoNewId';
      rowArgs.newTrackId = firstAvailTrackId;
    
    } else if (selectedOption === 'new-class')  {

      // Get the class select element
      const classEditSelect = toast.querySelector('#class-edit-select');
      
      // Show error if select element is missing
      if (!classEditSelect) {
        showPopover({
          domEl: toast,
          title: 'Missing HTML Element',
          content: 'HTML element for selected option could not be found. Please try again!',
          type: 'error',
          placement: 'right'
        });
        hideProcessIndicator();
        return;
      }
      
      // Get the selected option for class and save it for later use
      const selectedOption = classEditSelect.options[classEditSelect.selectedIndex];

      // Check if the classId attribute exists on the option element
      if (!selectedOption.hasAttribute('data-class-id')) {
        showPopover({
          domEl: toast,
          title: 'Missing HTML Attribute',
          content: 'HTML attribute for selected option could not be found. Please try again!',
          type: 'error',
          placement: 'right'
        });
        hideProcessIndicator();
        return;
      }

      // Save the selected option attributes
      rowArgs.editType = 'new-class';
      rowArgs.newClassId = parseInt(selectedOption.value); 

    } else if (selectedOption === 'manual-new-id')  {
      rowArgs.editType = 'manual';
      rowArgs.newTrackId = parseInt(manualNewIdInputEl.value);

    } else if (selectedOption === 'new-name') {
      const nameEditSelect = toast.querySelector('#name-edit-select');

      // Show error if name select element does not exist
      if (!nameEditSelect) {
        showPopover({
          domEl: toast,
          title: 'Missing HTML Element',
          content: 'HTML element for selected option could not be found. Please try again!',
          type: 'error',
          placement: 'right'
        });
        hideProcessIndicator();
        return;
      }

      // Show error if individual names 
      if (!individualNames) {
        showPopover({
          domEl: toast,
          title: 'Missing Names of Subjects',
          content: 'Please import names for subjects to proceed!',
          type: 'error',
          placement: 'right'
        });
        hideProcessIndicator();
        return;
      }

      const selectedOption = nameEditSelect.options[nameEditSelect.selectedIndex];
      // Check if the classId attribute exists on the option element
      if (!selectedOption.hasAttribute('data-name-order') || !selectedOption.hasAttribute('data-track-id')) {
        hideProcessIndicator();
        showPopover({
          domEl: toast,
          title: 'Missing HTML Attribute',
          content: 'HTML attribute for selected option could not be found. Please try again!',
          type: 'error',
          placement: 'right'
        });
        hideProcessIndicator();
        return;
      }

      // Save the selected option attributes
      rowArgs.newNameOrder = parseInt(selectedOption.dataset.nameOrder);
      rowArgs.newTrackId = parseInt(selectedOption.dataset.trackId);
      rowArgs.editType = 'newName';

    }

    // Get the master array of tracks
    const masterArr = trackingMap.getTracks();
    if (!masterArr || !Array.isArray(masterArr)) {
      // Hide the right click menu 
      showAlertToast('Unable to access tracking data! Please try again.', 'error', 'Failed to Save Changes');
      hideProcessIndicator();
      return;
    }

    // Filter entries according to user choice for edit time span (i.e. start frame to end frame)
    const idxArr = trackingMap.getIndices({ 
      classId: rowArgs.oldClassId, 
      trackId: rowArgs.oldTrackId,
      startFrame: rowArgs.timeStart,
      endFrame: rowArgs.timeEnd
    });

    // Get the track count and determine whether it is single or multiple
    const trackCount = idxArr?.length;
    if (!trackCount || trackCount === 0) {
      showPopover({
        domEl: mainCanvas,
        title: 'No Valid Track',
        content: `No match found for track with ID <strong>${rowArgs.oldClassId}-${rowArgs.oldTrackId}</strong>!`,
        type: 'warning',
        placement: 'right',
        hideTimeout: 3500
      });
      hideProcessIndicator();
      return;
    }

    // Get the first index value
    const idx = idxArr[0];  

    // Adjust the text for tracks in the popover alert
    const tracksText = trackCount === 1 ? 'track' : 'tracks';

    // Flag whether the tracking edit operation is successful
    let isSuccess = false;

    // Replace the old ID with new ID for all those frames (according to selected options)
    const popoverArgs = {
      title: null,
      content: `<strong>${trackCount}</strong> ${tracksText} with ID <strong>${rowArgs.oldClassId}-${rowArgs.oldTrackId}</strong> `,
      type: 'success',
      placement: 'right'
    }

    let contentEnd;
    switch (selectedOption) {
      case 'remove':
        // Attempt to delete tracks
        isSuccess = trackingMap.deleteByIndices(idxArr);
        
        // Show feedback depending on success/failure
        contentEnd = isSuccess ? 'deleted' : 'could not be deleted';
        popoverArgs.title =  isSuccess ? 'Tracks Deleted': 'Failed to Delete Tracks';
        popoverArgs.content += contentEnd;
        break;

      case 'new-name':
        // Attempt to change the name of the tracks
        isSuccess = trackingMap.updateByIndices({ 
          indices: idxArr, 
          entries: {
            'nameOrder': rowArgs.newNameOrder,  // Use the name order (integer) of the selected new name
            'confidenceId': 1.0,  // Put the confidence id as 1 after user corrects the name
          }
        });

        // Show feedback depending on success/failure
        const confirmedName = individualNames[masterArr[idxArr[0]]['nameOrder']];
        contentEnd = isSuccess ? `renamed as <strong>${confirmedName}</strong>.` : 'could not be renamed!';
        popoverArgs.title = isSuccess ? 'Tracks Renamed': 'Failed to Rename Tracks';
        popoverArgs.content += contentEnd;
        break;

      case 'new-class':
        // Attempt to change the class ID
        isSuccess = trackingMap.updateByTrackId({
          oldClassId: rowArgs.oldClassId,
          oldTrackId: rowArgs.oldTrackId,
          newClassId: rowArgs.newClassId,
          indices: idxArr,
        });

        // Show feedback depending on success/failure
        const confClassId = masterArr[idx]?.getClassId?.();  // Confirm class ID change
        const newTrackId = masterArr[idx]?.getTrackId?.();  // Confirm class ID change
        const confClassName = trackingMap.getClassName(confClassId);  // Confirm class name change
        const classText = confClassId + '–' + newTrackId + '–' + (confClassName ?? '');  // Construct the class text
        contentEnd = isSuccess ? `reclassified as <strong>${classText}</strong>.` : 'could not be reclassified!';
        popoverArgs.title = isSuccess ? 'Tracks Reclassified': 'Failed to Reclassify Tracks';
        popoverArgs.content += contentEnd;
        break;

      case 'auto-new-id':
      case 'manual-new-id':
        // Attempt to change track IDs (for either auto or manual ID assignment)
        isSuccess = trackingMap.updateByTrackId({
          oldClassId: rowArgs.oldClassId,
          oldTrackId: rowArgs.oldTrackId,
          newTrackId: rowArgs.newTrackId,
          indices: idxArr
        });

        // Show feedback depending on success/failure
        const confTrackId = masterArr[idxArr[0]]['trackId'];  // Confirm track ID change
        contentEnd = isSuccess ? `reidentified as <strong>Track ${rowArgs.oldClassId}-${confTrackId}</strong>.` : 'could not be reidentified!';
        popoverArgs.title = isSuccess ? 'Track IDs Changed': 'Failed to Change Track IDs';
        popoverArgs.content += contentEnd;
        break;

      default:
        showPopover({
          domEl: toast,
          title: 'Invalid Selection',
          content: 'Please try again!',
          placement: 'right',
          type: 'error'
        });
        return;
    }
    
    // Show feedback
    showPopover({
      domEl: mainCanvas,
      title: popoverArgs.title,
      content: popoverArgs.content,
      type: isSuccess ? 'success': 'error',
      placement: 'right',
      hideTimeout: 5000
    });

    // Stop if there was an error
    if (!isSuccess) {
      hideProcessIndicator();
      return;
    }

   

  
    // // Filter entries according to user choice for edit time span (i.e. start frame to end frame)
    // const filteredFrameNumbers = [...trackingMap.getTracks().keys()]
    // .filter(frameNumber => frameNumber >= rowArgs.timeStart && frameNumber <= rowArgs.timeEnd)
    
    // Keep track of (frameNumber, trackInfoArr) pairs before changes by user to undo changes later
    // let oldFramesArr = [];
    
    // Show changes on canvas by modifying tracking dict on Player component
    // if (filteredFrameNumbers.length > 0) {
    //   filteredFrameNumbers.forEach(frameNumber => {
    //     let trackInfoArr = trackingMap.get(frameNumber);
  
    //     // Iterate over tracks in each filtered frame
    //     trackInfoArr.forEach((trackInfo, index) => {
  
    //       // Check for tracks with targeted track IDs and class
    //       if (trackInfo['trackId'] === rowArgs.oldTrackId && trackInfo['classId'] === rowArgs.oldClassId) {
            
    //         // Add old (key, value) pair in tracking map to history array (to undo the change later)
    //         const oldTrackInfoArr = JSON.parse(JSON.stringify(trackInfoArr)); // Create a deep copy to loose any reference to original array
  
    //         const oldFrameObj = {frameNumber: frameNumber, trackInfoArr: oldTrackInfoArr};
    //         oldFramesArr.push(oldFrameObj);
            
    //         // Replace the old ID with new ID for all those frames (according to selected options)
    //         if (selectedOption === 'remove') {
    //           const newTrackInfoArr = oldTrackInfoArr.toSpliced(index, 1);
              
    //           // Update the tracking map
    //           trackingMap.set(frameNumber, newTrackInfoArr);
  
    //         } else if (selectedOption === 'new-name') {
  
    //           // Check if nameOrder is present
    //           // if (trackInfo.hasOwnProperty('nameOrder')) {
                
    //             // Create a deep copy to loose any reference to original array
    //             const newTrackInfoArr = JSON.parse(JSON.stringify(trackInfoArr));
  
    //             // Use the name order (integer) of the selected new name
    //             newTrackInfoArr[index]['nameOrder'] = rowArgs.newNameOrder; 
  
    //             // Put the confidence id as 1 after user corrects the name
    //             newTrackInfoArr[index]['confidenceId'] = 1.0; 
  
                
    //             // Update the tracking map
    //             trackingMap.set(frameNumber, newTrackInfoArr);
    //           // }
  
  
    //         } else {
    //           // Change only track ID if "manual-new-id" or "auto-new-id" is selected
    //           const newTrackInfoArr = JSON.parse(JSON.stringify(trackInfoArr));
  
    //           newTrackInfoArr[index]['trackId'] = rowArgs.newTrackId;
  
    //           // Update the tracking map
    //           trackingMap.set(frameNumber, newTrackInfoArr);
  
    //         }
  
    //       }
    //     });
  
        
  
        
    //   })

    // }
    
    // Add all edited frames to history with their properties prior to edits
    // if (oldFramesArr.length > 0) {
    //   trackingMap.addToHistory(oldFramesArr); 
    // }


    // Save tracking edits to file
    trackingMap.saveEditsToFile()
    .then(response => {
      if (!response) {
        showAlertToast('Please try again!', 'error', 'Failed to Save Tracking Changes');
        hideProcessIndicator();
        return;
      }
      // Refresh tracking boxes on canvas
      Player.refreshMainCanvas();

      // Dismiss toast after edit is done
      toastBootstrap.dispose();

      hideProcessIndicator();


    });





}

// Parse HTML table element to JSON array of objects
// Taken from: https://gist.github.com/johannesjo/6b11ef072a0cb467cc93a885b5a1c19f?permalink_comment_id=3852175#gistcomment-3852175
function parseHTMLTableEl(tableEl) {
  const columns = Array.from(tableEl.querySelectorAll('th')).map(it => it.textContent)
  const rows = tableEl.querySelectorAll('tbody > tr')
  return Array.from(rows).map(row => {
      const cells = Array.from(row.querySelectorAll('td'))
      return columns.reduce((obj, col, idx) => {
          obj[col] = cells[idx].textContent
          return obj
      }, {})
  })
}

function clearTrackingTable() {
  const trackingTable = document.getElementById('tracking-table');
  if (!trackingTable) {
    console.log('No table for the tracks was found!');
    return;
  }

  const tableBody = trackingTable.querySelector('tbody');

  // Check if table was empty before
  if (tableBody) {
    while (tableBody.rows.length > 0) {
      tableBody.deleteRow(0);
    }
    
    // Create the info row and cell to when the table is empty
    
    // Insert the info row to the table
    const infoRow = tableBody.insertRow(0);
    infoRow.classList.add('empty-table-info');
    const infoCell = infoRow.insertCell(0);
    infoCell.textContent = 'Modified tracking labels will appear here';
    infoCell.colSpan = '5';
    
  }

}


function clearEthogramTable() {
  const ethogramTable = document.getElementById('behavior-table');

  if (!ethogramTable) {
    console.log("No table for behaviors could be found!")
    return;
  }

  const tableBody = ethogramTable.querySelector('tbody');

  // Check if table was empty before
  if (tableBody) {
    while (tableBody.rows.length > 0) {
      tableBody.deleteRow(0);
    }
    
    // Create the info row and cell to when the table is empty
    // Insert the info row to the table
    const infoRow = tableBody.insertRow(0);
    infoRow.classList.add('empty-table-info');
    const infoCell = infoRow.insertCell(0);
    infoCell.textContent = 'Records of behaviors will appear here';
    infoCell.colSpan = '6';
    
  }





}

/**
 * Handles recording a behavior when user interacts with the buttons on the toast 
 * The toast is shown when clicking on a tracking bounding box
 * @param {MouseEvent} event 
 */
function handleBehaviorRecordByClick(event) {

  // Check if the DOM element for behaviors exists
  const behaviorTableEl = document.getElementById('behavior-table');
  if (!behaviorTableEl) {
    console.log("No table for saving the labels was found!")
    return;
  }

  // Get the clicked button element for behavior recording
  const behaviorRecordBtn = this;

  // Check if the toast element exists
  const toastEl = document.getElementById('labeling-toast');
  if (!toastEl) return;

  const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastEl);
  const subjectSelect = toastEl.querySelector('#subject-select');
  const targetSelect = toastEl.querySelector('#target-select');
  const actionSelect = toastEl.querySelector('#action-select');
  const behaviorTab = toastEl.querySelector('#behavior-toast-tab');

  const toastAlertEl = toastEl.querySelector('#toast-alert');

  if (!toastAlertEl) {
    console.log('No HTML element for toast alert could be found!');
    return;
  }

  // Check if the DOM elements inside the toast exist
  if (!(subjectSelect && targetSelect && actionSelect)) return;

  // Check if the main player is loaded
  const mainPlayer = Player.getMainPlayer();
  if (!mainPlayer) return;

  // Check if individual names are defined
  const individualNames = Player.getIndividualNames();
  if (!individualNames || individualNames.length === 0) return;

  // Check if the current observation exists
  const currentObs = Player.getCurrentObservation();
  if (!currentObs) return;

  // Get the observation status (new or in-progress)
  const isNewObs = (!currentObs.subjectName || !Number.isSafeInteger(parseInt(currentObs.subjectId)));

  // Show warnings if no subject is selected
  if (subjectSelect.selectedIndex === 0) {
    toastAlertEl.textContent = 'Subject must be selected!';
    toastAlertEl.classList.remove('d-none');
    return;

  }

  // Show warnings if no action is selected
  if (actionSelect.selectedIndex === 0) {
    toastAlertEl.textContent = 'Action must be selected!';
    toastAlertEl.classList.remove('d-none');
    return;

  }


  // Get the selected subject element
  const selectedSubjectEl = subjectSelect.options[subjectSelect.selectedIndex];
  
  // Check if the subject name is present on the tracking box
  const subjectNameOrder = parseInt(selectedSubjectEl.dataset.nameOrder);
  if (!Number.isSafeInteger(subjectNameOrder)) {
    toastAlertEl.textContent = 'Assign a name to this track before recording your observation!';
    toastAlertEl.classList.remove('d-none');
    return;

  }

  // Get the selected subject name and track ID
  const subjectName = individualNames[subjectNameOrder];
  const subjectId = parseInt(selectedSubjectEl.value);

  // Check if this is a new observation
  if (isNewObs) {

    // Update the current observation:
    // Add index, starting time, subject ID, subject name (if it exists), and action
    currentObs.update(
      ['index', mainPlayer.getEthogram().getInsertionIndex()],
      ['startFrame', mainPlayer.getCurrentFrame()],
      ['subjectId', subjectId],
      ['subjectName', subjectName],
      ['action', actionSelect.value]
    );

    // Confirm the selection
    const confirmedAction = currentObs.action;
    if (confirmedAction) {

      // Show notification
      const subjectText = subjectName ? subjectName : `${toastEl.dataset.clickedClassId}-${subjectId}`;
      
      showAlertToast(
        `Subject: <span class="badge text-bg-primary">${subjectText}</span> Action: <span class="badge text-bg-dark">${confirmedAction}</span>`,
        'success',
        'New Observation' 
        
      );

      // Show a message for "no target" selection
      // Get the end observation hotkey
      const endObsHotkey = Hotkey.findOne({name: 'endObservation'});
      if (endObsHotkey) {
        const popover = new bootstrap.Popover('#current-observation-div', {
          container: 'body',
          content: `Press <kbd>${endObsHotkey.key}</kbd> for no target`,
          html: true,
          sanitize: false
  
        });
  
        popover.show();

        setTimeout(() => {
          popover.hide();
        }, 2000);
        

      }


      


    }


  // If this is NOT a new observation
  } else {

    // Get the ethogram
    const ethogram = mainPlayer.getEthogram();
    if (!ethogram) return;

    // Show warnings if no target is selected
    if (targetSelect.selectedIndex === 0) {
      toastAlertEl.textContent = 'Target must be selected!';
      toastAlertEl.classList.remove('d-none');
      return;

    }

    // Get the selected target element
    const selectedTargetEl = targetSelect.options[targetSelect.selectedIndex];

    // Get the target class
    const targetSpecies = selectedTargetEl.dataset.classId;

    // Get the selected target name and track ID
    const targetId = parseInt(selectedTargetEl.value);

    // Determine the target name depending on the selected class
    let targetName;
    
    // Check if a box is selected as target
    if (Player.getClassName(targetSpecies) === 'box') { 
      targetName = 'Box';
    } else {
      // Check if the target name is present
      const targetNameOrder = parseInt(selectedTargetEl.dataset.nameOrder);
      if (!Number.isSafeInteger(targetNameOrder)) {
        toastAlertEl.textContent = `Assign a name to track ${targetSpecies}-${targetId} to select it as the target!`;
        toastAlertEl.classList.remove('d-none');
        return;
  
      }

      targetName = individualNames[targetNameOrder];

    }
    

    // Update the current observation:
    // Add index, starting time, subject ID, subject name (if it exists), and action
    currentObs.update(
      ['subjectId', subjectId],
      ['subjectName', subjectName],
      ['action', actionSelect.value],
      ['targetId', targetId],
      ['targetName', targetName],
      ['endFrame', mainPlayer.getCurrentFrame()]
    );


    // Confirm target selection ("no target" option can also be selected)


    // Add the observation to the ethogram
    if (ethogram.add(currentObs)) {

      // Update the HTML table for the ethogram
      addEthogramRow(currentObs);
  
      // Show notification
      showAlertToast(
        `<span class="badge text-bg-secondary">Record ${currentObs.get('index')}</span>: <span class="badge text-bg-primary">${currentObs.subjectName}</span>-<span class="badge text-bg-dark">${currentObs.action}</span>-<span class="badge text-bg-success">${currentObs.targetName}</span>`,
        'success', 
        `Observation Recorded`,
      );

    }

    // Reset the current observation
    Player.resetCurrentObservation();

    

  }

  // Dismiss the toast
  toastBootstrap.dispose();



}

/**
 * Updates the table for labels
 */
function updateInteractionTable() {
  const interactionTable = document.getElementById('interaction-table');

  if (!interactionTable) {
    console.log("No table for saving the labels was found!")
    return;
  }

  const labelSaveButton = this;
  const toast = document.getElementById('labeling-toast');
  const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toast);
  const subjectSelect = toast.querySelector('#subject-select');
  const objectSelect = toast.querySelector('#target-select');
  const labelSelect = toast.querySelector('#label-select');
  const actionTab = toast.querySelector('#interaction-toast-tab');

  // const isEnd = (actionTab.dataset.isEnd === 'true');

  
  // Get the status of observation (new or in-progress)
  const isNew = (actionTab.dataset.obsStatus === 'new');
  
  // If this is a new observation
  if (isNew) {
    // Object for a row in interaction labeling table
    let observation = {
      'timeStart': null,
      'timeEnd': null,
      'subjectId': null,
      'subjectSpecies': null,
      'subjectName': null,
      'objectId': null,
      'objectSpecies': null,
      'objectName': null,
      'label': null,
      'modifier': null
    }

    // Show warning if no label is selected
    if (labelSelect.selectedIndex === 0){
      const toastAlert = toast.querySelector('#toast-alert');
      toastAlert.textContent = 'Action type must be selected!';
      toastAlert.classList.remove('d-none');
    } else {
      // Mark the start of an interaction
      observation.timeStart = Player.getMainPlayer().getCurrentFrame();;
      observation.subjectId = parseInt(toast.dataset.clickedId);
      observation.subjectSpecies = parseInt(toast.dataset.clickedClassId);
      observation.label = labelSelect.value;
      // observation.objectId = objectId;

      // Set the current observation
      Player.setCurrentObservation(observation);
      
      // Add observartion row
      // const hideAlert = true;
      // addActionRow(Player.getCurrentObservation(), hideAlert);
      showAlertToast(
        'Go to the frame where the behavior ends and choose the target', 
        'success', 
        'New record started'
      );

      // Save the data to toast element
      // toast.dataset.objectId = objectId;

      // Show success/failure message for added interaction

      // Change the text of save button for interaction
      labelSaveButton.textContent = 'Mark end';
      // actionTab.dataset.isEnd = 'true';
      
      // Update the observation status to "in-progress"
      actionTab.dataset.obsStatus = 'in-progress';

      toastBootstrap.dispose();
    }

      
  // If this is an observation in progress
  } else {
    
    // Show warning if no object is selected
    if (objectSelect.selectedIndex === 0 ){
      const toastAlert = toast.querySelector('#toast-alert');
      toastAlert.textContent = 'Target must be selected!';
      toastAlert.classList.remove('d-none');
    } else {
      // Get the selected object
      const selectedObject = objectSelect.options[objectSelect.selectedIndex];
      
      
      // Verify if the selected end frame is later than the start
      const mainPlayer = Player.getMainPlayer();
      const timeEnd = mainPlayer.getCurrentFrame()
      const timeStart = Player.getCurrentObservation().timeStart;
      if (timeEnd < timeStart) {
        showAlertToast(
          'The end frame must be later than the start frame!',
          'error',
          'Invalid selection'
        );
        return;
      }
      
      // Update the current observation (mark the end of action)
      Player.updateCurrentObservation('objectId', parseInt(selectedObject.value));
      Player.updateCurrentObservation('objectSpecies', parseInt(selectedObject.dataset.classId));
      Player.updateCurrentObservation('timeEnd', timeEnd);
      Player.updateCurrentObservation('modifier', selectedModifier.value);

      
      // Get the unique observation index to save it to table (for editing it later)
      const observation = Player.getCurrentObservation();
      const index = mainPlayer.getActionMap().getInsertionIndex();
      
      // Add observation into the Action Map
      if (mainPlayer.getActionMap().add(observation)) {
        // Complete the observation row
        const hideAlert = true;
        completeActionRow(observation, index);
      }
  
      labelSaveButton.textContent = 'Mark start';
      // labelSaveButton.dataset.isNew = 'true';

      // Show success/failure message
      
      // Update the observation status to "new"
      actionTab.dataset.obsStatus = 'new';
  
      // actionTab.dataset.isEnd = 'false';

      

      
      // Dismiss the toast
      toastBootstrap.dispose();
    }

  }
}



/**
 * 
 * @param {Observation} obs - Map for getting information for each observation row in the table
 * @param {Boolean} hideAlert - True if the toast alert needs to be hidden
 */
function addEthogramRow(obs, hideAlert) {

  // Check if both observation object and index is given
  if (!obs) {
    console.log('Observation object must be given!');
    return;
  }

  // Check if inputs are in correct format
  if (!(obs instanceof Observation)) {
    console.log('Input object should be an instance of Observation!');
    return;
  }

  // Get the observation index
  const obsIndex = obs.index;

  // Check the format of the observation index
  if (!Number.isInteger(parseInt(obsIndex))) {
    console.log('Observation index should be an integer!');
    return;
  }
 
  if (parseInt(obsIndex) < 0) {
    console.log('Observation index must be a non-negative integer!');
    return;
  }

  if (!Player.getMainPlayer()) {
    console.log('No main player could be found!');
    return;
  }

  const ethogram = Player.getMainPlayer().getEthogram();
  if (!ethogram) {
    console.log('No Ethogram object could be found!');
    return;
  }

  // Get the HTML table for behavior records
  const tableEl = document.getElementById('behavior-table');
  if (!tableEl) {
    console.log('No HTML table for behaviors could be found!');
    return;
  }

  // Determine whether this is an update to an existing behavior record
  let isUpdate;

  /**
   * Validate user edits of an input element with a datalist
   * @param {HTMLElement} inputEl 
   * @param {String} inputType - Either subject, target, action, starting time or ending time
   * @returns {Boolean} - True if the user edit is valid, false otherwise
   */
  function validateUserEdit(inputEl, inputType) {

    // Get the datalist
    const datalist = inputEl.list;
    if (datalist) {

      // Determine whether an option exists with the current value of the input.
      let optionFound = false;
      for (let i = 0; i < datalist.options.length; i++) {
        if (inputEl.value == datalist.options[i].value) {
          optionFound = true;
          break;
        }
      }

      // use the setCustomValidity function of the Validation API
      // to provide an user feedback if the value does not exist in the datalist
      if (optionFound) {
        inputEl.setCustomValidity('');
      } else {
        // Determine the validation message
        const validationType = inputType ? inputType : 'value';
        inputEl.setCustomValidity(`Please select a valid ${validationType}!`);
      }
  
      inputEl.reportValidity();
  
      return optionFound;

    }
    
  }

  // Check if a row for this observation already exists in the HTML table
  const rowEls = tableEl.querySelectorAll(`tr[data-observation-index="${obsIndex}"]`);
  if (rowEls.length === 1) {
    isUpdate = true;
  } else if (rowEls.length < 1) {
    isUpdate = false;
  } else {
    console.log(`There are ${rowEls.length} elements with the same index in the HTML behavior table!`)
    return;
  }

  // Get the properties of the current observation
  const startTime = obs.startFrame;
  const endTime = obs.endFrame;
  const subjectId = parseInt(obs.subjectId);
  const subjectSpecies = parseInt(obs.subjectSpecies);
  const subjectName = obs.subjectName;
  const targetId = parseInt(obs.targetId);
  const targetSpecies = parseInt(obs.targetSpecies);
  const targetName = obs.targetName;
  const actionLabel = obs.action;

  // Get the table body HTML element
  const tableBody = tableEl.querySelector('tbody');

  // Check if table was empty before
  const infoRow = tableBody.querySelector('.empty-table-info');
  if (infoRow) {
    // Remove info row before adding new rows
    infoRow.remove();
  }

  // Define the headers 
  const subjectHeader = 'subject';
  const actionHeader = 'action';
  const targetHeader = 'target';
  const startTimeHeader = 'start';
  const endTimeHeader = 'end';

  // Initialize the row element
  let rowEl;

  // Initialize the cells
  let subjectCell, actionCell, targetCell, startTimeCell, endTimeCell, buttonCell;

  // If this is new observation - i.e. not an update to an existing row
  if (!isUpdate) {
    
    // Create a new row HTML element and data cells within it 
    rowEl = tableBody.insertRow(0);

    // Add observation index to the row element - to connect the rows to the backend
    rowEl.dataset.observationIndex = obsIndex;
  
    subjectCell = rowEl.insertCell(0);
    actionCell = rowEl.insertCell(1);
    targetCell = rowEl.insertCell(2);
    startTimeCell = rowEl.insertCell(3);
    endTimeCell = rowEl.insertCell(4);
    buttonCell = rowEl.insertCell(5); 

    // Link the data cells with their corresponding headers
    subjectCell.headers = subjectHeader;
    actionCell.headers = actionHeader;
    targetCell.headers = targetHeader;
    startTimeCell.headers = startTimeHeader;
    endTimeCell.headers = endTimeHeader;

    // Make the cells editable
    // [subjectCell, actionCell, targetCell, startTimeCell, endTimeCell].forEach(cellEl => {
    //   cellEl.contentEditable = true 
    // });
    
    // Add delete button
    const deleteBtn = document.createElement('span');
    deleteBtn.role = 'button';
    deleteBtn.classList.add('material-symbols-rounded', 'action-table-icon', 'me-1');
    deleteBtn.textContent = 'delete';

    // Delete the observation when user clicks the delete button
    deleteBtn.addEventListener('click', () => {

      // Check if the observation index exists
      const obsIndex = rowEl.dataset.observationIndex;
      if (!obsIndex) return;
      
      // Attempt to remove the observation from ethogram
      ethogram.remove(obsIndex).then(isSuccess => {
        
        // Confirm the removal
        if (isSuccess) {
          // Remove the row element with delay for clearer visual feedback
          // Flash red background on the removed row just before the actual removal
          rowEl.classList.add('table-danger');
          setTimeout(() => {
            rowEl.classList.remove('table-danger');
            rowEl.remove(); 
          }, 500);


          showAlertToast(`Record with <span class="badge text-bg-secondary">ID ${obsIndex}</span> removed!`, 'success');

        } else {

          showAlertToast(`Record with <span class="badge text-bg-secondary">ID ${obsIndex}</span> could not be removed!`, 'error');

        }

      });



    });

    buttonCell.append(deleteBtn);

    // Add "time-cell" class name - which is required for toggleTimeFormat() function
    startTimeCell.classList.add('time-cell');
    endTimeCell.classList.add('time-cell');

    if (!hideAlert) {
      showAlertToast('New behavior added to the table!', 'success');
    }


  // If this is an update to an existing observation/row
  } else {
    // Find the relevant row with its observation index saved previously in its dataset
    rowEl = tableEl.querySelector(`tr[data-observation-index="${obsIndex}"]`)
    
    // Select its data cells
    if (rowEl) {
      subjectCell = rowEl.querySelector(`td[headers=${subjectHeader}]`);
      actionCell = rowEl.querySelector(`td[headers=${actionHeader}]`);
      targetCell = rowEl.querySelector(`td[headers=${targetHeader}]`);
      startTimeCell = rowEl.querySelector(`td[headers=${startTimeHeader}]`);
      endTimeCell = rowEl.querySelector(`td[headers=${endTimeHeader}]`);
    }

  }

  // Flash a colored background on the row element to indicate that a new row has been added
  rowEl.classList.add('table-success');
  setTimeout(() => {
    rowEl.classList.remove('table-success');
  }, 500);


  /**
   * Add input elements inside cells to make them editable
   * Input element is also necessary for using datalists for autocompletion
   *  */ 
  // Add subject input element
  const subjectInputGroupEl = document.createElement('div'); // Bootstrap input group element
  subjectInputGroupEl.classList.add('input-group', 'input-group-sm', 'ethogram-font');
  const subjectInputEl = document.createElement('input');
  subjectInputEl.classList.add('form-control');
  subjectInputGroupEl.append(subjectInputEl);

  // Add action input element
  const actionInputGroupEl = document.createElement('div'); // Bootstrap input group element
  actionInputGroupEl.classList.add('input-group', 'input-group-sm', 'ethogram-font');
  const actionInputEl = document.createElement('input');
  actionInputEl.classList.add('form-control');
  actionInputGroupEl.append(actionInputEl);

  // Add target input element
  const targetInputGroupEl = document.createElement('div'); // Bootstrap input group element
  targetInputGroupEl.classList.add('input-group', 'input-group-sm', 'ethogram-font');
  const targetInputEl = document.createElement('input');
  targetInputEl.classList.add('form-control');
  targetInputGroupEl.append(targetInputEl);

  // Add starting time input element
  const startTimeInputGroupEl = document.createElement('div'); // Bootstrap input group element
  startTimeInputGroupEl.classList.add('input-group', 'input-group-sm', 'ethogram-font');
  const startTimeInputEl = document.createElement('input');
  startTimeInputEl.classList.add('form-control');
  startTimeInputEl.type = 'number';
  startTimeInputEl.min = '0';  // Min frame should be 0
  startTimeInputEl.max = secondsToFrames(Player.getMainPlayer().getDuration());  // Max frame should be the duration of the video
  startTimeInputGroupEl.append(startTimeInputEl);
  
  // Add ending time input element
  const endTimeInputGroupEl = document.createElement('div'); // Bootstrap input group element
  endTimeInputGroupEl.classList.add('input-group', 'input-group-sm', 'ethogram-font');
  const endTimeInputEl = document.createElement('input');
  endTimeInputEl.classList.add('form-control');
  endTimeInputEl.type = 'number';
  endTimeInputEl.min = '0'; // Min frame should be 0
  endTimeInputEl.max = secondsToFrames(Player.getMainPlayer().getDuration());  // Max frame should be the duration of the video
  endTimeInputGroupEl.append(endTimeInputEl);

  // Add subject datalist element
  const subjectDatalistElId = 'subject-datalist';
  const targetDatalistElId = 'target-datalist';
  const actionDatalistElId = 'action-datalist';

  // Add input elements to data cells
  subjectCell.append(subjectInputGroupEl);
  actionCell.append(actionInputGroupEl);
  targetCell.append(targetInputGroupEl)
  startTimeCell.append(startTimeInputGroupEl);
  endTimeCell.append(endTimeInputGroupEl);

  // Connect datalist elements input elements
  subjectInputEl.setAttribute('list', subjectDatalistElId);
  actionInputEl.setAttribute('list', actionDatalistElId);
  targetInputEl.setAttribute('list', targetDatalistElId);

  /**
   * END of adding input elements
   */

  // Get the selected time format (frames or seconds)
  let timeFormat = 'frames';
  const trackingTimeFormatBtn = document.querySelector('.time-format-btn');
  if (trackingTimeFormatBtn) {
    timeFormat = trackingTimeFormatBtn.dataset.timeFormat;
  }

  // Default text for NA values
  const naText = 'NA';
  
  // Produce text for start frame cell
  let startTimeText = naText;
  if (Number.isSafeInteger(parseInt(startTime))) { 
    startTimeText = startTime;
    
    // Change the text content of time depending on the current format
    if (timeFormat === 'seconds') {
      startTimeText = formatSeconds(framesToSeconds(startTime));
    }
    
    // Add data attributes to return to timestamp in the row when it is clicked
    startTimeInputEl.value = startTime;
    rowEl.dataset.startFrame = startTime;
    
  }

  // Produce text for end frame cell
  let endTimeText = naText;
  if (Number.isSafeInteger(parseInt(endTime))) {
    endTimeText = endTime;

    // Change the text content of time depending on the current format
    if (timeFormat === 'seconds') {
      endTimeText = formatSeconds(framesToSeconds(endTime));
    }

    // Add data attributes to return to timestamp in the row when it is clicked
    endTimeInputEl.value = endTime;
    rowEl.dataset.endFrame = endTime;

  }
  
  // // Populate the timestamp cells
  // startTimeCell.textContent = startTimeText;
  // endTimeCell.textContent = endTimeText;

  // Populate the subject cell
  let subjectText = naText;
  if (subjectName) {
    subjectText = subjectName;
    rowEl.dataset.subjectName = subjectName;
  } else if (Number.isInteger(subjectSpecies) && Number.isInteger(subjectId)) {
    subjectText = `${subjectSpecies}-${subjectId}`;
  } else if (Number.isInteger(subjectId)) {
    subjectText = subjectId;
  }
  subjectInputEl.value = subjectText;

  // Populate the action cell and dataset
  const actionText = actionLabel ? actionLabel : naText;
  actionInputEl.value = actionText;
  rowEl.dataset.action = actionText;

  // Populate the target cell
  let targetText = naText;
  if (targetName) {
    targetText = targetName;
    rowEl.dataset.targetName = targetName;
  } else if (Number.isInteger(targetSpecies) && Number.isInteger(targetId)) {
    targetText = `${targetSpecies}-${targetId}`;
  } else if (Number.isInteger(targetId)) {
    targetText = targetId;
  }
  targetInputEl.value = targetText;

  // Listen for user edits to the subject name of a behavior record
  subjectInputEl.addEventListener('change', () => {
    // Check validity of the user input
    const isValid = validateUserEdit(subjectInputEl, 'subject');

    if (isValid) {
      const obsIndex = rowEl.dataset.observationIndex;
      const userSelection = subjectInputEl.value;

      // Update the ethogram for the chosen observation
      const isSuccess = ethogram.update(obsIndex, ['subjectName', userSelection]);

      // Show success notification
      if (isSuccess) {
        showAlertToast(
          `New subject: <span class="badge text-bg-primary">${userSelection}</span>`,
          'success',
          `Observation Updated - ID: ${obsIndex}`
        );
      }

    }

  });

  // Listen for user edits to the action of a behavior record
  actionInputEl.addEventListener('change', () => {
    // Check validity of the user input
    const isValid = validateUserEdit(actionInputEl, 'action');

    if (isValid) {
      const obsIndex = rowEl.dataset.observationIndex;
      const userSelection =  actionInputEl.value;

      // Update the ethogram for the chosen observation
      const isSuccess = ethogram.update(obsIndex, ['action', userSelection]);
      
      // Show success notification
      if (isSuccess) {
        showAlertToast(
          `New action label: <span class="badge text-bg-dark">${userSelection}</span>`,
          'success',
          `Observation Updated - ID: ${obsIndex}`
        );
      }

    }

  });

  // Listen for user edits to the target name of a behavior record
  targetInputEl.addEventListener('change', () => {
    // Check validity of the user input
    const isValid = validateUserEdit(targetInputEl, 'target');

    if (isValid) {
      const obsIndex = rowEl.dataset.observationIndex;
      const userSelection = targetInputEl.value;

      // Update the ethogram for the chosen observation
      const isSuccess = ethogram.update(obsIndex, ['targetName', userSelection]);

      // Show success notification
      if (isSuccess) {
        showAlertToast(
          `New target: <span class="badge text-bg-info">${userSelection}</span>`,
          'success',
          `Observation Updated - ID: ${obsIndex}`
        );
      }
      
    }

  });


  // Listen for user edits to the starting time of a behavior record
  startTimeInputEl.addEventListener('change', () => {
    
    // Check validity of the user input
    const userSelection = parseInt(startTimeInputEl.value);

    const endTime = parseInt(endTimeInputEl.value); // Get the ending frame of this observation
    
    if (!Number.isInteger(userSelection) || !Number.isFinite(userSelection) ||
     userSelection < 0 ) {
      startTimeInputEl.setCustomValidity('Please select a valid frame number');
      startTimeInputEl.reportValidity();
      return;
    }

    if (userSelection > endTime) {
      startTimeInputEl.setCustomValidity('Start frame ≤ End frame');
      startTimeInputEl.reportValidity();
      return;
    }

    const obsIndex = rowEl.dataset.observationIndex;

    // Update the ethogram for the chosen observation
    const isSuccess = ethogram.update(obsIndex, ['startFrame', userSelection]);

    // Show success notification
    if (isSuccess) {
      showAlertToast(
        `New start frame: <span class="badge text-bg-info">${userSelection}</span>`,
        'success',
        `Observation Updated - ID: ${obsIndex}`
      );
    }
      

  });


  // Listen for user edits to the ending time of a behavior record
  endTimeInputEl.addEventListener('change', () => {
    
    // Check validity of the user input
    const userSelection = parseInt(endTimeInputEl.value);

    const startTime = parseInt(startTimeInputEl.value); // Get the ending frame of this observation
    
    if (!Number.isInteger(userSelection) || !Number.isFinite(userSelection) ||
     userSelection < 0 ) {
      endTimeInputEl.setCustomValidity('Please select a valid frame number');
      endTimeInputEl.reportValidity();
      return;
    }

    if (userSelection < startTime) {
      endTimeInputEl.setCustomValidity('End frame ≥ Start frame');
      endTimeInputEl.reportValidity();
      return;
    }

    const mainPlayer = Player.getMainPlayer();
    if (mainPlayer) {
      const videoDuration = secondsToFrames(mainPlayer.getDuration());
      if (userSelection > videoDuration) {
        endTimeInputEl.setCustomValidity('End frame ≤ Duation');
        endTimeInputEl.reportValidity();
        return;
      }
    }

    const obsIndex = rowEl.dataset.observationIndex;

    // Update the ethogram for the chosen observation
    const isSuccess = ethogram.update(obsIndex, ['endFrame', userSelection]);

    // Show success notification
    if (isSuccess) {
      showAlertToast(
        `New end frame: <span class="badge text-bg-info">${userSelection}</span>`,
        'success',
        `Observation Updated - ID: ${obsIndex}`
      );
    }
      

  });

  // Show cursor on start and end frame elements to indicate that you can go the selected frames
  startTimeInputEl.role = 'button';
  endTimeInputEl.role = 'button';

  // Jump to the start frame of the recorded behavior
  startTimeInputGroupEl.addEventListener('click', () => {
    // Applying time change for all players
    Player.pauseAll();
    Player.setCurrentFrameAll(startTimeInputEl.value);

    // const allPlayers = Player.getAllInstances();
    // if (allPlayers) {
    //   allPlayers.forEach(player => {
    //     player.pause();
    //     player.setCurrentTime(framesToSeconds(startTimeInputEl.value));
    //   });
    // }

  })

  // Jump to the end frame of the recorded behavior
  endTimeInputGroupEl.addEventListener('click', () => {
    // Applying time change for all players
    Player.pauseAll();
    Player.setCurrentFrameAll(endTimeInputEl.value);

  })

  // Disable/enable labeling mode when any of the input element is focused/blurred
  const inputEls = [subjectInputEl, actionInputEl, targetInputEl, startTimeInputEl, endTimeInputEl];
  inputEls.forEach(inputEl => {
    inputEl.addEventListener('focus', Player.userIsTyping);
    inputEl.addEventListener('blur', Player.userStoppedTyping);

  });

  
}

/**
 * Update incomplete rows on the interaction table
 * @param {*} rowArgs 
 * @param {Number} obsIndex 
 */
function completeActionRow(rowArgs, obsIndex, hideAlert) {
  const interactionTable = document.getElementById('interaction-table');
  if (interactionTable) {
    const incompleteRow = interactionTable.querySelector('.incomplete');
    if (incompleteRow) {
      const timeEndCell = incompleteRow.querySelector('.timestamp-end');
      const timeEnd = rowArgs.timeEnd;
      if (timeEndCell && timeEnd) {
        timeEndCell.dataset.frameNumber = timeEnd;
      }
      
      
      // Get the selected time format (frames or seconds) to show time in selected format
      const trackingTimeFormatBtn = document.querySelector('.time-format-btn');
      let timeEndText = timeEnd;
      if (trackingTimeFormatBtn) {
        const timeFormat = trackingTimeFormatBtn.dataset.timeFormat;
        if (timeFormat === 'seconds') {
          timeEndText = formatSeconds(framesToSeconds(timeEndCell.dataset.frameNumber));
        }
      }
      timeEndCell.textContent = timeEndText;

      // Add the observation index to row element
      incompleteRow.dataset.observationIndex = obsIndex;
      
      // Update the row status
      incompleteRow.classList.remove("incomplete");
    }
  
    if (!hideAlert) {
      showAlertToast("Observation recorded!", 'success');

      // Go back to the start frame of the action
      if (rowArgs.timeStart) {
        Player.pauseAll();
        Player.setCurrentFrameAll(rowArgs.timeStart);

        // const start = framesToSeconds(rowArgs.timeStart);
        // const allPlayers = Player.getAllInstances();
        // if (allPlayers) {
        //   allPlayers.forEach(player => {
        //     player.pause();
        //     player.setCurrentTime(start)
        //   });
        // }
      }
    }

    




  }

}

function deleteEthogramRow() {
  // Check if the target element is a row element (TR)
  if (this.parentNode.parentNode.nodeName.toLowerCase() == 'tr') {
    const rowEl = this.parentNode.parentNode;
    const obsIndex = rowEl.dataset.observationIndex;
    // console.log(typeof observationIndex, observationIndex)
    if (Player.getMainPlayer().getActionMap().remove(obsIndex)) {
      rowEl.remove();
      showAlertToast(`<span class="badge text-bg-secondary">Record ${obsIndex}</span> removed!`, 'success');
    } else {
      showAlertToast(`<span class="badge text-bg-secondary">Record ${obsIndex}</span> could not be removed!`, 'error');
    }
  }

}


/**
 * Updates the playback speed list item
 */
function updatePlaybackRateList() {
  const minRate = Player.getMinPlaybackRate();
  const maxRate = Player.getMaxPlaybackRate();
  const stepSize = 0.25 // Step size for playback rate selections

  const playbackRateList = document.getElementById('playback-rate-list');
  if (playbackRateList) {
    // Clear all previous list items
    while (playbackRateList.firstChild) {
      playbackRateList.removeChild(playbackRateList.firstChild);
    }

    // Create updated items
    for (let rate = minRate; rate <= maxRate; rate += stepSize) {
      const itemEl = document.createElement('li');
      const optionEl = document.createElement('a');
      optionEl.classList.add('dropdown-item', 'small');
      optionEl.textContent = rate;
      optionEl.href = '#';
      optionEl.setAttribute('data-playback-rate', rate)
      itemEl.append(optionEl);
      playbackRateList.append(itemEl);
    }
  }
}

/**
 * Updates the zoom scale DOM elements
 * @returns 
 */
function updateZoomScaleDomEls() {
  const zoomScale = Player.getZoomScale();
  // Get the dropdown element located on the zoomed video region panel
  const dropdownEl = document.getElementById('zoom-scale-dropdown');
  if (!dropdownEl) return;

  // Update the button text
  const toggleBtn = dropdownEl.querySelector('.dropdown-toggle');
  if (!toggleBtn) return;
  toggleBtn.textContent = zoomScale + '%';
  
  const listItems = dropdownEl.querySelectorAll('.dropdown-item');
  if (!listItems) return;
  
  // Make the item with the same zoom scale as the main player active
  listItems.forEach(item => {
    if (parseFloat(item.dataset.zoomScale) === zoomScale) {
      item.classList.add('active');
    } else {
      // Remove active states from all items
      item.classList.remove('active');
    }

  });

  // Get the input element on the settings modal
  const changeZoomScaleInput = document.getElementById('change-zoom-scale-input');
  if (!changeZoomScaleInput) return;

  // Update the value of the input element
  changeZoomScaleInput.value = zoomScale;

}

/**
 * Updates bounding box class DOM elements
 */
function updateClassEls() {

  // Create/update relevant DOM elements in settings modal
  // Get the relevant outer element in settings modal
  const settingsModal = document.getElementById(Player.settingsModalId);
  if (!settingsModal) return;

  const outerEl = settingsModal.querySelector('#class-settings-div');
  if (!outerEl) return;

  // Clear the outer element contents to avoid duplicates
  while (outerEl.firstChild) {
    outerEl.removeChild(outerEl.firstChild);
  }

  const btnNameAssign = settingsModal.querySelector('#assign-class-names-to-indivs-settings-btn');
  if (!btnNameAssign) return;
  
  // Iterate over all class in the tracking file
  const classMap = Player.getMainPlayer?.()?.getTrackingMap?.()?.getClassMap?.();
  if ( !(classMap instanceof Map) ) return;
  
  // Get the class count
  if (classMap.size < 1) {
    btnNameAssign.classList.add('d-none');
    return;
  }

  classMap.values().forEach((valueObj, idx) => {
    // Destructuring assignment
    const { id: classId, name: className, color: classColor } = valueObj;

    const idText = `class-id-${classId}`;
    const idSuffix = '-settings';
    // Create input elements for each class
    const outerRow = document.createElement('div');
    outerRow.classList.add('row', 'mb-1');

    // Label element as column
    const labelCol = document.createElement('label');
    labelCol.classList.add('col-3', 'col-form-label', 'col-form-label-sm', 'text-start', 'cursor-help');
    labelCol.textContent = `Class ${classId}`;

    // Input group wrapper element
    const nameCol = document.createElement('div');
    nameCol.classList.add('col-6');

    // Name input group element
    const nameInputGroup = document.createElement('div');
    nameInputGroup.classList.add('input-group', 'input-group-sm');

    // Name input element
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.classList.add('form-control');
    nameInput.id = 'name-' + idText + idSuffix;
    if (className) nameInput.value = className;
    nameInput.required = true;
    nameInput.placeholder = `Name of class ${classId}`;
    labelCol.setAttribute('for', nameInput.id);

    // Text for name within input group element
    const nameText = document.createElement('span');
    nameText.classList.add('input-group-text')
    nameText.textContent = 'Name';

    // Button for saving name changes
    const nameSaveBtn = document.createElement('button');
    nameSaveBtn.classList.add('btn', 'btn-outline-secondary');
    nameSaveBtn.type = 'button';
    nameSaveBtn.textContent = 'Save';

    nameSaveBtn.addEventListener('click', () => {
      const allNames = Player.getClassNames();
      const allIds = Player.getClassIds();
      const className = nameInput.value;
      
      // Check if user input is already assigned to another class
      if (allNames.includes(className)) {
        
        // Find the duplicate ID
        const duplicateId = allIds[allNames.indexOf(className)];

        // Check if duplicate ID is different than the ID of the class in the input element 
        const popoverContent = duplicateId !== classId ? `"${className}" is already assigned to Class ${duplicateId}!` : `"${className}" is already assigned to this class!`;

        showPopover({
          domEl: nameInput,
          title: 'Invalid Name',
          content: popoverContent,
          type: 'error',
        });
        return;

      } else if (className === '') {

        showPopover({
          domEl: nameInput,
          title: 'Empty Input',
          content: 'Please provide a name.',
          type: 'error',
        });
        return;

      } else {

        // Save the new name to TrackingMap class, to settings menu and to metadata file
        Player.setClassName(classId, className).then(response => {
          if (!response) {
            showPopover({
              domEl: nameInput,
              title: 'Failed to Save Class Name',
              content: 'Please try again.',
              type: 'error'
            })
            return;
          }

          // Show success popover
          showPopover({
            domEl: nameInput,
            title: 'Class Name Changed',
            content: `<span class="badge text-bg-dark">${className}</span> is assigned to <span class="badge text-bg-dark">Class ${classId}</span>.`,
            type: 'success'
          });
          
        });

      }

    });

    // Color input group element
    const colorInputGroup = document.createElement('div');
    colorInputGroup.classList.add('input-group', 'input-group-sm');

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.classList.add('form-control', 'form-control-color');
    colorInput.value = classColor;
    colorInput.id = 'color-' + idText + idSuffix ;
    colorInput.setAttribute('colorspace', 'display-p3');
    colorInput.required = true;

    // Text for color within input group element
    const colorText = document.createElement('span');
    colorText.classList.add('input-group-text')
    colorText.textContent = 'Color';
    
    const validColorEl = document.createElement('div');
    validColorEl.classList.add('valid-feedback');
    validColorEl.textContent = 'Looks good!';

    const invalidColorEl = document.createElement('div');
    invalidColorEl.classList.add('invalid-feedback');
    invalidColorEl.textContent = 'Please pick a color.';
    
    // TODO: make sure to NOT duplicate event listeners
    // Prevent clashes with hotkeys when user is typing
    nameInput.addEventListener('focus', Player.userIsTyping);
    nameInput.addEventListener('blur', Player.userStoppedTyping);

    // Display the color change immediately
    colorInput.addEventListener('change', async () => {
      const response = await Player.setClassColor(classId, colorInput.value);
      const newColor = Player.getClassColor(classId);
      
      if (!response || !newColor) {
        showAlertToast('Please try again.', 'error', 'Failed to assign color')
        return;
      }

      Player.refreshMainCanvas();

      // Show success
      // <input type="color" class="form-control form-control-color" colorspace="display-p3" value="#563d7c" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Select new class color">

      // showAlertToast(`Color <span class="badge text-bg-dark">${newColor}</span> assigned to <span class="badge text-bg-dark">Class ${classId}</span>`, 'success');
      document.documentElement.style.setProperty('--class-color-text', newColor)
      showPopover({
        domEl: colorInput,
        title: 'Class Color Changed',
        content: `Color <span class="badge class-color-text x-small">${newColor}</span> assigned to <span class="badge text-bg-dark x-small">Class ${classId}</span>.`,
        type: 'success',
        placement: 'right'
      });
      return;

    });
    
    const invalidNameEl = document.createElement('div');
    invalidNameEl.classList.add('invalid-feedback');
    invalidNameEl.textContent = 'Please provide a name.';
    
    const validNameEl = document.createElement('div');
    validNameEl.classList.add('valid-feedback');
    validNameEl.textContent = 'Looks good!';

    const colorCol = document.createElement('div');
    colorCol.classList.add('col');

    // Append DOM elements to this modal
    nameInputGroup.append(nameInput, nameSaveBtn);
    nameCol.append(nameInputGroup,invalidNameEl, validNameEl);
    colorInputGroup.append(colorInput);
    colorCol.append(colorInputGroup, invalidColorEl, validColorEl);
    outerRow.append(labelCol, nameCol, colorCol);
    
    // Append DOM elements to settings modal
    outerEl.append(outerRow);

    // Label tooltip
    const labelTooltip = new bootstrap.Tooltip(labelCol, {
      title: `Name & color of class ${classId}`,
      placement: 'left',
      boundary: document.body
    });

    // Color tooltip
    const colorTooltip = new bootstrap.Tooltip(colorCol, {
      title: `Color of class ${classId}`,
      placement: 'top',

    });


  });

  // Show the class names to indivs assignment button
  btnNameAssign.classList.remove('d-none');

  // Add button for assigning class names to individuals and put it inside a row and a column
  // const rowNameAssign = document.createElement('div');
  // rowNameAssign.classList.add('row');
  // const colNameAssign = document.createElement('div');
  // colNameAssign.classList.add('col', 'd-grid');
  // const btnNameAssign = document.createElement('button');
  // btnNameAssign.classList.add('assign-class-names-to-indivs-btn', 'btn', 'btn-sm', 'btn-outline-secondary');
  // btnNameAssign.textContent = 'Assign class names to individuals';
  // btnNameAssign.role = 'button';
  // btnNameAssign.type = 'button';
  // colNameAssign.append(btnNameAssign);
  // rowNameAssign.append(colNameAssign);
  // outerEl.append(rowNameAssign);

}



/**
 * Add behavior records with keyboard shortcuts
 *  Workflow for adding a new behavior record
 *  1 - Select a subject
 *  2 - Select an action
 *  3.1 - End record without a target
 *  3.2 - Select a target and end record
 *  3.3 - Select an action, end record and start a new record with the same subject
 * @param {Event} event 
 * @returns 
 */
function handleKeyPress (event) {

  // Check if the main video is loaded
  const mainPlayer = Player.getMainPlayer();
  if (!mainPlayer) return;

  // Check if the shortcuts exist
  const hotkeys = Hotkey.getAll();
  if (!hotkeys) return;

  // Get the selected Hotkey object
  const selectedHotkey = Hotkey.getSelected(event);
  if (!selectedHotkey) return;

  // Check if the selected Hotkey has the playback category
  if (selectedHotkey.category === 'playback') {
    selectedHotkey.execute();
    return;
  }

  // Check if the selected Hotkey is for toggling labeling or drawing
  if (selectedHotkey.name === 'toggleLabeling') {
    selectedHotkey.execute();
    return;
  }

  if (selectedHotkey.name === 'toggleDrawing') {
    selectedHotkey.execute();
    return;
  }

  if (selectedHotkey.name === 'takeSnapshot') {
    selectedHotkey.execute();
    return;
  }


  // Check if current observation is initialized
  const currentObs = Player.getCurrentObservation();
  if (!currentObs) return;

  // Check if the ethogram is initalized
  const ethogram = mainPlayer.getEthogram();
  if (!ethogram) {
    console.log('No record of behaviors was found!'); 
    return;
  }

  // // Cancel the default action (e.g. for Enter or Space bar or Ctrl+Z)
  // event.preventDefault();

  // Get the undo Hotkey
  const undoHotkey = Hotkey.findOne({category: 'labeling', name: 'undo'});

  // Check if labeling mode is active
  if (Player.isInLabelingMode()) {

    const anyIndividuals = Player.anyIndividuals();
    const anyActions = Player.anyActions();

    // Check if individual names and action types are entered
    // Show alerts for missing files
    if (!anyActions && !anyIndividuals) {
      showAlertToast('Please upload files for action types and individuals!', 'warning', 'labeling Disabled');
      return;
    } else if (!anyIndividuals) {
      showAlertToast('Please upload a file for individuals!', 'warning', 'labeling Disabled');
      return;
    } else if (!anyActions) {
      showAlertToast('Please upload a file for action types!', 'warning', 'labeling Disabled');
      return;
    }

    // ====================
    // 1. Select a subject
    // ====================
    // Check if current observation does not contain a subject
    if (!currentObs.subjectName) {
  
      if (selectedHotkey.category === 'individuals') {
       
        // Pause the player
        mainPlayer.pause();
        
        // Update the current observation - add index, starting time and subject name
        currentObs.update(
          ['index', mainPlayer.getEthogram().getInsertionIndex()],
          ['startFrame', mainPlayer.getCurrentFrame()],
          ['subjectName', selectedHotkey.name]
        );
  
        // Confirm the selection
        const confirmedSubjectName = currentObs.subjectName;
        if (confirmedSubjectName) {
  
          // Show notification
          showAlertToast(
            'Now, choose an action!', 
            'success', 
            `Selected Subject: ${confirmedSubjectName}`
          );
  
        }
      
      }
  
    // ======================
    // 2. Select an action
    // ======================
    // Check if current observation contains a subject but not an action
    } else if (currentObs.subjectName && !currentObs.action) {
    
      // Check for undo hotkey
      if (undoHotkey.isPressed(event)) {
        // Reset the last selection
        currentObs.undo();
        
        // Confirm the undo action
        const confirmedSubject = currentObs.subjectName;
        if (confirmedSubject === null) {
          // Show notification
          showAlertToast('Now, you may select another subject.', 'success', 'Subject Selection Removed');
  
        }
  
        return;
  
      }

      // Check if pressed key corresponds to one of hotkeys for actions
      if (selectedHotkey.category === 'actions') {
        // Get the selected action
        const selectedAction = selectedHotkey.name;
  
        // Update the current observation - add action label
        currentObs.update(['action', selectedAction]);
    
        // Confirm the selection
        const confirmedAction = currentObs.action;
        if (confirmedAction) {
  
          // Show notification
          showAlertToast(
            'Now, either end this observation or choose a target or another action.', 
            'success', 
            `Selected action: ${confirmedAction}`
          );
  
        }
        
  
      }
    
  
    // ======================
    // 3. Select a target or end the observation immediately or select another action for the same subject
    // ======================
    // Check if current observation contains a subject, an action but not a target
    } else if (currentObs.subjectName && currentObs.action && !currentObs.targetName) {
    
      // Check for undo
      if (undoHotkey.isPressed(event)) {
        // Reset the last selection
        currentObs.undo();
        // currentObs.update(['action', null]);
  
        // Confirm the undo action
        const confirmedAction = currentObs.action;
        if (confirmedAction === null) {
          // Show notification
          showAlertToast('Now, you may select another action.', 'success', 'Action Selection Removed');
  
        }
  
        return;
  
      }
  
      // ====================
      // 3.1. End the observation directly without a target
      // ====================
      // Check if pressed key corresponds to the shortcut for ending an observation
      if (selectedHotkey.name === 'endObservation') {
        // Add the ending time for the current observation
        currentObs.update(['endFrame', mainPlayer.getCurrentFrame()]);
  
        // Add the observation to the ethogram
        ethogram.add(currentObs);
  
        // Write new observation to the file
        // TODO
  
        // Update the observation table visually
        addEthogramRow(currentObs);
        
        // Show notification
        showAlertToast(
          `<span class="badge text-bg-secondary">Record ${currentObs.get('index')}</span>: <span class="badge text-bg-primary">${currentObs.subjectName}</span>-<span class="badge text-bg-dark">${currentObs.action}</span>`,
          'success', 
          `Observation Recorded`

        );
  
        // Clear the current observation (i.e. set subject and action to null)
        Player.resetCurrentObservation();
  
      // Check for either target or action selection - (3.2 or 3.3)
      } else {
        
        // Initialize the selected target as null 
        let selectedTarget;
        
        // Check if box is selected as target
        if (selectedHotkey.name === 'boxSelection') {
          selectedTarget = 'Box';
  
        // Check if pressed key corresponds to one of the hotkeys for individuals
        } else if (selectedHotkey.category === 'individuals') {
          selectedTarget = selectedHotkey.name;
  
        }
  
        // ====================
        // 3.2. Select a target and end the observation
        // ====================
        // If a target is chosen, 
        //  add it to the current observation and
        //  end the current observation and 
        //  wait for a start of a new observation (subject selection)
        if (selectedTarget) {
          // Update the current observation - add target name and ending time
          currentObs.update(
            ['targetName', selectedTarget], 
            ['endFrame', mainPlayer.getCurrentFrame()]
          );
  
          // Confirm the selection
          const confirmedTargetName = currentObs.targetName;
          if (confirmedTargetName) {
            
            // Add the observation to the ethogram
            if (ethogram.add(currentObs)) {
              
              // Update the HTML table for the ethogram
              addEthogramRow(currentObs);
  
              // Show notification
              showAlertToast(
                `<span class="badge text-bg-secondary">Record ${currentObs.index}</span>: <span class="badge text-bg-primary">${currentObs.subjectName}</span>-<span class="badge text-bg-dark">${currentObs.action}</span>-<span class="badge text-bg-success">${currentObs.targetName}</span>`,
                'success', 
                `Observation Recorded`,
              );
      
            }  
            
          }
  
          // Reset the current observation
          Player.resetCurrentObservation();
  
        // ======================
        // 3.3. Select an action
        //  End the current observation
        //  Start a new observation with the same subject
        // =======================
        } else {
          // If no target is selected, check if the pressed key corresponds to one of the shortcuts for actions
          if (selectedHotkey.category === 'actions') {
    
            const newAction = selectedHotkey.name;
    
            // Update the current observation
            currentObs.update(['endFrame', mainPlayer.getCurrentFrame()]);
    
            const subjectName = currentObs.subjectName;
            const previousAction = currentObs.action;
    
            // Add the observation to the ethogram
            if (ethogram.add(currentObs)) {
              // Update the HTML table for ethogram
              addEthogramRow(currentObs);
              
              // Reset the current observation
              Player.resetCurrentObservation();

              // Add a new observation with the same subject name and action 
              const newObs = Player.getCurrentObservation();
              newObs.update(
                ['index', mainPlayer.getEthogram().getInsertionIndex()],
                ['startFrame', mainPlayer.getCurrentFrame()],
                ['subjectName', subjectName],
                ['action', newAction]
              );

              // Show notification
              showAlertToast(
                `New observation: <strong>${subjectName}-${newAction}.</strong><br>Now, either end this observation, choose a target or another action.`,
                'success', 
                `Observation with ID ${currentObs.index} recorded: ${subjectName}-${previousAction}`
              );

            }
    
          }
  
        }
      
      }
    
    }

  }

}


/**
 * Highlights selected individuals or objects
 * @param {Array} selectedBoxes | Selected box array for in current frame
 */
function highlightBoxes (selectedBoxes) {
  // Offset in pixels for highlight rectangles
  const offset = 0;

  const mainCanvas = Player.getMainPlayer().getCanvas();
  if (mainCanvas && mainCanvas.getContext) {
    const ctx = mainCanvas.getContext('2d')
    selectedBoxes.forEach(box => {
      ctx.beginPath();
      ctx.strokeStyle = 'yellow';
      ctx.lineWidth = 6;
      ctx.rect(box.x + offset, box.y + offset, box.width, box.height);
      ctx.stroke();
    });
  }
}
/**
 * Show individual names and associated keyboard shortcuts
 * @param {Array}
 */
function showNamesModal() {
  const modalEl = document.getElementById('names-list-modal');
  const nameArr = Player.getIndividualNames(); // Get names of individuals
  if (modalEl && nameArr) {
    // Get shortcuts for individual names
    const shortcuts = Player.getHotkeys();

    const divEl = modalEl.querySelector('#names-list-container');
    
    if (divEl) {
      // Clear previous elements
      while (divEl.firstChild) {
        divEl.removeChild(divEl.firstChild);
      }

      // Create a list element
      const listEl = document.createElement('ul');
      listEl.classList.add('list-group', 'list-group-flush', 'small', 'mb-3');
      
      // Populate the list with names
      for (const name of nameArr) {
        const itemEl = document.createElement('li');
        itemEl.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
        itemEl.textContent = name;
        
        // Add hotket to the list if available
        if (shortcuts && name in shortcuts.individuals) {
          const hotkey = shortcuts.individuals[name].hotkey;
          const hotkeyEl = document.createElement('kbd');
          hotkeyEl.textContent = hotkey;
          itemEl.append(hotkeyEl);
        }

        listEl.append(itemEl);
        
      }

      divEl.append(listEl);

      const modalBootstrap = bootstrap.Modal.getOrCreateInstance(modalEl);
      
      modalBootstrap.show();
    }

  }
}

/**
 * Show modal for keyboard shortcuts
 * @param {Object} shortcuts | Keyboard shortcut description and corresponding hotkeys in an object
 */
function showShortcutsModal(shortcuts) {

  const modalEl = document.getElementById('keyboard-shortcuts-list-modal');
  if (modalEl) {
    
    // Get the hotkey categories
    const hotkeyCategories = Hotkey.getUniqueCategories();

    // Prevent hotkey change by user for the default categories
    // Only allow change for individuals or actions
    const fixedCategories = Hotkey.fixedCategories;
    
    // Get the div HTML element inside the modal
    const divEl = modalEl.querySelector('#shortcuts-list-container');

    if (divEl) {
      // Clear the previous elements
      while (divEl.firstChild) {
        divEl.removeChild(divEl.firstChild);
      }

      // Create a list element for each shortcut category
      hotkeyCategories.forEach(category => {

        // Add a title for each category
        const titleEl = document.createElement('h6');
        titleEl.textContent = category.charAt(0).toUpperCase() + category.substring(1); // Capitalize first character

        // Create a list element
        const listEl = document.createElement('ul');
        listEl.classList.add('list-group', 'small', 'mb-3');
 
        // Find all Hotkeys in each category
        const hotkeysInCategory = Hotkey.findAll({category: category});

        // Populate the list within each category
        hotkeysInCategory.forEach(hotkey => {
            
          const itemEl = document.createElement('li');
          
          // Add hotkey item to class list of the element
          itemEl.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
          
          // Add hotkey category and key in shortcut dict to the element dataset
          itemEl.dataset.hotkeyCategory = category;
          itemEl.dataset.hotkeyName = hotkey.name;

          const descDivEl = document.createElement('div');
          descDivEl.textContent = hotkey.description;

          const key = hotkey.key;
          
          const hotkeyEl = document.createElement('span');
          hotkeyEl.classList.add('hotkey-kbd')

          let hotkeyText = `<kbd>${Hotkey.htmlMap.has(key) ? Hotkey.htmlMap.get(key) : key}</kbd>`;
          
          // Check if hotkey is a combination of multiple keys (e.g. Ctrl + m)
          if (hotkey.hasModifiers()) {
            const modifiers = hotkey.modifiers;
            // Replace hotkey string with its corresponding HTML code
            // Put a "+" between hotkey components
            const modifierText = modifiers
              .map(modifier => Hotkey.htmlMap.has(modifier) ? Hotkey.htmlMap.get(modifier) : modifier)
              .map(modifier => `<kbd>${modifier}</kbd>`).join(' + ');

            hotkeyText = modifierText + ' + ' + hotkeyText

          }
            
          // Add the hotkey text
          hotkeyEl.innerHTML = hotkeyText;

          // Put hotkey description, text and edit button into a div
          const btnDivEl = document.createElement('div');

          listEl.setAttribute('data-bs-toggle', 'tooltip');
          listEl.setAttribute('data-bs-title', 'Click on a row to edit its shortcut');
          listEl.setAttribute('data-bs-custom-class', 'hotkey-tooltip'); // For styling the tooltip element

          // Add tooltip to hotkey element only for "individuals" and "actions "categories
          if (!fixedCategories.includes(category)) {
           
            // Make the element clickable and focusable for keydown event
            itemEl.role = 'button';
            itemEl.tabIndex = '-1';

            // Badge to prompt user for inputting a hotkey
            const badgeEl = document.createElement('span');
            badgeEl.classList.add('badge', 'hotkey-badge', 'text-bg-primary', 'me-2', 'd-none'); // Hide the info badge by default
            badgeEl.textContent = 'Press shortcut or Esc to cancel';

            // https://getbootstrap.com/docs/5.3/components/list-group/#custom-content
            btnDivEl.append(badgeEl, hotkeyEl);

            // Add class name to indicate a user-editable hotkey item
            itemEl.classList.add('hotkey-item');

          } else {
            btnDivEl.append(hotkeyEl);

          }

          // Add the item to the list
          itemEl.append(descDivEl, btnDivEl);
          listEl.append(itemEl);


        });

        divEl.append(titleEl, listEl);
        
      });

    }
    
    // Initialize tooltips
    modalEl.querySelectorAll('.list-group').forEach(tooltipTriggerEl => {
      const tooltip = bootstrap.Tooltip.getOrCreateInstance(tooltipTriggerEl);
    });

    // Handle changing hotkeys
    const hotkeyItemEls = modalEl.querySelectorAll('.hotkey-item');
    hotkeyItemEls.forEach(itemEl => itemEl.removeEventListener('click', Hotkey.handleHotkeyChangeByUser));
    hotkeyItemEls.forEach(itemEl => itemEl.addEventListener('click', Hotkey.handleHotkeyChangeByUser));

    // Handle cancellation of hotkey assignment
    hotkeyItemEls.forEach(itemEl => itemEl.removeEventListener('blur', Hotkey.handleHotkeyItemBlur));
    hotkeyItemEls.forEach(itemEl => itemEl.addEventListener('blur', Hotkey.handleHotkeyItemBlur));

    const modalBootstrap = bootstrap.Modal.getOrCreateInstance(modalEl);
    modalBootstrap.show();

  }

}

/**
 * Clears boxes from canvas
 * @param {Array} selectedBoxes | Box array to be cleared with coordinates and dimensions
 */
function clearBoxes (selectedBoxes) {
  // Offset in pixels for highlight rectangles is given
  const offset = 5;
  
  const mainCanvas = Player.getMainPlayer().getCanvas();
  if (mainCanvas && mainCanvas.getContext) {
    const ctx = mainCanvas.getContext('2d')
    selectedBoxes.forEach(box => {
      ctx.clearRect(box.x + offset, box.y + offset, box.width, box.height);
    });
  }

}



// function camelCaseToWords(camelCaseString) {
//   // Use regex to split camelCaseString into words
//   const wordsArray = camelCaseString.split(/(?=[A-Z])/);
  
//   // Capitalize the first word
//   const firstWord = wordsArray[0].charAt(0).toUpperCase() + wordsArray[0].slice(1);

//   // Uncapitalize the rest
//   const otherWords = wordsArray.slice(1).map(word => word.charAt(0).toLowerCase() + word.slice(1))
  
//   // Join the words with spaces
//   const result = firstWord + ' ' + otherWords.join(' ');

//   return result;
// }

/**
 * Update the HTML element associated with actions or individuals
 * @param {String} category - actions or individuals
 */
function updateHotkeyDomElement(category) {

  if (!category) {
    console.log('Category string must be provided!');
    return;
  }

  const validArgs = ['actions', 'individuals'];

  if (!validArgs.includes(category)) {
    console.log(`Provided argument ${category} is not valid! Category string must be either "actions" or "individuals"!`);
    return;
  }
  
  // Determine the div element id depending on the argument
  const outerDivElId = category === 'individuals' ? 'individual-names-div' : 'action-types-div';
  const outerDivEl = document.getElementById(outerDivElId);
  if (!outerDivEl) return;

  // Clear previous elements
  while (outerDivEl.firstChild) {
    outerDivEl.removeChild(outerDivEl.firstChild);
  }

  // Get the all Hotkeys for a category
  const hotkeyArr = Hotkey.findAll({ category: category });

  // Create a list element
  const listEl = document.createElement('ul');
  listEl.classList.add('list-group', 'list-group-flush', 'small', 'lh-1');

  // Add a tooltip to the list element
  listEl.setAttribute('data-bs-toggle', 'tooltip');
  listEl.setAttribute('data-bs-title', 'Click on a row to edit its shortcut');
  listEl.setAttribute('data-bs-custom-class', 'hotkey-tooltip'); // For styling the tooltip element

  hotkeyArr.forEach(hotkey => {
    
    // Populate the list with Hotkey descriptions and keys
    const itemEl = document.createElement('li');
    itemEl.classList.add('list-group-item', 'hotkey-item', 'justify-content-between', 'align-items-center', 'd-flex');
    // itemEl.classList.add('focus-ring', 'text-decoration-none', 'd-inline-flex');  // Custom focus ring

    // Add hotkey category and key in shortcut dict to the element dataset
    itemEl.dataset.hotkeyCategory = hotkey.category;
    itemEl.dataset.hotkeyName = hotkey.name;
    const hotkeyEl = document.createElement('span');
    hotkeyEl.classList.add('hotkey-kbd');
    
    // Add modifiers if any exists
    let modifierHtml; 
    if (Array.isArray(hotkey.modifiers) && hotkey.modifiers.length > 0 ) {
      modifierHtml = hotkey.modifiers
      .map(modifier => `<kbd>${modifier}</kbd>`)
      .join(hotkey.modifiers.length > 1 ? '+' : '');
    }
    const keyHtml = `<kbd>${hotkey.key}</kbd>`;
    hotkeyEl.innerHTML = modifierHtml ? `${modifierHtml} + ${keyHtml}`: keyHtml; // Add the key value of the hotkey
    
    // Make the element clickable and focusable for keydown event
    itemEl.role = 'button';
    itemEl.tabIndex = '-1';

    // Add individual names to the description element
    const descDivEl = document.createElement('div');
    descDivEl.textContent = hotkey.description;

    // Badge to prompt user for inputting a hotkey
    const badgeEl = document.createElement('span');
    badgeEl.classList.add('badge', 'hotkey-badge', 'text-bg-primary', 'me-2', 'd-none'); // Hide the info badge by default
    badgeEl.textContent = 'Press shortcut or Esc to cancel';

    // Put hotkey description, text and edit button into a div
    // https://getbootstrap.com/docs/5.3/components/list-group/#custom-content
    const btnDivEl = document.createElement('div');
    btnDivEl.append(badgeEl, hotkeyEl);

    // Add the child elements to their parent elements
    itemEl.append(descDivEl, btnDivEl);
    listEl.append(itemEl);
  
    // Add the list element to the DOM
    outerDivEl.append(listEl);

  });

  // Initialize tooltips
  const tooltip = bootstrap.Tooltip.getOrCreateInstance(listEl);
  
  // Handle changing hotkeys
  const hotkeyItemEls = outerDivEl.querySelectorAll('.hotkey-item');
  hotkeyItemEls.forEach(itemEl => itemEl.removeEventListener('click', Hotkey.handleHotkeyChangeByUser));
  hotkeyItemEls.forEach(itemEl => itemEl.addEventListener('click', Hotkey.handleHotkeyChangeByUser));

  // Handle cancellation of hotkey assignment
  hotkeyItemEls.forEach(itemEl => itemEl.removeEventListener('blur', Hotkey.handleHotkeyItemBlur));
  hotkeyItemEls.forEach(itemEl => itemEl.addEventListener('blur', Hotkey.handleHotkeyItemBlur));

    



}


/**
 * Return a random letter/number which is not in the input array
 * @param {Array} charArr 
 * @returns 
 */
function getRandomLetterNotIn(charArr) {
  const alphabetLower = "abcdefghijklmnopqrstuvwxyz";
  const alphabetUpper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = '0123456789';
  let letter;

  
  const charSet = new Set(charArr);
  
  // Try to use the lower alphabet
  if (![...alphabetLower].every((element) => charSet.has(element))) {
     do {
      letter = alphabetLower.charAt(Math.floor(Math.random() * alphabetLower.length));
    } while (charArr.includes(letter));

    // If lower alphabet is used up, try to use upper alphabet
  } else if (![...alphabetUpper].every((element) => charSet.has(element))){
    do {
      letter = alphabetUpper.charAt(Math.floor(Math.random() * alphabetUpper.length));
    } while (charArr.includes(letter));

    // If no char is available, try to use digits
  } else if (![...digits].every((digit => charSet.has(digit)))) {
    do {
      letter = digits.charAt(Math.floor(Math.random() * digits.length));
    } while (charArr.includes(letter));
  }

  return letter;
}

function showHelpModal(markdownPath) {
  const modalEl = document.getElementById('help-modal');
  const modalBootstrap = bootstrap.Modal.getOrCreateInstance(modalEl);

  // Populate the table of contents with the section title in the help menu
  // Get the table of contents (TOC) element
  const outerNav = modalEl.querySelector('#help-toc');
  if (!outerNav) return;

  const tocEl = outerNav.querySelector('nav');
  if (!tocEl) return;

  // Get the header element for each help item
  const helpItemEls = modalEl.querySelectorAll('.help-item');

  // Clear the TOC element contents before updating them
  while (tocEl.firstChild) {
    tocEl.removeChild(tocEl.firstChild);
  }

  // For each help item 
  helpItemEls.forEach(helpItem => {
    // Check if each item has a valid title
    const titleEl = helpItem.querySelector('h5');
    if (!titleEl) return;
    
    // Create a new link element in TOC for each help item
    const tocItem = document.createElement('a');
    // tocItem.classList.add('list-group-item', 'list-group-item-action');
    tocItem.classList.add('nav-link');

    // Copy the ID of each help item into the its corresponding toc element's href attribute
    tocItem.href = '#' + helpItem.id;

    // Copy the title of each section to its corresponding toc element's text content
    tocItem.textContent = titleEl.textContent;

    // Append the newly created link element to the TOC element
    tocEl.appendChild(tocItem);

    // Check if it contains subitems
    const subitems = helpItem.querySelectorAll('.help-subitem');
    if (subitems) {
      const tocSubNav = document.createElement('nav');
      tocSubNav.classList.add('nav', 'nav-pills', 'flex-column');
      
      subitems.forEach(subitem => {
        const tocSubitem = document.createElement('a');
        tocSubitem.classList.add('nav-link', 'ms-3', 'my-1');
        tocSubitem.href = '#' + subitem.id
        tocSubitem.textContent = subitem.textContent;

        tocSubNav.appendChild(tocSubitem);

      });
      tocEl.appendChild(tocSubNav);
    }


    

  });

  modalBootstrap.show();

  const dataSpyList = document.querySelectorAll('[data-bs-spy="scroll"]')
  dataSpyList.forEach(dataSpyEl => {
    bootstrap.ScrollSpy.getOrCreateInstance(dataSpyEl).refresh()
    console.log(dataSpyEl);
  });

  // Convert markdown to HTML

  // Convert headers (#) in markdown to <h1...h6> HTML tags


}

/**
 * Add empty table info text when a table is empty
 * @param {Element} tableEl - table DOM element
 * @param {String} infoText - empty info string
 */
function addInfoRow(tableEl, infoText) {
  const tableBody = tableEl.querySelector('tbody');
  const tableHead = tableEl.querySelector('thead');
  if (tableBody && tableHead) {
    const infoRow = tableBody.querySelector('.empty-table-info');
    if (!infoRow) {
      const newRow = tableBody.insertRow(0);
      newRow.classList.add('empty-table-info');
      const newCell = newRow.insertCell(0);
      console.log('tableHead cells:', tableHead.rows[0].cells.length)
      const colNum = tableHead.rows[0].cells.length; // Get the column count in the header
      newCell.colSpan = colNum;
      newCell.textContent = infoText;
      return newRow;

    }

  }

}

/**
 * Shows the spinner element on the main video title bar to indicate an ongoing process
 */
function showProcessIndicator() {
  showOrHideSpinner('show');
}



/**
 * Hides the spinner element on the main video title bar to indicate an ongoing process
 */
function hideProcessIndicator() {
  showOrHideSpinner('hide');
}


/**
 * @param {String} visibility | Use 'show' to show spinner, otherwise hide it
 */
function showOrHideSpinner(visibility) {
  const shouldShow = visibility ? visibility === 'show' : false;

  // Get indicator element on the main view to show loading progress 
  // for file processing, video loading, etc.
  const indicatorBtn = document.getElementById('loading-indicator-btn');
  if (shouldShow) {
    document.body.classList.add('progress-cursor'); // Change cursor style to progress everywhere
    if (indicatorBtn) indicatorBtn.classList.remove('invisible');
  } else {
    document.body.classList.remove('progress-cursor');  // Change cursor style to back to default everywhere
    if (indicatorBtn)indicatorBtn.classList.add('invisible');
  }

}


/**
 * Show success if editted tracking file copied to export directory
 * by changing the relevant icon on tracking table
 * @param {Boolean} isSaved | true if tracking edits saved successfully, false otherwise
 */
function showTrackingSaveStatus(isSaved) {

    const trackingSaveStatusBtn = document.getElementById('tracking-save-status-btn');
    const iconEl = trackingSaveStatusBtn.querySelector('span');
    
    if (trackingSaveStatusBtn && iconEl) {
      
      // Get the tooltip
      const tooltip = bootstrap.Tooltip.getInstance(trackingSaveStatusBtn);
      
      if (isSaved) {
        trackingSaveStatusBtn.classList.remove('d-none');
        iconEl.classList.remove('text-danger');
        iconEl.classList.add('text-success');
        iconEl.textContent = 'done_all';
        tooltip.setContent({ '.tooltip-inner': 'Changes saved!' }); // Change the tooltip
      } else {
        iconEl.textContent = 'error';
        iconEl.classList.remove('text-success');
        iconEl.classList.add('text-danger');
        tooltip.setContent({ '.tooltip-inner': 'Changes unsaved!' }); // Change the tooltip

      }



    }

}

/**
 * Example starter JavaScript for disabling form submissions if there are invalid fields
 */
function validateInputs() {

  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  const forms = document.querySelectorAll('.needs-validation')

  // Loop over them and prevent submission
  Array.from(forms).forEach(form => {
    const confirmBtn = form.querySelector('.confirm-btn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', async (e) => {
        if (!form.checkValidity()) {
          e.preventDefault();
          e.stopPropagation();
        }

        // Check if username is valid
        if (confirmBtn.id.includes('username')) {
          const usernameInputEl = form.querySelector('#username-input');
          const username = usernameInputEl ? usernameInputEl.value : null;
          if (username) {
  
            // Save username to config
            Config.username = username;
            const response = await Config.saveToFile();
  
            // Confirm the save
            if (response) {
  
              // Save username to Player class
              Player.setUsername(username);
              
              // Update setting menu
              const usernameSettingsEl = document.getElementById('change-username-input');
              if (usernameSettingsEl) {
                usernameSettingsEl.value = username;
              }
  
              // Hide the modal
              const bootstrapModal = bootstrap.Modal.getOrCreateInstance('#username-modal');
              bootstrapModal.hide();
  
              // Show success notification
              showAlertToast(`Username <span class="badge text-bg-info">${username}</span> saved!`, 'success');
  
            }
  
          }

        }

        // Validate the form
        form.classList.add('was-validated');

      }, false);

    }

  });

}


/**
 * Creates a string for a given time difference value in human readable format.
 * E.g. if the difference is 30 minutes, returns "30 minutes ago".
 * @param {Number | Date} timeInMilliseconds - Time difference in milliseconds
 * @returns {String} 
 */
function getTimeDifference(timeInMilliseconds) {

  // Convert milliseconds to seconds, minutes, hours and days
  const seconds = Math.floor(timeInMilliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const dayText = days > 1 ? 'days' : 'day';
    return  `${days} ${dayText} ago`;
  } else if (hours > 0) {
    const hourText = hours > 1 ? 'hours' : 'hour';
    return  `${hours} ${hourText} ago`;
  } else if (minutes > 0) {
    const minuteText = minutes > 1 ? 'minutes' : 'minute';
    return  `${minutes} ${minuteText} ago`;
  } else {
    return 'Just now';
  }

}


/**
 * Shows last modified time of a file on its corresponding HTML element
 * @param {import('original-fs').PathLike} filePath File path 
 * @param {String} domElId DOM element ID which contains save status button and last edit time info element
 * @param {Boolean | undefined} isFailed - True if writing ethogram to file has been failed, False otherwise
 * @returns 
 */
async function showLastEditForFile(filePath, domElId, isFailed) {

  if (!domElId) return;
  
  const outerEl = document.getElementById(domElId);
  if (!outerEl) return;
  
  const statusBtn = outerEl.querySelector('.save-status-btn');
  if (!statusBtn) return;
  
  const iconEl = statusBtn.querySelector('span');
  if (!iconEl) return;
  
  const mainPlayer = Player.getMainPlayer();
  if (!mainPlayer) return;

  // const ethogram = mainPlayer.getEthogram();
  // if (!ethogram) return;
  
  // Show tooltip over save status element
  const tooltip = bootstrap.Tooltip.getOrCreateInstance(statusBtn);

  // Change the icon of the button if edit has been failed
  if (isFailed || !filePath) {
    // Change the tooltip content
    tooltip.setContent({'.tooltip-inner': 'Save failure!'});
    iconEl.textContent = 'unpublished';
    iconEl.classList.remove('text-success');
    iconEl.classList.add('text-danger');

    // Don't progress if it is failed
    return;

  }

  // Reset the icon and color to "success" by default
  if (!isFailed) {
    const iconEl = statusBtn.querySelector('span');
    iconEl.textContent = 'published_with_changes';
    iconEl.classList.remove('text-danger');
    iconEl.classList.add('text-success');

    // Change the tooltip content
    tooltip.setContent({'.tooltip-inner': 'All saved!'});

  }

  // Get the HTML element for displaying the last modified time
  const lastModTimeEl = outerEl.querySelector('.last-edit-time');

  if (!lastModTimeEl) return;

  // Get the last modified time of the file
  const lastModTime = await window.electronAPI.getLastModifiedTime(filePath);

  // Show the time difference
  lastModTimeEl.textContent = getTimeDifference(Date.now() - lastModTime);

  // Display the DOM element
  outerEl.classList.remove('invisible');
  outerEl.classList.add('visible');

  // // Hide the indicator if there is no observation 
  // if (ethogram.size() < 1) {
  //   statusBtn.classList.add('d-none');
  // } else {
  //   statusBtn.classList.remove('d-none');
  // }

  
}

/**
 * Makes a DOM element draggable
 * From: https://www.w3schools.com/howto/howto_js_draggable.asp
 * @param {Element} el 
 */
function dragElement(el) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

  el.onmousedown = dragMouseDown;

  // const mainCanvas = document.getElementById('main-tracking-canvas');

  function dragMouseDown(e) {
    // if (e.composedPath().includes(mainCanvas)) {
    //   console.log('mousemove over main canvas');
    //   return;
    // }

    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    // if (e.composedPath().includes(mainCanvas)) {
    //   console.log('mousemove over main canvas');
    //   return;
    // }

    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    el.style.top = (el.offsetTop - pos2) + "px";
    el.style.left = (el.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    /* stop moving when mouse button is released:*/
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

/**
 * Gets the user confirmation on alert modal
 * @param {Element} buttonEl DOM element for confirmation button
 * @returns 
 */
function getUserConfirmationOnModal(buttonEl) {
  if (!buttonEl) return;

  return new Promise((resolve) => {

    function handleClick() {
        // Remove the event listener to prevent multiple resolves
        buttonEl.removeEventListener('click', handleClick);
        
        // Resolve the promise
        const confirmed = true;
        resolve(confirmed);
    }

    // Add the event listener to the button
    buttonEl.addEventListener('click', handleClick);

  });
  
}

/**
 * Converts a (nested) Object to a Map
 * @param {Object} obj 
 * @returns {Map}
 */
function objectToMap(obj) {
  // If not an object or is null, return as is (base case)
  if (typeof obj !== 'object' || obj === null) return obj;

  // If it's already a Map, return as is
  if (obj instanceof Map) return obj;

  // Recursively convert each value if needed
  return new Map(
    Object.entries(obj).map(([key, value]) => [key, objectToMap(value)])
  );
  
}

/**
 * Gets non-repeating random color string/codes
 * @param {Number} numColor Number of color codes to pick
 * @returns {String[]}
 */
function getRandomColors(numColor) {
  if (typeof numColor === 'undefined' || numColor === null) return;
  
  // Check the validity of the input
  const parsedNum = Number.parseInt(numColor);
  if (!Number.isSafeInteger(parsedNum) || parsedNum < 1) return;

  // Define the color palette
  const colorPalette = [
    '#f94f79', '#33ff66', '#587ded', '#fcb56e', 
    '#00ffff', '#cc00ff', '#ffffff', '#ffff66',
    '#ee7dee', '#4e9349', '#395977', '#904c0e'
  ];

  const defaultColor = '#7a7a7aff'; // Default color when there are more classes than the size of the color palette

  const resultArr = [];
  for (let i = 0; i < parsedNum; i++) {
    // Get the color from the color palette and assign the default color if color palette is too small
    resultArr.push(colorPalette[i] ?? defaultColor);
  }

  return resultArr;


}

export {
  getFrameFromVideo, 
  // createSecondaryVideoDivs,  
  updateInteractionTable,
  updateTracksFromToast, 
  updateTracksFromNameDropdown,
  formatSeconds, 
  minutesToFrames,
  formatMinutes,
  secondsToFrames,
  framesToSeconds,
  getFileNameWithoutExtension,
  showAlertModal,
  showAlertToast,
  hideAlertModal,
  addEthogramRow,
  completeActionRow,
  updatePlaybackRateList,
  updateZoomScaleDomEls,
  handleKeyPress,
  showShortcutsModal,
  showHelpModal,
  showOverlappingTracksToast,
  showNamesModal,
  getRandomLetterNotIn,
  clearEthogramTable,
  clearTrackingTable,
  addInfoRow,
  showTrackingSaveStatus,
  produceLabelText,
  updateHotkeyDomElement,
  handleBehaviorRecordByClick,
  showToastForBehaviorRecording,
  validateInputs,
  getTimeDifference,
  showLastEditForFile,
  loadSecondaryVideos,
  dragElement,
  getUserConfirmationOnModal,
  showPopover,
  showProcessIndicator,
  hideProcessIndicator,
  getRandomColors,
  updateClassEls
}
