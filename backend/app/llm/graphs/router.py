from typing import Literal
from app.llm.graphs.in_meeting_graph import build_in_meeting_graph
from app.llm.graphs.pre_meeting_graph import build_pre_meeting_graph
from app.llm.graphs.post_meeting_graph import build_post_meeting_graph


GraphStage = Literal['pre', 'in', 'post']


def build_router(stage: GraphStage):
    if stage == 'pre':
        return build_pre_meeting_graph()
    if stage == 'in':
        return build_in_meeting_graph()
    return build_post_meeting_graph()