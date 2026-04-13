import { apiRequest } from './apiClient'

const BASE = '/api/users'

// ── Users ─────────────────────────────────────────────────────────────────────

export async function getStudents({ school, search, page = 0, size = 50 } = {}) {
    const params = new URLSearchParams()
    if (school) params.append('school', school)
    if (search) params.append('search', search)
    params.append('page', page)
    params.append('size', size)

    const res = await apiRequest(`${BASE}/students?${params}`)
    if (!res.ok) throw new Error(`Failed to fetch students (HTTP ${res.status})`)
    return res.json()
}

export async function getSchoolAdmins({ search, page = 0, size = 50 } = {}) {
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    params.append('page', page)
    params.append('size', size)

    const res = await apiRequest(`${BASE}/school-admins?${params}`)
    if (!res.ok) throw new Error(`Failed to fetch school admins (HTTP ${res.status})`)
    return res.json()
}

export async function getPsychologists({ search, page = 0, size = 50 } = {}) {
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    params.append('page', page)
    params.append('size', size)

    const res = await apiRequest(`${BASE}/psychologists?${params}`)
    if (!res.ok) throw new Error(`Failed to fetch psychologists (HTTP ${res.status})`)
    return res.json()
}

export async function getContentAdmins({ search, page = 0, size = 50 } = {}) {
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    params.append('page', page)
    params.append('size', size)

    const res = await apiRequest(`${BASE}/content-admins?${params}`)
    if (!res.ok) throw new Error(`Failed to fetch content admins (HTTP ${res.status})`)
    return res.json()
}

export async function getUserById(id) {
    const res = await apiRequest(`${BASE}/${id}`)
    if (!res.ok) throw new Error(`Failed to fetch user (HTTP ${res.status})`)
    return res.json()
}

export async function createUser(data) {
    const res = await apiRequest(`${BASE}`, {
        method: 'POST',
        body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error(`Failed to create user (HTTP ${res.status})`)
    return res.json()
}

export async function updateUser(id, data) {
    const res = await apiRequest(`${BASE}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error(`Failed to update user (HTTP ${res.status})`)
    return res.json()
}

export async function deleteUser(id) {
    const res = await apiRequest(`${BASE}/${id}`, {
        method: 'DELETE'
    })
    if (!res.ok) throw new Error(`Failed to delete user (HTTP ${res.status})`)
}

export async function resetPassword(id) {
    const res = await apiRequest(`${BASE}/${id}/reset-password`, {
        method: 'POST'
    })
    if (!res.ok) throw new Error(`Failed to reset password (HTTP ${res.status})`)
    return res.json()
}

/**
 * Increments the student's time_spent by the given seconds.
 * Called every 60 seconds while the student is active on the platform.
 */
export async function updateTimeSpent(studentId, seconds) {
    if (!studentId || !seconds || seconds <= 0) return
    const res = await apiRequest(`${BASE}/${studentId}/time-spent`, {
        method: 'PATCH',
        body: JSON.stringify({ seconds: Math.floor(seconds) })
    })
    if (!res.ok) throw new Error(`Failed to update time spent (HTTP ${res.status})`)
}

/**
 * Fetches analytics dashboard data.
 * Returns totalStudents, totalAssessments, totalPsychologists, totalSchools.
 */
export async function getAnalyticsDashboard() {
    try {
        // Fetch all data in parallel
        const [studentsRes, psychologistsRes, schoolsRes] = await Promise.all([
            apiRequest(`${BASE}/students?page=0&size=1`),
            apiRequest(`${BASE}/psychologists?page=0&size=1`),
            apiRequest('/api/schools')
        ])

        const studentsData = studentsRes.ok ? await studentsRes.json() : { totalElements: 0 }
        const psychologistsData = psychologistsRes.ok ? await psychologistsRes.json() : { totalElements: 0 }
        const schoolsData = schoolsRes.ok ? await schoolsRes.json() : []

        return {
            totalStudents: studentsData.totalElements || 0,
            totalAssessments: 0, // No assessments endpoint yet
            totalPsychologists: psychologistsData.totalElements || 0,
            totalSchools: Array.isArray(schoolsData) ? schoolsData.length : 0,
        }
    } catch (err) {
        console.error('Failed to fetch analytics dashboard:', err)
        return {
            totalStudents: 0,
            totalAssessments: 0,
            totalPsychologists: 0,
            totalSchools: 0,
        }
    }
}

// ── Schools ───────────────────────────────────────────────────────────────────

export async function getSchools() {
    const res = await apiRequest('/api/schools')
    if (!res.ok) throw new Error(`Failed to fetch schools (HTTP ${res.status})`)
    return res.json()
}

export async function createSchool(data) {
    const res = await apiRequest('/api/schools', {
        method: 'POST',
        body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error(`Failed to create school (HTTP ${res.status})`)
    return res.json()
}

export async function deleteSchool(id) {
    const res = await apiRequest(`/api/schools/${id}`, {
        method: 'DELETE'
    })
    if (!res.ok) throw new Error(`Failed to delete school (HTTP ${res.status})`)
}