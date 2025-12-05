from app.llm.graphs.state import (
    MeetingState,
    StateGraph,
    END,
    ActionItem,
    Decision,
    Risk,
)


def build_in_meeting_subgraph():
    graph = StateGraph(MeetingState)

    def ingest_node(state: MeetingState) -> MeetingState:
        state.setdefault("stage", "in")
        state.setdefault("transcript_window", "")
        state.setdefault("actions", [])
        state.setdefault("decisions", [])
        state.setdefault("risks", [])
        return state

    def recap_node(state: MeetingState) -> MeetingState:
        window = state.get("transcript_window") or ""
        recap = window[:120] + ("..." if len(window) > 120 else "")
        state.setdefault("debug_info", {})
        state["debug_info"]["recap"] = recap or "No transcript received"
        return state

    def adr_node(state: MeetingState) -> MeetingState:
        actions = state.setdefault("actions", [])
        decisions = state.setdefault("decisions", [])
        risks = state.setdefault("risks", [])

        actions.append(ActionItem(task="Close CR-2024-015", owner="Tech Lead", due_date=None, priority="high"))
        decisions.append(Decision(title="Proceed with API throttling", rationale="Protect core banking latency"))
        risks.append(Risk(desc="Performance hit on LOS integration", severity="medium", mitigation="Add load test suite"))
        return state

    def qa_node(state: MeetingState) -> MeetingState:
        question = state.get("last_user_question")
        if not question:
            return state
        state.setdefault("debug_info", {})
        state["debug_info"]["qa_answer"] = f"(stub) Answer for: {question}"
        return state

    graph.add_node("ingest", ingest_node)
    graph.add_node("recap", recap_node)
    graph.add_node("qa", qa_node)
    graph.add_node("adr", adr_node)

    graph.set_entry_point("ingest")
    graph.add_edge("ingest", "recap")

    def route_after_recap(state: MeetingState):
        return "qa" if state.get("last_user_question") else "adr"

    graph.add_conditional_edges(
        "recap",
        route_after_recap,
        {
            "qa": "qa",
            "adr": "adr",
        },
    )

    graph.add_edge("qa", "adr")
    graph.add_edge("adr", END)
    return graph.compile()


# Backward-compatible alias
build_in_meeting_graph = build_in_meeting_subgraph
