/* ============================================================
   AÇILABİLİR MESAJLAŞMA BARI (EXPANDABLE MESSAGING BAR) SCRIPT
   ============================================================ */

(function () {
  let isBarOpen = false;
  let activeContactId = null;
  let contactsData = [];
  let pollInterval = null;

  // DOM Elemanları
  let wrapper, header, body, toggleBtn, unreadBadge;
  let contactsView, messagesView;
  let searchInput, contactsList;
  let backBtn, convoUserName, convoUserRole, convoUserAvatar;
  let messagesArea, inputForm, messageInput, sendBtn;

  document.addEventListener("DOMContentLoaded", () => {
    initDOM();
    if (!wrapper) return; // Kullanıcı giriş yapmamış veya eleman yoksa çık

    bindEvents();
    fetchUnreadCount();
    
    // Her 4 saniyede bir unread count & aktif sohbeti güncelle
    pollInterval = setInterval(() => {
      fetchUnreadCount();
      if (isBarOpen && activeContactId) {
        loadChatMessages(activeContactId, true);
      } else if (isBarOpen && !activeContactId) {
        loadContacts();
      }
    }, 4000);
  });

  function initDOM() {
    wrapper = document.getElementById("chatBarWrapper");
    if (!wrapper) return;

    header = document.getElementById("chatBarHeader");
    body = document.getElementById("chatBarBody");
    toggleBtn = document.getElementById("chatBarToggleBtn");
    unreadBadge = document.getElementById("chatUnreadBadge");

    contactsView = document.getElementById("chatViewContacts");
    messagesView = document.getElementById("chatViewMessages");

    searchInput = document.getElementById("chatSearchInput");
    contactsList = document.getElementById("chatContactsList");

    backBtn = document.getElementById("chatBackBtn");
    convoUserName = document.getElementById("chatConvoUserName");
    convoUserRole = document.getElementById("chatConvoUserRole");
    convoUserAvatar = document.getElementById("chatConvoUserAvatar");

    messagesArea = document.getElementById("chatMessagesArea");
    inputForm = document.getElementById("chatInputForm");
    messageInput = document.getElementById("chatMessageInput");
    sendBtn = document.getElementById("chatSendBtn");
  }

  function bindEvents() {
    // Barı Aç / Kapat
    header.addEventListener("click", (e) => {
      if (e.target.closest("#chatBarToggleBtn")) return; // toggle button handler ile çakışmasın
      toggleBar();
    });
    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleBar();
    });

    // İletişim Araması
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase().trim();
        renderContacts(query);
      });
    }

    // Sohbetten Çıkıp Kişi Listesine Dön
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        showContactsView();
      });
    }

    // Mesaj Gönderme
    if (inputForm) {
      inputForm.addEventListener("submit", (e) => {
        e.preventDefault();
        sendMessage();
      });
    }

    if (messageInput) {
      messageInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });
    }
  }

  function toggleBar() {
    isBarOpen = !isBarOpen;
    if (isBarOpen) {
      wrapper.classList.add("open");
      if (!activeContactId) {
        showContactsView();
        loadContacts();
      }
    } else {
      wrapper.classList.remove("open");
    }
  }

  // Okunmamış Sayısını Güncelle
  async function fetchUnreadCount() {
    try {
      const res = await fetch("/messages/unread-count");
      const data = await res.json();
      if (data.success) {
        if (data.unreadCount > 0) {
          unreadBadge.textContent = data.unreadCount;
          unreadBadge.classList.remove("hidden");
        } else {
          unreadBadge.classList.add("hidden");
        }
      }
    } catch (err) {
      console.error("Unread count fetch error:", err);
    }
  }

  // Kişi Listesini Yükle
  async function loadContacts() {
    try {
      const res = await fetch("/messages/contacts");
      const data = await res.json();
      if (data.success) {
        contactsData = data.contacts;
        renderContacts(searchInput ? searchInput.value.toLowerCase().trim() : "");
      }
    } catch (err) {
      console.error("Load contacts error:", err);
      contactsList.innerHTML = `<div class="chat-empty-msg">Kişiler yüklenirken hata oluştu.</div>`;
    }
  }

  // Kişileri Render Et
  function renderContacts(filterQuery = "") {
    if (!contactsList) return;

    let filtered = [];
    if (!filterQuery) {
      // Mesaj yazılmayan kişiler varsayılan Chat kutusunda gözükmesin (sadece mesajlaşılmış olanlar)
      filtered = contactsData.filter((c) => c.lastMessage !== null && c.lastMessage !== undefined);
      if (filtered.length === 0) {
        contactsList.innerHTML = `<div class="chat-empty-msg" style="padding: 24px 16px; font-size: 13px; line-height: 1.5; color: var(--chat-text-muted);">Henüz aktif bir mesajlaşmanız bulunmuyor.<br><span style="color: var(--chat-gold); font-size: 12px; font-weight: 500; display: inline-block; margin-top: 6px;">Yeni bir kişi bulmak için arama çubuğuna yazabilirsiniz.</span></div>`;
        return;
      }
    } else {
      // Yukardaki arama kısmı kişileri yazdıkça görüntülesin (eşleşen tüm kişiler)
      filtered = contactsData.filter(
        (c) =>
          c.name.toLowerCase().includes(filterQuery) ||
          c.email.toLowerCase().includes(filterQuery)
      );
      if (filtered.length === 0) {
        contactsList.innerHTML = `<div class="chat-empty-msg">Aranan isimle eşleşen kişi bulunamadı.</div>`;
        return;
      }
    }

    let html = "";
    filtered.forEach((c) => {
      const badgeHtml =
        c.unreadCount > 0
          ? `<span class="chat-contact-badge">${c.unreadCount}</span>`
          : "";
      const timeHtml = c.lastMessageTime
        ? `<span style="font-size: 10px; color: var(--chat-text-muted);">${formatTime(
            c.lastMessageTime
          )}</span>`
        : "";

      html += `
        <div class="chat-contact-item" data-id="${c.id}">
          <div class="chat-contact-avatar">
            <img src="${c.avatar}" alt="${c.name}" onerror="this.src='/Fotograflar/altinbas-logo.svg'" />
          </div>
          <div class="chat-contact-details">
            <div class="chat-contact-top">
              <span class="chat-contact-name">${escapeHtml(c.name)}</span>
              ${timeHtml}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span class="chat-contact-preview">${
                c.lastMessage ? escapeHtml(c.lastMessage) : `<i style="opacity: 0.7;">Mesaj yok</i>`
              }</span>
              ${badgeHtml}
            </div>
          </div>
        </div>
      `;
    });

    contactsList.innerHTML = html;

    // Tıklama olaylarını bağla
    contactsList.querySelectorAll(".chat-contact-item").forEach((el) => {
      el.addEventListener("click", () => {
        const id = el.getAttribute("data-id");
        openChat(id);
      });
    });
  }

  // Sohbet Aç
  function openChat(contactId) {
    activeContactId = contactId;
    contactsView.classList.add("slide-out");
    messagesView.classList.add("slide-in");
    loadChatMessages(contactId);
  }

  function showContactsView() {
    activeContactId = null;
    contactsView.classList.remove("slide-out");
    messagesView.classList.remove("slide-in");
    loadContacts();
    fetchUnreadCount();
  }

  // Mesajları Yükle
  async function loadChatMessages(contactId, isSilent = false) {
    try {
      if (!isSilent) {
        messagesArea.innerHTML = `<div class="chat-empty-msg">Yükleniyor...</div>`;
      }
      const res = await fetch(`/messages/chat/${contactId}`);
      const data = await res.json();

      if (data.success) {
        // Üst bilgi güncelle
        convoUserName.textContent = data.contact.name;
        convoUserRole.textContent = data.contact.roleTitle;
        if (convoUserAvatar) {
          convoUserAvatar.src = data.contact.avatar;
        }

        renderMessages(data.messages);
        fetchUnreadCount();
      }
    } catch (err) {
      console.error("Load messages error:", err);
      if (!isSilent) {
        messagesArea.innerHTML = `<div class="chat-empty-msg">Mesajlar yüklenemedi.</div>`;
      }
    }
  }

  function renderMessages(messages) {
    if (!messagesArea) return;

    if (messages.length === 0) {
      messagesArea.innerHTML = `<div class="chat-empty-msg">Henüz mesajlaşma yok. İlk mesajı gönderin!</div>`;
      return;
    }

    // Scroll pozisyonu kontrolü
    const isAtBottom =
      messagesArea.scrollHeight - messagesArea.scrollTop <=
      messagesArea.clientHeight + 50;

    let html = "";
    messages.forEach((m) => {
      const rowClass = m.isMine ? "mine" : "theirs";
      const timeStr = formatTime(m.createdAt);

      html += `
        <div class="chat-bubble-row ${rowClass}">
          <div class="chat-bubble">${escapeHtml(m.content)}</div>
          <div class="chat-bubble-time">${timeStr}</div>
        </div>
      `;
    });

    messagesArea.innerHTML = html;

    if (isAtBottom || !isBarOpen) {
      messagesArea.scrollTop = messagesArea.scrollHeight;
    }
  }

  // Mesaj Gönder
  async function sendMessage() {
    if (!activeContactId || !messageInput) return;

    const content = messageInput.value.trim();
    if (!content) return;

    messageInput.value = "";

    try {
      const res = await fetch("/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: activeContactId, content }),
      });

      const data = await res.json();
      if (data.success) {
        loadChatMessages(activeContactId, true);
        setTimeout(() => {
          messagesArea.scrollTop = messagesArea.scrollHeight;
        }, 50);
      } else {
        alert(data.error || "Mesaj gönderilemedi.");
      }
    } catch (err) {
      console.error("Send message error:", err);
    }
  }

  // Zaman Formatı
  function formatTime(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  }

  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
