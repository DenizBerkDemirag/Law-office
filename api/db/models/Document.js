const mongoose = require("mongoose");

const { Schema } = mongoose;

const schema = new Schema(
  {
    Uye: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    Dava: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Case",
      required: true,
    },
    FileName: {
      type: String,
      required: true,
    },
    FilePath: {
      type: String,
      required: true,
    },
  },
  {
    versionKey: false,
    timestamps: {
      createdAt: "UploadedAt",
    },
  },
);

class Document extends mongoose.Model {}

// Document class ı oluşturuldu ve mongoose.Model sınıfından türetildi. Bu, Document modelinin mongoose'un sağladığı tüm özellikleri ve yöntemleri kullanabileceği anlamına gelir.

schema.loadClass(Document);

// Document sınıfı, schema'ya yüklendi. Bu, Document sınıfının tanımladığı yöntemlerin ve özelliklerin schema ile ilişkilendirilmesini sağlar.
// Çünkü schema sadece veri yapısını tanımlar, ancak sınıf yöntemleri (fonksiyonları) ve özellikleri eklemek için loadClass kullanılır.

module.exports = mongoose.model("Document", schema);

// Document modelini mongoose.model() ile oluşturuyoruz ve "Document" adını veriyoruz. Bu, MongoDB'de "documents" koleksiyonuna karşılık gelir.
// Document modelini dışa aktarıyor. Bu, diğer dosyaların bu modeli kullanabilmesini sağlar.
