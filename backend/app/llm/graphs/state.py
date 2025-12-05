from typing import List, Optional, Literal, TypedDict, Dict, Any


try:
    from langgraph.graph import StateGraph, END  # type: ignore
except ImportError:
    # Lightweight stub so the codebase still works without langgraph installed.
    class StateGraph:  # type: ignore
        def __init__(self, *_args, **_kwargs):
            self.nodes = {}
            self.edges = []
            self.conditional_edges = []
            self.entry_point = None

        def add_node(self, name, fn):
            self.nodes[name] = fn

        def set_entry_point(self, name):
            self.entry_point = name

        def add_edge(self, start, end):
            self.edges.append((start, end))

        def add_conditional_edges(self, start, decider, mapping):
            self.conditional_edges.append((start, decider, mapping))

        def _invoke_node(self, name, state):
            node = self.nodes.get(name)
            if callable(node):
                return node(state)
            if hasattr(node, "invoke"):
                return node.invoke(state)
            return state

        def invoke(self, state):
            current = self.entry_point or (next(iter(self.nodes)) if self.nodes else None)
            if current:
                state = self._invoke_node(current, state)

            while True:
                advanced = False
                for src, dest in list(self.edges):
                    if src == current:
                        if dest == END:
                            return state
                        state = self._invoke_node(dest, state)
                        current = dest
                        advanced = True
                        break

                if advanced:
                    continue

                for src, decider, mapping in list(self.conditional_edges):
                    if src == current:
                        key = decider(state)
                        dest = mapping.get(key)
                        if dest:
                            state = self._invoke_node(dest, state)
                            current = dest
                            advanced = True
                            break

                if not advanced:
                    return state

        async def ainvoke(self, state):
            return self.invoke(state)

        def __call__(self, state):
            return self.invoke(state)

        def compile(self):
            return self

    END = "END"


class ActionItem(TypedDict, total=False):
    task: str
    owner: Optional[str]
    due_date: Optional[str]
    priority: Optional[str]
    source_timecode: Optional[float]


class Decision(TypedDict, total=False):
    title: str
    rationale: Optional[str]
    impact: Optional[str]
    source_timecode: Optional[float]


class Risk(TypedDict, total=False):
    desc: str
    severity: Optional[str]
    mitigation: Optional[str]
    owner: Optional[str]
    source_timecode: Optional[float]


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

    debug_info: Dict[str, Any]
