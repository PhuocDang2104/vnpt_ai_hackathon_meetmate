import { Outlet, useParams } from 'react-router-dom'

const MeetingLayout = () => {
  const { meetingId } = useParams()
  return (
    <div className="meeting-layout">
      <div className="meeting-layout__header">
        <h2>Meeting #{meetingId}</h2>
        <p>Switch between Pre / In / Post meeting flows.</p>
      </div>
      <div className="meeting-layout__content">
        <Outlet />
      </div>
    </div>
  )
}

export default MeetingLayout