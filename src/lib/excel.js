import * as XLSX from 'xlsx-js-style';

/**
 * Parse an Excel (.xlsx) file into an array of user objects.
 * Expected columns: Họ và tên | Email | Mật khẩu | Số điện thoại | Vai trò
 */
export function parseUsersFromExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        const users = rows.map((row, idx) => {
          const fullName = String(row['Họ và tên'] || row['fullName'] || row['Full Name'] || row['Ho va ten'] || '').trim();
          const email = String(row['Email'] || row['email'] || '').trim();
          const password = String(row['Mật khẩu'] || row['password'] || row['Password'] || row['Mat khau'] || '').trim();
          const phoneNumber = String(row['Số điện thoại'] || row['phoneNumber'] || row['Phone'] || row['So dien thoai'] || '').trim();
          const roleRaw = String(row['Vai trò'] || row['role'] || row['Role'] || row['Vai tro'] || 'STUDENT').trim().toUpperCase();

          let role = 'STUDENT';
          if (roleRaw.includes('ADMIN')) role = 'ADMIN';
          else if (roleRaw.includes('TEACHER') || roleRaw.includes('GIẢNG') || roleRaw.includes('GV')) role = 'TEACHER';

          return { fullName, email, password, phoneNumber, role, _row: idx + 2 };
        });

        resolve(users);
      } catch (err) {
        reject(new Error('Không thể đọc file Excel. Vui lòng kiểm tra định dạng file.'));
      }
    };
    reader.onerror = () => reject(new Error('Lỗi khi đọc file.'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Export assessment attempt details to an Excel file.
 * Format: Tên người dùng | Email | Giờ bắt đầu | Giờ nộp bài | Số lần vi phạm | Điểm | Câu 1 | Câu 2 | ...
 * Correct answers are highlighted green, wrong ones red.
 */
export function exportAssessmentToExcel({ attempts, assessmentTitle, questions }) {
  const wb = XLSX.utils.book_new();

  // Build header row
  const headerRow = ['Tên người dùng', 'Email', 'Giờ bắt đầu', 'Giờ nộp bài', 'Số lần vi phạm', 'Điểm'];
  const questionCount = questions?.length || 0;
  for (let i = 1; i <= questionCount; i++) {
    headerRow.push(`Câu ${i}`);
  }

  const wsData = [headerRow];
  const cellStyles = []; // Track cells to color: { row, col, correct }

  (attempts || []).forEach((attempt, attemptIdx) => {
    const row = [
      attempt.studentName || '-',
      attempt.studentEmail || '-',
      formatDT(attempt.startTime),
      formatDT(attempt.submitTime),
      attempt.violationCount ?? 0,
      attempt.score ?? '-',
    ];

    const details = attempt.questionDetails || [];
    for (let qIdx = 0; qIdx < questionCount; qIdx++) {
      const standardQ = questions[qIdx];
      const detail = details.find(d => String(d.questionId) === String(standardQ.questionId || standardQ.id));

      if (detail) {
        row.push(detail.selectedAnswerSnapshot || '(bỏ trống)');
        const isCorrect = Boolean(detail.isCorrect ?? detail.correct);
        cellStyles.push({ row: attemptIdx + 1, col: 6 + qIdx, correct: isCorrect });
      } else {
        row.push('(bỏ trống)');
        cellStyles.push({ row: attemptIdx + 1, col: 6 + qIdx, correct: false });
      }
    }

    wsData.push(row);
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Apply cell styles (green for correct, red for wrong)
  cellStyles.forEach(({ row, col, correct }) => {
    const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
    if (!ws[cellRef]) ws[cellRef] = { v: '(bỏ trống)', t: 's' };
    ws[cellRef].s = {
      fill: {
        fgColor: { rgb: correct ? 'C6EFCE' : 'FFC7CE' },
      },
      font: {
        color: { rgb: correct ? '006100' : '9C0006' },
      },
    };
  });

  // Auto-width columns
  const colWidths = headerRow.map((h, i) => {
    let max = h.length;
    wsData.forEach((r) => {
      const val = String(r[i] || '');
      if (val.length > max) max = val.length;
    });
    return { wch: Math.min(max + 2, 40) };
  });
  ws['!cols'] = colWidths;

  // Style header row
  headerRow.forEach((_, i) => {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: i });
    if (ws[cellRef]) {
      ws[cellRef].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '4F46E5' } },
        alignment: { horizontal: 'center' },
      };
    }
  });

  XLSX.utils.book_append_sheet(wb, ws, 'Kết quả bài thi');

  const safeTitle = (assessmentTitle || 'ket-qua').replace(/[^a-zA-Z0-9_\-ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ ]/g, '_');
  XLSX.writeFile(wb, `${safeTitle}_ket-qua.xlsx`, { bookSST: false, type: 'binary' });
}

function formatDT(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('vi-VN');
}

/**
 * Generate a template Excel file for importing users.
 */
export function downloadUserImportTemplate() {
  const wb = XLSX.utils.book_new();
  const wsData = [
    ['Họ và tên', 'Email', 'Mật khẩu', 'Số điện thoại', 'Vai trò'],
    ['Nguyễn Văn A', 'nguyenvana@utc.edu.vn', 'Password@123', '0912345678', 'STUDENT'],
    ['Trần Thị B', 'tranthib@utc.edu.vn', 'Password@123', '0987654321', 'TEACHER'],
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = [{ wch: 20 }, { wch: 30 }, { wch: 18 }, { wch: 15 }, { wch: 12 }];

  // Style header
  for (let i = 0; i < 5; i++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: i });
    if (ws[cellRef]) {
      ws[cellRef].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '4F46E5' } },
      };
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Mẫu Import');
  XLSX.writeFile(wb, 'mau_import_nguoi_dung.xlsx');
}

/**
 * Parse an Excel (.xlsx) file into an array of question objects.
 */
export function parseQuestionsFromExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawJson = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        let headerRowIndex = 0;
        // Search for the header row in the first 10 rows
        for (let i = 0; i < Math.min(10, rawJson.length); i++) {
          const rowStr = rawJson[i].map(c => String(c).toUpperCase());
          if (rowStr.includes('TYPE') || rowStr.includes('CONTENT')) {
            headerRowIndex = i;
            break;
          }
        }

        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', range: headerRowIndex });

        const questions = rows.map((row) => {
          let typeRaw = String(row['TYPE'] || row['Loại'] || '').trim().toUpperCase();
          let type = 'MULTIPLE_CHOICE';
          if (typeRaw.includes('FILL') || typeRaw.includes('ĐIỀN')) type = 'FILL_IN_BLANK';

          // Default difficulty if not explicitly requested
          const diffRaw = String(row['DIFFICULTY'] || '').trim().toUpperCase();
          let diff = 'EASY';
          if (diffRaw === 'MEDIUM' || diffRaw === 'VỪA') diff = 'MEDIUM';
          else if (diffRaw === 'HARD' || diffRaw === 'KHÓ') diff = 'HARD';

          const content = String(row['CONTENT'] || row['Nội dung'] || '').trim();
          const optionsRaw = String(row['OPTIONS'] || '').trim();
          const answerRaw = String(row['ANSWER'] || '').trim();

          const q = {
            questionType: type,
            difficulty: diff,
            questionContent: content,
            answers: []
          };

          if (type === 'FILL_IN_BLANK') {
            q.answers.push({ textAnswer: answerRaw, isCorrect: true, correct: true });
          } else {
            // MULTIPLE_CHOICE: options separated by '|', correct one prefixed with '*'
            const parts = optionsRaw.split('|').map(p => p.trim()).filter(p => p !== '');
            parts.forEach((ans) => {
              const isCorrect = ans.startsWith('*');
              const textAnswer = isCorrect ? ans.substring(1).trim() : ans;
              q.answers.push({ textAnswer, isCorrect, correct: isCorrect });
            });

             // If not found, default to first option just in case
            if (!q.answers.find(a => a.isCorrect) && q.answers.length > 0) {
               q.answers[0].isCorrect = true;
               q.answers[0].correct = true;
            }
          }
          return q;
        });

        resolve(questions.filter(q => q.questionContent.length > 0));
      } catch (err) {
        reject(new Error('Không thể đọc file Excel. Vui lòng kiểm tra định dạng mẫu.'));
      }
    };
    reader.onerror = () => reject(new Error('Lỗi khi đọc file.'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Generate a template Excel file for importing questions.
 */
export function downloadQuestionImportTemplate() {
  const wb = XLSX.utils.book_new();
  const wsData = [
    ['--- HƯỚNG DẪN IMPORT CÂU HỎI ---'],
    ['1. TYPE: Nhập MULTIPLE_CHOICE (Trắc nghiệm) hoặc FILL_IN_BLANK (Điền khuyết).\n2. DIFFICULTY: Nhập EASY (Dễ), MEDIUM (Vừa), hoặc HARD (Khó).\n3. OPTIONS: Các đáp án cách nhau bằng ký hiệu | và đặt dấu * trước đáp án đúng. VD: Java | *Python | C++\n4. ANSWER: Chỉ dùng cho câu Điền khuyết, bỏ trống nếu là câu Trắc nghiệm.'],
    ['TYPE', 'DIFFICULTY', 'CONTENT', 'OPTIONS', 'ANSWER'],
    ['MULTIPLE_CHOICE', 'EASY', 'Java được phát hành chính thức vào năm nào?', '1995 | 1996 | *1997 | 1998', ''],
    ['FILL_IN_BLANK', 'MEDIUM', 'Từ khóa để khai báo một lớp kế thừa trong Java là gì?', '', 'extends'],
    ['MULTIPLE_CHOICE', 'HARD', 'Ngôn ngữ lập trình phổ biến nhất để thiết kế web Frontend là?', 'Python | *JavaScript | C++ | C# | Java', ''],
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 20 }, { wch: 15 }, { wch: 50 }, { wch: 50 }, { wch: 30 }
  ];

  // Merge cells for instruction rows
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // Row 0
    { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }, // Row 1
  ];

  // Row heights
  ws['!rows'] = [
    { hpx: 30 }, // Row 0
    { hpx: 85 }, // Row 1
  ];

  // Apply styling to instructions
  if (!ws['A1']) ws['A1'] = { v: '', t: 's' };
  ws['A1'].s = { font: { bold: true, color: { rgb: '4F46E5' }, sz: 14 }, alignment: { horizontal: 'center', vertical: 'center' } };
  
  if (!ws['A2']) ws['A2'] = { v: '', t: 's' };
  ws['A2'].s = { font: { italic: true, color: { rgb: '334155' } }, alignment: { vertical: 'top', wrapText: true } };

  // Style header row (Row 2, index r: 2)
  for (let i = 0; i < 5; i++) {
    const cellRef = XLSX.utils.encode_cell({ r: 2, c: i });
    if (ws[cellRef]) {
      ws[cellRef].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '4F46E5' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      };
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Mẫu Import Câu Hỏi');
  XLSX.writeFile(wb, 'mau_import_cau_hoi.xlsx');
}
