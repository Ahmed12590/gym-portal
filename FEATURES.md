# Gym Portal - Features & Architecture Guide

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Role-Based Access Control](#role-based-access-control)
3. [Multi-Tenancy Implementation](#multi-tenancy-implementation)
4. [Feature Modules](#feature-modules)
5. [Data Models](#data-models)
6. [API Architecture](#api-architecture)
7. [Security Features](#security-features)
8. [Integration Points](#integration-points)

---

## System Architecture

### Technology Stack

```
Frontend Layer
├── Next.js 15 (App Router)
├── React 19
├── TypeScript
├── Tailwind CSS
└── Zustand (State Management)

API Layer
├── Next.js API Routes
├── NextAuth.js (Authentication)
└── RESTful Endpoints

Business Logic Layer
├── Service Classes
├── Validation & Error Handling
└── Authorization Middleware

Data Layer
├── Prisma ORM
├── PostgreSQL Database
└── Database Migrations
```

### Request Flow Diagram

```
Browser Request
    ↓
Middleware (Authentication & Auth Check)
    ↓
Authorization (Role & Multi-tenant check)
    ↓
API Route Handler
    ↓
Service Layer (Business Logic)
    ↓
Prisma Client (ORM)
    ↓
PostgreSQL Database
    ↓
Response Back to Client
```

---

## Role-Based Access Control

### Three Main Roles

#### 1. Super Admin
**Permissions:**
- Create and manage all gyms
- Create gym owner accounts
- Assign subscription plans
- View system-wide analytics
- Create and manage subscription plans
- Suspend or delete gyms
- Force subscription expiry
- Enable/disable premium features globally

**Access Paths:**
- `/dashboard/admin/*`
- All system management endpoints

**Restrictions:**
- Cannot directly access gym-specific member data
- Limited to read-only on user management

#### 2. Gym Owner
**Permissions:**
- Full control of owned gyms
- Create and manage members
- Record attendance
- Manage payments and invoices
- View gym-specific analytics
- Create branches
- Manage staff members
- Create trainers

**Access Paths:**
- `/dashboard/owner/*`
- Gym-specific API endpoints

**Restrictions:**
- Can only access their own gym(s)
- Cannot see other gym owner's data
- Cannot modify subscription plans
- Cannot access super admin panel

#### 3. Staff Member
**Permissions:**
- Record attendance (check-in/out)
- View members in their gym/branch
- Record payments
- View limited analytics
- Customizable permissions per staff member

**Access Paths:**
- `/dashboard/staff/*`
- Limited API endpoints

**Restrictions:**
- Cannot create members
- Cannot modify membership details
- Cannot delete records
- Limited to assigned gym/branch

### Permission Implementation

```typescript
// Middleware checks role
const role = request.headers.get('x-user-role');

// Routes protected by role
export const GET = withRole('GYM_OWNER', async (req) => {
  // Only gym owners can access
});

// Multi-route authorization
export const GET = withRole(['SUPER_ADMIN', 'GYM_OWNER'], async (req) => {
  // Super admin and gym owner can access
});
```

---

## Multi-Tenancy Implementation

### Architecture: Row-Level Multi-Tenancy

Every data record is scoped to a `gymId`:

```prisma
model Member {
  id        String @id
  gymId     String  // Tenant identifier
  firstName String
  ...
  @@index([gymId])  // Indexed for performance
}

model Attendance {
  id        String @id
  gymId     String  // Tenant identifier
  memberId  String
  ...
}
```

### Data Isolation

1. **Query Filtering**
   ```typescript
   // All queries automatically filtered by gymId
   const members = await db.member.findMany({
     where: { 
       gymId: userGymId  // Middleware adds this
     }
   });
   ```

2. **Middleware Enforcement**
   ```typescript
   // middleware.ts extracts gymId from JWT
   const gymId = token.primaryGymId;
   requestHeaders.set('x-gym-id', gymId);
   ```

3. **API Layer Protection**
   ```typescript
   export const GET = withMultiTenant(async (req, gymId) => {
     // gymId is verified and passed
     // All queries use this gymId
   });
   ```

### Cross-Gym Protection

If a user tries to access another gym's data:
1. Middleware verifies `gymId` in request
2. Service layer checks ownership
3. Returns 403 Forbidden if unauthorized
4. Logs the attempt for security

---

## Feature Modules

### 1. Authentication Module

**Features:**
- Secure password hashing (bcryptjs)
- JWT-based sessions
- Automatic token refresh
- Session expiry

**Flow:**
```
User enters credentials
    ↓
NextAuth validates against database
    ↓
JWT token issued (30-day expiry)
    ↓
Token stored in secure HTTP-only cookie
    ↓
Middleware validates on each request
```

**Key Files:**
- `src/lib/auth/auth.config.ts` - NextAuth configuration
- `src/lib/services/auth.service.ts` - Authentication logic
- `src/middleware.ts` - Session validation

### 2. Gym Management Module

**Features:**
- Create/edit/delete gyms
- Manage gym branches
- Subscription plan assignment
- Feature flag management
- Status tracking (Active, Inactive, Suspended, Blocked)

**Subscription Plans:**
```javascript
{
  name: "Premium",
  monthlyPrice: 299,
  maxMembers: 500,
  maxBranches: 5,
  features: {
    biometric: true,
    multiBranch: true,
    advancedReports: true,
    smsNotifications: true,
    whatsappNotifications: false
  }
}
```

**Status Flow:**
- ACTIVE → Default state, full access
- INACTIVE → Temporary pause
- SUSPENDED → Admin action, limited access
- SOFT_BLOCKED → Subscription expired, view-only
- HARD_BLOCKED → Admin action, no access

**Key Files:**
- `src/lib/services/auth.service.ts` (GymService class)
- `src/app/api/gyms/route.ts`

### 3. Member Management Module

**Features:**
- Create member profiles with all details
- Photo upload ready (Cloudinary)
- CNIC/document storage
- Membership tracking
- Status management
- Search and filtering

**Member Fields:**
```prisma
{
  firstName, lastName
  email, phone, cnic
  address, dateOfBirth
  profileImage
  membershipPlan
  joinDate, expiryDate
  status: ACTIVE | INACTIVE | SUSPENDED | EXPIRED
  emergencyContact, emergencyContactPhone
}
```

**Membership Lifecycle:**
- Create member → ACTIVE
- Pass expiry date → EXPIRED
- Manual deactivation → INACTIVE
- Admin action → SUSPENDED

**Key Files:**
- `src/lib/services/member.service.ts` (MemberService class)
- `src/app/api/members/route.ts`
- `src/app/dashboard/owner/members/page.tsx`

### 4. Attendance Module

**Features:**
- Manual check-in/check-out
- Biometric integration ready
- Daily attendance tracking
- Monthly attendance reports
- Attendance statistics
- Auto-attendance detection

**Check-in/out Process:**
```
1. Member arrives
2. Record check-in time
3. Update attendance status
4. On exit, record check-out time
5. Calculate duration
```

**Attendance Types:**
- MANUAL: Staff recorded
- BIOMETRIC: From biometric machine

**Attendance Status:**
- PRESENT: Member attended
- ABSENT: No attendance record
- LATE: Arrived after opening time
- LEFT_EARLY: Left before closing time

**Key Files:**
- `src/lib/services/member.service.ts` (AttendanceService class)
- `src/app/api/attendance/route.ts`
- `src/app/dashboard/owner/attendance/page.tsx`

### 5. Payment & Fee Module

**Features:**
- Record payments
- Partial payment support
- Multiple payment methods
- Fee tracking
- Invoice generation
- Payment history

**Payment Methods:**
- CASH
- CARD
- BANK_TRANSFER
- CHECK
- DIGITAL_WALLET

**Fee Status:**
- PENDING: Due but not paid
- PARTIALLY_PAID: Partial payment received
- PAID: Fully paid
- OVERDUE: Passed due date
- WAIVED: Cancelled/waived

**Invoice Features:**
- Auto-numbering
- PDF generation ready
- Payment tracking
- Issue/due dates
- Multi-item support

**Key Files:**
- `src/lib/services/member.service.ts` (PaymentService class)
- `src/app/api/payments/route.ts`
- `src/app/dashboard/owner/payments/page.tsx`

### 6. Biometric Integration Module

**Features:**
- Add biometric devices (ZKTeco, etc.)
- Device management (IP, port, status)
- Member-to-device ID mapping
- Sync status tracking
- Connection testing

**Device Management:**
```typescript
{
  name: "Entrance Scanner",
  brand: "ZKTeco",
  model: "MB360",
  ipAddress: "192.168.1.100",
  port: 8000,
  enabled: true,
  syncEnabled: false,
  lastSyncDate: "2024-05-15T10:30:00Z"
}
```

**Integration Points:**
- Device discovery API
- Attendance log synchronization
- Real-time sync status
- Error handling and retry logic

**Key Files:**
- `src/lib/services/biometric.service.ts`
- API routes (to be extended)

### 7. Analytics Module

**Features:**
- Dashboard metrics (in real-time)
- Revenue charts
- Attendance trends
- Membership growth tracking
- Branch comparison
- Custom reports ready

**Dashboard Metrics:**
```javascript
{
  totalMembers: 150,
  activeMembers: 120,
  todayAttendance: 85,
  monthlyRevenue: 45000,
  expiredMembers: 30,
  inactiveMembers: 15
}
```

**Chart Data:**
- Monthly revenue trend (12 months)
- Daily attendance trend (30 days)
- Membership growth (12 months)
- Branch-wise comparison

**Key Files:**
- `src/lib/services/biometric.service.ts` (AnalyticsService class)
- `src/app/api/analytics/route.ts`
- `src/app/dashboard/owner/page.tsx`

### 8. Notification Module

**Features:**
- Fee due reminders
- Membership expiry alerts
- Payment confirmations
- Custom notifications
- Notification status tracking

**Notification Types:**
- FEE_DUE_REMINDER
- MEMBERSHIP_EXPIRY_REMINDER
- ATTENDANCE_ALERT
- PAYMENT_CONFIRMATION
- MEMBERSHIP_RENEWAL_REMINDER
- CUSTOM

**Delivery Methods (Ready for integration):**
- Email
- SMS (Twilio)
- WhatsApp (Twilio)
- In-app notifications

**Key Files:**
- `src/lib/services/biometric.service.ts` (NotificationService class)

---

## Data Models

### Entity Relationship Diagram

```
User
├── SuperAdmin (1:1)
├── GymOwner (1:1)
│   └── Gym (1:many)
│       ├── Branch (1:many)
│       │   ├── Member (1:many)
│       │   ├── Trainer (1:many)
│       │   └── StaffMember (1:many)
│       ├── Member (1:many)
│       │   ├── Attendance (1:many)
│       │   ├── Payment (1:many)
│       │   └── BiometricMapping (1:many)
│       ├── Subscription (1:1)
│       │   └── Plan (1:many)
│       ├── BiometricDevice (1:many)
│       │   └── BiometricMapping (1:many)
│       └── Notification (1:many)
└── StaffMember (1:1)
```

### Key Tables

**User**
- Central authentication table
- Stores credentials and profile
- Links to role-specific tables

**Gym**
- Core entity representing each gym
- Links to subscription and owner
- Contains status and configuration

**Member**
- Complete member profile
- Membership tracking
- Links to attendance and payments

**Attendance**
- Daily check-in/check-out records
- Associated with member and gym
- Tracks source (manual/biometric)

**Payment**
- Records all financial transactions
- Links to member and optional fee
- Tracks method and status

**SubscriptionInstance**
- Active subscription for each gym
- Links to plan and gym
- Tracks renewal and expiry

**BiometricDevice**
- Physical device configuration
- Device status and connectivity
- Mapped to members

---

## API Architecture

### Request/Response Pattern

**Success Response:**
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation completed successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "message": "User-friendly message"
}
```

**Paginated Response:**
```json
{
  "success": true,
  "data": [ /* items */ ],
  "pagination": {
    "total": 100,
    "page": 1,
    "pageSize": 10,
    "totalPages": 10
  }
}
```

### API Middleware Stack

1. **Next.js Middleware** (`middleware.ts`)
   - Session validation
   - Role verification
   - Multi-tenant isolation
   - Headers injection

2. **Route Handler Wrappers**
   - `withAuth()` - Requires authentication
   - `withRole()` - Requires specific role
   - `withMultiTenant()` - Requires gym access
   - `withErrorHandling()` - Try-catch wrapper

3. **Error Handling**
   - Custom ApiError class
   - Automatic error responses
   - Request validation
   - Input sanitization

---

## Security Features

### 1. Authentication Security
- Passwords hashed with bcryptjs (10 salt rounds)
- JWT tokens with 30-day expiry
- Secure HTTP-only cookies
- Token refresh on activity

### 2. Authorization Security
- Role-based access control
- Multi-tenant data isolation
- Middleware-enforced checks
- Per-endpoint authorization

### 3. Data Security
- Row-level multi-tenancy
- Parameterized queries (Prisma)
- Input validation (Zod ready)
- Output sanitization

### 4. API Security
- CORS configured
- Rate limiting ready
- CSRF protection (NextAuth)
- SQL injection prevention

### 5. Session Security
- Secure token storage
- Automatic session validation
- Token expiry enforcement
- Suspicious activity logging

---

## Integration Points

### Ready for Integration

#### 1. Cloudinary (Image Upload)
- Member photo upload
- Gym logo/banner
- Invoice PDF storage
- Configuration in `.env.local`

#### 2. Biometric Devices (ZKTeco)
- Connection test endpoint
- Device API abstraction
- Real-time sync scheduler
- Error handling framework

#### 3. Email Notifications
- SMTP configuration
- Template system ready
- Fee reminders
- Membership alerts

#### 4. SMS/WhatsApp (Twilio)
- Twilio SDK integration ready
- Template messaging
- Delivery tracking
- Error handling

#### 5. PDF Generation
- jsPDF library included
- html2canvas for rendering
- Invoice PDF generation
- Report export ready

#### 6. Payment Gateway
- Generic payment handler
- Transaction ID tracking
- Multiple method support
- Webhook ready for bank integration

---

## Extension Points

### Adding New Features

**1. New API Endpoint:**
```typescript
// src/app/api/[resource]/route.ts
import { withMultiTenant, successResponse } from '@/utils/api';

export const GET = withMultiTenant(
  async (request, gymId) => {
    // Your logic here
    return successResponse(data);
  }
);
```

**2. New Service:**
```typescript
// src/lib/services/[name].service.ts
export class YourService {
  static async method() {
    return await db.model.findMany();
  }
}
```

**3. New Page:**
```typescript
// src/app/dashboard/[role]/[page]/page.tsx
export default function Page() {
  // Use hooks and components
}
```

---

## Performance Optimization

### Database
- Indexes on frequently queried fields
- Pagination for large datasets
- Selective field fetching
- Connection pooling ready

### Frontend
- Next.js automatic code splitting
- Image optimization ready
- Dynamic imports for routes
- Zustand state caching

### Caching
- Session storage (browser)
- API response caching ready
- SWR/React Query ready
- ETag support in API

---

## Compliance & Best Practices

### Code Organization
- Service layer separation
- Type safety with TypeScript
- Middleware-based auth
- Error handling patterns

### Database
- Schema versioning
- Migration tracking
- Data integrity constraints
- Foreign key relationships

### Security
- OWASP compliance ready
- Input validation
- Output encoding
- Secure headers

---

## Support & Documentation

For detailed information:
- See `README.md` for getting started
- See `SETUP.md` for deployment
- Check API routes for endpoint details
- Review service classes for business logic

