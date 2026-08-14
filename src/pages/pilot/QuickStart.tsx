import { PilotDoc } from './PilotDoc';

export default function QuickStart() {
  return (
    <PilotDoc
      eyebrow="Teacher / Director Quick Start"
      title="Get your classroom reading with Sir Bookears in under 10 minutes"
      subtitle="One page. Four steps. No LMS, no plugin, no district IT ticket."
    >
      <h2>Step 1 — Create your teacher account</h2>
      <ol>
        <li>Go to <strong>yubilearn.com</strong> and click <em>Sign in</em>.</li>
        <li>Choose <em>Teacher / Director</em> and enter your school email.</li>
        <li>Verify your email (2 minutes) and set a password.</li>
      </ol>

      <h2>Step 2 — Create a classroom and share the join code</h2>
      <ol>
        <li>From the Teacher Dashboard, click <em>New Classroom</em>.</li>
        <li>Name it (e.g., <em>Mrs. Ruiz — K-1 AM</em>) and pick the grade band.</li>
        <li>Copy the 6-character <strong>Join Code</strong>. Send it home in a note or post it on your smartboard.</li>
        <li>Parents create the child's account in 60 seconds by entering the join code at <strong>yubilearn.com</strong>.</li>
      </ol>

      <h2>Step 3 — Open the right mode</h2>
      <ul>
        <li><strong>Ages 2–5 (daycare / PreK):</strong> Pre-K Mode → pick a Sir Bookears video. Kids tap a word and read it aloud.</li>
        <li><strong>Grades K-5:</strong> RPG Mode → students pick a world. They read to progress the story and defeat bosses.</li>
        <li><strong>Reading assessment:</strong> AURA runs automatically in the background. You do nothing.</li>
      </ul>

      <h2>Step 4 — Read your growth report</h2>
      <ol>
        <li>From the Teacher Dashboard, click <em>Reports → 90-Day Growth</em>.</li>
        <li>You'll see WCPM, accuracy, and CCSS-mapped growth per student.</li>
        <li>Click <em>Print</em> for a PDF you can hand to your principal or a parent.</li>
      </ol>

      <h2>Two things to tell parents on Day 1</h2>
      <ul>
        <li><strong>Challenge Meter:</strong> Parents can slide difficulty 1–5 from their phone. Lock it with a PIN if a sibling is playing.</li>
        <li><strong>Audio consent:</strong> AURA only records if the parent opts in during account creation. It is off by default.</li>
      </ul>

      <h2>If something goes wrong</h2>
      <p>
        Email <a href="mailto:pilots@yubilearn.com">pilots@yubilearn.com</a>. Response
        within 2 business hours during the school day.
      </p>
    </PilotDoc>
  );
}
