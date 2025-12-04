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


def build_post_meeting_graph():
    graph = StateGraph(dict)

    def summary_node(state: dict):
        state['summary'] = 'Post-meeting summary stub'
        return state

    graph.add_node('summary', summary_node)
    graph.add_edge('summary', END)
    return graph.compile()