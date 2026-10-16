# Fraudora

Stop scams before users act.

## Overview

Fraudora is a front-end prototype for examining suspicious SMS and message content. Phishing and impersonation scams target students and families with manufactured urgency and familiar names. Instead of presenting only an opaque warning, Fraudora's forensic view is designed to show the message, highlight risk terms, and explain the deception behind the warning.

The current scan flow is a mock: it waits briefly and returns the same sample result for every valid input. It does not identify scams in submitted messages.

## Features

### Workspace / Triage View

- Paste or edit a message payload, with a 1,600-character limit and empty/short-input validation.
- Inspect live character, estimated SMS segment, and URL counts; detected URLs are shown as defanged text.
- Load one of five built-in sample messages, spanning the displayed safe, suspicious, and critical categories.
- Start a simulated scan with the button or `Ctrl+Enter` / `Cmd+Enter`.
- View static engine-status values and a four-row mock recent-scan list.
- Switch to the forensic view at any time; before a scan, it displays the default mock result.

### Forensic Dashboard View

- Review the mock risk score, message ID, and analyst status; copy the message ID or start a new scan.
- Inspect message metadata, triggered rule indicators and weights, and threat taxonomy including a link to the MITRE ATT&CK technique.
- Read the payload with selected terms highlighted. URLs are rendered as non-clickable text marked `DEFANGED`.
- See a static link-analysis summary and suggested guidance.
- Try local Quarantine, Block Sender, Mark Safe (two-click confirmation), and Escalate controls. They update the banner and show a toast; they do not contact a service or perform those actions on a message.

## Traffic-light trust system

| Level | Color | Meaning in the interface |
|---|---|---|
| Safe | `#10B981` | Low-risk / safe |
| Suspicious | `#F59E0B` | Medium-risk / suspicious |
| Critical | `#EF4444` | High-risk / critical |

## Tech stack

Versions below are the dependency ranges declared in `package.json` (the lockfile resolves specific releases).

| Technology | Declared version | Use |
|---|---:|---|
| React | `^19.2.8` | UI |
| React DOM | `^19.2.8` | Browser rendering |
| Vite | `^8.3.0` | Development server and build |
| Tailwind CSS | `^3.4.19` | Utility styling |
| Lucide React | `^1.58.0` | Icons |
| `@vitejs/plugin-react` | `^6.1.1` | Vite React integration |
| Oxlint | `^1.81.0` | Linting |
| PostCSS / Autoprefixer | `^8.5.30` / `^10.6.1` | CSS processing |

The page also requests Inter and JetBrains Mono from Google Fonts in `index.html`; system-font fallbacks are configured for the interface.

## Getting started

### Prerequisites

- Node.js `^20.19.0` or `>=22.12.0`, as required by the locked Vite release.
- npm.

### Install dependencies

```bash
npm ci
```

### Run the development server

```bash
npm run dev
```

### Create a production build

```bash
npm run build
```

### Preview the production build

```bash
npm run preview
```

The available lint script is:

```bash
npm run lint
```

There is no test script configured in `package.json`.

## Project structure

```text
src/
├── App.jsx                          # View routing, application state, validation, and mocked scan flow
├── index.css                        # Global styles, dark background, scrollbar, and motion preferences
├── main.jsx                         # React entry point
├── assets/
│   ├── hero.png                     # Image asset; not referenced by the current UI
│   └── vite.svg                     # Vite template asset
├── components/
│   ├── ActionableGuidanceBox.jsx    # Mock directive, explanation, and countermeasure list
│   ├── CountermeasureBar.jsx        # Local-only analyst action buttons
│   ├── EngineStatusPanel.jsx        # Static engine status display and generated session label
│   ├── ForensicDashboard.jsx        # Forensic report layout
│   ├── HeroHeader.jsx               # Workspace introduction
│   ├── LinkAnalysisInspector.jsx    # Static domain summary
│   ├── MessageOverviewCard.jsx      # Message metadata display
│   ├── PayloadForensicView.jsx      # Highlighted payload and non-clickable URL display
│   ├── PayloadInputBox.jsx          # Message input, validation presentation, and live readout
│   ├── QuickTestChips.jsx           # Built-in sample-message selector
│   ├── RecentScans.jsx              # Static recent-scan list
│   ├── RiskIndicatorsList.jsx       # Triggered mock rule explanations and weights
│   ├── SOCHeader.jsx                # Header, UTC clock, and view toggle
│   ├── ScanButton.jsx               # Scan action and simulated progress presentation
│   ├── TaxonomyBadgeGroup.jsx       # Threat classification and MITRE ATT&CK link
│   ├── TriageBanner.jsx             # Risk score, message ID, status, and new-scan control
│   ├── WorkspaceView.jsx            # Workspace layout and keyboard shortcut handler
│   └── ui/
│       ├── Badge.jsx                # Shared badge primitive
│       ├── Card.jsx                 # Shared card primitive
│       └── Toast.jsx                # Auto-dismissing notification
├── data/
│   └── mockData.js                  # Risk labels, sample messages, recent scans, and default result
└── hooks/
    └── useUtcClock.js               # Live UTC clock hook
```

## State management

`App.jsx` keeps application state in React `useState`; there is no external state library.

| State variable | Initial value | Purpose |
|---|---|---|
| `activeView` | `'workspace'` | Selects the workspace or forensic dashboard |
| `payload` | `''` | Current message text |
| `activeSampleId` | `null` | Selected built-in sample |
| `error` | `null` | Input validation message |
| `isAnalyzing` | `false` | Simulated scan loading state |
| `isScanned` | `false` | Tracks whether the scan handler completed |
| `scanResult` | `SCAN_RESULT` | Current forensic data; initialized to the mock result |
| `bannerStatus` | Default review-required message | Dashboard status, changed by local countermeasure controls |
| `toast` | `null` | Current transient notification (`message` and `tone`) |

Individual components also use local state for presentation, including countermeasure button status, confirmation, toast dismissal, and the current header clock.

## Design tokens

Custom Tailwind theme values declared in `tailwind.config.js`:

| Token | Value |
|---|---|
| `obsidian` | `#0F1115` |
| `surface` | `#1A1D24` |
| `border-soc` | `#2A2E39` |
| `ink` | `#F0F2F5` |
| `muted` | `#9CA3AF` |
| `muted-dim` | `#525866` |
| `safe` | `#10B981` |
| `warn` | `#F59E0B` |
| `crit` | `#EF4444` |
| `font-sans` | Inter, system UI, sans-serif |
| `font-mono` | JetBrains Mono, UI monospace, SFMono-Regular, Menlo, monospace |
| `animate-fade-in` | `fadeIn`, 200 ms ease-out |
| `animate-slide-up` | `slideUp`, 200 ms ease-out |

Global CSS also honors `prefers-reduced-motion`.

## Backend integration

The `analyzeMessage()` stub is in [`src/App.jsx`](src/App.jsx), at line 19. It currently ignores its payload argument, waits about 1,800 ms, then returns the unchanged `SCAN_RESULT` from [`src/data/mockData.js`](src/data/mockData.js). The comment at the stub identifies a future `POST /api/analyze` integration point; no backend request is implemented.

The mock result defines this response contract:

```ts
type RiskLevel = 'safe' | 'suspicious' | 'critical';

type ScanResult = {
  messageId: string;
  score: number; // Intended range: 0–100
  riskLevel: RiskLevel;
  payload: string;
  overview: {
    encoding: string;
    segments: string;
    language: string;
    carrier: string;
    direction: string;
    source: string;
  };
  indicators: Array<{
    id: string;
    severity: string;
    ruleName: string;
    explanation: string;
    weight: number;
  }>;
  taxonomy: {
    primary: string;
    secondary: string;
    mitre: { id: string; label: string; url: string };
  };
  linkAnalysis: {
    normalizedDomain: string;
    reputation: string;
    domainAge: string;
    registrar: string;
  };
  guidance: {
    directive: string;
    explanation: string;
    countermeasures: string[];
  };
  highlightTerms: string[];
};
```

The UI expects these fields to be present. In the current prototype the response is fixed sample data, and countermeasure buttons only update React state and display a toast.

## Security notes

- Payload URLs in the input readout and forensic view are displayed as text, not rendered as clickable links. The forensic view labels them `DEFANGED`; it does not rewrite the URL shown in that view.
- Payload highlighting and domain highlighting use React elements; the source does not use `dangerouslySetInnerHTML`.
- The application does not persist entered payloads or scan results to browser storage or a server. Current results are in-memory mock data.
- Link analysis is display-only: the application does not visit submitted URLs or query a reputation service.
- The MITRE ATT&CK taxonomy link is a regular external link and opens in a new tab.
- Google Fonts are requested by the page from Google Fonts. No payload is submitted to that service by the current implementation.

## Accessibility and responsive behavior

- The input is labeled, exposes validation with `aria-invalid` and an alert, and announces its live readout.
- Buttons provide accessible names or pressed/busy states where appropriate, with visible keyboard-focus styling in the primary controls.
- The main views, status notifications, score progress, and relevant lists use semantic regions and ARIA labels/live regions.
- The workspace and dashboard use responsive grids that stack on smaller screens; the header changes labels and metadata layout at narrow widths.
- Motion-reduction preferences are respected by global CSS and selected animated elements.

## Known limitations and mock data

- Every valid input receives the same hard-coded `SCAN_RESULT`; the displayed score, risk level, rules, taxonomy, link details, and advice are not computed from the submitted message.
- The engine status panel, rule count, latency, recent scans, session label, and operational status strip are presentation-only values, not live telemetry.
- The displayed carrier and metadata are part of the sample result, not detected from the input.
- Quarantine, block, mark-safe, and escalation do not affect an SMS, sender, queue, or backend system.
- The payload length cap is 1,600 characters. Segment count is an estimate based on fixed 160-character / 153-character thresholds, not encoding-aware SMS segmentation.
- There is no backend, persistence, automated test script, or error UI for a failed backend call. The simulated scan currently resolves successfully with mock data.

## Roadmap

These are potential follow-up items, not implemented functionality.

- [ ] Connect `analyzeMessage()` to a real analysis API and validate its response.
- [ ] Replace static engine status and recent scans with live service data.
- [ ] Connect countermeasure actions to authorized backend operations.
- [ ] Add automated tests for validation, view transitions, and response rendering.
- [ ] Review payload privacy, retention, and API error handling for a production deployment.

## Screenshots

Add screenshots at the paths below to replace these placeholders:

![Workspace view placeholder](docs/workspace.png)

![Forensic dashboard view placeholder](docs/forensic-dashboard.png)

## Contributing

Contributions are welcome. Open an issue to discuss substantial changes, and include a clear description and verification steps with pull requests.

## License

License: not specified. Add the project's license and update this section before redistribution.

---

FRAUDORA // CORE2DUO — Kaustav Paul (Frontend Lead) & Shreyansh Tiwari (Backend Lead)
