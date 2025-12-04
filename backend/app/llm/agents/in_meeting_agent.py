from app.llm.agents.base_agent import BaseAgent
from app.llm.graphs.in_meeting_graph import build_in_meeting_graph


class InMeetingAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__(build_in_meeting_graph())