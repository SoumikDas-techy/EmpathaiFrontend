import { useState, useRef } from 'react'
import {
  PlusIcon, PencilIcon, TrashIcon, StarIcon, TrophyIcon,
  PhotoIcon, XMarkIcon, MagnifyingGlassIcon, VideoCameraIcon,
  AcademicCapIcon, CheckCircleIcon, ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

// ── Shared styles ─────────────────────────────────────────────────────────────
const inputCls =
  'block w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm outline-none ' +
  'transition-all focus:border-purple-500 focus:shadow-[0_0_0_3px_rgba(147,51,234,0.15)]'

function FieldError({ msg }) {
  if (!msg) return null
  return (
    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
      <ExclamationTriangleIcon className="w-3.5 h-3.5 flex-shrink-0" />{msg}
    </p>
  )
}

function SuccessToast({ message, onDismiss }) {
  return (
    <div className="fixed top-5 right-5 z-[100]">
      <div className="flex items-center gap-3 bg-white border border-green-200 shadow-lg rounded-xl px-4 py-3 min-w-[260px]">
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
          <CheckCircleIcon className="w-5 h-5 text-green-600" />
        </div>
        <p className="text-sm font-medium text-gray-800 flex-1">{message}</p>
        <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600">
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ── Image Upload Field ────────────────────────────────────────────────────────
function ImageUploadField({ label, value, onChange }) {
  const ref = useRef()
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div
        onClick={() => ref.current.click()}
        className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors min-h-[120px]"
      >
        {value ? (
          <div className="relative w-full flex flex-col items-center gap-2">
            <img src={value} alt="preview" className="h-20 w-20 object-cover rounded-lg shadow" />
            <p className="text-xs text-gray-500">Click to change image</p>
          </div>
        ) : (
          <>
            <PhotoIcon className="w-10 h-10 text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">Click to upload image</p>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
          </>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files[0]
          if (!file) return
          const reader = new FileReader()
          reader.onload = ev => onChange(ev.target.result)
          reader.readAsDataURL(file)
        }}
      />
    </div>
  )
}

// ── SAMPLE DATA ───────────────────────────────────────────────────────────────
const SAMPLE_BADGES = [
  { id: 1, title: 'Emotion Spotter', image: null, triggerType: 'video', triggerTitle: 'Understanding Emotions - Lesson 1' },
  { id: 2, title: 'Empathy Builder', image: null, triggerType: 'module', triggerTitle: 'Empathy & Compassion Module' },
  { id: 3, title: 'Mindful Listener', image: null, triggerType: 'video', triggerTitle: 'Active Listening - Lesson 3' },
]

const SAMPLE_ACHIEVEMENTS = [
  { id: 1, title: 'First Steps', image: null, description: 'Awarded when student earns their first badge' },
  { id: 2, title: 'Badge Collector', image: null, description: 'Awarded when student earns 5 badges' },
  { id: 3, title: 'Module Master', image: null, description: 'Awarded when student completes an entire module' },
]

// ── BADGES TAB ────────────────────────────────────────────────────────────────
function BadgesTab() {
  const [badges, setBadges] = useState(SAMPLE_BADGES)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ title: '', image: null, triggerType: 'video', triggerTitle: '' })
  const [errors, setErrors] = useState({})
  const [toast, setToast] = useState(null)

  const filtered = badges.filter(b =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.triggerTitle.toLowerCase().includes(search.toLowerCase())
  )

  const openAdd = () => {
    setEditing(null)
    setForm({ title: '', image: null, triggerType: 'video', triggerTitle: '' })
    setErrors({})
    setShowModal(true)
  }

  const openEdit = (badge) => {
    setEditing(badge)
    setForm({ ...badge })
    setErrors({})
    setShowModal(true)
  }

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'Badge title is required'
    if (!form.triggerTitle.trim()) e.triggerTitle = 'Please specify what triggers this badge'
    return e
  }

  const handleSave = () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    if (editing) {
      setBadges(prev => prev.map(b => b.id === editing.id ? { ...b, ...form } : b))
      setToast('Badge updated successfully!')
    } else {
      setBadges(prev => [...prev, { ...form, id: Date.now() }])
      setToast('Badge created successfully!')
    }
    setShowModal(false)
  }

  const handleDelete = (id) => {
    if (window.confirm('Delete this badge?')) {
      setBadges(prev => prev.filter(b => b.id !== id))
      setToast('Badge deleted.')
    }
  }

  return (
    <div>
      {toast && <SuccessToast message={toast} onDismiss={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-base font-semibold text-gray-800">Badges</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Badges are automatically awarded when a student completes a linked video or module.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors whitespace-nowrap"
        >
          <PlusIcon className="w-4 h-4" /> Add Badge
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search badges..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
        />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <StarIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-base font-medium">No badges found</p>
          <p className="text-sm mt-1">Create your first badge using the button above</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(badge => (
            <div key={badge.id} className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4 shadow-sm hover:shadow-md transition-shadow">
              {/* Badge Image */}
              <div className="w-16 h-16 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0 overflow-hidden border border-purple-100">
                {badge.image
                  ? <img src={badge.image} alt={badge.title} className="w-full h-full object-cover" />
                  : <StarIcon className="w-8 h-8 text-purple-300" />
                }
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-sm truncate">{badge.title}</h4>
                <div className="flex items-center gap-1 mt-1.5">
                  {badge.triggerType === 'video'
                    ? <VideoCameraIcon className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    : <AcademicCapIcon className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  }
                  <span className="text-xs text-gray-500 truncate">{badge.triggerTitle}</span>
                </div>
                <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                  badge.triggerType === 'video'
                    ? 'bg-blue-50 text-blue-600'
                    : 'bg-green-50 text-green-600'
                }`}>
                  On {badge.triggerType === 'video' ? 'Video' : 'Module'} Completion
                </span>
              </div>
              {/* Actions */}
              <div className="flex flex-col gap-1">
                <button onClick={() => openEdit(badge)} className="p-1.5 text-gray-400 hover:text-purple-600 transition-colors">
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(badge.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">{editing ? 'Edit Badge' : 'Add New Badge'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Badge Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Emotion Spotter"
                  className={inputCls}
                />
                <FieldError msg={errors.title} />
              </div>

              {/* Image Upload */}
              <ImageUploadField
                label="Badge Image"
                value={form.image}
                onChange={img => setForm(f => ({ ...f, image: img }))}
              />

              {/* Trigger Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trigger On *</label>
                <div className="grid grid-cols-2 gap-2">
                  {['video', 'module'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, triggerType: type }))}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                        form.triggerType === type
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {type === 'video'
                        ? <><VideoCameraIcon className="w-4 h-4" /> Video Completion</>
                        : <><AcademicCapIcon className="w-4 h-4" /> Module Completion</>
                      }
                    </button>
                  ))}
                </div>
              </div>

              {/* Trigger Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {form.triggerType === 'video' ? 'Video Title *' : 'Module Title *'}
                </label>
                <input
                  type="text"
                  value={form.triggerTitle}
                  onChange={e => setForm(f => ({ ...f, triggerTitle: e.target.value }))}
                  placeholder={form.triggerType === 'video' ? 'e.g. Understanding Emotions - Lesson 1' : 'e.g. Empathy & Compassion Module'}
                  className={inputCls}
                />
                <FieldError msg={errors.triggerTitle} />
                <p className="mt-1 text-xs text-gray-400">
                  This badge will be awarded automatically when the student completes this {form.triggerType}.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                {editing ? 'Save Changes' : 'Create Badge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── ACHIEVEMENTS TAB ──────────────────────────────────────────────────────────
function AchievementsTab() {
  const [achievements, setAchievements] = useState(SAMPLE_ACHIEVEMENTS)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ title: '', image: null, description: '' })
  const [errors, setErrors] = useState({})
  const [toast, setToast] = useState(null)

  const filtered = achievements.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.description.toLowerCase().includes(search.toLowerCase())
  )

  const openAdd = () => {
    setEditing(null)
    setForm({ title: '', image: null, description: '' })
    setErrors({})
    setShowModal(true)
  }

  const openEdit = (a) => {
    setEditing(a)
    setForm({ ...a })
    setErrors({})
    setShowModal(true)
  }

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'Achievement title is required'
    if (!form.description.trim()) e.description = 'Please describe when this achievement is triggered'
    return e
  }

  const handleSave = () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    if (editing) {
      setAchievements(prev => prev.map(a => a.id === editing.id ? { ...a, ...form } : a))
      setToast('Achievement updated successfully!')
    } else {
      setAchievements(prev => [...prev, { ...form, id: Date.now() }])
      setToast('Achievement created successfully!')
    }
    setShowModal(false)
  }

  const handleDelete = (id) => {
    if (window.confirm('Delete this achievement?')) {
      setAchievements(prev => prev.filter(a => a.id !== id))
      setToast('Achievement deleted.')
    }
  }

  return (
    <div>
      {toast && <SuccessToast message={toast} onDismiss={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-base font-semibold text-gray-800">Achievements</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Achievements are milestones automatically unlocked when a student completes qualifying badges.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors whitespace-nowrap"
        >
          <PlusIcon className="w-4 h-4" /> Add Achievement
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search achievements..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
        />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <TrophyIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-base font-medium">No achievements found</p>
          <p className="text-sm mt-1">Create your first achievement using the button above</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(achievement => (
            <div key={achievement.id} className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4 shadow-sm hover:shadow-md transition-shadow">
              {/* Achievement Image */}
              <div className="w-16 h-16 rounded-xl bg-yellow-50 flex items-center justify-center flex-shrink-0 overflow-hidden border border-yellow-100">
                {achievement.image
                  ? <img src={achievement.image} alt={achievement.title} className="w-full h-full object-cover" />
                  : <TrophyIcon className="w-8 h-8 text-yellow-300" />
                }
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-sm truncate">{achievement.title}</h4>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{achievement.description}</p>
                <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium bg-yellow-50 text-yellow-700">
                  Auto-triggered
                </span>
              </div>
              {/* Actions */}
              <div className="flex flex-col gap-1">
                <button onClick={() => openEdit(achievement)} className="p-1.5 text-gray-400 hover:text-purple-600 transition-colors">
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(achievement.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">{editing ? 'Edit Achievement' : 'Add New Achievement'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Achievement Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Badge Collector"
                  className={inputCls}
                />
                <FieldError msg={errors.title} />
              </div>

              {/* Image Upload */}
              <ImageUploadField
                label="Achievement Image"
                value={form.image}
                onChange={img => setForm(f => ({ ...f, image: img }))}
              />

              {/* Trigger Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trigger Condition *</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="e.g. Awarded when student earns 5 badges"
                  rows={3}
                  className={inputCls + ' resize-none'}
                />
                <FieldError msg={errors.description} />
                <p className="mt-1 text-xs text-gray-400">
                  Describe when this achievement should be automatically awarded to the student.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                {editing ? 'Save Changes' : 'Create Achievement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── MAIN REWARDS COMPONENT ────────────────────────────────────────────────────
const TABS = [
  { id: 'badges', label: 'Badges', icon: StarIcon },
  { id: 'achievements', label: 'Achievements', icon: TrophyIcon },
]

export default function Rewards() {
  const [activeTab, setActiveTab] = useState('badges')

  return (
    <div>
      {/* Sub Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.id
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'badges' && <BadgesTab />}
      {activeTab === 'achievements' && <AchievementsTab />}
    </div>
  )
}