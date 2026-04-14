import { useState, useEffect, useRef } from 'react'
import Header from './components/pagelayout/Header'
import Hero from './components/pagelayout/Hero'
import WhyEmpathAI from './components/WhyEmpathAI'
import HowItWorks from './components/HowItWorks'
import InclusivityFocus from './components/InclusivityFocus'
import Dashboard from './components/Dashboard'
import LoginModal from './components/LoginModal'
import AdminPanel from './components/admin/AdminPanel'
import Auth from './components/Auth'                    // ← Added from second file
import SetPassword from './components/SetPassword'     // ← Added from second file

import { getCurrentUser, logout as authLogout, isAdminRole } from './api/authApi.js'
import { clearTokens } from './api/apiClient.js'
import { updateTimeSpent } from './api/usermanagementapi.js'

// Backend role enums that should route to the admin panel
const ADMIN_ROLES = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PSYCHOLOGIST', 'CONTENT_ADMIN', 'TEACHER']

function isAdmin(user) {
  if (!user) return false
  return ADMIN_ROLES.includes(user.role)
}

// ─── Detect if the URL is /set-password on first load ────────────────────────
function isSetPasswordRoute() {
  return window.location.pathname === '/set-password'
}

// Sync time to backend every 60 seconds
const SYNC_INTERVAL_MS = 60 * 1000

function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    // Check URL first — /set-password must work even when user is not logged in
    if (isSetPasswordRoute()) return 'set-password'
    return 'home'
  })

  const [user, setUser] = useState(null)
  const [showLoginModal, setShowLoginModal] = useState(false)

  // ── Time tracking refs ─────────────────────────────────────────────────────
  const lastSyncedRef = useRef(null)       // timestamp of last sync
  const syncIntervalRef = useRef(null)     // setInterval reference
  const currentUserRef = useRef(null)      // always up-to-date user ref

  // Keep currentUserRef in sync with user state
  useEffect(() => {
    currentUserRef.current = user
  }, [user])

  // ── Send elapsed time to backend ──────────────────────────────────────────
  const syncTimeSpent = async () => {
    const currentUser = currentUserRef.current
    if (!currentUser || isAdmin(currentUser)) return
    if (!lastSyncedRef.current) return

    const now = Date.now()
    const elapsedSeconds = Math.floor((now - lastSyncedRef.current) / 1000)
    lastSyncedRef.current = now

    if (elapsedSeconds > 0) {
      try {
        await updateTimeSpent(currentUser.id, elapsedSeconds)
      } catch (err) {
        console.error('Failed to sync time spent:', err.message)
      }
    }
  }

  // ── Start time tracking ───────────────────────────────────────────────────
  const startTimeTracking = (userData) => {
    if (!userData || isAdmin(userData)) return

    lastSyncedRef.current = Date.now()

    // Clear any existing interval first
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current)
    }

    // Sync every 60 seconds
    syncIntervalRef.current = setInterval(() => {
      syncTimeSpent()
    }, SYNC_INTERVAL_MS)
  }

  // ── Stop time tracking and send final time ────────────────────────────────
  const stopTimeTracking = async () => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current)
      syncIntervalRef.current = null
    }

    // Send remaining unsent time
    await syncTimeSpent()

    lastSyncedRef.current = null
  }

  // ── Handle tab close / page unload ───────────────────────────────────────
  useEffect(() => {
    const handleBeforeUnload = () => {
      const currentUser = currentUserRef.current
      if (!currentUser || isAdmin(currentUser)) return
      if (!lastSyncedRef.current) return

      const elapsedSeconds = Math.floor((Date.now() - lastSyncedRef.current) / 1000)
      if (elapsedSeconds > 0) {
        // sendBeacon is reliable on page close
        const blob = new Blob(
          [JSON.stringify({ seconds: elapsedSeconds })],
          { type: 'application/json' }
        )
        navigator.sendBeacon(`/api/users/${currentUser.id}/time-spent`, blob)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  // ── Restore session on page load ──────────────────────────────────────────
  useEffect(() => {
    // Don't restore session if we're on the set-password page
    if (currentPage === 'set-password') return

    const savedUser = getCurrentUser()
    if (savedUser) {
      setUser(savedUser)
      setCurrentPage(isAdmin(savedUser) ? 'admin' : 'dashboard')
      startTimeTracking(savedUser)
    }

    const handleAuthLogout = () => {
      stopTimeTracking()
      setUser(null)
      setCurrentPage('home')
    }

    window.addEventListener('auth:logout', handleAuthLogout)

    // Scroll reveal animation
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active')
        }
      })
    }, { threshold: 0.1 })

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))

    return () => {
      observer.disconnect()
      window.removeEventListener('auth:logout', handleAuthLogout)
    }
  }, [currentPage])   // Note: kept dependency on currentPage as in second version

  const navigateToAuth = () => {
    setShowLoginModal(true)
  }

  const handleLogin = (userData) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
    setCurrentPage(isAdmin(userData) ? 'admin' : 'dashboard')
    setShowLoginModal(false)

    // Start tracking time when student logs in
    startTimeTracking(userData)
  }

  const navigateToHome = () => {
    setCurrentPage('home')
  }

  const navigateToDashboard = (userData) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
    setCurrentPage(isAdmin(userData) ? 'admin' : 'dashboard')
  }

  const handleLogout = async () => {
    // Stop tracking and send final time before logout
    await stopTimeTracking()

    authLogout()
    clearTokens()
    setUser(null)
    setCurrentPage('home')
  }

  // ── Route: /set-password?token=xxx  (fully public, no auth needed) ──
  if (currentPage === 'set-password') {
    return <SetPassword />
  }

  if (currentPage === 'auth') {
    return <Auth onBackToHome={navigateToHome} onLoginSuccess={navigateToDashboard} />
  }

  if (currentPage === 'admin' && user) {
    return <AdminPanel user={user} onLogout={handleLogout} />
  }

  if (currentPage === 'dashboard' && user) {
    return <Dashboard user={user} onLogout={handleLogout} />
  }

  // Default landing page
  return (
    <div className="min-h-screen bg-gray-50/30">
      <Header />
      <main>
        <Hero onStartJourney={navigateToAuth} />
        <div className="reveal">
          <WhyEmpathAI />
        </div>
        <div className="reveal">
          <HowItWorks />
        </div>
        <div className="reveal">
          <InclusivityFocus />
        </div>
      </main>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
      />
    </div>
  )
}

export default App