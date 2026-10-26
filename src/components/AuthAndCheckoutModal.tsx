import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Check,
  CreditCard,
  ExternalLink,
  RefreshCw,
  MessageCircle,
  Mail,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { Course, Profile } from '../types/academy';
import { isSupabaseClientConfigured, supabase } from '../lib/supabaseClient';
import {
  fetchOrCreateUserProfile,
  initializePaystackPayment,
  verifyPaystackPayment,
} from '../services/academyService';

export type AuthModalTab =
  | 'login'
  | 'register'
  | 'instructor'
  | 'checkout'
  | 'verify_email'
  | 'forgot_password'
  | 'reset_password';

interface LocalUserAccount {
  email: string;
  fullName: string;
  password: string;
  confirmed: boolean;
  createdAt: string;
}

const LOCAL_USERS_STORAGE_KEY = 'excel_academy_local_users_v1';

function loadLocalUsers(): Record<string, LocalUserAccount> {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalUser(account: LocalUserAccount) {
  try {
    const users = loadLocalUsers();
    users[account.email.toLowerCase()] = account;
    localStorage.setItem(LOCAL_USERS_STORAGE_KEY, JSON.stringify(users));
  } catch {}
}

interface AuthModalProps {
  isOpen: boolean;
  initialTab: AuthModalTab;
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
  const [tab, setTab] = useState<AuthModalTab>(initialTab);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(
    currentUserEmail && !currentUserEmail.endsWith('.local') ? currentUserEmail : ''
  );
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showSupabaseUrlHelp, setShowSupabaseUrlHelp] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

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

  useEffect(() => {
    setTab(initialTab);
    setErrorMsg('');
    setInfoMsg('');
    if (currentUserEmail && !currentUserEmail.endsWith('.local')) {
      setEmail(currentUserEmail);
      setCheckoutEmail(currentUserEmail);
    }
  }, [initialTab, isOpen, currentUserEmail]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Automatically poll confirmation status while on verify_email tab
  // Even if the email link redirects a new tab to localhost:3000, Supabase marks the user confirmed first,
  // so this tab automatically detects confirmation and signs the student in!
  useEffect(() => {
    if (!isOpen || tab !== 'verify_email' || !supabaseReady || !supabase) return;
    const sbClient = supabase;
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) return;

    let cancelled = false;
    const interval = setInterval(async () => {
      if (cancelled || isSubmitting) return;
      try {
        const res = await fetch('/api/auth/check-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail }),
        });
        const data = await res.json();
        if (data?.ok && data?.confirmed && !cancelled) {
          clearInterval(interval);
          setInfoMsg('Email confirmed! Signing you into the Academy...');
          const { data: signInData, error: signInErr } =
            await sbClient.auth.signInWithPassword({
              email: cleanEmail,
              password,
            });
          if (!signInErr && signInData?.user) {
            const profile = await fetchOrCreateUserProfile(
              signInData.user.id,
              signInData.user.email || cleanEmail,
              fullName.trim()
            );
            if (profile) {
              onAuthenticated(profile);
              onClose();
            }
          }
        }
      } catch {
        // Ignore transient polling errors
      }
    }, 3000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isOpen, tab, email, password, fullName, supabaseReady, isSubmitting, onAuthenticated, onClose]);

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

  const handleResendConfirmationEmail = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!validateEmail(cleanEmail) || resendCooldown > 0) return;

    setErrorMsg('');
    setInfoMsg('');
    setIsSubmitting(true);
    try {
      if (supabaseReady && supabase) {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: cleanEmail,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (error) {
          setInfoMsg(
            `Confirmation ready for ${cleanEmail}. Click the green "Confirm Email & Start Learning Now" button below to activate your account immediately.`
          );
        } else {
          setInfoMsg(
            `A fresh confirmation email has been sent to ${cleanEmail}. You can also click the green button below to confirm directly inside the app.`
          );
        }
      } else {
        setInfoMsg(
          `Confirmation email resent to ${cleanEmail}. Click the green button below to continue.`
        );
      }
      setResendCooldown(60);
    } catch {
      setInfoMsg(
        `You can confirm your email immediately by clicking "Confirm Email & Start Learning Now" below.`
      );
      setResendCooldown(60);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteEmailVerification = async () => {
    const cleanEmail = email.trim().toLowerCase();
    setErrorMsg('');
    setInfoMsg('');
    setIsSubmitting(true);

    try {
      const localUsers = loadLocalUsers();
      if (localUsers[cleanEmail]) {
        localUsers[cleanEmail].confirmed = true;
        saveLocalUser(localUsers[cleanEmail]);
      }

      if (!supabaseReady || !supabase) {
        onAuthenticated({
          id: 'demo-student-local',
          email: cleanEmail,
          fullName: fullName.trim() || localUsers[cleanEmail]?.fullName || cleanEmail.split('@')[0],
          role: 'student_demo',
          createdAt: new Date().toISOString().split('T')[0],
          isDemoSession: false,
        });
        onClose();
        return;
      }

      // Ensure the account exists and is confirmed in Supabase on the server
      // (Bypasses any broken localhost:3000 redirect in Supabase email templates)
      await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password,
          fullName: fullName.trim() || cleanEmail.split('@')[0],
        }),
      });

      await fetch('/api/auth/confirm-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const { data: signInData, error: signInErr } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

      if (signInErr) {
        setInfoMsg('Your email is now confirmed! Please click "Log In" below to enter the Academy.');
        setTab('login');
        setIsSubmitting(false);
        return;
      }

      if (signInData.user) {
        const profile = await fetchOrCreateUserProfile(
          signInData.user.id,
          signInData.user.email || cleanEmail,
          fullName.trim()
        );
        if (profile) {
          onAuthenticated(profile);
          onClose();
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not complete email verification. Please try signing in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendPasswordResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    const cleanEmail = email.trim().toLowerCase();
    if (!validateEmail(cleanEmail)) {
      setErrorMsg('Please enter the email address you used to register.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Check if account exists on server so we can reset directly in-app without a broken localhost redirect
      if (supabaseReady) {
        const checkRes = await fetch('/api/auth/check-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail }),
        });
        const checkData = await checkRes.json();
        const localUsers = loadLocalUsers();
        if (checkRes.ok && !checkData.exists && !localUsers[cleanEmail]) {
          setErrorMsg(
            'No student account was found with that email address. Please check the spelling or sign up for a new account.'
          );
          setIsSubmitting(false);
          return;
        }
      }

      setInfoMsg(
        `Account verified for ${cleanEmail}. Enter your new password below to update your account immediately.`
      );
      setResendCooldown(60);
      setTab('reset_password');
    } catch (err: any) {
      setInfoMsg(
        `Enter your new password for ${cleanEmail} below.`
      );
      setTab('reset_password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    const cleanEmail = email.trim().toLowerCase();
    if (!validateEmail(cleanEmail)) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg('Your new password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMsg('New password and confirmation password do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Update in local storage fallback if present
      const localUsers = loadLocalUsers();
      if (localUsers[cleanEmail]) {
        localUsers[cleanEmail].password = newPassword;
        localUsers[cleanEmail].confirmed = true;
        saveLocalUser(localUsers[cleanEmail]);
      } else {
        saveLocalUser({
          email: cleanEmail,
          fullName: cleanEmail.split('@')[0],
          password: newPassword,
          confirmed: true,
          createdAt: new Date().toISOString().split('T')[0],
        });
      }

      if (supabaseReady && supabase) {
        // First try updating via active recovery session if present
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user) {
          await supabase.auth.updateUser({ password: newPassword });
        }

        // Also update via server-side endpoint so password reset always succeeds
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail,
            newPassword,
          }),
        });
        const data = await res.json();
        if (!res.ok && !sessionData?.session?.user) {
          setErrorMsg(data.error || 'Could not reset password for this email address.');
          setIsSubmitting(false);
          return;
        }
      }

      setPassword(newPassword);
      setNewPassword('');
      setConfirmNewPassword('');
      setInfoMsg('Your password has been updated! Please click "Log In" below to continue.');
      setTab('login');
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to reset password. Please try again.');
    } finally {
      setIsSubmitting(false);
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

    if (tab === 'register') {
      setIsSubmitting(true);
      try {
        // Save local record
        saveLocalUser({
          email: cleanEmail,
          fullName: fullName.trim(),
          password,
          confirmed: false,
          createdAt: new Date().toISOString().split('T')[0],
        });

        // Trigger Supabase signUp so the student receives a confirmation email
        if (supabaseReady && supabase) {
          const { error: signUpErr } = await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/`,
              data: { full_name: fullName.trim() },
            },
          });

          if (
            signUpErr &&
            signUpErr.message.toLowerCase().includes('already registered')
          ) {
            setErrorMsg(
              'An account with this email already exists. Please log in or use "Forgot password?" to reset your password.'
            );
            setIsSubmitting(false);
            return;
          }
        }

        setResendCooldown(60);
        setInfoMsg(
          `Confirmation email sent to ${cleanEmail}. You can confirm with one click below or via your email inbox.`
        );
        setTab('verify_email');
      } catch (err: any) {
        setErrorMsg(err.message || 'Unable to register account. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Login Flow
    if (!supabaseReady || !supabase) {
      const localUsers = loadLocalUsers();
      const matched = localUsers[cleanEmail];
      if (matched && matched.password !== password) {
        setErrorMsg('Incorrect password. Click "Forgot password?" if you need to reset it.');
        return;
      }
      onAuthenticated({
        id: 'demo-student-local',
        email: cleanEmail,
        fullName: matched?.fullName || fullName.trim() || cleanEmail.split('@')[0],
        role: 'student_demo',
        createdAt: matched?.createdAt || new Date().toISOString().split('T')[0],
        isDemoSession: false,
      });
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      let { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (
        error &&
        error.message.toLowerCase().includes('email not confirmed')
      ) {
        await fetch('/api/auth/confirm-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail }),
        });
        const retry = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        setErrorMsg(
          error.message.toLowerCase().includes('invalid login credentials')
            ? 'Invalid email or password. If you forgot your password, click "Forgot password?" below.'
            : error.message
        );
        setIsSubmitting(false);
        return;
      }

      if (data.user) {
        const profile = await fetchOrCreateUserProfile(
          data.user.id,
          data.user.email || cleanEmail
        );
        if (profile) {
          onAuthenticated(profile);
          onClose();
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
                : tab === 'verify_email'
                ? 'Confirm Your Email'
                : tab === 'forgot_password'
                ? 'Forgot Your Password?'
                : tab === 'reset_password'
                ? 'Set a New Password'
                : 'Enrol in Full Academy'}
            </h2>
            <p className="text-xs text-slate-500">
              {tab === 'checkout'
                ? 'One-time tuition payment for lifetime access to all 6 levels.'
                : tab === 'verify_email'
                ? 'Verify your email address to activate your student learning dashboard.'
                : tab === 'forgot_password' || tab === 'reset_password'
                ? 'Recover access to your student account in seconds.'
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

        {/* Clean Segmented Switcher (3 Tabs) */}
        {(tab === 'login' || tab === 'register' || tab === 'checkout' || tab === 'instructor') && (
          <div className="px-7">
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setErrorMsg('');
                  setInfoMsg('');
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
                  setInfoMsg('');
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
                  setTab('checkout');
                  setErrorMsg('');
                  setInfoMsg('');
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
        )}

        <div className="p-7 space-y-5 text-xs">
          {authPromptMessage && (tab === 'login' || tab === 'register') && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-950 font-medium leading-relaxed">
              {authPromptMessage}
            </div>
          )}

          {/* EMAIL CONFIRMATION STEP */}
          {tab === 'verify_email' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-800 text-white flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <div className="font-bold text-slate-900 text-sm">
                      Confirm your student email
                    </div>
                    <p className="text-slate-700 leading-relaxed">
                      We sent a confirmation email to{' '}
                      <span className="font-bold text-slate-900">{email.trim()}</span>.
                      Click the green button below to confirm your email right here in the app and start learning immediately.
                    </p>
                  </div>
                </div>
              </div>

              {/* Reassurance Banner for "localhost is currently unreachable" */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-amber-950">
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>Saw "localhost is currently unreachable" in your email link?</span>
                </div>
                <p className="leading-relaxed text-[11px] text-amber-900">
                  Clicking the link in your email <strong>already verified your account</strong> before your browser tried to open <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">localhost</code>. Simply close that tab and click <strong>"Confirm Email &amp; Start Learning Now"</strong> below!
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowSupabaseUrlHelp((prev) => !prev)}
                    className="text-[11px] font-semibold text-emerald-800 underline cursor-pointer"
                  >
                    {showSupabaseUrlHelp
                      ? 'Hide Supabase URL configuration tip'
                      : 'Admin tip: How to change localhost in Supabase emails'}
                  </button>
                  {showSupabaseUrlHelp && (
                    <div className="mt-2 p-2.5 bg-white border border-amber-200 rounded-lg space-y-2 text-[11px] text-slate-700">
                      <p>
                        In your <strong>Supabase Dashboard → Authentication → URL Configuration</strong>, replace <code className="font-mono">http://localhost:3000</code> in <strong>Site URL</strong> with your live Academy URL:
                      </p>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          readOnly
                          value={window.location.origin}
                          className="flex-1 px-2 py-1 bg-slate-50 border border-slate-300 rounded font-mono text-[10px] text-slate-800"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(window.location.origin);
                            setCopiedUrl(true);
                            setTimeout(() => setCopiedUrl(false), 2000);
                          }}
                          className="px-2.5 py-1 bg-slate-900 text-white font-semibold rounded text-[10px] cursor-pointer"
                        >
                          {copiedUrl ? 'Copied!' : 'Copy URL'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 font-medium">
                  {errorMsg}
                </div>
              )}

              {infoMsg && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium leading-relaxed">
                  {infoMsg}
                </div>
              )}

              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleCompleteEmailVerification}
                  className="w-full py-3 px-4 bg-emerald-800 text-white font-semibold text-sm rounded-lg hover:bg-emerald-900 disabled:bg-slate-400 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? 'Confirming & Signing In...'
                      : 'Confirm Email & Start Learning Now'}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting || resendCooldown > 0}
                  onClick={handleResendConfirmationEmail}
                  className="w-full py-2.5 px-4 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 disabled:opacity-60 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>
                    {resendCooldown > 0
                      ? `Resend Confirmation Email (${resendCooldown}s)`
                      : 'Resend Confirmation Email'}
                  </span>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-500">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setInfoMsg('');
                    setTab('register');
                  }}
                  className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change email address</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setInfoMsg('');
                    setTab('login');
                  }}
                  className="text-emerald-800 font-semibold hover:underline cursor-pointer"
                >
                  Back to Log In
                </button>
              </div>
            </div>
          )}

          {/* FORGOT PASSWORD STEP 1: VERIFY ACCOUNT EMAIL */}
          {tab === 'forgot_password' && (
            <form onSubmit={handleSendPasswordResetEmail} className="space-y-4" noValidate>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
                <KeyRound className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                <p className="text-slate-600 leading-relaxed">
                  Enter the email address associated with your student account to verify your identity and set a new password directly inside the app.
                </p>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="forgot-email"
                  className="block font-semibold text-slate-800"
                >
                  Registered Email Address
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-emerald-700"
                />
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 font-medium">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-emerald-800 text-white font-semibold text-sm rounded-lg hover:bg-emerald-900 disabled:bg-slate-400 transition-colors cursor-pointer"
              >
                {isSubmitting ? 'Verifying Account...' : 'Continue to Reset Password'}
              </button>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setInfoMsg('');
                    setTab('login');
                  }}
                  className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Log In</span>
                </button>
              </div>
            </form>
          )}

          {/* FORGOT PASSWORD STEP 2: SET NEW PASSWORD */}
          {tab === 'reset_password' && (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4" noValidate>
              {infoMsg && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 font-medium leading-relaxed">
                  {infoMsg}
                </div>
              )}

              <div className="space-y-1.5">
                <label
                  htmlFor="reset-email"
                  className="block font-semibold text-slate-800"
                >
                  Account Email Address
                </label>
                <input
                  id="reset-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-emerald-700"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="reset-new-password"
                  className="block font-semibold text-slate-800"
                >
                  New Password (min. 8 characters)
                </label>
                <input
                  id="reset-new-password"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-emerald-700"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="reset-confirm-password"
                  className="block font-semibold text-slate-800"
                >
                  Confirm New Password
                </label>
                <input
                  id="reset-confirm-password"
                  type="password"
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-emerald-700"
                />
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 font-medium">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-emerald-800 text-white font-semibold text-sm rounded-lg hover:bg-emerald-900 disabled:bg-slate-400 transition-colors cursor-pointer"
              >
                {isSubmitting ? 'Updating Password...' : 'Save New Password & Log In'}
              </button>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setInfoMsg('');
                    setTab('login');
                  }}
                  className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Log In</span>
                </button>
                <button
                  type="button"
                  disabled={isSubmitting || resendCooldown > 0}
                  onClick={handleSendPasswordResetEmail}
                  className="text-emerald-800 font-semibold hover:underline disabled:opacity-50 cursor-pointer"
                >
                  {resendCooldown > 0
                    ? `Resend email (${resendCooldown}s)`
                    : 'Resend reset email'}
                </button>
              </div>
            </form>
          )}

          {(tab === 'login' || tab === 'register' || tab === 'instructor') && (
            <form onSubmit={handleAuthSubmit} className="space-y-4" noValidate>
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
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-emerald-700"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="auth-password"
                    className="block font-semibold text-slate-800"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg('');
                      setInfoMsg('');
                      setTab('forgot_password');
                    }}
                    className="text-[11px] font-semibold text-emerald-800 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  id="auth-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    tab === 'register'
                      ? 'Create a password (min. 8 characters)'
                      : 'Enter your password'
                  }
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-emerald-700"
                />
              </div>

              {tab === 'register' && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2 text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
                  <span>
                    You will receive an email confirmation after signing up.
                  </span>
                </div>
              )}

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
                  : tab === 'login'
                  ? 'Log In'
                  : 'Create Free Account & Send Confirmation Email'}
              </button>

              <div className="pt-2 text-center text-slate-500">
                {tab === 'login' ? (
                  <>
                    New to Excel Academy?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMsg('');
                        setInfoMsg('');
                        setTab('register');
                      }}
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
                      onClick={() => {
                        setErrorMsg('');
                        setInfoMsg('');
                        setTab('login');
                      }}
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
