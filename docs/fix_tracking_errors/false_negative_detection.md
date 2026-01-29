---
title: False Negative Detection
parent: Fixing Tracking and Identification Errors
nav_order: 1
---

# False Negative Detection
{: .no_toc}

## Table of Contents
{: .no_toc .text-delta }

- TOC
{:toc}


If a subject is not detected by tracking, you can fix it by drawing a bounding box around the undetected subject. The same procedure can also be used if you want to produce a tracking file for a video from scratch. 

## Drawing Bounding Boxes

First enable the drawing mode.

<video src="/assets/videos/drawing_mode_toggle.mp4" class="help-video" muted loop autoplay></video>

Draw a rectangle around the subject of interest. A menu with input option will appear next to the rectangle you just draw.
                    
Assign a class to the bounding box by either selecting an existing one or creating a new one. Optionally, change the pre-assigned color for the newly created class. 

<video src="/assets/videos/drawing_single_box.mp4" class="help-video" muted loop autoplay></video>

You can opt to a create single bounding box for the current video frame or interpolate multiple boxes between two video frames.
                    
If you wish to create a single bounding box, first make sure the <strong>Interpolate</strong> option is deselected. Then, click <strong>Save</strong> to confirm your choice. 

## Interpolation

To interpolate multiple bounding boxes, make sure the <strong>Interpolate</strong> option is selected and click <strong>Save</strong> to proceed.

<video src="/assets/videos/interpolation.mp4" class="help-video" muted loop autoplay></video>

Skip backward or forward to the frame where you wish the interpolation to continue. If you wish to end the interpolation here, click <strong>End</strong>.

If you wish to continue the interpolation with the same class and track ID, click <strong>Continue</strong>. Then, repeat the previous step until you reach to the frame where the interpolation should end. Finally, click <strong>End</strong> to complete the interpolation.

You can review the interpolated bounding boxes and correct any of them later by resizing if necessary.

<video src="/assets/videos/review_interpolation.mp4" class="help-video" muted loop autoplay></video>
