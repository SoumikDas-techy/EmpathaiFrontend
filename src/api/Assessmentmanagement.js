const API_BASE_URL = 'http://localhost:8080/api'

const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token')  // ← was 'token'
    const savedUser = localStorage.getItem('user')
    const user = savedUser ? JSON.parse(savedUser) : null
    
    const headers = {
        'Content-Type': 'application/json',
    }
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }
    
    return headers
}

const handleResponse = async (res) => {
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`)
    
    const text = await res.text()
    if (!text || text.trim() === '') return null
    
    let json
    try { json = JSON.parse(text) } 
    catch { return null }
    
    if (json !== null && typeof json === 'object' && 'success' in json) {
        if (!json.success) throw new Error(json.message || 'Request failed')
        return json.data ?? null
    }
    
    return json
}

export const fetchGroups = () =>
    fetch(`${API_BASE_URL}/groups`, {
        headers: getAuthHeaders()
    }).then(handleResponse)

export const createGroup = (groupData) =>
    fetch(`${API_BASE_URL}/groups`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(groupData)
    }).then(handleResponse)

export const deleteGroup = (id) =>
    fetch(`${API_BASE_URL}/groups/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()   // ← was missing, caused 403
    }).then(handleResponse)

export const fetchQuestions = (page = 0, size = 50) =>
    fetch(`${API_BASE_URL}/questions?page=${page}&size=${size}`, {
        headers: getAuthHeaders()
    })
        .then(handleResponse)
        .then(data => {
            const list = data?.content || (Array.isArray(data) ? data : [])
            return { content: list }
        })

export const fetchQuestionsByGroup = (groupId, page = 0, size = 10) =>
    fetch(`${API_BASE_URL}/questions/group/${encodeURIComponent(groupId)}?page=${page}&size=${size}`, {
        headers: getAuthHeaders()
    }).then(handleResponse)

export const createQuestion = (questionData) =>
    fetch(`${API_BASE_URL}/questions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(questionData)
    }).then(handleResponse)

export const updateQuestion = (id, questionData) =>
    fetch(`${API_BASE_URL}/questions/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(questionData)
    }).then(handleResponse)

export const deleteQuestion = (id) =>
    fetch(`${API_BASE_URL}/questions/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()   // ← was missing
    }).then(handleResponse)

export const fetchResponses = (page = 0, size = 10) =>
    fetch(`${API_BASE_URL}/responses?page=${page}&size=${size}`, {
        headers: getAuthHeaders()
    }).then(handleResponse)

export const fetchResponsesByGroup = (groupId, page = 0, size = 10) =>
    fetch(`${API_BASE_URL}/responses/group/${encodeURIComponent(groupId)}?page=${page}&size=${size}`, {
        headers: getAuthHeaders()
    }).then(handleResponse)

export const fetchResponseSheet = (groupId) =>
    fetch(`${API_BASE_URL}/responses/sheet/${encodeURIComponent(groupId)}`, {
        headers: getAuthHeaders()
    }).then(handleResponse)
export const createResponse = (responseData) =>
    fetch(`${API_BASE_URL}/responses`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(responseData)
    }).then(handleResponse)

export const fetchAnalyticsSummary = (filter = 'ALL') =>
    fetch(`${API_BASE_URL}/analytics/summary?filter=${filter}`, {
        headers: getAuthHeaders()
    }).then(handleResponse)

export const fetchGroupAnalytics = (groupId, filter = 'ALL') =>
    fetch(`${API_BASE_URL}/analytics/group/${encodeURIComponent(groupId)}?filter=${filter}`, {
        headers: getAuthHeaders()
    }).then(handleResponse)