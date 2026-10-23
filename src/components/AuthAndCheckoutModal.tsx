import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Check,
  CreditCard,
  ExternalLink,
  RefreshCw,
  MessageCircle,
} from 'lucide-react';
import { Course, Profile } from '../types/academy';
import { isSupabaseClientConfigured, supabase } from '../lib/supabaseClient';
import {
  fetchOrCreateUserProfile,
  initializePaystackPayment,
  verifyPaystackPayment,
} from '../services/academyService';

interface AuthModalProps {
  isOpen: boolean;
  initialTab: 'login' | 'register' | 'instructor' | 'checkout';
  course: Course;
  currentUserEmail?: string;
  authPromptMessage?: string | null;
  onClose: () => void;
  onAuthenticated: (profile: Profile) => void;
  onPaymentVerified?: () => void;
}

export const AuthAndCheckoutModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialTab,
  course,
  currentUserEmail,
  authPromptMessage,
  onClose,
  onAuthenticated,
  onPaymentVerified,
}) => {
  const [tab, setTab] = useState<'login' | 'register' | 'instructor' | 'checkout'>(initialTab);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(
    currentUserEmail && !currentUserEmail.endsWith('.local') ? currentUserEmail : ''
  );
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // Enrolment / Paystack state
  const [checkoutEmail, setCheckoutEmail] = useState(
    currentUserEmail && !currentUserEmail.endsWith('.local') ? currentUserEmail : ''
  );
  const [paystackLoading, setPaystackLoading] = useState(false);
  const [paystackAuthUrl, setPaystackAuthUrl] = useState<string | null>(null);
  const [paystackRef, setPaystackRef] = useState('');
  const [showRefVerifier, setShowRefVerifier] = useState(false);
  const [verifyFeedback, setVerifyFeedback] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  const supabaseReady = isSupabaseClientConfigured();

  React.useEffect(() => {
    setTab(initialTab);
    setErrorMsg('');
    setInfoMsg('');
    if (currentUserEmail && !currentUserEmail.endsWith('.local')) {
      setEmail(currentUserEmail);
      setCheckoutEmail(currentUserEmail);
    }
  }, [initialTab, isOpen, currentUserEmail]);

  if (!isOpen) return null;

  const validateEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleInitializePaystack = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyFeedback(null);
    if (!validateEmail(checkoutEmail)) {
      setVerifyFeedback({
        ok: false,
        text: 'Please enter a valid email address for your course receipt.',
      });
      return;
    }

    setPaystackLoading(true);
    const res = await initializePaystackPayment({
      email: checkoutEmail.trim(),
      callbackUrl: window.location.origin,
    });
    setPaystackLoading(false);

    if (!res.ok) {
      setVerifyFeedback({
        ok: false,
        text: res.error || 'Could not initialize checkout. Please try again.',
      });
      return;
    }

    if (res.reference) {
      setPaystackRef(res.reference);
      setShowRefVerifier(true);
    }
    if (res.authorizationUrl) {
      setPaystackAuthUrl(res.authorizationUrl);
      setVerifyFeedback({
        ok: true,
        text: `Checkout ready (Ref: ${res.reference}). Click "Complete Payment on Paystack" below, then verify your reference once completed.`,
      });
    }
  };

  const handleVerifyReference = async () => {
    if (!paystackRef.trim()) {
      setVerifyFeedback({
        ok: false,
        text: 'Enter your Paystack transaction reference to verify.',
      });
      return;
    }

    setPaystackLoading(true);
    const res = await verifyPaystackPayment(paystackRef.trim());
    setPaystackLoading(false);

    if (res.ok && res.verified) {
      setVerifyFeedback({
        ok: true,
        text:
          res.message ||
          `Payment verified (${res.currency} ${res.amount?.toLocaleString()}). Full lifetime course access is now active!`,
      });
      if (onPaymentVerified) {
        onPaymentVerified();
      }
    } else {
      setVerifyFeedback({
        ok: false,
        text: res.error || 'Payment verification pending or reference not found.',
      });
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    const cleanEmail = email.trim().toLowerCase();

    // Direct Lead Instructor Authentication check
    if (cleanEmail === 'okorotochukwu007@gmail.com') {
      if (password === 'Solution') {
        onAuthenticated({
          id: 'instructor-okoro-tochukwu',
          email: 'okorotochukwu007@gmail.com',
          fullName: 'Okoro Tochuwku (Lead Instructor)',
          role: 'admin',
          createdAt: '2026-10-23',
          isDemoSession: false,
        });
        onClose();
        return;
      } else {
        setErrorMsg('Incorrect instructor password. Please enter "Solution" to log in.');
        return;
      }
    }

    if (tab === 'register' && fullName.trim().length < 2) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!validateEmail(email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters.');
      return;
    }

    if (!supabaseReady || !supabase) {
      onAuthenticated({
        id: 'demo-student-local',
        email: email.trim(),
        fullName: fullName.trim() || email.split('@')[0],
        role: 'student_demo',
        createdAt: new Date().toISOString().split('T')[0],
        isDemoSession: true,
      });
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      if (tab === 'register') {
        const regRes = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            password,
            fullName: fullName.trim(),
          }),
        });
        const regData = await regRes.json();

        if (!regRes.ok || !regData.ok) {
          const { data, error } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              emailRedirectTo: window.location.origin,
              data: { full_name: fullName.trim() },
            },
          });

          if (error) {
            setErrorMsg(error.message);
            setIsSubmitting(false);
            return;
          }

          if (data.user && !data.session) {
            setInfoMsg('Account created! Please sign in below.');
            setTab('login');
            setIsSubmitting(false);
            return;
          }
        }

        const { data: signInData, error: signInErr } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

        if (signInErr) {
          setErrorMsg(signInErr.message);
          setIsSubmitting(false);
          return;
        }

        if (signInData.user) {
          const profile = await fetchOrCreateUserProfile(
            signInData.user.id,
            signInData.user.email || email.trim(),
            fullName.trim()
          );
          if (profile) {
            onAuthenticated(profile);
            onClose();
          }
        }
      } else {
        let { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (
          error &&
          error.message.toLowerCase().includes('email not confirmed')
        ) {
          await fetch('/api/auth/confirm-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.trim() }),
          });
          const retry = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
          data = retry.data;
          error = retry.error;
        }

        if (error) {
          setErrorMsg(error.message);
          setIsSubmitting(false);
          return;
        }

        if (data.user) {
          const profile = await fetchOrCreateUserProfile(
            data.user.id,
            data.user.email || email.trim()
          );
          if (profile) {
            onAuthenticated(profile);
            onClose();
          }
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
        {/* Clean Coursera-Style Header */}
        <div className="px-7 pt-7 pb-4 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-emerald-800">
              Excel to Data Analyst Academy
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {tab === 'login'
                ? 'Learner Sign In'
                : tab === 'register'
                ? 'Sign Up & Start Level 1'
                : tab === 'instructor'
                ? 'Instructor Console Sign In'
                : 'Enrol in Full Academy'}
            </h2>
            <p className="text-xs text-slate-500">
              {tab === 'checkout'
                ? 'One-time tuition payment for lifetime access to all 6 levels.'
                : tab === 'instructor'
                ? 'Unrestricted access for Lead Instructor Okoro Tochuwku.'
                : 'Level 1 is free for all students. Enrol anytime for Levels 2–6.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clean Segmented Switcher (4 Tabs) */}
        <div className="px-7">
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setErrorMsg('');
              }}
              className={`py-2 rounded-lg transition-colors cursor-pointer ${
                tab === 'login'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('register');
                setErrorMsg('');
              }}
              className={`py-2 rounded-lg transition-colors cursor-pointer ${
                tab === 'register'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('instructor');
                setEmail('okorotochukwu007@gmail.com');
                setPassword('Solution');
                setErrorMsg('');
              }}
              className={`py-2 rounded-lg transition-colors cursor-pointer ${
                tab === 'instructor'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-emerald-800 hover:text-emerald-950 font-bold'
              }`}
            >
              Instructor
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('checkout');
                setErrorMsg('');
              }}
              className={`py-2 rounded-lg transition-colors cursor-pointer ${
                tab === 'checkout'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Enrol
            </button>
          </div>
        </div>

        <div className="p-7 space-y-5 text-xs">
          {authPromptMessage && (tab === 'login' || tab === 'register') && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-950 font-medium leading-relaxed">
              {authPromptMessage}
            </div>
          )}

          {(tab === 'login' || tab === 'register' || tab === 'instructor') && (
            <form onSubmit={handleAuthSubmit} className="space-y-4" noValidate>
              {tab === 'instructor' && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5 text-emerald-950 text-xs">
                  <div className="font-bold flex items-center justify-between">
                    <span>Okoro Tochuwku (Lead Instructor)</span>
                    <span className="px-2 py-0.5 bg-emerald-800 text-white font-mono rounded text-[10px]">VERIFIED ADMIN</span>
                  </div>
                  <div className="text-emerald-900 font-medium">
                    Data Analyst with 4 years of experience in the financial services industry
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    Email: <code className="font-mono text-emerald-900 font-semibold">okorotochukwu007@gmail.com</code> · Direct WhatsApp: <code className="font-mono font-semibold">07080145682</code>
                  </p>
                </div>
              )}

              {tab === 'register' && (
                <div className="space-y-1.5">
                  <label
                    htmlFor="auth-fullname"
                    className="block font-semibold text-slate-800"
                  >
                    Full Name
                  </label>
                  <input
                    id="auth-fullname"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-emerald-700"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label
                  htmlFor="auth-email"
                  className="block font-semibold text-slate-800"
                >
                  Email Address
                </label>
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="okorotochukwu007@gmail.com"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-emerald-700 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="auth-password"
                  className="block font-semibold text-slate-800"
                >
                  Password
                </label>
                <input
                  id="auth-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Solution"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-emerald-700"
                />
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 font-medium">
                  {errorMsg}
                </div>
              )}

              {infoMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950 font-medium">
                  {infoMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-emerald-800 text-white font-semibold text-sm rounded-lg hover:bg-emerald-900 disabled:bg-slate-400 transition-colors cursor-pointer"
              >
                {isSubmitting
                  ? 'Please wait...'
                  : tab === 'instructor'
                  ? 'Sign In as Lead Instructor (Okoro Tochuwku)'
                  : tab === 'login'
                  ? 'Log In'
                  : 'Join for Free'}
              </button>

              <div className="pt-2 text-center text-slate-500">
                {tab === 'instructor' ? (
                  <span className="text-slate-600">
                    Lead Instructor credential preset loaded. Password: <code className="font-mono font-bold text-slate-900">Solution</code>
                  </span>
                ) : tab === 'login' ? (
                  <>
                    New to Excel Academy?{' '}
                    <button
                      type="button"
                      onClick={() => setTab('register')}
                      className="text-emerald-800 font-semibold hover:underline cursor-pointer"
                    >
                      Create an account
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setTab('login')}
                      className="text-emerald-800 font-semibold hover:underline cursor-pointer"
                    >
                      Log in
                    </button>
                  </>
                )}
              </div>
            </form>
          )}

          {tab === 'checkout' && (
            <div className="space-y-4">
              {/* Coursera-Style Certificate Enrolment Summary */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 text-sm">
                    Full 6-Level Academy Access
                  </span>
                  <span className="text-lg font-bold font-mono text-emerald-800 tabular-nums">
                    {course.currency} {course.oneTimePrice.toLocaleString()}
                  </span>
                </div>
                <div className="space-y-1.5 text-slate-600 pt-1 border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>All 54 modules & 108 step-by-step video lessons</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>Downloadable Excel datasets & practice workbooks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>6 real-world data analyst portfolio projects</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>One-time payment · Lifetime access</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleInitializePaystack} className="space-y-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="paystack-email"
                    className="block font-semibold text-slate-800"
                  >
                    Email Address for Enrolment
                  </label>
                  <input
                    id="paystack-email"
                    type="email"
                    required
                    value={checkoutEmail}
                    onChange={(e) => setCheckoutEmail(e.target.value)}
                    placeholder="name@email.com"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-emerald-700"
                  />
                </div>

                <button
                  type="submit"
                  disabled={paystackLoading}
                  className="w-full py-3 px-4 bg-emerald-800 text-white font-semibold text-sm rounded-lg hover:bg-emerald-900 disabled:bg-slate-400 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  {paystackLoading
                    ? 'Preparing Secure Checkout...'
                    : `Pay ${course.currency} ${course.oneTimePrice.toLocaleString()} with Paystack`}
                </button>
              </form>

              {paystackAuthUrl && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2.5">
                  <a
                    href={paystackAuthUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 flex items-center justify-center gap-2"
                  >
                    <span>Complete Payment on Paystack</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRefVerifier(!showRefVerifier)}
                  className="text-slate-600 hover:text-slate-900 font-medium underline cursor-pointer"
                >
                  {showRefVerifier
                    ? 'Hide payment reference verification'
                    : 'Already paid? Verify your payment reference'}
                </button>

                {showRefVerifier && (
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="text"
                      value={paystackRef}
                      onChange={(e) => setPaystackRef(e.target.value)}
                      placeholder="EXL-ACAD-..."
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono text-xs"
                    />
                    <button
                      type="button"
                      disabled={paystackLoading}
                      onClick={handleVerifyReference}
                      className="px-3.5 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-emerald-800 flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Verify</span>
                    </button>
                  </div>
                )}
              </div>

              {verifyFeedback && (
                <div
                  className={`p-3 rounded-lg border font-medium leading-relaxed ${
                    verifyFeedback.ok
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : 'bg-amber-50 border-amber-200 text-amber-950'
                  }`}
                >
                  {verifyFeedback.text}
                </div>
              )}

              <div className="flex items-center justify-center gap-1.5 text-slate-500 pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Secured by Paystack · Instant lifetime activation</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface LegalModalProps {
  docType: 'privacy' | 'terms' | 'refund' | 'contact' | null;
  onClose: () => void;
}

export const LegalAndContactModal: React.FC<LegalModalProps> = ({ docType, onClose }) => {
  if (!docType) return null;

  const contentMap = {
    contact: {
      title: 'Student Support & Instructor Help',
      body: [
        'Lead Instructor: Okoro Tochuwku',
        'Official Support Email: okorotochukwu007@gmail.com',
        'Direct WhatsApp Helpline: 07080145682 (+234 708 014 5682)',
        'Academy Campus / Office Address: Victoria Island & Ikeja Tech Hub, Lagos, Nigeria',
        'Support Hours: Monday – Saturday, 08:00 – 18:00 WAT',
      ],
      whatsappButton: true,
    },
    privacy: {
      title: 'Privacy Policy',
      body: [
        '1. Account & Progress Data: We store your name, email address, completed lessons, quiz scores, and capstone progress securely in our database.',
        '2. Payment Security: All tuition transactions are securely encrypted and processed by Paystack. We never store credit card or bank details.',
        '3. Data Isolation: Private user profile encryption and Row Level Security ensure your learning data remains completely private.',
      ],
      whatsappButton: false,
    },
    terms: {
      title: 'Terms of Service',
      body: [
        '1. Course Access: A verified one-time tuition payment grants personal lifetime access to all 6 levels, video lessons, and downloadable Excel workbooks.',
        '2. Practice Workbooks: Downloadable Excel datasets and starter templates are provided strictly for your personal learning and portfolio creation.',
        '3. Certificates & Exams: Professional certificates are awarded upon achieving passing scores on level exams and capstone submissions.',
      ],
      whatsappButton: false,
    },
    refund: {
      title: '14-Day Satisfaction Guarantee & Refund Policy',
      body: [
        '1. Free Level 1 Trial: Level 1 is 100% free for all registered students to test the quality of our video lessons and practice workbooks.',
        '2. 14-Day Money-Back Guarantee: Tuition for Levels 2–6 comes with a 14-day 100% satisfaction guarantee.',
        '3. Simple Refund Process: If you complete the Level 1 and Level 2 assignments and feel the course has not built your practical spreadsheet skills, contact okorotochukwu007@gmail.com or WhatsApp 07080145682 for a full refund.',
      ],
      whatsappButton: true,
    },
  };

  const activeDoc = contentMap[docType];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">{activeDoc.title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-3 text-xs text-slate-700 leading-relaxed">
          {activeDoc.body.map((paragraph, idx) => (
            <div key={idx} className="flex items-start gap-2.5">
              <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <p>{paragraph}</p>
            </div>
          ))}
          {activeDoc.whatsappButton && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <a
                href="https://wa.me/2347080145682?text=Hello%20Lead%20Instructor%20Okoro,%20I%20have%20a%20question%20regarding%20the%20Excel%20Academy."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-current text-white shrink-0" />
                <span>Speak to the Instructor on WhatsApp (07080145682)</span>
              </a>
            </div>
          )}

          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
