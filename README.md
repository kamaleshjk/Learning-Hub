# StudyForge — Personal Learning Studio

A personal learning web app built for the **collect resources → generate one practical topic file in Antigravity IDE → study & practice** workflow.

## Quick Start

1. Open this folder (`personal-learning-hub`) in **Antigravity IDE**.
2. Start the webpage:
   - Double-click `start.bat`, **or**
   - Run `npm run dev` in the terminal.
3. Open `http://localhost:5173` in your browser.

## How Adding New Topics Works

1. Collect your study links, docs, PDFs, or notes for any topic.
2. Give them to **Antigravity IDE** and ask it to add a topic.
3. Because of `GEMINI.md` and `.agents/skills/add-study-topic/SKILL.md`, Antigravity creates **one single file** in `topics/<slug>.md`.
4. The app automatically discovers every `.md` file in `topics/` (no code or registry edits needed) and renders:
   - **Concept Guide** with mental models, Mermaid architecture diagrams, syntax-highlighted code, and callouts
   - **Hands-On Labs** with persistent step-by-step checklists
   - **Flashcards** for active recall
   - **Self-Check Quiz** with explanations
   - **Personal Notes** drawer saved locally in your browser
