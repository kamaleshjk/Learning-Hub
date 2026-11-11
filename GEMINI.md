# StudyForge — Workspace Rules for Antigravity IDE

This workspace is the user's personal learning web app (**StudyForge**).

## Core Workflow Rule
When the user gives you study materials, links, PDFs, notes, or asks to add/create a new study topic:
1. Activate and follow the `.agents/skills/add-study-topic/SKILL.md` skill.
2. Create **strictly ONE Markdown file** per topic inside `topics/<slug>.md`.
3. Do NOT edit any React/JS registry files — Vite automatically discovers every `.md` file in `topics/` via `import.meta.glob`.
4. Always make the topic **deeply explainable** (intuitive mental models, analogies, Mermaid diagrams, comparison tables, gotchas) AND **immediately practical** (copy-pasteable commands/code, checkable hands-on lab steps `- [ ]`, flashcards, and a self-check quiz).
