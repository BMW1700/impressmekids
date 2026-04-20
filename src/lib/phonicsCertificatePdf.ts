import { jsPDF } from 'jspdf';
import { phonicsScopeAndSequence } from '@/data/phonicsScopeAndSequence';

/**
 * Generate a printable, branded "Phonics Foundations Complete" certificate.
 * Designed for parent fridges and pilot demos — landscape, single page.
 */
export const generatePhonicsCertificatePdf = (studentName?: string): void => {
  const doc = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'landscape' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const PRIMARY: [number, number, number] = [99, 102, 241];
  const GOLD: [number, number, number] = [202, 138, 4];
  const DARK: [number, number, number] = [17, 24, 39];
  const MUTED: [number, number, number] = [107, 114, 128];

  // Outer decorative border
  doc.setDrawColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.setLineWidth(4);
  doc.rect(24, 24, pageWidth - 48, pageHeight - 48);

  // Inner thin border
  doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.setLineWidth(1);
  doc.rect(36, 36, pageWidth - 72, pageHeight - 72);

  // Header brand bar
  doc.setFillColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.rect(36, 36, pageWidth - 72, 50, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('NabuLearn', pageWidth / 2, 68, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('AI-Powered Literacy Platform', pageWidth / 2, 80, { align: 'center' });

  // Title
  doc.setTextColor(DARK[0], DARK[1], DARK[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(36);
  doc.text('Certificate of Achievement', pageWidth / 2, 150, { align: 'center' });

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  doc.text('This certificate is proudly presented to', pageWidth / 2, 180, { align: 'center' });

  // Student name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(32);
  doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  const name = studentName?.trim() || 'Our Outstanding Reader';
  doc.text(name, pageWidth / 2, 230, { align: 'center' });

  // Underline under name
  const nameWidth = doc.getTextWidth(name);
  doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.setLineWidth(1);
  doc.line(
    (pageWidth - nameWidth) / 2 - 20,
    240,
    (pageWidth + nameWidth) / 2 + 20,
    240,
  );

  // Body
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(DARK[0], DARK[1], DARK[2]);
  doc.text(
    `for successfully mastering all ${phonicsScopeAndSequence.length} stages of the`,
    pageWidth / 2,
    275,
    { align: 'center' },
  );
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(
    'Phonics Foundations Progression',
    pageWidth / 2,
    300,
    { align: 'center' },
  );
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  doc.text(
    'Aligned to Common Core RF.K.2 – RF.2.3 · CVC through multisyllabic decoding',
    pageWidth / 2,
    320,
    { align: 'center' },
  );

  // Stage chips
  doc.setFontSize(9);
  doc.setTextColor(DARK[0], DARK[1], DARK[2]);
  const chipText = phonicsScopeAndSequence
    .map((s) => `✓ ${s.shortLabel}`)
    .join('   ');
  doc.text(chipText, pageWidth / 2, 350, { align: 'center' });

  // Date + signature line
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  doc.setDrawColor(MUTED[0], MUTED[1], MUTED[2]);
  doc.setLineWidth(0.5);
  // Left: date
  doc.line(100, pageHeight - 110, 250, pageHeight - 110);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  doc.text('Date', 175, pageHeight - 95, { align: 'center' });
  doc.setFontSize(11);
  doc.setTextColor(DARK[0], DARK[1], DARK[2]);
  doc.text(dateStr, 175, pageHeight - 118, { align: 'center' });

  // Right: NabuLearn signature
  doc.line(pageWidth - 250, pageHeight - 110, pageWidth - 100, pageHeight - 110);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(13);
  doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.text('NabuLearn Literacy Team', pageWidth - 175, pageHeight - 118, {
    align: 'center',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  doc.text('Issued by', pageWidth - 175, pageHeight - 95, { align: 'center' });

  // Footer
  doc.setFontSize(8);
  doc.text('nabulearn.com', pageWidth / 2, pageHeight - 50, { align: 'center' });

  const safeName = (studentName || 'Student').replace(/[^a-z0-9]+/gi, '-');
  doc.save(`NabuLearn-Phonics-Foundations-Certificate-${safeName}.pdf`);
};
