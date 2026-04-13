import { useState, useEffect } from 'react'
import {
  ClockIcon,
  ChartBarIcon,
  PencilSquareIcon,
  MoonIcon,
  FlagIcon,
  PhoneIcon,
  LockClosedIcon,
  TrophyIcon
} from '@heroicons/react/24/outline'
import { fetchMyBadges } from '../../../api/rewardsApi'

export default function Activities({ user }) {
  const [activeTool, setActiveTool] = useState(null)
  const [badges, setBadges] = useState([])
  const [badgesLoading, setBadgesLoading] = useState(false)
  const [badgesError, setBadgesError] = useState('')

  useEffect(() => {
    const loadBadges = async () => {
      if (!user?.id) {
        console.warn('Activities: user.id is missing, skipping badge fetch')
        return
      }
      console.log('Activities: fetching badges for user.id =', user.id)
      setBadgesLoading(true)
      setBadgesError('')
      try {
        const data = await fetchMyBadges()
        console.log('Activities: badges received =', data)
        setBadges(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Activities: badge fetch error =', err.message)
        setBadgesError(err.message || 'Failed to load rewards')
      } finally {
        setBadgesLoading(false)
      }
    }
    loadBadges()
  }, [user?.id])

  const tools = [
    {
      id: 'meditation',
      name: 'Meditation Timer',
      description: 'Guided meditation sessions from 5-30 minutes',
      icon: ClockIcon,
      color: 'green',
      bgColor: 'from-green-100 to-green-200',
      btnLabel: 'Start Session'
    },
    {
      id: 'mood',
      name: 'Mood Tracker',
      description: 'Track your daily mood and identify patterns',
      icon: ChartBarIcon,
      color: 'orange',
      bgColor: 'from-orange-100 to-orange-200',
      btnLabel: 'Log Mood'
    },
    {
      id: 'gratitude',
      name: 'Gratitude Journal',
      description: 'Daily gratitude practice for positive mindset',
      icon: PencilSquareIcon,
      color: 'blue',
      bgColor: 'from-blue-100 to-blue-200',
      btnLabel: 'Write Entry'
    },
    {
      id: 'sleep',
      name: 'Sleep Tracker',
      description: 'Monitor your sleep patterns and quality',
      icon: MoonIcon,
      color: 'purple',
      bgColor: 'from-purple-100 to-purple-200',
      btnLabel: 'Log Sleep'
    },
    {
      id: 'goals',
      name: 'Goal Setting',
      description: 'Set and track your wellness goals',
      icon: FlagIcon,
      color: 'green',
      bgColor: 'from-green-100 to-green-200',
      btnLabel: 'Set Goals'
    },
    {
      id: 'rewards',
      name: 'My Rewards',
      description: 'View badges and achievements you have earned',
      icon: TrophyIcon,
      color: 'yellow',
      bgColor: 'from-yellow-100 to-yellow-200',
      btnLabel: 'View Rewards'
    },
    {
      id: 'crisis',
      name: 'Crisis Resources',
      description: 'Emergency contacts and support hotlines',
      icon: PhoneIcon,
      color: 'red',
      bgColor: 'from-red-100 to-red-200',
      btnLabel: 'View Resources'
    }
  ]

  return (
    <div className="font-lora">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Wellness Activities</h1>
        <p className="text-gray-600">Interactive tools to support your emotional well-being</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool, index) => (
          <div
            key={index}
            className={`bg-gradient-to-br ${tool.bgColor} border-2 border-purple-200 rounded-xl p-6 hover:border-purple-300 transition-colors text-center`}
          >
            <div className="flex justify-center mb-4">
              <div className={`w-16 h-16 bg-${tool.color}-100 rounded-full flex items-center justify-center`}>
                <tool.icon className={`w-8 h-8 text-${tool.color}-600`} />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{tool.name}</h3>
            <p className="text-gray-700 text-sm mb-4">{tool.description}</p>
            {tool.id === 'rewards' && (
              <p className="text-xs text-yellow-700 mb-2 font-medium">
                {badgesLoading ? 'Loading...' : `${badges.length} badge${badges.length !== 1 ? 's' : ''} earned`}
              </p>
            )}
            <button
              onClick={() => setActiveTool(tool.id)}
              className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              {tool.btnLabel}
            </button>
          </div>
        ))}
      </div>

      {activeTool && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-purple-200 rounded-2xl shadow-xl p-8 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveTool(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
            >
              &times;
            </button>

            {activeTool === 'meditation' && <MeditationTimer />}
            {activeTool === 'mood' && <MoodTracker />}
            {activeTool === 'gratitude' && <GratitudeJournal />}
            {activeTool === 'sleep' && <SleepTracker />}
            {activeTool === 'goals' && <GoalSetting />}
            {activeTool === 'rewards' && (
              <RewardsViewer badges={badges} loading={badgesLoading} error={badgesError} />
            )}
            {activeTool === 'crisis' && <CrisisResources />}
          </div>
        </div>
      )}
    </div>
  )

  function MeditationTimer() {
    const [duration, setDuration] = useState(5)
    const [isActive, setIsActive] = useState(false)
    const [timeLeft, setTimeLeft] = useState(duration * 60)

    const startTimer = () => {
      setIsActive(true)
      setTimeLeft(duration * 60)
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsActive(false)
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Meditation Timer</h3>
        {!isActive && (
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Select Duration:</label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="border-2 border-purple-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
            >
              <option value={5}>5 minutes</option>
              <option value={10}>10 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={20}>20 minutes</option>
              <option value={30}>30 minutes</option>
            </select>
          </div>
        )}
        <div className="text-6xl font-bold text-purple-600 mb-6">
          {formatTime(timeLeft)}
        </div>
        <div className="space-x-4">
          <button
            onClick={startTimer}
            disabled={isActive}
            className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {isActive ? 'In Progress...' : 'Start Meditation'}
          </button>
          <button
            onClick={() => { setIsActive(false); setTimeLeft(duration * 60) }}
            className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800"
          >
            Reset
          </button>
        </div>
      </div>
    )
  }

  function MoodTracker() {
    const [selectedMood, setSelectedMood] = useState('')
    const [note, setNote] = useState('')
    const [entries, setEntries] = useState([])

    const moods = [
      { emoji: '😊', label: 'Happy', value: 'happy' },
      { emoji: '😐', label: 'Neutral', value: 'neutral' },
      { emoji: '😔', label: 'Sad', value: 'sad' },
      { emoji: '😰', label: 'Anxious', value: 'anxious' },
      { emoji: '😡', label: 'Angry', value: 'angry' }
    ]

    const logMood = () => {
      if (selectedMood) {
        setEntries([{ mood: selectedMood, note, date: new Date().toLocaleDateString(), time: new Date().toLocaleTimeString() }, ...entries])
        setSelectedMood('')
        setNote('')
      }
    }

    return (
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">Mood Tracker</h3>
        <div className="flex items-center justify-center gap-1.5 mb-8 bg-green-50 py-1.5 px-3 rounded-full w-fit mx-auto border border-green-200">
          <LockClosedIcon className="w-3 h-3 text-green-600" />
          <p className="text-[10px] text-green-600 font-bold uppercase tracking-wide">Private and Confidential</p>
        </div>
        <div className="mb-6">
          <p className="text-gray-700 mb-4">How are you feeling right now?</p>
          <div className="grid grid-cols-5 gap-4">
            {moods.map((mood) => (
              <button
                key={mood.value}
                onClick={() => setSelectedMood(mood.value)}
                className={`p-4 rounded-lg border-2 transition-colors ${selectedMood === mood.value ? 'border-purple-500 bg-purple-50' : 'border-purple-200 hover:border-purple-300'}`}
              >
                <div className="text-3xl mb-2">{mood.emoji}</div>
                <div className="text-sm">{mood.label}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Add a note (optional):</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What is on your mind?"
            className="w-full p-3 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500"
            rows="3"
          />
        </div>
        <button onClick={logMood} disabled={!selectedMood} className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 mb-6">
          Log Mood
        </button>
        {entries.length > 0 && (
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="font-semibold mb-2">Recent Entries:</h4>
            {entries.slice(0, 3).map((entry, i) => (
              <div key={i} className="mb-2 p-2 bg-white rounded">
                <span className="font-medium">{entry.date} {entry.time}</span> - {entry.mood}
                {entry.note && <p className="text-sm text-gray-600">{entry.note}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  function GratitudeJournal() {
    const [gratitude, setGratitude] = useState('')
    const [entries, setEntries] = useState([])

    const addEntry = () => {
      if (gratitude.trim()) {
        setEntries([{ text: gratitude, date: new Date().toLocaleDateString() }, ...entries])
        setGratitude('')
      }
    }

    return (
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">Gratitude Journal</h3>
        <div className="flex items-center justify-center gap-1.5 mb-8 bg-green-50 py-1.5 px-3 rounded-full w-fit mx-auto border border-green-200">
          <LockClosedIcon className="w-3 h-3 text-green-600" />
          <p className="text-[10px] text-green-600 font-bold uppercase tracking-wide">Private and Confidential</p>
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">What are you grateful for today?</label>
          <textarea
            value={gratitude}
            onChange={(e) => setGratitude(e.target.value)}
            placeholder="I am grateful for..."
            className="w-full p-4 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500"
            rows="4"
          />
        </div>
        <button onClick={addEntry} disabled={!gratitude.trim()} className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 mb-6">
          Add Entry
        </button>
        {entries.length > 0 && (
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="font-semibold mb-2">Your Gratitude Entries:</h4>
            {entries.slice(0, 3).map((entry, i) => (
              <div key={i} className="mb-3 p-3 bg-white rounded">
                <p className="text-gray-800">{entry.text}</p>
                <p className="text-sm text-gray-500 mt-1">{entry.date}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  function SleepTracker() {
    const [bedtime, setBedtime] = useState('')
    const [wakeTime, setWakeTime] = useState('')
    const [quality, setQuality] = useState('')
    const [entries, setEntries] = useState([])

    const logSleep = () => {
      if (bedtime && wakeTime && quality) {
        setEntries([{ bedtime, wakeTime, quality, date: new Date().toLocaleDateString() }, ...entries])
        setBedtime('')
        setWakeTime('')
        setQuality('')
      }
    }

    return (
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Sleep Tracker</h3>
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-gray-700 mb-2">Bedtime:</label>
            <input type="time" value={bedtime} onChange={(e) => setBedtime(e.target.value)} className="w-full p-3 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500" />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Wake Time:</label>
            <input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} className="w-full p-3 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500" />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Sleep Quality:</label>
            <select value={quality} onChange={(e) => setQuality(e.target.value)} className="w-full p-3 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500">
              <option value="">Select quality</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>
        </div>
        <button onClick={logSleep} disabled={!bedtime || !wakeTime || !quality} className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 mb-6">
          Log Sleep
        </button>
        {entries.length > 0 && (
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="font-semibold mb-2">Recent Sleep Log:</h4>
            {entries.slice(0, 3).map((entry, i) => (
              <div key={i} className="mb-2 p-2 bg-white rounded">
                <p><strong>{entry.date}</strong></p>
                <p>Bedtime: {entry.bedtime} | Wake: {entry.wakeTime}</p>
                <p>Quality: {entry.quality}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  function GoalSetting() {
    const [goal, setGoal] = useState('')
    const [deadline, setDeadline] = useState('')
    const [goals, setGoals] = useState([])

    const addGoal = () => {
      if (goal.trim() && deadline) {
        setGoals([{ text: goal, deadline, completed: false, id: Date.now() }, ...goals])
        setGoal('')
        setDeadline('')
      }
    }

    const toggleGoal = (id) => {
      setGoals(goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g))
    }

    return (
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">Goal Setting</h3>
        <div className="flex items-center justify-center gap-1.5 mb-8 bg-green-50 py-1.5 px-3 rounded-full w-fit mx-auto border border-green-200">
          <LockClosedIcon className="w-3 h-3 text-green-600" />
          <p className="text-[10px] text-green-600 font-bold uppercase tracking-wide">Private and Confidential</p>
        </div>
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-gray-700 mb-2">Your Goal:</label>
            <input type="text" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="What do you want to achieve?" className="w-full p-3 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500" />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Target Date:</label>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full p-3 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500" />
          </div>
        </div>
        <button onClick={addGoal} disabled={!goal.trim() || !deadline} className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 mb-6">
          Add Goal
        </button>
        {goals.length > 0 && (
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="font-semibold mb-2">Your Goals:</h4>
            {goals.map((g) => (
              <div key={g.id} className="mb-2 p-3 bg-white rounded flex items-center justify-between">
                <div className={g.completed ? 'line-through text-gray-500' : ''}>
                  <p className="font-medium">{g.text}</p>
                  <p className="text-sm text-gray-600">Due: {g.deadline}</p>
                </div>
                <button onClick={() => toggleGoal(g.id)} className={`px-3 py-1 rounded text-sm ${g.completed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}>
                  {g.completed ? 'Done' : 'Mark Done'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  function CrisisResources() {
    const resources = [
      { name: 'National Suicide Prevention Lifeline', number: '988', description: '24/7 crisis support' },
      { name: 'Crisis Text Line', number: 'Text HOME to 741741', description: 'Free 24/7 crisis counseling' },
      { name: 'Teen Line', number: '1-800-852-8336', description: 'Teens helping teens' },
      { name: 'SAMHSA National Helpline', number: '1-800-662-4357', description: 'Mental health and substance abuse' }
    ]

    return (
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Crisis Resources</h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 font-semibold">If you are in immediate danger, call 911</p>
        </div>
        <div className="space-y-4">
          {resources.map((resource, i) => (
            <div key={i} className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-gray-900">{resource.name}</h4>
              <p className="text-lg font-mono text-purple-600">{resource.number}</p>
              <p className="text-sm text-gray-600">{resource.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 bg-purple-50 p-4 rounded-lg border border-purple-200">
          <h4 className="font-semibold mb-2">Remember:</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>You are not alone</li>
            <li>It is okay to ask for help</li>
            <li>Your feelings are valid</li>
            <li>Things can get better</li>
          </ul>
        </div>
      </div>
    )
  }

  function RewardsViewer({ badges, loading, error }) {
    return (
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">My Rewards</h3>
        <p className="text-center text-sm text-gray-500 mb-6">
          Badges are awarded automatically when you reach login and session milestones.
        </p>

        {loading && (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-600">Loading your rewards...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        )}

        {!loading && !error && badges.length === 0 && (
          <div className="text-center py-10">
            <TrophyIcon className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No badges yet!</p>
            <p className="text-sm text-gray-400 mt-1">
              Keep logging in and using the app to earn your first badge.
            </p>
          </div>
        )}

        {!loading && !error && badges.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className="bg-gradient-to-br from-yellow-50 to-purple-50 border border-purple-200 rounded-xl p-4 flex items-center gap-4 shadow-sm"
              >
                {badge.imageBase64 ? (
                  <img
                    src={`data:${badge.imageType || 'image/png'};base64,${badge.imageBase64}`}
                    alt={badge.title}
                    className="w-14 h-14 rounded-xl object-cover border border-purple-100 shadow"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center border border-purple-200">
                    <TrophyIcon className="w-7 h-7 text-purple-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 truncate">{badge.title}</h4>
                  <p className="text-sm text-gray-500 truncate">{badge.triggerTitle}</p>
                  <span className="inline-block mt-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                    {badge.triggerType}
                  </span>
                  {badge.earnedAt && (
                    <p className="text-xs text-gray-400 mt-1">
                      Earned: {new Date(badge.earnedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
}