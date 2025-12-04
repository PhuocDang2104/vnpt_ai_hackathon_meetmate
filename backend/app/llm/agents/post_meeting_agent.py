from app.llm.agents.base_agent import BaseAgent
from app.llm.graphs.post_meeting_graph import build_post_meeting_graph


class PostMeetingAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__(build_post_meeting_graph())