# StudyFlow — Student Task Manager

A standalone, accessible medium-fidelity prototype created for an interaction specification assignment. Built with semantic HTML, CSS, and vanilla JavaScript. No backend or package installation is required.

## Run locally
1. Download or clone this repository.
2. Open `index.html` in a modern browser.
3. Select **Add task** and complete the three-step task-creation flow.

For local hosting, you can also run `python -m http.server 8000` from this folder and visit `http://localhost:8000`.

## Prototype features
- Dashboard with sample tasks, status counts, search, and filters.
- Multi-step create task flow: Details → Review → Confirmation.
- Required-field and due-date validation with inline recovery guidance.
- Priority selection, review-before-save, loading feedback, and duplicate-submit prevention.
- Task completion checkboxes and local browser persistence using `localStorage`.
- Keyboard focus indicators, skip link, dialog semantics, focus management, live status announcements, and reduced-motion support.

## Specification
See [`prototype_spec/CaseStudy2_Specification.md`](prototype_spec/CaseStudy2_Specification.md) for the interaction flow, input mapping, component state matrix, accessibility decisions, and reflection answers.

## Before submission
- Publish this repository as public on GitHub.
- Enable GitHub Pages (Settings → Pages → deploy from the `main` branch, root folder).
- Open the published site in a private/incognito window to verify public access.
- Add the live demo URL here and to the specification document.
- Test keyboard navigation and contrast in your own browser before claiming a completed accessibility audit.

## Scope note
This is a front-end prototype. Local browser storage is used to simulate persistence; there is no real account system, server-side storage, or backend authorization.
