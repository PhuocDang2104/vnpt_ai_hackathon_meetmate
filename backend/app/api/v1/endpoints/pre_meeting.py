from fastapi import APIRouter

router = APIRouter()


@router.get('/prep', response_model=dict)
def prep_agenda():
    return {"agenda": ["Review BRD", "Risks", "Next steps"]}