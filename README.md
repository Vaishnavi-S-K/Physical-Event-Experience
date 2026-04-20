# VenueIQ - Event Management & Crowd Intelligence Platform

A comprehensive, real-time event management system with AI-powered crowd flow prediction, stadium-specific data isolation, and role-based dashboards for attendees, staff, and organizers.

## 🎯 Features

### Core Capabilities
- **Real-time Crowd Monitoring** - Live density tracking across stadium zones with heatmap visualization
- **Stadium-Specific Isolation** - Staff and organizers see ONLY data from their assigned stadium; complete data separation at backend and frontend
- **Incident Management** - Real-time incident reporting, tracking, and resolution with severity classification
- **Queue Management** - Dynamic queue monitoring with wait time estimates and capacity tracking
- **AI-Powered Crowd Predictions** - Machine learning-based flow predictions for staff planning
- **Event Lifecycle Management** - Complete event state control from pre-game through post-game analytics
- **Analytics Dashboard** - Revenue tracking, crowd flow analysis, zone statistics for organizers
- **Multi-Stadium Support** - 10 stadium network with independent event operations and staff assignments

### Role-Based Access
- **Attendee**: Book tickets, view queues, check zone availability
- **Staff**: Monitor crowds, manage incidents, coordinate with teams
- **Organizer**: Analytics, revenue reports, staff management, AI predictions

## 🏗️ Architecture

### Tech Stack
**Frontend:**
- React 19 with Vite
- Zustand for state management with localStorage persistence
- Framer Motion for animations
- Lucide React for icons
- CSS custom properties for theming

**Backend:**
- Node.js + Express.js
- MongoDB with Mongoose ODM
- JWT authentication (12-hour expiry)
- Socket.io for real-time updates
- bcryptjs for password hashing

**Database:**
- MongoDB (Local: mongodb://127.0.0.1:27017/venueiq)
- Collections: Users, Stadiums, Events, Zones, ZoneDensities, Queues, Incidents, Staff, Bookings, Notifications, Reservations

### Data Isolation Architecture

**Layer 1 - JWT Claims:**
- Token includes `stadium_id` claim for staff/organizers
- Attendees have no stadium restriction in token

**Layer 2 - Middleware Enforcement:**
- `auth` middleware verifies JWT and extracts `stadium_id`
- `getFilterQuery()` returns `{stadium_id: user.stadium_id}` for staff/organizers
- `getFilterQuery()` returns empty `{}` for attendees (no restriction)

**Layer 3 - Database Queries:**
- All backend routes apply filter query: `Zone.find(getFilterQuery(req.user))`
- Staff can only query their assigned stadium's data
- Cannot override stadium access via query parameters

**Layer 4 - Frontend State:**
- `currentUser` persisted to localStorage in Zustand
- Components use `currentUser?.stadium_id` for filtering
- API service auto-appends `?stadiumId=...` for staff/organizers
- VenueMap component uses three-tier fallback for stadium resolution

## 📦 Installation

### Prerequisites
- Node.js v18+ and npm
- MongoDB running locally on port 27017
- Git

### Clone & Setup

```bash
# Clone repository
git clone <repo-url>
cd Event-Management

# Install dependencies
npm install
cd backend && npm install && cd ..
```

### Configure Environment

Create `.env` in backend directory:
```env
MONGO_URI=mongodb://127.0.0.1:27017/venueiq
JWT_SECRET=venueiq_secret
NODE_ENV=development
PORT=4000
```

### Seed Database

```bash
cd backend
npm run seed:large  # Seeds 10 stadiums with 2000+ attendees, staff, and bookings
```

## 🚀 Running the Application

### Terminal 1 - Backend
```bash
cd backend
npm start
```
Runs on `http://localhost:4000/api`

### Terminal 2 - Frontend
```bash
npm run dev
```
Runs on `http://localhost:5175` (or next available port)

## 📝 Demo Credentials

### Attendee (Can see all stadiums)
- Email: `attendee@demo.com`
- Password: `demo1234`

### Staff (Stadium-Specific - Choose One)
| Stadium | Email | Stadium ID |
|---------|-------|-----------|
| M. Chinnaswamy | `staff_m_chinnaswamy_stadium@gmail.com` | s1 |
| Sree Kanteerava | `staff_sree_kanteerava_stadium@gmail.com` | s2 |
| SNR Cricket | `staff_snr_cricket_stadium@gmail.com` | s3 |
| Nehru Stadium | `staff_nehru_stadium@gmail.com` | s4 |
| Rajiv Gandhi | `staff_rajiv_gandhi_international_stadium@gmail.com` | s5 |
| Eden Gardens | `staff_eden_gardens@gmail.com` | s6 |
| Wankhede | `staff_wankhede_stadium@gmail.com` | s7 |
| Jawaharlal Nehru | `staff_jawaharlal_nehru_stadium@gmail.com` | s8 |
| Maharashtra Cricket | `staff_maharashtra_cricket_ground@gmail.com` | s9 |
| JSCA International | `staff_jsca_international_stadium@gmail.com` | s10 |

### Organizer (Stadium-Specific - Choose One)
Replace `staff_` with `organiser_` in any staff email above.

**All passwords:** `demo1234`

## 🧪 Testing Stadium Isolation

### Manual Test Procedure

1. **Clear browser storage:**
   - Press F12 → Application → Local Storage
   - Delete: `venueiq_currentUser`, `venueiq_stadium`, `venueiq_token`
   - Hard refresh: Ctrl+Shift+R

2. **Open console (F12 → Console tab)**

3. **Login as staff from Stadium 1:**
   - Use: `staff_m_chinnaswamy_stadium@gmail.com`
   - Observe console logs: `[LOGIN] Stadium_id: s1`
   - Verify: Map shows M. Chinnaswamy Stadium image
   - Verify: Zones/staff/incidents are from s1 only

4. **Exit and login as staff from Stadium 2:**
   - Use: `staff_sree_kanteerava_stadium@gmail.com`
   - Observe: `[LOGIN] Stadium_id: s2`
   - Verify: DIFFERENT map image (Sree Kanteerava)
   - Verify: Data is from s2, not s1

5. **Check Network Tab (F12 → Network):**
   - API calls show `?stadiumId=s1` or `?stadiumId=s2`
   - Backend enforces filtering at database level

### Expected Behavior
- Each staff member sees **ONLY** their assigned stadium's data
- Cannot access other stadiums' zones, incidents, or staff
- Backend rejects cross-stadium access even if parameters are manipulated
- Attendees can see all stadiums or specific stadium if filtered

## 📂 Project Structure

```
Event-Management/
├── public/                    # Stadium images (10 stadiums)
│   ├── Chinnaswamy_stadium.webp
│   ├── kanteevera_stadium.jpg
│   └── ... (7 more stadium images)
├── src/
│   ├── api/
│   │   └── apiService.js     # API client with stadium filtering
│   ├── components/
│   │   ├── VenueMap.jsx      # Stadium map display
│   │   ├── IncidentBoard.jsx # Incident management
│   │   ├── QueueManager.jsx  # Queue tracking
│   │   ├── CrowdPredictions.jsx
│   │   └── Navbar.jsx        # Navigation with logout
│   ├── pages/
│   │   ├── LoginPage.jsx     # Authentication entry point
│   │   ├── StaffPortal.jsx   # Staff operations center
│   │   ├── OrganizerDashboard.jsx
│   │   ├── AttendeeDashboard.jsx
│   │   └── LandingPage.jsx
│   ├── store/
│   │   └── useStore.js       # Zustand state with localStorage persistence
│   └── App.jsx
├── backend/
│   ├── models/              # Mongoose schemas
│   │   ├── User.js
│   │   ├── Stadium.js
│   │   ├── Zone.js
│   │   ├── Incident.js
│   │   └── ... (10+ models)
│   ├── routes/              # Express route handlers
│   │   ├── auth.js
│   │   ├── zones.js
│   │   ├── incidents.js
│   │   ├── stadiums.js
│   │   ├── event.js
│   │   └── ... (more routes)
│   ├── middleware/
│   │   └── auth.js          # JWT verification + stadium filtering
│   ├── scripts/
│   │   ├── seedDb.js        # Basic seed (4 stadiums)
│   │   └── seedLargeDb.js   # Full seed (10 stadiums, 2000+ records)
│   ├── server.js            # Express app entry point
│   └── package.json
├── package.json
├── vite.config.js
└── README.md
```

## 🔐 Authentication & Authorization

### Login Flow
1. **POST /api/auth/login** - Verify credentials, return JWT + user object
2. User object includes `stadium_id` for staff/organizers
3. Zustand store persists `currentUser` to localStorage
4. Frontend includes JWT in `Authorization: Bearer <token>` header for all API calls

### Authorization Middleware
```javascript
// Every request:
1. auth middleware validates JWT signature & extracts claims
2. getFilterQuery(req.user) determines database filter:
   - Staff/Organizer: {stadium_id: user.stadium_id}
   - Attendee: {} (no filter - see all)
3. Database query applies filter: Model.find(filter)
```

## 📊 Key API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Current user profile

### Stadiums & Data
- `GET /api/stadiums` - List stadiums (filtered by user role)
- `GET /api/stadiums/:id` - Stadium details
- `GET /api/zones` - All zones for user's stadium
- `GET /api/zones/:id` - Single zone details with history
- `GET /api/events/staff` - Staff for user's stadium
- `GET /api/incidents` - Incidents for user's stadium
- `GET /api/stats/fill-rate/:stadiumId` - Capacity analytics

All endpoints enforce stadium access control via auth middleware.

## 🎨 Frontend Features

### Login Page
- Role selection (Attendee, Staff, Organizer)
- Demo credentials auto-fill
- Error handling with user feedback

### Staff Portal
- Real-time crowd density visualization
- Incident management board
- Staff roster with status
- Zone density summary
- Event phase control

### Organizer Dashboard
- Revenue analytics
- Crowd flow predictions
- Zone statistics
- Staff management
- AI-powered insights

### Attendee Dashboard
- Browse stadiums
- Check queue status
- Book tickets
- View notifications

## 🔄 Real-Time Features

### Socket.io Integration
- Clients connect to stadium-scoped rooms
- Real-time density updates broadcast to staff
- Live incident updates
- Queue wait time changes
- Admin notifications

### Crowd Simulation
- Backend runs simulation every 3 seconds
- Updates density readings
- Triggers predictions
- Broadcasts to connected clients

## 📈 Performance Optimizations

- **Database Indexes** on email, role, stadium_id, status
- **Lean Queries** - `.lean()` for read-only operations
- **Aggregation Pipeline** - For complex density queries
- **Caching** - HTTP 304 responses for unchanged data
- **Virtual Fields** - Mongoose virtuals for computed values

## 🐛 Debugging

### Enable Debug Logging
Console logs included for:
- `[LOGIN]` - Login flow tracing
- `[StaffPortal]` - Stadium resolution
- `[VenueMap]` - Image selection
- `[LOGOUT]` - Session termination

View in browser DevTools → Console tab during testing.

### Database Inspection
```bash
# Connect to MongoDB
mongosh mongodb://127.0.0.1:27017/venueiq

# Check staff accounts
db.users.find({role: 'staff'}).pretty()

# Verify zones per stadium
db.zones.find({stadium_id: 's1'}).count()
```

## 🚨 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Same map for all staff" | Clear localStorage (Ctrl+Shift+R), check console logs for stadium_id |
| "Backend offline" | Ensure backend is running on port 4000 with `npm start` |
| "MongoDB connection failed" | Verify MongoDB is running: `mongosh mongodb://127.0.0.1:27017/venueiq` |
| "Port already in use" | Kill process or use `lsof -i :5175` and `kill <PID>` |
| "CORS errors" | Verify backend has CORS enabled for http://localhost:5175 |

## 📝 Environment Variables

### Backend (.env)
```env
# Required
MONGO_URI=mongodb://127.0.0.1:27017/venueiq
JWT_SECRET=venueiq_secret

# Optional
NODE_ENV=development
PORT=4000
LOG_LEVEL=debug
```

### Frontend (vite.config.js)
```javascript
VITE_API_URL=http://localhost:4000/api
```

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -m "Add your feature"`
3. Push to branch: `git push origin feature/your-feature`
4. Submit a Pull Request

## 📄 License

MIT License - See LICENSE file for details

## 👥 Team

- **Frontend**: React + Zustand state management
- **Backend**: Node.js + Express + MongoDB
- **DevOps**: Local development setup with Vite + npm scripts

## 🎓 Key Learning Points

This application demonstrates:
- **Multi-tenant data isolation** - Complete stadium separation at all layers
- **JWT-based authentication** - Secure token generation and verification
- **Role-based access control (RBAC)** - Three role types with different permissions
- **Real-time updates** - Socket.io for live data broadcasting
- **Database optimization** - Indexing, aggregation, and query filtering
- **Frontend state management** - Zustand with localStorage persistence
- **Component composition** - Reusable React components with props-based isolation

## 📞 Support

For issues or questions:
1. Check browser console for debug logs
2. Verify backend health: `http://localhost:4000/api/health`
3. Review API responses in Network tab (F12)
4. Check TEST_GUIDE.md for comprehensive testing procedure
