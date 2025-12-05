# AI / LLM Layer (LangGraph Skeleton)

This folder hosts the AI layer for MeetMate (LangGraph + LangChain stubs). It is currently a lightweight skeleton so we can wire FastAPI/WebSocket end‑to‑end, then progressively replace stubs with real chains/tools.

## Layout
- `graphs/state.py`: shared `MeetingState` TypedDict (actions/decisions/risks, transcript window, RAG docs, debug info) and a safe `StateGraph` stub when `langgraph` is missing.
- `graphs/router.py`: one router graph for all stages (`pre` / `in` / `post`) with conditional edges.
- `graphs/pre_meeting_graph.py`, `graphs/in_meeting_graph.py`, `graphs/post_meeting_graph.py`: subgraph stubs per stage.
- `agents/*.py`: thin wrappers over the router graph, auto-injecting the stage.
- `clients/`, `prompts/`, `chains/`, `tools/`: placeholders for model wrappers, prompt templates, LangChain chains, and callable tools.

## MeetingState (shared contract)
Defined in `graphs/state.py`:
```python
class MeetingState(TypedDict, total=False):
    meeting_id: str
    stage: Literal["pre", "in", "post"]
    sensitivity: Literal["low", "medium", "high"]
    sla: Literal["realtime", "near_realtime", "batch"]
    transcript_window: str
    full_transcript: str
    last_user_question: Optional[str]
    actions: List[ActionItem]
    decisions: List[Decision]
    risks: List[Risk]
    rag_docs: list
    citations: list
    debug_info: dict
```
All graph nodes receive and return `MeetingState`. Use `debug_info` to log intermediate outputs for tracing.

## Router skeleton
`build_router_graph()` builds one LangGraph with:
- `router` node → reads `state.stage` (defaults to `"in"`) and routes.
- Subgraphs: `pre_meeting`, `in_meeting`, `post_meeting` (each is a `StateGraph`).
- Conditional edges choose the subgraph, then exit (`END`).

### Subgraph stubs (replace with real chains)
- Pre: prepares context, emits an example agenda suggestion in `debug_info["agenda_suggestion"]`.
- In: ingests transcript window, writes recap to `debug_info["recap"]`, appends stub actions/decisions/risks, answers `last_user_question` into `debug_info["qa_answer"]` when present.
- Post: marks consolidation and adds a stub summary in `debug_info["post_summary"]`.

## FastAPI / WS wiring (current)
- REST: `POST /api/v1/agents/{stage}` → runs router with optional payload (any `MeetingState` fields) and returns the resulting state.
- REST (in-meeting stubs): `/api/v1/in-meeting/recap|actions` call the same graph for quick demos.
- WS: `/api/v1/ws/in-meeting/{session_id}` → accepts JSON `{chunk, question?, meeting_id?, full_transcript?}` and returns the updated state payload.

## How to extend
1) Replace stub nodes with real LangChain chains:
   - Add prompts to `prompts/`, chains to `chains/`, tools to `tools/`.
   - In nodes, call the chain/tool and write structured outputs back into `MeetingState`.
2) Keep state merging simple:
   - Append to `actions/decisions/risks` lists.
   - Use `debug_info` for traces and observability.
3) Add new nodes/edges:
   - Example: in-meeting `live_recap` → `adr_extractor` → conditional `qa_agent`.
   - Use `add_conditional_edges` for branching on SLA/stage/question.
4) Persist outputs via services:
   - After graph execution (in endpoints/workers), call `services/*` to store actions/decisions/risks/transcripts into Postgres.

## Local usage example
```python
from app.llm.graphs.router import build_router_graph

graph = build_router_graph()
state = graph.invoke({
    "meeting_id": "demo-001",
    "stage": "in",
    "transcript_window": "Team discussed CR-2024-015 and API throttling...",
    "last_user_question": "Deadline cho API A là khi nào?"
})
print(state["debug_info"]["recap"])
print(state["actions"])
```

## Notes
- If `langgraph` is not installed, the stub `StateGraph` keeps the app runnable (no-op graph execution).
- Router/subgraphs are intentionally minimal to unblock frontend/WS integration; replace with full logic as chains/tools mature.
