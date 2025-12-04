from typing import Any


class BaseAgent:
    def __init__(self, graph: Any) -> None:
        self.graph = graph

    def run(self, state: dict) -> dict:
        if hasattr(self.graph, 'invoke'):
            return self.graph.invoke(state)
        return state