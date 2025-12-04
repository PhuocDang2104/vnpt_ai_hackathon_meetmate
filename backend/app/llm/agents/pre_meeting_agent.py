from app.llm.agents.base_agent import BaseAgent
from app.llm.graphs.pre_meeting_graph import build_pre_meeting_graph


class PreMeetingAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__(build_pre_meeting_graph())