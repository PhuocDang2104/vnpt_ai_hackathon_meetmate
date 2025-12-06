"""
AI Chat HTTP Endpoints
Handles synchronous chat requests with Gemini AI
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime
from uuid import uuid4
from typing import Optional
import json

from app.db.session import get_db
from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    ChatSession,
    ChatSessionList,
    GenerateAgendaRequest,
    ExtractItemsRequest,
    GenerateSummaryRequest,
    AIGenerationResponse,
)
from app.llm.gemini_client import GeminiChat, MeetingAIAssistant, is_gemini_available

router = APIRouter()


# Store chat sessions in memory (for demo - use Redis in production)
chat_sessions: dict = {}


def get_or_create_session(session_id: Optional[str], meeting_id: Optional[str]) -> tuple:
    """Get existing session or create new one"""
    if session_id and session_id in chat_sessions:
        return session_id, chat_sessions[session_id]
    
    new_id = session_id or str(uuid4())
    chat_sessions[new_id] = {
        'id': new_id,
        'meeting_id': meeting_id,
        'chat': GeminiChat(),
        'messages': [],
        'created_at': datetime.utcnow(),
    }
    return new_id, chat_sessions[new_id]


@router.get('/status')
def get_ai_status():
    """Check if AI is available"""
    from app.core.config import get_settings
    settings = get_settings()
    
    return {
        'gemini_available': is_gemini_available(),
        'status': 'ready' if is_gemini_available() else 'mock_mode',
        'model': settings.gemini_model,
        'api_key_set': bool(settings.gemini_api_key and len(settings.gemini_api_key) > 10),
        'api_key_preview': settings.gemini_api_key[:8] + '...' if settings.gemini_api_key else None
    }


@router.get('/test')
async def test_gemini():
    """Test Gemini API directly"""
    from app.core.config import get_settings
    import google.generativeai as genai
    
    settings = get_settings()
    
    if not settings.gemini_api_key:
        return {'error': 'No API key configured', 'key': None}
    
    try:
        genai.configure(api_key=settings.gemini_api_key)
        model = genai.GenerativeModel(settings.gemini_model)
        response = model.generate_content(
            "Say hello in Vietnamese",
            generation_config=genai.types.GenerationConfig(max_output_tokens=50)
        )
        return {
            'success': True,
            'response': response.text,
            'model': settings.gemini_model
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'model': settings.gemini_model,
            'api_key_preview': settings.gemini_api_key[:8] + '...' if settings.gemini_api_key else None
        }


@router.post('/message', response_model=ChatResponse)
async def send_message(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    """Send a message to AI and get response"""
    
    session_id, session = get_or_create_session(request.session_id, request.meeting_id)
    
    # Get meeting context if requested
    context = None
    if request.include_context and request.meeting_id:
        try:
            query = text("""
                SELECT m.title, m.meeting_type, m.description, p.name as project_name
                FROM meeting m
                LEFT JOIN project p ON m.project_id = p.id
                WHERE m.id = :meeting_id
            """)
            result = db.execute(query, {'meeting_id': request.meeting_id})
            row = result.fetchone()
            if row:
                context = f"Cuộc họp: {row[0]}\nLoại: {row[1]}\nMô tả: {row[2]}\nDự án: {row[3]}"
        except Exception:
            pass
    
    # Get AI response
    chat: GeminiChat = session['chat']
    response_text = await chat.chat(request.message, context)
    
    # Save message to session
    session['messages'].append({
        'role': 'user',
        'content': request.message,
        'timestamp': datetime.utcnow()
    })
    session['messages'].append({
        'role': 'assistant',
        'content': response_text,
        'timestamp': datetime.utcnow()
    })
    
    # Save to database if meeting_id provided
    if request.meeting_id:
        try:
            save_query = text("""
                INSERT INTO chat_message (id, session_id, meeting_id, role, content, created_at)
                VALUES (:id, :session_id, :meeting_id, 'user', :user_content, :created_at)
            """)
            db.execute(save_query, {
                'id': str(uuid4()),
                'session_id': session_id,
                'meeting_id': request.meeting_id,
                'user_content': request.message,
                'created_at': datetime.utcnow()
            })
            
            db.execute(save_query.text.replace("'user'", "'assistant'"), {
                'id': str(uuid4()),
                'session_id': session_id,
                'meeting_id': request.meeting_id,
                'user_content': response_text,
                'created_at': datetime.utcnow()
            })
            db.commit()
        except Exception as e:
            print(f"Failed to save chat message: {e}")
    
    return ChatResponse(
        id=str(uuid4()),
        message=response_text,
        role='assistant',
        confidence=0.85 if is_gemini_available() else 0.7,
        created_at=datetime.utcnow()
    )


@router.get('/sessions', response_model=ChatSessionList)
def list_sessions(
    meeting_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List chat sessions"""
    sessions = []
    
    for sid, session in chat_sessions.items():
        if meeting_id and session.get('meeting_id') != meeting_id:
            continue
        
        sessions.append(ChatSession(
            id=sid,
            meeting_id=session.get('meeting_id'),
            messages=session.get('messages', []),
            created_at=session.get('created_at', datetime.utcnow()),
            updated_at=datetime.utcnow()
        ))
    
    return ChatSessionList(sessions=sessions, total=len(sessions))


@router.get('/sessions/{session_id}', response_model=ChatSession)
def get_session(session_id: str):
    """Get a specific chat session"""
    if session_id not in chat_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = chat_sessions[session_id]
    return ChatSession(
        id=session_id,
        meeting_id=session.get('meeting_id'),
        messages=session.get('messages', []),
        created_at=session.get('created_at', datetime.utcnow()),
        updated_at=datetime.utcnow()
    )


@router.delete('/sessions/{session_id}')
def delete_session(session_id: str):
    """Delete a chat session"""
    if session_id in chat_sessions:
        del chat_sessions[session_id]
    return {'status': 'deleted'}


# ============================================
# AI GENERATION ENDPOINTS
# ============================================

@router.post('/generate/agenda', response_model=AIGenerationResponse)
async def generate_agenda_ai(
    request: GenerateAgendaRequest,
    db: Session = Depends(get_db)
):
    """Generate meeting agenda using AI"""
    assistant = MeetingAIAssistant(request.meeting_id, {
        'type': request.meeting_type,
    })
    
    result = await assistant.generate_agenda(request.meeting_type)
    
    return AIGenerationResponse(
        id=str(uuid4()),
        result=result,
        confidence=0.85,
        created_at=datetime.utcnow()
    )


@router.post('/extract/items', response_model=AIGenerationResponse)
async def extract_items_ai(
    request: ExtractItemsRequest,
    db: Session = Depends(get_db)
):
    """Extract action items, decisions, or risks from transcript"""
    assistant = MeetingAIAssistant(request.meeting_id)
    
    if request.item_type == 'actions':
        result = await assistant.extract_action_items(request.transcript)
    elif request.item_type == 'decisions':
        result = await assistant.extract_decisions(request.transcript)
    elif request.item_type == 'risks':
        result = await assistant.extract_risks(request.transcript)
    else:
        raise HTTPException(status_code=400, detail="Invalid item_type")
    
    return AIGenerationResponse(
        id=str(uuid4()),
        result=result,
        confidence=0.80,
        created_at=datetime.utcnow()
    )


@router.post('/generate/summary', response_model=AIGenerationResponse)
async def generate_summary_ai(
    request: GenerateSummaryRequest,
    db: Session = Depends(get_db)
):
    """Generate meeting summary from transcript"""
    assistant = MeetingAIAssistant(request.meeting_id)
    
    result = await assistant.generate_summary(request.transcript)
    
    return AIGenerationResponse(
        id=str(uuid4()),
        result=result,
        confidence=0.85,
        created_at=datetime.utcnow()
    )
