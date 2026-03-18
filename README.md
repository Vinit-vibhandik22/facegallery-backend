<div align="center">

```
 ██████╗██╗     ██╗   ██╗███████╗████████╗██████╗ 
██╔════╝██║     ██║   ██║██╔════╝╚══██╔══╝██╔══██╗
██║     ██║     ██║   ██║███████╗   ██║   ██████╔╝
██║     ██║     ██║   ██║╚════██║   ██║   ██╔══██╗
╚██████╗███████╗╚██████╔╝███████║   ██║   ██║  ██║
 ╚═════╝╚══════╝ ╚═════╝ ╚══════╝   ╚═╝   ╚═╝  ╚═╝
```

### _AI-powered face clustering for professional photographers._

<br/>

![Next.js](https://img.shields.io/badge/Next.js_16-black?style=for-the-badge&logo=next.js&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![Python](https://img.shields.io/badge/Python_3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

<br/>

> **Upload thousands of event photos. Clustr finds every face, groups them by person, and delivers individual galleries — automatically.**

<br/>

<!-- Replace with your actual demo GIF -->
![Clustr Demo](https://via.placeholder.com/900x500/0d1117/3b82f6?text=📸+Add+your+demo+GIF+here)

</div>

---

## 🧠 What is Clustr?

Event photographers deal with a brutal problem: **thousands of photos, hundreds of faces, and clients who only want *their* photos.** Manual sorting is hours of work. Basic tools get it wrong.

Clustr solves this with industrial-grade AI — **RetinaFace + ArcFace** — running on a dedicated Python backend, delivering **zero false positives** through a custom clustering algorithm tuned specifically for professional photo delivery.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🧬 **AI Face Scanning** | RetinaFace detection + ArcFace 512-dim embeddings for biometric-level accuracy |
| 🧠 **Smart Clustering** | Custom Agglomerative (Complete Linkage) algorithm — if it's unsure, it separates, never merges |
| 🕸️ **Face Nexus Graph** | Interactive relational map showing which people appear together across photos |
| 📊 **Premium Dashboard** | Live circular progress rings, activity feed, and project status badges |
| 🎯 **Confidence Scoring** | Every face gets a 0–100% confidence score; low-confidence faces go to manual review |
| 🔄 **Re-Sort Engine** | Adjust clustering strictness with sliders — no re-uploading needed |
| ⚡ **GSAP Animations** | Fluid micro-interactions on every hover, transition, and state update |
| 🌑 **Aura Glass UI** | Deep charcoal dark theme with glassmorphism and electric blue accents |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND                            │
│         Next.js 16 + React 19 + Tailwind CSS           │
│              GSAP Animations • Aura Glass UI            │
└──────────────────────┬──────────────────────────────────┘
                       │ REST API
┌──────────────────────▼──────────────────────────────────┐
│                   AI BACKEND                            │
│              FastAPI (Python) + DeepFace                │
│     RetinaFace (detection) → ArcFace (embeddings)       │
│       Custom Agglomerative Clustering Engine            │
└──────────┬──────────────────────────┬───────────────────┘
           │                          │
┌──────────▼──────────┐   ┌───────────▼───────────────────┐
│  Supabase (Postgres) │   │     Supabase Storage          │
│  Projects • Clusters │   │  Original Photos • Thumbnails │
│  Face Coordinates    │   │                               │
└─────────────────────┘   └───────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16, React 19, TypeScript |
| **Styling** | Tailwind CSS, Vanilla CSS (design tokens) |
| **Animations** | GSAP |
| **Backend** | FastAPI (Python) |
| **AI Models** | RetinaFace (detection), ArcFace via DeepFace (embeddings) |
| **Database** | Supabase (PostgreSQL) |
| **Storage** | Supabase Storage |
| **Auth** | Supabase Auth |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- Supabase account (free tier works)

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/clustr.git
cd clustr
```

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Fill in your Supabase URL and anon key
npm run dev
```

### 3. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Fill in your Supabase service key
uvicorn main:app --reload
```

### 4. Open the app

```
Frontend → http://localhost:3000
Backend  → http://localhost:8000/docs
```

---

## 🧬 How the Clustering Works

<details>
<summary><b>Click to expand — The Nexus Engine explained</b></summary>

<br/>

Clustr uses a **Custom Agglomerative Clustering with Complete Linkage**:

1. **Detection** — RetinaFace scans each photo and detects all faces (handles profile views and low-light)
2. **Embedding** — ArcFace converts each detected face into a 512-dimensional mathematical fingerprint
3. **Clustering** — The Complete Linkage algorithm groups faces where **every pair** in the cluster is within a strict L2 distance threshold
4. **Confidence Scoring** — Each face is scored 0–100% based on its distance from the cluster center
5. **Noise Handling** — Faces below the confidence threshold are tagged **"Uncategorized"** for manual review — never force-merged

> **Why Complete Linkage?** It's the strictest possible merge condition. If the AI is even 1% unsure about a match, it creates a separate group. Zero false positives over zero missed matches — the right tradeoff for professional delivery.

</details>

---

## 📸 Screenshots

<!-- Add your actual screenshots below -->

| Dashboard | Face Nexus Graph |
|---|---|
| ![Dashboard](https://via.placeholder.com/440x280/0d1117/3b82f6?text=Dashboard+Screenshot) | ![Nexus Graph](https://via.placeholder.com/440x280/0d1117/3b82f6?text=Nexus+Graph+Screenshot) |

| Upload Flow | Cluster View |
|---|---|
| ![Upload](https://via.placeholder.com/440x280/0d1117/3b82f6?text=Upload+Flow+Screenshot) | ![Clusters](https://via.placeholder.com/440x280/0d1117/3b82f6?text=Cluster+View+Screenshot) |

---

## 🗺️ Roadmap

- [ ] Bulk download per-person gallery as ZIP
- [ ] QR code delivery links for event guests
- [ ] Mobile-optimized upload flow
- [ ] Multi-event cross-referencing
- [ ] On-device inference (ONNX export)

---

## 🤝 Contributing

Pull requests are welcome. For major changes, open an issue first to discuss what you'd like to change.

---

## 📄 License

[MIT](LICENSE) — free to use, modify, and distribute.

---

<div align="center">

Built with ☕ and way too many face embeddings.

**[⭐ Star this repo](https://github.com/yourusername/clustr)** if Clustr saved you from manual photo sorting hell.

</div>

