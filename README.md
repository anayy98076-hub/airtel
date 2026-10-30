# Airtel Loans — Online Loan Application Portal

A fast, modern loan application SPA built with **Vite + Vanilla JS**.

## 🚀 Deploy to Render

### Quick Deploy Steps

1. **Push to GitHub** (first time setup):
   ```bash
   git init
   git add .
   git commit -m "initial commit"
   git remote add origin https://github.com/anayy98076-hub/airtel.git
   git push -u origin main
   ```

2. **Connect to Render**:
   - Go to [render.com](https://render.com) → **New** → **Static Site**
   - Connect your GitHub repo
   - Render auto-detects `render.yaml` — just click **Deploy**

3. **Manual settings** (if not using `render.yaml`):
   | Setting | Value |
   |---|---|
   | Build Command | `npm install && npm run build` |
   | Publish Directory | `./dist` |
   | Node Version | `18` |

4. Your site will be live at: `https://airtelloans.onrender.com`

---

## 💻 Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:5173`

## 📦 Build for Production

```bash
npm run build
```

Output is in `./dist` — ready to upload anywhere.

---

## 🗂 Page Flow

```
Loan Calculator → Application Form → Review & Confirm → Success → Mobile Login → PIN Login
```

## ✅ Features
- Interactive loan calculator with real-time monthly payment
- Multi-step application form with **inline validation**
- Review & confirm page with step progress indicator
- **Loading spinner** on form submission
- CABS / OLDMUTUAL branded design
- Mobile-first responsive layout
- Smooth page transitions
