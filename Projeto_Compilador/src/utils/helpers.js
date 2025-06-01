const fs = require("fs-extra");
const crypto = require("crypto");
const logger = require("./logger");

/**
 * Bail out by logging and calling next(err).
 */
function bail(msg, next) {
  const err = new Error(msg);
  logger.error(msg);
  return next(err);
}

/**
 * Bail if condition is true.
 */
function bailIf(condition, msg, next) {
  if (condition) {
    return bail(msg, next);
  }
}

/**
 * Safely parse JSON, bailing on failure.
 */
function safeParseJSON(jsonString, next) {
  try {
    return JSON.parse(jsonString);
  } catch {
    return bail("Invalid JSON payload", next);
  }
}

/**
 * Wrap async controller to auto-catch errors.
 */
function wrapAsync(fn) {
  return function (req, res, next) {
    fn(req, res, next).catch(next);
  };
}

/**
 * Validate a field value with a predicate, bail on failure.
 * @param {*} value
 * @param {Function} predicate (value) => boolean
 * @param {string} msg
 * @param {Function} next
 */
function validateField(value, predicate, msg, next) {
  if (!predicate(value)) {
    return bail(msg, next);
  }
}

/**
 * Ensure a directory exists, bail on error.
 * @param {string} dirPath
 * @param {Function} next
 */
async function ensureDir(dirPath, next) {
  try {
    await fs.ensureDir(dirPath);
  } catch (err) {
    return bail(`Failed to create directory ${dirPath}`, next);
  }
}

/**
 * Compute SHA-256 checksum of a file, bail on error.
 * @param {string} filePath
 * @param {Function} next
 * @returns {Promise<string>}
 */
async function computeChecksum(filePath, next) {
  try {
    const hash = crypto.createHash("sha256");
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .on("data", (data) => hash.update(data))
        .on("error", reject)
        .on("end", resolve);
    });
    return hash.digest("hex");
  } catch (err) {
    bail(`Could not compute checksum for ${filePath}`, next);
  }
}

module.exports = {
  bail,
  bailIf,
  safeParseJSON,
  wrapAsync,
  validateField,
  ensureDir,
  computeChecksum,
};
