/**
 * Landing Page - Welcome to MeetMate
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  MessageSquare, 
  FileText, 
  CheckSquare,
  Zap,
  Shield,
  Users,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export const Landing: React.FC = () => {
  return (
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <div className="logo">
          <Sparkles size={28} />
          <span>MeetMate</span>
        </div>
        <nav className="landing-nav">
          <Link to="/login" className="btn btn-ghost">Đăng nhập</Link>
          <Link to="/register" className="btn btn-primary">Đăng ký</Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>
            Cuộc họp hiệu quả hơn với
            <span className="gradient-text"> AI Assistant</span>
          </h1>
          <p className="hero-subtitle">
            MeetMate giúp bạn chuẩn bị, ghi chép và theo dõi cuộc họp tự động. 
            Tiết kiệm thời gian, không bỏ lỡ action items quan trọng.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary btn-lg">
              Bắt đầu miễn phí
              <ArrowRight size={20} />
            </Link>
            <Link to="/login" className="btn btn-outline btn-lg">
              Đăng nhập
            </Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-card">
            <div className="card-header">
              <span className="dot red"></span>
              <span className="dot yellow"></span>
              <span className="dot green"></span>
            </div>
            <div className="card-content">
              <div className="mock-meeting">
                <div className="meeting-title">Steering Committee Q4</div>
                <div className="meeting-meta">14:00 - 15:30 • 8 người tham gia</div>
                <div className="ai-badge">
                  <Sparkles size={14} />
                  AI đang ghi chép...
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2>Tính năng nổi bật</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <Calendar />
            </div>
            <h3>Pre-meeting</h3>
            <p>AI tự động tạo agenda, gợi ý tài liệu pre-read và người cần mời</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <MessageSquare />
            </div>
            <h3>In-meeting</h3>
            <p>Ghi chép real-time, phát hiện action items, decisions và risks</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <FileText />
            </div>
            <h3>Post-meeting</h3>
            <p>Tự động tạo biên bản, sync tasks với Jira/Planner, gửi MoM</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <CheckSquare />
            </div>
            <h3>RAG Q&A</h3>
            <p>Hỏi đáp documents, policies với AI - citations chính xác</p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits">
        <div className="benefit">
          <Zap className="benefit-icon" />
          <div>
            <h4>Tiết kiệm 70% thời gian</h4>
            <p>Không cần ghi chép thủ công, AI làm hết</p>
          </div>
        </div>
        <div className="benefit">
          <Shield className="benefit-icon" />
          <div>
            <h4>Không bỏ sót action items</h4>
            <p>AI phát hiện và nhắc nhở deadline</p>
          </div>
        </div>
        <div className="benefit">
          <Users className="benefit-icon" />
          <div>
            <h4>Dành cho Enterprise</h4>
            <p>Tích hợp Microsoft 365, Jira, SharePoint</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <h2>Sẵn sàng nâng cấp cuộc họp?</h2>
        <p>Đăng ký ngay để trải nghiệm MeetMate miễn phí</p>
        <Link to="/register" className="btn btn-primary btn-lg">
          Tạo tài khoản
          <ArrowRight size={20} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-brand">
          <Sparkles size={20} />
          <span>MeetMate</span>
        </div>
        <p>© 2024 MeetMate - AI Meeting Assistant for Enterprise</p>
      </footer>

      <style>{`
        .landing-page {
          min-height: 100vh;
          background: var(--bg-base);
          color: var(--text-primary);
        }

        /* Header */
        .landing-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-md) var(--space-xl);
          max-width: 1200px;
          margin: 0 auto;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          font-family: var(--font-heading);
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--accent);
        }

        .landing-nav {
          display: flex;
          gap: var(--space-sm);
        }

        /* Hero */
        .hero {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-2xl);
          align-items: center;
          max-width: 1200px;
          margin: 0 auto;
          padding: var(--space-2xl) var(--space-xl);
        }

        .hero h1 {
          font-family: var(--font-heading);
          font-size: 3rem;
          font-weight: 700;
          line-height: 1.2;
          margin: 0 0 var(--space-md);
        }

        .gradient-text {
          background: linear-gradient(135deg, var(--accent), #f59e0b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: var(--space-lg);
        }

        .hero-actions {
          display: flex;
          gap: var(--space-md);
        }

        .hero-visual {
          display: flex;
          justify-content: center;
        }

        .hero-card {
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          overflow: hidden;
          width: 100%;
          max-width: 400px;
        }

        .card-header {
          display: flex;
          gap: 6px;
          padding: var(--space-sm);
          background: var(--bg-surface);
          border-bottom: 1px solid var(--border);
        }

        .dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
        .dot.red { background: #ef4444; }
        .dot.yellow { background: #f59e0b; }
        .dot.green { background: #22c55e; }

        .card-content {
          padding: var(--space-lg);
        }

        .mock-meeting {
          text-align: center;
        }

        .meeting-title {
          font-family: var(--font-heading);
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: var(--space-xs);
        }

        .meeting-meta {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-bottom: var(--space-md);
        }

        .ai-badge {
          display: inline-flex;
          align-items: center;
          gap: var(--space-xs);
          padding: var(--space-xs) var(--space-sm);
          background: rgba(234, 179, 8, 0.1);
          border: 1px solid rgba(234, 179, 8, 0.3);
          border-radius: var(--radius-sm);
          color: var(--accent);
          font-size: 0.875rem;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        /* Features */
        .features {
          max-width: 1200px;
          margin: 0 auto;
          padding: var(--space-2xl) var(--space-xl);
          text-align: center;
        }

        .features h2 {
          font-family: var(--font-heading);
          font-size: 2rem;
          margin-bottom: var(--space-xl);
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-lg);
        }

        .feature-card {
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: var(--space-lg);
          text-align: center;
          transition: transform 0.2s, border-color 0.2s;
        }

        .feature-card:hover {
          transform: translateY(-4px);
          border-color: var(--accent);
        }

        .feature-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          background: rgba(234, 179, 8, 0.1);
          border-radius: var(--radius-md);
          color: var(--accent);
          margin-bottom: var(--space-md);
        }

        .feature-card h3 {
          font-family: var(--font-heading);
          font-size: 1.125rem;
          margin-bottom: var(--space-sm);
        }

        .feature-card p {
          font-size: 0.875rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        /* Benefits */
        .benefits {
          display: flex;
          justify-content: center;
          gap: var(--space-2xl);
          max-width: 1200px;
          margin: 0 auto;
          padding: var(--space-xl);
          background: var(--bg-surface);
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }

        .benefit {
          display: flex;
          align-items: flex-start;
          gap: var(--space-md);
        }

        .benefit-icon {
          color: var(--accent);
          flex-shrink: 0;
        }

        .benefit h4 {
          font-family: var(--font-heading);
          font-size: 1rem;
          margin: 0 0 var(--space-xs);
        }

        .benefit p {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin: 0;
        }

        /* CTA */
        .cta {
          text-align: center;
          padding: var(--space-2xl);
          max-width: 600px;
          margin: 0 auto;
        }

        .cta h2 {
          font-family: var(--font-heading);
          font-size: 2rem;
          margin-bottom: var(--space-sm);
        }

        .cta p {
          color: var(--text-secondary);
          margin-bottom: var(--space-lg);
        }

        /* Footer */
        .landing-footer {
          text-align: center;
          padding: var(--space-xl);
          border-top: 1px solid var(--border);
        }

        .footer-brand {
          display: inline-flex;
          align-items: center;
          gap: var(--space-xs);
          font-family: var(--font-heading);
          font-weight: 600;
          color: var(--accent);
          margin-bottom: var(--space-sm);
        }

        .landing-footer p {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        /* Buttons */
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-xs);
          padding: var(--space-sm) var(--space-md);
          border-radius: var(--radius-sm);
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          text-decoration: none;
        }

        .btn-primary {
          background: var(--accent);
          color: #1a1a1a;
        }

        .btn-primary:hover {
          background: var(--accent-hover);
        }

        .btn-outline {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-primary);
        }

        .btn-outline:hover {
          border-color: var(--accent);
          color: var(--accent);
        }

        .btn-ghost {
          background: transparent;
          color: var(--text-primary);
        }

        .btn-ghost:hover {
          color: var(--accent);
        }

        .btn-lg {
          padding: var(--space-md) var(--space-lg);
          font-size: 1.125rem;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .hero {
            grid-template-columns: 1fr;
            text-align: center;
          }

          .hero-actions {
            justify-content: center;
          }

          .features-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .benefits {
            flex-direction: column;
            align-items: center;
          }
        }

        @media (max-width: 640px) {
          .hero h1 {
            font-size: 2rem;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }

          .hero-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default Landing;

