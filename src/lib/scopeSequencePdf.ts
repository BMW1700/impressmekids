import { jsPDF } from 'jspdf';
import { phonicsScopeAndSequence, totalPracticeWords } from '@/data/phonicsScopeAndSequence';

/**
 * Generate a branded, printable one-pager PDF of NabuLearn's K-2 Phonics
 * Scope & Sequence — designed for handing to curriculum directors and
 * superintendents in pilot meetings.
 */
export const generateScopeSequencePdf = (): void => {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  // Brand color (HSL primary roughly — converted to RGB for jsPDF)
  // Using a deep indigo/violet that matches the platform's primary
  const PRIMARY: [number, number, number] = [99, 102, 241];
  const MUTED: [number, number, number] = [107, 114, 128];
  const DARK: [number, number, number] = [17, 24, 39];

  // ── Header ──────────────────────────────────────────────
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, pageWidth, 70, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('NabuLearn', margin, 32);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('AI-Powered Literacy Platform', margin, 48);

  doc.setFontSize(9);
  doc.text('nabulearn.com', pageWidth - margin, 32, { align: 'right' });
  doc.text('K–2 Phonics Scope & Sequence', pageWidth - margin, 48, { align: 'right' });

  // ── Title ──────────────────────────────────────────────
  let y = 100;
  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Phonics Scope & Sequence', margin, y);

  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  const subtitle =
    `${phonicsScopeAndSequence.length} stages · ${totalPracticeWords}+ practice words · ` +
    'Aligned to Common Core RF.K.2–RF.2.3 · Compatible with Wilson, UFLI, Heggerty, Orton-Gillingham';
  const subtitleLines = doc.splitTextToSize(subtitle, contentWidth);
  doc.text(subtitleLines, margin, y);
  y += subtitleLines.length * 11 + 10;

  // ── Stages ──────────────────────────────────────────────
  for (const stage of phonicsScopeAndSequence) {
    // Estimate stage block height for page-break safety
    const sampleWords = stage.practiceWords.slice(0, 12).join(', ');
    const tipLines = doc.splitTextToSize(stage.teachingTip, contentWidth - 16);
    const wordsLines = doc.splitTextToSize(`Sample words: ${sampleWords}`, contentWidth - 16);
    const blockHeight = 22 + 14 + wordsLines.length * 10 + tipLines.length * 10 + 18;

    if (y + blockHeight > pageHeight - 60) {
      doc.addPage();
      y = margin;
    }

    // Stage badge bar
    doc.setFillColor(...PRIMARY);
    doc.roundedRect(margin, y, 26, 18, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`${stage.stageNumber}`, margin + 13, y + 13, { align: 'center' });

    // Stage title
    doc.setTextColor(...DARK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(stage.title, margin + 34, y + 13);

    // Grade pill (right aligned)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(stage.recommendedGrades, pageWidth - margin, y + 13, { align: 'right' });

    y += 24;

    // CCSS standards
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...PRIMARY);
    doc.text(`CCSS: ${stage.ccssStandards.join(' · ')}`, margin + 8, y);
    y += 12;

    // Sample words
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...DARK);
    doc.text(wordsLines, margin + 8, y);
    y += wordsLines.length * 10 + 4;

    // Teaching tip
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    doc.text(`Teaching tip: ${stage.teachingTip}`, margin + 8, y, { maxWidth: contentWidth - 16 });
    const tipWrapped = doc.splitTextToSize(`Teaching tip: ${stage.teachingTip}`, contentWidth - 16);
    y += tipWrapped.length * 10 + 14;

    // Divider
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.line(margin, y - 6, pageWidth - margin, y - 6);
  }

  // ── Footer (every page) ────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(
      'NabuLearn · AI-Powered Literacy · Used in all K-2 instruction across the platform',
      margin,
      pageHeight - 24,
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - margin,
      pageHeight - 24,
      { align: 'right' },
    );
  }

  doc.save('NabuLearn-Phonics-Scope-and-Sequence.pdf');
};
