# 🌐 MeetMate (VNPT AI Hackathon) – AI Meeting Co-Host for LPBank PMO

<p align="center">
  <b>Electron desktop + FastAPI backend + LangGraph agents (Pre | In | Post) with RAG over pgvector.</b><br>
  <i>Built for Head of PMO / Program Directors: dependable minutes, action tracking, knowledge recall, and auditability.</i>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Desktop-Electron%20%7C%20Vite%20%7C%20React-blue" alt="Electron badge">
  <img src="https://img.shields.io/badge/Backend-FastAPI%20%7C%20Postgres%20%7C%20pgvector-green" alt="Backend badge">
  <img src="https://img.shields.io/badge/AI-LangGraph%20%7C%20RAG%20%7C%20Tool--calling-orange" alt="AI badge">
  <img src="https://img.shields.io/badge/Usecase-PMO%20Minutes%20%2F%20Actions%20%2F%20Audit-purple" alt="PMO badge">
</p>

---

##  Overview
- Problem: PMO teams run many cross-functional meetings; manual minutes arrive late, actions are fragmented, and auditors need clean traceability.
- Personas: Head of PMO / Program Director, project managers, cross-functional leads; they need live recap, clear owners/deadlines, and fast document recall.
- Solution: Desktop co-host for Pre/In/Post phases, LangGraph agents with RAG, task and calendar hooks, and permission-aware storage.
- Outcome: Faster minutes, higher action completion, auditable decisions tied to sources.

##  Highlights
- Stage-aware agents: Pre (agenda/pre-read), In (live transcript + ADR mining), Post (executive minutes + highlights).
- RAG + pgvector: permission-aware retrieval with citations; “no source, no answer” guardrail.
- Tool-calling ready: stubs for calendar/task/doc APIs; WebSocket channel for live events.
- Demo-friendly: seeded Postgres, stub LLM/ASR flows, predictable outputs for fast iterations.

## 📁 Repo layout
```
vnpt_ai_hackathon/
├── electron/                         # Desktop app: Electron + React + TS
│   ├── src/
│   │   ├── main/                     # Electron main process
│   │   │   ├── main.ts               # Electron entry, creates BrowserWindow -> frontend
│   │   │   ├── preload.ts            # main preload
│   │   │   ├── windows/
│   │   │   │   ├── mainWindow.ts
│   │   │   │   └── settingsWindow.ts
│   │   │   ├── ipc/
│   │   │   │   ├── logIpc.ts
│   │   │   │   └── systemIpc.ts
│   │   │   └── security/
│   │   │       └── appSecurity.ts
│   │   │
│   │   ├── preload/                  # contextBridge bridges
│   │   │   ├── apiBridge.ts          # window.api.* -> HTTP/WebSocket backend
│   │   │   └── fsBridge.ts
│   │   │
│   │   ├── renderer/                 # React + TS UI (MeetMate)
│   │   │   ├── app/                  # “app router” style for Electron
│   │   │   │   ├── AppRoot.tsx       # App entry: Router, Theme, QueryClient...
│   │   │   │   ├── layout/
│   │   │   │   │   ├── AppShell.tsx  # Main layout: Sidebar + Topbar + content
│   │   │   │   │   ├── Sidebar.tsx   # Nav: Dashboard, Calendar, Meetings, ...
│   │   │   │   │   ├── Topbar.tsx    # Search, profile, AI status, org switch...
│   │   │   │   │   └── MeetingLayout.tsx
│   │   │   │   │                     # Layout for meeting pages (header + tabs)
│   │   │   │   ├── router/
│   │   │   │   │   └── index.tsx     # React Router config (Next-like app routes)
│   │   │   │   └── routes/           # Page-level routes
│   │   │   │       ├── dashboard/
│   │   │   │       │   └── DashboardPage.tsx
│   │   │   │       ├── calendar/
│   │   │   │       │   └── CalendarPage.tsx
│   │   │   │       ├── meetings/
│   │   │   │       │   ├── MeetingsListPage.tsx  # list all meetings + filters
│   │   │   │       │   └── [meetingId]/          # dynamic route
│   │   │   │       │       ├── index.tsx         # meeting overview + timeline Pre/In/Post
│   │   │   │       │       ├── pre.tsx           # Pre-meeting view (agenda, docs, AI prep)
│   │   │   │       │       ├── in.tsx            # In-meeting view (live panel)
│   │   │   │       │       └── post.tsx          # Post-meeting view (summary, follow-ups)
│   │   │   │       ├── live/
│   │   │   │       │   └── LiveMeetingPage.tsx   # full-screen live meeting UI (recording banner)
│   │   │   │       ├── knowledge-hub/
│   │   │   │       │   └── KnowledgeHubPage.tsx  # RAG search + AI Q&A
│   │   │   │       ├── tasks/
│   │   │   │       │   └── TasksPage.tsx         # actions (Planner/Jira sync)
│   │   │   │       └── settings/
│   │   │   │           └── SettingsPage.tsx      # integrations, org, AI prefs
│   │   │   │
│   │   │   ├── features/              # by domain/feature
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── StatsCards.tsx
│   │   │   │   │   │   └── AiInsightsPanel.tsx
│   │   │   │   │   ├── api/
│   │   │   │   │   │   └── dashboardApi.ts       # call backend /dashboard, /stats
│   │   │   │   │   └── hooks/
│   │   │   │   │       └── useDashboardData.ts
│   │   │   │   ├── calendar/
│   │   │   │   │   ├── components/               # calendar grid, date picker...
│   │   │   │   │   ├── api/
│   │   │   │   │   │   └── calendarApi.ts
│   │   │   │   │   └── hooks/
│   │   │   │   │       └── useCalendarMeetings.ts
│   │   │   │   ├── meetings/
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── MeetingList.tsx
│   │   │   │   │   │   ├── MeetingHeader.tsx
│   │   │   │   │   │   ├── MeetingTimeline.tsx   # Pre → In → Post timeline
│   │   │   │   │   │   └── MeetingMetaPanel.tsx
│   │   │   │   │   ├── api/
│   │   │   │   │   │   └── meetingsApi.ts        # /meetings, /meetings/{id}
│   │   │   │   │   └── store.ts                  # Zustand slice for list + filters
│   │   │   │   ├── inMeeting/                    # live meeting feature
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── LiveBanner.tsx        # “Recording • Live”
│   │   │   │   │   │   ├── LiveTranscriptPanel.tsx # transcript by speaker
│   │   │   │   │   │   ├── LiveActionsPanel.tsx  # auto actions/decisions/risks
│   │   │   │   │   │   └── LiveAiSidebar.tsx     # in-meeting Q&A
│   │   │   │   │   ├── hooks/
│   │   │   │   │   │   ├── useInMeetingWs.ts     # WS /ws/in-meeting/{session_id}
│   │   │   │   │   │   └── useInMeetingHttp.ts   # REST /in-meeting/message
│   │   │   │   │   ├── api/
│   │   │   │   │   │   └── inMeetingApi.ts       # in-meeting endpoints
│   │   │   │   │   └── store.ts                  # live state: transcript, partial tokens...
│   │   │   │   ├── postMeeting/
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── SummaryPanel.tsx      # exec summary + citations
│   │   │   │   │   │   └── TimelineReview.tsx    # decisions, risks, actions timeline
│   │   │   │   │   ├── api/
│   │   │   │   │   │   └── postMeetingApi.ts
│   │   │   │   │   └── hooks/
│   │   │   │   │       └── usePostMeetingSummary.ts
│   │   │   │   ├── knowledge/
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── KnowledgeSearchBar.tsx
│   │   │   │   │   │   └── KnowledgeResults.tsx
│   │   │   │   │   ├── api/
│   │   │   │   │   │   └── knowledgeApi.ts       # /rag/query, /knowledge/search
│   │   │   │   │   └── hooks/
│   │   │   │   │       └── useKnowledgeSearch.ts
│   │   │   │   ├── tasks/
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── TaskList.tsx
│   │   │   │   │   │   └── TaskFilters.tsx
│   │   │   │   │   ├── api/
│   │   │   │   │   │   └── tasksApi.ts           # Planner/Jira sync
│   │   │   │   │   └── store.ts                  # task board state
│   │   │   │   └── settings/
│   │   │   │       ├── components/
│   │   │   │       │   ├── IntegrationList.tsx
│   │   │   │       │   └── OrgPreferencesForm.tsx
│   │   │   │       ├── api/
│   │   │   │       │   └── settingsApi.ts
│   │   │   │       └── hooks/
│   │   │   │           └── useSettings.ts
│   │   │   │
│   │   │   ├── components/           # shared primitives
│   │   │   │   ├── ui/               # button, input, select, badge, card...
│   │   │   │   ├── layout/           # SplitPane, ScrollArea
│   │   │   │   └── icons/            # logo, status icons
│   │   │   │
│   │   │   ├── lib/                  # helpers (apiClient, wsClient, date, formatting...)
│   │   │   ├── store/                # global store (user, UI)
│   │   │   ├── styles/               # globals, themes, meeting styles
│   │   │   ├── assets/               # fonts, icons, logo
│   │   │   └── index.tsx             # renderer entry: render <AppRoot />
│   │   │
│   │   ├── shared/                   # shared types between main & renderer
│   │   │   ├── dto/                  # ChatMessage, Meeting, etc.
│   │   │   └── constants.ts
│   │   └── index.d.ts                # typings for window.api, env
│   │
│   ├── public/
│   ├── package.json
│   ├── tsconfig.node.json
│   ├── tsconfig.renderer.json
│   ├── vite.config.mts
│   ├── electron.vite.config.mts
│   └── README.md
│
├── backend/                          # FastAPI + LangChain + RAG + multi-agents
│   ├── app/
│   │   ├── main.py                   # FastAPI entry, include_router, mount /docs
│   │   ├── core/                     # config & infra
│   │   │   ├── config.py             # settings (OpenAI key, DB URL, CORS, WS origins…)
│   │   │   ├── logging.py
│   │   │   └── security.py           # auth/JWT if needed
│   │   │
│   │   ├── api/                      # routers (HTTP + WebSocket)
│   │   │   ├── deps.py               # shared Depends (get_db, get_current_user…)
│   │   │   └── v1/
│   │   │       ├── endpoints/
│   │   │       │   ├── auth.py
│   │   │       │   ├── users.py
│   │   │       │   ├── meetings.py        # CRUD meeting, participants, metadata
│   │   │       │   ├── documents.py       # upload/list docs for RAG
│   │   │       │   ├── in_meeting.py      # REST for in-meeting agent
│   │   │       │   ├── pre_meeting.py     # REST for pre-meeting agent
│   │   │       │   ├── post_meeting.py    # REST for post-meeting agent
│   │   │       │   ├── rag.py             # /rag/query, /rag/reindex,...
│   │   │       │   ├── agents.py          # /agent/list, /agent/config...
│   │   │       │   ├── chat_http.py       # generic chat REST
│   │   │       │   └── health.py          # health/ready
│   │   │       └── websocket/
│   │   │           └── in_meeting_ws.py   # /ws/in-meeting/{session_id} – streaming
│   │   │
│   │   ├── db/                       # Postgres + pgvector
│   │   │   ├── base.py               # declarative_base()
│   │   │   ├── session.py            # SessionLocal, engine
│   │   │   └── init_db.py            # init schema, enable pgvector if needed
│   │   │
│   │   ├── models/                   # SQLAlchemy models
│   │   │   ├── user.py
│   │   │   ├── meeting.py
│   │   │   ├── document.py
│   │   │   ├── embedding.py
│   │   │   ├── chat_session.py
│   │   │   └── __init__.py
│   │   │
│   │   ├── schemas/                  # Pydantic schemas
│   │   │   ├── user.py
│   │   │   ├── auth.py
│   │   │   ├── meeting.py
│   │   │   ├── document.py
│   │   │   ├── chat.py
│   │   │   ├── in_meeting.py
│   │   │   └── rag.py
│   │   │
│   │   ├── services/                 # business logic (non-LLM)
│   │   │   ├── user_service.py
│   │   │   ├── meeting_service.py
│   │   │   ├── document_service.py
│   │   │   ├── chat_service.py
│   │   │   └── auth_service.py
│   │   │
│   │   ├── llm/                      # LangChain/LangGraph flows
│   │   │   ├── clients/
│   │   │   │   ├── openai_client.py       # wrapper for OpenAI/VNPT/Azure
│   │   │   │   └── embedding_client.py
│   │   │   ├── prompts/
│   │   │   │   ├── in_meeting_prompts.py
│   │   │   │   ├── pre_meeting_prompts.py
│   │   │   │   └── post_meeting_prompts.py
│   │   │   ├── chains/
│   │   │   │   ├── in_meeting_chain.py    # (stub) graph/chain per phase
│   │   │   │   ├── pre_meeting_chain.py
│   │   │   │   ├── post_meeting_chain.py
│   │   │   │   └── rag_chain.py           # shared RAG chain
│   │   │   ├── graphs/                    # LangGraph stage flows
│   │   │   │   ├── in_meeting_graph.py    # primary graph
│   │   │   │   ├── pre_meeting_graph.py
│   │   │   │   ├── post_meeting_graph.py
│   │   │   │   └── router.py              # select graph by stage
│   │   │   ├── agents/
│   │   │   │   ├── base_agent.py
│   │   │   │   ├── in_meeting_agent.py
│   │   │   │   ├── pre_meeting_agent.py
│   │   │   │   └── post_meeting_agent.py
│   │   │   └── tools/                     # LangChain tools
│   │   │       ├── fs_tool.py
│   │   │       ├── search_tool.py
│   │   │       ├── calendar_tool.py
│   │   │       └── http_tool.py
│   │   │
│   │   ├── vectorstore/              # pgvector + ingestion
│   │   │   ├── pgvector_client.py
│   │   │   ├── retrieval.py
│   │   │   └── ingestion/
│   │   │       ├── loaders.py
│   │   │       └── pipelines.py
│   │   │
│   │   ├── websocket/                # connection pool, broadcast
│   │   │   ├── manager.py
│   │   │   └── events.py
│   │   │
│   │   ├── workers/                  # background tasks
│   │   │   ├── background_tasks.py
│   │   │   └── indexing_worker.py
│   │   │
│   │   └── __init__.py
│   │
│   ├── alembic/                      # migrations for Postgres + pgvector
│   │   ├── env.py
│   │   ├── script.py.mako
│   │   └── versions/
│   │       └── *.py
│   │
│   ├── tests/
│   │   ├── api/
│   │   ├── llm/
│   │   └── vectorstore/
│   ├── requirements.txt
│   └── README.md
│
├── infra/                            # dev/prod infra
│   ├── docker-compose.yml            # Postgres + backend (+ optional pgadmin/electron dev)
│   ├── postgres/
│   │   ├── Dockerfile                # Postgres image with pgvector
│   │   └── init/                     # init/seed scripts run on first create
│   │       ├── 01_init_extensions.sql   # CREATE EXTENSION IF NOT EXISTS "vector";
│   │       ├── 02_schema_minimal.sql    # optional: minimal schema if skipping alembic
│   │       └── 03_seed_mock.sql         # mock data (users, meetings, docs...)
│   ├── env/
│   │   ├── .env.backend.example
│   │   ├── .env.electron.example
│   │   └── .env.db.example
│   └── README.md
│
├── scripts/                          # dev/ops helpers
│   ├── dev_start.sh                  # run backend + DB + electron dev
│   ├── migrate.sh                    # alembic upgrade head
│   └── seed_data.py                  # extra seeding beyond SQL init
│
├── docs/                             # architecture, flows, contracts
│   ├── architecture.md               # Electron <-> FastAPI <-> DB
│   ├── rag_design.md                 # RAG + pgvector design
│   ├── in_meeting_flow.md            # in-meeting agent flow (graph/state)
│   └── api_contracts.md              # API contracts (HTTP + WS)
│
└── README.md    # This file (project overview and setup)
```

##  Quickstart (dev)
### 1) Database (Postgres + pgvector)
```powershell
cd infra
docker compose up -d          # starts Postgres, auto-runs init/seed SQL
```
- Init scripts run automatically: `infra/postgres/init/01_init_extensions.sql`, `02_schema_minimal.sql`, `03_seed_mock.sql`.

### 2) Backend (FastAPI)
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r ..\requirements.txt
copy ..\infra\env\.env.development.example .env
$env:PYTHONPATH="."
python -m app.db.init_db                  # optional quick schema (if you skip alembic initially)
uvicorn app.main:app --reload --port 8000
```

### 3) Electron desktop (dev vs packaged)
```powershell
cd electron
npm install
# dev: Vite + Electron, renderer served on localhost, but runs inside Electron shell
npm run dev
```
- Production-style run without localhost:
  ```powershell
  cd electron
  npm run build         # builds renderer to dist/renderer
  npx electron .        # loads built renderer via file:// (no Vite dev server)
  ```
- To ship installers later, add a packager (e.g., electron-builder) and point BrowserWindow to the built renderer (`dist/renderer/index.html` is already handled in main.ts).

### 4) Extra seed (optional)
```powershell
cd scripts
python seed_data.py
```
Or add SQL to `infra/postgres/init/03_seed_mock.sql` before first container startup.

##  Database schema & data changes (for data engineers)
1) Pull repo and start DB:
   ```powershell
   cd infra
   docker compose up -d
   ```
2) Set up backend venv:
   ```powershell
   cd backend
   python -m venv .venv
   .\.venv\Scripts\activate
   pip install -r ..\requirements.txt
   copy ..\infra\env\.env.development.example .env
   $env:PYTHONPATH="."
   ```
3) Modify schema:
   - Edit SQLAlchemy models in `backend/app/models/*.py`.
   - Generate migration:
     ```powershell
     alembic revision -m "describe change" --autogenerate
     ```
     Migration files land in `backend/alembic/versions/`.
   - Apply migration:
     ```powershell
     alembic upgrade head
     ```
     (Or run `../scripts/migrate.sh` from backend.)
4) Seed/change data:
   - SQL path: edit `infra/postgres/init/03_seed_mock.sql` (only for brand-new containers).
   - Python path: add logic to `scripts/seed_data.py` and run it with env set (`PYTHONPATH=.` from backend root).
   - For bulk ingestion to vectorstore, extend `backend/app/vectorstore/ingestion/pipelines.py`.
5) Run backend for verification:
   ```powershell
   uvicorn app.main:app --reload --port 8000
   ```

##  Dev tips
- Backend base URL: `http://localhost:8000` (CORS open for dev).
- WebSocket stub: `/api/v1/ws/in-meeting` for live transcript/action events.
- Stage graphs: `app/llm/graphs/` (pre/in/post) with agent wrappers in `app/llm/agents/`.
- RAG stub: `app/llm/chains/rag_chain.py` plus `app/vectorstore/pgvector_client.py`.

##  Near-term roadmap
- Finish Electron UI per feature map above.
- Swap in real ASR/diarization for In-meeting graph.
- Add migrations for actions/decisions/risks and task sync tables.
- Wire Microsoft Graph/LOffice adapters via tools layer.
