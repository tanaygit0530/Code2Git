# Code2Git AI

> **Automated AI-powered LeetCode solution capture, README generator, and automatic GitHub DSA repository sync Chrome Extension.**

Code2Git AI eliminates manual copy-pasting, documentation writing, complexity calculations, and Git commits for student programmers. When a student solves a problem on LeetCode and receives an **Accepted** submission result, Code2Git AI automatically captures the solution, generates a comprehensive AI-driven `README.md`, and pushes both files directly to their personal GitHub `DSA-Solutions` repository.

---

## 🌟 Key Features

* **Zero-Touch LeetCode Automation**: Detects **Accepted** submissions automatically in real-time.
* **Automatic Repository Creation**: Automatically checks for and creates `StudentUsername/DSA-Solutions` upon GitHub authorization—no manual repo setup required!
* **Multi-Student Repository Isolation**: Every student gets their own independent `StudentUsername/DSA-Solutions` repository derived dynamically from their authenticated account.
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
│  • Auto DSA Repo Creator   │  • Primary Category Engine │
└──────────────┬─────────────┴─────────────┬──────────────┘
               │                           │
               ▼                           ▼
┌────────────────────────────┐ ┌──────────────────────────┐
│      GitHub REST API       │ │   AI Provider (Gemini /  │
│ (Student/DSA-Solutions Repo)│ │   OpenAI Configurable)   │
└────────────────────────────┘ └──────────────────────────┘
```

---

## 🎓 Complete Student Experience

1. Student installs the extension using Chrome's **Load Unpacked** (`chrome://extensions`).
2. Student opens Code2Git AI and clicks **Connect GitHub**.
3. Student authorizes Code2Git AI.
4. Backend automatically creates `StudentUsername/DSA-Solutions` (or connects existing one).
5. Extension displays:
   - **GitHub Connected ✓**
   - **Welcome, StudentUsername**
   - **DSA Repository: StudentUsername/DSA-Solutions (Repository Ready ✓)**
   - **[Open Repository]** button.
6. Student opens LeetCode, solves a problem, and clicks **Submit**.
7. If **Accepted**, Code2Git AI automatically generates `README.md` and pushes `solution.cpp` & `README.md` into `DSA-Solutions/Category/Problem/`!

---

## 🔒 Security & Required Permissions

### GitHub OAuth Scopes Required
* `user`: Used to read the authenticated username to determine repository owner (`StudentUsername`).
* `repo`: Used to create `DSA-Solutions` and push solution files + READMEs on behalf of the student.

### Security Rules
1. **No Hardcoded Client Secrets**: `GITHUB_CLIENT_SECRET` remains exclusively on the Express backend server in `.env`.
2. **Restricted Communication**: Extension communicates with the backend via HTTPS REST endpoints.
3. **No Cross-User Leaks**: Repository ownership is strictly determined from the authenticated user token.
