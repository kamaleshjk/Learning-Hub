---
name: add-study-topic
description: >-
  Use this skill whenever the user provides study materials, links, notes, or
  resources and asks to add, summarize, or create a new learning topic for the
  StudyForge personal learning web app. Produces ONE explainable, practical
  Markdown file in topics/<slug>.md.
---

# Add Study Topic to StudyForge

Transform raw study resources into **one single, deeply explainable and practical** `.md` file inside `topics/<slug>.md`.

## Steps

1. **Choose a clean slug**: lowercase, hyphen-separated (e.g., `topics/aws-iot-core.md`, `topics/kubernetes-networking.md`).
2. **Synthesize the user's resources** rather than copy-pasting walls of text. Prioritize clarity, intuition, and hands-on practice.
3. **Write ONE file** at `topics/<slug>.md` following the exact schema below.

## Required File Schema (`topics/<slug>.md`)

```markdown
---
title: "Human-Friendly Topic Title"
slug: "<slug>"
category: "Cloud & IoT" # e.g., Cloud & IoT, Backend, Frontend, Networking, Databases, DevOps
difficulty: "Intermediate" # Beginner | Intermediate | Advanced
estimatedTime: "40 min"
summary: "1-2 sentence practical summary of what the learner will understand and build."
tags: ["Tag1", "Tag2", "Tag3"]
prerequisites: ["Prereq 1", "Prereq 2"]
updatedAt: "YYYY-MM-DD"
resources:
  - title: "Resource Name"
    url: "https://..."
    type: "Official Docs" # Official Docs | Video | Article | Repo | Spec
flashcards:
  - front: "Conceptual or 'why' question?"
    back: "Clear, concise explanation."
quiz:
  - question: "Practical scenario question?"
    options:
      - "Option A"
      - "Option B"
      - "Option C"
      - "Option D"
    answer: 1 # 0-based index of the correct option
    explanation: "Why this option is right and others are wrong."
---
```

## Pedagogy & Markdown Body Guidelines

Include these sections in the Markdown body so every topic feels like a personal mentor wrote it:

1. **Mental Model / Big Picture** (`> [!MENTAL_MODEL]` callout): Explain the core idea using a concrete real-world analogy before diving into jargon.
2. **Architecture / Flow Diagram**: Include at least one ` ```mermaid ` diagram (`flowchart`, `sequenceDiagram`, or `stateDiagram-v2`) showing how components interact. Quote labels with parentheses or special characters (e.g. `A["Client (ESP32)"]`).
3. **Core Concepts & Comparison Table**: Break down key terms, trade-offs, and gotchas using tables and callouts:
   - `> [!TIP]` for practical shortcuts/best practices
   - `> [!WARNING]` for common mistakes, limits, or cost/security traps
   - `> [!REALWORLD]` for production insights
4. **Hands-On Lab (`## Hands-On Lab: ...`)**:
   - MUST use an `##` heading containing the word `Lab` or `Hands-On` or `Practical` so the **Hands-On Labs** tab auto-extracts it.
   - MUST include checkable steps (`- [ ] **Step 1:** ...`) with runnable CLI commands, code snippets, and expected behavior.
5. **Quick Cheat Sheet**: A compact table of ports, commands, limits, or rules of thumb.

## Verification

- Verify valid YAML frontmatter (quote strings containing colons `:`!).
- Confirm only ONE new `.md` file was created in `topics/` (no edits needed in `src/`).
