# Testing Procedures for the Flatpak Package

This document outlines the testing procedures for the Flatpak package of the SiLVi application. Follow the steps below to ensure that the application functions as expected after building and installing the package.

## Prerequisites

Before testing, ensure that you have completed the following:

1. **Build the Flatpak Package**: Run the build script to create the Flatpak package.
   ```bash
   ./scripts/build.sh
   ```

2. **Install the Flatpak Package Locally**: Use the install script to install the package for testing.
   ```bash
   ./scripts/install-local.sh
   ```

## Running Tests

To verify the functionality of the installed application, execute the following steps:

1. **Run the Test Script**: This script will execute the necessary tests on the installed Flatpak package.
   ```bash
   ./scripts/test.sh
   ```

2. **Manual Testing**: In addition to automated tests, perform manual testing by launching the application and checking the following:
   - Application starts without errors.
   - All main features are accessible and function as intended.
   - No crashes or unexpected behavior during usage.

## Reporting Issues

If you encounter any issues during testing, please document the steps to reproduce the problem and report it to the development team. Include any relevant logs or error messages to assist in troubleshooting.

## Conclusion

Following these testing procedures will help ensure that the SiLVi Flatpak package is stable and ready for distribution.