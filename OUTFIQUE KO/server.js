<<<<<<< HEAD
const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const crypto = require("crypto");

const PORT = 5500;
const ROOT = __dirname;
const HF_MODEL = "stabilityai/stable-diffusion-2";
const USERS_FILE = path.join(ROOT, "users.json");
const WARDROBES_FILE = path.join(ROOT, "wardrobes.json");

const mimeTypes = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".json": "application/json",
};

// Initialize data files if they don't exist
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify({}, null, 2));
}
if (!fs.existsSync(WARDROBES_FILE)) {
  fs.writeFileSync(WARDROBES_FILE, JSON.stringify({}, null, 2));
}

const send = (res, status, body, headers = {}) => {
  res.writeHead(status, headers);
  res.end(body);
};

const sendJSON = (res, data, status = 200) => {
  send(res, status, JSON.stringify(data), { "Content-Type": "application/json" });
};

const serveFile = (filePath, res) => {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      send(res, 404, "Not found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    send(res, 200, data, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
  });
};

const hashPassword = (password) => {
  return crypto.createHash("sha256").update(password).digest("hex");
};

const loadUsers = () => {
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
  } catch (e) {
    return {};
  }
};

const saveUsers = (users) => {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

const loadWardrobes = () => {
  try {
    return JSON.parse(fs.readFileSync(WARDROBES_FILE, "utf8"));
  } catch (e) {
    return {};
  }
};

const saveWardrobes = (wardrobes) => {
  fs.writeFileSync(WARDROBES_FILE, JSON.stringify(wardrobes, null, 2));
};

const getUserFromToken = (req) => {
  const authHeader = req.headers.authorization || req.headers["x-auth-token"];
  if (!authHeader) return null;

  const token = authHeader.replace("Bearer ", "");
  const users = loadUsers();

  for (const [username, userData] of Object.entries(users)) {
    if (userData.token === token && userData.tokenExpiry > Date.now()) {
      return { username, ...userData };
    }
  }
  return null;
};

const requireAuth = (req, res) => {
  const user = getUserFromToken(req);
  if (!user) {
    sendJSON(res, { error: "Authentication required" }, 401);
    return null;
  }
  return user;
};

const handleGenerate = async (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;

  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", async () => {
    try {
      const { category, style, description } = JSON.parse(body || "{}");
      const apiKey = process.env.HF_API_KEY || req.headers["x-hf-key"] || "";
      if (!apiKey) {
        sendJSON(res, { error: "Missing HF_API_KEY on server" }, 401);
        return;
      }

      // Create category-specific prompt
      const categoryPrompts = {
        hat: "high quality fashion hat, detailed design",
        shirt: "high quality fashion shirt, detailed fabric texture",
        pants: "high quality fashion pants, detailed fabric texture",
        boots: "high quality fashion boots, detailed leather texture"
      };

      const prompt = `${description || "fashion clothing"}, ${categoryPrompts[category] || ""}, ${style || "modern style"}, professional photography, studio lighting, detailed texture, high resolution`;

      const response = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "image/png",
        },
        body: JSON.stringify({ inputs: prompt, options: { wait_for_model: true } }),
      });

      if (!response.ok) {
        const text = await response.text();
        send(res, response.status, text || "AI generation failed", { "Content-Type": "text/plain" });
        return;
      }

      const arrayBuffer = await response.arrayBuffer();
      const imageData = Buffer.from(arrayBuffer);

      // Save to user's wardrobe
      const wardrobes = loadWardrobes();
      if (!wardrobes[user.username]) {
        wardrobes[user.username] = { hat: [], shirt: [], pants: [], boots: [] };
      }

      const itemId = Date.now().toString();
      const imagePath = path.join(ROOT, "wardrobe_images", user.username, `${itemId}.png`);

      // Ensure directory exists
      fs.mkdirSync(path.dirname(imagePath), { recursive: true });

      // Save image
      fs.writeFileSync(imagePath, imageData);

      // Add to wardrobe
      wardrobes[user.username][category].push({
        id: itemId,
        imagePath: `/wardrobe_images/${user.username}/${itemId}.png`,
        category,
        style: style || "default",
        description: description || "",
        createdAt: new Date().toISOString()
      });

      saveWardrobes(wardrobes);

      sendJSON(res, {
        success: true,
        item: wardrobes[user.username][category][wardrobes[user.username][category].length - 1]
      });

    } catch (error) {
      sendJSON(res, { error: error.message }, 500);
    }
  });
};

const handleSignup = (req, res) => {
  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    try {
      const { username, password, email } = JSON.parse(body || "{}");

      if (!username || !password) {
        sendJSON(res, { error: "Username and password required" }, 400);
        return;
      }

      const users = loadUsers();
      if (users[username]) {
        sendJSON(res, { error: "Username already exists" }, 409);
        return;
      }

      const token = crypto.randomBytes(32).toString("hex");
      users[username] = {
        password: hashPassword(password),
        email: email || "",
        token,
        tokenExpiry: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
        createdAt: new Date().toISOString()
      };

      saveUsers(users);

      // Initialize empty wardrobe
      const wardrobes = loadWardrobes();
      wardrobes[username] = { hat: [], shirt: [], pants: [], boots: [] };
      saveWardrobes(wardrobes);

      sendJSON(res, { success: true, token, username });

    } catch (error) {
      sendJSON(res, { error: error.message }, 500);
    }
  });
};

const handleLogin = (req, res) => {
  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    try {
      const { username, password } = JSON.parse(body || "{}");

      if (!username || !password) {
        sendJSON(res, { error: "Username and password required" }, 400);
        return;
      }

      const users = loadUsers();
      const user = users[username];

      if (!user || user.password !== hashPassword(password)) {
        sendJSON(res, { error: "Invalid credentials" }, 401);
        return;
      }

      // Generate new token
      const token = crypto.randomBytes(32).toString("hex");
      user.token = token;
      user.tokenExpiry = Date.now() + (30 * 24 * 60 * 60 * 1000);
      saveUsers(users);

      sendJSON(res, { success: true, token, username });

    } catch (error) {
      sendJSON(res, { error: error.message }, 500);
    }
  });
};

const handleGetWardrobe = (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;

  const wardrobes = loadWardrobes();
  const userWardrobe = wardrobes[user.username] || { hat: [], shirt: [], pants: [], boots: [] };

  sendJSON(res, { wardrobe: userWardrobe });
};

const handleDeleteItem = (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;

  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const itemId = requestUrl.searchParams.get("id");

  if (!itemId) {
    sendJSON(res, { error: "Item ID required" }, 400);
    return;
  }

  const wardrobes = loadWardrobes();
  const userWardrobe = wardrobes[user.username];

  if (!userWardrobe) {
    sendJSON(res, { error: "Wardrobe not found" }, 404);
    return;
  }

  let deleted = false;
  for (const category of ["hat", "shirt", "pants", "boots"]) {
    const index = userWardrobe[category].findIndex(item => item.id === itemId);
    if (index !== -1) {
      const item = userWardrobe[category][index];

      // Delete image file
      try {
        const imagePath = path.join(ROOT, item.imagePath.replace("/wardrobe_images/", "wardrobe_images/"));
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      } catch (e) {
        console.log("Error deleting image file:", e);
      }

      userWardrobe[category].splice(index, 1);
      deleted = true;
      break;
    }
  }

  if (deleted) {
    saveWardrobes(wardrobes);
    sendJSON(res, { success: true });
  } else {
    sendJSON(res, { error: "Item not found" }, 404);
  }
};

const handleUpdatePreferences = (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;

  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    try {
      const { preferences } = JSON.parse(body || "{}");

      const users = loadUsers();
      users[user.username].preferences = preferences || {};
      saveUsers(users);

      sendJSON(res, { success: true });

    } catch (error) {
      sendJSON(res, { error: error.message }, 500);
    }
  });
};

const ensureUserWardrobe = (wardrobes, username) => {
  if (!wardrobes[username]) {
    wardrobes[username] = { hat: [], shirt: [], pants: [], boots: [] };
  }
  return wardrobes[username];
};

const normalizeCategory = (value) => {
  const text = String(value || '').toLowerCase().trim();

  if (['hat', 'cap', 'beanie', 'helmet'].includes(text)) return 'hat';
  if (['shirt', 'top', 'blouse', 'tee', 'tshirt', 't-shirt', 'jacket'].includes(text)) return 'shirt';
  if (['pants', 'shorts', 'jeans', 'trousers'].includes(text)) return 'pants';
  if (['boots', 'boot', 'shoes', 'shoe', 'sneakers', 'slippers'].includes(text)) return 'boots';

  return 'shirt';
};

const decodeBase64Image = (imageData) => {
  const match = imageData.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid image data');
  }
  return Buffer.from(match[2], 'base64');
};

const makePromptHintsFromWardrobe = (userWardrobe) => {
  const result = { hat: {}, shirt: {}, pants: {}, boots: {} };

  for (const category of ['hat', 'shirt', 'pants', 'boots']) {
    const items = userWardrobe[category] || [];

    result[category].__all = items
      .map(item => item.description)
      .filter(Boolean)
      .slice(-8);

    for (const item of items) {
      const style = item.style || 'default';
      if (!result[category][style]) result[category][style] = [];
      if (item.description) result[category][style].push(item.description);
    }

    for (const key of Object.keys(result[category])) {
      result[category][key] = [...new Set(result[category][key])].slice(-8);
    }
  }

  return result;
};

const handleSmartCapture = (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;

  let body = '';
  req.on('data', chunk => (body += chunk));
  req.on('end', () => {
    try {
      const { imageData, category, style, description } = JSON.parse(body || '{}');

      if (!imageData) {
        sendJSON(res, { error: 'Image data is required' }, 400);
        return;
      }

      const wardrobes = loadWardrobes();
      const userWardrobe = ensureUserWardrobe(wardrobes, user.username);

      const finalCategory = normalizeCategory(category);
      const itemId = Date.now().toString();
      const imageBuffer = decodeBase64Image(imageData);

      const saveDir = path.join(ROOT, 'wardrobe_images', user.username);
      fs.mkdirSync(saveDir, { recursive: true });

      const imagePath = path.join(saveDir, `${itemId}.png`);
      fs.writeFileSync(imagePath, imageBuffer);

      const item = {
        id: itemId,
        imagePath: `/wardrobe_images/${user.username}/${itemId}.png`,
        category: finalCategory,
        style: style || 'captured',
        description: description || `Captured ${finalCategory}`,
        createdAt: new Date().toISOString(),
        source: 'camera'
      };

      userWardrobe[finalCategory].push(item);
      saveWardrobes(wardrobes);

      sendJSON(res, { success: true, item });
    } catch (error) {
      sendJSON(res, { error: error.message }, 500);
    }
  });
};

const handleGenerationHints = (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;

  const wardrobes = loadWardrobes();
  const userWardrobe = ensureUserWardrobe(wardrobes, user.username);
  const hints = makePromptHintsFromWardrobe(userWardrobe);

  sendJSON(res, { success: true, hints });
};

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);

  // API endpoints
  if (requestUrl.pathname === "/api/signup" && req.method === "POST") {
    handleSignup(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/login" && req.method === "POST") {
    handleLogin(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/generate" && req.method === "POST") {
    handleGenerate(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/wardrobe" && req.method === "GET") {
    handleGetWardrobe(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/item" && req.method === "DELETE") {
    handleDeleteItem(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/preferences" && req.method === "PUT") {
    handleUpdatePreferences(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/capture-smart" && req.method === "POST") {
    handleSmartCapture(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/generation-hints" && req.method === "GET") {
    handleGenerationHints(req, res);
    return;
  }

  // Serve wardrobe images
  if (requestUrl.pathname.startsWith("/wardrobe_images/")) {
    const user = getUserFromToken(req);
    if (!user) {
      send(res, 401, "Unauthorized");
      return;
    }

    const imagePath = path.join(ROOT, requestUrl.pathname);
    if (!imagePath.startsWith(path.join(ROOT, "wardrobe_images"))) {
      send(res, 403, "Forbidden");
      return;
    }

    serveFile(imagePath, res);
    return;
  }

  // Default file serving
  let filePath = path.join(ROOT, requestUrl.pathname === "/" ? "wardrobe.html" : requestUrl.pathname);
  if (!filePath.startsWith(ROOT)) {
    send(res, 403, "Forbidden");
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err) {
      send(res, 404, "Not found");
      return;
    }
    if (stats.isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }
    serveFile(filePath, res);
  });
});

server.listen(PORT, () => {
  console.log(`Outfique server running on http://127.0.0.1:${PORT}`);
});
=======
const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const crypto = require("crypto");

const PORT = 5500;
const ROOT = __dirname;
const HF_MODEL = "stabilityai/stable-diffusion-2";
const USERS_FILE = path.join(ROOT, "users.json");
const WARDROBES_FILE = path.join(ROOT, "wardrobes.json");

const mimeTypes = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".json": "application/json",
};

// Initialize data files if they don't exist
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify({}, null, 2));
}
if (!fs.existsSync(WARDROBES_FILE)) {
  fs.writeFileSync(WARDROBES_FILE, JSON.stringify({}, null, 2));
}

const send = (res, status, body, headers = {}) => {
  res.writeHead(status, headers);
  res.end(body);
};

const sendJSON = (res, data, status = 200) => {
  send(res, status, JSON.stringify(data), { "Content-Type": "application/json" });
};

const serveFile = (filePath, res) => {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      send(res, 404, "Not found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    send(res, 200, data, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
  });
};

const hashPassword = (password) => {
  return crypto.createHash("sha256").update(password).digest("hex");
};

const loadUsers = () => {
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
  } catch (e) {
    return {};
  }
};

const saveUsers = (users) => {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

const loadWardrobes = () => {
  try {
    return JSON.parse(fs.readFileSync(WARDROBES_FILE, "utf8"));
  } catch (e) {
    return {};
  }
};

const saveWardrobes = (wardrobes) => {
  fs.writeFileSync(WARDROBES_FILE, JSON.stringify(wardrobes, null, 2));
};

const getUserFromToken = (req) => {
  const authHeader = req.headers.authorization || req.headers["x-auth-token"];
  if (!authHeader) return null;

  const token = authHeader.replace("Bearer ", "");
  const users = loadUsers();

  for (const [username, userData] of Object.entries(users)) {
    if (userData.token === token && userData.tokenExpiry > Date.now()) {
      return { username, ...userData };
    }
  }
  return null;
};

const requireAuth = (req, res) => {
  const user = getUserFromToken(req);
  if (!user) {
    sendJSON(res, { error: "Authentication required" }, 401);
    return null;
  }
  return user;
};

const handleGenerate = async (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;

  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", async () => {
    try {
      const { category, style, description } = JSON.parse(body || "{}");
      const apiKey = process.env.HF_API_KEY || req.headers["x-hf-key"] || "";
      if (!apiKey) {
        sendJSON(res, { error: "Missing HF_API_KEY on server" }, 401);
        return;
      }

      // Create category-specific prompt
      const categoryPrompts = {
        hat: "high quality fashion hat, detailed design",
        shirt: "high quality fashion shirt, detailed fabric texture",
        pants: "high quality fashion pants, detailed fabric texture",
        boots: "high quality fashion boots, detailed leather texture"
      };

      const prompt = `${description || "fashion clothing"}, ${categoryPrompts[category] || ""}, ${style || "modern style"}, professional photography, studio lighting, detailed texture, high resolution`;

      const response = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "image/png",
        },
        body: JSON.stringify({ inputs: prompt, options: { wait_for_model: true } }),
      });

      if (!response.ok) {
        const text = await response.text();
        send(res, response.status, text || "AI generation failed", { "Content-Type": "text/plain" });
        return;
      }

      const arrayBuffer = await response.arrayBuffer();
      const imageData = Buffer.from(arrayBuffer);

      // Save to user's wardrobe
      const wardrobes = loadWardrobes();
      if (!wardrobes[user.username]) {
        wardrobes[user.username] = { hat: [], shirt: [], pants: [], boots: [] };
      }

      const itemId = Date.now().toString();
      const imagePath = path.join(ROOT, "wardrobe_images", user.username, `${itemId}.png`);

      // Ensure directory exists
      fs.mkdirSync(path.dirname(imagePath), { recursive: true });

      // Save image
      fs.writeFileSync(imagePath, imageData);

      // Add to wardrobe
      wardrobes[user.username][category].push({
        id: itemId,
        imagePath: `/wardrobe_images/${user.username}/${itemId}.png`,
        category,
        style: style || "default",
        description: description || "",
        createdAt: new Date().toISOString()
      });

      saveWardrobes(wardrobes);

      sendJSON(res, {
        success: true,
        item: wardrobes[user.username][category][wardrobes[user.username][category].length - 1]
      });

    } catch (error) {
      sendJSON(res, { error: error.message }, 500);
    }
  });
};

const handleSignup = (req, res) => {
  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    try {
      const { username, password, email } = JSON.parse(body || "{}");

      if (!username || !password) {
        sendJSON(res, { error: "Username and password required" }, 400);
        return;
      }

      const users = loadUsers();
      if (users[username]) {
        sendJSON(res, { error: "Username already exists" }, 409);
        return;
      }

      const token = crypto.randomBytes(32).toString("hex");
      users[username] = {
        password: hashPassword(password),
        email: email || "",
        token,
        tokenExpiry: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
        createdAt: new Date().toISOString()
      };

      saveUsers(users);

      // Initialize empty wardrobe
      const wardrobes = loadWardrobes();
      wardrobes[username] = { hat: [], shirt: [], pants: [], boots: [] };
      saveWardrobes(wardrobes);

      sendJSON(res, { success: true, token, username });

    } catch (error) {
      sendJSON(res, { error: error.message }, 500);
    }
  });
};

const handleLogin = (req, res) => {
  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    try {
      const { username, password } = JSON.parse(body || "{}");

      if (!username || !password) {
        sendJSON(res, { error: "Username and password required" }, 400);
        return;
      }

      const users = loadUsers();
      const user = users[username];

      if (!user || user.password !== hashPassword(password)) {
        sendJSON(res, { error: "Invalid credentials" }, 401);
        return;
      }

      // Generate new token
      const token = crypto.randomBytes(32).toString("hex");
      user.token = token;
      user.tokenExpiry = Date.now() + (30 * 24 * 60 * 60 * 1000);
      saveUsers(users);

      sendJSON(res, { success: true, token, username });

    } catch (error) {
      sendJSON(res, { error: error.message }, 500);
    }
  });
};

const handleGetWardrobe = (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;

  const wardrobes = loadWardrobes();
  const userWardrobe = wardrobes[user.username] || { hat: [], shirt: [], pants: [], boots: [] };

  sendJSON(res, { wardrobe: userWardrobe });
};

const handleDeleteItem = (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;

  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const itemId = requestUrl.searchParams.get("id");

  if (!itemId) {
    sendJSON(res, { error: "Item ID required" }, 400);
    return;
  }

  const wardrobes = loadWardrobes();
  const userWardrobe = wardrobes[user.username];

  if (!userWardrobe) {
    sendJSON(res, { error: "Wardrobe not found" }, 404);
    return;
  }

  let deleted = false;
  for (const category of ["hat", "shirt", "pants", "boots"]) {
    const index = userWardrobe[category].findIndex(item => item.id === itemId);
    if (index !== -1) {
      const item = userWardrobe[category][index];

      // Delete image file
      try {
        const imagePath = path.join(ROOT, item.imagePath.replace("/wardrobe_images/", "wardrobe_images/"));
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      } catch (e) {
        console.log("Error deleting image file:", e);
      }

      userWardrobe[category].splice(index, 1);
      deleted = true;
      break;
    }
  }

  if (deleted) {
    saveWardrobes(wardrobes);
    sendJSON(res, { success: true });
  } else {
    sendJSON(res, { error: "Item not found" }, 404);
  }
};

const handleUpdatePreferences = (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;

  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    try {
      const { preferences } = JSON.parse(body || "{}");

      const users = loadUsers();
      users[user.username].preferences = preferences || {};
      saveUsers(users);

      sendJSON(res, { success: true });

    } catch (error) {
      sendJSON(res, { error: error.message }, 500);
    }
  });
};

const ensureUserWardrobe = (wardrobes, username) => {
  if (!wardrobes[username]) {
    wardrobes[username] = { hat: [], shirt: [], pants: [], boots: [] };
  }
  return wardrobes[username];
};

const normalizeCategory = (value) => {
  const text = String(value || '').toLowerCase().trim();

  if (['hat', 'cap', 'beanie', 'helmet'].includes(text)) return 'hat';
  if (['shirt', 'top', 'blouse', 'tee', 'tshirt', 't-shirt', 'jacket'].includes(text)) return 'shirt';
  if (['pants', 'shorts', 'jeans', 'trousers'].includes(text)) return 'pants';
  if (['boots', 'boot', 'shoes', 'shoe', 'sneakers', 'slippers'].includes(text)) return 'boots';

  return 'shirt';
};

const decodeBase64Image = (imageData) => {
  const match = imageData.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid image data');
  }
  return Buffer.from(match[2], 'base64');
};

const makePromptHintsFromWardrobe = (userWardrobe) => {
  const result = { hat: {}, shirt: {}, pants: {}, boots: {} };

  for (const category of ['hat', 'shirt', 'pants', 'boots']) {
    const items = userWardrobe[category] || [];

    result[category].__all = items
      .map(item => item.description)
      .filter(Boolean)
      .slice(-8);

    for (const item of items) {
      const style = item.style || 'default';
      if (!result[category][style]) result[category][style] = [];
      if (item.description) result[category][style].push(item.description);
    }

    for (const key of Object.keys(result[category])) {
      result[category][key] = [...new Set(result[category][key])].slice(-8);
    }
  }

  return result;
};

const handleSmartCapture = (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;

  let body = '';
  req.on('data', chunk => (body += chunk));
  req.on('end', () => {
    try {
      const { imageData, category, style, description } = JSON.parse(body || '{}');

      if (!imageData) {
        sendJSON(res, { error: 'Image data is required' }, 400);
        return;
      }

      const wardrobes = loadWardrobes();
      const userWardrobe = ensureUserWardrobe(wardrobes, user.username);

      const finalCategory = normalizeCategory(category);
      const itemId = Date.now().toString();
      const imageBuffer = decodeBase64Image(imageData);

      const saveDir = path.join(ROOT, 'wardrobe_images', user.username);
      fs.mkdirSync(saveDir, { recursive: true });

      const imagePath = path.join(saveDir, `${itemId}.png`);
      fs.writeFileSync(imagePath, imageBuffer);

      const item = {
        id: itemId,
        imagePath: `/wardrobe_images/${user.username}/${itemId}.png`,
        category: finalCategory,
        style: style || 'captured',
        description: description || `Captured ${finalCategory}`,
        createdAt: new Date().toISOString(),
        source: 'camera'
      };

      userWardrobe[finalCategory].push(item);
      saveWardrobes(wardrobes);

      sendJSON(res, { success: true, item });
    } catch (error) {
      sendJSON(res, { error: error.message }, 500);
    }
  });
};

const handleGenerationHints = (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;

  const wardrobes = loadWardrobes();
  const userWardrobe = ensureUserWardrobe(wardrobes, user.username);
  const hints = makePromptHintsFromWardrobe(userWardrobe);

  sendJSON(res, { success: true, hints });
};

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);

  // API endpoints
  if (requestUrl.pathname === "/api/signup" && req.method === "POST") {
    handleSignup(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/login" && req.method === "POST") {
    handleLogin(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/generate" && req.method === "POST") {
    handleGenerate(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/wardrobe" && req.method === "GET") {
    handleGetWardrobe(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/item" && req.method === "DELETE") {
    handleDeleteItem(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/preferences" && req.method === "PUT") {
    handleUpdatePreferences(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/capture-smart" && req.method === "POST") {
    handleSmartCapture(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/generation-hints" && req.method === "GET") {
    handleGenerationHints(req, res);
    return;
  }

  // Serve wardrobe images
  if (requestUrl.pathname.startsWith("/wardrobe_images/")) {
    const user = getUserFromToken(req);
    if (!user) {
      send(res, 401, "Unauthorized");
      return;
    }

    const imagePath = path.join(ROOT, requestUrl.pathname);
    if (!imagePath.startsWith(path.join(ROOT, "wardrobe_images"))) {
      send(res, 403, "Forbidden");
      return;
    }

    serveFile(imagePath, res);
    return;
  }

  // Default file serving
  let filePath = path.join(ROOT, requestUrl.pathname === "/" ? "wardrobe.html" : requestUrl.pathname);
  if (!filePath.startsWith(ROOT)) {
    send(res, 403, "Forbidden");
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err) {
      send(res, 404, "Not found");
      return;
    }
    if (stats.isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }
    serveFile(filePath, res);
  });
});

server.listen(PORT, () => {
  console.log(`Outfique server running on http://127.0.0.1:${PORT}`);
});
>>>>>>> 087a644171feeb1047d5803ee270c8f322f60b8a
