'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

type SurveyConfig = {
  question: string;
  answers: string[];
};

function getSurveyConfig(pathname: string): SurveyConfig {
  if (pathname === '/') {
    return {
      question: 'Does this homepage make you want to explore?',
      answers: ['Yes', 'Sort of', 'No']
    };
  }
  if (pathname === '/forsale') {
    return {
      question: 'Are the filters and listings clear to you?',
      answers: ['Yes', 'Sort of', 'No']
    };
  }
  if (pathname.startsWith('/boat/')) {
    return {
      question: 'Is the information on this boat sufficient?',
      answers: ['Yes', 'Sort of', 'No']
    };
  }
  if (pathname === '/pricing') {
    return {
      question: 'Are the plans and pricing easy to understand?',
      answers: ['Yes', 'Sort of', 'No']
    };
  }
  if (pathname === '/list-boat') {
    return {
      question: 'Is the listing process straightforward?',
      answers: ['Yes', 'Sort of', 'No']
    };
  }
  if (pathname === '/contact') {
    return {
      question: 'Did you easily find how to contact us?',
      answers: ['Yes', 'Sort of', 'No']
    };
  }
  if (pathname === '/forum') {
    return {
      question: 'Does the forum meet your expectations?',
      answers: ['Yes', 'Sort of', 'No']
    };
  }
  return {
    question: 'What do you think of this new version of the site?',
    answers: ['Great', 'Good', 'Needs work']
  };
}

const ANSWER_EMOJI: Record<string, string> = {
  Yes: '👍',
  'Sort of': '😐',
  No: '👎',
  Great: '🔥',
  Good: '👍',
  'Needs work': '🛠️'
};

export default function SurveyWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [loading, setLoading] = useState(false);

  const config = getSurveyConfig(pathname);
  const storageKey = `survey_done_${pathname}`;

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && localStorage.getItem(storageKey)) {
        setHidden(true);
      } else {
        setHidden(false);
      }
    } catch {}
    setIsOpen(false);
    setSelectedAnswer(null);
    setComment('');
    setSubmitted(false);
  }, [pathname]);

  async function handleSubmit() {
    if (!selectedAnswer || loading) return;
    setLoading(true);
    try {
      await fetch('/api/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: pathname,
          question: config.question,
          answer: selectedAnswer,
          comment: comment.trim() || null
        })
      });
      try {
        localStorage.setItem(storageKey, '1');
      } catch {}
      setSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        setHidden(true);
      }, 2000);
    } catch {
      // silent fail — no ux disruption
    } finally {
      setLoading(false);
    }
  }

  if (hidden) return null;

  return (
    <div className="fixed bottom-6 right-4 z-[9990] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="survey-panel"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="mb-2 bg-darkgrey text-white rounded-2xl shadow-2xl w-72 max-w-[calc(100vw-2rem)] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <span className="text-xs font-semibold text-articblue uppercase tracking-wider">
                Quick Feedback
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-smokygrey hover:text-white transition-colors text-lg leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="px-4 pb-4">
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-4 text-center"
                >
                  <p className="text-2xl mb-1">🙏</p>
                  <p className="text-sm text-smokygrey">
                    Thanks for your feedback!
                  </p>
                </motion.div>
              ) : (
                <>
                  <p className="text-sm text-white/90 mb-3 leading-snug">
                    {config.question}
                  </p>

                  {/* Answer buttons */}
                  <div className="flex gap-2 mb-3">
                    {config.answers.map((ans) => (
                      <button
                        key={ans}
                        onClick={() => setSelectedAnswer(ans)}
                        className={`flex-1 py-2 px-1 rounded-xl text-xs font-medium transition-all duration-150 border ${
                          selectedAnswer === ans
                            ? 'bg-articblue border-articblue text-white'
                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <span className="block text-base mb-0.5">
                          {ANSWER_EMOJI[ans] ?? '✓'}
                        </span>
                        {ans}
                      </button>
                    ))}
                  </div>

                  {/* Optional comment */}
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Any comments? (optional)"
                    maxLength={300}
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-xl text-xs text-white/80 placeholder-white/30 px-3 py-2 resize-none focus:outline-none focus:border-articblue transition-colors mb-3"
                  />

                  <button
                    onClick={handleSubmit}
                    disabled={!selectedAnswer || loading}
                    className={`w-full py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      selectedAnswer && !loading
                        ? 'bg-articblue text-white hover:brightness-110 active:scale-95'
                        : 'bg-white/10 text-white/30 cursor-not-allowed'
                    }`}
                  >
                    {loading ? 'Sending…' : 'Send'}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle tab */}
      <motion.button
        onClick={() => setIsOpen((v) => !v)}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 bg-darkgrey text-white text-xs font-medium px-4 py-2.5 rounded-full shadow-lg border border-white/10 hover:border-articblue/50 hover:bg-[#2e3033] transition-all duration-150"
        aria-label={isOpen ? 'Close feedback' : 'Give feedback'}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-articblue shrink-0"
        >
          <path
            d="M12.25 1.75H1.75C1.2 1.75 0.75 2.2 0.75 2.75V9.25C0.75 9.8 1.2 10.25 1.75 10.25H4.25L7 12.25L9.75 10.25H12.25C12.8 10.25 13.25 9.8 13.25 9.25V2.75C13.25 2.2 12.8 1.75 12.25 1.75Z"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-white/80">Your feedback</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-white/40 text-[10px]"
        >
          ▲
        </motion.span>
      </motion.button>
    </div>
  );
}
