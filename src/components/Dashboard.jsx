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
  LanguageIcon,
  PaperAirplaneIcon,
  ArrowRightOnRectangleIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import Assessment from './Assessment'
import Chatbot from './Chatbot'
import Resources from './Resources'
import ChatBuddy from './ChatBuddy'
import Curriculum from './Curriculum'
import Questionnaire from './Questionnaire'
import Activities from './Activities'
import Schedule from './Schedule'

export default function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [activeHeaderModal, setActiveHeaderModal] = useState(null)
  const [chatMessage, setChatMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showDailyCheckin, setShowDailyCheckin] = useState(true)
  const [selectedSleep, setSelectedSleep] = useState(null)
  const [selectedMood, setSelectedMood] = useState(null)

  const [showBreathing, setShowBreathing] = useState(false)
  const [activeDay, setActiveDay] = useState('Monday')
  const [tasks, setTasks] = useState({
    'Monday': [
      { id: 1, time: '09:00 AM', title: 'Mathematics - Rational Numbers', type: 'Study', completed: false },
      { id: 2, time: '11:00 AM', title: 'Box Breathing Session', type: 'Wellness', completed: true },
      { id: 3, time: '04:00 PM', title: 'Science Project Research', type: 'Study', completed: false },
    ],
    'Tuesday': [],
    'Wednesday': [],
    'Thursday': [],
    'Friday': [],
    'Saturday': [],
    'Sunday': []
  })
  const [showScheduleDropdown, setShowScheduleDropdown] = useState(false)
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false)

  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New Math Quiz Available!', time: '10 mins ago', type: 'academic', read: false },
    { id: 2, title: '7-Day Streak! 🔥', time: '1 hour ago', type: 'achievement', read: false },
    { id: 3, title: 'Dr. Sarah replied to you', time: '2 hours ago', type: 'social', read: true },
  ])

  const toggleTaskComplete = (day, taskId) => {
    setTasks({
      ...tasks,
      [day]: tasks[day].map(t =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      )
    })
  }

  const navigateToChat = (message) => {
    setChatMessage(message)
    setActiveTab('chatbuddy')
  }

  const sidebarItems = [
    { id: 'overview', name: 'Overview', icon: HomeIcon },
    { id: 'chatbuddy', name: 'ChatBuddy', icon: ChatBubbleLeftRightIcon },
    { id: 'curriculum', name: 'Curriculum', icon: AcademicCapIcon },
    { id: 'schedule', name: 'My Schedule', icon: CalendarIcon },
    { id: 'questionnaire', name: 'Feelings Explorer', icon: ClipboardDocumentListIcon },
    { id: 'activities', name: 'Activities', icon: PuzzlePieceIcon }
  ]

  const performSearch = () => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) return

    // Mapping keywords to tab IDs
    const searchMap = {
      'overview': 'overview',
      'home': 'overview',
      'chat': 'chatbuddy',
      'buddy': 'chatbuddy',
      'bot': 'chatbuddy',
      'talk': 'chatbuddy',
      'curriculum': 'curriculum',
      'study': 'curriculum',
      'learn': 'curriculum',
      'lesson': 'curriculum',
      'math': 'curriculum',
      'science': 'curriculum',
      'english': 'curriculum',
      'history': 'curriculum',
      'schedule': 'schedule',
      'calendar': 'schedule',
      'today': 'schedule',
      'task': 'schedule',
      'feel': 'questionnaire',
      'explorer': 'questionnaire',
      'mood': 'questionnaire',
      'check': 'questionnaire',
      'activity': 'activities',
      'activities': 'activities',
      'game': 'activities',
      'play': 'activities'
    }

    // Try to find a match in the mapping
    const matchedKey = Object.keys(searchMap).find(key => query.includes(key))
    if (matchedKey) {
      setActiveTab(searchMap[matchedKey])
      setSearchQuery('')
      return
    }

    // Fallback: check sidebar items names directly
    const match = sidebarItems.find(item =>
      item.name.toLowerCase().includes(query) ||
      item.id.toLowerCase().includes(query)
    )
    if (match) {
      setActiveTab(match.id)
      setSearchQuery('')
    }
  }

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      performSearch()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 font-lora">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Logo */}
          <div className="flex items-center space-x-3 group cursor-pointer">
            <div className="w-9 h-9 bg-purple-200 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200/50 group-hover:rotate-6 transition-transform">
              <span className="text-dark-navy font-black text-lg">E</span>
            </div>
            <h1 className="text-xl font-black text-black tracking-tight">
              EmpathAI
            </h1>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative group">
              <MagnifyingGlassIcon
                onClick={performSearch}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-600 cursor-pointer transition-colors"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyPress}
                placeholder="Search sessions, lessons, or activities..."
                className="w-full pl-12 pr-12 py-2.5 bg-gray-100 border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-purple-100 focus:border-purple-600 outline-none text-sm transition-all shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors p-1"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center space-x-5">
            {/* XP Badge */}
            <div className="flex items-center bg-yellow-400/10 border border-yellow-400/20 rounded-full px-4 py-1.5 shadow-sm">
              <BoltIcon className="w-4 h-4 text-yellow-500 mr-2" />
              <span className="text-yellow-700 font-bold text-sm">385 XP</span>
            </div>

            {/* Calendar Icon */}
            {/* Calendar Icon - Daily Schedule Tracker */}
            <div className="relative group">
              <CalendarIcon
                onClick={() => setShowScheduleDropdown(!showScheduleDropdown)}
                className={`w-6 h-6 cursor-pointer transition-colors ${tasks['Monday'].every(t => t.completed) && tasks['Monday'].length > 0
                  ? 'text-green-500'
                  : 'text-gray-400 hover:text-purple-600'
                  }`}
              />
              <div
                className={`absolute top-full right-0 mt-4 w-72 bg-white rounded-2xl shadow-xl border-2 border-purple-100 p-4 transition-all duration-300 transform origin-top-right z-50 ${showScheduleDropdown ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-black text-black text-sm">Today's Focus</h3>
                  <span className="text-xs font-bold text-gray-400">{tasks['Monday'].filter(t => t.completed).length}/{tasks['Monday'].length} done</span>
                </div>
                {tasks['Monday'].length === 0 ? (
                  <p className="text-xs text-center text-gray-400 py-4">No tasks for today</p>
                ) : (
                  <div className="space-y-2">
                    {tasks['Monday'].map(task => (
                      <div key={task.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer" onClick={() => toggleTaskComplete('Monday', task.id)}>
                        <button className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                          {task.completed && <CheckCircleIcon className="w-3 h-3 text-white" />}
                        </button>
                        <div className="flex-1">
                          <p className={`text-xs font-bold ${task.completed ? 'text-gray-400' : 'text-black'}`}>{task.title}</p>
                          <p className="text-[10px] text-gray-400">{task.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => {
                    setActiveTab('schedule')
                    setShowScheduleDropdown(false)
                  }}
                  className="w-full mt-3 bg-black text-white text-xs font-bold py-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  View Full Schedule
                </button>
              </div>
            </div>

            {/* Gift Icon */}
            <GiftIcon
              onClick={() => setActiveHeaderModal('rewards')}
              className="w-6 h-6 text-gray-400 hover:text-primary cursor-pointer transition-colors"
            />

            {/* Notification Bell */}
            {/* Notification Bell */}
            <div className="relative group">
              <BellIcon
                onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                className={`w-6 h-6 cursor-pointer transition-colors ${notifications.some(n => !n.read) ? 'text-primary animate-swing' : 'text-gray-400 hover:text-purple-600'}`}
              />
              {notifications.some(n => !n.read) && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center border-2 border-white animate-bounce-subtle">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}

              {/* Notifications Dropdown */}
              <div
                className={`absolute top-full right-0 mt-4 w-80 bg-white rounded-2xl shadow-2xl border-2 border-purple-100 p-0 transition-all duration-300 transform origin-top-right z-50 overflow-hidden ${showNotificationsDropdown ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
              >
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
                        <div key={notification.id} className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer flex gap-3 ${!notification.read ? 'bg-purple-50/30' : ''}`}>
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!notification.read ? 'bg-primary' : 'bg-gray-200'}`}></div>
                          <div>
                            <p className={`text-sm ${!notification.read ? 'font-bold text-black' : 'font-medium text-gray-500'}`}>{notification.title}</p>
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

            {/* User Avatar */}
            <div className="flex items-center gap-3 pl-4 border-l border-gray-100">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-black">{user.firstName}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Student</p>
              </div>
              <div className="w-10 h-10 bg-purple-200 rounded-2xl flex items-center justify-center shadow-md shadow-purple-200/20">
                <span className="text-black font-black text-base">{user.firstName?.charAt(0) || 'U'}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
          <nav className="p-4 flex flex-col h-full">
            <ul className="space-y-2 flex-1">
              {sidebarItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === item.id
                      ? 'bg-primary/10 text-primary shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                  >
                    <item.icon className={`w-5 h-5 mr-3 transition-colors ${activeTab === item.id ? 'text-primary' : 'text-gray-400'}`} />
                    <span className="font-bold tracking-tight">{item.name}</span>
                  </button>
                </li>
              ))}
            </ul>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="w-full flex items-center px-4 py-3 text-sm font-bold rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all mt-4"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
              <span>Logout</span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeTab === 'overview' && <Overview user={user} setActiveTab={setActiveTab} />}
          {activeTab === 'chatbuddy' && <ChatBuddy user={user} initialMessage={chatMessage} setChatMessage={setChatMessage} />}
          {activeTab === 'curriculum' && <Curriculum user={user} setActiveTab={setActiveTab} navigateToChat={navigateToChat} />}
          {activeTab === 'schedule' && <Schedule user={user} tasks={tasks} setTasks={setTasks} activeDay={activeDay} setActiveDay={setActiveDay} />}
          {activeTab === 'questionnaire' && <Questionnaire user={user} />}
          {activeTab === 'activities' && <Activities user={user} />}
        </main>

        {/* Right Sidebar - Only show in overview */}
        {activeTab === 'overview' && (
          <aside className="w-80 bg-white border-l border-gray-200 p-6">
            <RightSidebar />
          </aside>
        )}
      </div>

      {/* Header Modals */}
      {activeHeaderModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-purple-200 rounded-2xl shadow-xl p-8 w-full max-w-md relative">
            <button
              onClick={() => setActiveHeaderModal(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>

            {activeHeaderModal === 'calendar' && <CalendarModal />}
            {activeHeaderModal === 'rewards' && <RewardsModal />}
            {activeHeaderModal === 'notifications' && <NotificationsModal />}
          </div>
        </div>
      )}
      {/* Daily Check-in Modal */}
      {showDailyCheckin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] border-2 border-purple-200 shadow-2xl p-10 w-full max-w-lg relative animate-in fade-in zoom-in duration-300">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-4 animate-float">
                <span className="text-4xl text-black">👋</span>
              </div>
              <h2 className="text-3xl font-black text-dark-navy mb-2 italic">Morning, {user.firstName}!</h2>
              <p className="text-gray-500 font-medium">Let's start your day with a quick check-in.</p>
            </div>

            <div className="space-y-8">
              {/* Sleep Question */}
              <div>
                <label className="block text-lg font-black text-dark-navy mb-4 text-center">
                  How many hours did you sleep? 😴
                </label>
                <div className="flex flex-wrap justify-center gap-3">
                  {['4-5', '6-7', '8-9', '10+'].map((hours) => (
                    <button
                      key={hours}
                      onClick={() => setSelectedSleep(hours)}
                      className={`px-4 py-3 rounded-2xl border-2 transition-all font-bold text-sm ${selectedSleep === hours
                        ? 'bg-green-50 border-green-500 text-green-700 shadow-md shadow-green-100 ring-2 ring-green-100'
                        : 'border-purple-100 text-dark-navy hover:border-green-500 hover:bg-green-50'
                        }`}
                    >
                      {hours} Hours
                    </button>
                  ))}
                </div>
              </div>

              {/* Mood Question */}
              <div>
                <label className="block text-lg font-black text-dark-navy mb-4 text-center">
                  How are you feeling today? ✨
                </label>
                <div className="flex justify-center gap-6">
                  {[
                    { emoji: '😊', label: 'Happy' },
                    { emoji: '😐', label: 'Neutral' },
                    { emoji: '😔', label: 'Sad' },
                    { emoji: '😫', label: 'Tired' }
                  ].map((mood) => (
                    <button
                      key={mood.label}
                      onClick={() => {
                        setSelectedMood(mood.label)
                        if (mood.label === 'Tired') {
                          setShowBreathing(true)
                        }
                      }}
                      className="group flex flex-col items-center gap-2"
                    >
                      <span className={`text-5xl transition-all duration-300 group-hover:scale-125 ${selectedMood === mood.label ? 'scale-125 drop-shadow-md' : 'opacity-80 group-hover:opacity-100'
                        }`}>
                        {mood.emoji}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${selectedMood === mood.label ? 'text-green-600' : 'text-gray-400'
                        }`}>{mood.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowDailyCheckin(false)}
              className="w-full mt-10 bg-black text-white font-black py-4 rounded-2xl hover:bg-gray-800 transition-all shadow-xl shadow-black/10 text-lg"
            >
              Start My Learning Journey!
            </button>
          </div>
        </div>
      )}

      {/* Box Breathing Intervention */}
      {showBreathing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] border-4 border-purple-200 p-12 w-full max-w-xl text-center relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-b from-purple-50/50 to-transparent"></div>

            <div className="relative z-10">
              <h2 className="text-3xl font-black text-dark-navy mb-2 tracking-tight">Box Breathing 🧘‍♂️</h2>
              <p className="text-gray-500 font-medium mb-10">Let's reset your energy with 30 seconds of breathing.</p>

              {/* Breathing Animation */}
              <div className="flex justify-center mb-10">
                <div className="w-48 h-48 border-4 border-green-200 rounded-3xl relative flex items-center justify-center">
                  <div className="absolute inset-0 border-4 border-green-500 rounded-3xl animate-breathing-box"></div>
                  <div className="text-xl font-black text-green-600 animate-pulse">
                    Breathe...
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-4xl font-black text-dark-navy">30s</div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Intervention in progress</p>
              </div>

              <button
                onClick={() => setShowBreathing(false)}
                className="mt-10 text-gray-400 font-bold hover:text-dark-navy transition-colors underline"
              >
                Skip intervention
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // Calendar Modal Component
  function CalendarModal() {
    const today = new Date()
    const events = [
      { date: 'Today', time: '2:00 PM', title: 'Math Study Session', type: 'study' },
      { date: 'Tomorrow', time: '10:00 AM', title: 'Emotional Check-in', type: 'wellness' },
      { date: 'Dec 25', time: '3:00 PM', title: 'Science Project Due', type: 'assignment' }
    ]

    return (
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">📅 Your Schedule</h3>

        <div className="space-y-4">
          {events.map((event, i) => (
            <div key={i} className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-gray-900">{event.title}</h4>
                <span className={`px-2 py-1 rounded-full text-xs ${event.type === 'study' ? 'bg-blue-100 text-blue-700' :
                  event.type === 'wellness' ? 'bg-green-100 text-green-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                  {event.type}
                </span>
              </div>
              <p className="text-sm text-gray-600">{event.date} at {event.time}</p>
            </div>
          ))}
        </div>

        <button className="w-full mt-6 bg-black text-white py-2 rounded-lg hover:bg-gray-800">
          View Full Calendar
        </button>
      </div>
    )
  }

  // Rewards Modal Component
  function RewardsModal() {
    const rewards = [
      { name: '30 min extra screen time', cost: 50, available: true, type: 'privilege' },
      { name: 'Choose dinner menu', cost: 100, available: true, type: 'privilege' },
      { name: 'Movie night pick', cost: 150, available: false, type: 'privilege' },
      { name: 'Weekend outing', cost: 300, available: false, type: 'privilege' }
    ]

    const badges = [
      { name: 'Math Genius', icon: '🧮', earned: true, description: 'Complete 10 math chapters' },
      { name: 'Mindful Student', icon: '🧘', earned: true, description: '30 meditation sessions' },
      { name: 'Study Streak', icon: '🔥', earned: false, description: '14-day study streak' },
      { name: 'Emotion Master', icon: '💝', earned: false, description: 'Complete all assessments' }
    ]

    return (
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">🎁 Rewards Store</h3>

        <div className="mb-6 text-center">
          <p className="text-gray-600">Your XP Balance:</p>
          <p className="text-3xl font-bold text-yellow-600">385 XP</p>
        </div>

        {/* Badges Section */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">🏆 Your Badges</h4>
          <div className="grid grid-cols-2 gap-3">
            {badges.map((badge, i) => (
              <div key={i} className={`p-3 rounded-lg border-2 text-center ${badge.earned
                ? 'border-yellow-300 bg-yellow-50'
                : 'border-gray-200 bg-gray-50 opacity-60'
                }`}>
                <div className="text-2xl mb-1">{badge.icon}</div>
                <h5 className="font-semibold text-sm text-gray-900">{badge.name}</h5>
                <p className="text-xs text-gray-600">{badge.description}</p>
                {badge.earned && <div className="text-xs text-yellow-600 font-medium mt-1">✓ Earned</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Notifications Modal Component
  function NotificationsModal() {
    const notifications = [
      {
        id: 1,
        title: 'Great job on Math!',
        message: 'You completed Chapter 5 with 85% accuracy',
        time: '2 hours ago',
        type: 'achievement',
        read: false
      },
      {
        id: 2,
        title: 'Reminder: Daily Check-in',
        message: 'Don\'t forget to log your mood today',
        time: '1 day ago',
        type: 'reminder',
        read: true
      },
      {
        id: 3,
        title: 'New Meditation Session',
        message: 'Try our new 10-minute focus meditation',
        time: '2 days ago',
        type: 'feature',
        read: true
      }
    ]

    return (
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">🔔 Notifications</h3>

        <div className="space-y-3 max-h-80 overflow-y-auto">
          {notifications.map((notif) => (
            <div key={notif.id} className={`p-4 rounded-lg border ${!notif.read
              ? 'border-purple-300 bg-purple-50'
              : 'border-gray-200 bg-gray-50'
              }`}>
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-gray-900">{notif.title}</h4>
                {!notif.read && <div className="w-2 h-2 bg-purple-600 rounded-full"></div>}
              </div>
              <p className="text-sm text-gray-700 mb-2">{notif.message}</p>
              <p className="text-xs text-gray-500">{notif.time}</p>
            </div>
          ))}
        </div>

        <button className="w-full mt-4 bg-black text-white py-2 rounded-lg hover:bg-gray-800">
          Mark All as Read
        </button>
      </div>
    )
  }
}

function Overview({ user, setActiveTab }) {
  const achievements = [
    { title: '7-day study streak', desc: 'Keep it up!', value: '7', icon: '🔥', color: 'bg-orange-100', textColor: 'text-orange-600' },
    { title: 'Math Master', desc: 'Completed 5 chapters', value: '🎯', icon: '🎯', color: 'bg-primary/10', textColor: 'text-primary' },
    { title: 'Mindful Learner', desc: '10 sessions done', value: '🧘', icon: '🧘', color: 'bg-blue-100', textColor: 'text-blue-600' },
    { title: 'Emotion Explorer', desc: 'Top 5% in class', value: '⭐', icon: '⭐', color: 'bg-yellow-100', textColor: 'text-yellow-600' }
  ]

  const subjects = [
    { name: 'Mathematics', chapter: 'Algebra', progress: 75, icon: CalculatorIcon, color: 'blue' },
    { name: 'Science', chapter: 'Light & Sound', progress: 60, icon: BeakerIcon, color: 'green' },
    { name: 'English', chapter: 'Poetry', progress: 85, icon: BookOpenIcon, color: 'purple' },
    { name: 'Social Studies', chapter: 'Indian History', progress: 45, icon: GlobeAltIcon, color: 'orange' }
  ]

  return (
    <div className="font-lora">
      {/* Welcome Message */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-black text-dark-navy mb-1.5 tracking-tight">
          Welcome back, {user.firstName}! 🌟
        </h1>
        <p className="text-base text-gray-500 font-medium tracking-tight">Ready to continue your personalized emotional and academic journey?</p>
      </div>

      {/* Hero Achievements Section */}
      <div className="mb-10 text-center">
        <h2 className="text-lg font-black text-dark-navy mb-5 flex items-center justify-center gap-2">
          <span className="w-6 h-1 bg-purple-200 rounded-full"></span>
          Your Milestones
          <span className="w-6 h-1 bg-purple-200 rounded-full"></span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {achievements.map((ach, i) => (
            <div key={i} className="group bg-white p-5 rounded-3xl border-2 border-purple-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className={`w-12 h-12 ${ach.color} rounded-xl flex items-center justify-center text-xl mb-4 mx-auto group-hover:scale-110 transition-transform`}>
                {ach.icon}
              </div>
              <h3 className="text-base font-black text-dark-navy mb-1">{ach.title}</h3>
              <p className="text-[11px] text-gray-500 font-medium">{ach.desc}</p>
              <div className="mt-3 pt-3 border-t border-purple-100 flex items-center justify-between">
                <span className={`text-[9px] font-black uppercase tracking-widest ${ach.id === 'milestone' ? 'text-purple-600' : ach.textColor}`}>Achievement</span>
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ongoing Learning Modules */}
      <div className="mb-10 text-center">
        <div className="flex flex-col items-center justify-center mb-6">
          <h2 className="text-lg font-black text-dark-navy flex items-center gap-2 mb-2">
            <span className="w-6 h-1 bg-purple-200 rounded-full"></span>
            Ongoing Learning
            <span className="w-6 h-1 bg-purple-200 rounded-full"></span>
          </h2>
          <button
            onClick={() => setActiveTab('curriculum')}
            className="text-xs font-bold text-purple-600 hover:underline"
          >
            View all curriculum
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {subjects.slice(0, 2).map((subject, index) => (
            <div key={index} className={`group bg-white p-5 rounded-3xl border-2 border-purple-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${index === 0 ? 'lg:col-start-2' : ''}`}>
              <div className="absolute top-0 right-0 w-16 h-16 bg-purple-50 rounded-bl-[40px] -z-0"></div>
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2">
                  <div className={`w-10 h-10 bg-${subject.color}-50 rounded-xl flex items-center justify-center group-hover:rotate-3 transition-transform shadow-sm`}>
                    <subject.icon className={`w-5 h-5 text-${subject.color}-500`} />
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
                  <div className={`bg-green-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(34,197,94,0.3)]`} style={{ width: `${subject.progress}%` }}></div>
                </div>
              </div>

              <button className="w-fit mx-auto px-6 bg-black text-white font-black rounded-xl py-2.5 hover:bg-gray-800 transition-all relative z-10 text-[10px] uppercase tracking-widest shadow-md hover:shadow-lg active:scale-95">
                Continue Learning
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Meditation Card */}
      <div className="mb-6">
        <div className="relative group overflow-hidden rounded-3xl border-2 border-purple-200 bg-purple-50/50">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-200/50 to-transparent transition-opacity"></div>
          <div className="p-6 flex flex-col md:flex-row items-center gap-6 relative z-10">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-3xl shadow-lg border-2 border-purple-200 animate-float">
              🧘‍♀️
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-black text-dark-navy mb-1 italic">Feeling Overwhelmed?</h3>
              <p className="text-gray-600 font-medium text-base leading-relaxed">Take a quick 5-minute mindfulness break to recalibrate your emotions.</p>
            </div>
            <button
              onClick={() => setActiveTab('activities')}
              className="bg-black text-white font-bold px-8 py-3 rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-black/10 whitespace-nowrap text-sm"
            >
              Start Session
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function RightSidebar() {
  const [completedTasks, setCompletedTasks] = useState({})
  const [selectedWellnessEmoji, setSelectedWellnessEmoji] = useState(null)

  const handleTaskToggle = (taskId) => {
    setCompletedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }))
  }

  const wellnessEmojis = [
    { emoji: '😊', label: 'Happy' },
    { emoji: '😐', label: 'Neutral' },
    { emoji: '😔', label: 'Sad' }
  ]

  return (
    <div className="font-lora">
      {/* Emotional Wellness */}
      <div className="mb-8">
        <h3 className="font-semibold text-gray-900 mb-4">💝 Emotional Wellness</h3>
        <div className="bg-white border-2 border-purple-200 rounded-xl p-4 min-h-[120px] flex flex-col justify-center">
          <p className="text-sm text-gray-700 mb-4 text-center">
            {selectedWellnessEmoji ? "Glad you shared how you're feeling!" : "How are you feeling today?"}
          </p>
          <div className="flex justify-center space-x-6">
            {wellnessEmojis.map((item, index) => (
              (!selectedWellnessEmoji || selectedWellnessEmoji === item.emoji) && (
                <span
                  key={index}
                  onClick={() => setSelectedWellnessEmoji(item.emoji)}
                  className={`text-4xl cursor-pointer transition-all duration-500 transform ${selectedWellnessEmoji === item.emoji
                    ? 'scale-125 hover:scale-125'
                    : 'hover:scale-110 grayscale-[0.5] hover:grayscale-0'
                    }`}
                >
                  {item.emoji}
                </span>
              )
            ))}
          </div>
        </div>
      </div>

      {/* Pending Tasks */}
      <div className="mb-8">
        <h3 className="font-semibold text-gray-900 mb-4">📝 Tasks to be done</h3>
        <div className="bg-white border-2 border-purple-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              className="rounded text-green-600 focus:ring-green-500"
              checked={completedTasks.task1 || false}
              onChange={() => handleTaskToggle('task1')}
            />
            <span className={`text-sm ${completedTasks.task1 ? 'text-green-600 line-through' : 'text-gray-700'}`}>
              Complete Math Chapter 5 exercises
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              className="rounded text-green-600 focus:ring-green-500"
              checked={completedTasks.task2 || false}
              onChange={() => handleTaskToggle('task2')}
            />
            <span className={`text-sm ${completedTasks.task2 ? 'text-green-600 line-through' : 'text-gray-700'}`}>
              Science project submission
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              className="rounded text-green-600 focus:ring-green-500"
              checked={completedTasks.task3 || false}
              onChange={() => handleTaskToggle('task3')}
            />
            <span className={`text-sm ${completedTasks.task3 ? 'text-green-600 line-through' : 'text-gray-700'}`}>
              English essay writing
            </span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-primary rounded-full"></span>
          Recent Activity
        </h3>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3 shadow-sm">
          <div className="flex items-center space-x-3 p-3 bg-green-50/50 rounded-xl border border-green-100">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-green-600 text-sm font-bold">✓</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">Completed Math Quiz</p>
              <p className="text-xs text-gray-500 font-medium">2 hours ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-blue-600 text-sm font-bold">💬</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">ChatBuddy session</p>
              <p className="text-xs text-gray-500 font-medium">Yesterday</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-primary/5 rounded-xl border border-primary/10">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-primary text-sm font-bold">📝</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">Feelings Explorer</p>
              <p className="text-xs text-gray-500 font-medium">2 days ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}