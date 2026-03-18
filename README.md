<div align="center">

```
 ██████╗██╗     ██╗   ██╗███████╗████████╗██████╗ 
██╔════╝██║     ██║   ██║██╔════╝╚══██╔══╝██╔══██╗
██║     ██║     ██║   ██║███████╗   ██║   ██████╔╝
██║     ██║     ██║   ██║╚════██║   ██║   ██╔══██╗
╚██████╗███████╗╚██████╔╝███████║   ██║   ██║  ██║
 ╚═════╝╚══════╝ ╚═════╝ ╚══════╝   ╚═╝   ╚═╝  ╚═╝
```

### _Industrial-grade AI face clustering for professional photographers._

<br/>

![Next.js](https://img.shields.io/badge/Next.js_16-black?style=for-the-badge&logo=next.js&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![Python](https://img.shields.io/badge/Python_3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![GSAP](https://img.shields.io/badge/GSAP-88CE02?style=for-the-badge&logo=greensock&logoColor=black)

<br/>

> **Upload thousands of event photos. Clustr finds every face, groups them by person, and delivers individual galleries — automatically. Zero false positives.**

<br/>

<!-- Replace with your actual demo GIF -->
![Clustr Demo](https://via.placeholder.com/900x500/0d1117/3b82f6?text=📸+Add+your+demo+GIF+here)

</div>

---

## 🧠 The Problem

Event photographers shoot thousands of frames per event. Clients want only *their* photos. Manual sorting is hours of soul-crushing work. Basic face-recognition tools hallucinate matches and destroy trust.

Clustr solves this with a **dedicated Python AI backend** running MTCNN + FaceNet512, paired with a **mathematically strict clustering engine** that prioritizes zero false positives over recall — because delivering the wrong photo to a client is never acceptable.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🧬 **MTCNN + FaceNet512 Pipeline** | 3-stage face detection with 512-dim embedding extraction. Handles tilted heads, partial occlusions, and wide group shots |
| 🧠 **Complete Linkage Clustering** | Custom agglomerative algorithm — every pair in a cluster must be within L2 threshold. If unsure, it separates |
| 🕸️ **Face Nexus Graph** | Force-directed physics simulation on HTML5 Canvas mapping co-occurrence relationships between people |
| 📊 **Premium Dashboard** | Live circular progress rings, real-time activity feed, and project status badges |
| 🎯 **Confidence Scoring** | Every face gets a 0–100% score based on distance from cluster centroid; uncertain faces go to manual review |
| 🔄 **Re-Sort Engine** | Adjust clustering threshold via sliders without re-uploading — re-runs on existing embeddings |
| 🔗 **Public Gallery Tokens** | UUID-based expiring share links — guests access their gallery without creating an account |
| ⚡ **Sequential Processing** | Deliberate one-by-one upload to protect backend RAM/GPU on standard hardware |
| 🌑 **Aura Glass UI** | Deep charcoal dark theme, glassmorphism, GSAP micro-animations on every state transition |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│           Next.js 16 + React 19 + TypeScript                │
│         Tailwind CSS • GSAP Animations • Aura Glass UI      │
└───────────────────────────┬─────────────────────────────────┘
                            │ REST API (sequential per-photo)
┌───────────────────────────▼─────────────────────────────────┐
│                      AI BACKEND                             │
│                  FastAPI (Python)                           │
│                                                             │
│  MTCNN (P-Net → R-Net → O-Net)  →  FaceNet512              │
│  Scale to 1600px max  →  160x160 crop  →  512-dim embed     │
│  30% padded thumbnail  →  base64 JPEG  →  Supabase Storage  │
└──────────────┬──────────────────────────┬───────────────────┘
               │                          │
┌──────────────▼──────────┐   ┌───────────▼──────────────────┐
│   Supabase (PostgreSQL)  │   │      Supabase Storage        │
│  projects • clusters     │   │  Original Photos • Thumbnails│
│  photo_cluster_map       │   │  (served as frosted avatars) │
│  confidence scores       │   │                              │
│  UUID gallery tokens     │   │                              │
└─────────────────────────┘   └──────────────────────────────┘
```

---

## 🧬 How the Clustering Works

<details>
<summary><b>The Nexus Engine — Complete Linkage explained</b></summary>

<br/>

Implemented in `src/lib/clustering.ts`.

**Why Complete Linkage over Single Linkage?**

Single Linkage has a chaining problem — if Person A resembles Person B slightly, and Person B resembles Person C slightly, the algorithm merges all three into one cluster. Unacceptable for professional photo delivery.

Complete Linkage requires the **maximum pairwise distance** between any two faces in a cluster to remain below the threshold. Every face must be close to every other face — not just its nearest neighbor.

**The Math:**
- Vector space: 512-dimensional FaceNet embeddings
- Metric: Normalized L2 Euclidean distance (normalization + L2 is the gold standard for FaceNet512, achieving >99% accuracy)
- Threshold: `1.04` L2 distance (tuned for FaceNet512's embedding space)
- Noise handling: Faces exceeding threshold → tagged **"Uncategorized"** for manual review. Never force-merged.

**Confidence Score:**
Each face scored `0–100%` based on average L2 distance from the cluster centroid. Displayed as industrial progress bars in the UI.

</details>

<details>
<summary><b>Face Nexus Graph — Force-directed physics simulation</b></summary>

<br/>

Implemented in `src/components/FaceNexusGraph.tsx` — runs on HTML5 Canvas via `requestAnimationFrame`.

**Co-occurrence Mapping:**
Queries `photo_cluster_map` in Supabase to find which clusters (people) appear in the same `photo_id`. Builds an adjacency graph from this data.

**Three physical forces running per frame:**

1. **Inverse-Square Repulsion** — Nodes push each other away to prevent overlap
2. **Spring-Link Force** — Edges act as rubber bands. More shared photos = stiffer spring = nodes pulled closer together
3. **Quadratic Drag** — `node.vx *= 0.9` per frame — 10% velocity decay until the graph settles into a stable, readable state

Toggle between standard grid view and the live physics simulation from the dashboard.

</details>

<details>
<summary><b>MTCNN Detection Pipeline</b></summary>

<br/>

Implemented in `python_backend/main.py`.

**Why MTCNN over simpler detectors?**
HOG and Haar-cascade filters fail on tilted heads and partial occlusions — common in event photography. MTCNN's 3-stage cascade (P-Net → R-Net → O-Net) handles these robustly.

**Processing steps:**
1. Image scaled to **max 1600px** — ensures small faces in wide group shots have enough pixel density for FaceNet's 160×160 input
2. MTCNN detects all face bounding boxes
3. Each crop normalized and passed through FaceNet512 → 512-dim embedding
4. **30% padding** applied around bounding box before thumbnail crop
5. Thumbnail encoded as **base64 JPEG** → stored in Supabase → rendered as frosted glass avatars in Next.js

</details>

<details>
<summary><b>Database Design — Supabase Schema highlights</b></summary>

<br/>

**`photo_cluster_map` — the brain of the system**

Stores the confidence score for every detected face in every photo. Powers the Nexus Graph, dashboard stats, and the re-sort engine.

**Cascade Merge Logic (`db.ts`):**
When clusters are manually merged, performs a complex `upsert + delete` operation — remapping all associated photos while handling the edge case where the same person appears twice in the same photo (which causes a primary key conflict on a naive update).

**Public Gallery Tokens:**
UUID-based tokens with `expires_at` timestamps. Photographers share a link; guests access their specific face-gallery without an account. No auth required on the guest side.

</details>

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16, React 19, TypeScript |
| **Styling** | Tailwind CSS, Vanilla CSS (design tokens) |
| **Animations** | GSAP |
| **Backend** | FastAPI (Python) |
| **Face Detection** | MTCNN (3-stage cascade) |
| **Face Embeddings** | FaceNet512 via DeepFace |
| **Clustering** | Custom Agglomerative — Complete Linkage (`clustering.ts`) |
| **Database** | Supabase (PostgreSQL) |
| **Storage** | Supabase Storage |
| **Auth** | Supabase Auth |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- Supabase project (free tier works)

### 1. Clone

```bash
git clone https://github.com/yourusername/clustr.git
cd clustr
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

### 3. Backend

```bash
cd python_backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Add SUPABASE_SERVICE_KEY
uvicorn main:app --reload
```

### 4. Open

```
Frontend  →  http://localhost:3000
API Docs  →  http://localhost:8000/docs
```

> **Note:** First request triggers model warmup (MTCNN + FaceNet512 load). The UI shows a "warming up" state — expected behavior, not a bug.

---

## 📸 Screenshots

<!-- Replace with actual screenshots -->

| Dashboard | Face Nexus Graph |
|---|---|
| ![Dashboard](https://via.placeholder.com/440x280/0d1117/3b82f6?text=Dashboard) | ![Nexus](https://via.placeholder.com/440x280/0d1117/3b82f6?text=Nexus+Graph) |

| Upload Flow | Cluster View |
|---|---|
| ![Upload](https://via.placeholder.com/440x280/0d1117/3b82f6?text=Upload+Flow) | ![Clusters](https://via.placeholder.com/440x280/0d1117/3b82f6?text=Cluster+View) |

---

## 🗺️ Roadmap

- [ ] Bulk ZIP download per-person gallery
- [ ] QR code delivery for event guests
- [ ] Parallel processing mode (for high-RAM servers)
- [ ] Mobile-optimized upload flow
- [ ] ONNX export for on-device inference

---

<div align="center">

Built with ☕, FastAPI, and an unreasonable number of face embeddings.

**[⭐ Star this repo](https://github.com/yourusername/clustr)** if Clustr saved you from manual photo sorting hell.

</div>

