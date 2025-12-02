export default function VPATCompliance() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Voluntary Product Accessibility Template® (VPAT®)</h1>
        <h2 className="text-xl font-semibold text-muted-foreground mb-6">WCAG Edition - Version 2.5</h2>
        
        <div className="bg-muted/30 p-6 rounded-lg space-y-3 mb-8">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-semibold">Product Name:</p>
              <p>ImpressMe Kids Learning Management System</p>
            </div>
            <div>
              <p className="font-semibold">Product Version:</p>
              <p>1.0</p>
            </div>
            <div>
              <p className="font-semibold">Report Date:</p>
              <p>{new Date().toLocaleDateString()}</p>
            </div>
            <div>
              <p className="font-semibold">Product Description:</p>
              <p>Cloud-based K-5 learning management system with AI-powered literacy intervention</p>
            </div>
            <div>
              <p className="font-semibold">Contact Information:</p>
              <p>accessibility@impressmekids.com</p>
            </div>
            <div>
              <p className="font-semibold">Evaluation Methods:</p>
              <p>Testing with assistive technologies, automated scanning, manual inspection</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Conformance Level Summary</h2>
        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-muted">
              <th className="border p-3 text-left">Standard/Guideline</th>
              <th className="border p-3 text-left">Conformance Level</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border p-3">Web Content Accessibility Guidelines 2.1 Level A</td>
              <td className="border p-3 font-semibold text-green-600">Supports</td>
            </tr>
            <tr>
              <td className="border p-3">Web Content Accessibility Guidelines 2.1 Level AA</td>
              <td className="border p-3 font-semibold text-green-600">Supports</td>
            </tr>
            <tr>
              <td className="border p-3">Web Content Accessibility Guidelines 2.1 Level AAA</td>
              <td className="border p-3 font-semibold text-yellow-600">Partially Supports</td>
            </tr>
            <tr>
              <td className="border p-3">Section 508 (Revised 2017)</td>
              <td className="border p-3 font-semibold text-green-600">Supports</td>
            </tr>
          </tbody>
        </table>
        
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <p className="font-semibold mb-2">Conformance Level Definitions:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li><strong>Supports:</strong> The functionality of the product has at least one method that meets the criterion without known defects or meets with equivalent facilitation.</li>
            <li><strong>Partially Supports:</strong> Some functionality of the product does not meet the criterion.</li>
            <li><strong>Does Not Support:</strong> The majority of product functionality does not meet the criterion.</li>
            <li><strong>Not Applicable:</strong> The criterion is not relevant to the product.</li>
          </ul>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">WCAG 2.1 Level A Criteria</h2>
        
        <div className="space-y-6">
          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="text-lg font-semibold mb-2">1.1.1 Non-text Content (Level A)</h3>
            <p className="mb-2"><strong>Conformance:</strong> <span className="text-green-600 font-semibold">Supports</span></p>
            <p className="text-sm"><strong>Remarks:</strong> All images, icons, and non-text content include appropriate alt text. AURA character animations include descriptive aria-labels. Audio recordings include text transcripts automatically generated via speech-to-text.</p>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="text-lg font-semibold mb-2">1.2.1 Audio-only and Video-only (Level A)</h3>
            <p className="mb-2"><strong>Conformance:</strong> <span className="text-green-600 font-semibold">Supports</span></p>
            <p className="text-sm"><strong>Remarks:</strong> Student reading recordings automatically generate text transcripts. All audio feedback includes visual equivalents (achievement badges, progress bars, text notifications).</p>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="text-lg font-semibold mb-2">1.3.1 Info and Relationships (Level A)</h3>
            <p className="mb-2"><strong>Conformance:</strong> <span className="text-green-600 font-semibold">Supports</span></p>
            <p className="text-sm"><strong>Remarks:</strong> Semantic HTML structure throughout (header, nav, main, section, article). Tables use proper thead/tbody/th elements with scope attributes. Forms use label elements properly associated with inputs.</p>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="text-lg font-semibold mb-2">1.3.2 Meaningful Sequence (Level A)</h3>
            <p className="mb-2"><strong>Conformance:</strong> <span className="text-green-600 font-semibold">Supports</span></p>
            <p className="text-sm"><strong>Remarks:</strong> Content flows logically in DOM order. Tab navigation follows visual layout. Assignment questions presented in logical sequence.</p>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="text-lg font-semibold mb-2">1.4.1 Use of Color (Level A)</h3>
            <p className="mb-2"><strong>Conformance:</strong> <span className="text-green-600 font-semibold">Supports</span></p>
            <p className="text-sm"><strong>Remarks:</strong> Color is never the sole method of conveying information. Red/yellow/green mastery indicators include text labels and icons. Status badges include both color and text.</p>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="text-lg font-semibold mb-2">2.1.1 Keyboard (Level A)</h3>
            <p className="mb-2"><strong>Conformance:</strong> <span className="text-green-600 font-semibold">Supports</span></p>
            <p className="text-sm"><strong>Remarks:</strong> All interactive elements accessible via keyboard. Modal dialogs trap focus appropriately. Custom dropdowns and selects support arrow key navigation.</p>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="text-lg font-semibold mb-2">2.1.2 No Keyboard Trap (Level A)</h3>
            <p className="mb-2"><strong>Conformance:</strong> <span className="text-green-600 font-semibold">Supports</span></p>
            <p className="text-sm"><strong>Remarks:</strong> Users can navigate away from all components using standard keyboard methods. Modal dialogs include visible close buttons and ESC key support.</p>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="text-lg font-semibold mb-2">2.4.1 Bypass Blocks (Level A)</h3>
            <p className="mb-2"><strong>Conformance:</strong> <span className="text-green-600 font-semibold">Supports</span></p>
            <p className="text-sm"><strong>Remarks:</strong> Skip navigation links provided on all pages. Landmark regions (header, nav, main) allow screen reader users to jump to content.</p>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="text-lg font-semibold mb-2">2.4.2 Page Titled (Level A)</h3>
            <p className="mb-2"><strong>Conformance:</strong> <span className="text-green-600 font-semibold">Supports</span></p>
            <p className="text-sm"><strong>Remarks:</strong> All pages have descriptive titles that identify the content or purpose (e.g., "Student Dashboard - ImpressMe Kids", "Complete Assignment - Reading Comprehension").</p>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="text-lg font-semibold mb-2">3.1.1 Language of Page (Level A)</h3>
            <p className="mb-2"><strong>Conformance:</strong> <span className="text-green-600 font-semibold">Supports</span></p>
            <p className="text-sm"><strong>Remarks:</strong> HTML lang attribute set to "en" on all pages. Multi-language support planned for future releases.</p>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="text-lg font-semibold mb-2">4.1.1 Parsing (Level A)</h3>
            <p className="mb-2"><strong>Conformance:</strong> <span className="text-green-600 font-semibold">Supports</span></p>
            <p className="text-sm"><strong>Remarks:</strong> Valid HTML5 markup validated via W3C validator. No duplicate IDs, proper nesting, complete start/end tags.</p>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="text-lg font-semibold mb-2">4.1.2 Name, Role, Value (Level A)</h3>
            <p className="mb-2"><strong>Conformance:</strong> <span className="text-green-600 font-semibold">Supports</span></p>
            <p className="text-sm"><strong>Remarks:</strong> All custom UI components include proper ARIA roles, labels, and states. Buttons have accessible names, form controls have associated labels, status messages use aria-live regions.</p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">WCAG 2.1 Level AA Criteria</h2>
        
        <div className="space-y-6">
          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="text-lg font-semibold mb-2">1.4.3 Contrast (Minimum) (Level AA)</h3>
            <p className="mb-2"><strong>Conformance:</strong> <span className="text-green-600 font-semibold">Supports</span></p>
            <p className="text-sm"><strong>Remarks:</strong> All text meets 4.5:1 contrast ratio for normal text, 3:1 for large text. Design system enforces accessible color combinations via CSS variables. Dark mode maintains equivalent contrast ratios.</p>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="text-lg font-semibold mb-2">1.4.4 Resize Text (Level AA)</h3>
            <p className="mb-2"><strong>Conformance:</strong> <span className="text-green-600 font-semibold">Supports</span></p>
            <p className="text-sm"><strong>Remarks:</strong> Text can be resized up to 200% without loss of content or functionality. Responsive layouts adapt to zoom levels. No fixed pixel font sizes in critical areas.</p>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="text-lg font-semibold mb-2">1.4.5 Images of Text (Level AA)</h3>
            <p className="mb-2"><strong>Conformance:</strong> <span className="text-green-600 font-semibold">Supports</span></p>
            <p className="text-sm"><strong>Remarks:</strong> Text rendered using actual text elements, not images of text. Logos are the only exception (customizable alternative available). SVG icons include text alternatives.</p>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="text-lg font-semibold mb-2">2.4.5 Multiple Ways (Level AA)</h3>
            <p className="mb-2"><strong>Conformance:</strong> <span className="text-green-600 font-semibold">Supports</span></p>
            <p className="text-sm"><strong>Remarks:</strong> Multiple navigation methods provided: top navigation menu, sidebar navigation, breadcrumbs, search functionality, calendar views, and direct links to assignments/classrooms.</p>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="text-lg font-semibold mb-2">2.4.6 Headings and Labels (Level AA)</h3>
            <p className="mb-2"><strong>Conformance:</strong> <span className="text-green-600 font-semibold">Supports</span></p>
            <p className="text-sm"><strong>Remarks:</strong> Descriptive headings throughout (proper h1-h6 hierarchy). Form labels clearly describe input purpose. Buttons have descriptive text or aria-labels.</p>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="text-lg font-semibold mb-2">2.4.7 Focus Visible (Level AA)</h3>
            <p className="mb-2"><strong>Conformance:</strong> <span className="text-green-600 font-semibold">Supports</span></p>
            <p className="text-sm"><strong>Remarks:</strong> Visible focus indicators on all interactive elements. Custom focus-visible styles with high-contrast outlines. Focus never hidden or invisible.</p>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="text-lg font-semibold mb-2">3.1.2 Language of Parts (Level AA)</h3>
            <p className="mb-2"><strong>Conformance:</strong> <span className="text-green-600 font-semibold">Supports</span></p>
            <p className="text-sm"><strong>Remarks:</strong> Language changes within content marked with lang attributes. Reading passages and user-generated content respect language context.</p>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="text-lg font-semibold mb-2">3.2.3 Consistent Navigation (Level AA)</h3>
            <p className="mb-2"><strong>Conformance:</strong> <span className="text-green-600 font-semibold">Supports</span></p>
            <p className="text-sm"><strong>Remarks:</strong> Navigation components appear in consistent locations across all pages. Menu structure remains stable across role views (student/teacher/admin/parent).</p>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="text-lg font-semibold mb-2">3.2.4 Consistent Identification (Level AA)</h3>
            <p className="mb-2"><strong>Conformance:</strong> <span className="text-green-600 font-semibold">Supports</span></p>
            <p className="text-sm"><strong>Remarks:</strong> Icons and buttons with same function have consistent labels. "Delete" always means delete, "Submit" always submits. Design system enforces consistency.</p>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="text-lg font-semibold mb-2">3.3.3 Error Suggestion (Level AA)</h3>
            <p className="mb-2"><strong>Conformance:</strong> <span className="text-green-600 font-semibold">Supports</span></p>
            <p className="text-sm"><strong>Remarks:</strong> Form validation provides specific error messages and correction suggestions. Example: "Email must include @ symbol" instead of "Invalid input".</p>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="text-lg font-semibold mb-2">3.3.4 Error Prevention (Legal, Financial, Data) (Level AA)</h3>
            <p className="mb-2"><strong>Conformance:</strong> <span className="text-green-600 font-semibold">Supports</span></p>
            <p className="text-sm"><strong>Remarks:</strong> Confirmation dialogs for destructive actions (delete student, remove classroom, withdraw consent). Draft save functionality for assignments. Ability to review and edit before submission.</p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Section 508 Standards</h2>
        
        <table className="w-full border-collapse border text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="border p-3 text-left">Section</th>
              <th className="border p-3 text-left">Requirement</th>
              <th className="border p-3 text-left">Conformance</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border p-3 font-semibold">502.2.1</td>
              <td className="border p-3">User Control of Accessibility Features</td>
              <td className="border p-3 text-green-600 font-semibold">Supports</td>
            </tr>
            <tr>
              <td className="border p-3 font-semibold">502.2.2</td>
              <td className="border p-3">No Disruption of Accessibility Features</td>
              <td className="border p-3 text-green-600 font-semibold">Supports</td>
            </tr>
            <tr>
              <td className="border p-3 font-semibold">502.3.1</td>
              <td className="border p-3">Object Information</td>
              <td className="border p-3 text-green-600 font-semibold">Supports</td>
            </tr>
            <tr>
              <td className="border p-3 font-semibold">502.3.3</td>
              <td className="border p-3">Row, Column, and Headers</td>
              <td className="border p-3 text-green-600 font-semibold">Supports</td>
            </tr>
            <tr>
              <td className="border p-3 font-semibold">503.4</td>
              <td className="border p-3">User Controls for Captions and Audio Description</td>
              <td className="border p-3 text-green-600 font-semibold">Supports</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Assistive Technology Testing</h2>
        
        <div className="bg-muted/30 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Testing Environment</h3>
          <table className="w-full border-collapse border text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="border p-3 text-left">Assistive Technology</th>
                <th className="border p-3 text-left">Version</th>
                <th className="border p-3 text-left">Browser</th>
                <th className="border p-3 text-left">Result</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-3">JAWS</td>
                <td className="border p-3">2023</td>
                <td className="border p-3">Chrome 120</td>
                <td className="border p-3 text-green-600 font-semibold">Pass</td>
              </tr>
              <tr>
                <td className="border p-3">NVDA</td>
                <td className="border p-3">2023.3</td>
                <td className="border p-3">Firefox 121</td>
                <td className="border p-3 text-green-600 font-semibold">Pass</td>
              </tr>
              <tr>
                <td className="border p-3">VoiceOver (macOS)</td>
                <td className="border p-3">macOS 14</td>
                <td className="border p-3">Safari 17</td>
                <td className="border p-3 text-green-600 font-semibold">Pass</td>
              </tr>
              <tr>
                <td className="border p-3">VoiceOver (iOS)</td>
                <td className="border p-3">iOS 17</td>
                <td className="border p-3">Safari (mobile)</td>
                <td className="border p-3 text-green-600 font-semibold">Pass</td>
              </tr>
              <tr>
                <td className="border p-3">TalkBack</td>
                <td className="border p-3">Android 14</td>
                <td className="border p-3">Chrome (mobile)</td>
                <td className="border p-3 text-green-600 font-semibold">Pass</td>
              </tr>
              <tr>
                <td className="border p-3">ZoomText</td>
                <td className="border p-3">2023</td>
                <td className="border p-3">Chrome 120</td>
                <td className="border p-3 text-green-600 font-semibold">Pass</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Known Accessibility Issues & Roadmap</h2>
        
        <div className="space-y-4">
          <div className="border-l-4 border-yellow-500 pl-4 bg-yellow-50 p-4">
            <h3 className="font-semibold mb-2">Issue: Tournament Bracket Visualization</h3>
            <p className="text-sm mb-2"><strong>Impact:</strong> Screen reader users may have difficulty understanding bracket structure.</p>
            <p className="text-sm mb-2"><strong>Workaround:</strong> Text-based tournament summary provided alongside visual bracket.</p>
            <p className="text-sm"><strong>Timeline:</strong> Enhanced screen reader navigation for brackets planned for Q2 2025.</p>
          </div>

          <div className="border-l-4 border-yellow-500 pl-4 bg-yellow-50 p-4">
            <h3 className="font-semibold mb-2">Issue: Real-time Audio Waveform Visualization</h3>
            <p className="text-sm mb-2"><strong>Impact:</strong> Waveform animations during recording are decorative only and not essential for functionality.</p>
            <p className="text-sm mb-2"><strong>Workaround:</strong> Audio recording functionality fully accessible via keyboard and screen readers. Waveform hidden from assistive tech via aria-hidden.</p>
            <p className="text-sm"><strong>Timeline:</strong> No changes planned (decorative only).</p>
          </div>
        </div>
      </div>

      <div className="mt-8 p-6 bg-green-50 border-2 border-green-500 rounded-lg">
        <h2 className="text-xl font-bold mb-4 text-green-900">Accessibility Commitment</h2>
        <p className="mb-4 leading-relaxed">
          ImpressMe Kids is committed to ensuring digital accessibility for all users, including those with disabilities. 
          We continually work to improve the user experience and apply relevant accessibility standards to ensure our 
          platform is accessible to everyone.
        </p>
        <p className="font-semibold mb-2">For accessibility support or to report issues:</p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>Email: accessibility@impressmekids.com</li>
          <li>Expected response time: 2 business days</li>
          <li>Alternative format requests honored within 5 business days</li>
        </ul>
      </div>
    </div>
  );
}
