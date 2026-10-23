import { jsPDF } from 'jspdf';
import { LevelCertificate } from '../types/academy';

/**
 * Generate a consistent, deterministic verification hash for certificate validation
 */
export function generateVerificationHash(
  levelNumber: number | 'all',
  studentName: string,
  issuedDateStr: string
): string {
  const seed = `${levelNumber}-${studentName.trim().toUpperCase()}-${issuedDateStr}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  const levelTag = levelNumber === 'all' ? 'MASTER' : `LVL${levelNumber}`;
  return `EDA-${levelTag}-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
}

/**
 * Build LevelCertificate data object
 */
export function getCertificateDataForLevel(
  levelNumber: number | 'all',
  studentName: string,
  studentEmail = '',
  scorePercent = 100
): LevelCertificate {
  const safeName = studentName.trim() || 'Distinguished Scholar';
  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const levelTitles: Record<number, { title: string; credential: string }> = {
    1: {
      title: 'Level 1: Excel Foundations',
      credential: 'Excel Foundations & Core Workbook Skills Certification',
    },
    2: {
      title: 'Level 2: Excel Formulas and Functions',
      credential: 'Advanced Excel Formulas, Lookups & Logic Certification',
    },
    3: {
      title: 'Level 3: Data Cleaning and Preparation',
      credential: 'Data Cleaning, Standardization & Power Query Certification',
    },
    4: {
      title: 'Level 4: Data Analysis with Excel',
      credential: 'Commercial Data Analysis & PivotTable Modeling Certification',
    },
    5: {
      title: 'Level 5: Dashboards and Professional Reporting',
      credential: 'Executive Excel Dashboards & Interactive Reporting Certification',
    },
    6: {
      title: 'Level 6: Real-World Data Analysis Projects',
      credential: 'Real-World Capstone Data Analyst Portfolio Certification',
    },
  };

  const isMaster = levelNumber === 'all';
  const levelInfo = isMaster
    ? {
        title: 'Master Data Analyst Certification (All 6 Levels)',
        credential: 'Excel to Data Analyst Professional Master Certification',
      }
    : levelTitles[levelNumber] || levelTitles[1];

  const verificationHash = generateVerificationHash(levelNumber, safeName, today);

  return {
    certificateId: verificationHash,
    studentName: safeName,
    studentEmail,
    levelNumber,
    levelTitle: levelInfo.title,
    credentialTitle: levelInfo.credential,
    issuedDate: today,
    verificationHash,
    scorePercent,
    instructorName: 'Excel to Data Analyst Academic Board',
  };
}

/**
 * Render and construct a branded, high-resolution A4 landscape PDF certificate using jsPDF
 */
export function generateCertificatePdfDoc(cert: LevelCertificate): jsPDF {
  // A4 Landscape: 297mm x 210mm
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const width = 297;
  const height = 210;

  // 1. Background Fill: Warm Ivory / Fine Parchment
  doc.setFillColor(253, 252, 248);
  doc.rect(0, 0, width, height, 'F');

  // 2. Outer Border: Emerald Green (#064E3B)
  doc.setDrawColor(6, 78, 59);
  doc.setLineWidth(2.5);
  doc.rect(8, 8, width - 16, height - 16, 'S');

  // 3. Inner Accent Border: Warm Gold (#D97706)
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.8);
  doc.rect(12, 12, width - 24, height - 24, 'S');

  // 4. Subtle Fine Inner Hairline (#064E3B)
  doc.setDrawColor(6, 78, 59);
  doc.setLineWidth(0.2);
  doc.rect(13.5, 13.5, width - 27, height - 27, 'S');

  // 5. Corner Ornaments (Gold Corner Blocks)
  const corners = [
    [12, 12],
    [width - 16, 12],
    [12, height - 16],
    [width - 16, height - 16],
  ];
  doc.setFillColor(217, 119, 6);
  corners.forEach(([x, y]) => {
    doc.rect(x, y, 4, 4, 'F');
  });

  // 6. Header: Academy Branding
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(6, 78, 59);
  doc.text('EXCEL TO DATA ANALYST ACADEMY', width / 2, 28, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'OFFICIAL PROFESSIONAL CERTIFICATION · PRACTICAL SKILLS VERIFICATION',
    width / 2,
    33.5,
    { align: 'center' }
  );

  // Decorative divider line with diamond in center
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.5);
  doc.line(width / 2 - 45, 37, width / 2 - 4, 37);
  doc.line(width / 2 + 4, 37, width / 2 + 45, 37);
  doc.setFillColor(217, 119, 6);
  doc.circle(width / 2, 37, 1.4, 'F');

  // 7. Certificate Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(180, 83, 9); // Gold amber
  doc.text('CERTIFICATE OF ACHIEVEMENT', width / 2, 46, { align: 'center' });

  // 8. Presentation Text
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10.5);
  doc.setTextColor(100, 116, 139);
  doc.text('This is to certify that', width / 2, 55, { align: 'center' });

  // 9. Recipient Name: Large, Bold, Prominent
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(25);
  doc.setTextColor(15, 23, 42); // Deep slate
  doc.text(cert.studentName, width / 2, 69, { align: 'center' });

  // Underline for name
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.6);
  const nameWidth = Math.min(160, Math.max(90, cert.studentName.length * 6));
  doc.line(width / 2 - nameWidth / 2, 72, width / 2 + nameWidth / 2, 72);

  // 10. Attestation Statement
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'has successfully completed all required video modules, practical hands-on Excel workbooks,',
    width / 2,
    81,
    { align: 'center' }
  );
  doc.text(
    'and verified assessment examinations demonstrating professional competence in:',
    width / 2,
    86,
    { align: 'center' }
  );

  // 11. Credential Title Box
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(width / 2 - 95, 91, 190, 16, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(6, 78, 59);
  doc.text(cert.credentialTitle.toUpperCase(), width / 2, 101, {
    align: 'center',
  });

  // 12. Program Summary Notes
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  const summaryLine =
    cert.levelNumber === 'all'
      ? 'Comprehensive Mastery: Excel Foundations, Advanced Formulas & Functions, Data Cleaning, PivotTable Analytics, Dashboards & Capstone.'
      : `Verified Curriculum Track: ${cert.levelTitle} · Hands-On Spreadsheet Exercises & Formula Reconciliation.`;
  doc.text(summaryLine, width / 2, 114, { align: 'center' });

  // 13. Official Academy Seal Emblem (Center)
  const sealCenterX = width / 2;
  const sealCenterY = 146;

  // Outer gold circle
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(1.2);
  doc.setFillColor(254, 243, 199);
  doc.circle(sealCenterX, sealCenterY, 15, 'FD');

  // Inner emerald ring
  doc.setDrawColor(6, 78, 59);
  doc.setLineWidth(0.6);
  doc.circle(sealCenterX, sealCenterY, 12.5, 'S');

  // Inner core
  doc.setFillColor(6, 78, 59);
  doc.circle(sealCenterX, sealCenterY, 9, 'F');

  // Text inside seal
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text('EXCEL ACADEMY', sealCenterX, sealCenterY - 2.5, { align: 'center' });
  doc.setFontSize(8);
  doc.text('★ ★ ★', sealCenterX, sealCenterY + 1.5, { align: 'center' });
  doc.setFontSize(5);
  doc.text('VERIFIED', sealCenterX, sealCenterY + 4.5, { align: 'center' });

  // Seal outer label
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(180, 83, 9);
  doc.text('OFFICIAL ACADEMIC CREDENTIAL SEAL', sealCenterX, sealCenterY + 19, {
    align: 'center',
  });

  // 14. Left Column: Date & Honors
  const leftColX = 45;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(cert.issuedDate, leftColX, 150, { align: 'center' });

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(leftColX - 25, 152, leftColX + 25, 152);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('DATE OF CONFERRAL', leftColX, 157, { align: 'center' });

  if (cert.scorePercent) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(6, 78, 59);
    doc.text(
      `Assessment Score: ${cert.scorePercent}% · Honors Distinction`,
      leftColX,
      162,
      { align: 'center' }
    );
  }

  // 15. Right Column: Signature
  const rightColX = width - 45;
  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(11);
  doc.setTextColor(6, 78, 59);
  doc.text('Academic Evaluation Board', rightColX, 149, { align: 'center' });

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(rightColX - 25, 152, rightColX + 25, 152);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('AUTHORIZED INSTRUCTOR SIGNATURE', rightColX, 157, {
    align: 'center',
  });

  doc.setFontSize(7.5);
  doc.text('Excel to Data Analyst Academy', rightColX, 162, {
    align: 'center',
  });

  // 16. Bottom Footer: Verification Hash & Barcode Note
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(20, 182, width - 20, 182);

  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`VERIFICATION ID: ${cert.verificationHash}`, width / 2, 188, {
    align: 'center',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'This credential can be verified by employers and institutions. All practical assignments were executed and validated in Microsoft Excel.',
    width / 2,
    193,
    { align: 'center' }
  );

  return doc;
}

/**
 * Triggers instant browser download of the branded certificate PDF
 */
export function downloadLevelCertificatePdf(cert: LevelCertificate): void {
  const doc = generateCertificatePdfDoc(cert);
  const safeName = cert.studentName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
  const tag = cert.levelNumber === 'all' ? 'Master_Analyst' : `Level_${cert.levelNumber}`;
  doc.save(`Excel_Academy_Certificate_${tag}_${safeName}.pdf`);
}

/**
 * Generate PDF as Data URL for in-app preview
 */
export function getCertificatePdfDataUrl(cert: LevelCertificate): string {
  const doc = generateCertificatePdfDoc(cert);
  return doc.output('datauristring');
}
