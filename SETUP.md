# Gym Portal - Complete Setup Guide

## Prerequisites

Before starting, ensure you have:
- **Node.js 18+** ([Download](https://nodejs.org/))
- **npm or yarn** (comes with Node.js)
- **PostgreSQL 12+** ([Download](https://www.postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/))

## Quick Start (5 minutes)

### Step 1: Environment Setup

```bash
# Create .env.local file with database connection
cp .env.example .env.local
```

Update `.env.local`:
```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/gym_portal"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"
```

### Step 2: Generate NextAuth Secret

```bash
openssl rand -base64 32
```

Copy the output and paste it as `NEXTAUTH_SECRET` in `.env.local`

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Database Setup

```bash
# Push schema to database
npm run db:push

# Seed database with demo data
npm run db:seed
```

### Step 5: Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Test Accounts

After seeding, use these credentials:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@gym-portal.com | admin123 |
| Gym Owner | owner@gym-portal.com | owner123 |
| Staff | staff@gym-portal.com | staff123 |

## Database Management

### Create Database (if not exists)

```bash
# Using psql
psql -U postgres
CREATE DATABASE gym_portal;
\q
```

### View Database in Studio

```bash
npm run db:studio
```

Opens interactive database browser at http://localhost:5555

### Reset Database

```bash
npm run db:reset
```

⚠️ **WARNING**: This deletes all data!

### Create Migration

```bash
npx prisma migrate dev --name description_of_change
```

### View Migration Status

```bash
npx prisma migrate status
```

## Project Structure

```
gym-portal/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Authentication pages
│   │   ├── api/               # API routes
│   │   ├── dashboard/         # Dashboard pages
│   │   ├── globals.css        # Global styles
│   │   └── layout.tsx         # Root layout
│   ├── components/            # React components
│   │   ├── ui/               # UI components
│   │   ├── forms/            # Form components
│   │   └── layout/           # Layout components
│   ├── lib/
│   │   ├── auth/             # Authentication logic
│   │   ├── db/               # Database utilities
│   │   └── services/         # Business logic services
│   ├── middleware.ts         # NextAuth middleware
│   ├── store/                # Zustand state stores
│   ├── types/                # TypeScript type definitions
│   └── utils/                # Helper functions
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── migrations/           # Database migrations
├── public/                   # Static assets
├── scripts/                  # Helper scripts
│   └── seed.js              # Database seeding script
├── .env.local               # Local environment variables
├── .env.example             # Environment template
├── next.config.js           # Next.js configuration
├── tailwind.config.js       # Tailwind CSS config
└── tsconfig.json           # TypeScript config
```

## API Endpoints

### Authentication

```
POST   /api/auth/register           # Register new gym owner
POST   /api/auth/login              # Login (NextAuth handles)
GET    /api/auth/session            # Get current session
```

### Gyms

```
GET    /api/gyms                    # List all gyms (Super Admin)
POST   /api/gyms                    # Create gym (Super Admin)
GET    /api/gyms/[id]              # Get gym details
PUT    /api/gyms/[id]              # Update gym
DELETE /api/gyms/[id]              # Delete gym
```

### Members

```
GET    /api/members                 # List members
POST   /api/members                 # Create member
GET    /api/members/[id]           # Get member details
PUT    /api/members/[id]           # Update member
DELETE /api/members/[id]           # Delete member
```

### Attendance

```
GET    /api/attendance              # Get attendance records
POST   /api/attendance              # Record attendance
GET    /api/attendance?type=daily   # Today's attendance
GET    /api/attendance?type=monthly # Monthly attendance
GET    /api/attendance?type=stats   # Attendance statistics
```

### Payments

```
GET    /api/payments                # List payments
POST   /api/payments                # Record payment
```

### Analytics

```
GET    /api/analytics?type=dashboard        # Dashboard metrics
GET    /api/analytics?type=revenue          # Revenue chart data
GET    /api/analytics?type=attendance-trend # Attendance trends
GET    /api/analytics?type=membership-growth # Membership growth
GET    /api/analytics?type=branch-comparison # Branch comparison
```

### Subscriptions

```
GET    /api/subscriptions/plans     # List plans
POST   /api/subscriptions/plans     # Create plan (Super Admin)
```

## Features Implemented

### ✅ Authentication
- NextAuth.js with credentials provider
- Role-based access control (Super Admin, Gym Owner, Staff)
- Session management with JWT
- Protected routes via middleware

### ✅ Multi-Tenancy
- Database row-level isolation
- Gym-specific data filtering
- Member isolation per gym
- Branch-specific functionality

### ✅ Gym Management
- Create/edit/delete gyms
- Multiple branches per gym
- Subscription management
- Feature flags based on plan

### ✅ Member Management
- Complete member profiles
- Photo upload ready (Cloudinary)
- CNIC and document storage
- Membership tracking
- Member status management

### ✅ Attendance
- Manual check-in/check-out
- Daily attendance tracking
- Monthly attendance reports
- Attendance statistics
- Biometric integration ready

### ✅ Payments & Fees
- Payment recording
- Fee tracking
- Multiple payment methods
- Payment history
- Invoice generation ready

### ✅ Analytics & Reporting
- Dashboard metrics
- Revenue charts
- Attendance trends
- Membership growth
- Branch comparison
- Custom reports ready

### ✅ Subscription Plans
- Basic, Premium, Enterprise tiers
- Feature flags per plan
- Subscription instance tracking
- Plan renewal logic

## Common Tasks

### Add a New API Route

1. Create file: `src/app/api/[resource]/route.ts`
2. Import utilities:
   ```typescript
   import { withMultiTenant, successResponse, errorResponse } from '@/utils/api';
   ```
3. Define handlers:
   ```typescript
   export const GET = withMultiTenant(async (request, gymId) => {
     // Your logic here
     return successResponse(data);
   });
   ```

### Add a New Dashboard Page

1. Create file: `src/app/dashboard/[role]/[page]/page.tsx`
2. Use `useSession()` for auth
3. Fetch data from API
4. Use Tailwind for styling

### Create a New Service

1. Create file: `src/lib/services/[name].service.ts`
2. Export class with static methods:
   ```typescript
   export class YourService {
     static async getData() {
       return db.yourModel.findMany();
     }
   }
   ```

### Update Database Schema

1. Modify `prisma/schema.prisma`
2. Run migration:
   ```bash
   npx prisma migrate dev --name describe_change
   ```
3. Prisma Client auto-updates

## Deployment

### Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Create Vercel Project**
   - Go to [https://vercel.com/new](https://vercel.com/new)
   - Import your repository
   - Configure environment variables

3. **Environment Variables on Vercel**
   - `DATABASE_URL`: Production PostgreSQL URL
   - `NEXTAUTH_URL`: Your production domain
   - `NEXTAUTH_SECRET`: Generate new secret
   - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`: (if using Cloudinary)
   - `CLOUDINARY_API_KEY`: (if using Cloudinary)
   - `CLOUDINARY_API_SECRET`: (if using Cloudinary)

4. **Deploy**
   - Push to main branch
   - Vercel automatically builds and deploys

### Manual Deployment (VPS/Server)

1. **Setup Server**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   
   # Install PostgreSQL
   sudo apt install -y postgresql postgresql-contrib
   ```

2. **Clone and Setup**
   ```bash
   git clone <repo-url> gym-portal
   cd gym-portal
   npm install
   ```

3. **Configure Environment**
   ```bash
   nano .env.local
   # Add production values
   ```

4. **Setup Database**
   ```bash
   npm run db:push
   npm run db:seed
   ```

5. **Build**
   ```bash
   npm run build
   ```

6. **Run with PM2**
   ```bash
   npm install -g pm2
   pm2 start npm --name gym-portal -- start
   pm2 save
   pm2 startup
   ```

7. **Setup Nginx Reverse Proxy**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## Troubleshooting

### Database Connection Error

```bash
# Check PostgreSQL is running
sudo service postgresql status

# Verify DATABASE_URL format
# Correct: postgresql://user:password@localhost:5432/gym_portal
# Check .env.local has correct URL
```

### NextAuth Session Issues

```bash
# Regenerate NEXTAUTH_SECRET
openssl rand -base64 32

# Update .env.local
# Clear browser cookies
# Restart dev server
```

### Prisma Client Not Found

```bash
# Reinstall and generate
rm -rf node_modules/.prisma
npm install
npx prisma generate
```

### Port 3000 Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### Database Migrations Failed

```bash
# Check migration status
npx prisma migrate status

# Resolve failed migration
npx prisma migrate resolve --rolled-back migration_name

# Try again
npx prisma migrate dev
```

## Performance Optimization

### Database
- Add indexes on frequently queried fields
- Use pagination for large datasets
- Optimize N+1 queries with includes

### Frontend
- Implement image optimization with Next.js Image
- Use dynamic imports for code splitting
- Enable SWR/React Query for caching

### Build
- Use `next build` to check bundle size
- Enable compression in nginx/server
- Use CDN for static assets

## Security Checklist

- [ ] Change all default passwords
- [ ] Generate strong NEXTAUTH_SECRET
- [ ] Use HTTPS in production
- [ ] Set secure cookies in NextAuth
- [ ] Implement rate limiting on API
- [ ] Validate all user inputs
- [ ] Use environment variables for secrets
- [ ] Enable CORS appropriately
- [ ] Regular database backups
- [ ] Monitor logs for suspicious activity

## Support

For issues:
1. Check this guide and README.md
2. Review error logs: `npm run dev` output
3. Check Prisma docs: [https://www.prisma.io/docs/](https://www.prisma.io/docs/)
4. Check Next.js docs: [https://nextjs.org/docs](https://nextjs.org/docs)

## License

Proprietary - All rights reserved
