import { useState, useEffect } from 'react'
import {
  MagnifyingGlassIcon,
  BellIcon,
  CalendarIcon,
  GiftIcon,
  HomeIcon,
  ChatBubbleLeftRightIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  PuzzlePieceIcon,
  BoltIcon,
  CalculatorIcon,
  BeakerIcon,
  GlobeAltIcon,
  ArrowRightOnRectangleIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  XMarkIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'

import ChatBuddy from "./studentdashboard/chatbuddy/ChatBuddy";
import Activities from "./studentdashboard/activity/Activities";
import Questionnaire from './studentdashboard/assessment/Questionnaire';
import Schedule from './studentdashboard/schedule/Schedule';
import { getWeekTasks } from '../api/scheduleApi.js';
import { fetchMyBadges } from '../api/rewardsApi.js';
import { getLatestMood, getLatestSleep } from '../api/wellnessApi.js';
import { saveMoodEntry, saveSleepEntry } from '../api/wellnessApi.js';
import { completeIntervention } from '../api/activitiesApi.js';

// ── Badge helpers ─────────────────────────────────────────────────────────────

function toDataUrl(imageBase64, imageType) {
  if (!imageBase64) return null
  return 'data:' + (imageType || 'image/png') + ';base64,' + imageBase64
}

const BADGE_META = {
  login: { emoji: '🔑', color: 'from-blue-400 to-indigo-500', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Login Milestone' },
  intervention: { emoji: '💪', color: 'from-green-400 to-emerald-500', bg: 'bg-green-50', border: 'border-green-200', label: 'Wellbeing Milestone' },
  video: { emoji: '🎬', color: 'from-pink-400 to-rose-500', bg: 'bg-pink-50', border: 'border-pink-200', label: 'Video Completion' },
  module: { emoji: '📚', color: 'from-orange-400 to-amber-500', bg: 'bg-orange-50', border: 'border-orange-200', label: 'Module Completion' },
  default: { emoji: '🏅', color: 'from-purple-400 to-violet-500', bg: 'bg-purple-50', border: 'border-purple-200', label: 'Achievement' },
}

function getBadgeMeta(triggerType) {
  return BADGE_META[triggerType] || BADGE_META.default
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [activeHeaderModal, setActiveHeaderModal] = useState(null)
  const [chatMessage, setChatMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showScheduleDropdown, setShowScheduleDropdown] = useState(false)
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false)

  // Initialise to today's actual day (Mon–Sun). Recalculates on mount so it is
  // always correct regardless of when the component first renders.
  const [activeDay, setActiveDay] = useState(() => {
    const JS_TO_DAY = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
    return JS_TO_DAY[new Date().getDay()]
  })

  // The name of today used for the header "Today's Focus" dropdown
  const todayDayName = (() => {
    const JS_TO_DAY = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
    return JS_TO_DAY[new Date().getDay()]
  })()

  const emptyWeek = {
    'Monday': [], 'Tuesday': [], 'Wednesday': [],
    'Thursday': [], 'Friday': [], 'Saturday': [], 'Sunday': []
  }

  const [tasks, setTasks] = useState(emptyWeek)
  const [tasksLoading, setTasksLoading] = useState(false)
  const [tasksError, setTasksError] = useState('')

  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New Math Quiz Available!', time: '10 mins ago', type: 'academic', read: false },
    { id: 2, title: '7-Day Streak!', time: '1 hour ago', type: 'achievement', read: false },
    { id: 3, title: 'Dr. Sarah replied to you', time: '2 hours ago', type: 'social', read: true },
  ])

  useEffect(() => {
    if (!user?.id) return
    const loadTasks = async () => {
      setTasksLoading(true)
      setTasksError('')
      try {
        const weekData = await getWeekTasks(user.id)
        setTasks({ ...emptyWeek, ...weekData })
      } catch (err) {
        console.error('Failed to load schedule:', err.message)
        setTasksError('Could not load your schedule. Please refresh.')
      } finally {
        setTasksLoading(false)
      }
    }
    loadTasks()
  }, [user?.id])

  const toggleTaskComplete = (day, taskId) => {
    setTasks({
      ...tasks,
      [day]: tasks[day].map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
    })
  }

  const sidebarItems = [
    { id: 'overview', name: 'Overview', icon: HomeIcon },
    { id: 'chatbuddy', name: 'ChatBuddy', icon: ChatBubbleLeftRightIcon },
    { id: 'schedule', name: 'My Schedule', icon: CalendarIcon },
    { id: 'questionnaire', name: 'Feelings Explorer', icon: ClipboardDocumentListIcon },
    { id: 'activities', name: 'Activities', icon: PuzzlePieceIcon }
  ]

  const performSearch = () => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) return
    const tabMap = {
      'overview': 'overview', 'home': 'overview',
      'chat': 'chatbuddy', 'chatbuddy': 'chatbuddy',
      'schedule': 'schedule', 'tasks': 'schedule',
      'feelings': 'questionnaire', 'explorer': 'questionnaire',
      'activities': 'activities', 'tools': 'activities',
    }
    const match = sidebarItems.find(item => item.name.toLowerCase().includes(query))
    if (match) { setActiveTab(match.id); return }
    for (const [keyword, tabId] of Object.entries(tabMap)) {
      if (query.includes(keyword)) { setActiveTab(tabId); return }
    }
  }

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') performSearch()
  }

  return (
    <div className="min-h-screen bg-gray-50 font-lora">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-3 group cursor-pointer">
            <div className="w-9 h-9 bg-purple-200 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200/50 group-hover:rotate-6 transition-transform">
              <span className="text-dark-navy font-black text-lg">E</span>
            </div>
            <h1 className="text-xl font-black text-black tracking-tight">EmpathAI</h1>
          </div>

          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative group">
              <MagnifyingGlassIcon onClick={performSearch} className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-600 cursor-pointer transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyPress}
                placeholder="Search sessions, lessons, or activities..."
                className="w-full pl-12 pr-12 py-2.5 bg-gray-100 border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-purple-100 focus:border-purple-600 outline-none text-sm transition-all shadow-sm"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors p-1">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-5">
            <div className="flex items-center bg-yellow-400/10 border border-yellow-400/20 rounded-full px-4 py-1.5 shadow-sm">
              <BoltIcon className="w-4 h-4 text-yellow-500 mr-2" />
              <span className="text-yellow-700 font-bold text-sm">385 XP</span>
            </div>

            <div className="relative group">
              <CalendarIcon
                onClick={() => setShowScheduleDropdown(!showScheduleDropdown)}
                className={'w-6 h-6 cursor-pointer transition-colors ' + (tasks[todayDayName]?.every(t => t.completed) && tasks[todayDayName]?.length > 0 ? 'text-green-500' : 'text-gray-400 hover:text-purple-600')}
              />
              <div className={'absolute top-full right-0 mt-4 w-72 bg-white rounded-2xl shadow-xl border-2 border-purple-100 p-4 transition-all duration-300 transform origin-top-right z-50 ' + (showScheduleDropdown ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none')}>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-black text-black text-sm">Today's Focus</h3>
                  <span className="text-xs font-bold text-gray-400">{tasks[todayDayName]?.filter(t => t.completed).length}/{tasks[todayDayName]?.length} done</span>
                </div>
                {(tasks[todayDayName]?.length ?? 0) === 0 ? (
                  <p className="text-xs text-center text-gray-400 py-4">No tasks for today</p>
                ) : (
                  <div className="space-y-2">
                    {tasks[todayDayName].map(task => (
                      <div key={task.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer" onClick={() => toggleTaskComplete(todayDayName, task.id)}>
                        <button className={'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ' + (task.completed ? 'bg-green-500 border-green-500' : 'border-gray-300')}>
                          {task.completed && <CheckCircleIcon className="w-3 h-3 text-white" />}
                        </button>
                        <div className="flex-1">
                          <p className={'text-xs font-bold ' + (task.completed ? 'text-gray-400' : 'text-black')}>{task.title}</p>
                          <p className="text-[10px] text-gray-400">{task.startTime} → {task.endTime}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={() => { setActiveTab('schedule'); setActiveDay(todayDayName); setShowScheduleDropdown(false) }} className="w-full mt-3 bg-black text-white text-xs font-bold py-2 rounded-lg hover:bg-gray-800 transition-colors">
                  View Full Schedule
                </button>
              </div>
            </div>

            <GiftIcon onClick={() => setActiveHeaderModal('rewards')} className="w-6 h-6 text-gray-400 hover:text-primary cursor-pointer transition-colors" />

            <div className="relative group">
              <BellIcon
                onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                className={'w-6 h-6 cursor-pointer transition-colors ' + (notifications.some(n => !n.read) ? 'text-primary animate-swing' : 'text-gray-400 hover:text-purple-600')}
              />
              {notifications.some(n => !n.read) && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center border-2 border-white">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
              <div className={'absolute top-full right-0 mt-4 w-80 bg-white rounded-2xl shadow-2xl border-2 border-purple-100 p-0 transition-all duration-300 transform origin-top-right z-50 overflow-hidden ' + (showNotificationsDropdown ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none')}>
                <div className="bg-purple-50 p-4 border-b border-purple-100 flex justify-between items-center">
                  <h3 className="font-black text-dark-navy text-sm">Notifications</h3>
                  <button className="text-[10px] font-bold text-purple-600 hover:underline">Mark all read</button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">No new notifications</div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {notifications.map((notification) => (
                        <div key={notification.id} className={'p-4 hover:bg-gray-50 transition-colors cursor-pointer flex gap-3 ' + (!notification.read ? 'bg-purple-50/30' : '')}>
                          <div className={'w-2 h-2 rounded-full mt-1.5 shrink-0 ' + (!notification.read ? 'bg-primary' : 'bg-gray-200')}></div>
                          <div>
                            <p className={'text-sm ' + (!notification.read ? 'font-bold text-black' : 'font-medium text-gray-500')}>{notification.title}</p>
                            <p className="text-[10px] text-gray-400 mt-1">{notification.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-2 border-t border-purple-50 text-center">
                  <button className="text-xs font-bold text-gray-500 hover:text-black transition-colors w-full py-2">View All Activity</button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pl-4 border-l border-gray-100">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-black">{(user.name || user.firstName)?.split(' ')[0]}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Student</p>
              </div>
              <div className="w-10 h-10 bg-purple-200 rounded-2xl flex items-center justify-center shadow-md shadow-purple-200/20">
                <span className="text-black font-black text-base">{(user.name || user.firstName)?.charAt(0) || 'U'}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
          <nav className="p-4 flex flex-col h-full">
            <ul className="space-y-2 flex-1">
              {sidebarItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={'w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ' + (activeTab === item.id ? 'bg-primary/10 text-primary shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900')}
                  >
                    <item.icon className={'w-5 h-5 mr-3 transition-colors ' + (activeTab === item.id ? 'text-primary' : 'text-gray-400')} />
                    <span className="font-bold tracking-tight">{item.name}</span>
                  </button>
                </li>
              ))}
            </ul>
            <button onClick={onLogout} className="w-full flex items-center px-4 py-3 text-sm font-bold rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all mt-4">
              <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
              <span>Logout</span>
            </button>
          </nav>
        </aside>

        <main className="flex-1 p-6">
          {activeTab === 'overview' && <Overview user={user} setActiveTab={setActiveTab} />}
          {activeTab === 'chatbuddy' && <ChatBuddy user={user} initialMessage={chatMessage} setChatMessage={setChatMessage} />}
          {activeTab === 'schedule' && (
            tasksLoading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-500 rounded-full animate-spin" />
                <p className="text-gray-500 font-medium text-sm">Loading your schedule...</p>
              </div>
            ) : tasksError ? (
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl px-6 py-4 text-red-600 font-medium text-sm text-center">
                {tasksError}
              </div>
            ) : (
              <Schedule user={user} tasks={tasks} setTasks={setTasks} activeDay={activeDay} setActiveDay={setActiveDay} />
            )
          )}
          {activeTab === 'questionnaire' && <Questionnaire user={user} />}
          {activeTab === 'activities' && <Activities user={user} />}
        </main>

        {activeTab === 'overview' && (
          <aside className="w-80 bg-white border-l border-gray-200 p-6">
            <RightSidebar user={user} setActiveTab={setActiveTab} />
          </aside>
        )}
      </div>

      {activeHeaderModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-purple-200 rounded-2xl shadow-xl p-8 w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setActiveHeaderModal(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl">×</button>
            {activeHeaderModal === 'rewards' && <BadgesModal user={user} />}
            {activeHeaderModal === 'notifications' && <NotificationsModal />}
          </div>
        </div>
      )}
    </div>
  )

  // ── Badges Modal ──────────────────────────────────────────────────────────
  function BadgesModal({ user }) {
    const [badges, setBadges] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [activeFilter, setActiveFilter] = useState('all')

    useEffect(() => {
      const load = async () => {
        try {
          setLoading(true)
          setError('')
          const data = await fetchMyBadges()
          setBadges(data || [])
        } catch (e) {
          if (e.message.includes('Unauthorized')) setError('Session expired. Please log in again.')
          else if (e.message.includes('Forbidden')) setError('Access denied. Please contact support.')
          else setError('Could not load your badges. Please try again.')
        } finally {
          setLoading(false)
        }
      }
      load()
    }, [])

    const filters = [
      { id: 'all', label: 'All' },
      { id: 'login', label: 'Login' },
      { id: 'intervention', label: 'Wellbeing' },
    ]

    const filtered = activeFilter === 'all' ? badges : badges.filter(b => b.triggerType === activeFilter)
    const earnedLoginValues = badges.filter(b => b.triggerType === 'login').map(b => parseInt(b.triggerValue))
    const maxLoginEarned = earnedLoginValues.length > 0 ? Math.max(...earnedLoginValues) : 0

    return (
      <div>
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-orange-200">
            <span className="text-3xl">🏆</span>
          </div>
          <h3 className="text-2xl font-black text-gray-900">Your Badges</h3>
          <p className="text-sm text-gray-500 mt-1">
            {badges.length === 0 ? 'Earn badges by logging in and completing sessions' : 'You have earned ' + badges.length + ' badge' + (badges.length !== 1 ? 's' : '') + ' so far!'}
          </p>
        </div>

        {badges.some(b => b.triggerType === 'login') && (
          <div className="mb-6 bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-black text-blue-700 uppercase tracking-wide">Login Journey</span>
              <span className="text-xs font-bold text-blue-500">{maxLoginEarned} logins</span>
            </div>
            <div className="flex items-center gap-1.5">
              {[1, 2, 5, 10, 25, 50, 100].map(m => {
                const earned = earnedLoginValues.includes(m)
                return (
                  <div key={m} className="flex-1 flex flex-col items-center gap-1">
                    <div className={'w-full h-2 rounded-full transition-all ' + (earned ? 'bg-blue-500' : 'bg-blue-100')} />
                    <span className={'text-[9px] font-bold ' + (earned ? 'text-blue-600' : 'text-blue-200')}>{m}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {badges.length > 0 && (
          <div className="flex gap-2 mb-5">
            {filters.map(f => (
              <button key={f.id} onClick={() => setActiveFilter(f.id)} className={'px-3 py-1.5 rounded-full text-xs font-bold transition-all ' + (activeFilter === f.id ? 'bg-purple-600 text-white shadow' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}>
                {f.label}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Loading your badges...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 bg-red-50 rounded-2xl border border-red-100">
            <p className="text-sm text-red-600 font-medium mb-2">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-2 px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors">Retry</button>
          </div>
        ) : badges.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl opacity-40">🏅</span>
            </div>
            <h4 className="font-black text-gray-800 mb-2">No badges yet</h4>
            <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">Keep logging in and completing your sessions to earn your first badge!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((badge) => {
              const meta = getBadgeMeta(badge.triggerType)
              return (
                <div key={badge.id} className={'relative rounded-2xl border-2 ' + meta.border + ' ' + meta.bg + ' p-4 flex flex-col items-center text-center gap-2 hover:shadow-md transition-shadow'}>
                  <div className={'w-14 h-14 rounded-xl bg-gradient-to-br ' + meta.color + ' flex items-center justify-center shadow-md overflow-hidden'}>
                    {badge.imageBase64 ? <img src={toDataUrl(badge.imageBase64, badge.imageType)} alt={badge.title} className="w-full h-full object-cover" /> : <span className="text-2xl">{meta.emoji}</span>}
                  </div>
                  <h4 className="font-black text-gray-900 text-sm leading-tight">{badge.title}</h4>
                  {badge.description && <p className="text-[11px] text-gray-500 leading-snug">{badge.description}</p>}
                  <span className="inline-flex items-center gap-1 bg-white/80 border border-gray-200 rounded-full px-2 py-0.5 text-[10px] font-black text-gray-600">
                    <ShieldCheckIcon className="w-3 h-3 text-green-500" />
                    {meta.label}
                  </span>
                  {badge.earnedAt && <p className="text-[10px] text-gray-400">Earned {formatDate(badge.earnedAt)}</p>}
                  <span className="absolute top-2 right-2 text-xs">✨</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  function NotificationsModal() {
    return (
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Notifications</h3>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {notifications.map((notif) => (
            <div key={notif.id} className={'p-4 rounded-lg border ' + (!notif.read ? 'border-purple-300 bg-purple-50' : 'border-gray-200 bg-gray-50')}>
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-gray-900">{notif.title}</h4>
                {!notif.read && <div className="w-2 h-2 bg-purple-600 rounded-full"></div>}
              </div>
              <p className="text-sm text-gray-700 mb-2">{notif.time}</p>
            </div>
          ))}
        </div>
        <button className="w-full mt-4 bg-black text-white py-2 rounded-lg hover:bg-gray-800">Mark All as Read</button>
      </div>
    )
  }
}

// ── Overview ──────────────────────────────────────────────────────────────────
function Overview({ user, setActiveTab }) {
  const [badges, setBadges] = useState([])
  const [badgesLoading, setBadgesLoading] = useState(true)
  const [badgesError, setBadgesError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        setBadgesLoading(true)
        setBadgesError('')
        const data = await fetchMyBadges()
        setBadges(data || [])
      } catch (err) {
        if (err.message.includes('Unauthorized')) setBadgesError('Session expired. Please log in again.')
        else if (err.message.includes('Forbidden')) setBadgesError('Access denied. Please contact support.')
        else setBadgesError('Could not load badges. Please refresh.')
      } finally {
        setBadgesLoading(false)
      }
    }
    load()
  }, [])

  const achievements = [
    { title: '7-day study streak', desc: 'Keep it up!', icon: '🔥', color: 'bg-orange-100', textColor: 'text-orange-600' },
    { title: 'Math Master', desc: 'Completed 5 chapters', icon: '🎯', color: 'bg-primary/10', textColor: 'text-primary' },
    { title: 'Mindful Learner', desc: '10 sessions done', icon: '🧘', color: 'bg-blue-100', textColor: 'text-blue-600' },
    { title: 'Emotion Explorer', desc: 'Top 5% in class', icon: '⭐', color: 'bg-yellow-100', textColor: 'text-yellow-600' }
  ]

  const subjects = [
    { name: 'Mathematics', chapter: 'Algebra', progress: 75, icon: CalculatorIcon, color: 'blue' },
    { name: 'Science', chapter: 'Light & Sound', progress: 60, icon: BeakerIcon, color: 'green' },
    { name: 'English', chapter: 'Poetry', progress: 85, icon: BookOpenIcon, color: 'purple' },
    { name: 'Social Studies', chapter: 'Indian History', progress: 45, icon: GlobeAltIcon, color: 'orange' }
  ]

  return (
    <div className="font-lora">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-black text-dark-navy mb-1.5 tracking-tight">Welcome back, {(user.name || user.firstName)?.split(' ')[0]}!</h1>
        <p className="text-base text-gray-500 font-medium tracking-tight">Ready to continue your personalized emotional and academic journey?</p>
      </div>

      <div className="mb-10 text-center">
        <h2 className="text-lg font-black text-dark-navy mb-5 flex items-center justify-center gap-2">
          <span className="w-6 h-1 bg-purple-200 rounded-full"></span>Your Milestones<span className="w-6 h-1 bg-purple-200 rounded-full"></span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {achievements.map((ach, i) => (
            <div key={i} className="group bg-white p-5 rounded-3xl border-2 border-purple-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className={'w-12 h-12 ' + ach.color + ' rounded-xl flex items-center justify-center text-xl mb-4 mx-auto group-hover:scale-110 transition-transform'}>
                {ach.icon}
              </div>
              <h3 className="text-base font-black text-dark-navy mb-1">{ach.title}</h3>
              <p className="text-[11px] text-gray-500 font-medium">{ach.desc}</p>
              <div className="mt-3 pt-3 border-t border-purple-100 flex items-center justify-between">
                <span className={'text-[9px] font-black uppercase tracking-widest ' + ach.textColor}>Achievement</span>
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-10">
        <h2 className="text-lg font-black text-dark-navy mb-5 flex items-center justify-center gap-2">
          <span className="w-6 h-1 bg-yellow-300 rounded-full"></span>Your Rewards and Badges<span className="w-6 h-1 bg-yellow-300 rounded-full"></span>
        </h2>
        {badgesLoading ? (
          <div className="flex items-center justify-center py-10 gap-3">
            <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
            <p className="text-sm text-gray-400 font-medium">Loading your badges...</p>
          </div>
        ) : badgesError ? (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 text-center">
            <p className="text-sm font-bold text-red-600 mb-2">{badgesError}</p>
            <button onClick={() => window.location.reload()} className="mt-2 px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors">Retry</button>
          </div>
        ) : badges.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-purple-200 rounded-3xl p-8 text-center">
            <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl">🏅</div>
            <h4 className="font-black text-gray-700 mb-1">No badges earned yet</h4>
            <p className="text-sm text-gray-400 max-w-xs mx-auto leading-relaxed">Keep logging in daily and completing wellbeing sessions to unlock your first badge!</p>
            <div className="mt-4 flex justify-center gap-3 text-xs">
              <span className="bg-blue-50 border border-blue-100 text-blue-600 font-bold px-3 py-1.5 rounded-full">Login milestones</span>
              <span className="bg-green-50 border border-green-100 text-green-600 font-bold px-3 py-1.5 rounded-full">Wellbeing sessions</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {badges.map((badge) => {
              const meta = getBadgeMeta(badge.triggerType)
              return (
                <div key={badge.id} className={'relative rounded-2xl border-2 ' + meta.border + ' ' + meta.bg + ' p-4 flex flex-col items-center text-center gap-2 hover:shadow-lg hover:-translate-y-1 transition-all duration-300'}>
                  <div className={'w-14 h-14 rounded-xl bg-gradient-to-br ' + meta.color + ' flex items-center justify-center shadow-md overflow-hidden'}>
                    {badge.imageBase64 ? <img src={toDataUrl(badge.imageBase64, badge.imageType)} alt={badge.title} className="w-full h-full object-cover" /> : <span className="text-2xl">{meta.emoji}</span>}
                  </div>
                  <h4 className="font-black text-gray-900 text-sm leading-tight">{badge.title}</h4>
                  {badge.description && <p className="text-[11px] text-gray-500 leading-snug">{badge.description}</p>}
                  <span className="inline-flex items-center gap-1 bg-white/80 border border-gray-200 rounded-full px-2 py-0.5 text-[10px] font-black text-gray-600">
                    <ShieldCheckIcon className="w-3 h-3 text-green-500" />
                    {meta.label}
                  </span>
                  {badge.earnedAt && <p className="text-[10px] text-gray-400">Earned {formatDate(badge.earnedAt)}</p>}
                  <span className="absolute top-2 right-2 text-xs">✨</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="mb-10 text-center">
        <div className="flex flex-col items-center justify-center mb-6">
          <h2 className="text-lg font-black text-dark-navy flex items-center gap-2 mb-2">
            <span className="w-6 h-1 bg-purple-200 rounded-full"></span>Ongoing Learning<span className="w-6 h-1 bg-purple-200 rounded-full"></span>
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {subjects.slice(0, 2).map((subject, index) => (
            <div key={index} className={'group bg-white p-5 rounded-3xl border-2 border-purple-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between ' + (index === 0 ? 'lg:col-start-2' : '')}>
              <div className="absolute top-0 right-0 w-16 h-16 bg-purple-50 rounded-bl-[40px] -z-0"></div>
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2">
                  <div className={'w-10 h-10 bg-' + subject.color + '-50 rounded-xl flex items-center justify-center group-hover:rotate-3 transition-transform shadow-sm'}>
                    <subject.icon className={'w-5 h-5 text-' + subject.color + '-500'} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-base font-black text-dark-navy leading-none mb-1">{subject.name}</h3>
                    <p className="text-gray-400 font-bold uppercase text-[7px] tracking-widest">Chapter: {subject.chapter}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-base font-black text-green-600 leading-none">{subject.progress}%</p>
                  <p className="text-[7px] font-bold text-gray-400 uppercase tracking-tighter">Progress</p>
                </div>
              </div>
              <div className="mb-4 relative z-10 px-1">
                <div className="bg-purple-50 rounded-full h-1 overflow-hidden">
                  <div className="bg-green-500 h-full rounded-full transition-all duration-1000" style={{ width: subject.progress + '%' }}></div>
                </div>
              </div>
              <button className="w-fit mx-auto px-6 bg-black text-white font-black rounded-xl py-2.5 hover:bg-gray-800 transition-all relative z-10 text-[10px] uppercase tracking-widest shadow-md hover:shadow-lg active:scale-95">Continue Learning</button>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <div className="relative group overflow-hidden rounded-3xl border-2 border-purple-200 bg-purple-50/50">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-200/50 to-transparent transition-opacity"></div>
          <div className="p-6 flex flex-col md:flex-row items-center gap-6 relative z-10">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-3xl shadow-lg border-2 border-purple-200">🧘</div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-black text-dark-navy mb-1 italic">Feeling Overwhelmed?</h3>
              <p className="text-gray-600 font-medium text-base leading-relaxed">Take a quick 5-minute mindfulness break to recalibrate your emotions.</p>
            </div>
            <button onClick={() => setActiveTab('activities')} className="bg-black text-white font-bold px-8 py-3 rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-black/10 whitespace-nowrap text-sm">Start Session</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── RightSidebar ──────────────────────────────────────────────────────────────
function RightSidebar({ user, setActiveTab }) {
  const [completedTasks, setCompletedTasks] = useState({})

  // Mood state
  const [latestMood, setLatestMood] = useState(null)
  const [moodLoading, setMoodLoading] = useState(true)
  const [selectedMood, setSelectedMood] = useState(null)
  const [moodNote, setMoodNote] = useState('')
  const [moodSaving, setMoodSaving] = useState(false)
  const [moodSaved, setMoodSaved] = useState(false)

  // Sleep state
  const [latestSleep, setLatestSleep] = useState(null)
  const [sleepLoading, setSleepLoading] = useState(true)
  const [sleepHours, setSleepHours] = useState(7)
  const [sleepQuality, setSleepQuality] = useState('')
  const [sleepSaving, setSleepSaving] = useState(false)
  const [sleepSaved, setSleepSaved] = useState(false)

  const handleTaskToggle = (taskId) => {
    setCompletedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }))
  }

  useEffect(() => {
    if (!user?.id) return
    getLatestMood(user.id)
      .then(data => setLatestMood(data))
      .catch(err => console.error('Failed to load latest mood:', err))
      .finally(() => setMoodLoading(false))

    getLatestSleep(user.id)
      .then(data => setLatestSleep(data))
      .catch(err => console.error('Failed to load latest sleep:', err))
      .finally(() => setSleepLoading(false))
  }, [user?.id])

  const MOOD_OPTIONS = [
    { emoji: '😊', label: 'Happy', value: 'happy' },
    { emoji: '😐', label: 'Okay', value: 'neutral' },
    { emoji: '😔', label: 'Sad', value: 'sad' },
    { emoji: '😰', label: 'Anxious', value: 'anxious' },
    { emoji: '😡', label: 'Angry', value: 'angry' },
  ]

  const MOOD_EMOJI = {
    happy: '😊', neutral: '😐', sad: '😔', anxious: '😰', angry: '😡',
  }

  const QUALITY_LABEL = {
    excellent: 'Excellent', good: 'Good', fair: 'Fair', poor: 'Poor',
  }

  const QUALITY_COLOR = {
    excellent: 'text-green-600 bg-green-50 border-green-200',
    good: 'text-blue-600 bg-blue-50 border-blue-200',
    fair: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    poor: 'text-red-600 bg-red-50 border-red-200',
  }

  const saveMood = async () => {
    if (!selectedMood || !user?.id) return
    setMoodSaving(true)
    try {
      const saved = await saveMoodEntry(user.id, selectedMood, moodNote)
      setLatestMood(saved)
      setMoodSaved(true)
      setSelectedMood(null)
      setMoodNote('')
      setTimeout(() => setMoodSaved(false), 3000)
      try {
        await completeIntervention(user.id, 'mood')
      } catch (err) {
        console.error('Failed to record mood intervention:', err)
      }
    } catch (err) {
      console.error('Failed to save mood:', err)
    } finally {
      setMoodSaving(false)
    }
  }

  const saveSleep = async () => {
    if (!sleepQuality || !user?.id) return
    setSleepSaving(true)
    const totalMinutes = Math.round(sleepHours * 60)
    const wakeHour = 7
    const bedMinutes = (wakeHour * 60) - totalMinutes
    const bedHour = Math.floor(((bedMinutes % 1440) + 1440) % 1440 / 60)
    const bedMin = ((bedMinutes % 1440) + 1440) % 1440 % 60
    const bedtime = (bedHour < 10 ? '0' : '') + bedHour + ':' + (bedMin < 10 ? '0' : '') + bedMin
    const wakeTime = '07:00'
    try {
      const saved = await saveSleepEntry(user.id, bedtime, wakeTime, sleepQuality)
      setLatestSleep(saved)
      setSleepSaved(true)
      setSleepQuality('')
      setSleepHours(7)
      setTimeout(() => setSleepSaved(false), 3000)
      try {
        await completeIntervention(user.id, 'sleep')
      } catch (err) {
        console.error('Failed to record sleep intervention:', err)
      }
    } catch (err) {
      console.error('Failed to save sleep:', err)
    } finally {
      setSleepSaving(false)
    }
  }

  const getSleepLabel = (hours) => {
    if (hours < 4) return 'Very Low'
    if (hours < 6) return 'Low'
    if (hours < 7) return 'Fair'
    if (hours < 9) return 'Good'
    return 'Excellent'
  }

  const getSleepColor = (hours) => {
    if (hours < 4) return 'text-red-600'
    if (hours < 6) return 'text-orange-600'
    if (hours < 7) return 'text-yellow-600'
    if (hours < 9) return 'text-green-600'
    return 'text-blue-600'
  }

  const getSliderBg = (hours) => {
    const pct = ((hours - 1) / 11) * 100
    if (hours < 4) return 'linear-gradient(to right, #ef4444 0%, #ef4444 ' + pct + '%, #e5e7eb ' + pct + '%, #e5e7eb 100%)'
    if (hours < 6) return 'linear-gradient(to right, #f97316 0%, #f97316 ' + pct + '%, #e5e7eb ' + pct + '%, #e5e7eb 100%)'
    if (hours < 7) return 'linear-gradient(to right, #eab308 0%, #eab308 ' + pct + '%, #e5e7eb ' + pct + '%, #e5e7eb 100%)'
    if (hours < 9) return 'linear-gradient(to right, #22c55e 0%, #22c55e ' + pct + '%, #e5e7eb ' + pct + '%, #e5e7eb 100%)'
    return 'linear-gradient(to right, #3b82f6 0%, #3b82f6 ' + pct + '%, #e5e7eb ' + pct + '%, #e5e7eb 100%)'
  }

  return (
    <div className="font-lora">

      {/* Mood Tracker */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
          How are you feeling?
        </h3>
        <div className="bg-white border-2 border-purple-200 rounded-xl p-4">
          {moodLoading ? (
            <div className="flex justify-center py-3">
              <div className="w-5 h-5 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
            </div>
          ) : moodSaved ? (
            <div className="text-center py-2">
              <span className="text-3xl">{MOOD_EMOJI[latestMood?.mood] || '😊'}</span>
              <p className="text-sm text-green-600 font-bold mt-2">Mood saved!</p>
            </div>
          ) : (
            <div>
              {latestMood && !selectedMood && (
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
                  <span className="text-2xl">{MOOD_EMOJI[latestMood.mood] || '😐'}</span>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-700 capitalize">Last: {latestMood.mood}</p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(latestMood.loggedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex justify-between mb-3">
                {MOOD_OPTIONS.map((mood) => (
                  <button
                    key={mood.value}
                    onClick={() => setSelectedMood(mood.value)}
                    className={'flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all ' +
                      (selectedMood === mood.value
                        ? 'bg-purple-100 scale-110 border-2 border-purple-400'
                        : 'hover:bg-gray-50 border-2 border-transparent')}
                  >
                    <span className="text-2xl">{mood.emoji}</span>
                    <span className="text-[9px] font-bold text-gray-500">{mood.label}</span>
                  </button>
                ))}
              </div>
              {selectedMood && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={moodNote}
                    onChange={(e) => setMoodNote(e.target.value)}
                    placeholder="Add a note (optional)"
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none"
                  />
                  <button
                    onClick={saveMood}
                    disabled={moodSaving}
                    className="w-full bg-black text-white text-xs font-bold py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
                  >
                    {moodSaving ? 'Saving...' : 'Save Mood'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sleep Tracker */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
          Last Night's Sleep
        </h3>
        <div className="bg-white border-2 border-purple-200 rounded-xl p-4">
          {sleepLoading ? (
            <div className="flex justify-center py-3">
              <div className="w-5 h-5 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
            </div>
          ) : sleepSaved ? (
            <div className="text-center py-2">
              <span className="text-3xl">🌙</span>
              <p className="text-sm text-green-600 font-bold mt-2">Sleep logged!</p>
            </div>
          ) : (
            <div>
              {latestSleep && (
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
                  <span className="text-xl">🌙</span>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Last: {latestSleep.bedtime} - {latestSleep.wakeTime}</p>
                    <span className={'inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold border mt-0.5 ' +
                      (QUALITY_COLOR[latestSleep.quality] || 'text-gray-600 bg-gray-50 border-gray-200')}>
                      {QUALITY_LABEL[latestSleep.quality] || latestSleep.quality}
                    </span>
                  </div>
                </div>
              )}

              {/* Sleep hours slider */}
              <div className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-gray-700">Hours of sleep</span>
                  <span className={'text-sm font-black ' + getSleepColor(sleepHours)}>
                    {sleepHours}h - {getSleepLabel(sleepHours)}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="12"
                  step="0.5"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{ background: getSliderBg(sleepHours) }}
                />
                <div className="flex justify-between text-[9px] text-gray-400 mt-1">
                  <span>1h</span>
                  <span>4h</span>
                  <span>7h</span>
                  <span>10h</span>
                  <span>12h</span>
                </div>
              </div>

              {/* Sleep quality buttons */}
              <div className="mb-3">
                <p className="text-xs font-bold text-gray-700 mb-2">How did you sleep?</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {['poor', 'fair', 'good', 'excellent'].map((q) => (
                    <button
                      key={q}
                      onClick={() => setSleepQuality(q)}
                      className={'px-2 py-1.5 rounded-lg text-[10px] font-bold border-2 transition-all capitalize ' +
                        (sleepQuality === q
                          ? (QUALITY_COLOR[q] || 'text-gray-600 bg-gray-50 border-gray-200') + ' ring-2 ring-purple-300'
                          : 'text-gray-500 bg-gray-50 border-gray-100 hover:border-gray-300')}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={saveSleep}
                disabled={!sleepQuality || sleepSaving}
                className="w-full bg-black text-white text-xs font-bold py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {sleepSaving ? 'Saving...' : 'Log Sleep'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tasks */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Tasks to be done</h3>
        <div className="bg-white border-2 border-purple-200 rounded-xl p-4 space-y-3">
          {[
            { id: 'task1', text: 'Complete Math Chapter 5 exercises' },
            { id: 'task2', text: 'Science project submission' },
            { id: 'task3', text: 'English essay writing' }
          ].map(task => (
            <div key={task.id} className="flex items-center space-x-3">
              <input type="checkbox" className="rounded text-green-600 focus:ring-green-500" checked={completedTasks[task.id] || false} onChange={() => handleTaskToggle(task.id)} />
              <span className={'text-sm ' + (completedTasks[task.id] ? 'text-green-600 line-through' : 'text-gray-700')}>{task.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-primary rounded-full"></span>Recent Activity
        </h3>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3 shadow-sm">
          <div className="flex items-center space-x-3 p-3 bg-green-50/50 rounded-xl border border-green-100">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0"><span className="text-green-600 text-sm font-bold">✓</span></div>
            <div className="flex-1"><p className="text-sm font-bold text-gray-900">Completed Math Quiz</p><p className="text-xs text-gray-500 font-medium">2 hours ago</p></div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0"><span className="text-blue-600 text-sm font-bold">💬</span></div>
            <div className="flex-1"><p className="text-sm font-bold text-gray-900">ChatBuddy session</p><p className="text-xs text-gray-500 font-medium">Yesterday</p></div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-primary/5 rounded-xl border border-primary/10">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0"><span className="text-primary text-sm font-bold">📝</span></div>
            <div className="flex-1"><p className="text-sm font-bold text-gray-900">Feelings Explorer</p><p className="text-xs text-gray-500 font-medium">2 days ago</p></div>
          </div>
        </div>
      </div>
    </div>
  )
}