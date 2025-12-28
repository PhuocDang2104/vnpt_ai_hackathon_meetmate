import { ArrowLeft, ExternalLink, Github, Info, Map, BadgeDollarSign, Mail, LogIn } from 'lucide-react'
import { Link } from 'react-router-dom'
import FloatingNavbar from '../../components/ui/floating-navbar'
import ContactEmailForm from '../../components/ui/contact-email-form'

const Roadmap = () => {
  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId)
    if (!section) return
    section.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="roadmap-page public-page">
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

      <header className="roadmap-hero">
        <Link to="/" className="roadmap-back">
          <ArrowLeft size={18} />
          Quay lại trang chủ
        </Link>
        <div className="roadmap-hero__badge">MeetMate Roadmap</div>
        <h1 className="roadmap-hero__title">Lộ trình phát triển</h1>
        <p className="roadmap-hero__subtitle">
          Tập trung vào trải nghiệm họp end-to-end, bảo mật doanh nghiệp và mở rộng tích hợp.
        </p>
        <div className="roadmap-hero__actions">
          <Link to="/register" className="btn btn-primary">
            Nhận demo
          </Link>
          <Link to="/about" className="btn btn-outline">
            Về chúng tôi
          </Link>
        </div>
      </header>

      <section className="roadmap">
        <div className="roadmap__header">
          <h2>Các giai đoạn chính</h2>
          <p>Lộ trình chia theo 3 chặng, ưu tiên giá trị rõ ràng cho doanh nghiệp.</p>
        </div>
        <div className="roadmap-grid">
          <div className="roadmap-card">
            <div className="roadmap-card__phase">Hiện tại</div>
            <h3>Nền tảng Pre – In – Post</h3>
            <p>Chuẩn hóa luồng họp, từ chuẩn bị đến biên bản và follow-up.</p>
            <ul className="roadmap-list">
              <li>Agenda + pre-read pack thông minh</li>
              <li>Live notes & action tracking</li>
              <li>Biên bản chuẩn hóa theo template</li>
            </ul>
          </div>
          <div className="roadmap-card">
            <div className="roadmap-card__phase">Tiếp theo</div>
            <h3>Tự động hóa workflow</h3>
            <p>Kết nối sâu Teams/Outlook, Jira/Planner và hệ thống nội bộ.</p>
            <ul className="roadmap-list">
              <li>Đề xuất workflow theo loại cuộc họp</li>
              <li>Đồng bộ task & reminder tự động</li>
              <li>Dashboard tiến độ theo phòng ban</li>
            </ul>
          </div>
          <div className="roadmap-card">
            <div className="roadmap-card__phase">Tầm nhìn</div>
            <h3>Meeting Intelligence Suite</h3>
            <p>Đo lường hiệu quả họp và dự báo rủi ro dựa trên dữ liệu.</p>
            <ul className="roadmap-list">
              <li>Analytics KPI theo chuỗi cuộc họp</li>
              <li>Agent gợi ý quyết định tiếp theo</li>
              <li>API mở cho hệ sinh thái doanh nghiệp</li>
            </ul>
          </div>
        </div>
      </section>

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

export default Roadmap
