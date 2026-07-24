const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware/auth");
const Message = require("../db/models/Message");
const User = require("../db/models/User");
const Lawyer = require("../db/models/Lawyer");

router.use(isAuthenticated);

// 1. Contacts List & Recent Messages
router.get("/contacts", async (req, res) => {
  try {
    const currentUserId = req.session.userId;
    const currentUserRole = req.session.role;

    let targetUsers = [];
    if (currentUserRole === "lawyer") {
      // Fetch clients if lawyer
      targetUsers = await User.find({ _id: { $ne: currentUserId }, Role: "member" })
        .select("_id Username Email Role")
        .sort({ Username: 1 });
    } else {
      // Fetch lawyers if client
      targetUsers = await User.find({ _id: { $ne: currentUserId }, Role: "lawyer" })
        .select("_id Username Email Role")
        .sort({ Username: 1 });
    }

    // Additionally fetch info from Lawyer table and format names
    const lawyerDetails = await Lawyer.find();
    const lawyerEmailMap = {};
    lawyerDetails.forEach((l) => {
      if (l.Email) lawyerEmailMap[l.Email.toLowerCase()] = l;
    });

    const contacts = await Promise.all(
      targetUsers.map(async (u) => {
        // Find last message
        const lastMsg = await Message.findOne({
          $or: [
            { Sender: currentUserId, Receiver: u._id },
            { Sender: u._id, Receiver: currentUserId },
          ],
        }).sort({ CreatedAt: -1 });

        // Unread message count
        const unreadCount = await Message.countDocuments({
          Sender: u._id,
          Receiver: currentUserId,
          IsRead: false,
        });

        let displayName = u.Username || u.Email;
        let title = u.Role === "lawyer" ? "Avukat" : "Müvekkil";
        let avatar = "/Fotograflar/altinbas-logo.svg";

        if (u.Role === "lawyer") {
          const lInfo = lawyerEmailMap[u.Email ? u.Email.toLowerCase() : ""];
          if (lInfo) {
            displayName = lInfo.Name;
            title = lInfo.Title || "Avukat";
            if (lInfo.Photo) avatar = lInfo.Photo;
          }
        }

        return {
          id: u._id,
          name: displayName,
          email: u.Email,
          role: u.Role,
          roleTitle: title,
          avatar: avatar,
          lastMessage: lastMsg ? lastMsg.Content : null,
          lastMessageTime: lastMsg ? lastMsg.CreatedAt : null,
          unreadCount: unreadCount,
        };
      })
    );

    // Sort by last message date (conversations with recent messages on top)
    contacts.sort((a, b) => {
      if (a.lastMessageTime && b.lastMessageTime) {
        return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
      }
      if (a.lastMessageTime) return -1;
      if (b.lastMessageTime) return 1;
      return a.name.localeCompare(b.name);
    });

    res.json({ success: true, contacts });
  } catch (err) {
    console.error("Contacts Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Chat history with a specific user
router.get("/chat/:userId", async (req, res) => {
  try {
    const currentUserId = req.session.userId;
    const targetUserId = req.params.userId;

    const targetUser = await User.findById(targetUserId).select("_id Username Email Role");
    if (!targetUser) {
      return res.status(404).json({ success: false, error: "Kullanıcı bulunamadı." });
    }

    let displayName = targetUser.Username || targetUser.Email;
    let title = targetUser.Role === "lawyer" ? "Avukat" : "Müvekkil";
    let avatar = "/Fotograflar/altinbas-logo.svg";

    if (targetUser.Role === "lawyer") {
      const lInfo = await Lawyer.findOne({ Email: new RegExp(`^${targetUser.Email}$`, "i") });
      if (lInfo) {
        displayName = lInfo.Name;
        title = lInfo.Title || "Avukat";
        if (lInfo.Photo) avatar = lInfo.Photo;
      }
    }

    // Mark unread messages from the other user as read
    await Message.updateMany(
      { Sender: targetUserId, Receiver: currentUserId, IsRead: false },
      { $set: { IsRead: true } }
    );

    // Fetch message history
    const messages = await Message.find({
      $or: [
        { Sender: currentUserId, Receiver: targetUserId },
        { Sender: targetUserId, Receiver: currentUserId },
      ],
    }).sort({ CreatedAt: 1 });

    const formattedMessages = messages.map((m) => ({
      id: m._id,
      sender: m.Sender.toString(),
      receiver: m.Receiver.toString(),
      isMine: m.Sender.toString() === currentUserId.toString(),
      content: m.Content,
      isRead: m.IsRead,
      createdAt: m.CreatedAt,
    }));

    res.json({
      success: true,
      contact: {
        id: targetUser._id,
        name: displayName,
        email: targetUser.Email,
        role: targetUser.Role,
        roleTitle: title,
        avatar: avatar,
      },
      messages: formattedMessages,
    });
  } catch (err) {
    console.error("Chat Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Send Message
router.post("/send", async (req, res) => {
  try {
    const currentUserId = req.session.userId;
    const { receiverId, content } = req.body;

    if (!receiverId || !content || !content.trim()) {
      return res.status(400).json({ success: false, error: "Mesaj içeriği boş olamaz." });
    }

    const receiverUser = await User.findById(receiverId);
    if (!receiverUser) {
      return res.status(404).json({ success: false, error: "Alıcı kullanıcı bulunamadı." });
    }

    const newMsg = await Message.create({
      Sender: currentUserId,
      Receiver: receiverId,
      Content: content.trim(),
    });

    res.json({
      success: true,
      message: {
        id: newMsg._id,
        sender: newMsg.Sender.toString(),
        receiver: newMsg.Receiver.toString(),
        isMine: true,
        content: newMsg.Content,
        isRead: false,
        createdAt: newMsg.CreatedAt,
      },
    });
  } catch (err) {
    console.error("Send Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Total unread message count
router.get("/unread-count", async (req, res) => {
  try {
    const currentUserId = req.session.userId;
    const unreadCount = await Message.countDocuments({
      Receiver: currentUserId,
      IsRead: false,
    });

    res.json({ success: true, unreadCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
