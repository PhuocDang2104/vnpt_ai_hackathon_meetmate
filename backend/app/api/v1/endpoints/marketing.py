from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from app.api.v1.deps import get_db
from app.models.marketing import MarketingLead
from app.schemas.marketing import MarketingLeadCreate, MarketingLead
from pathlib import Path

router = APIRouter()

@router.post("/join", response_model=MarketingLead)
def join_mailing_list(lead: MarketingLeadCreate, db: Session = Depends(get_db)):
    """
    Join the mailing list.
    """
    # Check if email already exists
    existing_lead = db.query(MarketingLead).filter(MarketingLead.email == lead.email).first()
    if existing_lead:
        raise HTTPException(status_code=400, detail="Email already registered")

    db_lead = MarketingLead(email=lead.email)
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)
    return db_lead

@router.get("/landing", response_class=HTMLResponse)
def get_landing_page():
    """
    Serve the landing page HTML.
    """
    # Simply read the file and return (development mode style)
    # In production, templates should be loaded once or via Jinja2 if dynamic
    template_path = Path(__file__).parent.parent.parent.parent / "templates" / "landing.html"
    if not template_path.exists():
         return HTMLResponse(content="<h1>Landing page not found</h1>", status_code=404)
         
    return HTMLResponse(content=template_path.read_text(encoding='utf-8'))
