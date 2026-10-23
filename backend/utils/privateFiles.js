const path = require('path');

const uploadDir = path.resolve(__dirname, '../uploads');

function resolveUploadPath(storedUrl) {
  if (typeof storedUrl !== 'string' || !storedUrl || storedUrl.includes('\0')) {
    throw new TypeError('Invalid stored upload path');
  }

  const filename = storedUrl.startsWith('/uploads/')
    ? storedUrl.slice('/uploads/'.length)
    : storedUrl;

  if (!filename || filename !== path.basename(filename) || filename === '.' || filename === '..') {
    throw new TypeError('Invalid stored upload path');
  }

  const resolvedPath = path.resolve(uploadDir, filename);
  const relativePath = path.relative(uploadDir, resolvedPath);
  if (!relativePath || relativePath === '..' || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath)) {
    throw new TypeError('Upload path escapes upload directory');
  }

  return resolvedPath;
}

module.exports = { uploadDir, resolveUploadPath };
