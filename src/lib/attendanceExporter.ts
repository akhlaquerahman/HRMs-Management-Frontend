import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { toast } from 'sonner';

export interface AttendanceExportRecord {
  id: string;
  date: string | Date;
  status: string;
  effectiveHours?: number;
  grossHours?: number;
  shift?: { name?: string };
  logs?: Array<{ punchIn: string | Date; punchOut?: string | Date }>;
  breaks?: Array<{ id?: string; type?: string; breakStart: string | Date; breakEnd?: string | Date; durationSeconds?: number; durationMinutes?: number }>;
}

/**
 * Format total seconds into human readable duration string (e.g., "5h 12m" or "0m")
 */
function formatDuration(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return '0m';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);

  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(' ');
}

/**
 * Maps raw status strings to clean display text and Excel fill colors
 */
function getStatusExportStyle(status: string) {
  const norm = (status || '').toUpperCase();
  if (norm === 'PRESENT') {
    return { label: 'Present', fill: 'DCFCE7', fontColor: '15803D' };
  }
  if (norm === 'HALF_DAY') {
    return { label: 'Half Day', fill: 'FEF3C7', fontColor: 'B45309' };
  }
  if (norm === 'INSUFFICIENT_HOURS') {
    return { label: 'Insufficient Hours', fill: 'F3E8FF', fontColor: '6B21A8' };
  }
  if (norm === 'ABSENT') {
    return { label: 'Absent', fill: 'FEE2E2', fontColor: 'B91C1C' };
  }
  if (norm === 'LEAVE') {
    return { label: 'On Leave', fill: 'DBEAFE', fontColor: '1E40AF' };
  }
  if (norm.includes('PUNCH OUT') || norm.includes('CHECK OUT') || norm === 'YET_TO_CHECK_OUT') {
    return { label: 'Yet to Check Out', fill: 'E0E7FF', fontColor: '4338CA' };
  }
  return { label: status || 'Standard', fill: 'F1F5F9', fontColor: '475569' };
}

/**
 * Export Attendance Records to a professional Multi-Sheet Excel Workbook (.xlsx)
 * with formula-driven working hours, break-wise interval columns, Work Sessions, and Break Details.
 */
export async function exportAttendanceToExcel(records: AttendanceExportRecord[], employeeName: string = 'Employee') {
  try {
    if (!records || records.length === 0) {
      toast.error('No attendance records to export');
      return;
    }

    const toastId = toast.loading('Generating Advanced Enterprise Excel Report...');

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'HRMS Pro Enterprise';
    workbook.created = new Date();

    const fileDateStr = format(new Date(), 'yyyyMMdd');
    const filename = `attendance_export_${fileDateStr}.xlsx`;

    // =========================================================================
    // SHEET 1: Attendance Report (Primary Display Sheet)
    // =========================================================================
    const sheet1 = workbook.addWorksheet('Attendance Report', {
      views: [{ state: 'frozen', xSplit: 1, ySplit: 10 }]
    });

    // Title Row (Row 1) - Spans Columns A to L
    sheet1.mergeCells('A1:L1');
    const titleCell = sheet1.getCell('A1');
    titleCell.value = 'HRMS Pro — Attendance Report';
    titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E293B' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet1.getRow(1).height = 36;

    // Subtitle & Metadata (Rows 2 & 3)
    sheet1.getCell('A2').value = `Employee Summary: ${employeeName}`;
    sheet1.getCell('A2').font = { name: 'Calibri', size: 11, bold: true, color: { argb: '334155' } };

    sheet1.getCell('A3').value = `Generated On: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`;
    sheet1.getCell('A3').font = { name: 'Calibri', size: 10, italic: true, color: { argb: '64748B' } };

    // Summary Metrics Section (Rows 5 to 8)
    let totalDays = records.length;
    let presentDays = 0;
    let halfDays = 0;
    let insufficientDays = 0;
    let absentDays = 0;
    let totalWorkingSec = 0;
    let totalBreakSec = 0;

    records.forEach(r => {
      const st = (r.status || '').toUpperCase();
      if (st === 'PRESENT') presentDays++;
      else if (st === 'HALF_DAY') halfDays++;
      else if (st === 'INSUFFICIENT_HOURS') insufficientDays++;
      else if (st === 'ABSENT') absentDays++;

      const effH = Number(r.effectiveHours || 0);
      totalWorkingSec += Math.round(effH * 3600);

      (r.breaks || []).forEach(b => {
        if (b.durationSeconds) totalBreakSec += b.durationSeconds;
        else if (b.breakStart && b.breakEnd) {
          totalBreakSec += Math.floor((new Date(b.breakEnd).getTime() - new Date(b.breakStart).getTime()) / 1000);
        }
      });
    });

    sheet1.mergeCells('A5:C5');
    sheet1.getCell('A5').value = 'SUMMARY METRICS';
    sheet1.getCell('A5').font = { name: 'Calibri', size: 10, bold: true, color: { argb: '475569' } };
    sheet1.getCell('A5').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };

    const summaryData = [
      ['Total Days', totalDays, 'Present Days', presentDays],
      ['Half Days', halfDays, 'Insufficient Hours', insufficientDays],
      ['Absent Days', absentDays, 'Total Working Time', formatDuration(totalWorkingSec)],
      ['Total Break Time', formatDuration(totalBreakSec), '', '']
    ];

    summaryData.forEach((rowVals, idx) => {
      const rNum = 6 + idx;
      sheet1.getCell(`A${rNum}`).value = rowVals[0];
      sheet1.getCell(`A${rNum}`).font = { name: 'Calibri', size: 9, bold: true, color: { argb: '334155' } };
      sheet1.getCell(`B${rNum}`).value = rowVals[1];
      sheet1.getCell(`B${rNum}`).font = { name: 'Calibri', size: 10, bold: true, color: { argb: '0F172A' } };

      if (rowVals[2]) {
        sheet1.getCell(`D${rNum}`).value = rowVals[2];
        sheet1.getCell(`D${rNum}`).font = { name: 'Calibri', size: 9, bold: true, color: { argb: '334155' } };
        sheet1.getCell(`E${rNum}`).value = rowVals[3];
        sheet1.getCell(`E${rNum}`).font = { name: 'Calibri', size: 10, bold: true, color: { argb: '0F172A' } };
      }
    });

    // Table Header Row (Row 10)
    const headers = [
      'Date',           // Col A (1)
      'Status',         // Col B (2)
      'Punch In',       // Col C (3)
      'Punch Out',      // Col D (4)
      'Lunch',          // Col E (5)
      'TEA',            // Col F (6)
      'BIO',            // Col G (7)
      'Official',       // Col H (8)
      'Personal',       // Col I (9)
      'Break Time',     // Col J (10)
      'Working Hours',  // Col K (11)
      'Shift'           // Col L (12)
    ];

    const columnWidths = [15, 22, 14, 14, 25, 25, 25, 28, 25, 16, 18, 22];

    const headerRow = sheet1.getRow(10);
    headerRow.height = 28;
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E293B' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      sheet1.getColumn(i + 1).width = columnWidths[i];
    });

    // Enable AutoFilter on Header Row
    sheet1.autoFilter = 'A10:L10';

    // =========================================================================
    // PREPARE SECONDARY SHEETS (Work Sessions & Break Details)
    // =========================================================================
    const sheet2 = workbook.addWorksheet('Work Sessions', {
      views: [{ state: 'frozen', ySplit: 1 }]
    });

    const workHeaders = ['Date', 'Session Reference', 'Punch In', 'Punch Out', 'Session Duration', 'Status'];
    const workHeaderRow = sheet2.getRow(1);
    workHeaderRow.height = 24;
    workHeaders.forEach((h, i) => {
      const cell = workHeaderRow.getCell(i + 1);
      cell.value = h;
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '334155' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    sheet2.getColumn(1).width = 15;
    sheet2.getColumn(2).width = 20;
    sheet2.getColumn(3).width = 16;
    sheet2.getColumn(4).width = 16;
    sheet2.getColumn(5).width = 18;
    sheet2.getColumn(6).width = 16;

    const sheet3 = workbook.addWorksheet('Break Details', {
      views: [{ state: 'frozen', ySplit: 1 }]
    });

    const breakHeaders = ['Date', 'Break Type', 'Break Start', 'Break End', 'Duration', 'Attendance Ref'];
    const breakHeaderRow = sheet3.getRow(1);
    breakHeaderRow.height = 24;
    breakHeaders.forEach((h, i) => {
      const cell = breakHeaderRow.getCell(i + 1);
      cell.value = h;
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '334155' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    sheet3.getColumn(1).width = 15;
    sheet3.getColumn(2).width = 18;
    sheet3.getColumn(3).width = 16;
    sheet3.getColumn(4).width = 16;
    sheet3.getColumn(5).width = 18;
    sheet3.getColumn(6).width = 22;

    let workSessionRowIndex = 2;
    let breakDetailRowIndex = 2;

    // =========================================================================
    // POPULATE DATA ROWS IN PRIMARY & SECONDARY SHEETS
    // =========================================================================
    records.forEach((item, index) => {
      const rNum = 11 + index;
      const row = sheet1.getRow(rNum);

      const dateKey = format(new Date(item.date), 'dd MMM yyyy');
      const isPunchedIn = item.logs && item.logs.length > 0 && !item.logs[item.logs.length - 1].punchOut;
      const rawStatus = isPunchedIn ? 'YET_TO_CHECK_OUT' : item.status;
      const statusStyle = getStatusExportStyle(rawStatus);

      // --------------------------------------------------
      // 1. POPULATE WORK SESSIONS SHEET (Sheet 2)
      // --------------------------------------------------
      const logs = [...(item.logs || [])].sort((a: any, b: any) => new Date(a.punchIn).getTime() - new Date(b.punchIn).getTime());
      const firstPunchIn = logs.length > 0 ? logs[0].punchIn : null;
      const lastPunchOut = (logs.length > 0 && logs[logs.length - 1].punchOut) ? logs[logs.length - 1].punchOut : null;

      const checkInStr = firstPunchIn ? format(new Date(firstPunchIn), 'hh:mm a') : '—';
      const checkOutStr = lastPunchOut ? format(new Date(lastPunchOut), 'hh:mm a') : '—';

      logs.forEach((log, lIdx) => {
        const wsRow = sheet2.getRow(workSessionRowIndex);
        wsRow.height = 20;

        wsRow.getCell(1).value = dateKey;
        wsRow.getCell(2).value = `Session ${lIdx + 1}`;

        if (log.punchIn) {
          wsRow.getCell(3).value = new Date(log.punchIn);
          wsRow.getCell(3).numFmt = 'hh:mm AM/PM';
        } else {
          wsRow.getCell(3).value = '—';
        }

        if (log.punchOut) {
          wsRow.getCell(4).value = new Date(log.punchOut);
          wsRow.getCell(4).numFmt = 'hh:mm AM/PM';
        } else {
          wsRow.getCell(4).value = null;
        }

        // Formula for Session Duration: =IF(ISBLANK(D{row}), 0, D{row} - C{row})
        wsRow.getCell(5).value = {
          formula: `IF(ISBLANK(D${workSessionRowIndex}), 0, D${workSessionRowIndex} - C${workSessionRowIndex})`,
          result: log.punchIn && log.punchOut ? (new Date(log.punchOut).getTime() - new Date(log.punchIn).getTime()) / (86400 * 1000) : 0
        };
        wsRow.getCell(5).numFmt = '[h]"h "mm"m"';

        wsRow.getCell(6).value = log.punchOut ? 'Completed' : 'Active';

        // Styling
        [1, 2, 3, 4, 5, 6].forEach(colIdx => {
          wsRow.getCell(colIdx).alignment = { horizontal: 'center', vertical: 'middle' };
          wsRow.getCell(colIdx).font = { name: 'Calibri', size: 10 };
        });

        workSessionRowIndex++;
      });

      // --------------------------------------------------
      // 2. POPULATE BREAK DETAILS SHEET (Sheet 3) & GROUP BY TYPE
      // --------------------------------------------------
      const breaksByType: Record<string, string[]> = {
        LUNCH: [],
        TEA: [],
        BIO: [],
        OFFICIAL: [],
        OTHER: []
      };

      let dayTotalBreakSec = 0;

      (item.breaks || []).forEach((b) => {
        const typeNorm = (b.type || 'OTHER').toUpperCase();
        const canonicalKey = ['LUNCH', 'TEA', 'BIO', 'OFFICIAL'].includes(typeNorm) ? typeNorm : 'OTHER';

        const bStart = b.breakStart ? new Date(b.breakStart) : null;
        const bEnd = b.breakEnd ? new Date(b.breakEnd) : null;

        const bStartStr = bStart ? format(bStart, 'hh:mm a') : '—';
        const bEndStr = bEnd ? format(bEnd, 'hh:mm a') : 'Ongoing';

        breaksByType[canonicalKey].push(`${bStartStr} - ${bEndStr}`);

        // Populate Sheet 3
        const bdRow = sheet3.getRow(breakDetailRowIndex);
        bdRow.height = 20;

        bdRow.getCell(1).value = dateKey;
        bdRow.getCell(2).value = canonicalKey;

        if (bStart) {
          bdRow.getCell(3).value = bStart;
          bdRow.getCell(3).numFmt = 'hh:mm AM/PM';
        } else {
          bdRow.getCell(3).value = '—';
        }

        if (bEnd) {
          bdRow.getCell(4).value = bEnd;
          bdRow.getCell(4).numFmt = 'hh:mm AM/PM';
        } else {
          bdRow.getCell(4).value = null;
        }

        // Formula for Break Duration: =IF(ISBLANK(D{row}), 0, D{row} - C{row})
        let bSec = 0;
        if (b.durationSeconds) bSec = b.durationSeconds;
        else if (bStart && bEnd) bSec = Math.floor((bEnd.getTime() - bStart.getTime()) / 1000);
        dayTotalBreakSec += bSec;

        bdRow.getCell(5).value = {
          formula: `IF(ISBLANK(D${breakDetailRowIndex}), 0, D${breakDetailRowIndex} - C${breakDetailRowIndex})`,
          result: bSec / 86400
        };
        bdRow.getCell(5).numFmt = '[h]"h "mm"m"';

        bdRow.getCell(6).value = item.id || dateKey;

        // Styling
        [1, 2, 3, 4, 5, 6].forEach(colIdx => {
          bdRow.getCell(colIdx).alignment = { horizontal: 'center', vertical: 'middle' };
          bdRow.getCell(colIdx).font = { name: 'Calibri', size: 10 };
        });

        breakDetailRowIndex++;
      });

      // --------------------------------------------------
      // 3. POPULATE PRIMARY ATTENDANCE REPORT ROW (Sheet 1)
      // --------------------------------------------------
      // Calculate dynamic row height based on max breaks in any type
      const maxBreaksCount = Math.max(
        1,
        breaksByType.LUNCH.length,
        breaksByType.TEA.length,
        breaksByType.BIO.length,
        breaksByType.OFFICIAL.length,
        breaksByType.OTHER.length
      );

      row.height = maxBreaksCount > 1 ? Math.max(26, maxBreaksCount * 18) : 22;

      // Col A: Date
      row.getCell(1).value = dateKey;

      // Col B: Status
      row.getCell(2).value = statusStyle.label;
      row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: statusStyle.fill } };
      row.getCell(2).font = { name: 'Calibri', size: 10, bold: true, color: { argb: statusStyle.fontColor } };

      // Col C: Punch In
      row.getCell(3).value = checkInStr;

      // Col D: Punch Out
      row.getCell(4).value = checkOutStr;

      // Col E: Lunch
      row.getCell(5).value = breaksByType.LUNCH.length > 0 ? breaksByType.LUNCH.join('\n') : '—';

      // Col F: TEA
      row.getCell(6).value = breaksByType.TEA.length > 0 ? breaksByType.TEA.join('\n') : '—';

      // Col G: BIO
      row.getCell(7).value = breaksByType.BIO.length > 0 ? breaksByType.BIO.join('\n') : '—';

      // Col H: Official
      row.getCell(8).value = breaksByType.OFFICIAL.length > 0 ? breaksByType.OFFICIAL.join('\n') : '—';

      // Col I: Personal (OTHER)
      row.getCell(9).value = breaksByType.OTHER.length > 0 ? breaksByType.OTHER.join('\n') : '—';

      // Col J: Break Time — Dynamic Formula: =SUMIF('Break Details'!$A:$A, A{rNum}, 'Break Details'!$E:$E)
      row.getCell(10).value = {
        formula: `SUMIF('Break Details'!$A:$A, A${rNum}, 'Break Details'!$E:$E)`,
        result: dayTotalBreakSec / 86400
      };
      row.getCell(10).numFmt = '[h]"h "mm"m"';

      // Col K: Working Hours — Dynamic Formula: =SUMIF('Work Sessions'!$A:$A, A${rNum}, 'Work Sessions'!$E:$E) - J${rNum}
      const effH = Number(item.effectiveHours || 0);
      const effectiveSec = Math.round(effH * 3600);

      row.getCell(11).value = {
        formula: `SUMIF('Work Sessions'!$A:$A, A${rNum}, 'Work Sessions'!$E:$E) - J${rNum}`,
        result: effectiveSec / 86400
      };
      row.getCell(11).numFmt = '[h]"h "mm"m"';

      // Col L: Shift
      row.getCell(12).value = item.shift?.name || 'General Shift';

      // Format all cells in Sheet 1 row
      for (let c = 1; c <= 12; c++) {
        const cell = row.getCell(c);
        if (c !== 2) { // Preserve status style on Col B
          cell.font = { name: 'Calibri', size: 10 };
        }
        cell.alignment = {
          horizontal: 'center',
          vertical: 'middle',
          wrapText: c >= 5 && c <= 9 // Wrap text for Break columns
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'E2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
          left: { style: 'thin', color: { argb: 'E2E8F0' } },
          right: { style: 'thin', color: { argb: 'E2E8F0' } }
        };
      }
    });

    // =========================================================================
    // SHEET 4: Calculation Data (Audit Check Worksheet)
    // =========================================================================
    const sheet4 = workbook.addWorksheet('Calculation Data', {
      views: [{ state: 'frozen', ySplit: 1 }]
    });

    const calcHeaders = ['Date', 'Reported Working Minutes', 'Formula Calculated Working Minutes', 'Difference (Minutes)', 'Audit Status'];
    const calcHeaderRow = sheet4.getRow(1);
    calcHeaderRow.height = 24;
    calcHeaders.forEach((h, i) => {
      const cell = calcHeaderRow.getCell(i + 1);
      cell.value = h;
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E293B' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    sheet4.getColumn(1).width = 15;
    sheet4.getColumn(2).width = 26;
    sheet4.getColumn(3).width = 30;
    sheet4.getColumn(4).width = 22;
    sheet4.getColumn(5).width = 16;

    records.forEach((item, index) => {
      const rNum = 11 + index;
      const calcRNum = 2 + index;
      const cRow = sheet4.getRow(calcRNum);
      cRow.height = 20;

      const dateKey = format(new Date(item.date), 'dd MMM yyyy');
      const effH = Number(item.effectiveHours || 0);
      const repMinutes = Math.round(effH * 60);

      cRow.getCell(1).value = dateKey;
      cRow.getCell(2).value = repMinutes;

      // Formula Calculated Minutes: ='Attendance Report'!K{rNum} * 24 * 60
      cRow.getCell(3).value = {
        formula: `'Attendance Report'!K${rNum} * 24 * 60`,
        result: repMinutes
      };

      // Difference: =ABS(B{calcRNum} - C{calcRNum})
      cRow.getCell(4).value = {
        formula: `ROUND(ABS(B${calcRNum} - C${calcRNum}), 0)`,
        result: 0
      };

      // Status: =IF(D{calcRNum}=0, "PASS", "CHECK")
      cRow.getCell(5).value = {
        formula: `IF(D${calcRNum}=0, "PASS", "CHECK")`,
        result: 'PASS'
      };

      for (let c = 1; c <= 5; c++) {
        const cell = cRow.getCell(c);
        cell.font = { name: 'Calibri', size: 10 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
    });

    // =========================================================================
    // WRITE WORKBOOK AND TRIGGER BROWSER DOWNLOAD
    // =========================================================================
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.URL.revokeObjectURL(url);

    toast.dismiss(toastId);
    toast.success('Enterprise Excel (.xlsx) Report generated successfully!');
  } catch (error: any) {
    console.error('Excel Export Error:', error);
    toast.error(`Failed to export Excel report: ${error?.message || 'Unknown error'}`);
  }
}

/**
 * Export Raw CSV Data (.csv) for systems requiring plain text tabular input
 */
export function exportAttendanceToCSV(records: AttendanceExportRecord[]) {
  try {
    if (!records || records.length === 0) {
      toast.error('No attendance records to export');
      return;
    }

    const headers = ['Date', 'Status', 'Punch In', 'Punch Out', 'Lunch', 'TEA', 'BIO', 'Official', 'Personal', 'Break Time', 'Working Hours', 'Shift'];
    const csvRows = [headers.join(',')];

    records.forEach((item) => {
      const dateStr = format(new Date(item.date), 'dd MMM yyyy');
      const logs = [...(item.logs || [])].sort((a: any, b: any) => new Date(a.punchIn).getTime() - new Date(b.punchIn).getTime());
      const firstPunchIn = logs.length > 0 ? logs[0].punchIn : null;
      const lastPunchOut = (logs.length > 0 && logs[logs.length - 1].punchOut) ? logs[logs.length - 1].punchOut : null;

      const isPunchedIn = logs.length > 0 && !logs[logs.length - 1].punchOut;
      const displayStatus = isPunchedIn ? 'Yet to Check Out' : (item.status === 'INSUFFICIENT_HOURS' ? 'Insufficient Hours' : (item.status === 'HALF_DAY' ? 'Half Day' : (item.status === 'PRESENT' ? 'Present' : item.status)));

      const checkIn = firstPunchIn ? format(new Date(firstPunchIn), 'HH:mm') : '-';
      const checkOut = lastPunchOut ? format(new Date(lastPunchOut), 'HH:mm') : '-';

      const effH = Number(item.effectiveHours || 0);
      const hoursStr = formatDuration(Math.round(effH * 3600));

      const breaksByType: Record<string, string[]> = {
        LUNCH: [],
        TEA: [],
        BIO: [],
        OFFICIAL: [],
        OTHER: []
      };

      let totalBreakSec = 0;
      (item.breaks || []).forEach(b => {
        const typeNorm = (b.type || 'OTHER').toUpperCase();
        const canonicalKey = ['LUNCH', 'TEA', 'BIO', 'OFFICIAL'].includes(typeNorm) ? typeNorm : 'OTHER';

        const bStart = b.breakStart ? format(new Date(b.breakStart), 'HH:mm') : '-';
        const bEnd = b.breakEnd ? format(new Date(b.breakEnd), 'HH:mm') : 'Ongoing';

        breaksByType[canonicalKey].push(`${bStart}-${bEnd}`);

        if (b.durationSeconds) totalBreakSec += b.durationSeconds;
        else if (b.breakStart && b.breakEnd) totalBreakSec += Math.floor((new Date(b.breakEnd).getTime() - new Date(b.breakStart).getTime()) / 1000);
      });

      const breakStr = formatDuration(totalBreakSec);
      const shiftStr = item.shift?.name || 'General Shift';

      const lunchStr = breaksByType.LUNCH.length > 0 ? `"${breaksByType.LUNCH.join('; ')}"` : '-';
      const teaStr = breaksByType.TEA.length > 0 ? `"${breaksByType.TEA.join('; ')}"` : '-';
      const bioStr = breaksByType.BIO.length > 0 ? `"${breaksByType.BIO.join('; ')}"` : '-';
      const officialStr = breaksByType.OFFICIAL.length > 0 ? `"${breaksByType.OFFICIAL.join('; ')}"` : '-';
      const personalStr = breaksByType.OTHER.length > 0 ? `"${breaksByType.OTHER.join('; ')}"` : '-';

      csvRows.push([
        dateStr,
        `"${displayStatus}"`,
        checkIn,
        checkOut,
        lunchStr,
        teaStr,
        bioStr,
        officialStr,
        personalStr,
        breakStr,
        hoursStr,
        `"${shiftStr}"`
      ].join(','));
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvRows.join('\n'));
    const fileDateStr = format(new Date(), 'yyyyMMdd');
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `attendance_export_${fileDateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Raw CSV exported successfully!');
  } catch (error: any) {
    console.error('CSV Export Error:', error);
    toast.error('Failed to export CSV report');
  }
}
