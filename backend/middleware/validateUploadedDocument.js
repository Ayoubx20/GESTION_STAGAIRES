const fs = require('fs').promises;
const path = require('path');

const signatures = {
  '.pdf': (buffer) => buffer.subarray(0, 5).toString('ascii') === '%PDF-',
  '.doc': (buffer) => buffer.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])),
  '.docx': (buffer) => buffer.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))
};

module.exports = async function validateUploadedDocument(req, res, next) {
  if (!req.file) return next();
  let valid = false;
  try {
    const extension = path.extname(req.file.originalname).toLowerCase();
    const check = signatures[extension];
    if (check) {
      const handle = await fs.open(req.file.path, 'r');
      try {
        const buffer = Buffer.alloc(8);
        const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
        valid = bytesRead >= 4 && check(buffer.subarray(0, bytesRead));
      } finally {
        await handle.close();
      }
    }
  } catch {
    valid = false;
  }
  if (!valid) {
    try { await fs.unlink(req.file.path); } catch {}
    return res.status(400).json({ success: false, message: 'Le contenu du fichier ne correspond pas à un document pris en charge.' });
  }
  return next();
};
