# DISTRIBUTION.md

# Distribution Process for the Flatpak Package

This document outlines the steps required to distribute the Flatpak package for testing and deployment.

## Prerequisites

Before distributing the Flatpak package, ensure that the following prerequisites are met:

- The Flatpak package has been successfully built using the `scripts/build.sh` script.
- The package is tested and verified using the `scripts/test.sh` script.

## Distribution Steps

1. **Build the Flatpak Package**
   Run the build script to create the Flatpak package:
   ```
   ./scripts/build.sh
   ```

2. **Install Locally for Testing**
   If you want to test the package locally before distribution, use the install script:
   ```
   ./scripts/install-local.sh
   ```

3. **Create a Distribution Directory**
   Organize the built package and any related files in a distribution directory. You can create a directory named `dist` if it doesn't already exist:
   ```
   mkdir -p dist
   ```

4. **Copy the Built Package**
   After building, copy the generated Flatpak package to the `dist` directory. The package file will typically be located in the build output directory. For example:
   ```
   cp path/to/built/package.flatpak dist/
   ```

5. **Generate Sources**
   If your package requires specific sources, ensure that the `generated-sources.json` file is up to date. You can regenerate it using:
   ```
   ./scripts/generate-sources.sh
   ```

6. **Distributing the Package**
   You can distribute the Flatpak package by sharing the `.flatpak` file located in the `dist` directory. Users can install it using the following command:
   ```
   flatpak install --user path/to/package.flatpak
   ```

7. **Publishing to a Repository**
   If you wish to publish the package to a Flatpak repository, follow the repository's guidelines for adding and publishing packages.

## Conclusion

Following these steps will help ensure that your Flatpak package is properly distributed for testing and deployment. For any issues or questions, refer to the other documentation files in the `docs` directory.