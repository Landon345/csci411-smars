# 🏥 SMARS application

This is a Secure Medical Appointment & Record System app. It is built with Next.js 15, Prisma, and Resend.

---

## 🚀 Getting Started

Follow these steps to get your local development environment running.

### 1. Clone and Install

```bash
git clone https://github.com/Landon345/csci411-smars.git
cd csci411-smars
pnpm install
```

### 2. Before Database Sync

🔑 Environment Configuration

Create a `.env` file in the root directory. This file contains sensitive secrets and **must not** be committed to GitHub.

```env
# Database Connection (PostgreSQL)
DATABASE_URL="your_database_connection_string"

# Authentication (Random 32+ character string)
JWT_SECRET="your_secure_jwt_secret"

# Email Service (Resend.com API Key)
RESEND_API_KEY="re_your_api_key"

# Environment
NODE_ENV="dev"
```

### 3. Database Sync

Sync the Prisma schema with your local or cloud database and generate the TypeScript client.

```bash
pnpm exec prisma db push
pnpm exec prisma generate
```

Run locally

```bash
pnpm dev
```

## 🔐 Authentication & OTP Flow

Smars uses a multi-layered verification system to protect patient data:

- **Registration:** User data is captured; passwords are hashed via `bcryptjs`.
- **OTP Generation:** A 6-digit code is generated and stored in the DB with a 15-minute expiration.
- **Email Delivery:** The code is sent via **Resend** to the user's inbox.
- **Session:** An encrypted JWT is generated using `jose` and stored in a secure **HttpOnly** cookie.
- **Verification:** The user must enter the code at `/verify-email` to unlock dashboard access.

### Development Workflow

Create a branch with the naming convention:

- `feat/issue#-description`
- `fix/issue#-description`

Example

```bash
git checkout -b feat/5-doctor-dashboard
```
