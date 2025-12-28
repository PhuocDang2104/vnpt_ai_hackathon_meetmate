from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.marketing import MarketingLead
from app.schemas.marketing import MarketingLeadCreate, MarketingLead as MarketingLeadSchema
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from app.utils.email import send_welcome_email
from pathlib import Path

router = APIRouter()

@router.post("/join", response_model=MarketingLeadSchema)
def join_mailing_list(
    lead: MarketingLeadCreate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Join the mailing list.
    """
    # Check if email already exists
    existing_lead = db.query(MarketingLead).filter(MarketingLead.email == lead.email).first()
    if existing_lead:
        # Still send email if they re-register? No, typically not.
        raise HTTPException(status_code=400, detail="Email already registered")

    db_lead = MarketingLead(email=lead.email)
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)
    
    # Send welcome email asynchronously
    background_tasks.add_task(send_welcome_email, lead.email)
    
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
