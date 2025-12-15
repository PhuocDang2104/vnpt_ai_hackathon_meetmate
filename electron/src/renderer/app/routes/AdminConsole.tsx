import { ShieldCheck, Users, FileText, Settings, Activity, FolderOpen, Bot, Database, AlertTriangle } from 'lucide-react'
import { getStoredUser } from '../../lib/api/auth'
import { useLanguage } from '../../contexts/LanguageContext'

const SectionCard = ({ icon, title, description, items }: { icon: React.ReactNode, title: string, description: string, items: string[] }) => (
  <div className="admin-card">
    <div className="admin-card__header">
      <div className="admin-card__icon">{icon}</div>
      <div>
        <div className="admin-card__title">{title}</div>
        <div className="admin-card__desc">{description}</div>
      </div>
    </div>
    <ul className="admin-card__list">
      {items.map((item, idx) => (
        <li key={idx} className="admin-card__list-item">• {item}</li>
      ))}
    </ul>
  </div>
)

const AdminConsole = () => {
  const { t } = useLanguage()
  const user = getStoredUser()
  const isAdmin = (user?.role || '').toLowerCase() === 'admin'

  if (!isAdmin) {
    return (
      <div className="admin-console">
        <div className="admin-console__header">
          <ShieldCheck size={28} />
          <div>
            <h1>{t('admin.title')}</h1>
            <p>{t('admin.noAccess')}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-console">
      <div className="admin-console__header">
        <ShieldCheck size={28} />
        <div>
          <h1>{t('admin.title')}</h1>
          <p>{t('admin.subtitle')}</p>
        </div>
      </div>

      <div className="admin-console__grid">
        <SectionCard
          icon={<Users size={20} />}
          title={t('admin.users.title')}
          description={t('admin.users.desc')}
          items={[
            t('admin.users.items.create'),
            t('admin.users.items.role'),
            t('admin.users.items.status'),
            t('admin.users.items.audit'),
          ]}
        />

        <SectionCard
          icon={<FileText size={20} />}
          title={t('admin.docs.title')}
          description={t('admin.docs.desc')}
          items={[
            t('admin.docs.items.upload'),
            t('admin.docs.items.labels'),
            t('admin.docs.items.visibility'),
            t('admin.docs.items.meetingScope'),
          ]}
        />

        <SectionCard
          icon={<FolderOpen size={20} />}
          title={t('admin.meetings.title')}
          description={t('admin.meetings.desc')}
          items={[
            t('admin.meetings.items.lifecycle'),
            t('admin.meetings.items.participants'),
            t('admin.meetings.items.docs'),
            t('admin.meetings.items.audit'),
          ]}
        />

        <SectionCard
          icon={<Bot size={20} />}
          title={t('admin.ai.title')}
          description={t('admin.ai.desc')}
          items={[
            t('admin.ai.items.model'),
            t('admin.ai.items.rag'),
            t('admin.ai.items.traces'),
            t('admin.ai.items.guardrail'),
          ]}
        />

        <SectionCard
          icon={<Settings size={20} />}
          title={t('admin.system.title')}
          description={t('admin.system.desc')}
          items={[
            t('admin.system.items.cors'),
            t('admin.system.items.email'),
            t('admin.system.items.secrets'),
            t('admin.system.items.maintenance'),
          ]}
        />

        <SectionCard
          icon={<Activity size={20} />}
          title={t('admin.observability.title')}
          description={t('admin.observability.desc')}
          items={[
            t('admin.observability.items.metrics'),
            t('admin.observability.items.logs'),
            t('admin.observability.items.indexing'),
            t('admin.observability.items.security'),
          ]}
        />

        <SectionCard
          icon={<Database size={20} />}
          title={t('admin.data.title')}
          description={t('admin.data.desc')}
          items={[
            t('admin.data.items.schema'),
            t('admin.data.items.migration'),
            t('admin.data.items.backup'),
            t('admin.data.items.tenancy'),
          ]}
        />

        <SectionCard
          icon={<AlertTriangle size={20} />}
          title={t('admin.risk.title')}
          description={t('admin.risk.desc')}
          items={[
            t('admin.risk.items.auth'),
            t('admin.risk.items.token'),
            t('admin.risk.items.upload'),
            t('admin.risk.items.rag'),
          ]}
        />
      </div>
    </div>
  )
}

export default AdminConsole

