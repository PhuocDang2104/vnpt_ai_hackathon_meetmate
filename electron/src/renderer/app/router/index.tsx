import { createHashRouter } from 'react-router-dom'
import AppShell from '../layout/AppShell'
import Dashboard from '../routes/Dashboard'
import Calendar from '../routes/Calendar'
import Meetings from '../routes/Meetings'
import MeetingPre from '../routes/Meetings/MeetingPre'
import MeetingIn from '../routes/Meetings/MeetingIn'
import MeetingPost from '../routes/Meetings/MeetingPost'
import LiveMeeting from '../routes/LiveMeeting'
import KnowledgeHub from '../routes/KnowledgeHub'
import Tasks from '../routes/Tasks'
import Settings from '../routes/Settings'
import MeetingLayout from '../layout/MeetingLayout'
import { MeetingDetail } from '../../features/meetings/components/MeetingDetail'
import { Login, Register } from '../routes/Auth'

const router = createHashRouter([
  // Auth routes (no shell)
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  
  // App routes (with shell)
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'calendar', element: <Calendar /> },
      {
        path: 'meetings',
        element: <Meetings />, // list page
      },
      {
        path: 'meetings/:meetingId/detail',
        element: <MeetingDetail />, // new detail page with tabs
      },
      {
        path: 'meetings/:meetingId',
        element: <MeetingLayout />, // legacy detail shell
        children: [
          { path: 'pre', element: <MeetingPre /> },
          { path: 'in', element: <MeetingIn /> },
          { path: 'post', element: <MeetingPost /> },
        ],
      },
      { path: 'live', element: <LiveMeeting /> },
      { path: 'live/:meetingId', element: <LiveMeeting /> },
      { path: 'knowledge', element: <KnowledgeHub /> },
      { path: 'tasks', element: <Tasks /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
])

export default router
