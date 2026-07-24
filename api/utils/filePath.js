const path = require("path");
const fs = require("fs");

/**
 * Veritabanında saklanan dosya yolunu (mutlak veya göreceli, eski klasör yapısı dahil) 
 * mevcut sunucudaki güncel mutlak dosya yoluna dönüştürür.
 * 
 * @param {string} storedPath - Veritabanındaki FilePath değeri
 * @returns {string|null} Bulunursa mutlak yol, bulunamazsa null
 */
function getAbsoluteFilePath(storedPath) {
  if (!storedPath) return null;

  // 1. Yol doğrudan mevcutsa (aynı bilgisayar ve aynı klasör yapısı)
  if (fs.existsSync(storedPath)) {
    return path.resolve(storedPath);
  }

  // 2. Proje dizini taşınmış/yeniden adlandırılmışsa ("uploads" sonrasını al)
  const uploadsIdx = storedPath.indexOf("uploads");
  if (uploadsIdx !== -1) {
    const relPath = storedPath.substring(uploadsIdx);
    // api ana dizinine göre yolu çöz
    const apiRootDir = path.resolve(__dirname, "..");
    const resolvedPath = path.resolve(apiRootDir, relPath);
    if (fs.existsSync(resolvedPath)) {
      return resolvedPath;
    }
  }

  return null;
}

module.exports = { getAbsoluteFilePath };
