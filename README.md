# Code2Git AI

> **Automated AI-powered LeetCode solution capture, README generator, and GitHub DSA repository sync Chrome Extension.**

Code2Git AI eliminates manual copy-pasting, documentation writing, complexity calculations, and Git commits for student programmers. When a student solves a problem on LeetCode and receives an **Accepted** submission result, Code2Git AI automatically captures the solution, generates a comprehensive AI-driven `README.md`, and pushes both files directly to their GitHub DSA repository.

---

## 🌟 Key Features

* **Zero-Touch LeetCode Automation**: Detects **Accepted** submissions automatically in real-time.
* **Non-Accepted Safeguard**: Skips pushing when submissions result in *Wrong Answer*, *Runtime Error*, or *Time Limit Exceeded*.
* **Duplicate Submission Protection**: Calculates submission hashes to prevent redundant pushes.
* **AI-Generated Comprehensive READMEs**: Generates structured markdown including Problem, Example, DSA Pattern, Prerequisites, Approach, Algorithm, Markdown Table Dry Run, Code Explanation, Time & Space Complexity analysis ($O(N)$ with explanations), Edge Cases, Alternative Approaches, and Key Takeaway.
* **Smart DSA Folder Organization**: Organizes solutions into category folders based on LeetCode tags/topics (`Hashing/Two-Sum/`, `Two-Pointers/`, `Trees/`, `Dynamic-Programming/`).
* **Dynamic Multi-Language Support**: Automatically sets file extensions (`solution.cpp`, `solution.js`, `solution.py`, `solution.java`, `solution.go`, etc.).
* **Production-Grade Chrome Extension**: Modern Side Panel interface built with React 18 and Tailwind CSS.
* **Secure Backend OAuth**: GitHub client secrets and AI API keys remain safe on the backend server.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  LeetCode Tab (DOM)                     │
└────────────────────────────┬────────────────────────────┘
                             │ MutationObserver / leetcodeAdapter.js
                             ▼
┌─────────────────────────────────────────────────────────┐
│                 Content Script (Injected)               │
└────────────────────────────┬────────────────────────────┘
                             │ chrome.runtime.sendMessage
                             ▼
┌─────────────────────────────────────────────────────────┐
│              Background Service Worker                  │
└──────────────┬───────────────────────────┬──────────────┘
               │                           │ Status updates
               │ REST API                  ▼
               │               ┌──────────────────────────┐
               │               │ React Sidepanel / Popup  │
               ▼               └──────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│            Express.js Backend Server                    │
├────────────────────────────┬────────────────────────────┤
│  • GitHub Auth / OAuth     │  • AI README Generator     │
│  • Repository Management   │  • Primary Category Engine │
└──────────────┬─────────────┴─────────────┬──────────────┘
               │                           │
               ▼                           ▼
┌────────────────────────────┐ ┌──────────────────────────┐
│      GitHub REST API       │ │   AI Provider (Gemini /  │
│  (DSA-Solutions Repo)      │ │   OpenAI Configurable)   │
└────────────────────────────┘ └──────────────────────────┘
```

---

## 🛠️ Tech Stack

* **Chrome Extension**: JavaScript, Manifest V3, React 18, Vite 6, Tailwind CSS, Chrome Side Panel API, Chrome Storage API, Chrome Messaging API.
* **Backend**: Node.js, Express.js, JavaScript, CORS, Dotenv, Axios.
* **AI Engine**: Google Gemini (`@google/genai`), OpenAI API, pluggable fallback provider.
* **GitHub Integration**: GitHub OAuth 2.0 & GitHub REST Contents API.

---

## 📁 Project Structure

```
Code2Git-AI/
├── README.md                   # Complete system and student guide
├── package.json                # Root build scripts
├── server/                     # Express.js Backend Server
│   ├── package.json
│   ├── .env.example
│   ├── .env
│   └── src/
│       ├── server.js           # Server entrypoint & CORS setup
│       ├── config/             # Config loader
│       ├── routes/             # Express API routes
│       ├── controllers/        # Request handlers
│       ├── services/           # AI & GitHub services
│       └── utils/              # Category detector & prompt builder
└── extension/                  # Chrome Extension (Vite + React)
    ├── package.json
    ├── vite.config.js
    ├── index.html
    ├── public/
    │   └── manifest.json       # Manifest V3
    └── src/
        ├── App.jsx             # React Main Sidepanel App
        ├── main.jsx
        ├── adapters/
        │   └── leetcodeAdapter.js  # Isolated LeetCode DOM queries
        ├── content/
        │   ├── contentScript.js    # Content script bridge
        │   └── submissionDetector.js # Accepted result observer
        ├── background/
        │   └── backgroundWorker.js   # Background service worker
        ├── services/           # Storage, API & Notifications
        ├── components/         # Header, Cards, Status, History, Settings
        └── styles/
            └── index.css       # Tailwind CSS
```

---

## 💻 Developer Guide (Building the Extension & Running Server)

### 1. Backend Setup
```bash
cd server
npm install
cp .env.example .env
```

Configure `server/.env`:
```env
PORT=5000
ALLOWED_ORIGINS=http://localhost:5000,chrome-extension://*
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:5000/api/github/callback
```

Start the backend server:
```bash
npm run dev
```

### 2. Chrome Extension Build
```bash
cd extension
npm install
npm run build
```
This produces the distribution folder: `extension/dist/`.

---

## 🎓 Student Installation Guide (Zero Code Required)

Students do **NOT** need terminal commands, Node.js, or VS Code!

1. Download or obtain the pre-built `extension/dist/` folder.
2. Open **Google Chrome** and navigate to: `chrome://extensions`
3. Enable **Developer Mode** (toggle in the top-right corner).
4. Click **Load unpacked** (top-left button).
5. Select the `extension/dist` folder.
6. Pin **Code2Git AI** to your Chrome toolbar.
7. Click the Code2Git AI icon to open the **Side Panel**.
8. Click **Connect GitHub Account** and select/confirm your target repository (e.g. `DSA-Solutions`).
9. Open any problem on [LeetCode](https://leetcode.com/problems/two-sum/).
10. Write your solution and click **Submit**.
    * If **Accepted**, Code2Git AI will automatically generate the README and push `solution.cpp` and `README.md` to your GitHub repo!

---

## 🔒 Security & Best Practices

1. **No Hardcoded Secrets**: Extension source code contains zero API keys or secrets.
2. **Restricted Communication**: Extension communicates with the backend exclusively via HTTPS REST endpoints.
3. **Privacy**: Only problem title, description, and submitted code are sent for AI analysis.
4. **Duplicate Safeguards**: Submissions are hashed to prevent redundant API calls and commits.

---

## 📜 License

MIT License. Developed for automated DSA learning and GitHub repository management.
# Code2Git
