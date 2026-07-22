import { useState } from 'react';
import {
  BookOpen, Compass, Users, CreditCard, Shirt, GraduationCap, Search, Bell, UserCircle,
  ChevronDown, Shield, Lightbulb, ArrowRight,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useThemeClasses } from '../hooks/useThemeClasses';

function Section({ icon: Icon, title, children, open }: { icon: typeof Compass; title: string; children: React.ReactNode; open?: boolean }) {
  const [isOpen, setIsOpen] = useState(!!open);
  const tc = useThemeClasses();
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <button onClick={() => setIsOpen(o => !o)} className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50">
        <div className={`w-9 h-9 rounded-lg ${tc.light} flex items-center justify-center flex-shrink-0`}><Icon className={`h-5 w-5 ${tc.text}`} /></div>
        <span className="font-semibold text-gray-900 flex-1">{title}</span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
      </button>
      {isOpen && <div className="px-5 pb-5 pt-1 text-sm text-gray-600 space-y-3">{children}</div>}
    </div>
  );
}

const Step = ({ n, children }: { n: number; children: React.ReactNode }) => (
  <div className="flex gap-3">
    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">{n}</span>
    <p className="flex-1">{children}</p>
  </div>
);

export function HelpGuide() {
  const { branding } = useAppContext();
  const tc = useThemeClasses();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Help &amp; Guide</h1>
        <p className="text-gray-600">How the system is organised and how to get things done</p>
      </div>

      <div className={`rounded-xl p-5 text-white`} style={{ background: 'linear-gradient(135deg, var(--gha-primary, #1d4ed8), var(--gha-accent, #3b82f6))' }}>
        <div className="flex items-center gap-2 mb-1"><BookOpen className="h-5 w-5" /><p className="font-semibold">Welcome to {branding.schoolName}'s management system</p></div>
        <p className="text-sm opacity-90">Everything about students, money, staff, academics, stores and reports lives here. This guide explains how to move around and walks through a full real-world example. Nothing you read here changes any data — explore freely.</p>
      </div>

      <Section icon={Compass} title="Getting around" open>
        <p>The <strong>left sidebar</strong> groups every area of the school: People &amp; Classes, Money, Academics, Planning, Store &amp; Supplies, Reports and Personalise. Click a group heading to collapse it, or the collapse arrow at the top to shrink the whole sidebar.</p>
        <ul className="space-y-1.5 list-none">
          <li className="flex gap-2"><Search className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" /><span><strong>Search</strong> (top bar, or press Ctrl/⌘ + K) finds any student, staff member or book instantly.</span></li>
          <li className="flex gap-2"><Bell className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" /><span><strong>Notifications</strong> (bell, admins only) show password-reset requests from staff.</span></li>
          <li className="flex gap-2"><UserCircle className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" /><span><strong>Your profile</strong> (top-right) shows your role and lets you change your own password.</span></li>
        </ul>
        <p className="text-xs text-gray-400">Tip: on a phone or tablet, tap the menu icon to open the sidebar. You can also install the app to your home screen for offline use.</p>
      </Section>

      <Section icon={Shield} title="Who can see what (roles)">
        <p>Each user has a role that decides which sections they see:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li><strong>Admin</strong> — everything, including Settings and user management.</li>
          <li><strong>Cashier</strong> — front-desk finance: payments, debtors, uniforms, reports.</li>
          <li><strong>Teacher</strong> — academics: attendance, results, timetable, class manager.</li>
          <li><strong>Viewer</strong> — read-only overview.</li>
        </ul>
        <p>Admins manage users in <strong>Settings → Users &amp; Roles</strong>, where you can also generate passwords and a master access code.</p>
      </Section>

      <Section icon={Users} title="Everyday tasks">
        <div className="space-y-2">
          <p><strong>Enrol a student:</strong> Students → Enrol Student. To load a whole class at once, use Import CSV.</p>
          <p><strong>Record a payment:</strong> Fees &amp; Payments → Record Payment. Print a receipt from the printer icon on any row.</p>
          <p><strong>Chase unpaid fees:</strong> Reports Centre → Arrears Aging shows who owes what by how overdue; Debtors lets you send a WhatsApp reminder.</p>
          <p><strong>Mark attendance / enter results:</strong> Attendance and Academic Results, chosen by class and term. Report cards print from Results.</p>
          <p><strong>End of year:</strong> Class Manager → End of Year Promotion moves every class up a grade in one step.</p>
        </div>
      </Section>

      <Section icon={Shirt} title="The Uniform Management module">
        <p>This is a complete uniform system with its own tabs across the top:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li><strong>Store</strong> — the quick counter: pick a student, then add or remove uniform items on their account.</li>
          <li><strong>Catalogue</strong> — every uniform item with photos, specs, price and a QR code.</li>
          <li><strong>Size Chart</strong> — your official school measurements per size.</li>
          <li><strong>Measurements</strong> — record a student's body measurements; the system suggests a size.</li>
          <li><strong>Tailor Orders</strong> — production orders you can print and hand to a tailor.</li>
          <li><strong>Inventory &amp; Stock Movement</strong> — stock by item/size, with low-stock alerts and reorder purchase orders.</li>
        </ul>
      </Section>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3"><Lightbulb className="h-5 w-5 text-amber-600" /><p className="font-semibold text-amber-900">Example: kitting out a new pupil in uniform</p></div>
        <p className="text-sm text-amber-800 mb-3">Meet Chanda, who has just joined Grade 3 and needs a full uniform. Here's the whole journey through the system:</p>
        <div className="space-y-2.5 text-sm text-amber-900">
          <Step n={1}>Enrol Chanda in <strong>Students</strong> (or she may already be there).</Step>
          <Step n={2}>In <strong>Uniform Management → Measurements</strong>, pick Chanda, type her chest/waist/etc. The system suggests a <strong>recommended size</strong> with a confidence badge and saves it (previous measurements are kept as history).</Step>
          <Step n={3}>Go to <strong>Store</strong>, select Chanda, and click <strong>Add</strong> on each item she needs — dress, shirts, jersey. Each one drops out of stock and (if "Bill to account" is ticked) is added to her fees. Added the wrong thing? Click the red remove icon and the stock comes straight back.</Step>
          <Step n={4}>If an item is out of stock, the school orders more: <strong>Inventory</strong> shows the low-stock warning, and the <strong>Reorder PO</strong> button prints a purchase order for the supplier. For custom-tailored items, raise a <strong>Tailor Order</strong> and print the production sheet for the tailor.</Step>
          <Step n={5}>When Chanda's guardian pays, record it in <strong>Fees &amp; Payments</strong> and print the receipt. The uniform charges that were billed to her account show up there alongside her school fees.</Step>
        </div>
        <p className="text-xs text-amber-700 mt-3 flex items-center gap-1">That's the full loop — measure <ArrowRight className="h-3 w-3 inline" /> issue <ArrowRight className="h-3 w-3 inline" /> restock <ArrowRight className="h-3 w-3 inline" /> bill <ArrowRight className="h-3 w-3 inline" /> receipt — all linked to the one student record.</p>
      </div>

      <Section icon={CreditCard} title="Keeping your data safe">
        <p>All data lives in this browser and (if you set up Cloud Sync) in your school's private cloud. Two habits keep it safe:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li><strong>Back up regularly</strong> — Settings → Backup &amp; Restore downloads a file you can keep. The banner nudges you if it's been a while.</li>
          <li><strong>Turn on Cloud Sync</strong> — Settings → Cloud Sync keeps every device in step and gives you an off-device copy.</li>
        </ul>
        <p>Every sensitive action (logins, password changes, edits to money) is recorded in <strong>Settings → Activity Log</strong>.</p>
      </Section>

      <Section icon={GraduationCap} title="Printing &amp; exporting">
        <p>Most lists have an <strong>Export</strong> button that saves a spreadsheet (CSV) you can open in Excel. Documents — receipts, report cards, ID cards, registers, uniform spec sheets, tailor orders — open in a print window where you can print on paper or choose <strong>Save as PDF</strong>.</p>
      </Section>

      <p className={`text-center text-sm ${tc.text} font-medium pt-2`}>Still stuck? Ask your administrator, who can see every section and adjust access.</p>
    </div>
  );
}
