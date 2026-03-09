# Outfique - Smart Wardrobe App

A beautiful, modern web application for managing your wardrobe intelligently. Organize clothes by category, build daily outfits, and get personalized style recommendations.

## Features

✨ **Smart Organization**  
Store clothes in four categories: Hat, Shirt, Pants, and Boots

📸 **Camera Capture**  
Take photos of your clothes to add them directly to your wardrobe (desktop only)

👕 **Daily Outfit Builder**  
Create and save complete outfit combinations for each day

🎨 **Style Personalization**  
Add custom descriptions and style tags to every item

💾 **Local Storage**  
All data saved securely in your browser's local storage

## Getting Started

### Installation

No installation required! Simply open `index.html` in your web browser.

### Usage

1. **Sign Up or Login**
   - Navigate to the home page
   - Create an account with a username and password
   - Login to access your wardrobe

2. **Add Items to Wardrobe**
   - Select a style (Casual, Formal, Vintage, Modern, Streetwear, Bohemian, Minimalist)
   - Add a description (e.g., "beige formal blouse")
   - Click "Generate Item" to create a placeholder

3. **Build Your Daily Outfit**
   - Click "Select from Wardrobe" under each category
   - Choose items from your wardrobe drawers
   - Click "Save Today's Look" when done

4. **Edit or Delete Items**
   - Hover over an item in the wardrobe Grid
   - Click "Edit" to update the style or description
   - Click "Delete" to remove it from your wardrobe

## File Structure

```
├── index.html                  # Login/Signup page
├── wardrobe.html              # Main wardrobe application
├── about.html                 # About Outfique page
├── team.html                  # Team information page
├── styles.css                 # Main stylesheet
├── wardrobe-new.js            # Main JavaScript application logic
├── server.js                  # Smart wardrobe upgrade module
├── wardrobe-smart-upgrade.js  # Deprecated (kept for compatibility)
├── users.json                 # User credentials (demo data)
├── wardrobes.json             # Wardrobe storage (demo data)
└── DESIGN NI JARED.png        # Logo image
```

## Data Storage

All user data is stored in the browser's localStorage:
- `users` - Registered user credentials
- `wardrobe_{username}` - User's clothing items
- `daily-outfit_{username}` - Saved daily outfits
- `authToken` - Authentication token
- `username` - Current logged-in user

## Browser Support

✅ Chrome/Chromium 90+  
✅ Firefox 88+  
✅ Safari 14+  
✅ Edge 90+

## Recent Updates & Fixes

### Code Quality
- ✅ Consolidated all CSS into single `styles.css` file
- ✅ Cleaned up JavaScript to remove inline styles
- ✅ Properly organized file structure and naming
- ✅ Implemented localStorage-based data persistence
- ✅ Added comprehensive error handling

### UI/UX Improvements
- ✅ Responsive design for mobile devices
- ✅ Consistent navigation across all pages
- ✅ Improved form validation and error messages
- ✅ Enhanced visual hierarchy and spacing
- ✅ Better accessibility with semantic HTML

### Functionality
- ✅ Local authentication system (no backend required)
- ✅ Complete CRUD operations for wardrobe items
- ✅ Drag-and-drop ready architecture
- ✅ Real-time UI updates
- ✅ Persistent data across sessions

## Development Notes

### Authentication Flow
1. User provides username and password
2. Credentials validated against localStorage
3. Token generated and stored for session
4. User redirected to wardrobe page on success

### Data Persistence
- All operations save immediately to localStorage
- No network requests needed
- Can work offline completely
- Clear browser cache to reset account

### Styling System
- CSS Variables for consistent theming (colors, shadows, spacing)
- Mobile-first responsive design
- Flexbox and CSS Grid for layouts
- Smooth transitions on interactive elements

## Future Enhancements

🔮 Backend API integration  
🔮 Image upload from device camera  
🔮 AI-powered outfit recommendations  
🔮 Weather-based style suggestions  
🔮 Social sharing features  
🔮 Dark mode support  
🔮 Multi-device synchronization  

## Troubleshooting

**Issue: "Username not found" error**
- Make sure you've completed the signup process
- Credentials are case-sensitive

**Issue: Data not saving**
- Check if localStorage is enabled in your browser
- Clear browser cache and try again
- Check browser console for error messages

**Issue: Camera not working**
- Grant camera permissions in browser settings
- Only works on HTTPS or localhost
- Must use desktop browser (not mobile)

## Performance Optimizations

⚡ Minimal dependencies (vanilla JavaScript)  
⚡ CSS Grid for efficient layout  
⚡ Event delegation for dynamic elements  
⚡ Local storage for instant data access  
⚡ Optimized image rendering  

## License

© 2026 Outfique. All rights reserved.

## Contact

Questions or feedback? Reach out to: hello@outfique.com

---

**Happy styling!** 👗👔👠
