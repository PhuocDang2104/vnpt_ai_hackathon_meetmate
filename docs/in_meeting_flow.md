# In-Meeting Flow (stub)

1. Bot/Desktop streams audio ? ASR (SmartVoice placeholder) ? transcript chunks with speaker tags.
2. Realtime graph (LangGraph) aggregates rolling window; emits recap + Action/Decision/Risk events.
3. Tool-calls (Planner/Jira/calendar/doc fetch) are gated by confirmation layer in UI.
4. WebSocket channel `in_meeting_ws` publishes transcript_event/action_event to renderer.