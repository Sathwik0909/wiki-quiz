import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Search,
  History,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  ChevronRight,
  ExternalLink,
  Loader2,
  AlertCircle,
  Trophy,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// eslint-disable-next-line no-undef
const API_BASE =  import.meta.env.REACT_APP_API_URL;


function App() {
  const [activeTab, setActiveTab] = useState('generate');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  const [takeQuizMode, setTakeQuizMode] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [revealed, setRevealed] = useState({}); // { [idx]: boolean }

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_BASE}/quizzes`);
      setHistory(res.data);
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    setError(null);
    setCurrentQuiz(null);
    setTakeQuizMode(false);
    setScore(null);
    setUserAnswers({});

    try {
      const res = await axios.post(`${API_BASE}/generate-quiz?url=${encodeURIComponent(url)}`);
      setCurrentQuiz(res.data);
      setTakeQuizMode(true); // New quiz starts in active mode
      setScore(null);
      setUserAnswers({});
      setRevealed({});
      fetchHistory();
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong. Please check the URL.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (id) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/quizzes/${id}`);
      setCurrentQuiz(res.data);
      setActiveTab('generate');
      setTakeQuizMode(false); // History starts in review mode
      setScore({ preview: true }); // Unlock UI for review
      setUserAnswers({});
      setRevealed({});
    } catch (err) {
      setError("Failed to load quiz details.");
    } finally {
      setLoading(false);
    }
  };

  const submitQuiz = () => {
    let correctCount = 0;
    currentQuiz.questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.answer) {
        correctCount++;
      }
    });
    setScore({
      correct: correctCount,
      total: currentQuiz.questions.length
    });
    setRevealed({}); // Reset revealed on submit
  };

  const toggleReveal = (idx) => {
    setRevealed(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const resetQuiz = () => {
    setUserAnswers({});
    setScore(null);
    setRevealed({});
    setTakeQuizMode(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary-600 p-2 rounded-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Wiki Quiz
            </h1>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('generate')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${activeTab === 'generate' ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20' : 'text-slate-400 hover:text-white'}`}
            >
              <Search className="w-4 h-4" />
              <span>Generate</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${activeTab === 'history' ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20' : 'text-slate-400 hover:text-white'}`}
            >
              <History className="w-4 h-4" />
              <span>Past Quizzes</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {activeTab === 'generate' ? (
            <motion.div
              key="generate"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="glass p-8 rounded-3xl space-y-6">
                <div className="text-center max-w-2xl mx-auto space-y-2">
                  <h2 className="text-3xl font-bold">Turn any Wikipedia article into a quiz</h2>
                  <p className="text-slate-400">Enter a Wikipedia URL below and let our AI do the magic.</p>
                </div>

                <form onSubmit={handleGenerate} className="flex gap-4 max-w-3xl mx-auto">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://en.wikipedia.org/wiki/..."
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all text-lg"
                      required
                    />
                  </div>
                  <button
                    disabled={loading}
                    className="bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg shadow-primary-900/20 flex items-center gap-2 transition-all"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate Quiz'}
                  </button>
                </form>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl flex items-center gap-3 max-w-3xl mx-auto">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}
              </div>

              {currentQuiz && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                >
                  <div className="lg:col-span-2 space-y-6">
                    <div className="glass p-8 rounded-3xl space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-bold">{currentQuiz.title}</h3>
                        {!takeQuizMode ? (
                          <button
                            onClick={resetQuiz}
                            className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-primary-900/20 transition-all flex items-center gap-2"
                          >
                            <Trophy className="w-4 h-4" />
                            Retake Quiz
                          </button>
                        ) : (
                          <div className="bg-primary-600/10 text-primary-400 border border-primary-500/20 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest">
                            Quiz Active
                          </div>
                        )}
                      </div>
                      {(!takeQuizMode || (score && !score.preview)) ? (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-slate-300 leading-relaxed"
                        >
                          {currentQuiz.summary}
                        </motion.p>
                      ) : (
                        <div className="bg-slate-900/40 p-6 rounded-2xl border border-dashed border-slate-800 text-center">
                          <p className="text-slate-500 italic text-sm">
                            "The summary and key article details are hidden while the quiz is active to ensure a fair test. Finish the quiz to unlock the full article breakdown!"
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xl font-semibold px-2">
                        {score && !score.preview ? 'Quiz Results' : takeQuizMode ? 'Take the Quiz' : 'Quiz Details'}
                      </h4>
                      {currentQuiz.questions.map((q, idx) => (
                        <div key={idx} className="glass p-6 rounded-2xl space-y-4 card-hover">
                          <div className="flex items-start justify-between gap-4">
                            <p className="text-lg font-medium">{idx + 1}. {q.question_text}</p>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${q.difficulty === 'easy' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                              q.difficulty === 'medium' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                                'bg-red-500/10 text-red-500 border border-red-500/20'
                              }`}>
                              {q.difficulty}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {q.options.map((opt, optIdx) => (
                              <button
                                key={optIdx}
                                onClick={() => takeQuizMode && !score && setUserAnswers({ ...userAnswers, [idx]: opt })}
                                disabled={score !== null && !score.preview}
                                className={`p-5 rounded-2xl text-left border-2 transition-all duration-300 font-medium ${takeQuizMode
                                    ? userAnswers[idx] === opt
                                      ? (score && opt !== q.answer)
                                        ? 'bg-red-500/20 border-red-500 text-red-400'
                                        : 'bg-primary-600/30 border-primary-500 text-white shadow-[0_0_15px_rgba(14,165,233,0.3)] scale-[1.02]'
                                      : 'bg-slate-800/40 border-slate-700 hover:border-slate-500 text-slate-300'
                                    : opt === q.answer
                                      ? 'bg-green-500/20 border-green-500/50 text-green-100'
                                      : 'bg-slate-800/40 border-slate-700 text-slate-400'
                                  } ${(score !== null || !takeQuizMode) && opt === q.answer
                                    ? 'bg-green-500/20 border-green-500 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]'
                                    : ''
                                  }`}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center text-xs border border-slate-600">
                                    {String.fromCharCode(65 + optIdx)}
                                  </span>
                                  {opt}
                                </div>
                              </button>
                            ))}
                          </div>

                          {((score !== null && !score.preview) || !takeQuizMode) && (
                            <div className="pt-2">
                              <button
                                onClick={() => toggleReveal(idx)}
                                className={`text-sm font-semibold flex items-center gap-2 transition-all ${revealed[idx] ? 'text-primary-400' : 'text-slate-500 hover:text-slate-300'}`}
                              >
                                {revealed[idx] ? 'Close Explanation' : 'Reveal Explanation'}
                                <ChevronRight className={`w-4 h-4 transition-transform ${revealed[idx] ? 'rotate-90' : ''}`} />
                              </button>

                              <AnimatePresence>
                                {revealed[idx] && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="mt-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 shadow-inner">
                                      <p className="text-sm text-slate-300 leading-relaxed">
                                        <span className="text-primary-400 font-bold mr-2 uppercase tracking-wider text-[10px]">Context:</span>
                                        {q.explanation}
                                      </p>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}
                        </div>
                      ))}

                      {takeQuizMode && !score && (
                        <button
                          onClick={submitQuiz}
                          className="w-full bg-primary-600 hover:bg-primary-500 text-white py-4 rounded-2xl font-bold shadow-xl shadow-primary-900/30 transition-all flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          Submit Quiz to Reveal Answers
                        </button>
                      )}

                      {score && !score.preview && (
                        <div className="space-y-4">
                          <div className="glass p-10 rounded-[2.5rem] text-center space-y-6 border-2 border-primary-500/30 shadow-[0_0_50px_rgba(14,165,233,0.15)] relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-50" />
                            <Trophy className="w-20 h-20 text-yellow-500 mx-auto drop-shadow-[0_0_20px_rgba(234,179,8,0.4)]" />
                            <div className="space-y-1">
                              <p className="text-6xl font-black text-white">{score.correct} <span className="text-2xl text-slate-500">/ {score.total}</span></p>
                              <p className="text-xl font-bold text-slate-300">
                                {score.correct === score.total ? 'Perfect Score! 🌟' : score.correct > score.total / 2 ? 'Great Job! 👍' : 'Keep Learning! 📚'}
                              </p>
                              <p className="text-slate-400 pt-2">Check the correct answers and explanations above.</p>
                            </div>
                          </div>
                          <button
                            onClick={resetQuiz}
                            className="w-full bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-2xl font-bold transition-all border border-slate-700"
                          >
                            Restart Quiz
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <AnimatePresence>
                      {(!takeQuizMode || (score && !score.preview)) && (
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="space-y-6 sticky top-24"
                        >
                          <div className="glass p-6 rounded-3xl space-y-6">
                            <div>
                              <h4 className="flex items-center gap-2 font-bold mb-4">
                                <HelpCircle className="w-5 h-5 text-primary-400" />
                                Key Entities
                              </h4>
                              <div className="space-y-4">
                                {['people', 'organizations', 'locations'].map((category) => (
                                  <div key={category}>
                                    <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-2">{category}</p>
                                    <div className="flex flex-wrap gap-2">
                                      {currentQuiz.key_entities[category]?.map((item, i) => (
                                        <span key={i} className="bg-slate-800 border border-slate-700 px-3 py-1 rounded-full text-sm">
                                          {item}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="border-t border-slate-800 pt-6">
                              <h4 className="flex items-center gap-2 font-bold mb-4">
                                <ExternalLink className="w-5 h-5 text-primary-400" />
                                Related Topics
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {currentQuiz.related_topics.map((topic, i) => (
                                  <a
                                    key={i}
                                    href={`https://en.wikipedia.org/wiki/${topic.replace(/ /g, '_')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-primary-900/20 text-primary-400 hover:bg-primary-600 hover:text-white px-3 py-1 rounded-full text-sm border border-primary-500/20 transition-all"
                                  >
                                    {topic}
                                  </a>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {takeQuizMode && !score && (
                      <div className="glass p-6 rounded-3xl text-center border-dashed border-2 border-slate-800">
                        <Loader2 className="w-8 h-8 text-slate-700 mx-auto mb-2 animate-spin" />
                        <p className="text-slate-500 text-sm font-medium italic">
                          Solve the quiz to unlock article insights and related topics!
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-3xl font-bold">Quiz History</h2>
              <div className="glass rounded-3xl overflow-hidden border border-slate-800">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-800/50 border-b border-slate-700">
                      <th className="px-6 py-4 font-bold text-slate-300">Article Title</th>
                      <th className="px-6 py-4 font-bold text-slate-300">Generated Date</th>
                      <th className="px-6 py-4 font-bold text-slate-300">URL</th>
                      <th className="px-6 py-4 font-bold text-slate-300 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item) => (
                      <tr key={item.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-all group">
                        <td className="px-6 py-4 font-medium">{item.title}</td>
                        <td className="px-6 py-4 text-slate-400 text-sm">
                          {new Date(item.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-sm truncate max-w-xs">{item.url}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleViewDetails(item.id)}
                            className="text-primary-500 hover:text-primary-400 font-semibold flex items-center gap-1 ml-auto group-hover:gap-2 transition-all"
                          >
                            Details
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {history.length === 0 && (
                      <tr>
                        <td colSpan="4" className="px-6 py-12 text-center text-slate-500 italic">
                          No quizzes generated yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
