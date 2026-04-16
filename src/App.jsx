import { useState, useEffect } from 'react'
import Header from './components/pagelayout/Header'
import Hero from './components/pagelayout/Hero'
import WhyEmpathAI from './components/WhyEmpathAI'
import HowItWorks from './components/HowItWorks'
import InclusivityFocus from './components/InclusivityFocus'
import Dashboard from './components/Dashboard'
import LoginModal from './components/LoginModal'
import AdminPanel from './components/admin/AdminPanel'
import Auth from './components/Auth'
import SetPassword from './components/SetPassword'

import { getCurrentUser, logout as authLogout, isAdminRole } from './api/authApi.js'
import { clearTokens } from './api/apiClient.js'
import useTimeTracker from './api/useTimeTracker'   // ← replaces updateTimeSpent import

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

function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    if (isSetPasswordRoute()) return 'set-password'
    return 'home'
  })

  const [user, setUser] = useState(null)
  const [showLoginModal, setShowLoginModal] = useState(false)

  // ── Time tracking ─────────────────────────────────────────────────────────
  // Pass the student's id to the hook; pass null for admins or when logged out.
  // The hook auto-starts on mount, syncs every 60 s, and flushes on logout /
  // tab-hide / page-unload — no manual start/stop needed anywhere.
  const studentId = user && !isAdmin(user) ? user.id : null
  useTimeTracker(studentId)

  // ── Restore session on page load ──────────────────────────────────────────
  useEffect(() => {
    // Don't restore session if we're on the set-password page
    if (currentPage === 'set-password') return

    const savedUser = getCurrentUser()
    if (savedUser) {
      setUser(savedUser)
      setCurrentPage(isAdmin(savedUser) ? 'admin' : 'dashboard')
    }

    const handleAuthLogout = () => {
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
  }, [currentPage])

  const navigateToAuth = () => {
    setShowLoginModal(true)
  }

  const handleLogin = (userData) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
    setCurrentPage(isAdmin(userData) ? 'admin' : 'dashboard')
    setShowLoginModal(false)
    // No startTimeTracking() call needed — hook reacts to studentId becoming non-null
  }

  const navigateToHome = () => {
    setCurrentPage('home')
  }

  const navigateToDashboard = (userData) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
    setCurrentPage(isAdmin(userData) ? 'admin' : 'dashboard')
    // No startTimeTracking() call needed — hook reacts to studentId becoming non-null
  }

  const handleLogout = async () => {
    // No stopTimeTracking() needed — hook flushes remaining time when studentId
    // becomes null (i.e. when setUser(null) triggers a re-render below)
    authLogout()
    clearTokens()
    setUser(null)
    setCurrentPage('home')
  }

  // ── Route: /set-password?token=xxx  (fully public, no auth needed) ────────
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