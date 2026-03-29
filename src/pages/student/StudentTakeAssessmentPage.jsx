import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ChevronLeft, ChevronRight, Clock, Moon, Send, Sun } from 'lucide-react';
import { getAssessmentDetailApi, startAssessmentAttemptApi, submitAssessmentAttemptApi } from '../../api/assessmentApi';
import { confirmAction, notifyError, notifySuccess } from '../../lib/notify';

export function StudentTakeAssessmentPage() {
  const navigate = useNavigate();
  const { assessmentId = '' } = useParams();
  const [assessment, setAssessment] = useState(null);
  const [attemptId, setAttemptId] = useState('');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState('');
  const timerRef = useRef(null);

  // Fullscreen helpers
  const requestFullscreen = () => { try { document.documentElement.requestFullscreen?.() || document.documentElement.webkitRequestFullscreen?.(); } catch {} };
  const exitFullscreen = () => { try { document.exitFullscreen?.() || document.webkitExitFullscreen?.(); } catch {} };

  // Fetch assessment
  const fetchAssessment = useCallback(async () => {
    try { const d = await getAssessmentDetailApi(assessmentId); setAssessment(d); } catch (e) { setError(e.message); }
  }, [assessmentId]);

  useEffect(() => { fetchAssessment(); return () => clearInterval(timerRef.current); }, [fetchAssessment]);

  const [starting, setStarting] = useState(false);

  // Start attempt
  async function handleStart() {
    if (starting) return;
    setStarting(true);
    try {
      const d = await startAssessmentAttemptApi(assessmentId);
      setAttemptId(d?.attemptId || d?.id || '');
      setQuestions(d?.questions || []);
      setRemainingSeconds(d?.remainingSeconds || (assessment?.durationSeconds || 3600));
      setStarted(true);
      requestFullscreen();
    } catch (e) { setError(e.message); }
    finally { setStarting(false); }
  }

  // Timer
  useEffect(() => {
    if (!started || submitted) return;
    timerRef.current = setInterval(() => {
      setRemainingSeconds((p) => {
        if (p <= 1) { handleSubmit(true); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [started, submitted]);

  // Violation detection — fullscreen exit + tab switch + visibility change
  useEffect(() => {
    if (!started || submitted) return;

    function onFullscreenChange() {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        setViolationCount((p) => {
          const next = p + 1;
          notifyError(`⚠ Vi phạm #${next}: Bạn đã thoát chế độ toàn màn hình!`);
          return next;
        });
        // Force back
        setTimeout(requestFullscreen, 300);
      }
    }

    function onBlur() {
      setViolationCount((p) => {
        const next = p + 1;
        notifyError(`⚠ Vi phạm #${next}: Bạn đã chuyển sang cửa sổ/tab khác!`);
        return next;
      });
    }

    function onVisibilityChange() {
      if (document.hidden) {
        setViolationCount((p) => {
          const next = p + 1;
          notifyError(`⚠ Vi phạm #${next}: Trang bị ẩn (có thể chuyển tab)!`);
          return next;
        });
      }
    }

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [started, submitted]);

  function handleSelectAnswer(question, answerItemOrText) {
    const qid = question.questionId || question.id;
    const type = (question.questionTypeSnapshot || question.questionType || '').toUpperCase();
    if (type === 'MULTIPLE_CHOICE') {
      setAnswers((p) => ({ ...p, [qid]: { answerId: answerItemOrText.id || answerItemOrText.answerId, answerText: answerItemOrText.text || answerItemOrText.textAnswer } }));
    } else {
      setAnswers((p) => ({ ...p, [qid]: { answerId: null, answerText: answerItemOrText } }));
    }
  }

  async function handleSubmit(isTimeout = false) {
    if (submitted || submitting) return;
    if (!isTimeout) {
      const ok = await confirmAction({ title: 'Nộp bài?', message: 'Bạn chắc chắn muốn nộp bài? Sau khi nộp không thể thay đổi.', confirmText: 'Nộp bài', variant: 'primary' });
      if (!ok) return;
    }
    setSubmitting(true);
    clearInterval(timerRef.current);
    const payload = { 
      violationCount, 
      answers: questions.map((q) => {
        const qid = q.questionId || q.id;
        const ans = answers[qid] || {};
        return { questionId: qid, answerId: ans.answerId || null, answerText: ans.answerText || '' };
      }) 
    };
    try {
      await submitAssessmentAttemptApi(assessmentId, attemptId, payload);
      notifySuccess(isTimeout ? 'Hết thời gian — đã tự động nộp bài.' : 'Nộp bài thành công!');
      setSubmitted(true);
      exitFullscreen();
    } catch (e) { notifyError(e.message); }
    finally { setSubmitting(false); }
  }

  // Format timer
  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const timerStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const isUrgent = remainingSeconds <= 60;

  const q = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;

  if (submitted) {
    return (
      <div className={`assessment-shell ${darkMode ? 'assessment-dark' : 'assessment-light'}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center', padding: '2rem' }}>
        <div style={{ width: '5rem', height: '5rem', borderRadius: '50%', background: 'linear-gradient(135deg, #059669, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <Send size={28} style={{ color: '#fff' }} />
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Đã nộp bài!</h1>
        <p style={{ color: '#64748b', marginBottom: '0.75rem' }}>Số lần vi phạm: <span style={{ fontWeight: 700, color: violationCount > 0 ? '#dc2626' : '#059669' }}>{violationCount}</span></p>
        <button className="btn-primary" onClick={() => navigate(-1)}>Quay lại</button>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="assessment-shell assessment-light" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center', padding: '2rem' }}>
        <div className="card" style={{ maxWidth: '28rem', width: '100%', padding: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>{assessment?.title || 'Bài thi'}</h1>
          <p style={{ color: '#64748b', marginBottom: '1rem' }}>Thời gian: {Math.round((assessment?.durationSeconds || 0) / 60)} phút</p>
          <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '1.25rem', fontSize: '0.8125rem', color: '#92400e', textAlign: 'left' }}>
            <strong>⚠ Lưu ý:</strong>
            <ul style={{ margin: '0.375rem 0 0', paddingLeft: '1rem', listStyleType: 'disc' }}>
              <li>Bài thi sẽ chạy ở chế độ toàn màn hình.</li>
              <li>Thoát fullscreen, chuyển tab, alt-tab sẽ bị ghi nhận vi phạm.</li>
              <li>Hết thời gian bài thi sẽ tự động nộp.</li>
            </ul>
          </div>
          {error ? <p className="text-error" style={{ marginBottom: '0.75rem' }}>{error}</p> : null}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <button className="btn-secondary" onClick={() => navigate(-1)} disabled={starting}>Hủy</button>
            <button className="btn-primary" onClick={handleStart} disabled={starting}>
              {starting ? 'Đang chuẩn bị...' : 'Bắt đầu làm bài'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`assessment-shell ${darkMode ? 'assessment-dark' : 'assessment-light'}`}>
      {/* Topbar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--color-border)', background: darkMode ? 'rgba(15,23,42,0.9)' : 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)' }}>
        <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>{assessment?.title || 'Bài thi'}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {violationCount > 0 ? <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#dc2626', fontWeight: 600, fontSize: '0.8125rem' }}><AlertTriangle size={14} /> {violationCount} vi phạm</span> : null}
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 700, fontSize: '1rem', fontFamily: 'monospace', color: isUrgent ? '#dc2626' : undefined }}><Clock size={16} />{timerStr}</span>
          <button className="btn-icon" onClick={() => setDarkMode((p) => !p)} title="Đổi theme">{darkMode ? <Sun size={18} /> : <Moon size={18} />}</button>
          <button className="btn-primary btn-sm" onClick={() => handleSubmit(false)} disabled={submitting}><Send size={14} /> Nộp bài</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.5rem', padding: '1.5rem', maxWidth: '72rem', margin: '0 auto' }}>
        {/* Question area */}
        <div>
          {/* Progress */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.375rem' }}>
              <span>Câu {currentIdx + 1}/{questions.length}</span>
              <span>{answeredCount}/{questions.length} đã trả lời</span>
            </div>
            <div className="assessment-progress-bar">
              <div className="assessment-progress-fill" style={{ width: `${(answeredCount / Math.max(questions.length, 1)) * 100}%` }} />
            </div>
          </div>

          {q ? (
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1.05rem' }}>Câu {currentIdx + 1}: {q.questionContentSnapshot || q.questionContent}</h3>

              {(q.questionTypeSnapshot || q.questionType || '').toUpperCase() === 'MULTIPLE_CHOICE' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {(q.answerOptions || q.answers || []).map((a, i) => {
                    const qid = q.questionId || q.id;
                    const ansId = a.id || a.answerId;
                    const ansText = a.text || a.textAnswer;
                    const sel = answers[qid]?.answerId === ansId;
                    return (
                      <button key={i} className={`assessment-option ${sel ? 'assessment-option-selected' : ''}`} onClick={() => handleSelectAnswer(q, a)}>
                        <span className="assessment-option-index">{String.fromCharCode(65 + i)}</span>
                        <span>{ansText}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="field-group">
                  <input className="input-field" placeholder="Nhập đáp án..." value={answers[q.questionId || q.id]?.answerText || ''} onChange={(e) => handleSelectAnswer(q, e.target.value)} />
                </div>
              )}

              {/* Nav buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
                <button className="btn-secondary" disabled={currentIdx <= 0} onClick={() => setCurrentIdx((p) => Math.max(0, p - 1))}><ChevronLeft size={16} /> Câu trước</button>
                <button className="btn-secondary" disabled={currentIdx >= questions.length - 1} onClick={() => setCurrentIdx((p) => Math.min(questions.length - 1, p + 1))}>Câu sau <ChevronRight size={16} /></button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Question nav sidebar */}
        <div className="card" style={{ padding: '1rem', alignSelf: 'start', position: 'sticky', top: '4.5rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.875rem' }}>Bảng câu hỏi</h4>
          <div className="question-nav-grid">
            {questions.map((q, i) => {
              const qid = q.questionId || q.id;
              const isActive = i === currentIdx;
              const isAnswered = Boolean(answers[qid]?.answerId || (answers[qid]?.answerText && answers[qid].answerText.trim()));
              return (
                <button key={qid} className={`question-nav-btn ${isActive ? 'question-nav-btn-active' : ''} ${isAnswered ? 'question-nav-btn-answered' : ''}`} onClick={() => setCurrentIdx(i)}>
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#64748b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.25rem' }}><span style={{ width: '0.75rem', height: '0.75rem', borderRadius: '0.25rem', background: '#dcfce7', border: '1px solid #86efac' }} /> Đã trả lời</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><span style={{ width: '0.75rem', height: '0.75rem', borderRadius: '0.25rem', border: '1.5px solid var(--color-primary)' }} /> Đang xem</div>
          </div>
        </div>
      </div>
    </div>
  );
}
