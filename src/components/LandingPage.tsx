import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import {
  ArrowRight,
  Award,
  Camera,
  Baby,
  Blocks,
  BookOpen,
  Bus,
  CheckCircle2,
  Clock,
  GraduationCap,
  Heart,
  Landmark,
  Library,
  LogIn,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Monitor,
  Pencil,
  Phone,
  School,
  ShieldCheck,
  Trees,
  TrendingUp,
  Trophy,
  UtensilsCrossed,
  Users,
  X,
} from 'lucide-react';

const BASE = import.meta.env.BASE_URL;
const LOGO = `${BASE}gha-logo.png`;

const NAV_LINKS = [
  { href: '#about', label: 'About' },
  { href: '#classes', label: 'Classes' },
  { href: '#admissions', label: 'Admissions' },
  { href: '#facilities', label: 'Facilities' },
  { href: '#gallery', label: 'Gallery' },
  { href: '#contact', label: 'Contact' },
];

// Shown in the Gallery section until the school publishes its own photos
// through the portal (Photo Gallery section).
const STOCK_GALLERY = [
  { imageUrl: `${BASE}photos/gha-family.jpg`, title: 'The GHA family', category: 'Campus' },
  { imageUrl: `${BASE}photos/learners-1.jpg`, title: 'Our learners', category: 'School Life' },
  { imageUrl: `${BASE}photos/learners-2.jpg`, title: 'Side by side', category: 'School Life' },
  { imageUrl: `${BASE}photos/learners-3.jpg`, title: 'A bright start', category: 'Classroom' },
];

const VALUES = [
  { icon: BookOpen, title: 'Quality Education', text: 'A strong academic foundation built on the Zambian curriculum, from Baby Class to Grade 7.' },
  { icon: Users, title: 'Experienced & Caring Teachers', text: 'Dedicated, qualified teachers who know every learner by name and nurture each one to succeed.' },
  { icon: ShieldCheck, title: 'Safe & Nurturing Environment', text: 'A secure, welcoming campus where children feel at home, make friends and grow in confidence.' },
  { icon: TrendingUp, title: 'Academic & Personal Growth', text: 'Holistic child development — strong results in class, plus sport, reading and character building.' },
];

const CLASSES = [
  { icon: Baby, name: 'Baby Class', desc: 'A gentle first step into school life — play-based learning, early sounds, numbers and social skills.' },
  { icon: Blocks, name: 'Middle Class', desc: 'Building on the basics with phonics, counting, creative play and growing independence.' },
  { icon: BookOpen, name: 'Reception', desc: 'School readiness — early reading and writing, numeracy and confidence for Grade 1.' },
  { icon: Pencil, name: 'Grades 1 – 4', desc: 'Lower primary: literacy, numeracy, science and social studies with close teacher support.' },
  { icon: Trophy, name: 'Grades 5 – 7', desc: 'Upper primary: thorough preparation for the Grade 7 national examinations and beyond.' },
];

const APPLY_STEPS = [
  { title: 'Visit or Call Us', text: 'Come see the school at 1st Kabuzu Street or call / WhatsApp us to book a visit.' },
  { title: 'Collect Application Forms', text: 'Pick up an application form at the school office and gather the required documents.' },
  { title: 'Assessment & Placement', text: 'Your child meets our teachers for a friendly assessment to find the right class.' },
  { title: 'Enrolment', text: 'Complete registration, pay the fees and your child joins the GHA family!' },
];

const FACILITIES = [
  { icon: School, title: 'Modern Classrooms', text: 'Bright, well-equipped classrooms with small class sizes for focused learning.' },
  { icon: Library, title: 'Reading & Writing Culture', text: 'We build the core values of reading and writing in every child, every day — "a reader today, a leader tomorrow."' },
  { icon: UtensilsCrossed, title: 'Kitchen & Daily Meals', text: 'Nutritious lunches prepared on site every school day, served hot to our learners.' },
  { icon: Bus, title: 'School Transport', text: 'Safe, reliable door-to-door transport on trusted routes across Lusaka.' },
  { icon: Trees, title: 'Playground & Sports', text: 'Space to run, play and compete — healthy bodies support healthy minds.' },
  { icon: Landmark, title: 'Trusted Administration', text: 'Organised records, clear communication and printed receipts for every payment.' },
];

interface LandingPageProps {
  onLoginClick: () => void;
}

export function LandingPage({ onLoginClick }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { galleryPhotos } = useAppContext();

  // Photos published by the school through the portal take over from the
  // bundled ones as soon as any exist.
  const galleryItems = (galleryPhotos.length > 0 ? galleryPhotos : STOCK_GALLERY).slice(0, 8);

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-white text-gray-800 scroll-smooth">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
          <a href="#top" className="flex items-center gap-3" onClick={closeMenu}>
            <img src={LOGO} alt="Great Highway Academy logo" className="h-10 w-10 object-contain" />
            <div className="leading-tight">
              <span className="block font-extrabold text-[#232d6b]">Great Highway Academy</span>
              <span className="block text-xs text-violet-700 font-medium">Lusaka, Zambia</span>
            </div>
          </a>

          <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="text-sm font-medium text-gray-600 hover:text-violet-700 transition-colors">
                {link.label}
              </a>
            ))}
            <button
              onClick={onLoginClick}
              className="inline-flex items-center gap-2 bg-[#232d6b] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-violet-700 transition-colors"
            >
              <LogIn className="h-4 w-4" /> Portal Login
            </button>
          </nav>

          <button
            className="md:hidden p-2 text-[#232d6b]"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-gray-200 bg-white px-4 py-3 space-y-1" aria-label="Mobile navigation">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} onClick={closeMenu} className="block py-2 text-gray-700 font-medium hover:text-violet-700">
                {link.label}
              </a>
            ))}
            <button
              onClick={onLoginClick}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-[#232d6b] text-white px-4 py-3 rounded-lg font-semibold hover:bg-violet-700 transition-colors"
            >
              <LogIn className="h-4 w-4" /> Portal Login
            </button>
          </nav>
        )}
      </header>

      <main id="top">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#1a2152] via-[#232d6b] to-violet-800 text-white">
          <div className="absolute inset-0 opacity-20" aria-hidden="true">
            <svg className="w-full h-full" viewBox="0 0 1440 600" preserveAspectRatio="xMidYMid slice">
              {/* highway stripes echoing the GHA crest */}
              <polygon points="720,600 640,0 800,0" fill="#22b8cf" />
              <polygon points="520,600 560,0 640,0" fill="#7c3aed" />
              <polygon points="920,600 800,0 880,0" fill="#7c3aed" />
              <polygon points="320,600 480,0 560,0" fill="#22b8cf" />
              <polygon points="1120,600 880,0 960,0" fill="#22b8cf" />
            </svg>
          </div>
          <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-28 text-center">
            <img src={LOGO} alt="" className="h-24 w-24 md:h-28 md:w-28 mx-auto mb-6 rounded-full bg-white/95 p-2 shadow-xl" />
            <p className="inline-flex items-center gap-2 bg-teal-400/20 border border-teal-300/40 text-teal-100 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
              <GraduationCap className="h-4 w-4" /> Admissions are OPEN — 2026 Academic Year · Limited spaces!
            </p>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">Great Highway Academy</h1>
            <p className="text-xl md:text-2xl text-white font-medium mb-2">
              The future starts today — <span className="text-teal-300">a reader today, a leader tomorrow.</span>
            </p>
            <p className="text-indigo-100 max-w-2xl mx-auto mb-10">
              Empowering young minds today for a brighter tomorrow. Baby Class to Grade 7 in Libala, Lusaka.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="#admissions"
                className="inline-flex items-center gap-2 bg-teal-400 text-[#1a2152] px-8 py-3.5 rounded-xl font-bold text-lg hover:bg-teal-300 transition-colors shadow-lg"
              >
                Enroll Today <ArrowRight className="h-5 w-5" />
              </a>
              <button
                onClick={onLoginClick}
                className="inline-flex items-center gap-2 bg-white/10 border border-white/40 text-white px-8 py-3.5 rounded-xl font-bold text-lg hover:bg-white/20 transition-colors"
              >
                <LogIn className="h-5 w-5" /> Portal Login
              </button>
            </div>
          </div>
        </section>

        {/* Values strip */}
        <section className="bg-gray-50 border-b border-gray-100" aria-label="Why choose us">
          <div className="max-w-6xl mx-auto px-4 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-shadow">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-violet-100 text-violet-700 mb-4">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-[#232d6b] mb-2">{title}</h3>
                <p className="text-sm text-gray-600">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* About */}
        <section id="about" className="max-w-6xl mx-auto px-4 py-20 scroll-mt-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm font-bold text-teal-600 uppercase tracking-wider mb-2">About Our School</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#232d6b] mb-4">
                Join Our GHA Family — Where Excellence is Our Tradition!
              </h2>
              <p className="text-gray-600 mb-4">
                Great Highway Academy is a private primary school in Libala, Lusaka, offering quality education from
                Baby Class through Grade 7. We follow the Zambian curriculum and prepare our learners thoroughly for
                the national Grade 7 examinations — but we believe school is about more than exams.
              </p>
              <p className="text-gray-600 mb-6">
                Reading and writing are at the heart of everything we do. Our motto says it best:{' '}
                <em className="text-violet-700 font-semibold not-italic">
                  "The future starts today — a reader today, a leader tomorrow."
                </em>{' '}
                We nurture these core values in every child, every day — because a child who reads and
                writes with confidence can learn anything.
              </p>
              <ul className="space-y-3">
                {['Zambian curriculum, Baby Class to Grade 7', 'Small classes with individual attention', 'Core values of reading and writing built daily in every grade', 'Sport, music and character development'].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-gray-700">
                    <CheckCircle2 className="h-5 w-5 text-teal-500 mt-0.5 flex-shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-6">
              <img
                src={`${BASE}photos/gha-family.jpg`}
                alt="Great Highway Academy learners in front of the school"
                className="w-full rounded-2xl shadow-lg object-cover max-h-80"
                loading="lazy"
              />
              <div className="bg-gradient-to-br from-violet-50 to-teal-50 rounded-2xl border border-violet-100 p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#232d6b] text-white">
                  <Heart className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-[#232d6b] text-lg">A Message from the Principal</h3>
              </div>
              <p className="text-gray-700 mb-4">
                "At Great Highway Academy, we treat every child as our own. Our doors are open to families who want a
                safe, caring school where children learn to read confidently, think for themselves and dream big.
                Come and visit us — we would love to welcome your family into ours."
              </p>
              <p className="font-semibold text-[#232d6b]">Mrs. Tembo</p>
              <p className="text-sm text-gray-500">Principal, Great Highway Academy</p>
              </div>
            </div>
          </div>
        </section>

        {/* Classes */}
        <section id="classes" className="bg-[#1a2152] text-white py-20 scroll-mt-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <p className="text-sm font-bold text-teal-300 uppercase tracking-wider mb-2">Our Classes</p>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-3">From First Steps to Grade 7</h2>
              <p className="text-indigo-100 max-w-2xl mx-auto">
                Every stage of your child's primary journey, under one roof.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
              {CLASSES.map(({ icon: Icon, name, desc }) => (
                <div key={name} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors">
                  <div className="inline-flex items-center justify-center w-11 h-11 rounded-lg bg-teal-400/20 text-teal-300 mb-4">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold mb-2">{name}</h3>
                  <p className="text-sm text-indigo-100">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Admissions & Fees */}
        <section id="admissions" className="max-w-6xl mx-auto px-4 py-20 scroll-mt-20">
          <div className="text-center mb-12">
            <p className="text-sm font-bold text-teal-600 uppercase tracking-wider mb-2">Admissions & Fees</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#232d6b] mb-3">
              Admissions are Open for 2026 — Limited Spaces!
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Give your child the best start in life. Enrolment for the 2026 academic year is open now.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-10 items-start">
            {/* Fees on request */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-[#232d6b] text-white px-6 py-4">
                <h3 className="font-bold text-lg">School Fees & Payment Plans</h3>
              </div>
              <div className="p-6">
                <img
                  src={`${BASE}photos/learners-1.jpg`}
                  alt="Great Highway Academy learners"
                  className="w-full rounded-xl object-cover max-h-56 mb-5"
                  loading="lazy"
                />
                <p className="text-gray-600 mb-4">
                  Our fees are affordable and family-friendly, with cash and installment options for
                  every grade from Baby Class to Grade 7. Optional lunch and school transport plans
                  are also available.
                </p>
                <p className="text-gray-600 mb-5">
                  For the current fee structure, please contact the school office — we will gladly
                  share it and help you choose the plan that suits your family.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Cash & installment options', 'Optional lunch plan', 'Optional transport plan'].map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-800 text-sm font-medium px-3 py-1.5 rounded-full">
                      <CheckCircle2 className="h-4 w-4" /> {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* How to apply */}
            <div>
              <h3 className="font-bold text-xl text-[#232d6b] mb-6">How to Apply</h3>
              <ol className="space-y-6 mb-8">
                {APPLY_STEPS.map(({ title, text }, index) => (
                  <li key={title} className="flex gap-4">
                    <span className="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-full bg-violet-700 text-white font-bold">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-bold text-gray-800">{title}</p>
                      <p className="text-sm text-gray-600">{text}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="tel:+260977772677"
                  className="inline-flex items-center justify-center gap-2 bg-[#232d6b] text-white px-6 py-3 rounded-xl font-bold hover:bg-violet-700 transition-colors"
                >
                  <Phone className="h-5 w-5" /> Call 0977 772 677
                </a>
                <a
                  href="https://wa.me/260977772677"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-teal-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-teal-600 transition-colors"
                >
                  <MessageCircle className="h-5 w-5" /> WhatsApp Us
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Facilities */}
        <section id="facilities" className="bg-gray-50 py-20 scroll-mt-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <p className="text-sm font-bold text-teal-600 uppercase tracking-wider mb-2">Facilities & School Life</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#232d6b]">Everything Your Child Needs</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {FACILITIES.map(({ icon: Icon, title, text }) => (
                <div key={title} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-shadow">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#232d6b]/10 text-[#232d6b] mb-4">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-[#232d6b] mb-2">{title}</h3>
                  <p className="text-sm text-gray-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Portal */}
        <section className="bg-gradient-to-br from-violet-800 via-[#232d6b] to-[#1a2152] text-white py-20" aria-label="Parent and staff portal">
          <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm font-bold text-teal-300 uppercase tracking-wider mb-2">For Parents & Staff</p>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">The GHA School Portal</h2>
              <p className="text-indigo-100 mb-6">
                Our school runs on a modern management system — fee payments and printed receipts, attendance,
                academic results, timetables, announcements and more, all in one place. Staff and administrators
                sign in here.
              </p>
              <button
                onClick={onLoginClick}
                className="inline-flex items-center gap-2 bg-teal-400 text-[#1a2152] px-8 py-3.5 rounded-xl font-bold text-lg hover:bg-teal-300 transition-colors shadow-lg"
              >
                <Monitor className="h-5 w-5" /> Open the Portal
              </button>
            </div>
            <div className="space-y-6">
              {[
                { src: `${BASE}screenshots/dashboard.png`, alt: 'GHA management system dashboard screenshot' },
                { src: `${BASE}screenshots/login.png`, alt: 'GHA management system login screenshot' },
              ].map(({ src, alt }) => (
                <div key={src} className="rounded-xl overflow-hidden shadow-2xl border border-white/20 bg-white/5">
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-white/10">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  </div>
                  <img src={src} alt={alt} className="w-full" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Gallery */}
        <section id="gallery" className="bg-gray-50 py-20 scroll-mt-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <p className="text-sm font-bold text-teal-600 uppercase tracking-wider mb-2">Photo Gallery</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#232d6b] mb-3">Life at Great Highway Academy</h2>
              <p className="text-gray-600 max-w-2xl mx-auto inline-flex items-center gap-2">
                <Camera className="h-5 w-5 text-violet-700" /> Moments from our events, classrooms and school family.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {galleryItems.map((photo) => (
                <figure key={photo.imageUrl} className="group relative rounded-xl overflow-hidden shadow-sm border border-gray-100 bg-white">
                  <img
                    src={photo.imageUrl}
                    alt={photo.title}
                    className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent text-white px-3 pb-2.5 pt-8">
                    <p className="text-sm font-semibold truncate">{photo.title}</p>
                    <p className="text-xs text-white/85">{photo.category}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
            <p className="text-center text-sm text-gray-500 mt-6">
              New photos are published by the school through the GHA portal after every event.
            </p>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="max-w-6xl mx-auto px-4 py-20 scroll-mt-20">
          <div className="text-center mb-12">
            <p className="text-sm font-bold text-teal-600 uppercase tracking-wider mb-2">Contact Us</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#232d6b]">Visit Us — We'd Love to Meet You</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <MapPin className="h-8 w-8 text-violet-700 mb-4" />
              <h3 className="font-bold text-[#232d6b] mb-2">Location</h3>
              <p className="text-sm text-gray-600 mb-3">
                1st Kabuzu Street, Along Nationalist Rd, Next to Libala SDA, Lusaka, Zambia
              </p>
              <a
                href="https://maps.google.com/?q=Libala+SDA+Nationalist+Road+Lusaka+Zambia"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-teal-600 hover:text-teal-700"
              >
                Open in Google Maps →
              </a>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <Phone className="h-8 w-8 text-violet-700 mb-4" />
              <h3 className="font-bold text-[#232d6b] mb-2">Call / WhatsApp</h3>
              <p className="text-sm text-gray-600">
                <a href="tel:+260977772677" className="block hover:text-violet-700">0977 772 677</a>
                <a href="tel:+260966772677" className="block hover:text-violet-700">0966 772 677</a>
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <Mail className="h-8 w-8 text-violet-700 mb-4" />
              <h3 className="font-bold text-[#232d6b] mb-2">Email</h3>
              <a href="mailto:info@greathighwayacademy.edu.zm" className="text-sm text-gray-600 hover:text-violet-700 break-all">
                info@greathighwayacademy.edu.zm
              </a>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <Clock className="h-8 w-8 text-violet-700 mb-4" />
              <h3 className="font-bold text-[#232d6b] mb-2">Office Hours</h3>
              <p className="text-sm text-gray-600">
                Monday – Friday<br />07:00 – 16:30
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#1a2152] text-white">
        <div className="max-w-6xl mx-auto px-4 py-12 grid md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-white p-1.5 ring-2 ring-teal-300/60 shadow-lg flex-shrink-0">
                <img src={LOGO} alt="Great Highway Academy crest" className="h-full w-full object-contain" />
              </span>
              <span className="font-extrabold text-lg">Great Highway Academy</span>
            </div>
            <p className="text-sm text-indigo-100">
              The future starts today — a reader today, a leader tomorrow.
            </p>
          </div>
          <div>
            <h3 className="font-bold mb-4 text-teal-300">Quick Links</h3>
            <ul className="space-y-2 text-sm text-indigo-100">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="hover:text-white transition-colors">{link.label}</a>
                </li>
              ))}
              <li>
                <button onClick={onLoginClick} className="hover:text-white transition-colors">Portal Login</button>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4 text-teal-300">Get in Touch</h3>
            <ul className="space-y-2 text-sm text-indigo-100">
              <li>1st Kabuzu Street, Along Nationalist Rd</li>
              <li>Next to Libala SDA, Lusaka, Zambia</li>
              <li>0977 772 677 / 0966 772 677</li>
              <li>info@greathighwayacademy.edu.zm</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <p className="max-w-6xl mx-auto px-4 py-5 text-center text-sm text-indigo-200 flex items-center justify-center gap-2 flex-wrap">
            <Award className="h-4 w-4" /> © {new Date().getFullYear()} Great Highway Academy. Where excellence is our tradition!
          </p>
        </div>
      </footer>
    </div>
  );
}
