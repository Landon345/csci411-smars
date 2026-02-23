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
JWT_SECRET="your_random_thirty_two_character_secure_jwt_secret"

# SSN Encryption (Random 32+ character string)
SSN_ENCRYPTION_KEY="your_random_thirty_two_character_secure_ssn_encryption_secret"

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

### 4. Run locally

```bash
pnpm dev
```

### If having typescript issues

- While in any typescript file, do `ctr + shift + p`, type in `typescript:select typescript version`, use the workspace version.
- Can also reload typescript with `ctr + shift + p`, `typescript: restart TS server`

### If having issues on Mac OS

- Try running `sudo chown -R $(whoami) . && chmod -R 755 .` This gives you ownership of all files
- Try removing any "Ghost" cache `rm -rf .next node_modules pnpm-lock.yaml && pnpm install`

### Development Workflow

Create a branch with the naming convention:

- `feat/issue#-description`
- `fix/issue#-description`

Example

```bash
git checkout -b feat/5-doctor-dashboard
```
