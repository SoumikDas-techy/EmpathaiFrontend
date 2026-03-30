import { useState, useEffect } from 'react'
import {
  CalculatorIcon,
  BeakerIcon,
  BookOpenIcon,
  GlobeAltIcon,
  LanguageIcon,
  PaintBrushIcon,
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
  LockClosedIcon,
  StarIcon,
  CheckCircleIcon,
  PlayCircleIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'

export default function Curriculum({ user, setActiveTab, navigateToChat }) {
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [selectedChapter, setSelectedChapter] = useState(null)
  const [quizAnswer, setQuizAnswer] = useState('')
  const [showQuizResult, setShowQuizResult] = useState(false)
  const [showMoodModal, setShowMoodModal] = useState(false)
  const [showBreakModal, setShowBreakModal] = useState(false)
  const [showMathProgressModal, setShowMathProgressModal] = useState(false)

  useEffect(() => {
    if (selectedSubject === 'Mathematics') {
      setShowMathProgressModal(true)
    }
  }, [selectedSubject])

  const mathChapters = [
    { id: 1, name: 'Rational Numbers', completed: true, progress: 100 },
    { id: 2, name: 'Linear Equations in One Variable', completed: true, progress: 100 },
    { id: 3, name: 'Understanding Quadrilaterals', completed: true, progress: 100 },
    { id: 4, name: 'Practical Geometry', completed: true, progress: 100 },
    { id: 5, name: 'Data Handling', completed: true, progress: 100 },
    { id: 6, name: 'Squares and Square Roots', completed: true, progress: 100 },
    { id: 7, name: 'Cubes and Cube Roots', completed: true, progress: 100 },
    { id: 8, name: 'Comparing Quantities', completed: true, progress: 100 },
    { id: 9, name: 'Algebraic Expressions and Identities', completed: false, progress: 60 },
    { id: 10, name: 'Visualising Solid Shapes', completed: false, progress: 0 },
    { id: 11, name: 'Mensuration', completed: false, progress: 0 },
    { id: 12, name: 'Exponents and Powers', completed: false, progress: 0 }
  ]
  const subjects = [
    {
      name: 'Mathematics',
      chapters: 12,
      completed: 8,
      icon: CalculatorIcon,
      color: 'blue',
      topics: ['Algebra', 'Geometry', 'Statistics']
    },
    {
      name: 'Science',
      chapters: 18,
      completed: 11,
      icon: BeakerIcon,
      color: 'green',
      topics: ['Physics', 'Chemistry', 'Biology']
    },
    {
      name: 'English',
      chapters: 10,
      completed: 7,
      icon: BookOpenIcon,
      color: 'purple',
      topics: ['Literature', 'Grammar', 'Writing']
    },
    {
      name: 'Social Studies',
      chapters: 15,
      completed: 6,
      icon: GlobeAltIcon,
      color: 'orange',
      topics: ['History', 'Geography', 'Civics']
    },
    {
      name: 'Hindi',
      chapters: 8,
      completed: 5,
      icon: LanguageIcon,
      color: 'red',
      topics: ['Literature', 'Grammar', 'Composition']
    },
    {
      name: 'Art & Craft',
      chapters: 6,
      completed: 4,
      icon: PaintBrushIcon,
      color: 'pink',
      topics: ['Drawing', 'Painting', 'Crafts']
    }
  ]

  const getProgressPercentage = (completed, total) => {
    return Math.round((completed / total) * 100)
  }

  return (
    <div className="font-lora">
      {selectedChapter ? (
        <div>
          <div className="mb-6">
            <button
              onClick={() => setSelectedChapter(null)}
              className="flex items-center space-x-2 text-purple-600 hover:text-purple-800 mb-4"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span>Back to Chapters</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedChapter.name}</h1>
            <p className="text-gray-600">Chapter {selectedChapter.id} - Mathematics Class 8</p>
          </div>

          <div className="bg-white border-2 border-purple-200 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📚 Learning Objectives</h2>
            <ul className="space-y-2 text-gray-700">
              <li>• Understand algebraic expressions and their components</li>
              <li>• Learn about algebraic identities and their applications</li>
              <li>• Practice factorization techniques</li>
              <li>• Solve problems using algebraic identities</li>
            </ul>
          </div>

          <div className="bg-white border-2 border-purple-200 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">🎥 Video Lesson</h2>
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/NybHckSEQBI"
                title="Algebraic Expressions and Identities"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Duration: 15 minutes</p>
                <p className="text-sm text-gray-600">Progress: {selectedChapter.progress}% complete</p>
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-purple-200 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📚 Chapter Overview</h2>
            <p className="text-gray-700 mb-4">
              Algebraic expressions are mathematical phrases that contain numbers, variables, and operations.
              In this chapter, you'll learn how to work with expressions like 3x + 5 and discover powerful
              identities that make solving complex problems easier.
            </p>
            <p className="text-gray-700 mb-4">
              You'll explore the fundamental building blocks of algebra, including terms, coefficients, and variables.
              We'll cover important algebraic identities such as (a+b)² = a² + 2ab + b² and learn how to apply
              them in real-world problem solving scenarios.
            </p>
            <p className="text-gray-700 mb-4">
              By the end of this chapter, you'll be able to simplify complex expressions, factor polynomials,
              and use algebraic identities to solve mathematical problems efficiently. This foundation will
              prepare you for advanced topics in mathematics.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigateToChat('Algebraic Expressions')}
                className="flex items-center space-x-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm hover:bg-purple-200 transition-colors"
                title="Ask ChatBuddy about Algebraic Expressions"
              >
                <ChatBubbleLeftRightIcon className="w-4 h-4" />
                <span>Algebraic Expressions</span>
              </button>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">Mathematical Identities</span>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">Factorization</span>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">Polynomials</span>
            </div>
          </div>

          <div className="bg-white border-2 border-purple-200 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">🧠 Quick Quiz</h2>
            <div className="mb-4">
              <p className="text-gray-900 font-medium mb-4">
                Which of the following is an algebraic expression?
              </p>
              <div className="space-y-2">
                <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-purple-300 cursor-pointer">
                  <input
                    type="radio"
                    name="quiz"
                    value="A"
                    onChange={(e) => setQuizAnswer(e.target.value)}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <span>A) 5 + 3 = 8</span>
                </label>
                <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-purple-300 cursor-pointer">
                  <input
                    type="radio"
                    name="quiz"
                    value="B"
                    onChange={(e) => setQuizAnswer(e.target.value)}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <span>B) 3x + 5</span>
                </label>
                <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-purple-300 cursor-pointer">
                  <input
                    type="radio"
                    name="quiz"
                    value="C"
                    onChange={(e) => setQuizAnswer(e.target.value)}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <span>C) x = 10</span>
                </label>
                <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-purple-300 cursor-pointer">
                  <input
                    type="radio"
                    name="quiz"
                    value="D"
                    onChange={(e) => setQuizAnswer(e.target.value)}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <span>D) 25</span>
                </label>
              </div>
            </div>

            <button
              onClick={() => setShowQuizResult(true)}
              disabled={!quizAnswer}
              className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Answer
            </button>

            {showQuizResult && (
              <div className={`mt-4 p-4 rounded-lg ${quizAnswer === 'B' ? 'bg-green-50 border border-green-200' : 'bg-green-50 border border-green-200'
                }`}>
                <p className={`font-medium ${quizAnswer === 'B' ? 'text-green-800' : 'text-green-800'
                  }`}>
                  {quizAnswer === 'B' ? '✓ Correct!' : '✗ Incorrect - But that\'s okay!'}
                </p>
                {quizAnswer === 'B' ? (
                  <p className="text-sm text-gray-700 mt-2">
                    Great job! 3x + 5 is indeed an algebraic expression because it contains a variable (x)
                    combined with numbers and operations.
                  </p>
                ) : (
                  <div className="mt-2">
                    <p className="text-sm text-gray-700 mb-3">
                      Don't worry - mistakes help us learn! 😊 Let me explain why B) 3x + 5 is the correct answer:
                    </p>
                    <div className="bg-white p-3 rounded border">
                      <p className="text-sm font-medium text-gray-800 mb-2">Step-by-step explanation:</p>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• <strong>A) 5 + 3 = 8</strong> - This is an equation (has an equals sign)</li>
                        <li>• <strong>B) 3x + 5</strong> - This is an algebraic expression (has variable x)</li>
                        <li>• <strong>C) x = 10</strong> - This is an equation (has an equals sign)</li>
                        <li>• <strong>D) 25</strong> - This is just a number (no variables or operations)</li>
                      </ul>
                    </div>
                    <p className="text-sm text-purple-700 mt-3 font-medium">
                      🌟 Remember: Algebraic expressions have variables (like x, y) combined with numbers and operations, but no equals sign!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => setShowMoodModal(true)}
              className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              Mark as Complete
            </button>
          </div>
        </div>
      ) : selectedSubject === 'Mathematics' ? (
        <div>
          <div className="mb-6">
            <button
              onClick={() => setSelectedSubject(null)}
              className="flex items-center space-x-2 text-purple-600 hover:text-purple-800 mb-4"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span>Back to Subjects</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mathematics - Class 8</h1>
            <p className="text-gray-600">Complete all 12 levels to master mathematics</p>
          </div>

          <div className="relative max-w-5xl mx-auto py-8">
            {/* Journey Connector Line */}
            <div className="absolute left-4 md:left-1/2 transform md:-translate-x-1/2 top-4 bottom-4 w-1 bg-black rounded-full"></div>

            {mathChapters.map((chapter, index) => {
              const isEven = index % 2 === 0
              const isLocked = !chapter.completed && chapter.progress === 0 && index > 0 && !mathChapters[index - 1].completed
              const isActive = !chapter.completed && !isLocked

              return (
                <div key={chapter.id} className={`relative flex flex-col md:flex-row items-center mb-12 last:mb-0 group ${isEven ? 'md:flex-row-reverse' : ''}`}>

                  {/* Chapter Card */}
                  <div className={`w-full md:w-[45%] pl-12 md:pl-0 ${isEven ? 'md:pl-10' : 'md:pr-10'}`}>
                    <div className={`relative bg-white border-2 rounded-2xl p-5 transition-all duration-500 z-10 ${isLocked ? 'border-gray-100 opacity-80 shadow-sm' :
                        isActive ? 'border-purple-400 ring-4 ring-purple-100 shadow-2xl shadow-purple-200/50 scale-105 -rotate-1 hover:scale-110 hover:rotate-0 hover:shadow-purple-300 cursor-pointer animate-float' :
                          'border-purple-200 ring-4 ring-purple-50 shadow-sm hover:scale-[1.02] hover:shadow-lg'
                      }`}>
                      {/* Gamified Header */}
                      <div className="flex justify-between items-start mb-3">
                        <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${chapter.completed ? 'bg-green-100 text-green-700' :
                          isLocked ? 'bg-gray-100 text-gray-500' : 'bg-purple-100 text-purple-700'
                          }`}>
                          Level {index + 1}
                        </div>
                        {chapter.completed && <div className="flex text-yellow-400 gap-0.5"><StarIconSolid className="w-4 h-4" /><StarIconSolid className="w-4 h-4" /><StarIconSolid className="w-4 h-4" /></div>}
                      </div>

                      <h3 className={`font-black text-lg mb-2 ${isLocked ? 'text-gray-500' : 'text-dark-navy'}`}>{chapter.name}</h3>

                      {!isLocked && (
                        <div className="mb-4">
                          <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                            <span>Progress</span>
                            <span className={chapter.completed ? 'text-green-600' : 'text-purple-600'}>{chapter.progress}%</span>
                          </div>
                          <div className="bg-gray-100 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-1000 ${chapter.completed ? 'bg-green-500' : 'bg-purple-500'}`}
                              style={{ width: `${chapter.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => {
                          if (!isLocked && chapter.id === 9) {
                            setSelectedChapter(chapter)
                          }
                        }}
                        disabled={isLocked}
                        className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${isLocked ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                          chapter.completed ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                            'bg-black text-white hover:bg-gray-800 shadow-lg shadow-black/10'
                          }`}
                      >
                        {isLocked ? <LockClosedIcon className="w-4 h-4" /> :
                          chapter.completed ? <CheckCircleIcon className="w-4 h-4" /> : <PlayCircleIcon className="w-4 h-4" />}
                        {isLocked ? 'Locked' : chapter.completed ? 'Replay Level' : 'Start Mission'}
                      </button>

                      {/* Connector to center line (Desktop) */}
                      <div className={`hidden md:block absolute top-1/2 -translate-y-1/2 w-10 h-0.5 border-t-2 border-dashed ${isLocked ? 'border-gray-300' : 'border-black'} ${isEven ? '-left-10' : '-right-10'}`}></div>
                    </div>
                  </div>

                  {/* Central Node */}
                  <div className="absolute left-4 md:left-1/2 transform -translate-x-1/2 flex items-center justify-center w-12 h-12 z-20">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 shadow-xl transition-all ${isLocked ? 'bg-gray-100 border-gray-200 text-gray-400' :
                      chapter.completed ? 'bg-green-500 border-green-200 text-white scale-110' :
                        'bg-purple-600 border-purple-200 text-white animate-pulse'
                      }`}>
                      {isLocked ? <LockClosedIcon className="w-5 h-5" /> :
                        chapter.completed ? <StarIconSolid className="w-5 h-5" /> :
                          <span className="font-bold text-sm">{index + 1}</span>}
                    </div>
                  </div>

                  {/* Empty Spacer for alternating layout */}
                  <div className="hidden md:block md:w-[45%]"></div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Curriculum</h1>
            <p className="text-gray-600">CBSE Class 8 subjects with interactive learning modules</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((subject, index) => {
              const progressPercentage = getProgressPercentage(subject.completed, subject.chapters)
              return (
                <div key={index} className="bg-white border-2 border-purple-200 rounded-xl p-6 hover:border-purple-300 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 bg-${subject.color}-100 rounded-lg flex items-center justify-center`}>
                        <subject.icon className={`w-6 h-6 text-${subject.color}-600`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{subject.name}</h3>
                        <p className="text-sm text-gray-600">{subject.completed}/{subject.chapters} chapters</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-purple-600">{progressPercentage}%</span>
                  </div>

                  <div className="mb-4">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Key Topics:</p>
                    <div className="flex flex-wrap gap-1">
                      {subject.topics.map((topic, topicIndex) => (
                        <span key={topicIndex} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => subject.name === 'Mathematics' ? setSelectedSubject('Mathematics') : null}
                    className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    {subject.name === 'Mathematics' ? 'Start Learning' : 'Continue Learning'}
                  </button>
                </div>
              )
            })}
          </div>

          <div className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Progress Overview</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">67%</div>
                <p className="text-sm text-gray-600">Overall Progress</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">41</div>
                <p className="text-sm text-gray-600">Chapters Completed</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">69</div>
                <p className="text-sm text-gray-600">Total Chapters</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mood Check-in Modal */}
      {showMoodModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-purple-200 rounded-2xl shadow-xl p-8 w-full max-w-md relative">
            <button
              onClick={() => setShowMoodModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>

            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">How are you feeling now? 😊</h3>
              <p className="text-gray-600 mb-6">Let us know how you're feeling after completing this chapter</p>

              <div className="flex justify-center space-x-6 mb-8">
                <button
                  onClick={() => {
                    setShowMoodModal(false)
                    setShowBreakModal(true)
                  }}
                  className="flex flex-col items-center p-4 rounded-lg hover:bg-green-50 transition-colors"
                >
                  <span className="text-4xl mb-2">😊</span>
                  <span className="text-sm text-gray-700">Great</span>
                </button>
                <button
                  onClick={() => {
                    setShowMoodModal(false)
                    setShowBreakModal(true)
                  }}
                  className="flex flex-col items-center p-4 rounded-lg hover:bg-yellow-50 transition-colors"
                >
                  <span className="text-4xl mb-2">😐</span>
                  <span className="text-sm text-gray-700">Okay</span>
                </button>
                <button
                  onClick={() => {
                    setShowMoodModal(false)
                    setShowBreakModal(true)
                  }}
                  className="flex flex-col items-center p-4 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <span className="text-4xl mb-2">😔</span>
                  <span className="text-sm text-gray-700">Tired</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Break Modal */}
      {showBreakModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-purple-200 rounded-2xl shadow-xl p-8 w-full max-w-md relative">
            <button
              onClick={() => setShowBreakModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>

            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Take a 2-minute break! ⏰</h3>
              <p className="text-gray-600 mb-6">You've done great work! Taking short breaks helps your brain process and remember what you've learned.</p>

              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-6 mb-6">
                <div className="text-6xl mb-4">🧘‍♀️</div>
                <p className="text-gray-700 text-sm">Stretch, take deep breaths, or just relax for a moment</p>
              </div>

              <button
                onClick={() => {
                  setShowBreakModal(false)
                  setSelectedChapter(null)
                }}
                className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                I'm Ready to Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Math Progress Modal */}
      {showMathProgressModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] border-2 border-purple-200 shadow-2xl p-10 w-full max-w-md text-center relative animate-in fade-in zoom-in duration-300">
            <div className="absolute inset-0 bg-gradient-to-b from-purple-50/50 to-transparent rounded-[2.5rem] -z-10"></div>

            <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-yellow-200/50 animate-float border-4 border-white ring-4 ring-yellow-50">
              <span className="text-5xl">🏆</span>
            </div>

            <h2 className="text-3xl font-black text-black mb-3 italic tracking-tight">Mission Status!</h2>
            <p className="text-black font-bold mb-8 text-lg">You have conquered <span className="text-green-600 font-black">60%</span> of the Mathematics Kingdom!</p>

            <div className="bg-white border-2 border-purple-100 rounded-2xl p-5 mb-8 shadow-sm relative overflow-hidden">
              <div className="flex justify-between text-xs font-black uppercase tracking-widest text-black mb-2">
                <span>Current Progress</span>
                <span className="text-green-600">6000 XP</span>
              </div>
              <div className="bg-purple-50 rounded-full h-4 p-1">
                <div className="bg-green-500 h-full rounded-full w-[60%] shadow-sm shadow-green-200 relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
              <p className="text-xs text-center mt-3 text-black font-bold">4 Levels Remaining until Mastery</p>
            </div>

            <button
              onClick={() => setShowMathProgressModal(false)}
              className="w-full bg-black text-white font-black py-4 rounded-2xl hover:bg-gray-800 transition-all shadow-xl shadow-black/10 text-lg flex items-center justify-center gap-2 group"
            >
              <span>Conquer Next Levels</span>
              <span className="group-hover:translate-x-1 transition-transform">🚀</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}