const path = require("path");
const fs = require("fs");

/**
 * Converts the file path stored in the database (absolute or relative, including old folder structure) 
 * to the current absolute file path on the existing server.
 * 
 * @param {string} storedPath - FilePath value in the database
 * @returns {string|null} Absolute path if found, null if not found
 */
function getAbsoluteFilePath(storedPath) {
  if (!storedPath) return null;

  // 1. If path exists directly (same computer and same folder structure)
  if (fs.existsSync(storedPath)) {
    return path.resolve(storedPath);
  }

  // 2. If project directory has been moved/renamed (take part after "uploads")
  const uploadsIdx = storedPath.indexOf("uploads");
  if (uploadsIdx !== -1) {
    const relPath = storedPath.substring(uploadsIdx);
    // Resolve path relative to api root directory
    const apiRootDir = path.resolve(__dirname, "..");
    const resolvedPath = path.resolve(apiRootDir, relPath);
    if (fs.existsSync(resolvedPath)) {
      return resolvedPath;
    }
  }

  return null;
}

module.exports = { getAbsoluteFilePath };
