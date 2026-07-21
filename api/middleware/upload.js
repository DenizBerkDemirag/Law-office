const multer = require("multer");
const path = require("path");
const fs = require("fs");

// İzin verilen dosya tipleri
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Her davanın belgeleri kendi dosya no'suna göre ayrı klasörde
    const caseId = req.params.id;
    const uploadDir = path.join(__dirname, "..", "uploads", caseId);

    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Benzersiz dosya adı: timestamp + orijinal uzantı
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

function fileFilter(req, file, cb) {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(null, true);
  }
  cb(
    new Error(
      "Desteklenmeyen dosya tipi. Sadece JPEG, PNG, WEBP ve PDF yükleyebilirsiniz.",
    ),
  );
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

module.exports = upload;
