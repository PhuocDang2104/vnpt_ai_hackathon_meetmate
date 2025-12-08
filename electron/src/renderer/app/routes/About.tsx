import { 
  ArrowLeft, 
  Brain, 
  Users, 
  FileText, 
  Mic, 
  CheckCircle,
  Zap,
  Shield,
  Globe,
  Github,
  ExternalLink,
  Sparkles,
  Target,
  Lightbulb,
  Workflow,
  Clock,
  BarChart3,
  MessageSquare,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const About = () => {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <Link to="/app" className="about-back">
          <ArrowLeft size={20} />
          Quay lại Dashboard
        </Link>
        
        <div className="about-hero__content">
          <div className="about-hero__badge">
            <Sparkles size={16} />
            VNPT AI Hackathon 2025
          </div>
          <h1 className="about-hero__title">
            <span className="about-hero__logo">Meet</span>
            <span className="about-hero__logo about-hero__logo--accent">Mate</span>
          </h1>
          <p className="about-hero__tagline">
            AI-Powered Meeting Assistant for Enterprise PMO
          </p>
          <p className="about-hero__description">
            Giải pháp trợ lý cuộc họp thông minh, tự động hóa quy trình họp từ chuẩn bị, 
            ghi chép real-time đến tạo biên bản và theo dõi công việc.
          </p>
        </div>

        {/* Placeholder for hero image */}
        <div className="about-hero__image-placeholder">
          <div className="about-hero__image-text">
            <Zap size={48} />
            <span>Hero Image / Demo Screenshot</span>
            <small>Cập nhật sau</small>
          </div>
        </div>
      </section>

      {/* Problem & Solution */}
      <section className="about-section">
        <div className="about-section__header">
          <Target size={24} />
          <h2>Vấn đề & Giải pháp</h2>
        </div>
        
        <div className="about-grid about-grid--2">
          <div className="about-card about-card--problem">
            <h3>😫 Vấn đề hiện tại</h3>
            <ul>
              <li>Chuẩn bị họp mất nhiều thời gian</li>
              <li>Ghi chép thủ công, dễ bỏ sót thông tin</li>
              <li>Khó theo dõi action items sau cuộc họp</li>
              <li>Biên bản họp tốn thời gian soạn thảo</li>
              <li>Thiếu kết nối với knowledge base nội bộ</li>
            </ul>
          </div>
          
          <div className="about-card about-card--solution">
            <h3>✨ Giải pháp MeetMate</h3>
            <ul>
              <li>AI tự động đề xuất agenda & tài liệu</li>
              <li>Real-time transcription & ghi chép</li>
              <li>Tự động phát hiện Action Items, Decisions, Risks</li>
              <li>AI tạo biên bản họp trong 1 click</li>
              <li>RAG-powered Q&A với documents</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="about-section about-section--features">
        <div className="about-section__header">
          <Lightbulb size={24} />
          <h2>Tính năng chính</h2>
        </div>

        <div className="about-grid about-grid--3">
          <div className="about-feature">
            <div className="about-feature__icon about-feature__icon--pre">
              <FileText size={28} />
            </div>
            <h3>Trước họp (Pre-meeting)</h3>
            <ul>
              <li>AI đề xuất Agenda thông minh</li>
              <li>Gợi ý tài liệu pre-read</li>
              <li>Đề xuất người tham gia</li>
              <li>Chatbot hỗ trợ chuẩn bị</li>
            </ul>
          </div>

          <div className="about-feature">
            <div className="about-feature__icon about-feature__icon--in">
              <Mic size={28} />
            </div>
            <h3>Trong họp (In-meeting)</h3>
            <ul>
              <li>Real-time transcription (STT)</li>
              <li>Auto-detect Action Items</li>
              <li>Phát hiện Decisions & Risks</li>
              <li>RAG Q&A với policy/docs</li>
            </ul>
          </div>

          <div className="about-feature">
            <div className="about-feature__icon about-feature__icon--post">
              <CheckCircle size={28} />
            </div>
            <h3>Sau họp (Post-meeting)</h3>
            <ul>
              <li>AI tạo biên bản tự động</li>
              <li>Export PDF/Word</li>
              <li>Sync với Jira/Planner</li>
              <li>Follow-up tasks tracking</li>
            </ul>
          </div>
        </div>

        {/* Placeholder for features screenshot */}
        <div className="about-image-placeholder">
          <div className="about-image-placeholder__content">
            <Workflow size={48} />
            <span>Features Screenshot / Workflow Diagram</span>
            <small>Cập nhật sau</small>
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="about-section">
        <div className="about-section__header">
          <Workflow size={24} />
          <h2>Kiến trúc hệ thống</h2>
        </div>

        <div className="about-architecture">
          <div className="about-arch-layer">
            <h4>Frontend</h4>
            <div className="about-tech-tags">
              <span className="about-tech-tag">React 18</span>
              <span className="about-tech-tag">TypeScript</span>
              <span className="about-tech-tag">Vite</span>
              <span className="about-tech-tag">Electron</span>
            </div>
          </div>
          
          <div className="about-arch-layer">
            <h4>Backend API</h4>
            <div className="about-tech-tags">
              <span className="about-tech-tag">FastAPI</span>
              <span className="about-tech-tag">Python 3.11</span>
              <span className="about-tech-tag">WebSocket</span>
              <span className="about-tech-tag">PostgreSQL</span>
            </div>
          </div>
          
          <div className="about-arch-layer">
            <h4>AI/LLM Stack</h4>
            <div className="about-tech-tags">
              <span className="about-tech-tag about-tech-tag--ai">Gemini 2.5</span>
              <span className="about-tech-tag about-tech-tag--ai">LangChain</span>
              <span className="about-tech-tag about-tech-tag--ai">LangGraph</span>
              <span className="about-tech-tag about-tech-tag--ai">pgVector</span>
            </div>
          </div>
          
          <div className="about-arch-layer">
            <h4>Integration</h4>
            <div className="about-tech-tags">
              <span className="about-tech-tag">VNPT AI STT</span>
              <span className="about-tech-tag">MS Teams</span>
              <span className="about-tech-tag">Jira</span>
            </div>
          </div>
        </div>

        {/* Placeholder for architecture diagram */}
        <div className="about-image-placeholder">
          <div className="about-image-placeholder__content">
            <Globe size={48} />
            <span>Architecture Diagram</span>
            <small>Cập nhật sau</small>
          </div>
        </div>
      </section>

      {/* AI Capabilities */}
      <section className="about-section about-section--ai">
        <div className="about-section__header">
          <Brain size={24} />
          <h2>AI Capabilities</h2>
        </div>

        <div className="about-grid about-grid--4">
          <div className="about-ai-card">
            <MessageSquare size={24} />
            <h4>Conversational AI</h4>
            <p>Chatbot thông minh hỗ trợ Q&A trong suốt meeting lifecycle</p>
          </div>
          
          <div className="about-ai-card">
            <BarChart3 size={24} />
            <h4>Smart Extraction</h4>
            <p>Tự động trích xuất Action Items, Decisions, Risks từ transcript</p>
          </div>
          
          <div className="about-ai-card">
            <FileText size={24} />
            <h4>RAG-powered Q&A</h4>
            <p>Trả lời câu hỏi dựa trên knowledge base nội bộ với citations</p>
          </div>
          
          <div className="about-ai-card">
            <Clock size={24} />
            <h4>Real-time Processing</h4>
            <p>Xử lý transcript và phân tích trong thời gian thực</p>
          </div>
        </div>
      </section>

      {/* Demo Scenarios */}
      <section className="about-section">
        <div className="about-section__header">
          <Zap size={24} />
          <h2>Demo Scenarios</h2>
        </div>

        <div className="about-demo-list">
          <div className="about-demo-item">
            <span className="about-demo-number">1</span>
            <div>
              <h4>Chuẩn bị cuộc họp Steering Committee</h4>
              <p>AI đề xuất agenda, tài liệu pre-read, và danh sách người tham gia</p>
            </div>
          </div>
          
          <div className="about-demo-item">
            <span className="about-demo-number">2</span>
            <div>
              <h4>Live meeting với AI Assistant</h4>
              <p>Real-time transcription, auto-detect ADRs, Q&A với policy</p>
            </div>
          </div>
          
          <div className="about-demo-item">
            <span className="about-demo-number">3</span>
            <div>
              <h4>Tạo biên bản và follow-up</h4>
              <p>1-click generate minutes, export PDF, sync tasks với Jira</p>
            </div>
          </div>
        </div>

        {/* Placeholder for demo video */}
        <div className="about-image-placeholder about-image-placeholder--video">
          <div className="about-image-placeholder__content">
            <Zap size={48} />
            <span>Demo Video / GIF</span>
            <small>Cập nhật sau</small>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="about-section about-section--team">
        <div className="about-section__header">
          <Users size={24} />
          <h2>Đội ngũ phát triển</h2>
        </div>

        <div className="about-team-grid">
          <div className="about-team-member">
            <div className="about-team-avatar">
              <Users size={32} />
            </div>
            <h4>Team Member 1</h4>
            <p>Role / Position</p>
          </div>
          
          <div className="about-team-member">
            <div className="about-team-avatar">
              <Users size={32} />
            </div>
            <h4>Team Member 2</h4>
            <p>Role / Position</p>
          </div>
          
          <div className="about-team-member">
            <div className="about-team-avatar">
              <Users size={32} />
            </div>
            <h4>Team Member 3</h4>
            <p>Role / Position</p>
          </div>
          
          <div className="about-team-member">
            <div className="about-team-avatar">
              <Users size={32} />
            </div>
            <h4>Team Member 4</h4>
            <p>Role / Position</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="about-footer">
        <div className="about-footer__content">
          <div className="about-footer__brand">
            <h3>MeetMate</h3>
            <p>AI-Powered Meeting Assistant</p>
          </div>
          
          <div className="about-footer__links">
            <a href="https://github.com/PhuocDang2104/vnpt_ai_hackathon_meetmate" target="_blank" rel="noopener noreferrer">
              <Github size={20} />
              GitHub
              <ExternalLink size={14} />
            </a>
          </div>
          
          <div className="about-footer__badge">
            <Shield size={16} />
            VNPT AI Hackathon 2025
          </div>
        </div>
        
        <div className="about-footer__copyright">
          © 2025 MeetMate Team. Built with ❤️ for VNPT AI Hackathon.
        </div>
      </footer>
    </div>
  )
}

export default About

