# Club Vision - Architecture Documentation

This document describes the existing architecture and flows exactly as implemented. No missing features are inferred, and no refactoring is suggested.

## Project Structure

The project consists of three main components:

1. **backend/** - FastAPI Python backend
2. **admin-web/** - Next.js 16 admin web application
3. **mobile-app/** - React Native/Expo mobile application

---

## Backend Architecture

### Technology Stack
- **Framework**: FastAPI
- **Database**: MySQL (via SQLAlchemy with PyMySQL)
- **Database Connection**: `mysql+pymysql://dbusr_club:clubshub@localhost:3306/clubvision`
- **Dependencies**: fastapi, uvicorn, python-dotenv, sqlalchemy, pymysql

### Application Entry Point
- **File**: `backend/app/main.py`
- **CORS**: Configured to allow all origins (`allow_origins=["*"]`)
- **Health Check**: `/health` endpoint returns `{"status": "ok"}`
- **Database Test**: `/db-test` endpoint tests database connectivity

### Router Organization
Routers are registered in `main.py` in the following order:
1. `auth.router` - Authentication endpoints
2. `clubs.router` - Club-related endpoints (prefix: `/me`)
3. `announcements.router` - Announcement endpoints
4. `dependents.router` - Dependent management endpoints
5. `admin_memberships.router` - Admin membership management (prefix: `/admin`)
6. `admin_events.router` - Admin event management (prefix: `/admin`)
7. `events.router` - Member event endpoints
8. `event_passes.router` - Event pass endpoints
9. `admin_club_members.router` - Admin club member listing (prefix: `/admin`)

### Database Session Management
- **File**: `backend/app/db/session.py`
- Uses SQLAlchemy `create_engine` with connection pooling (`pool_pre_ping=True`)
- `SessionLocal` sessionmaker configured with `autocommit=False`, `autoflush=False`
- Direct SQL execution via `text()` queries (no ORM models)

### Authentication System

#### Token Format
- **Format**: `user-{user_id}` (temporary, not JWT)
- **Storage**: Token stored in `localStorage` as `admin_token` (admin web) or `auth_token` (mobile app)
- **Header**: `Authorization: Bearer {token}`

#### Authentication Flow
1. **OTP Request** (`POST /auth/request-otp`)
   - Validates phone number (must be digits)
   - Generates 6-digit OTP
   - Stores OTP in-memory with 5-minute expiry
   - Prints OTP to console for debugging

2. **OTP Verification** (`POST /auth/verify-otp`)
   - Verifies OTP against stored value
   - Checks expiry (5 minutes)
   - Retrieves or creates user by phone number
   - Returns token and user_id

#### OTP Service
- **File**: `backend/app/services/otp_service.py`
- **Storage**: In-memory dictionary `_otp_store`
- **Expiry**: 300 seconds (5 minutes)
- **Format**: 6-digit random number (100000-999999)
- **Debug**: Prints OTP to console

#### User Repository
- **File**: `backend/app/db/user_repo.py`
- `get_user_by_phone(phone: str)` - Retrieves user by phone number
- `create_user(phone: str)` - Creates new user, returns user_id

#### Auth Dependencies
- **File**: `backend/app/core/auth.py`
- `get_current_user_id(authorization: str)` - Extracts user_id from Bearer token
- Validates token format: must start with "Bearer " and contain "user-{id}"

#### Admin Authorization
- **File**: `backend/app/auth/admin_dependencies.py`
- `get_admin_user(user_id)` - Validates user has admin or superadmin role in memberships table
- Checks `memberships` table for `role IN ('admin', 'superadmin')`

### API Endpoints

#### Authentication (`/auth`)
- `POST /auth/request-otp` - Request OTP for phone number
- `POST /auth/verify-otp` - Verify OTP and get token

#### User Clubs (`/me`)
- `GET /me/clubs` - Get all clubs for authenticated user
  - Returns clubs with membership status, expiry, and members (self + dependents)
  - Uses `membership_repo.get_clubs_for_user()`

#### Announcements
- `GET /clubs/{club_id}/announcements` - Get announcements for club (member access)
- `POST /clubs/{club_id}/announcements` - Create announcement (admin only)
  - Requires: `title`, `message` in payload

#### Dependents (`/me/dependents`)
- `GET /me/dependents` - List user's dependents
- `POST /me/dependents` - Create dependent
  - Requires: `name`, `relation`, optional `date_of_birth`

#### Events
- `GET /clubs/{club_id}/events` - List events for club (member access)
- `POST /events/{event_id}/attend` - Attend event and generate pass
  - Validates membership (self or dependent)
  - Creates event pass with unique pass_code
  - Payload: `{ "dependent_id": number | null }`

#### Event Passes
- `GET /me/passes` - Get all passes for authenticated user
- `GET /events/{event_id}/passes/me` - Get user's passes for specific event
- `POST /events/{event_id}/passes` - Generate event pass
  - Payload: `{ "dependent_id": number | null }`
  - Returns: `{ "pass_code": string }`

#### Admin Endpoints (`/admin`)

**Memberships:**
- `GET /admin/clubs/{club_id}/pending-members` - List pending memberships
- `POST /admin/memberships/{membership_id}/approve` - Approve membership
- `POST /admin/memberships/{membership_id}/reject` - Reject membership
  - Payload: `{ "reason": string }`

**Club Members:**
- `GET /admin/clubs/{club_id}/members` - List all members (active, pending, rejected)

**Events:**
- `POST /admin/clubs/{club_id}/events` - Create event
  - Payload: `CreateEventRequest` with `title`, `description`, `event_date`, `location`, `requires_pass`

### Database Repositories

#### Membership Repository (`membership_repo.py`)
- `get_clubs_for_user(user_id)` - Returns clubs with nested members array
  - Groups memberships by club_id
  - Includes self and dependent members
  - Returns status, rejection_reason, expiry_date
- `is_user_member_of_event_club(user_id, event_id, dependent_id)` - Validates membership for event attendance

#### Event Repository (`event_repo.py`)
- `create_event(club_id, title, description, event_date, location, requires_pass)` - Creates event
- `get_events_for_club(club_id)` - Lists events ordered by event_date ASC

#### Event Pass Repository (`event_pass_repo.py`)
- `create_event_pass(event_id, user_id, dependent_id)` - Creates pass with UUID-based pass_code (first 10 chars)
  - Prevents duplicate passes for same event/user/dependent combination
  - Raises ValueError if pass already exists
- `get_passes_for_user(user_id)` - Returns all passes with event and club details
- `get_passes_for_user_event(event_id, user_id)` - Returns list of dependent_ids that have passes

#### Announcement Repository (`announcement_repo.py`)
- `get_announcements_for_club(club_id)` - Returns announcements ordered by created_at DESC

#### Admin Members Repository (`admin_members_repo.py`)
- `get_all_members_for_club(club_id)` - Returns all members with phone, member_type, status, rejection_reason

#### Dependents Repository (`dependents_repo.py`)
- `create_dependent(user_id, name, relation, date_of_birth)` - Creates dependent
- `get_dependents_for_user(user_id)` - Lists dependents ordered by created_at DESC

---

## Admin Web Architecture

### Technology Stack
- **Framework**: Next.js 16.1.1
- **React**: 19.2.3
- **TypeScript**: Yes
- **Styling**: Tailwind CSS 4, inline styles
- **API Base URL**: `http://127.0.0.1:8000` (hardcoded)

### Application Structure

#### Root Layout (`src/app/layout.tsx`)
- Uses Geist and Geist Mono fonts
- Applies global CSS from `globals.css`
- Metadata: "Create Next App" (default Next.js template)

#### Admin Layout (`src/app/admin/layout.tsx`)
- **Client Component**: Uses `'use client'` directive
- **Auth Guard**: Checks `localStorage.getItem('admin_token')` on mount
- Redirects to `/login` if no token
- Renders black header: "Tsaheylu — Admin Panel"
- Main content area with padding

#### Login Page (`src/app/login/page.tsx`)
- **Two-step flow**: Phone input → OTP input
- Phone validation: 10 digits only
- OTP validation: 6 digits
- Stores token in `localStorage` as `admin_token`
- Redirects to `/admin` after successful verification

#### Admin Home (`src/app/admin/page.tsx`)
- Displays "Admin Dashboard"
- Hardcoded club shortcut: "Shri Jain Shwetambar Sangh" → `/admin/clubs/1`

#### Club Layout (`src/app/admin/clubs/[clubId]/layout.tsx`)
- **Sidebar Navigation**:
  - Overview (`/admin/clubs/{clubId}`)
  - Members (`/admin/clubs/{clubId}/members`)
  - Pending Members (`/admin/clubs/{clubId}/pending-members`)
  - Announcements (`/admin/clubs/{clubId}/announcements`)
  - Events (`/admin/clubs/{clubId}/events`)
  - Passes (`/admin/clubs/{clubId}/passes`) - Link exists but page not implemented

#### Club Dashboard (`src/app/admin/clubs/[clubId]/page.tsx`)
- Displays club ID
- Grid of cards linking to: Members, Announcements, Events, Passes

#### Club Members Page (`src/app/admin/clubs/[clubId]/members/page.tsx`)
- Fetches members via `fetchAllClubMembers(clubId)`
- Displays table with: Phone, Member, Type, Status
- Uses `@/lib/api/adminMembers` API client

#### Pending Members Page (`src/app/admin/clubs/[clubId]/pending-members/page.tsx`)
- Fetches pending members via `fetchPendingMembers(clubId)`
- Table displays: Phone, Member, Relation, Actions
- Actions: Approve (no confirmation), Reject (prompts for reason)

#### Events Page (`src/app/admin/clubs/[clubId]/events/page.tsx`)
- Lists events for club
- "Create Event" button links to `/admin/clubs/{clubId}/events/new`
- Displays event title, date, location

#### Create Event Page (`src/app/admin/clubs/[clubId]/events/new/page.tsx`)
- Form fields: title, description, event_date (datetime-local), location, requires_pass (checkbox)
- Submits to `POST /admin/clubs/{clubId}/events`
- Redirects to events list after creation

#### Announcements Page (`src/app/admin/announcements/page.tsx`)
- **Hardcoded**: Uses `CLUB_ID = 1`
- Create form: title, message
- Lists announcements with created_at timestamp

### API Client (`src/lib/api/adminMembers.ts`)
- **Base URL**: `http://127.0.0.1:8000`
- Functions:
  - `fetchPendingMembers(clubId)` - GET `/admin/clubs/{clubId}/pending-members`
  - `approveMember(membershipId)` - POST `/admin/memberships/{membershipId}/approve`
  - `rejectMember(membershipId, reason)` - POST `/admin/memberships/{membershipId}/reject`
  - `fetchAllClubMembers(clubId)` - GET `/admin/clubs/{clubId}/members`
- All functions read `admin_token` from localStorage and include in Authorization header

---

## Mobile App Architecture

### Technology Stack
- **Framework**: Expo Router 6.0.21
- **React Native**: 0.81.5
- **React**: 19.1.0
- **Navigation**: Expo Router (file-based routing)
- **Storage**: AsyncStorage for token persistence
- **API Base URL**: 
  - Development: `http://192.168.1.242:8000` (hardcoded IP)
  - Production: `https://api.clubvision.in` (commented as "later")

### Application Structure

#### Root Layout (`app/_layout.tsx`)
- Loads auth token from AsyncStorage on mount
- Shows nothing (returns `null`) until token is loaded
- Uses Stack navigator with `headerShown: false`

#### Index Screen (`app/index.tsx`)
- Checks for existing auth token
- If token exists → redirects to `/home`
- If no token → shows welcome screen with "Continue" button → navigates to `/phone`

#### Phone Screen (`app/phone.tsx`)
- Phone number input (10 digits, numeric only)
- Validates length === 10
- Calls `requestOtp(phone)` API
- Navigates to `/otp` with phone as param on success

#### OTP Screen (`app/otp.tsx`)
- Receives phone from route params
- OTP input (6 digits, numeric only)
- Calls `verifyOtp(phone, otp)` API
- Stores token via `setAuthToken(res.token)`
- Redirects to `/` (which then redirects to `/home`)

#### Home Screen (`app/home.tsx`)
- Fetches clubs via `fetchMyClubs()`
- Displays:
  - "Your Clubs" header
  - "Family Members" button → `/family`
  - "My Event Passes" button → `/passes`
  - List of clubs with:
    - Club name
    - Members list (self + dependents)
    - Status badge (active/pending/rejected/expired)
    - Rejection reason if rejected
    - Clickable only if status === 'active' → navigates to `/club/{clubId}`

#### Club Detail Screen (`app/club/[id].tsx`)
- Fetches:
  - Club details from `fetchMyClubs()`
  - Announcements from `getClubAnnouncements(clubId)`
  - Events from `getClubEvents(clubId)`
- Displays:
  - Events list with "Attend" button
  - Announcements list
- **Attend Flow**:
  - Opens bottom sheet modal
  - Shows self + dependents as checkboxes
  - Checks existing passes via `getMyEventPasses(eventId)`
  - Disables already-passed members (shows ✔)
  - On confirm: calls `generateEventPass(eventId, dependentId)` for each selected
  - Shows success alert

#### Passes Screen (`app/passes.tsx`)
- Fetches passes via `getMyPasses()`
- Displays list of passes with:
  - Event title
  - Club name
  - Member name (self or dependent)
  - Pass code

#### Family Screen (`app/family.tsx`)
- **Status**: File exists but implementation not reviewed in detail

### API Client (`lib/api/client.ts`)
- **Token Management**:
  - `setAuthToken(token)` - Stores in memory and AsyncStorage
  - `loadAuthToken()` - Loads from AsyncStorage on app start
  - `clearAuthToken()` - Removes token
  - `getAuthToken()` - Returns current token
- **Request Function**:
  - Automatically includes `Authorization: Bearer {token}` header if token exists
  - Sets `Content-Type: application/json`
  - Throws error if response not ok
- **API Object**:
  - `api.get(path)` - GET request
  - `api.post(path, body)` - POST request with JSON body

### API Modules

#### Auth (`lib/api/auth.ts`)
- `requestOtp(phone)` - POST `/auth/request-otp`
- `verifyOtp(phone, otp)` - POST `/auth/verify-otp`

#### Clubs (`lib/api/clubs.ts`)
- `fetchMyClubs()` - GET `/me/clubs`
- Returns `ClubResponse[]` with club_id, club_name, role, status, expiry_date

#### Events (`lib/api/events.ts`)
- `getClubEvents(clubId)` - GET `/clubs/{clubId}/events`
- Returns `ClubEvent[]` with id, title, description, event_date, location, requires_pass

#### Event Passes (`lib/api/event_passes.ts`)
- `generateEventPass(eventId, dependentId)` - POST `/events/{eventId}/passes`
- `getMyEventPasses(eventId)` - GET `/events/{eventId}/passes/me`

#### Passes (`lib/api/passes.ts`)
- `getMyPasses()` - GET `/me/passes`
- Returns passes with id, pass_code, event_title, club_name, member

#### Announcements (`lib/api/announcements.ts`)
- `getClubAnnouncements(clubId)` - GET `/clubs/{clubId}/announcements`

---

## Data Flows

### Authentication Flow

#### Mobile App
1. User opens app → `index.tsx` checks token
2. No token → Navigate to `/phone`
3. Enter phone → `POST /auth/request-otp`
4. Navigate to `/otp` with phone param
5. Enter OTP → `POST /auth/verify-otp`
6. Store token in AsyncStorage and memory
7. Redirect to `/home`

#### Admin Web
1. User navigates to `/admin` → `admin/layout.tsx` checks `localStorage.getItem('admin_token')`
2. No token → Redirect to `/login`
3. Enter phone → `POST /auth/request-otp`
4. Enter OTP → `POST /auth/verify-otp`
5. Store token in `localStorage` as `admin_token`
6. Redirect to `/admin`

### Club Membership Flow

1. User views clubs → `GET /me/clubs`
2. Backend queries `memberships` table joined with `clubs` and `dependents`
3. Returns clubs with nested members array (self + dependents)
4. Mobile app displays clubs with status badges
5. Only active clubs are clickable

### Event Attendance Flow

1. User views club → Sees events list
2. User clicks "Attend" → Opens member selection modal
3. App checks existing passes → `GET /events/{eventId}/passes/me`
4. User selects members → Calls `POST /events/{eventId}/passes` for each
5. Backend validates membership → `is_user_member_of_event_club()`
6. Backend creates pass → Generates UUID-based pass_code
7. User views passes → `GET /me/passes`

### Admin Member Management Flow

1. Admin views pending members → `GET /admin/clubs/{clubId}/pending-members`
2. Admin approves → `POST /admin/memberships/{membershipId}/approve`
   - Updates `memberships.status = 'active'`
3. Admin rejects → `POST /admin/memberships/{membershipId}/reject`
   - Updates `memberships.status = 'rejected'` and sets `rejection_reason`
4. Admin views all members → `GET /admin/clubs/{clubId}/members`
   - Returns all members regardless of status

### Event Creation Flow (Admin)

1. Admin navigates to events → `/admin/clubs/{clubId}/events`
2. Admin clicks "Create Event" → Navigate to `/admin/clubs/{clubId}/events/new`
3. Admin fills form → title, description, event_date, location, requires_pass
4. Submit → `POST /admin/clubs/{clubId}/events`
5. Backend creates event in `events` table
6. Redirect to events list

### Announcement Flow

1. Admin creates announcement → `POST /clubs/{clubId}/announcements`
   - Requires admin authorization
   - Inserts into `announcements` table
2. Members view announcements → `GET /clubs/{clubId}/announcements`
   - Returns announcements ordered by created_at DESC
   - Mobile app displays in club detail screen

---

## Database Schema (Inferred from Queries)

Based on SQL queries in the codebase, the following tables exist:

### `users`
- `id` (INT, PRIMARY KEY)
- `phone_number` (VARCHAR, UNIQUE)

### `clubs`
- `id` (INT, PRIMARY KEY)
- `name` (VARCHAR)

### `memberships`
- `id` (INT, PRIMARY KEY)
- `user_id` (INT, FOREIGN KEY → users.id)
- `club_id` (INT, FOREIGN KEY → clubs.id)
- `dependent_id` (INT, NULLABLE, FOREIGN KEY → dependents.id)
- `status` (ENUM: 'pending', 'active', 'rejected', 'expired')
- `role` (VARCHAR: 'admin', 'superadmin', or member)
- `rejection_reason` (TEXT, NULLABLE)
- `expiry_date` (DATE, NULLABLE)

### `dependents`
- `id` (INT, PRIMARY KEY)
- `user_id` (INT, FOREIGN KEY → users.id)
- `name` (VARCHAR)
- `relation` (VARCHAR)
- `date_of_birth` (DATE, NULLABLE)
- `created_at` (TIMESTAMP)

### `events`
- `id` (INT, PRIMARY KEY)
- `club_id` (INT, FOREIGN KEY → clubs.id)
- `title` (VARCHAR)
- `description` (TEXT, NULLABLE)
- `event_date` (DATETIME)
- `location` (VARCHAR, NULLABLE)
- `requires_pass` (BOOLEAN)

### `event_passes`
- `id` (INT, PRIMARY KEY)
- `event_id` (INT, FOREIGN KEY → events.id)
- `user_id` (INT, FOREIGN KEY → users.id)
- `dependent_id` (INT, NULLABLE, FOREIGN KEY → dependents.id)
- `pass_code` (VARCHAR, UNIQUE)

### `announcements`
- `id` (INT, PRIMARY KEY)
- `club_id` (INT, FOREIGN KEY → clubs.id)
- `title` (VARCHAR)
- `message` (TEXT)
- `created_at` (TIMESTAMP)

---

## Key Implementation Details

### Token System
- **Format**: Simple string `user-{user_id}`, not JWT
- **Validation**: Parses user_id from token string
- **Storage**: 
  - Admin web: `localStorage.getItem('admin_token')`
  - Mobile app: AsyncStorage key `'auth_token'` + in-memory variable

### OTP System
- **Storage**: In-memory Python dictionary (not persistent)
- **Expiry**: 5 minutes (300 seconds)
- **Debug**: Prints OTP to console
- **Security**: Not production-ready (in-memory, no rate limiting)

### Error Handling
- Backend: Raises `HTTPException` with status codes
- Admin web: Uses `alert()` for errors
- Mobile app: Uses `alert()` for errors
- API client: Throws generic Error with response text

### CORS Configuration
- Backend allows all origins: `allow_origins=["*"]`
- Allows all methods and headers
- Allows credentials

### Database Connection
- Uses raw SQL via `text()` queries
- No ORM models defined
- Connection pooling enabled
- Transactions: Uses `engine.begin()` for writes, `engine.connect()` for reads

### Admin Authorization
- Checks `memberships` table for `role IN ('admin', 'superadmin')`
- No separate admin users table
- Admin status is per-club membership role

### Dependent System
- Users can have multiple dependents
- Dependents can have memberships (via `memberships.dependent_id`)
- Self membership: `memberships.dependent_id IS NULL`
- Dependent membership: `memberships.dependent_id` references dependents table

### Event Pass System
- Pass code: First 10 characters of UUID
- Prevents duplicate passes for same event/user/dependent
- Passes are tied to specific events
- Members can generate passes for self and dependents

---

## File Organization

### Backend
```
backend/app/
├── __init__.py
├── main.py                    # FastAPI app entry point
├── core/
│   └── auth.py                # Token extraction
├── auth/
│   └── admin_dependencies.py   # Admin authorization
├── db/
│   ├── session.py             # Database connection
│   ├── user_repo.py           # User CRUD
│   ├── membership_repo.py     # Membership queries
│   ├── event_repo.py          # Event CRUD
│   ├── event_pass_repo.py     # Event pass CRUD
│   ├── announcement_repo.py   # Announcement queries
│   ├── admin_members_repo.py  # Admin member queries
│   └── dependents_repo.py     # Dependent CRUD
├── routers/
│   ├── auth.py                # Authentication endpoints
│   ├── clubs.py               # User club endpoints
│   ├── announcements.py        # Announcement endpoints
│   ├── dependents.py           # Dependent endpoints
│   ├── events.py               # Member event endpoints
│   ├── event_passes.py         # Event pass endpoints
│   ├── admin_memberships.py    # Admin membership management
│   ├── admin_events.py         # Admin event creation
│   └── admin_club_members.py   # Admin member listing
├── schemas/
│   └── auth.py                # Pydantic models for auth
└── services/
    └── otp_service.py         # OTP generation/verification
```

### Admin Web
```
admin-web/src/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page (default Next.js)
│   ├── globals.css              # Global styles
│   ├── login/
│   │   └── page.tsx            # Login page
│   └── admin/
│       ├── layout.tsx          # Admin layout (auth guard)
│       ├── page.tsx            # Admin dashboard
│       ├── announcements/
│       │   └── page.tsx        # Announcements (hardcoded club)
│       ├── members/
│       │   └── page.tsx        # All members list
│       └── clubs/
│           └── [clubId]/
│               ├── layout.tsx  # Club sidebar layout
│               ├── page.tsx    # Club dashboard
│               ├── members/
│               │   └── page.tsx # Club members
│               ├── pending-members/
│               │   └── page.tsx # Pending members
│               └── events/
│                   ├── page.tsx      # Events list
│                   └── new/
│                       └── page.tsx  # Create event
└── lib/
    └── api/
        └── adminMembers.ts     # Admin API client
```

### Mobile App
```
mobile-app/
├── app/
│   ├── _layout.tsx             # Root layout (token loader)
│   ├── index.tsx               # Welcome/redirect screen
│   ├── phone.tsx               # Phone input
│   ├── otp.tsx                 # OTP verification
│   ├── home.tsx                # Clubs list
│   ├── club/
│   │   └── [id].tsx            # Club detail (events + announcements)
│   ├── passes.tsx              # Event passes list
│   └── family.tsx              # Family members (exists)
└── lib/
    ├── api/
    │   ├── client.ts           # API client + token management
    │   ├── auth.ts             # Auth endpoints
    │   ├── clubs.ts            # Club endpoints
    │   ├── events.ts           # Event endpoints
    │   ├── event_passes.ts     # Event pass endpoints
    │   ├── passes.ts           # Pass list endpoint
    │   └── announcements.ts    # Announcement endpoints
    └── clubs.ts                # (exists, not reviewed)
```

---

## Known Limitations & Implementation Notes

1. **OTP System**: In-memory storage, not persistent across server restarts
2. **Token System**: Simple string format, not JWT (marked as temporary)
3. **CORS**: Allows all origins (not production-ready)
4. **Error Handling**: Basic alert-based error handling in frontend
5. **Hardcoded Values**: 
   - Admin web: API URL `http://127.0.0.1:8000`
   - Mobile app: Development IP `192.168.1.242:8000`
   - Admin announcements page: Hardcoded `CLUB_ID = 1`
6. **Database**: No ORM models, uses raw SQL queries
7. **Admin Authorization**: Per-club role check, no global admin concept
8. **Pass Generation**: UUID-based, first 10 characters used as pass_code
9. **Duplicate Prevention**: Event passes prevent duplicates for same event/user/dependent combination

---

## End of Documentation

This document reflects the architecture exactly as implemented. No features are inferred, and no refactoring suggestions are included.

