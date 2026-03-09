# Outfique Wardrobe 👗

A smart wardrobe management app with AI-powered outfit suggestions, camera capture, and personalized style recommendations.

## 🚀 Quick Start

**Access the app:** [http://localhost:5500](http://localhost:5500)

Start server:
```bash
node server.js
```

## ✨ Features

- 📸 **Smart Camera Capture** - Photograph your clothes and they're automatically categorized
- 🤖 **AI Outfit Generation** - Get personalized suggestions based on your style
- 👗 **Outfit Builder** - Create and save daily outfit combinations
- 🔐 **Secure Authentication** - Token-based login with personal data isolation
- 📱 **Mobile Responsive** - Works seamlessly on all devices

## 📁 Project Structure

```
├── server.js                 # Backend Node.js server
├── wardrobe.html            # Main app interface
├── wardrobe.js              # Core app logic & authentication
├── wardrobe.css             # App styling
├── wardrobe-smart-upgrade.js # Camera & AI features
├── index.html               # Home/welcome page
├── about outfique.html      # About page
├── team.html                # Team page
├── DESIGN NI JARED.png      # Logo
├── users.json               # User data (auto-created)
├── wardrobes.json           # Wardrobe data (auto-created)
├── wardrobe_images/         # User image storage
└── README.md                # This file
```

## 🎯 How to Use

1. **Navigate Home** → `http://localhost:5500/`
2. **Sign Up** → Create account with username & password
3. **Add Items** → Use camera or AI generation to add clothes
4. **Build Outfit** → Select items for today's look
5. **Save** → Store your favorite combinations

## 🛠 Technologies

- **Backend:** Node.js (native HTTP)
- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **AI:** Hugging Face Stable Diffusion 2
- **Camera:** WebRTC (getUserMedia)
- **Auth:** Token-based with SHA-256 hashing
- **Storage:** JSON files

## 🎨 Pages

| Page | URL | Purpose |
|------|-----|---------|
| Home | `/` or `index.html` | Welcome & quick guide |
| Wardrobe | `wardrobe.html` | Main app |
| About | `about outfique.html` | Platform info |
| Team | `team.html` | Team credits |

## 🎨 Design

- **Colors:** Purple (#667eea), Dark Purple (#764ba2), Pink (#f75088)
- **Style:** Modern glassmorphism with smooth animations
- **Layout:** Responsive grid & flexbox

## 🔧 API Endpoints

- `POST /api/capture-smart` - Save captured clothing item
- `GET /api/generation-hints` - Get AI suggestions for outfits
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - Create new account

## 📝 Notes

- User data is stored in JSON format (local files)
- Each user has isolated personal data
- Authentication tokens expire after 30 days
- Images are stored in per-user directories
- All features work offline after initial load

---

**Created by the Outfique Team — 2026** 🚀