// Outfique Wardrobe JavaScript

class WardrobeApp {
    constructor() {
        this.token = localStorage.getItem('authToken');
        this.username = localStorage.getItem('username');
        this.currentCategory = 'hat';
        this.currentItem = null;
        this.dailyOutfit = { hat: null, shirt: null, pants: null, boots: null };
        this.selectingForCategory = null;

        this.init();
    }

    init() {
        if (window.location.pathname.includes('login.html')) {
            this.initAuth();
        } else if (window.location.pathname.includes('wardrobe.html') || window.location.pathname === '/') {
            if (!this.token) {
                this.showLoginOnWardrobe();
            } else {
                this.initWardrobe();
            }
        }
    }

    // Authentication Methods
    initAuth() {
        this.bindAuthEvents();
        this.checkAuthRedirect();
    }

    bindAuthEvents() {
        // Tab switching
        document.getElementById('loginTab').addEventListener('click', () => this.switchTab('login'));
        document.getElementById('signupTab').addEventListener('click', () => this.switchTab('signup'));

        // Form submissions
        document.getElementById('loginBtn').addEventListener('click', () => this.handleLogin());
        document.getElementById('signupBtn').addEventListener('click', () => this.handleSignup());

        // Terms modal
        document.getElementById('termsLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.showTermsModal();
        });

        // Enter key handlers
        document.getElementById('loginPassword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });
        document.getElementById('signupConfirmPassword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSignup();
        });
    }

    switchTab(tab) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));

        document.getElementById(`${tab}Tab`).classList.add('active');
        document.getElementById(`${tab}Form`).classList.add('active');
    }

    async handleLogin() {
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!username || !password) {
            this.showMessage('Please fill in all fields', 'error');
            return;
        }

        try {
            const response = await this.apiRequest('/api/login', 'POST', { username, password });
            if (response.success) {
                localStorage.setItem('authToken', response.token);
                localStorage.setItem('username', response.username);
                window.location.href = 'wardrobe.html';
            } else {
                this.showMessage(response.error || 'Login failed', 'error');
            }
        } catch (error) {
            this.showMessage('Network error. Please try again.', 'error');
        }
    }

    async handleSignup() {
        const username = document.getElementById('signupUsername').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;
        const acceptTerms = document.getElementById('acceptTerms').checked;

        if (!username || !password) {
            this.showMessage('Please fill in all required fields', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showMessage('Passwords do not match', 'error');
            return;
        }

        if (!acceptTerms) {
            this.showMessage('Please accept the Terms and Conditions', 'error');
            return;
        }

        try {
            const response = await this.apiRequest('/api/signup', 'POST', { username, password, email });
            if (response.success) {
                localStorage.setItem('authToken', response.token);
                localStorage.setItem('username', response.username);
                window.location.href = 'wardrobe.html';
            } else {
                this.showMessage(response.error || 'Signup failed', 'error');
            }
        } catch (error) {
            this.showMessage('Network error. Please try again.', 'error');
        }
    }

    showMessage(message, type) {
        const messageEl = document.getElementById('message');
        messageEl.textContent = message;
        messageEl.className = `message ${type}`;
        setTimeout(() => {
            messageEl.className = 'message';
        }, 5000);
    }

    showTermsModal() {
        const modal = document.getElementById('termsModal');
        modal.style.display = 'flex';

        const closeBtn = modal.querySelector('.close');
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    showLoginOnWardrobe() {
        // Hide wardrobe content and show login overlay
        document.querySelector('.wardrobe-container').style.display = 'none';

        // Create login overlay
        const loginOverlay = document.createElement('div');
        loginOverlay.id = 'loginOverlay';
        loginOverlay.innerHTML = `
            <div class="auth-container">
                <div class="auth-card">
                    <h1>Outfique Wardrobe</h1>
                    <p>Your Personal Clothing Collection</p>
                    <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 20px;">
                        Login to access your wardrobe or sign up to create your collection
                    </p>

                    <div class="auth-tabs">
                        <button id="overlayLoginTab" class="tab active">Login</button>
                        <button id="overlaySignupTab" class="tab">Sign Up</button>
                    </div>

                    <div id="overlayLoginForm" class="auth-form active">
                        <div class="form-group">
                            <label for="overlayLoginUsername">Username</label>
                            <input type="text" id="overlayLoginUsername" required>
                        </div>
                        <div class="form-group">
                            <label for="overlayLoginPassword">Password</label>
                            <input type="password" id="overlayLoginPassword" required>
                        </div>
                        <button id="overlayLoginBtn" class="auth-btn">Login</button>
                    </div>

                    <div id="overlaySignupForm" class="auth-form">
                        <div class="form-group">
                            <label for="overlaySignupUsername">Username</label>
                            <input type="text" id="overlaySignupUsername" required>
                        </div>
                        <div class="form-group">
                            <label for="overlaySignupEmail">Email (optional)</label>
                            <input type="email" id="overlaySignupEmail">
                        </div>
                        <div class="form-group">
                            <label for="overlaySignupPassword">Password</label>
                            <input type="password" id="overlaySignupPassword" required>
                        </div>
                        <div class="form-group">
                            <label for="overlaySignupConfirmPassword">Confirm Password</label>
                            <input type="password" id="overlaySignupConfirmPassword" required>
                        </div>
                        <div class="terms">
                            <input type="checkbox" id="overlayAcceptTerms" required>
                            <label for="overlayAcceptTerms">I accept the <a href="#" id="overlayTermsLink">Terms and Conditions</a></label>
                        </div>
                        <button id="overlaySignupBtn" class="auth-btn">Sign Up</button>
                    </div>

                    <div id="overlayMessage" class="message"></div>
                </div>
            </div>

            <!-- Terms and Conditions Modal -->
            <div id="overlayTermsModal" class="modal">
                <div class="modal-content">
                    <span class="close">&times;</span>
                    <h2>Terms and Conditions</h2>
                    <div class="terms-content">
                        <h3>1. Ownership and Originality</h3>
                        <p>All clothing designs generated through this platform are considered original creations. Users retain ownership of their generated designs.</p>
                        <h3>2. Usage Rights</h3>
                        <p>Generated clothing designs may be used for personal, non-commercial purposes only. Commercial use requires explicit permission.</p>
                        <h3>3. Plagiarism Prevention</h3>
                        <p>Users are prohibited from copying, reproducing, or distributing designs that infringe on existing copyrights or trademarks. All generated content must be original.</p>
                        <h3>4. Data Privacy</h3>
                        <p>User data and generated designs are stored securely. We do not share personal information with third parties without consent.</p>
                        <h3>5. Account Responsibility</h3>
                        <p>Users are responsible for maintaining the confidentiality of their account credentials and for all activities under their account.</p>
                        <h3>6. Content Guidelines</h3>
                        <p>Generated content must not include offensive, harmful, or inappropriate material. Violation may result in account suspension.</p>
                        <h3>7. Service Availability</h3>
                        <p>We strive to provide continuous service but do not guarantee uninterrupted access. Service maintenance may occur periodically.</p>
                        <h3>8. Limitation of Liability</h3>
                        <p>Outfique Wardrobe is not liable for any indirect, incidental, or consequential damages arising from use of the service.</p>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(loginOverlay);
        this.bindOverlayAuthEvents();
    }

    bindOverlayAuthEvents() {
        // Tab switching
        document.getElementById('overlayLoginTab').addEventListener('click', () => this.switchOverlayTab('login'));
        document.getElementById('overlaySignupTab').addEventListener('click', () => this.switchOverlayTab('signup'));

        // Form submissions
        document.getElementById('overlayLoginBtn').addEventListener('click', () => this.handleOverlayLogin());
        document.getElementById('overlaySignupBtn').addEventListener('click', () => this.handleOverlaySignup());

        // Terms modal
        document.getElementById('overlayTermsLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.showOverlayTermsModal();
        });

        // Enter key handlers
        document.getElementById('overlayLoginPassword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleOverlayLogin();
        });
        document.getElementById('overlaySignupConfirmPassword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleOverlaySignup();
        });
    }

    switchOverlayTab(tab) {
        document.querySelectorAll('#loginOverlay .tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('#loginOverlay .auth-form').forEach(f => f.classList.remove('active'));

        const tabId = `overlay${tab.charAt(0).toUpperCase() + tab.slice(1)}Tab`;
        const formId = `overlay${tab.charAt(0).toUpperCase() + tab.slice(1)}Form`;
        document.getElementById(tabId).classList.add('active');
        document.getElementById(formId).classList.add('active');
    }

    async handleOverlayLogin() {
        const username = document.getElementById('overlayLoginUsername').value.trim();
        const password = document.getElementById('overlayLoginPassword').value;

        if (!username || !password) {
            this.showOverlayMessage('Please fill in all fields', 'error');
            return;
        }

        try {
            const response = await this.apiRequest('/api/login', 'POST', { username, password });
            if (response.success) {
                localStorage.setItem('authToken', response.token);
                localStorage.setItem('username', response.username);
                this.token = response.token;
                this.username = response.username;
                document.getElementById('loginOverlay').remove();
                document.querySelector('.wardrobe-container').style.display = 'block';
                this.initWardrobe();
            } else {
                this.showOverlayMessage(response.error || 'Login failed', 'error');
            }
        } catch (error) {
            this.showOverlayMessage('Network error. Please try again.', 'error');
        }
    }

    async handleOverlaySignup() {
        const username = document.getElementById('overlaySignupUsername').value.trim();
        const email = document.getElementById('overlaySignupEmail').value.trim();
        const password = document.getElementById('overlaySignupPassword').value;
        const confirmPassword = document.getElementById('overlaySignupConfirmPassword').value;
        const acceptTermsCheckbox = document.getElementById('overlayAcceptTerms');
        const acceptTerms = acceptTermsCheckbox ? acceptTermsCheckbox.checked : false;

        if (!username || !password) {
            this.showOverlayMessage('Please fill in all required fields', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showOverlayMessage('Passwords do not match', 'error');
            return;
        }

        if (!acceptTerms) {
            this.showOverlayMessage('Please accept the Terms and Conditions', 'error');
            return;
        }

        try {
            const response = await this.apiRequest('/api/signup', 'POST', { username, password, email });
            if (response.success) {
                localStorage.setItem('authToken', response.token);
                localStorage.setItem('username', response.username);
                this.token = response.token;
                this.username = response.username;
                document.getElementById('loginOverlay').remove();
                document.querySelector('.wardrobe-container').style.display = 'block';
                this.initWardrobe();
            } else {
                this.showOverlayMessage(response.error || 'Signup failed', 'error');
            }
        } catch (error) {
            this.showOverlayMessage('Network error. Please try again.', 'error');
        }
    }

    showOverlayMessage(message, type) {
        const messageEl = document.getElementById('overlayMessage');
        messageEl.textContent = message;
        messageEl.className = `message ${type}`;
        setTimeout(() => {
            messageEl.className = 'message';
        }, 5000);
    }

    showOverlayTermsModal() {
        const modal = document.getElementById('overlayTermsModal');
        modal.style.display = 'flex';

        const closeBtn = modal.querySelector('.close');
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    // Wardrobe Methods
    initWardrobe() {
        this.loadUserInfo();
        this.bindWardrobeEvents();
        this.loadWardrobe();
        this.loadDailyOutfit();
    }

    loadUserInfo() {
        document.getElementById('username').textContent = `@${this.username}`;
    }

    bindWardrobeEvents() {
        // Category tabs
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchCategory(tab.dataset.category));
        });

        // Generation
        document.getElementById('generateBtn').addEventListener('click', () => this.generateItem());

        // Daily outfit
        document.getElementById('saveDailyOutfitBtn').addEventListener('click', () => this.saveDailyOutfit());
        document.querySelectorAll('.select-from-drawer-btn').forEach(btn => {
            btn.addEventListener('click', () => this.selectFromDrawer(btn.dataset.category));
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());

        // Modals
        this.bindModalEvents();
    }

    switchCategory(category) {
        this.currentCategory = category;

        // Update active tab
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`).classList.add('active');

        // Update drawer title
        const titles = {
            hat: 'My Hats',
            shirt: 'My Shirts',
            pants: 'My Pants',
            boots: 'My Boots'
        };
        document.getElementById('drawerTitle').textContent = titles[category];

        this.loadWardrobe();
    }

    async loadWardrobe() {
        try {
            const response = await this.apiRequest('/api/wardrobe');
            if (response.wardrobe) {
                this.renderWardrobe(response.wardrobe);
            }
        } catch (error) {
            console.error('Failed to load wardrobe:', error);
        }
    }

    renderWardrobe(wardrobe) {
        const grid = document.getElementById('wardrobeGrid');
        const emptyState = document.getElementById('emptyState');
        const items = wardrobe[this.currentCategory] || [];

        document.getElementById('itemCount').textContent = `${items.length} items`;

        if (items.length === 0) {
            grid.innerHTML = '';
            emptyState.style.display = 'flex';
            return;
        }

        emptyState.style.display = 'none';

        grid.innerHTML = items.map(item => `
            <div class="wardrobe-item" data-id="${item.id}" data-item='${JSON.stringify(item)}'>
                <div class="item-image">
                    <img src="${item.imagePath}" alt="${item.description}" loading="lazy">
                </div>
                <div class="item-info">
                    <div class="item-category">${item.category}</div>
                    <div class="item-style">${item.style}</div>
                </div>
            </div>
        `).join('');

        // Bind item click events
        document.querySelectorAll('.wardrobe-item').forEach(item => {
            item.addEventListener('click', () => {
                const itemData = JSON.parse(item.dataset.item);
                if (this.selectingForCategory) {
                    this.selectForDailyOutfit(itemData);
                } else {
                    this.showItemModal(itemData);
                }
            });
        });
    }

    // Daily Outfit Methods
    selectFromDrawer(category) {
        this.selectingForCategory = category;
        this.switchCategory(category);

        // Highlight the selection mode
        document.querySelectorAll('.wardrobe-item').forEach(item => {
            item.style.borderColor = 'var(--accent-color)';
        });

        // Show instruction
        const instruction = document.createElement('div');
        instruction.id = 'selectionInstruction';
        instruction.textContent = `Click an item to select for your daily ${category}`;
        instruction.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--accent-color);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 1000;
            font-weight: 500;
        `;
        document.body.appendChild(instruction);

        // Add cancel button with ID
        const cancelBtn = document.createElement('button');
        cancelBtn.id = 'selectionCancelBtn';
        cancelBtn.textContent = 'Cancel Selection';
        cancelBtn.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--danger-color);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            z-index: 1000;
        `;
        cancelBtn.addEventListener('click', () => this.cancelSelection());
        document.body.appendChild(cancelBtn);
    }

    selectForDailyOutfit(item) {
        this.dailyOutfit[this.selectingForCategory] = item;
        this.updateDailyOutfitDisplay();
        this.cancelSelection();
    }

    cancelSelection() {
        this.selectingForCategory = null;

        // Remove highlights
        document.querySelectorAll('.wardrobe-item').forEach(item => {
            item.style.borderColor = '';
        });

        // Remove instruction and cancel button using IDs
        const instruction = document.getElementById('selectionInstruction');
        const cancelBtn = document.getElementById('selectionCancelBtn');
        if (instruction) instruction.remove();
        if (cancelBtn) cancelBtn.remove();
    }

    updateDailyOutfitDisplay() {
        Object.keys(this.dailyOutfit).forEach(category => {
            const slot = document.getElementById(`daily${category.charAt(0).toUpperCase() + category.slice(1)}`);
            const item = this.dailyOutfit[category];

            if (item) {
                slot.innerHTML = `
                    <img src="${item.imagePath}" alt="${item.description}">
                    <div class="selected-item-info">
                        <small>${item.style}</small>
                    </div>
                `;
            } else {
                slot.innerHTML = `<div class="empty-slot">No ${category} selected</div>`;
            }
        });
    }

    async saveDailyOutfit() {
        const hasItems = Object.values(this.dailyOutfit).some(item => item !== null);

        if (!hasItems) {
            alert('Please select at least one item for your daily outfit!');
            return;
        }

        // Save to localStorage for persistence
        localStorage.setItem(`dailyOutfit_${this.username}`, JSON.stringify(this.dailyOutfit));

        try {
            const response = await this.apiRequest('/api/preferences', 'PUT', {
                dailyOutfit: this.dailyOutfit,
                lastUpdated: new Date().toISOString()
            });

            if (response.success) {
                alert('Daily outfit saved successfully!');
            } else {
                alert('Failed to save daily outfit');
            }
        } catch (error) {
            alert('Network error. Please try again.');
        }
    }

    // Load daily outfit when initializing wardrobe
    async loadDailyOutfit() {
        try {
            // For now, we'll load from localStorage as the server preferences aren't fully implemented
            const saved = localStorage.getItem(`dailyOutfit_${this.username}`);
            if (saved) {
                this.dailyOutfit = JSON.parse(saved);
                this.updateDailyOutfitDisplay();
            }
        } catch (error) {
            console.error('Failed to load daily outfit:', error);
        }
    }

    async generateItem() {
        const description = document.getElementById('itemDescription').value.trim();
        const style = document.getElementById('itemStyle').value;

        if (!description) {
            this.showStatus('Please enter a description', 'error');
            return;
        }

        const generateBtn = document.getElementById('generateBtn');
        generateBtn.disabled = true;
        generateBtn.textContent = 'Generating...';

        this.showStatus('Generating your clothing item...', 'loading');

        try {
            const response = await this.apiRequest('/api/generate', 'POST', {
                category: this.currentCategory,
                style,
                description
            });

            if (response.success) {
                this.showStatus('Item generated successfully!', 'success');
                document.getElementById('itemDescription').value = '';
                this.loadWardrobe();
            } else {
                this.showStatus(response.error || 'Generation failed', 'error');
            }
        } catch (error) {
            this.showStatus('Network error. Please try again.', 'error');
        } finally {
            generateBtn.disabled = false;
            generateBtn.textContent = 'Generate Item';
        }
    }

    showStatus(message, type) {
        const statusEl = document.getElementById('generationStatus');
        statusEl.textContent = message;
        statusEl.className = `status-message ${type}`;

        if (type !== 'loading') {
            setTimeout(() => {
                statusEl.className = 'status-message';
            }, 3000);
        }
    }

    showItemModal(item) {
        this.currentItem = item;

        document.getElementById('modalImage').src = item.imagePath;
        document.getElementById('modalTitle').textContent = `${item.category} - ${item.style}`;
        document.getElementById('modalCategory').textContent = item.category;
        document.getElementById('modalStyle').textContent = item.style;
        document.getElementById('modalDate').textContent = new Date(item.createdAt).toLocaleDateString();
        document.getElementById('modalDescription').textContent = item.description || 'No description';

        document.getElementById('itemModal').classList.add('show');
    }

    bindModalEvents() {
        // Close modals
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.classList.remove('show');
                });
            });
        });

        // Item modal actions
        document.getElementById('editBtn').addEventListener('click', () => this.showEditModal());
        document.getElementById('deleteBtn').addEventListener('click', () => this.deleteItem());

        // Edit modal
        document.getElementById('saveEditBtn').addEventListener('click', () => this.saveEdit());

        // Click outside to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                }
            });
        });
    }

    showEditModal() {
        document.getElementById('editStyle').value = this.currentItem.style;
        document.getElementById('editDescription').value = this.currentItem.description || '';
        document.getElementById('editModal').classList.add('show');
    }

    async saveEdit() {
        const newStyle = document.getElementById('editStyle').value;
        const newDescription = document.getElementById('editDescription').value.trim();

        // For now, we'll just update the local data
        // In a full implementation, you'd send this to the server
        this.currentItem.style = newStyle;
        this.currentItem.description = newDescription;

        document.getElementById('editModal').classList.remove('show');
        document.getElementById('itemModal').classList.remove('show');

        // Reload wardrobe to reflect changes
        this.loadWardrobe();
    }

    async deleteItem() {
        if (!confirm('Are you sure you want to delete this item?')) return;

        try {
            const response = await this.apiRequest(`/api/item?id=${this.currentItem.id}`, 'DELETE');
            if (response.success) {
                document.getElementById('itemModal').classList.remove('show');
                this.loadWardrobe();
            } else {
                alert('Failed to delete item');
            }
        } catch (error) {
            alert('Network error. Please try again.');
        }
    }

    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        window.location.href = 'login.html';
    }

    async apiRequest(endpoint, method = 'GET', data = null) {
        const headers = {
            'Authorization': `Bearer ${this.token}`
        };

        if (data) {
            headers['Content-Type'] = 'application/json';
        }

        const config = {
            method,
            headers
        };

        if (data) {
            config.body = JSON.stringify(data);
        }

        const response = await fetch(endpoint, config);
        return await response.json();
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new WardrobeApp();
});