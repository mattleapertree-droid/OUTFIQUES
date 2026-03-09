// All styles are now in styles.css

class WardrobeApp {
  constructor() {
    this.token = localStorage.getItem("authToken");
    this.username = localStorage.getItem("username");
    this.currentCategory = "hat";
    this.currentItem = null;
    this.dailyOutfit = { hat: null, shirt: null, pants: null, boots: null };
    this.selectingForCategory = null;
    this.init();
  }

  init() {
    const path = window.location.pathname.toLowerCase();

    if (path.endsWith("index.html") || path === "/" || path === "") {
      this.initAuthPage();
      return;
    }

    if (path.endsWith("wardrobe.html")) {
      if (!this.token) {
        window.location.href = "index.html";
        return;
      }
      this.initWardrobePage();
    }
  }

  initAuthPage() {
    const loginTab = document.getElementById("loginTab");
    const signupTab = document.getElementById("signupTab");
    const loginBtn = document.getElementById("loginBtn");
    const signupBtn = document.getElementById("signupBtn");

    if (!loginTab || !signupTab || !loginBtn || !signupBtn) return;

    loginTab.addEventListener("click", () => this.switchAuthTab("login"));
    signupTab.addEventListener("click", () => this.switchAuthTab("signup"));
    loginBtn.addEventListener("click", () => this.handleLogin());
    signupBtn.addEventListener("click", () => this.handleSignup());

    const loginPassword = document.getElementById("loginPassword");
    const signupConfirmPassword = document.getElementById("signupConfirmPassword");

    if (loginPassword) {
      loginPassword.addEventListener("keypress", (e) => {
        if (e.key === "Enter") this.handleLogin();
      });
    }

    if (signupConfirmPassword) {
      signupConfirmPassword.addEventListener("keypress", (e) => {
        if (e.key === "Enter") this.handleSignup();
      });
    }
  }

  switchAuthTab(tab) {
    document.querySelectorAll(".tab").forEach(el => el.classList.remove("active"));
    document.querySelectorAll(".auth-form").forEach(el => el.classList.remove("active"));

    document.getElementById(`${tab}Tab`)?.classList.add("active");
    document.getElementById(`${tab}Form`)?.classList.add("active");
    this.showAuthMessage("");
  }

  async handleLogin() {
    const username = document.getElementById("loginUsername")?.value.trim();
    const password = document.getElementById("loginPassword")?.value;

    if (!username || !password) {
      this.showAuthMessage("Please enter username and password.", "error");
      return;
    }

    try {
      const response = await this.apiRequest("/api/login", "POST", { username, password });
      if (!response.success) {
        this.showAuthMessage(response.error || "Login failed.", "error");
        return;
      }

      localStorage.setItem("authToken", response.token);
      localStorage.setItem("username", response.username);
      window.location.href = "wardrobe.html";
    } catch (error) {
      this.showAuthMessage(error.message || "Login failed.", "error");
    }
  }

  async handleSignup() {
    const username = document.getElementById("signupUsername")?.value.trim();
    const email = document.getElementById("signupEmail")?.value.trim();
    const password = document.getElementById("signupPassword")?.value;
    const confirmPassword = document.getElementById("signupConfirmPassword")?.value;

    if (!username || !email || !password || !confirmPassword) {
      this.showAuthMessage("Please fill in all signup fields.", "error");
      return;
    }

    if (password !== confirmPassword) {
      this.showAuthMessage("Passwords do not match.", "error");
      return;
    }

    try {
      const response = await this.apiRequest("/api/signup", "POST", {
        username,
        email,
        password
      });

      if (!response.success) {
        this.showAuthMessage(response.error || "Signup failed.", "error");
        return;
      }

      localStorage.setItem("authToken", response.token);
      localStorage.setItem("username", response.username);
      window.location.href = "wardrobe.html";
    } catch (error) {
      this.showAuthMessage(error.message || "Signup failed.", "error");
    }
  }

  showAuthMessage(message, type = "") {
    const el = document.getElementById("authMessage");
    if (!el) return;
    el.textContent = message;
    el.className = `message ${type}`;
  }

  async initWardrobePage() {
    const usernameEl = document.getElementById("username");
    if (usernameEl) usernameEl.textContent = `@${this.username}`;

    this.bindWardrobeEvents();
    await this.loadWardrobe();
    await this.loadDailyOutfit();
    this.renderDailyOutfit();
  }

  bindWardrobeEvents() {
    document.getElementById("logoutBtn")?.addEventListener("click", () => this.logout());
    document.getElementById("generateBtn")?.addEventListener("click", () => this.generateItem());
    document.getElementById("saveDailyOutfitBtn")?.addEventListener("click", () => this.saveDailyOutfit());

    document.querySelectorAll(".category-tab").forEach(btn => {
      btn.addEventListener("click", () => this.switchCategory(btn.dataset.category));
    });

    document.querySelectorAll(".select-from-drawer-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        this.selectingForCategory = btn.dataset.category;
        this.switchCategory(btn.dataset.category);
        this.showMessage(`Choose an item from the ${btn.dataset.category} drawer.`, "success");
      });
    });

    document.getElementById("closeEditModal")?.addEventListener("click", () => this.closeEditModal());
    document.getElementById("saveEditBtn")?.addEventListener("click", () => this.saveEditItem());
  }

  logout() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("username");
    window.location.href = "index.html";
  }

  async loadWardrobe() {
    const response = await this.apiRequest("/api/wardrobe", "GET");
    this.wardrobe = response.wardrobe || { hat: [], shirt: [], pants: [], boots: [] };
    this.renderWardrobe();
  }

  async loadDailyOutfit() {
    try {
      const response = await this.apiRequest("/api/daily-outfit", "GET");
      if (response.success && response.dailyOutfit) {
        this.dailyOutfit = response.dailyOutfit;
      }
    } catch (error) {
      console.error(error);
    }
  }

  switchCategory(category) {
    this.currentCategory = category;
    document.querySelectorAll(".category-tab").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.category === category);
    });

    const titleMap = {
      hat: "Hat Drawer",
      shirt: "Shirt Drawer",
      pants: "Pants / Shorts Drawer",
      boots: "Boots / Shoes Drawer"
    };

    const drawerTitle = document.getElementById("drawerTitle");
    if (drawerTitle) drawerTitle.textContent = titleMap[category] || "Wardrobe Drawer";

    this.renderWardrobe();
  }

  renderWardrobe() {
    const grid = document.getElementById("wardrobeGrid");
    if (!grid) return;

    const items = this.wardrobe?.[this.currentCategory] || [];

    if (!items.length) {
      grid.innerHTML = `<div class="empty-slot">No items in this drawer yet.</div>`;
      return;
    }

    grid.innerHTML = items.map(item => `
      <div class="item-card">
        <div class="item-image">
          <img src="${item.imagePath}" alt="${this.escapeHtml(item.description || item.category)}">
        </div>
        <div class="item-body">
          <div class="item-style">${this.escapeHtml(item.style || "style")}</div>
          <div class="item-description">${this.escapeHtml(item.description || "No description")}</div>
          <div class="item-actions">
            <button type="button" data-action="wear" data-id="${item.id}">Wear</button>
            <button type="button" data-action="edit" data-id="${item.id}">Edit</button>
            <button type="button" data-action="delete" data-id="${item.id}">Delete</button>
          </div>
        </div>
      </div>
    `).join("");

    grid.querySelectorAll("button[data-action]").forEach(btn => {
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      btn.addEventListener("click", () => {
        if (action === "wear") this.selectItemForOutfit(id);
        if (action === "edit") this.openEditModal(id);
        if (action === "delete") this.deleteItem(id);
      });
    });
  }

  selectItemForOutfit(id) {
    const items = this.wardrobe?.[this.currentCategory] || [];
    const item = items.find(i => String(i.id) === String(id));
    if (!item) return;

    const category = this.selectingForCategory || this.currentCategory;
    this.dailyOutfit[category] = item;
    this.selectingForCategory = null;
    this.renderDailyOutfit();
    this.showMessage("Item selected for today's outfit.", "success");
  }

  renderDailyOutfit() {
    this.renderDailySlot("dailyHat", this.dailyOutfit.hat, "No hat selected");
    this.renderDailySlot("dailyShirt", this.dailyOutfit.shirt, "No shirt selected");
    this.renderDailySlot("dailyPants", this.dailyOutfit.pants, "No pants selected");
    this.renderDailySlot("dailyBoots", this.dailyOutfit.boots, "No shoes selected");
  }

  renderDailySlot(elementId, item, emptyText) {
    const el = document.getElementById(elementId);
    if (!el) return;

    if (!item) {
      el.innerHTML = `<div class="empty-slot">${emptyText}</div>`;
      return;
    }

    el.innerHTML = `<img src="${item.imagePath}" alt="${this.escapeHtml(item.description || "Selected item")}">`;
  }

  async saveDailyOutfit() {
    try {
      const response = await this.apiRequest("/api/daily-outfit", "POST", {
        dailyOutfit: this.dailyOutfit
      });

      if (!response.success) {
        this.showMessage(response.error || "Failed to save daily outfit.", "error");
        return;
      }

      this.showMessage("Daily outfit saved successfully.", "success");
    } catch (error) {
      this.showMessage(error.message || "Failed to save daily outfit.", "error");
    }
  }

  async generateItem() {
    const style = document.getElementById("itemStyle")?.value || "modern";
    const description = document.getElementById("itemDescription")?.value.trim() || `${style} ${this.currentCategory}`;

    this.showMessage("Generating item...", "success");

    try {
      const response = await this.apiRequest("/api/generate", "POST", {
        category: this.currentCategory,
        style,
        description
      });

      if (!response.success) {
        this.showMessage(response.error || "Generation failed.", "error");
        return;
      }

      await this.loadWardrobe();
      this.showMessage(`Generated and saved in ${this.currentCategory} drawer.`, "success");
    } catch (error) {
      this.showMessage(error.message || "Generation failed.", "error");
    }
  }

  openEditModal(id) {
    const items = this.wardrobe?.[this.currentCategory] || [];
    const item = items.find(i => String(i.id) === String(id));
    if (!item) return;

    this.currentItem = item;
    document.getElementById("editStyle").value = item.style || "modern";
    document.getElementById("editDescription").value = item.description || "";
    document.getElementById("editModal").classList.remove("hidden");
  }

  closeEditModal() {
    document.getElementById("editModal")?.classList.add("hidden");
    this.currentItem = null;
  }

  async saveEditItem() {
    if (!this.currentItem) return;

    const style = document.getElementById("editStyle")?.value || "modern";
    const description = document.getElementById("editDescription")?.value.trim() || "";

    try {
      const response = await this.apiRequest("/api/item/update", "POST", {
        id: this.currentItem.id,
        category: this.currentCategory,
        style,
        description
      });

      if (!response.success) {
        this.showMessage(response.error || "Failed to update item.", "error");
        return;
      }

      this.closeEditModal();
      await this.loadWardrobe();
      this.showMessage("Item updated successfully.", "success");
    } catch (error) {
      this.showMessage(error.message || "Failed to update item.", "error");
    }
  }

  async deleteItem(id) {
    const confirmed = window.confirm("Delete this item?");
    if (!confirmed) return;

    try {
      const response = await this.apiRequest("/api/item/delete", "POST", {
        id,
        category: this.currentCategory
      });

      if (!response.success) {
        this.showMessage(response.error || "Failed to delete item.", "error");
        return;
      }

      if (this.dailyOutfit[this.currentCategory]?.id === id) {
        this.dailyOutfit[this.currentCategory] = null;
        this.renderDailyOutfit();
      }

      await this.loadWardrobe();
      this.showMessage("Item deleted.", "success");
    } catch (error) {
      this.showMessage(error.message || "Failed to delete item.", "error");
    }
  }

  showMessage(message, type = "") {
    const el = document.getElementById("messageArea");
    if (!el) return;
    el.textContent = message;
    el.className = `status-message ${type}`;
  }

  async apiRequest(url, method = "GET", body = null) {
    // Simulated API using localStorage
    if (url === "/api/login" && method === "POST") {
      return this.handleLocalLogin(body);
    }
    if (url === "/api/signup" && method === "POST") {
      return this.handleLocalSignup(body);
    }
    if (url === "/api/wardrobe" && method === "GET") {
      const wardrobe = JSON.parse(localStorage.getItem(`wardrobe_${this.username}`) || '{"hat":[],"shirt":[],"pants":[],"boots":[]}');
      return { success: true, wardrobe };
    }
    if (url === "/api/daily-outfit" && method === "GET") {
      const dailyOutfit = JSON.parse(localStorage.getItem(`daily-outfit_${this.username}`) || '{"hat":null,"shirt":null,"pants":null,"boots":null}');
      return { success: true, dailyOutfit };
    }
    if (url === "/api/daily-outfit" && method === "POST") {
      localStorage.setItem(`daily-outfit_${this.username}`, JSON.stringify(body.dailyOutfit));
      return { success: true };
    }
    if (url === "/api/generate" && method === "POST") {
      const itemId = Date.now().toString();
      const item = {
        id: itemId,
        category: body.category,
        style: body.style,
        description: body.description,
        imagePath: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Crect fill='%23f3e7df' width='220' height='220'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='14' fill='%236f4f42' text-anchor='middle' dominant-baseline='middle'%3E" + body.style + "%3C/text%3E%3C/svg%3E"
      };
      const wardrobe = JSON.parse(localStorage.getItem(`wardrobe_${this.username}`) || '{"hat":[],"shirt":[],"pants":[],"boots":[]}');
      wardrobe[body.category].push(item);
      localStorage.setItem(`wardrobe_${this.username}`, JSON.stringify(wardrobe));
      return { success: true, item };
    }
    if (url === "/api/item/update" && method === "POST") {
      const wardrobe = JSON.parse(localStorage.getItem(`wardrobe_${this.username}`) || '{"hat":[],"shirt":[],"pants":[],"boots":[]}');
      const items = wardrobe[body.category];
      const itemIndex = items.findIndex(i => String(i.id) === String(body.id));
      if (itemIndex >= 0) {
        items[itemIndex].style = body.style;
        items[itemIndex].description = body.description;
        localStorage.setItem(`wardrobe_${this.username}`, JSON.stringify(wardrobe));
        return { success: true };
      }
      return { success: false, error: "Item not found" };
    }
    if (url === "/api/item/delete" && method === "POST") {
      const wardrobe = JSON.parse(localStorage.getItem(`wardrobe_${this.username}`) || '{"hat":[],"shirt":[],"pants":[],"boots":[]}');
      wardrobe[body.category] = wardrobe[body.category].filter(i => String(i.id) !== String(body.id));
      localStorage.setItem(`wardrobe_${this.username}`, JSON.stringify(wardrobe));
      return { success: true };
    }
    if (url === "/api/capture-smart" && method === "POST") {
      const itemId = Date.now().toString();
      const item = {
        id: itemId,
        category: body.category,
        style: body.style,
        description: body.description,
        imagePath: body.imageData
      };
      const wardrobe = JSON.parse(localStorage.getItem(`wardrobe_${this.username}`) || '{"hat":[],"shirt":[],"pants":[],"boots":[]}');
      wardrobe[body.category].push(item);
      localStorage.setItem(`wardrobe_${this.username}`, JSON.stringify(wardrobe));
      return { success: true, item };
    }
    if (url === "/api/generation-hints" && method === "GET") {
      return { success: true, hints: {} };
    }
    return { success: false, error: "Unknown endpoint" };
  }

  handleLocalLogin(body) {
    const users = JSON.parse(localStorage.getItem("users") || "{}");
    const user = users[body.username];
    if (!user) {
      return { success: false, error: "Username not found" };
    }
    const passwordHash = this.hashPassword(body.password);
    if (user.passwordHash !== passwordHash) {
      return { success: false, error: "Password incorrect" };
    }
    const token = this.generateToken();
    return { success: true, token, username: body.username };
  }

  handleLocalSignup(body) {
    const users = JSON.parse(localStorage.getItem("users") || "{}");
    if (users[body.username]) {
      return { success: false, error: "Username already exists" };
    }
    const passwordHash = this.hashPassword(body.password);
    users[body.username] = { passwordHash, email: body.email };
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem(`wardrobe_${body.username}`, JSON.stringify({ hat: [], shirt: [], pants: [], boots: [] }));
    localStorage.setItem(`daily-outfit_${body.username}`, JSON.stringify({ hat: null, shirt: null, pants: null, boots: null }));
    const token = this.generateToken();
    return { success: true, token, username: body.username };
  }

  hashPassword(password) {
    // Simple hash for demo purposes - NOT secure for production
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  generateToken() {
    return "token_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  }

  escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
}

window.app = new WardrobeApp();
