# LocalLift AI

**Never Miss a Customer. Let AI Grow Your Business.**

LocalLift AI is a full-stack WhatsApp AI customer assistant, appointment booking platform, lead CRM, and automated follow-up suite built for local salons, beauty parlours, and service studios.

## Local Development

```bash
npm install
cp .env.example .env
# Add your GEMINI_API_KEY inside .env
npm run dev
```

The app runs on `http://localhost:3000`.

## Deploying to GitHub & Vercel

### 1. Push to GitHub
- In Google AI Studio, click the **Save to GitHub** icon in the top toolbar to create or link a repository and push this codebase.
- Or push locally via Git:
  ```bash
  git init
  git add .
  git commit -m "Initial commit: LocalLift AI"
  git branch -M main
  git remote add origin https://github.com/<your-username>/<your-repo>.git
  git push -u origin main
  ```

### 2. Deploy on Vercel
1. Open [vercel.com/new](https://vercel.com/new) and import your GitHub repository.
2. Vercel automatically detects `vercel.json`:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Serverless API**: `/api/*` routes automatically to `api/index.ts` (Express + Gemini SDK).
3. Under **Environment Variables**, add:
   - `GEMINI_API_KEY` = your Google Gemini API key
4. Click **Deploy**. Every future push to `main` on GitHub will automatically trigger a fresh Vercel deployment.
