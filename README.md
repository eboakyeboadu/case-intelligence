# Case Intelligence (Demo)

A browser-based case preparation workspace: read case materials, organize exhibits, and practice structured, AI-assisted responses. Built solo, zero to one.

**Portfolio demo using sample data created for demonstration, replacing private information from the original project.** The original repository remains private. All bundled cases, companies, people, and numbers are generated sample data. Scorecard figures are illustrative layouts, not real results. No real course materials, school branding, or third-party data are included.

## Features

- Upload and parse PDF, Word, text, Markdown, CSV, and spreadsheet case files (client-side)
- Case workspace with exhibit tracking and key-fact highlighting
- AI-assisted Socratic "cold call" practice with a defense scorecard
- Two sample cases included; click "Try a sample case" on the empty workspace to explore reading, cold-call, materials, and scorecard views

## Tech stack

React, TypeScript, Vite, Tailwind CSS, PDF.js, Google Generative AI (Gemini), Node.js + Express.

## Run locally

1. `npm install`
2. Set `GEMINI_API_KEY` in `.env.local` (see `.env.example`)
3. `npm run dev`

## Notes

- Users can upload their own documents; uploads are processed locally.
- Sample professor personas (e.g., "Prof. A. Whitfield") are demo content, not real people.

## Build & verification notes

- `npm run build` (vite + esbuild server bundle) passes. On machines with ~2GB RAM, run it with a larger Node heap, e.g. `NODE_OPTIONS=--max-old-space-size=1536 npm run build`.
- `npm run lint` (`tsc --noEmit`) passes.
- The two sample cases live in `src/data/cases.ts` and load from the "Try a sample case" button on the empty workspace.
- Checked: production build, `tsc --noEmit`, and sample-case load plus the Read, Cold Call, Project Materials, and Defense Scorecard views render in a headless browser.
- Not checked: AI features (cold-call responses, narration voices beyond browser defaults) need a `GEMINI_API_KEY` and were not exercised; PDF/Word upload parsing was not re-tested.
