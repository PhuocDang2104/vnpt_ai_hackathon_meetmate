from app.llm.agents.base_agent import BaseAgent
from app.llm.graphs.router import build_router_graph


class InMeetingAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__(build_router_graph(default_stage="in"), stage="in")
