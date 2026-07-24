const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const fs = require("fs");
const { isAuthenticated, isLawyer } = require("../middleware/auth");
const upload = require("../middleware/upload");
const Case = require("../db/models/Case");
const Document = require("../db/models/Document");
const User = require("../db/models/User");
const Appointment = require("../db/models/Appointment");
const BlockedSlot = require("../db/models/BlockedSlot");
const { getAllTimeSlots } = require("../utils/timeSlots");
const { getAbsoluteFilePath } = require("../utils/filePath");

router.use(isAuthenticated, isLawyer);

async function getDashboardData() {
  const cases = await Case.find().populate("Member").sort({ CreatedAt: -1 });
  const allUsers = await User.find().sort({ Role: 1, Username: 1 });
  const members = allUsers.filter((u) => u.Role === "member");
  const appointments = await Appointment.find()
    .populate("Member")
    .sort({ RequestedDate: 1 });
  const blockedSlots = await BlockedSlot.find().sort({ Date: 1, Time: 1 });

  const caseCountByMember = {};
  cases.forEach((c) => {
    if (c.Member) {
      const id = c.Member._id.toString();
      caseCountByMember[id] = (caseCountByMember[id] || 0) + 1;
    }
  });

  return {
    cases,
    allUsers,
    members,
    appointments,
    blockedSlots,
    caseCountByMember,
    allTimeSlots: getAllTimeSlots(),
  };
}

// ============ DASHBOARD (sade) ============
router.get("/dashboard", async (req, res) => {
  const { memberId, date, sortBy, sortOrder } = req.query;

  const filter = {};
  if (memberId) filter.Member = memberId;
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    filter.CreatedAt = { $gte: startOfDay, $lte: endOfDay };
  }

  const order = sortOrder === "desc" ? -1 : 1;
  let cases = await Case.find(filter).populate("Member");

  if (sortBy === "date") {
    cases.sort((a, b) => (a.CreatedAt - b.CreatedAt) * order);
  } else if (sortBy === "member") {
    cases.sort((a, b) => {
      const nameA = a.Member ? a.Member.Username || a.Member.Email : "";
      const nameB = b.Member ? b.Member.Username || b.Member.Email : "";
      return nameA.localeCompare(nameB, "tr") * order;
    });
  } else {
    cases.sort((a, b) => b.CreatedAt - a.CreatedAt);
  }

  const members = await User.find({ Role: "member" }).sort({ Username: 1 });

  // Sıralama linkleri için hazır URL'leri oluştur
  function buildSortUrl(field) {
    const params = new URLSearchParams();
    if (memberId) params.set("memberId", memberId);
    if (date) params.set("date", date);
    params.set("sortBy", field);
    params.set(
      "sortOrder",
      sortBy === field && sortOrder !== "desc" ? "desc" : "asc",
    );
    return `/lawyer/dashboard?${params.toString()}`;
  }

  // Sıralamayı temizleyip sadece filtreleri koruyan URL
  function buildClearSortUrl() {
    const params = new URLSearchParams();
    if (memberId) params.set("memberId", memberId);
    if (date) params.set("date", date);
    return `/lawyer/dashboard${params.toString() ? "?" + params.toString() : ""}`;
  }

  res.render("lawyer/dashboard", {
    cases,
    members,
    selectedMemberId: memberId || "",
    selectedDate: date || "",
    sortBy: sortBy || "",
    sortOrder: sortOrder || "",
    memberSortUrl: buildSortUrl("member"),
    dateSortUrl: buildSortUrl("date"),
    clearSortUrl: buildClearSortUrl(),
  });
});

// ============ YÖNETİM SAYFASI ============
router.get("/manage", async (req, res) => {
  const data = await getDashboardData();
  res.render("lawyer/manage", data);
});

// ============ KULLANICI / ÜYE EKLEME ============
router.post("/members", async (req, res) => {
  try {
    const { email, password, username, role } = req.body;

    if (!email || !password || !username) {
      const data = await getDashboardData();
      return res.status(400).render("lawyer/manage", {
        ...data,
        error: "Email, şifre ve kullanıcı adı zorunludur.",
      });
    }

    const existingEmail = await User.findOne({ Email: email });
    if (existingEmail) {
      const data = await getDashboardData();
      return res.status(400).render("lawyer/manage", {
        ...data,
        error: "Bu email ile kayıtlı bir kullanıcı zaten var.",
      });
    }

    const existingUsername = await User.findOne({ Username: username });
    if (existingUsername) {
      const data = await getDashboardData();
      return res.status(400).render("lawyer/manage", {
        ...data,
        error: "Bu kullanıcı adı zaten alınmış.",
      });
    }

    const hash = await bcrypt.hash(password, 10);
    const userRole = role === "lawyer" ? "lawyer" : "member";

    await User.create({
      Email: email,
      Password: hash,
      Username: username,
      Role: userRole,
    });

    res.redirect("/lawyer/manage");
  } catch (err) {
    console.error(err);
    const data = await getDashboardData();
    if (err.code === 11000) {
      return res.status(400).render("lawyer/manage", {
        ...data,
        error: "Bu email veya kullanıcı adı zaten kayıtlı.",
      });
    }
    return res.status(500).render("lawyer/manage", {
      ...data,
      error: "Kullanıcı kaydedilirken bir hata oluştu.",
    });
  }
});

// ============ ÜYE SİLME ============
router.post("/members/:id/delete", async (req, res) => {
  try {
    const memberId = req.params.id;
    const force = req.body.force === "true";

    const member = await User.findById(memberId);
    if (!member) return res.status(404).send("Üye bulunamadı.");

    const relatedCases = await Case.find({ Member: memberId });

    if (relatedCases.length > 0 && !force) {
      const data = await getDashboardData();
      return res.status(400).render("lawyer/manage", {
        ...data,
        error:
          "Bu üyenin kayıtlı davaları var. Silmek için onay vermeniz gerekiyor.",
      });
    }

    if (relatedCases.length > 0 && force) {
      for (const caseItem of relatedCases) {
        await Document.updateMany(
          { Case: caseItem._id },
          {
            Archived: true,
            ArchivedAt: new Date(),
            ArchivedCaseFileNumber: caseItem.FileNumber,
            ArchivedCaseSubject: caseItem.Subject,
            ArchivedMemberEmail: member.Email, // ⬅️ üye silinmeden önce yakalandı
            Case: null,
          },
        );
      }
      await Case.deleteMany({ Member: memberId });
    }

    await User.findByIdAndDelete(memberId);
    res.redirect("/lawyer/manage");
  } catch (err) {
    console.error(err);
    const data = await getDashboardData();
    res.status(500).render("lawyer/manage", {
      ...data,
      error: "Üye silinirken bir hata oluştu.",
    });
  }
});


// ============ ÜYE E-POSTA GÜNCELLEME ============
router.post("/members/:id/email", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      const data = await getDashboardData();
      return res.status(400).render("lawyer/manage", {
        ...data,
        error: "E-posta adresi boş olamaz.",
      });
    }

    const existing = await User.findOne({
      Email: email.toLowerCase(),
      _id: { $ne: req.params.id },
    });
    if (existing) {
      const data = await getDashboardData();
      return res.status(400).render("lawyer/manage", {
        ...data,
        error: "Bu e-posta adresi başka bir üye tarafından kullanılıyor.",
      });
    }

    await User.findByIdAndUpdate(req.params.id, { Email: email.toLowerCase() });
    res.redirect("/lawyer/manage");
  } catch (err) {
    console.error(err);
    const data = await getDashboardData();
    res.status(500).render("lawyer/manage", {
      ...data,
      error: "E-posta adresi güncellenirken bir hata oluştu.",
    });
  }
});

// ============ ÜYE USERNAME GÜNCELLEME ============
router.post("/members/:id/username", async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      const data = await getDashboardData();
      return res.status(400).render("lawyer/manage", {
        ...data,
        error: "Kullanıcı adı boş olamaz.",
      });
    }

    const existing = await User.findOne({
      Username: username,
      _id: { $ne: req.params.id },
    });
    if (existing) {
      const data = await getDashboardData();
      return res.status(400).render("lawyer/manage", {
        ...data,
        error: "Bu kullanıcı adı başka bir üye tarafından kullanılıyor.",
      });
    }

    await User.findByIdAndUpdate(req.params.id, { Username: username });
    res.redirect("/lawyer/manage");
  } catch (err) {
    console.error(err);
    const data = await getDashboardData();
    res.status(500).render("lawyer/manage", {
      ...data,
      error: "Kullanıcı adı güncellenirken bir hata oluştu.",
    });
  }
});

// ============ ÜYE ŞİFRE GÜNCELLEME ============
router.post("/members/:id/password", async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      const data = await getDashboardData();
      return res.status(400).render("lawyer/manage", {
        ...data,
        error: "Şifre en az 6 karakter olmalıdır.",
      });
    }

    const hash = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate(req.params.id, { Password: hash });
    res.redirect("/lawyer/manage");
  } catch (err) {
    console.error(err);
    const data = await getDashboardData();
    res.status(500).render("lawyer/manage", {
      ...data,
      error: "Şifre güncellenirken bir hata oluştu.",
    });
  }
});

// ============ DAVA EKLEME ============
router.post("/cases", async (req, res) => {
  try {
    const { memberId, fileNumber, subject } = req.body;

    if (!memberId || !fileNumber || !subject) {
      const data = await getDashboardData();
      return res.status(400).render("lawyer/manage", {
        ...data,
        error: "Müvekkil, dosya no ve konu zorunludur.",
      });
    }

    const member = await User.findById(memberId);
    if (!member || member.Role !== "member") {
      const data = await getDashboardData();
      return res.status(400).render("lawyer/manage", {
        ...data,
        error: "Geçersiz müvekkil seçimi.",
      });
    }

    await Case.create({
      Member: memberId,
      FileNumber: fileNumber,
      Subject: subject,
    });

    res.redirect("/lawyer/manage");
  } catch (err) {
    console.error(err);
    const data = await getDashboardData();
    if (err.code === 11000) {
      return res.status(400).render("lawyer/manage", {
        ...data,
        error: "Bu dosya numarası zaten kayıtlı.",
      });
    }
    return res.status(500).render("lawyer/manage", {
      ...data,
      error: "Dava eklenirken bir hata oluştu.",
    });
  }
});

// ============ DAVA DÜZENLEME FORMU ============
router.get("/cases/:id/edit", async (req, res) => {
  const caseItem = await Case.findById(req.params.id).populate("Member");
  if (!caseItem) return res.status(404).send("Dava bulunamadı.");

  const members = await User.find({ Role: "member" }).sort({ Username: 1 });
  res.render("lawyer/caseEdit", { caseItem, members });
});

// ============ DAVA GÜNCELLEME ============
router.post("/cases/:id/update", async (req, res) => {
  try {
    const { memberId, fileNumber, subject } = req.body;

    if (!memberId || !fileNumber || !subject) {
      return res.status(400).send("Tüm alanlar zorunludur.");
    }

    const member = await User.findById(memberId);
    if (!member || member.Role !== "member") {
      return res.status(400).send("Geçersiz müvekkil seçimi.");
    }

    await Case.findByIdAndUpdate(req.params.id, {
      Member: memberId,
      FileNumber: fileNumber,
      Subject: subject,
    });

    res.redirect("/lawyer/manage");
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res
        .status(400)
        .send("Bu dosya numarası zaten başka bir davada kayıtlı.");
    }
    res.status(500).send("Dava güncellenirken bir hata oluştu.");
  }
});

// ============ DAVA SİLME (belgeler arşivleniyor, silinmiyor) ============
router.post("/cases/:id/delete", async (req, res) => {
  try {
    const caseId = req.params.id;

    const caseItem = await Case.findById(caseId).populate("Member");
    if (!caseItem) return res.status(404).send("Dava bulunamadı.");

    await Document.updateMany(
      { Case: caseId },
      {
        Archived: true,
        ArchivedAt: new Date(),
        ArchivedCaseFileNumber: caseItem.FileNumber,
        ArchivedCaseSubject: caseItem.Subject,
        ArchivedMemberEmail: caseItem.Member ? caseItem.Member.Email : null,
        Case: null,
      },
    );

    await Case.findByIdAndDelete(caseId);
    res.redirect("/lawyer/manage");
  } catch (err) {
    console.error(err);
    const data = await getDashboardData();
    res.status(500).render("lawyer/manage", {
      ...data,
      error: "Dava silinirken bir hata oluştu.",
    });
  }
});

// ============ DAVA DETAY (mevcut) ============
router.get("/cases/:id", async (req, res) => {
  const caseItem = await Case.findById(req.params.id).populate("Member");
  if (!caseItem) return res.status(404).send("Dava bulunamadı.");

  const documents = await Document.find({ Case: req.params.id });
  res.render("lawyer/caseDetail", { caseItem, documents });
});

// ============ BELGE YÜKLEME (mevcut) ============
router.post(
  "/cases/:id/documents",
  (req, res, next) => {
    upload.single("file")(req, res, async (err) => {
      if (err) {
        const caseItem = await Case.findById(req.params.id).populate("Member");
        const documents = await Document.find({ Case: req.params.id });
        return res.status(400).render("lawyer/caseDetail", {
          caseItem,
          documents,
          error: err.message,
        });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      const caseId = req.params.id;
      const caseItem = await Case.findById(caseId);
      if (!caseItem) return res.status(404).send("Dava bulunamadı.");

      if (!req.file) {
        const documents = await Document.find({ Case: caseId });
        return res.status(400).render("lawyer/caseDetail", {
          caseItem,
          documents,
          error: "Lütfen bir dosya seçin.",
        });
      }

      await Document.create({
        Case: caseId,
        Member: req.session.userId,
        FileName: req.file.originalname,
        FilePath: req.file.path,
      });

      res.redirect(`/lawyer/cases/${caseId}`);
    } catch (err) {
      console.error(err);
      res.status(500).send("Belge kaydedilirken bir hata oluştu.");
    }
  },
);

// ============ BELGE İNDİRME/GÖRÜNTÜLEME (mevcut) ============
router.get("/documents/:id/download", async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) return res.status(404).send("Belge bulunamadı.");

    const absolutePath = getAbsoluteFilePath(document.FilePath);
    if (!absolutePath) {
      return res
        .status(404)
        .send("Fiziksel dosya sunucuda bulunamadı veya dosya kaydı eksik.");
    }

    res.sendFile(absolutePath);
  } catch (err) {
    console.error("Belge indirme hatası:", err);
    res.status(500).send("Belge indirilirken bir hata oluştu.");
  }
});

// ============ ARŞİV ============
router.get("/archive", async (req, res) => {
  const archivedDocuments = await Document.find({ Archived: true }).sort({
    ArchivedAt: -1,
  });
  res.render("lawyer/archive", { archivedDocuments });
});

// ============ RANDEVU ONAYLAMA ============
router.post("/appointments/:id/approve", async (req, res) => {
  try {
    await Appointment.findByIdAndUpdate(req.params.id, { Status: "approved" });
    res.redirect("/lawyer/manage");
  } catch (err) {
    console.error(err);
    const data = await getDashboardData();
    res.status(500).render("lawyer/manage", {
      ...data,
      error: "Randevu onaylanırken bir hata oluştu.",
    });
  }
});

// ============ RANDEVU REDDETME ============
router.post("/appointments/:id/reject", async (req, res) => {
  try {
    await Appointment.findByIdAndUpdate(req.params.id, { Status: "rejected" });
    res.redirect("/lawyer/manage");
  } catch (err) {
    console.error(err);
    const data = await getDashboardData();
    res.status(500).render("lawyer/manage", {
      ...data,
      error: "Randevu reddedilirken bir hata oluştu.",
    });
  }
});

// ============ SAAT KAPATMA (dolu işaretleme) ============
router.post("/blocked-slots", async (req, res) => {
  try {
    const { date, time } = req.body;

    if (!date || !time) {
      const data = await getDashboardData();
      return res.status(400).render("lawyer/manage", {
        ...data,
        error: "Tarih ve saat seçilmesi zorunludur.",
      });
    }

    await BlockedSlot.create({ Date: date, Time: time });
    res.redirect("/lawyer/manage");
  } catch (err) {
    console.error(err);
    const data = await getDashboardData();
    if (err.code === 11000) {
      return res.status(400).render("lawyer/manage", {
        ...data,
        error: "Bu tarih ve saat zaten kapatılmış.",
      });
    }
    return res.status(500).render("lawyer/manage", {
      ...data,
      error: "Saat kapatılırken bir hata oluştu.",
    });
  }
});

// ============ SAAT AÇMA (kapatmayı kaldırma) ============
router.post("/blocked-slots/:id/delete", async (req, res) => {
  try {
    await BlockedSlot.findByIdAndDelete(req.params.id);
    res.redirect("/lawyer/manage");
  } catch (err) {
    console.error(err);
    const data = await getDashboardData();
    res.status(500).render("lawyer/manage", {
      ...data,
      error: "Saat açılırken bir hata oluştu.",
    });
  }
});

module.exports = router;
