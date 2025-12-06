# Changelog

## [v0.4.0] - 2024-12-06

### 🔐 Authentication System

Xây dựng đầy đủ hệ thống đăng ký và đăng nhập.

#### ✨ Features

**Backend Auth APIs** (`/api/v1/auth`)
- `POST /register` - Đăng ký tài khoản mới
- `POST /login` - Đăng nhập với email/password
- `POST /token` - OAuth2 compatible login (for Swagger)
- `POST /refresh` - Refresh access token
- `GET /me` - Lấy thông tin user hiện tại
- `POST /change-password` - Đổi mật khẩu
- `POST /forgot-password` - Yêu cầu reset password
- `POST /logout` - Đăng xuất
- `GET /verify` - Kiểm tra token hợp lệ

**Security Features**
- Password hashing với bcrypt
- JWT access & refresh tokens
- Token expiration & refresh
- Role-based access control (admin, PMO, chair, user)
- Secure password requirements (min 6 chars)

**Frontend Auth Pages**
- Login page với form validation
- Register page với department selection
- Token storage trong localStorage
- Auto-redirect sau login

#### 📁 New Files

**Backend:**
- `backend/app/core/security.py` - Password hashing, JWT utilities
- `infra/postgres/init/05_add_auth.sql` - Database migration for auth

**Frontend:**
- `electron/src/renderer/app/routes/Auth/Login.tsx`
- `electron/src/renderer/app/routes/Auth/Register.tsx`
- `electron/src/renderer/app/routes/Auth/index.ts`
- `electron/src/renderer/lib/api/auth.ts`

#### 🔧 Updated Files
- `backend/app/schemas/auth.py` - Full auth schemas
- `backend/app/services/auth_service.py` - Real auth logic
- `backend/app/api/v1/endpoints/auth.py` - Auth endpoints
- `backend/requirements.txt` - Added python-jose, bcrypt
- `electron/src/renderer/app/router/index.tsx` - Auth routes
- `electron/src/renderer/lib/api/users.ts` - Export utilities

#### 🔑 Demo Account
- Email: `nguyenvana@lpbank.vn`
- Password: `demo123`

---

## [v0.3.0] - 2024-12-06

### 🚀 Backend APIs - Meeting Management Complete

Xây dựng đầy đủ backend APIs cho 3 tab: Pre-meet, In-meet, Post-meet.

#### ✨ New Features

**Action Items API** (`/api/v1/items/actions`)
- CRUD operations for action items
- Confirm/reject workflow
- Owner assignment & deadline tracking

**Decisions API** (`/api/v1/items/decisions`)
- CRUD operations for decisions
- Rationale tracking
- Confirmation workflow

**Risks API** (`/api/v1/items/risks`)
- CRUD operations for risks
- Severity classification
- Mitigation tracking

**Transcripts API** (`/api/v1/transcripts`)
- Chunk management
- AI extraction (actions, decisions, risks)
- Live recap generation

**Participants API** (`/api/v1/participants`)
- Add/remove participants
- Attendance tracking
- Join/leave timestamps

**Minutes API** (`/api/v1/minutes`)
- AI-powered generation
- Version control
- Distribution logging

---

## [v0.2.0] - 2024-12-06

### 🎨 Frontend 3-Tab Meeting Detail

Redesign trang quản lý cuộc họp thành 3 tabs: Pre-meet, In-meet, Post-meet.

---

## [v0.1.0] - 2024-12-05

### 🚀 Initial Setup & AI Integration

- Project scaffold với FastAPI + React/Electron
- Database schema với PostgreSQL + pgvector
- Gemini AI integration cho chat & generation
- Mock data cho demo PMO use case

---

## API Documentation

Sau khi chạy backend, truy cập:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

