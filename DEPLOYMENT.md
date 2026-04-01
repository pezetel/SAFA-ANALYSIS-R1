# 🚀 GitHub & Vercel Deployment Guide

## 📋 Prerequisites

### 1. Required Accounts
- [GitHub](https://github.com) account
- [Vercel](https://vercel.com) account (sign in with GitHub)

### 2. Required Tools
- Git installed
- Node.js 18.x or above

---

## 📦 Uploading the Project to GitHub

### Step 1: Create a New Repository on GitHub

1. Go to GitHub: https://github.com/new
2. Enter a repository name: `safa-trend-analysis` (or any name you prefer)
3. Select **Public** or **Private**
4. **DO NOT select** any "Initialize this repository" options (README, .gitignore, license)
5. Click **"Create repository"**

### Step 2: Prepare the Local Project

Navigate to your project folder and run the following commands:

```bash
# Initialize Git
git init

# Add all files
git add .

# First commit
git commit -m "Initial commit: SAFA Trend Analysis Platform"

# Set the main branch
git branch -M main

# Add GitHub remote (replace YOUR_USERNAME with your actual GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/safa-trend-analysis.git

# Push to GitHub
git push -u origin main
```

**Note:** When GitHub prompts for username/password:
- Username: Your GitHub username
- Password: Use a **Personal Access Token** (not your password!)

### Creating a Personal Access Token

If you don't have a token:

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. "Generate new token" → "Generate new token (classic)"
3. Note: "SAFA Project"
4. Expiration: 90 days (or as preferred)
5. Scope: Select **repo** (full repository access)
6. Click "Generate token"
7. Copy the token and save it in a safe place!

---

## 🌐 Deploying to Vercel

### Method 1: Vercel Dashboard (RECOMMENDED)

1. **Go to Vercel:** https://vercel.com/login
2. **Sign in with GitHub**
3. **Click "New Project"**
4. **Find your GitHub repo:**
   - In the "Import Git Repository" section
   - Search for `safa-trend-analysis`
   - Click **"Import"**

5. **Project Settings:**
   ```
   Framework Preset: Next.js
   Root Directory: ./ (default)
   Build Command: pnpm build (auto-detected)
   Output Directory: .next (auto-detected)
   Install Command: pnpm install (auto-detected)
   ```

6. **Environment Variables (Not required for now):**
   - You can add them later if needed

7. **Click "Deploy"**

8. **Wait (2-3 minutes):**
   - You will see build logs
   - On success you'll see a "Congratulations!" message
   - Your Vercel URL: `https://safa-trend-analysis-xxx.vercel.app`

### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Production deploy
vercel --prod
```

---

## 🔄 Automatic Deployment (CI/CD)

Vercel automatically deploys when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Fix: Component detection algorithm"
git push origin main

# Vercel automatically starts a new deployment!
```

**Branch Preview:**
- Create a new branch with `git checkout -b feature/new-feature`
- When pushed, Vercel creates a separate preview URL
- The main branch stays in production

---

## ⚙️ Vercel Dashboard Settings

### Important Settings

1. **Settings → General:**
   - Node.js Version: 18.x (automatic)
   - Install Command: `pnpm install`
   - Build Command: `pnpm build`
   - Output Directory: `.next`

2. **Settings → Environment Variables:**
   - Not required for now
   - Use this section if you need to add API keys later

3. **Settings → Domains:**
   - You can add a custom domain
   - Example: `safa-analysis.yourdomain.com`

4. **Settings → Git:**
   - Production Branch: `main`
   - Auto-deploy: Enabled ✅

---

## 🐛 Deployment Troubleshooting

### Build Error: "Module not found"

```bash
# Test locally
pnpm install
pnpm build

# If it works locally, check package.json
# Try "Redeploy" on Vercel
```

### Build Error: "Out of memory"

Vercel Settings → Functions → Memory: 1024 MB (default is sufficient)

### TypeScript Error

```bash
# Check locally
pnpm build

# Fix any type errors
```

### Port 3000 conflict

Vercel manages ports in production — no action needed.

---

## 📊 Production Usage

### Important Notes:

1. **Memory Storage:**
   - Data is currently stored in localStorage (browser-side)
   - Data persists across sessions in the same browser
   - For multi-user production, consider a **database** (PostgreSQL, MongoDB, etc.)

2. **File Upload:**
   - Vercel has a 4.5 MB body limit
   - For large Excel files:
     - Use S3/Cloudinary storage
     - Or upgrade to Vercel Pro (50 MB limit)

3. **Serverless Function Timeout:**
   - Hobby: 10 seconds
   - Pro: 60 seconds (configured in vercel.json)
   - Very large Excel files may require Pro

---

## 🔒 Security Recommendations

1. **Environment Variables:**
   - Store sensitive information in `.env.local`
   - `.env.local` is not committed to Git (in .gitignore)
   - Add them via Vercel's Environment Variables dashboard

2. **API Security:**
   - Consider adding authentication in the future
   - Use rate limiting

3. **CORS:**
   - Not required currently
   - Be cautious if you make a public API

---

## 📈 Monitoring

### Vercel Analytics (Free)

1. Project → Analytics tab
2. Traffic, performance, and error tracking

### Sentry Integration (Optional)

```bash
pnpm add @sentry/nextjs
npx @sentry/wizard -i nextjs
```

---

## 🎯 Advanced Topics

### Adding a Database (Recommended for production)

**Supabase (Free):**
```bash
pnpm add @supabase/supabase-js
```

**Vercel Postgres:**
- Vercel Storage → Postgres → Create
- Environment variables are added automatically

**PlanetScale (MySQL):**
```bash
pnpm add @planetscale/database
```

### Custom Domain

1. Vercel → Settings → Domains
2. Enter your domain name
3. Update DNS records (A/CNAME)
4. SSL certificate is generated automatically

---

## ✅ Checklist

- [ ] GitHub repository created
- [ ] Code pushed to GitHub
- [ ] Vercel account created (with GitHub)
- [ ] Project imported on Vercel
- [ ] First deployment successful
- [ ] Vercel URL is working
- [ ] Excel upload tested
- [ ] Charts are working
- [ ] Modal details are working
- [ ] Excel export is working

---

## 🆘 Help

**Vercel Documentation:**
https://vercel.com/docs

**Next.js Deployment:**
https://nextjs.org/docs/deployment

**GitHub Issues:**
You can open issues in your repository

---

## 🎉 Congratulations!

Your project is now live!

Share your Vercel URL:
`https://safa-trend-analysis-xxx.vercel.app`

Every Git push will trigger an automatic deployment! 🚀
