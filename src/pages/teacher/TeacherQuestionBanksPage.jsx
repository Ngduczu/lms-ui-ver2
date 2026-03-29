import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, RefreshCcw, Search, Trash2 } from 'lucide-react';
import { createQuestionBankApi, createQuestionInBankApi, deleteQuestionBankApi, deleteQuestionInBankApi, getQuestionBanksApi, getQuestionsByBankApi, updateQuestionBankApi, updateQuestionInBankApi } from '../../api/questionApi';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { PageHeader } from '../../components/ui/PageHeader';
import { Modal } from '../../components/ui/Modal';
import { Pagination } from '../../components/ui/Pagination';
import { confirmAction, notifySuccess } from '../../lib/notify';

function getTypeLabel(v) { const u = (v || '').toUpperCase(); return u === 'MULTIPLE_CHOICE' ? 'Trắc nghiệm' : u === 'FILL_IN_BLANK' ? 'Điền khuyết' : v || '-'; }
function getDiffLabel(v) { const u = (v || '').toUpperCase(); return u === 'EASY' ? 'Dễ' : u === 'MEDIUM' ? 'Vừa' : u === 'HARD' ? 'Khó' : v || '-'; }

export function TeacherQuestionBanksPage() {
  const [banks, setBanks] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [selectedBankId, setSelectedBankId] = useState('');
  const [qLoading, setQLoading] = useState(false);
  const [error, setError] = useState('');
  const [bankSearch, setBankSearch] = useState('');
  const [qSearch, setQSearch] = useState('');
  const [qPage, setQPage] = useState(0);
  const [qTotalPages, setQTotalPages] = useState(1);

  const [showCreateBank, setShowCreateBank] = useState(false);
  const [bankName, setBankName] = useState('');
  const [showEditBank, setShowEditBank] = useState(false);
  const [editBankName, setEditBankName] = useState('');

  const [showCreateQ, setShowCreateQ] = useState(false);
  const [showEditQ, setShowEditQ] = useState(false);
  const [editingQId, setEditingQId] = useState('');
  const initQForm = { questionType: 'MULTIPLE_CHOICE', difficulty: 'EASY', questionContent: '', fillBlankAnswer: '', mcqAnswers: ['', ''], correctIndex: 0 };
  const [qForm, setQForm] = useState({ ...initQForm });
  const [editQForm, setEditQForm] = useState({ ...initQForm });

  const selectedBank = banks.find((b) => String(b.id) === String(selectedBankId));

  const fetchBanks = useCallback(async () => {
    try { 
      const d = await getQuestionBanksApi({ page: 0, size: 200, search: bankSearch || undefined }); 
      const b = d?.content || []; 
      setBanks(b); 
      setSelectedBankId((p) => {
        if (!p && b.length > 0) return String(b[0].id);
        if (p && !b.find(x => String(x.id) === p) && b.length > 0) return String(b[0].id);
        return p;
      }); 
    } catch (e) { setError(e.message); }
  }, [bankSearch]);

  useEffect(() => { fetchBanks(); }, [fetchBanks]);

  useEffect(() => {
    setQPage(0);
  }, [selectedBankId, qSearch]);

  const fetchQ = useCallback(async (bankId) => { 
    setQLoading(true); 
    try { 
      const d = await getQuestionsByBankApi(bankId, { page: qPage, size: 20, search: qSearch || undefined }); 
      setQuestions(d?.content || []); 
      setQTotalPages(d?.totalPages || 1);
    } catch (e) { setError(e.message); } finally { setQLoading(false); } 
  }, [qPage, qSearch]);

  useEffect(() => { 
    if (selectedBankId) fetchQ(selectedBankId); else { setQuestions([]); setQTotalPages(1); }
  }, [selectedBankId, fetchQ]);

  function buildAnswers(f) {
    if (f.questionType === 'FILL_IN_BLANK') {
      if (!f.fillBlankAnswer.trim()) throw new Error('Nhập đáp án.');
      return [{ textAnswer: f.fillBlankAnswer.trim(), isCorrect: true, correct: true }];
    }
    const opts = f.mcqAnswers.map((a, i) => ({ value: a.trim(), index: i })).filter((a) => a.value);
    if (opts.length < 2) throw new Error('Cần ít nhất 2 đáp án.');
    return opts.map((a) => ({ textAnswer: a.value, isCorrect: a.index === f.correctIndex, correct: a.index === f.correctIndex }));
  }

  async function handleCreateBank(e) { e.preventDefault(); if (!bankName.trim()) return; try { const c = await createQuestionBankApi({ name: bankName.trim() }); notifySuccess('Đã tạo.'); setBankName(''); setShowCreateBank(false); await fetchBanks(); if (c?.id) setSelectedBankId(String(c.id)); } catch (e) { setError(e.message); } }
  async function handleUpdateBank(e) { e.preventDefault(); if (!editBankName.trim()) return; try { await updateQuestionBankApi(selectedBankId, { name: editBankName.trim() }); notifySuccess('Đã cập nhật.'); setShowEditBank(false); fetchBanks(); } catch (e) { setError(e.message); } }
  async function handleDeleteBank() { const ok = await confirmAction({ title: 'Xóa ngân hàng?', message: 'Bạn chắc chắn?', confirmText: 'Xóa', variant: 'danger' }); if (!ok) return; try { await deleteQuestionBankApi(selectedBankId); notifySuccess('Đã xóa.'); setSelectedBankId(''); setQuestions([]); fetchBanks(); } catch (e) { setError(e.message); } }

  async function handleCreateQ(e) { e.preventDefault(); if (!qForm.questionContent.trim()) { setError('Nhập nội dung.'); return; } try { const ans = buildAnswers(qForm); await createQuestionInBankApi(selectedBankId, { questionType: qForm.questionType, difficulty: qForm.difficulty, questionContent: qForm.questionContent.trim(), answers: ans }); notifySuccess('Đã thêm.'); setQForm({ ...initQForm }); setShowCreateQ(false); fetchQ(selectedBankId); fetchBanks(); } catch (e) { setError(e.message); } }

  function openEditQ(q) {
    const type = q.questionType || 'MULTIPLE_CHOICE';
    const answers = q.answers || [];
    if (type === 'FILL_IN_BLANK') { setEditQForm({ questionType: type, difficulty: q.difficulty || 'EASY', questionContent: q.questionContent || '', fillBlankAnswer: answers.find((a) => a.isCorrect)?.textAnswer || '', mcqAnswers: ['', ''], correctIndex: 0 }); }
    else { const mcq = answers.map((a) => a.textAnswer || ''); setEditQForm({ questionType: 'MULTIPLE_CHOICE', difficulty: q.difficulty || 'EASY', questionContent: q.questionContent || '', fillBlankAnswer: '', mcqAnswers: mcq.length >= 2 ? mcq : ['', ''], correctIndex: Math.max(0, answers.findIndex((a) => a.isCorrect)) }); }
    setEditingQId(String(q.id)); setShowEditQ(true);
  }

  async function handleUpdateQ(e) { e.preventDefault(); if (!editQForm.questionContent.trim()) { setError('Nhập nội dung.'); return; } try { const ans = buildAnswers(editQForm); await updateQuestionInBankApi(selectedBankId, editingQId, { questionType: editQForm.questionType, difficulty: editQForm.difficulty, questionContent: editQForm.questionContent.trim(), answers: ans }); notifySuccess('Đã cập nhật.'); setShowEditQ(false); fetchQ(selectedBankId); fetchBanks(); } catch (e) { setError(e.message); } }

  async function handleDeleteQ(qId) { const ok = await confirmAction({ title: 'Xóa câu hỏi?', confirmText: 'Xóa', variant: 'danger' }); if (!ok) return; try { await deleteQuestionInBankApi(selectedBankId, qId); notifySuccess('Đã xóa.'); fetchQ(selectedBankId); fetchBanks(); } catch (e) { setError(e.message); } }

  function renderQForm(form, setF, onSubmit, isEdit) {
    return (
      <form onSubmit={onSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="field-group"><label className="field-label">Loại</label><select className="input-field" value={form.questionType} onChange={(e) => setF((p) => ({ ...p, questionType: e.target.value, fillBlankAnswer: '', mcqAnswers: ['', ''], correctIndex: 0 }))}><option value="MULTIPLE_CHOICE">Trắc nghiệm</option><option value="FILL_IN_BLANK">Điền khuyết</option></select></div>
        <div className="field-group"><label className="field-label">Độ khó</label><select className="input-field" value={form.difficulty} onChange={(e) => setF((p) => ({ ...p, difficulty: e.target.value }))}><option value="EASY">Dễ</option><option value="MEDIUM">Vừa</option><option value="HARD">Khó</option></select></div>
        <div className="field-group" style={{ gridColumn: 'span 2' }}><label className="field-label">Nội dung</label><textarea className="input-field" rows={3} value={form.questionContent} onChange={(e) => setF((p) => ({ ...p, questionContent: e.target.value }))} /></div>
        {form.questionType === 'MULTIPLE_CHOICE' ? (
          <div className="field-group" style={{ gridColumn: 'span 2' }}>
            <label className="field-label">Đáp án</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {form.mcqAnswers.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="radio" name={isEdit ? 'editA' : 'createA'} checked={form.correctIndex === i} onChange={() => setF((p) => ({ ...p, correctIndex: i }))} />
                  <input className="input-field" value={a} onChange={(e) => setF((p) => ({ ...p, mcqAnswers: p.mcqAnswers.map((v, idx) => idx === i ? e.target.value : v) }))} placeholder={`Đáp án ${i + 1}`} />
                </div>
              ))}
              <button type="button" className="btn-secondary btn-sm" style={{ width: 'fit-content' }} onClick={() => setF((p) => ({ ...p, mcqAnswers: [...p.mcqAnswers, ''] }))}>+ Thêm đáp án</button>
            </div>
          </div>
        ) : (
          <div className="field-group" style={{ gridColumn: 'span 2' }}><label className="field-label">Đáp án đúng</label><input className="input-field" value={form.fillBlankAnswer} onChange={(e) => setF((p) => ({ ...p, fillBlankAnswer: e.target.value }))} /></div>
        )}
        <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button type="button" className="btn-secondary" onClick={() => { if (isEdit) setShowEditQ(false); else { setShowCreateQ(false); setQForm({ ...initQForm }); } }}>Hủy</button>
          <button type="submit" className="btn-primary">{isEdit ? 'Lưu' : 'Thêm câu hỏi'}</button>
        </div>
      </form>
    );
  }

  return (
    <DashboardLayout title="Ngân hàng câu hỏi" subtitle="Tạo và quản lý câu hỏi cho bài thi, bài luyện tập.">
      <PageHeader title="Ngân hàng câu hỏi" actions={
        <>
          <button className="btn-secondary btn-sm" onClick={fetchBanks}><RefreshCcw size={14} /> Làm mới</button>
          <button className="btn-primary btn-sm" onClick={() => setShowCreateBank(true)}><Plus size={14} /> Tạo ngân hàng</button>
        </>
      } />

      {error ? <p className="text-error" style={{ marginBottom: '0.75rem' }}>{error}</p> : null}

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.25rem' }}>
        {/* Bank list */}
        <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Danh sách ngân hàng</h3>
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <Search size={14} style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input className="input-field" style={{ paddingLeft: '1.75rem', fontSize: '0.8125rem', padding: '0.375rem 0.75rem 0.375rem 1.75rem' }} placeholder="Tìm ngân hàng..." value={bankSearch} onChange={(e) => setBankSearch(e.target.value)} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, overflowY: 'auto' }}>
            {banks.map((b) => (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <button className={`bank-item ${String(selectedBankId) === String(b.id) ? 'bank-item-active' : ''}`} onClick={() => setSelectedBankId(String(b.id))} style={{ flex: 1 }}>
                  {b.name} <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>({b.questionCount || 0})</span>
                </button>
                {String(selectedBankId) === String(b.id) ? <button className="btn-icon" onClick={() => { setEditBankName(b.name); setShowEditBank(true); }}><Pencil size={14} /></button> : null}
              </div>
            ))}
            {!banks.length ? <p style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>Chưa có ngân hàng nào.</p> : null}
          </div>
        </div>

        {/* Questions */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {selectedBank ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h3 style={{ fontWeight: 700 }}>{selectedBank.name} <span className="badge badge-gray">{selectedBank.questionCount || 0} câu</span></h3>
                <div style={{ position: 'relative', width: '16rem' }}>
                  <Search size={14} style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input className="input-field" style={{ paddingLeft: '1.75rem', fontSize: '0.8125rem', padding: '0.375rem 0.75rem 0.375rem 1.75rem' }} placeholder="Tìm nội dung câu hỏi..." value={qSearch} onChange={(e) => setQSearch(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.375rem' }}>
                <button className="btn-danger btn-sm" onClick={handleDeleteBank}><Trash2 size={14} /> Xóa ngân hàng</button>
                <button className="btn-primary btn-sm" onClick={() => setShowCreateQ(true)}><Plus size={14} /> Thêm câu hỏi</button>
              </div>
            </div>
          ) : null}

          <div className="table-container" style={{ flex: 1 }}>
            <table className="data-table">
              <thead><tr><th>Nội dung</th><th>Loại</th><th>Độ khó</th><th className="cell-center">Hành động</th></tr></thead>
              <tbody>
                {questions.map((q) => (
                  <tr key={q.id}>
                    <td><span className="text-ellipsis-1" style={{ maxWidth: '24rem' }}>{q.questionContent}</span></td>
                    <td>{getTypeLabel(q.questionType)}</td>
                    <td>{getDiffLabel(q.difficulty)}</td>
                    <td className="cell-center">
                      <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                        <button className="btn-secondary btn-sm" onClick={() => openEditQ(q)}><Pencil size={14} /></button>
                        <button className="btn-danger btn-sm" onClick={() => handleDeleteQ(q.id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!questions.length && !qLoading ? <tr><td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>{selectedBank ? 'Chưa có câu hỏi.' : 'Chọn ngân hàng.'}</td></tr> : null}
              </tbody>
            </table>
          </div>
          {qTotalPages > 1 ? (
            <div style={{ marginTop: '1rem' }}>
              <Pagination page={qPage} totalPages={qTotalPages} onPageChange={setQPage} />
            </div>
          ) : null}
        </div>
      </div>

      {/* Create Bank Modal */}
      <Modal open={showCreateBank} onClose={() => { setBankName(''); setShowCreateBank(false); }} title="Tạo ngân hàng câu hỏi">
        <form onSubmit={handleCreateBank} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="field-group"><label className="field-label">Tên</label><input className="input-field" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="VD: Ngân hàng Java cơ bản" /></div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}><button type="button" className="btn-secondary" onClick={() => setShowCreateBank(false)}>Hủy</button><button type="submit" className="btn-primary">Tạo</button></div>
        </form>
      </Modal>

      {/* Edit Bank Modal */}
      <Modal open={showEditBank} onClose={() => setShowEditBank(false)} title="Sửa tên ngân hàng">
        <form onSubmit={handleUpdateBank} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="field-group"><label className="field-label">Tên mới</label><input className="input-field" value={editBankName} onChange={(e) => setEditBankName(e.target.value)} /></div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}><button type="button" className="btn-secondary" onClick={() => setShowEditBank(false)}>Hủy</button><button type="submit" className="btn-primary">Lưu</button></div>
        </form>
      </Modal>

      {/* Create Question Modal */}
      <Modal open={showCreateQ} onClose={() => { setShowCreateQ(false); setQForm({ ...initQForm }); }} title={`Thêm câu hỏi cho: ${selectedBank?.name || ''}`} maxWidth="48rem">
        {renderQForm(qForm, setQForm, handleCreateQ, false)}
      </Modal>

      {/* Edit Question Modal */}
      <Modal open={showEditQ} onClose={() => setShowEditQ(false)} title="Sửa câu hỏi" maxWidth="48rem">
        {renderQForm(editQForm, setEditQForm, handleUpdateQ, true)}
      </Modal>
    </DashboardLayout>
  );
}
