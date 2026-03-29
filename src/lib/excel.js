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
