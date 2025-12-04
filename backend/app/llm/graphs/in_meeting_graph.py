try:
    from langgraph.graph import StateGraph, END
except ImportError:  # Fallback stub
    class StateGraph:  # type: ignore
        def __init__(self, *_args, **_kwargs):
            self.nodes = []
            self.edges = []

        def add_node(self, name, fn):
            self.nodes.append((name, fn))

        def add_edge(self, *_args, **_kwargs):
            self.edges.append((_args, _kwargs))

        def compile(self):
            return self

        def invoke(self, state):
            return state

    END = 'END'


def build_in_meeting_graph():
    graph = StateGraph(dict)

    def recap_node(state: dict):
        state['recap'] = 'live recap stub'
        return state

    def action_node(state: dict):
        state.setdefault('actions', []).append('Action: close CR-2024-015')
        return state

    graph.add_node('recap', recap_node)
    graph.add_node('action', action_node)
    graph.add_edge('recap', 'action')
    graph.add_edge('action', END)
    return graph.compile()