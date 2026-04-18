# 🧪 MediTrack Prototype Explanation

## 🎯 Purpose of the Prototype
The current implementation of MediTrack is a high-fidelity MVP (Minimum Viable Product). The goal is to demonstrate the speed, usability, and core functionality of the platform without relying on a heavy backend infrastructure during the hackathon pitch.

## 🖥️ UI & Modules
1. **Authentication Flow** (`login.html`, `register.html`): Secure entry points that validate credentials and manage JWTs.
2. **Admin Dashboard** (`admin.html`): 
   - Displays a city heatmap of emergencies.
   - Provides controls to update ICU bed capacity.
   - Features real-time audio and visual alerts for new emergencies.
3. **Patient Dashboard** (`patient.html`):
   - Interactive Leaflet map showing nearby hospitals.
   - Filters for specialist availability.
   - One-tap emergency request buttons.
4. **Driver Dashboard** (`driver.html`):
   - Traffic-aware routing interface.
   - Live ambulance tracking and dispatch notifications.

## ⚙️ The Simulation Engine
To simulate a live city environment, the prototype includes a custom background engine (`app.js`) that:
- Randomly fluctuates ICU bed counts at predefined hospitals.
- Moves ambulance markers along calculated paths on the Leaflet map.
- Triggers priority alerts for admins when beds run low.

## 🔮 Future Integration
The prototype is designed so that the LocalStorage-based data layer can be seamlessly replaced with a RESTful API or WebSocket connection (e.g., Node.js + MongoDB + Socket.io) in the next phase of development.
