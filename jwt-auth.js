/**
 * MediTrack JWT Authentication Module
 * ------------------------------------
 * Client-side JWT implementation for hackathon demo.
 * In production, token creation & verification would happen on the server.
 */

const JWTAuth = (() => {
    // Secret key (in production, this stays on the server)
    const SECRET_KEY = 'meditrack-secret-2026';

    // Registered users (mock database)
    const DEFAULT_USERS = [
        { id: 1, email: 'admin@meditrack.com', password: 'admin123', name: 'Admin', role: 'admin' },
        { id: 2, email: 'doctor@meditrack.com', password: 'doctor123', name: 'Dr. Sharma', role: 'doctor' },
        { id: 3, email: 'nurse@meditrack.com', password: 'nurse123', name: 'Nurse Patil', role: 'nurse' },
        { id: 4, email: 'patient@meditrack.com', password: 'patient123', name: 'Rahul Patil', role: 'patient' },
    ];

    function getUsers() {
        const stored = localStorage.getItem('meditrack_users_db');
        if (stored) return JSON.parse(stored);
        localStorage.setItem('meditrack_users_db', JSON.stringify(DEFAULT_USERS));
        return DEFAULT_USERS;
    }

    function saveUsers(users) {
        localStorage.setItem('meditrack_users_db', JSON.stringify(users));
    }

    // --- Base64 URL-safe encode/decode ---
    function base64UrlEncode(str) {
        return btoa(unescape(encodeURIComponent(str)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    }

    function base64UrlDecode(str) {
        str = str.replace(/-/g, '+').replace(/_/g, '/');
        while (str.length % 4) str += '=';
        return decodeURIComponent(escape(atob(str)));
    }

    // --- Simple HMAC-like signature (demo only) ---
    function createSignature(header, payload) {
        const data = header + '.' + payload + '.' + SECRET_KEY;
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return base64UrlEncode(Math.abs(hash).toString(36) + '-' + SECRET_KEY.slice(0, 4));
    }

    // --- Create JWT Token ---
    function createToken(user) {
        const header = base64UrlEncode(JSON.stringify({
            alg: 'HS256',
            typ: 'JWT'
        }));

        const now = Math.floor(Date.now() / 1000);
        const payload = base64UrlEncode(JSON.stringify({
            sub: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            iat: now,
            exp: now + (24 * 60 * 60) // 24 hours
        }));

        const signature = createSignature(header, payload);

        return `${header}.${payload}.${signature}`;
    }

    // --- Decode Token (without verification) ---
    function decodeToken(token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return null;

            const payload = JSON.parse(base64UrlDecode(parts[1]));
            return payload;
        } catch (e) {
            return null;
        }
    }

    // --- Verify Token ---
    function verifyToken(token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return { valid: false, error: 'Invalid token format' };

            // Verify signature
            const expectedSig = createSignature(parts[0], parts[1]);
            if (expectedSig !== parts[2]) {
                return { valid: false, error: 'Invalid signature' };
            }

            // Decode payload
            const payload = JSON.parse(base64UrlDecode(parts[1]));

            // Check expiry
            const now = Math.floor(Date.now() / 1000);
            if (payload.exp && payload.exp < now) {
                return { valid: false, error: 'Token expired' };
            }

            return { valid: true, payload };
        } catch (e) {
            return { valid: false, error: 'Token decode failed' };
        }
    }

    // --- Public API ---
    return {
        /**
         * Authenticate user and return JWT token
         * @param {string} email
         * @param {string} password
         * @returns {{ success: boolean, token?: string, user?: object, error?: string }}
         */
        login(email, password) {
            const users = getUsers();
            const user = users.find(u => u.email === email && u.password === password);
            if (!user) {
                return { success: false, error: 'Invalid email or password' };
            }

            const token = createToken(user);
            localStorage.setItem('meditrack_jwt', token);
            localStorage.setItem('meditrack_user', JSON.stringify({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }));

            return {
                success: true,
                token,
                user: { id: user.id, name: user.name, email: user.email, role: user.role }
            };
        },

        /**
         * Register a new user and automatically log them in
         * @param {string} name 
         * @param {string} email 
         * @param {string} password 
         * @param {string} role 
         */
        register(name, email, password, role) {
            const users = getUsers();
            if (users.find(u => u.email === email)) {
                return { success: false, error: 'Email already registered' };
            }
            const newUser = {
                id: Date.now(),
                name, email, password, role
            };
            users.push(newUser);
            saveUsers(users);
            
            return this.login(email, password);
        },

        /**
         * Check if user is authenticated (valid token exists)
         * @returns {{ authenticated: boolean, user?: object, error?: string }}
         */
        checkAuth() {
            const token = localStorage.getItem('meditrack_jwt');
            if (!token) {
                return { authenticated: false, error: 'No token found' };
            }

            const result = verifyToken(token);
            if (!result.valid) {
                this.logout();
                return { authenticated: false, error: result.error };
            }

            return {
                authenticated: true,
                user: result.payload
            };
        },

        /**
         * Get current user info from token
         * @returns {object|null}
         */
        getUser() {
            const token = localStorage.getItem('meditrack_jwt');
            if (!token) return null;
            return decodeToken(token);
        },

        /**
         * Get the raw JWT token
         * @returns {string|null}
         */
        getToken() {
            return localStorage.getItem('meditrack_jwt');
        },

        /**
         * Logout — clear token and user data
         */
        logout() {
            localStorage.removeItem('meditrack_jwt');
            localStorage.removeItem('meditrack_user');
        },

        /**
         * Protect a page — redirect to login if not authenticated
         * @param {string} loginPage - URL of the login page
         */
        requireAuth(loginPage = 'login.html') {
            const auth = this.checkAuth();
            if (!auth.authenticated) {
                window.location.href = loginPage;
                return null;
            }
            return auth.user;
        }
    };
})();
