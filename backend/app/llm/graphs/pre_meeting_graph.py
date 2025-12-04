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


def build_pre_meeting_graph():
    graph = StateGraph(dict)

    def agenda_node(state: dict):
        state['agenda'] = ['Review BRD', 'Risks', 'Timeline']
        return state

    graph.add_node('agenda', agenda_node)
    graph.add_edge('agenda', END)
    return graph.compile()