---
title: File Formats
nav_order: 2
---
# File Formats

## Name Files
To start labeling behaviors, text files for actions types or ethogram and individual names must be uploaded first. 

Each item in these files must be separated with a comma. For consistency, please do not put a space within an item. For example, if an item in the action list describes a "successful push", write down either "successful_push" or "SuccessfulPush". Other than this, there is no restriction on the names.

## Tracking Files
To create spatially localized annotations of interactions, a tracking file for the main video can be imported into the app. 
The tracking file should either be in simplified or extended MOT Challenge format[^MOTChallenge].

The simplified format consists of a text file with one line per detection containing frame number, object ID, bounding box coordinates (with the top left corner of the bounding box, width and height), detection confidence and object class. 

Alternatively, the extended format additionally includes individual ID and confidence. Such a tracking file can be obtained by processing a video with a multi-animal tracking model such as PriMAT[^PriMAT]. Animal detection and tracking are currently not performed by SILVI but are assumed to be a separate pre-processing step.

---

[^MOTChallenge]: [MOTChallenge: A Benchmark for Single-Camera Multiple Target Tracking](https://doi.org/10.48550/arXiv.2010.07548)

[^PriMAT]: [PriMAT: A robust multi-animal tracking model for primates in the wild](https://doi.org/10.1101/2024.08.21.607881)