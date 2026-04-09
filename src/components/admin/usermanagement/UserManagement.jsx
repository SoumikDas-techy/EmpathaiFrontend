import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
    PencilIcon, TrashIcon, UserPlusIcon, ChevronDownIcon, ChevronRightIcon,
    MagnifyingGlassIcon, ArrowLeftIcon, BuildingLibraryIcon, AcademicCapIcon,
    PhoneIcon
} from '@heroicons/react/24/outline'
import {
    getSchoolAdmins, getPsychologists, getContentAdmins,
    createUser, updateUser, deleteUser, resetPassword,
    getSchools, createSchool, deleteSchool, getUserById,
    getClassesBySchool, getStudentsByClass, getStudentDetail
} from '../../../api/usermanagementapi.js'

// ─── helpers ────────────────────────────────────────────────────────────────

const TAB_ROLE_MAP = {
    student: 'STUDENT',
    school_admin: 'SCHOOL_ADMIN',
    psychologist: 'PSYCHOLOGIST',
    content_admin: 'CONTENT_ADMIN',
}

const ordinal = n => {
    const s = ['th', 'st', 'nd', 'rd'], v = n % 100
    return n + (s[(v - 20) % 10] || s[v] || s[0])
}

const formatClassName = (name) => {
    if (!name) return 'No Class'
    const match = name.match(/\d+/)
    if (match) return `Class ${ordinal(parseInt(match[0]))} Standard`
    return name.startsWith('Class') ? name : `Class ${name}`
}

const CLASS_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => ({
    label: `Class ${ordinal(n)}`,
    value: `${ordinal(n)} Standard`,
}))
const calculateAgeFromDOB = (dob) => {
    if (!dob) return null
    const birth = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--
    }
    return age > 0 ? age : null
}

const EMPTY_FORM = {
    name: '', email: '', role: 'student', password: '',
    class: '', section: '', school: '', parentName: '',
    parentPhone: '', phoneNumber: '', dateOfBirth: '',
    address: '', bloodGroup: '', contactName: '', rollNo: '',
}

// ─── component ──────────────────────────────────────────────────────────────

export default function UserManagement({ user }) {
    const [activeTab, setActiveTab] = useState('student')
    const [searchTerm, setSearchTerm] = useState('')

    // ── drill-down state ──
    // Level 1 → Level 2: selectedSchool  = { id, name }
    // Level 2 → Level 3: selectedClass   = className string  (e.g. "6th Standard")
    const [selectedSchool, setSelectedSchool] = useState(null)   // { id, name } | null
    const [selectedClass, setSelectedClass] = useState(null)   // string | null

    // ── data per level ──
    // Level 1: schoolsData  (List<SchoolSummaryResponse>)  — id, name, studentCount
    // Level 2: classesData  (List<ClassSummaryResponse>)   — className, studentCount
    // Level 3: studentsData (List<StudentDetailResponse>)  — full per-student fields
    const [schoolsData, setSchoolsData] = useState([])   // used for levels 1 & school-tab
    const [classesData, setClassesData] = useState([])   // level 2
    const [studentsData, setStudentsData] = useState([])   // level 3

    // ── non-student tabs ──
    const [users, setUsers] = useState([])

    // ── single-student expanded detail ──
    // Only fetched on demand when user clicks a row — NOT pre-fetched for all students.
    const [expandedRow, setExpandedRow] = useState(null)
    const [expandedUserData, setExpandedUserData] = useState({})  // { [studentId]: StudentDetailResponse }

    // ── UI state ──
    const [loading, setLoading] = useState(false)
    const [apiError, setApiError] = useState(null)
    const [successMessage, setSuccessMessage] = useState(null)
    const [saving, setSaving] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingUser, setEditingUser] = useState(null)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [userToDelete, setUserToDelete] = useState(null)
    const [validationErrors, setValidationErrors] = useState({})
    const [resetPasswordUser, setResetPasswordUser] = useState(null)
    const [formData, setFormData] = useState({ ...EMPTY_FORM })

    // schoolsData is also needed for the school-picker in the student form.
    // Keep a ref so we can load it once without creating circular dependencies.
    const schoolsForFormRef = useRef([])

    // ── roles visible to this user ──
    const roles = [
        { id: 'student', label: 'Students' },
        { id: 'school_admin', label: 'School Admin' },
        { id: 'psychologist', label: 'Psychologists' },
        { id: 'content_admin', label: 'Content Admins' },
        { id: 'schools', label: 'Schools' },
    ].filter(r => {
        if (user?.role === 'SUPER_ADMIN') return true
        if (user?.role === 'SCHOOL_ADMIN') return r.id === 'student'
        return false
    })

    // ════════════════════════════════════════════════════════════
    // DATA LOADERS  — one function per level, called explicitly.
    // No useEffect dependency chains that cause extra fetches.
    // ════════════════════════════════════════════════════════════

    /**
     * Level 1 — load school list.
     * Calls GET /api/schools  →  [{ id, name, studentCount }]
     * One request. Nothing else fires on this screen.
     */
    const loadSchools = useCallback(async () => {
        setLoading(true)
        setApiError(null)
        try {
            const res = await getSchools()           // GET /api/schools
            const list = res || []
            setSchoolsData(list)
            schoolsForFormRef.current = list         // keep for form school-picker
        } catch (err) {
            setApiError(err.message || 'Failed to load schools')
        } finally {
            setLoading(false)
        }
    }, [])

    /**
     * Level 2 — load classes for a school.
     * Calls GET /api/schools/{id}/classes  →  [{ className, studentCount }]
     * One request. No student rows fetched at this level.
     */
    const loadClasses = useCallback(async (schoolId) => {
        setLoading(true)
        setApiError(null)
        try {
            // usermanagementapi.js must expose getClassesBySchool(schoolId)
            // which calls GET /api/schools/{schoolId}/classes
            const res = await getClassesBySchool(schoolId)
            setClassesData(res || [])
        } catch (err) {
            setApiError(err.message || 'Failed to load classes')
        } finally {
            setLoading(false)
        }
    }, [])

    /**
     * Level 3 — load students for a class.
     * Calls GET /api/schools/{id}/classes/{className}/students
     * → [StudentDetailResponse]  (already has section, bloodGroup, etc.)
     * One request. No per-student getUserById() calls needed.
     */
    const loadStudents = useCallback(async (schoolId, className) => {
        setLoading(true)
        setApiError(null)
        setExpandedUserData({})   // clear cached details from previous class
        setExpandedRow(null)
        try {
            const res = await getStudentsByClass(schoolId, className)
            setStudentsData(res || [])
        } catch (err) {
            setApiError(err.message || 'Failed to load students')
        } finally {
            setLoading(false)
        }
    }, [])

    /**
     * Non-student tabs (school_admin, psychologist, content_admin).
     * Each calls its own lean endpoint — no school lookups inside.
     */
    const loadNonStudentTab = useCallback(async () => {
        setLoading(true)
        setApiError(null)
        try {
            const opts = { search: searchTerm || undefined, page: 0, size: 200 }
            let result
            if (activeTab === 'school_admin') {
                result = await getSchoolAdmins(opts)
                setUsers((result.content || []).map(u => ({ ...u, role: 'school_admin' })))
            } else if (activeTab === 'psychologist') {
                result = await getPsychologists(opts)
                setUsers((result.content || []).map(u => ({ ...u, role: 'psychologist' })))
            } else if (activeTab === 'content_admin') {
                result = await getContentAdmins(opts)
                setUsers((result.content || []).map(u => ({ ...u, role: 'content_admin' })))
            }
        } catch (err) {
            setApiError(err.message || 'Failed to load users')
        } finally {
            setLoading(false)
        }
    }, [activeTab, searchTerm])

    // ════════════════════════════════════════════════════════════
    // EFFECTS — minimal, explicit, no cascade
    // ════════════════════════════════════════════════════════════

    // Tab switch → reset drill-down, load appropriate data
    useEffect(() => {
        setSelectedSchool(null)
        setSelectedClass(null)
        setExpandedRow(null)
        setExpandedUserData({})
        setUsers([])
        setSchoolsData([])
        setClassesData([])
        setStudentsData([])

        if (activeTab === 'student' || activeTab === 'schools') {
            loadSchools()
        } else {
            loadNonStudentTab()
        }
        // If school admin, lock to their school
        if (user?.role === 'SCHOOL_ADMIN' && user.school && activeTab === 'student') {
            // We need the school id — keep a lookup after schools load
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, loadSchools])

    // searchTerm changes on non-student tabs → reload
    useEffect(() => {
        if (!['student', 'schools'].includes(activeTab)) {
            loadNonStudentTab()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm])

    // Level 1 → Level 2: school selected
    useEffect(() => {
        if (selectedSchool) {
            setSelectedClass(null)
            setStudentsData([])
            setExpandedRow(null)
            setExpandedUserData({})
            loadClasses(selectedSchool.id)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSchool])

    // Level 2 → Level 3: class selected
    useEffect(() => {
        if (selectedSchool && selectedClass) {
            loadStudents(selectedSchool.id, selectedClass)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedClass])

    // ════════════════════════════════════════════════════════════
    // NAVIGATION HELPERS
    // ════════════════════════════════════════════════════════════

    const handleSelectSchool = (school) => {
        // school = { id, name, studentCount }
        setSelectedSchool(school)
    }

    const handleSelectClass = (className) => {
        setSelectedClass(className)
    }

    const handleBack = () => {
        if (selectedClass) {
            setSelectedClass(null)
            setStudentsData([])
            setExpandedRow(null)
            setExpandedUserData({})
        } else if (selectedSchool) {
            setSelectedSchool(null)
            setClassesData([])
        }
    }

    // ════════════════════════════════════════════════════════════
    // EXPANDED ROW — fetch single student only when clicked
    // ════════════════════════════════════════════════════════════

    const toggleRow = async (studentId) => {
        if (expandedRow === studentId) {
            setExpandedRow(null)
            return
        }
        setExpandedRow(studentId)
        // Level 3 already returns full StudentDetailResponse, so expandedUserData
        // is pre-populated from studentsData. Only call API if somehow missing.
        if (!expandedUserData[studentId]) {
            const cached = studentsData.find(s => s.id === studentId)
            if (cached) {
                setExpandedUserData(prev => ({ ...prev, [studentId]: cached }))
            } else {
                try {
                    // Fallback: GET /api/schools/{sid}/classes/{cls}/students/{studentId}  
                    const full = await getStudentDetail(selectedSchool.id, selectedClass, studentId)
                    setExpandedUserData(prev => ({ ...prev, [studentId]: full }))
                } catch (err) {
                    console.error('Failed to fetch student detail', err)
                }
            }
        }
    }

    // Pre-populate expandedUserData from studentsData when level-3 loads
    useEffect(() => {
        if (studentsData.length > 0) {
            const map = {}
            studentsData.forEach(s => { map[s.id] = s })
            setExpandedUserData(map)
        }
    }, [studentsData])

    // ════════════════════════════════════════════════════════════
    // MODAL  — open/save/delete
    // ════════════════════════════════════════════════════════════

    const generatePassword = (setter = (p) => setFormData(prev => ({ ...prev, password: p }))) => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
        let pass = ''
        for (let i = 0; i < 12; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length))
        setter(pass)
    }

    const handleOpenModal = async (item = null) => {
        setValidationErrors({})
        if (item) {
            // For editing: we need full user data.
            // For students at level 3 we already have it in expandedUserData.
            let full = item
            if (item.id && activeTab === 'student') {
                full = expandedUserData[item.id] || item
                // If still missing key fields, fetch
                if (!full.section && !full.bloodGroup) {
                    try { full = await getUserById(item.id) } catch { /* keep existing */ }
                }
            } else if (item.id && activeTab !== 'schools') {
                try { full = await getUserById(item.id) } catch { /* keep existing */ }
            }
            setEditingUser(full)
            setFormData({
                name: full.name || '',
                email: full.email || '',
                role: activeTab,
                password: '',
                class: fullUser.className || fullUser.class || '',
                section: fullUser.section || '',
                school: fullUser.school || '',
                parentName: fullUser.parentName || '',
                parentPhone: fullUser.parentEmail || '',   // parentEmail field stores parent phone
                phoneNumber: fullUser.phoneNumber || '',
                dateOfBirth: fullUser.dateOfBirth || '',
                address: fullUser.address || '',
                bloodGroup: fullUser.bloodGroup || '',
                emergencyContact: fullUser.emergencyContact || '',
                contactName: fullUser.contactName || '',
                rollNo: fullUser.rollNo || '',
            })
        } else {
            setEditingUser(null)
            const schoolName = selectedSchool?.name || ''
            setFormData({
                ...EMPTY_FORM,
                role: activeTab,
                password: '',
                class: '',
                section: '',
                school: activeTab === 'student' && selectedSchool ? selectedSchool : '',
                parentName: '',
                parentPhone: '',
                phoneNumber: '',
                dateOfBirth: '',
                address: '',
                bloodGroup: '',
                emergencyContact: '',
                contactName: '',
                rollNo: '',
            })
            if (activeTab !== 'schools') generatePassword()
        }
        setIsModalOpen(true)
    }

    const validateForm = () => {
        const errors = {}
        const { name, email, school, rollNo, section, parentName, address, bloodGroup, dateOfBirth, password, phoneNumber, parentPhone } = formData

        if (!name.trim()) errors.name = 'Name is required'

        if (activeTab === 'schools') {
            if (!address?.trim()) errors.address = "Address is required"
            if (!formData.contactName?.trim()) errors.contactName = "Contact Name is required"
            if (!email?.trim()) errors.email = "Email is required"
            const dup = schoolsData.find(s => s.name.toLowerCase() === name.trim().toLowerCase() && (!editingUser || s.id !== editingUser.id))
            if (dup) errors.name = "School name already exists"
        } else {
            if (!email.trim()) errors.email = 'Email is required'
            else if (!email.includes('@')) errors.email = 'Invalid email format'
            if (!editingUser && !password?.trim()) errors.password = 'Password is required'

            if (activeTab === 'student') {
                if (!school?.trim()) errors.school = "School is required"
                if (!rollNo?.trim()) errors.rollNo = "Roll No is required"
                if (!formData.class?.trim()) errors.class = "Class is required"
                if (!section?.trim()) errors.section = "Section is required"
                if (!parentName?.trim()) errors.parentName = "Parent Name is required"
                if (!address?.trim()) errors.address = "Address is required"
                if (!bloodGroup?.trim()) errors.bloodGroup = "Blood Group is required"
                if (!dateOfBirth) errors.dateOfBirth = "Date of Birth is required"
            }
        }

        if (phoneNumber?.trim() && phoneNumber.replace(/\D/g, '').length !== 10)
            errors.phoneNumber = 'Phone number must be 10 digits'
        if (parentPhone?.trim() && parentPhone.replace(/\D/g, '').length !== 10)
            errors.parentPhone = 'Parent phone must be 10 digits'

        setValidationErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleSaveUser = async () => {
        setSuccessMessage(null)
        setApiError(null)
        if (!validateForm()) return
        setSaving(true)
        try {
            if (activeTab === 'schools') {
                await createSchool({
                    name: formData.name,
                    address: formData.address || undefined,
                    contactNumber: formData.phoneNumber || undefined,
                    contactName: formData.contactName || undefined,
                    email: formData.email || undefined,
                })
            } else {
                const payload = {
                    name: formData.name,
                    email: formData.email,
                    role: TAB_ROLE_MAP[formData.role] || formData.role,
                    password: formData.password || undefined,
                    phoneNumber: formData.phoneNumber || undefined,
                    school: formData.school || undefined,
                    className: formData.class || undefined,
                    grade: formData.class || undefined,
                    parentName: formData.parentName || undefined,
                    // FIX: parentPhone (parent's phone number) maps to parentEmail field in backend
                    parentEmail: formData.parentPhone || undefined,
                    dateOfBirth: formData.dateOfBirth || undefined,
                    address: formData.address || undefined,
                    bloodGroup: formData.bloodGroup || undefined,
                    emergencyContact: formData.emergencyContact || undefined,
                    rollNo: formData.rollNo || undefined,   // FIX: was being sent as undefined due to field name mismatch
                    section: formData.section || undefined,
                }
                if (editingUser) {
                    await updateUser(editingUser.id, payload)
                } else {
                    await createUser(payload)
                }
            }
            setIsModalOpen(false)
            setSuccessMessage(`${activeTab === 'schools' ? 'School' : 'User'} saved successfully!`)
            setTimeout(() => setSuccessMessage(null), 3000)
            await loadUsers()
        } catch (err) {
            setApiError(err.message || 'Save failed')
        } finally {
            setSaving(false)
        }
    }

    const refreshCurrentLevel = async () => {
        if (activeTab === 'schools') {
            await loadSchools()
        } else if (activeTab === 'student') {
            if (selectedClass && selectedSchool) {
                await loadStudents(selectedSchool.id, selectedClass)
            } else if (selectedSchool) {
                await loadClasses(selectedSchool.id)
            } else {
                await loadSchools()
            }
        } else {
            await loadNonStudentTab()
        }
    }

    const handleDeleteUser = (item) => {
        setUserToDelete(item)
        setIsDeleteModalOpen(true)
    }

    const confirmDelete = async () => {
        if (!userToDelete) return
        setSaving(true)
        try {
            if (activeTab === 'schools') {
                await deleteSchool(userToDelete.id)
            } else {
                await deleteUser(userToDelete.id)
            }
            showSuccess(`${activeTab === 'schools' ? 'School' : 'User'} deleted successfully!`)
            setIsDeleteModalOpen(false)
            setUserToDelete(null)
            await refreshCurrentLevel()
        } catch (err) {
            setApiError(err.message || 'Delete failed')
        } finally {
            setSaving(false)
        }
    }

    const confirmResetPassword = async () => {
        if (!resetPasswordUser) return
        setSaving(true)
        try {
            const result = await resetPassword(resetPasswordUser.id)
            const tempPwd = result.newPassword || result.temporaryPassword || '(check server logs)'
            showSuccess(`Password reset for ${resetPasswordUser.name}!\nTemporary Password: ${tempPwd}`, 10000)
            setResetPasswordUser(null)
        } catch (err) {
            setApiError(err.message || 'Password reset failed')
        } finally {
            setSaving(false)
        }
    }

    const showSuccess = (msg, ms = 3000) => {
        setSuccessMessage(msg)
        setTimeout(() => setSuccessMessage(null), ms)
    }

    // ════════════════════════════════════════════════════════════
    // FILTERED DATA for non-student tabs
    // ════════════════════════════════════════════════════════════

    const filteredUsers = users.filter(u => {
        if (!searchTerm) return true
        const s = searchTerm.toLowerCase()
        return (
            (u.name && u.name.toLowerCase().includes(s)) ||
            (u.email && u.email.toLowerCase().includes(s))
        )
    })

    const filteredStudents = studentsData.filter(u => {
        if (!searchTerm) return true
        const s = searchTerm.toLowerCase()
        return (
            (u.name && u.name.toLowerCase().includes(s)) ||
            (u.email && u.email.toLowerCase().includes(s))
        )
    })

    const addButtonLabels = {
        student: 'Add Students',
        school_admin: 'Add School Admins',
        psychologist: 'Add Psychologists',
        content_admin: 'Add Content Admins',
        schools: 'Add School',
    }
    const roleTitles = {
        student: 'Student',
        school_admin: 'School Admin',
        psychologist: 'Psychologist',
        content_admin: 'Content Admin',
        schools: 'School',
    }

    // ════════════════════════════════════════════════════════════
    // RENDER
    // ════════════════════════════════════════════════════════════

    return (
        <div className="relative">
            {/* Success toast */}
            {successMessage && (
                <div className="fixed top-4 right-4 z-[60] animate-fade-in-down">
                    <div className="bg-green-50 border-l-4 border-green-400 p-4 shadow-lg rounded-md">
                        <div className="flex items-start">
                            <svg className="h-5 w-5 text-green-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <p className="ml-3 text-sm font-medium text-green-800 whitespace-pre-wrap">{successMessage}</p>
                            <button onClick={() => setSuccessMessage(null)} className="ml-4 text-green-500">
                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {apiError && (
                <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-md flex items-center gap-3">
                    <svg className="h-5 w-5 text-red-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm font-medium text-red-800">{apiError}</p>
                </div>
            )}

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    {roles.map(role => (
                        <button
                            key={role.id}
                            onClick={() => setActiveTab(role.id)}
                            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === role.id
                                ? 'border-purple-600 text-purple-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            {role.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Action bar */}
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    {(selectedSchool || selectedClass) && activeTab === 'student' && (
                        <button onClick={handleBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
                        </button>
                    )}
                    <h3 className="text-lg font-medium text-gray-900">
                        {!selectedSchool
                            ? `Manage ${roles.find(r => r.id === activeTab)?.label}`
                            : !selectedClass
                                ? `${selectedSchool.name} Classes`
                                : `${selectedSchool.name} — ${formatClassName(selectedClass)}`
                        }
                    </h3>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md shadow-sm hover:bg-purple-700"
                >
                    <UserPlusIcon className="w-5 h-5 mr-2" />
                    {addButtonLabels[activeTab]}
                </button>
            </div>

            {/* Search */}
            <div className="mb-6 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                />
            </div>

            {/* ── VIEWS ── */}
            {activeTab === 'student' && !selectedSchool ? (
                /* School cards */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(() => {
                        const schoolsMap = {}
                        users.filter(u => u.role === 'student' && (!searchTerm || u.school?.toLowerCase().includes(searchTerm.toLowerCase()) || u.name.toLowerCase().includes(searchTerm.toLowerCase())))
                            .forEach(u => {
                                const sName = u.school || 'Unknown School'
                                if (!schoolsMap[sName]) schoolsMap[sName] = { count: 0, students: [] }
                                schoolsMap[sName].count++
                                schoolsMap[sName].students.push(u)
                            })
                        return Object.keys(schoolsMap).map(sName => (
                            <div key={sName} onClick={() => setSelectedSchool(sName)} className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg cursor-pointer">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center"><BuildingLibraryIcon className="w-6 h-6 text-purple-600" /></div>
                                    <div className="bg-purple-50 text-purple-700 text-xs font-bold px-3 py-1 rounded-full">{schoolsMap[sName].count} Students</div>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">{sName}</h3>
                            </div>
                        ))
                    })()}
                </div>
            ) : activeTab === 'student' && selectedSchool && !selectedClass ? (
                /* Class cards — FIX: group by normalized class name to avoid duplicates */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {(() => {
                        const classesMap = {}
                        users.filter(u => u.role === 'student' && u.school === selectedSchool)
                            .forEach(u => {
                                // Define rawClass before using it
                                const rawClass = u.class || u.className || 'No Class'
                                const cName = formatClassName(rawClass)

                                if (!classesMap[cName]) classesMap[cName] = { count: 0 }
                                classesMap[cName].count++
                            })
                        // Sort by class number
                        return Object.keys(classesMap)
                            .sort((a, b) => {
                                const na = parseInt(a.match(/\d+/)?.[0] || 0)
                                const nb = parseInt(b.match(/\d+/)?.[0] || 0)
                                return na - nb
                            })
                            .map(cName => (
                                <div key={cName} onClick={() => setSelectedClass(cName)} className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md cursor-pointer text-center">
                                    <AcademicCapIcon className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                                    <h3 className="text-xl font-bold">{cName}</h3>
                                    <div className="text-xs text-purple-800 bg-purple-100 px-2 py-1 rounded-full inline-block mt-1">{classesMap[cName].count} Students</div>
                                </div>
                            ))
                    })()}
                </div>
            ) : activeTab === 'schools' ? (
                /* Schools table */
                <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">School Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact Person</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {schoolsData.filter(s => !searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase())).map(school => (
                                <tr key={school.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{school.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{school.address || '-'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        <div className="font-semibold">{school.contactName || '-'}</div>
                                        <div className="text-xs text-gray-400">{school.email || school.contactNumber}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-center">
                                        <div className="flex items-center justify-center gap-3">
                                            <button onClick={() => handleOpenModal(school)} className="text-indigo-600 hover:text-indigo-800"><PencilIcon className="w-5 h-5" /></button>
                                            <button onClick={() => handleDeleteUser(school)} className="text-red-600 hover:text-red-800"><TrashIcon className="w-5 h-5" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : activeTab === 'student' && selectedSchool && selectedClass ? (
                /* ── STUDENT TABLE with expandable rows ── */
                <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent Phone</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {/* FIX: match students whose class normalizes to the selected class */}
                            {filteredUsers
                                .filter(u => {
                                    const studentClass = u.class || u.className || 'No Class'
                                    return formatClassName(studentClass) === selectedClass
                                })
                                .map(u => {
                                    const full = expandedUserData[u.id] || u   // 👈 THIS is what was missing
                                    return (
                                        <React.Fragment key={u.id}>
                                            <tr
                                                className="hover:bg-gray-50 cursor-pointer"
                                                onClick={() => toggleRow(u.id)}
                                            >
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                    <div className="flex items-center gap-2">
                                                        {expandedRow === u.id
                                                            ? <ChevronDownIcon className="w-4 h-4 text-purple-500 flex-shrink-0" />
                                                            : <ChevronRightIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                        }
                                                        {u.name}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">{u.email}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                        {formatClassName(u.class || u.className || 'No Class')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {full.section ? `Section ${full.section}` : '—'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {full.parentEmail
                                                        ? <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                            <PhoneIcon className="w-3 h-3" />{full.parentEmail}
                                                        </span>
                                                        : <span className="text-gray-300">—</span>
                                                    }
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-center" onClick={e => e.stopPropagation()}>
                                                    <div className="flex items-center justify-center gap-3">
                                                        <button onClick={() => handleOpenModal(u)} className="text-indigo-600 hover:text-indigo-800" title="Edit">
                                                            <PencilIcon className="w-5 h-5" />
                                                        </button>
                                                        <button onClick={() => handleDeleteUser(u)} className="text-red-500 hover:text-red-700" title="Delete">
                                                            <TrashIcon className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {expandedRow === u.id && (
                                                <tr className="bg-gray-50">
                                                    <td colSpan={6} className="px-8 py-4">
                                                        {(() => {
                                                            const full = expandedUserData[u.id] || u
                                                            return (
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                                                                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Blood Group</p>
                                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                                            {full.bloodGroup || '—'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                                                                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Roll No</p>
                                                                        <p className="text-sm font-semibold text-gray-800">{full.rollNo || '—'}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                                                                    <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Parent</p>
                                                                    <p className="text-sm font-semibold text-gray-800">{full.parentName || '—'}</p>
                                                                </div>
                                                            </div>
                                                            {full.address && (
                                                                <div className="mt-3 bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                                                                    <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Address</p>
                                                                    <p className="text-sm text-gray-700">{full.address}</p>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        )
                                    })}
                                    {filteredStudents.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-400">
                                                No students found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* ── Schools tab ── */}
                    {activeTab === 'schools' && (
                        <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">School Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {schoolsData
                                        .filter(s => !searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                        .map(school => (
                                            <tr key={school.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{school.name}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500">{school.studentCount}</td>
                                                <td className="px-6 py-4 text-sm text-center">
                                                    <div className="flex items-center justify-center gap-3">
                                                        <button onClick={() => handleDeleteUser(school)} className="text-red-600 hover:text-red-800">
                                                            <TrashIcon className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    }
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* ── Non-student tabs (school_admin / psychologist / content_admin) ── */}
                    {!['student', 'schools'].includes(activeTab) && (
                        <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredUsers.map(u => (
                                        <tr key={u.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{u.name}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{u.email}</td>
                                            <td className="px-6 py-4 text-sm text-center">
                                                <div className="flex items-center justify-center gap-3">
                                                    <button onClick={() => handleOpenModal(u)} className="text-indigo-600 hover:text-indigo-800">
                                                        <PencilIcon className="w-5 h-5" />
                                                    </button>
                                                    <button onClick={() => handleDeleteUser(u)} className="text-red-600 hover:text-red-800">
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* ── CREATE / EDIT MODAL ── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setIsModalOpen(false)} />
                        <div className="bg-white rounded-lg p-6 z-10 w-full max-w-2xl">
                            <h3 className="text-lg font-bold mb-4">{editingUser ? 'Edit' : 'Create'} {roleTitles[activeTab]}</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium">Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className={`mt-1 block w-full border rounded-md p-2 ${validationErrors.name ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {validationErrors.name && <p className="text-red-500 text-xs mt-1">{validationErrors.name}</p>}
                                </div>

                                    {activeTab === 'schools' ? (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium">Physical Address</label>
                                                <textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className={`mt-1 block w-full border rounded-md p-2 ${validationErrors.address ? 'border-red-500' : 'border-gray-300'}`} />
                                                {validationErrors.address && <p className="text-red-500 text-xs mt-1">{validationErrors.address}</p>}
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium">Contact Person</label>
                                                    <input type="text" value={formData.contactName} onChange={(e) => setFormData({ ...formData, contactName: e.target.value })} className={`mt-1 block w-full border rounded-md p-2 ${validationErrors.contactName ? 'border-red-500' : 'border-gray-300'}`} />
                                                    {validationErrors.contactName && <p className="text-red-500 text-xs mt-1">{validationErrors.contactName}</p>}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium">Official Email</label>
                                                    <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={`mt-1 block w-full border rounded-md p-2 ${validationErrors.email ? 'border-red-500' : 'border-gray-300'}`} />
                                                    {validationErrors.email && <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium">Phone Number</label>
                                                <input type="text" value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} className={`mt-1 block w-full border rounded-md p-2 ${validationErrors.phoneNumber ? 'border-red-500' : 'border-gray-300'}`} />
                                                {validationErrors.phoneNumber && <p className="text-red-500 text-xs mt-1">{validationErrors.phoneNumber}</p>}
                                            </div>
                                        </>
                                    ) : activeTab === 'student' ? (
                                        <>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium">Date of Birth</label>
                                                    <input type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} className={`mt-1 block w-full border rounded-md p-2 ${validationErrors.dateOfBirth ? 'border-red-500' : 'border-gray-300'}`} />
                                                    {validationErrors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{validationErrors.dateOfBirth}</p>}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium">Class</label>
                                                    <select value={formData.class} onChange={(e) => setFormData({ ...formData, class: e.target.value })} className={`mt-1 block w-full border rounded-md p-2 ${validationErrors.class ? 'border-red-500' : 'border-gray-300'}`}>
                                                        <option value="">Select Class</option>
                                                        {CLASS_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                                    </select>
                                                    {validationErrors.class && <p className="text-red-500 text-xs mt-1">{validationErrors.class}</p>}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium">Section</label>
                                                    <select value={formData.section} onChange={(e) => setFormData({ ...formData, section: e.target.value })} className={`mt-1 block w-full border rounded-md p-2 ${validationErrors.section ? 'border-red-500' : 'border-gray-300'}`}>
                                                        <option value="">Select Section</option>
                                                        <option value="A">Section A</option>
                                                        <option value="B">Section B</option>
                                                        <option value="C">Section C</option>
                                                        <option value="D">Section D</option>
                                                    </select>
                                                    {validationErrors.section && <p className="text-red-500 text-xs mt-1">{validationErrors.section}</p>}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium">Roll No</label>
                                                    <input type="text" value={formData.rollNo} onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })} className={`mt-1 block w-full border rounded-md p-2 ${validationErrors.rollNo ? 'border-red-500' : 'border-gray-300'}`} />
                                                    {validationErrors.rollNo && <p className="text-red-500 text-xs mt-1">{validationErrors.rollNo}</p>}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium">Blood Group</label>
                                                    <select value={formData.bloodGroup} onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })} className={`mt-1 block w-full border rounded-md p-2 ${validationErrors.bloodGroup ? 'border-red-500' : 'border-gray-300'}`}>
                                                        <option value="">Select Blood Group</option>
                                                        <option value="A+">A+</option>
                                                        <option value="A-">A-</option>
                                                        <option value="B+">B+</option>
                                                        <option value="B-">B-</option>
                                                        <option value="AB+">AB+</option>
                                                        <option value="AB-">AB-</option>
                                                        <option value="O+">O+</option>
                                                        <option value="O-">O-</option>
                                                    </select>
                                                    {validationErrors.bloodGroup && <p className="text-red-500 text-xs mt-1">{validationErrors.bloodGroup}</p>}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium">Email</label>
                                                    <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={`mt-1 block w-full border rounded-md p-2 ${validationErrors.email ? 'border-red-500' : 'border-gray-300'}`} />
                                                    {validationErrors.email && <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium">Password</label>
                                                    <div className="flex gap-2">
                                                        <input type="text" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className={`mt-1 block w-full border rounded-md p-2 ${validationErrors.password ? 'border-red-500' : 'border-gray-300'}`} />
                                                        <button onClick={generatePassword} type="button" className="mt-1 bg-gray-100 px-3 rounded-md text-sm border border-gray-300">Gen</button>
                                                    </div>
                                                    {validationErrors.password && <p className="text-red-500 text-xs mt-1">{validationErrors.password}</p>}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium">Parent Name</label>
                                                    <input type="text" value={formData.parentName} onChange={(e) => setFormData({ ...formData, parentName: e.target.value })} className={`mt-1 block w-full border rounded-md p-2 ${validationErrors.parentName ? 'border-red-500' : 'border-gray-300'}`} />
                                                    {validationErrors.parentName && <p className="text-red-500 text-xs mt-1">{validationErrors.parentName}</p>}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium">Parent Phone Number</label>
                                                    <input type="text" value={formData.parentPhone} onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })} placeholder="10-digit mobile number" className={`mt-1 block w-full border rounded-md p-2 ${validationErrors.parentPhone ? 'border-red-500' : 'border-gray-300'}`} />
                                                    {validationErrors.parentPhone && <p className="text-red-500 text-xs mt-1">{validationErrors.parentPhone}</p>}
                                                </div>
                                                {(user?.role === 'SUPER_ADMIN' || editingUser) && (
                                                    <div>
                                                        <label className="block text-sm font-medium">School</label>
                                                        <select value={formData.school} onChange={(e) => setFormData({ ...formData, school: e.target.value })} className={`mt-1 block w-full border rounded-md p-2 ${validationErrors.school ? 'border-red-500' : 'border-gray-300'}`}>
                                                            <option value="">Select School</option>
                                                            {schoolsData.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                                        </select>
                                                        {validationErrors.school && <p className="text-red-500 text-xs mt-1">{validationErrors.school}</p>}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium">Address</label>
                                                <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className={`mt-1 block w-full border rounded-md p-2 ${validationErrors.address ? 'border-red-500' : 'border-gray-300'}`} />
                                                {validationErrors.address && <p className="text-red-500 text-xs mt-1">{validationErrors.address}</p>}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium">Email</label>
                                                    <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={`mt-1 block w-full border rounded-md p-2 ${validationErrors.email ? 'border-red-500' : 'border-gray-300'}`} />
                                                    {validationErrors.email && <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium">Phone Number</label>
                                                    <input type="text" value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} className={`mt-1 block w-full border rounded-md p-2 ${validationErrors.phoneNumber ? 'border-red-500' : 'border-gray-300'}`} />
                                                    {validationErrors.phoneNumber && <p className="text-red-500 text-xs mt-1">{validationErrors.phoneNumber}</p>}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium">Password</label>
                                                <div className="flex gap-2">
                                                    <input type="text" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className={`mt-1 block w-full border rounded-md p-2 ${validationErrors.password ? 'border-red-500' : 'border-gray-300'}`} />
                                                    <button onClick={generatePassword} type="button" className="bg-gray-100 px-3 rounded-md text-sm border border-gray-300">Generate</button>
                                                </div>
                                                {validationErrors.password && <p className="text-red-500 text-xs mt-1">{validationErrors.password}</p>}
                                            </div>
                                            {activeTab === 'school_admin' && user?.role === 'SUPER_ADMIN' && (
                                                <div className="mt-4">
                                                    <label className="block text-sm font-medium">School</label>
                                                    <select value={formData.school} onChange={(e) => setFormData({ ...formData, school: e.target.value })} className={`mt-1 block w-full border rounded-md p-2 ${validationErrors.school ? 'border-red-500' : 'border-gray-300'}`}>
                                                        <option value="">Select School</option>
                                                        {schoolsData.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                                    </select>
                                                    {validationErrors.school && <p className="text-red-500 text-xs mt-1">{validationErrors.school}</p>}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                                <div className="mt-6 flex justify-end gap-3">
                                    <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                                    <button onClick={handleSaveUser} disabled={saving} className="px-4 py-2 bg-purple-600 text-white rounded-md disabled:opacity-50">
                                        {saving ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Delete modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setIsDeleteModalOpen(false)} />
                    <div className="bg-white p-6 rounded-lg z-10 max-w-sm w-full text-center">
                        <TrashIcon className="h-12 w-12 text-red-600 mx-auto mb-4" />
                        <h3 className="text-lg font-bold">Delete {activeTab === 'schools' ? 'School' : 'User'}?</h3>
                        <p className="text-sm text-gray-500 mt-2">
                            Are you sure you want to delete <strong>{userToDelete?.name}</strong>? This cannot be undone.
                        </p>
                        <div className="mt-6 flex gap-3">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-md">Cancel</button>
                            <button onClick={confirmDelete} disabled={saving} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md disabled:opacity-50">
                                {saving ? 'Deleting…' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}