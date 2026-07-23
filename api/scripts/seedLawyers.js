require("dotenv").config();

const mongoose = require("mongoose");
const Lawyer = require("../db/models/Lawyer");

const lawyers = [
  {
    Name: "Av. Ahmet Altınbaş",
    Slug: "ahmet-altinbas",
    Title: "Kurucu ve Yönetici Avukat",
    Photo: "/Fotograflar/lawyer_ahmet.jpg",
    Badge: "Ticaret & Şirketler Hukuku",
    About:
      "2005 yılından bu yana ceza hukuku, ticaret hukuku ve iş hukuku alanlarında faaliyet göstermektedir. Müvekkil odaklı yaklaşımı ve stratejik hukuki çözümleri ile sektörde saygın bir konuma sahiptir.",
    Education:
      "İstanbul Üniversitesi Hukuk Fakültesi mezunudur. Yüksek lisansını ticaret hukuku alanında Galatasaray Üniversitesi'nde tamamlamıştır.",
    Expertise: "Ticaret & Şirketler Hukuku",
    Experience: "20+ Yıl",
    Phone: "0212 123 45 67",
    Email: "bilgi@altinbas.com",
  },
  {
    Name: "Av. Elif Yılmaz",
    Slug: "elif-yilmaz",
    Title: "Kıdemli Avukat",
    Photo: "/Fotograflar/lawyer_elif.jpg",
    Badge: "Ceza & Ağır Ceza Hukuku",
    About:
      "2005 yılından bu yana ceza hukuku, ticaret hukuku ve iş hukuku alanlarında faaliyet göstermektedir. Analitik düşünce yapısı ve güçlü savunma stratejileri ile tanınmaktadır.",
    Education:
      "İstanbul Üniversitesi Hukuk Fakültesi mezunudur. Ceza hukuku alanında uzmanlaşmış, pek çok ulusal ve uluslararası seminer ve konferansa katılmıştır.",
    Expertise: "Ceza Hukuku",
    Experience: "20+ Yıl",
    Phone: "0212 123 45 67",
    Email: "bilgi@yilmaz.com",
  },
  {
    Name: "Av. Mehmet Demir",
    Slug: "mehmet-demir",
    Title: "Uzman Avukat",
    Photo: "/Fotograflar/lawyer_mehmet.jpg",
    Badge: "İş & Sosyal Güvenlik Hukuku",
    About:
      "2005 yılından bu yana ceza hukuku, ticaret hukuku ve iş hukuku alanlarında faaliyet göstermektedir. İşçi ve işveren haklarının korunmasında uzmanlaşmış, uzlaşmacı yaklaşımı ile bilinmektedir.",
    Education:
      "İstanbul Üniversitesi Hukuk Fakültesi mezunudur. İş hukuku ve sosyal güvenlik hukuku alanlarında kapsamlı deneyime sahiptir.",
    Expertise: "İş Hukuku",
    Experience: "20+ Yıl",
    Phone: "0212 123 45 67",
    Email: "bilgi@demir.com",
  },
];

async function seedLawyers() {
  try {
    await mongoose.connect(process.env.CONNECTION_STRING);

    for (const data of lawyers) {
      const exists = await Lawyer.findOne({ Slug: data.Slug });
      if (exists) {
        console.log(`"${data.Name}" zaten mevcut, atlanıyor.`);
        continue;
      }
      await Lawyer.create(data);
      console.log(`"${data.Name}" başarıyla oluşturuldu.`);
    }

    console.log("\nSeed tamamlandı.");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedLawyers();
