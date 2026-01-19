# 🏥 NextJs Auth Example

This example is a themed around a medical records app. It is built with Next.js 15, Prisma, and Resend. It features a robust authentication flow, 6-digit email verification, and a dashboard.

---

## 🚀 Getting Started

Follow these steps to get your local development environment running.

### 1. Clone and Install

```bash
git clone https://github.com/Landon345/nextjs-auth-example.git
cd nextjs-auth-example
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

## 🔐 Authentication & OTP Flow

StrideSync uses a multi-layered verification system to protect patient data:

- **Registration:** User data is captured; passwords are hashed via `bcryptjs`.
- **OTP Generation:** A 6-digit code is generated and stored in the DB with a 15-minute expiration.
- **Email Delivery:** The code is sent via **Resend** to the user's inbox.
- **Session:** An encrypted JWT is generated using `jose` and stored in a secure **HttpOnly** cookie.
- **Verification:** The user must enter the code at `/verify-email` to unlock dashboard access.
