import { 
  ArrowLeft, 
  Brain, 
  Users, 
  FileText, 
  Mic, 
  CheckCircle,
  Zap,
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
  Info,
  Map,
  BadgeDollarSign,
  Mail,
  LogIn,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import FloatingNavbar from '../../components/ui/floating-navbar'
import ContactEmailForm from '../../components/ui/contact-email-form'

const About = () => {
  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId)
    if (!section) return
    section.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="about-page public-page">
      <FloatingNavbar
        navItems={[
          { name: 'About', to: '/about', icon: <Info size={18} /> },
          { name: 'Lộ trình', to: '/roadmap', icon: <Map size={18} /> },
          { name: 'Pricing', to: '/pricing', icon: <BadgeDollarSign size={18} /> },
          { name: 'Contact', onClick: () => scrollToSection('contact'), icon: <Mail size={18} /> },
        ]}
        action={{ label: 'Đăng nhập', to: '/login', icon: <LogIn size={16} /> }}
      />
      <header className="landing-header">
        <div className="landing-header__brand">
          <div className="logo">
            <img src="/meetmate_icon.svg" alt="MeetMate" className="landing-logo__icon" />
            <span>MeetMate</span>
          </div>
          <nav className="landing-nav">
            <Link to="/about" className="landing-nav__link">About</Link>
            <Link to="/roadmap" className="landing-nav__link">Lộ trình</Link>
            <Link to="/pricing" className="landing-nav__link">Pricing</Link>
            <button type="button" className="landing-nav__link" onClick={() => scrollToSection('contact')}>
              Contact
            </button>
          </nav>
        </div>
        <div className="landing-actions">
          <Link to="/login" className="btn btn-ghost">Đăng nhập</Link>
          <Link to="/register" className="btn btn-primary">Đăng ký</Link>
        </div>
      </header>

      <div className="about-container">
        {/* Hero Section */}
        <section className="about-hero">
          <Link to="/" className="about-back">
            <ArrowLeft size={20} />
            Quay lại trang chủ
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
            <h3>Vấn đề hiện tại</h3>
            <ul>
              <li>Chuẩn bị họp mất nhiều thời gian</li>
              <li>Ghi chép thủ công, dễ bỏ sót thông tin</li>
              <li>Khó theo dõi action items sau cuộc họp</li>
              <li>Biên bản họp tốn thời gian soạn thảo</li>
              <li>Thiếu kết nối với knowledge base nội bộ</li>
            </ul>
          </div>
          
          <div className="about-card about-card--solution">
            <h3>✨Giải pháp MeetMate</h3>
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
            <h4>Đặng Như Phước</h4>
            <p>Leader</p>
          </div>
          
          <div className="about-team-member">
            <div className="about-team-avatar">
              <Users size={32} />
            </div>
            <h4>Thái Hoài An</h4>
            <p>Role / Position</p>
          </div>
          
          <div className="about-team-member">
            <div className="about-team-avatar">
              <Users size={32} />
            </div>
            <h4>Trương Minh Đạt</h4>
            <p>Role / Position</p>
          </div>
          
          <div className="about-team-member">
            <div className="about-team-avatar">
              <Users size={32} />
            </div>
            <h4>Hoàng Minh Quân</h4>
            <p>Role / Position</p>
          </div>
        </div>
      </section>

      </div>

      <section className="contact" id="contact">
        <div className="contact-card">
          <div className="contact-content">
            <h2>Liên hệ</h2>
            <p>Nhận demo, báo giá hoặc tư vấn triển khai cho doanh nghiệp.</p>
            <div className="contact-tags">
              <span className="contact-tag">Demo nhanh</span>
              <span className="contact-tag">Tư vấn triển khai</span>
              <span className="contact-tag">Bảo mật doanh nghiệp</span>
            </div>
            <ContactEmailForm />
          </div>
          <div className="contact-actions">
            <Link to="/register" className="btn btn-primary btn-lg">Nhận demo</Link>
            <Link to="/about" className="btn btn-outline btn-lg">Về chúng tôi</Link>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-brand">
          <img src="/meetmate_icon.svg" alt="MeetMate" className="landing-logo__icon landing-logo__icon--sm" />
          <span>MeetMate</span>
        </div>
        <a
          className="landing-footer__link"
          href="https://github.com/PhuocDang2104/vnpt_ai_hackathon_meetmate"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Github size={18} />
          GitHub
          <ExternalLink size={14} />
        </a>
        <p>© 2024 MeetMate - AI Meeting Assistant for Enterprise</p>
      </footer>
    </div>
  )
}

export default About
