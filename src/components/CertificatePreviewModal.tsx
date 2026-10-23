import React, { useState } from 'react';
import {
  X,
  Download,
  Printer,
  Copy,
  CheckCheck,
  ShieldCheck,
  Award,
  Sparkles,
  Edit2,
  Check,
} from 'lucide-react';
import { LevelCertificate } from '../types/academy';
import {
  downloadLevelCertificatePdf,
  generateVerificationHash,
} from '../utils/pdfCertificateGenerator';

interface CertificatePreviewModalProps {
  certificate: LevelCertificate;
  isOpen: boolean;
  onClose: () => void;
  onUpdateName?: (newName: string) => void;
}

export const CertificatePreviewModal: React.FC<CertificatePreviewModalProps> = ({
  certificate,
  isOpen,
  onClose,
  onUpdateName,
}) => {
  const [studentName, setStudentName] = useState(certificate.studentName);
  const [isEditingName, setIsEditingName] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  if (!isOpen) return null;

  const currentCert: LevelCertificate = {
    ...certificate,
    studentName,
    verificationHash: generateVerificationHash(
      certificate.levelNumber,
      studentName,
      certificate.issuedDate
    ),
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(currentCert.verificationHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleSaveName = () => {
    setIsEditingName(false);
    if (onUpdateName && studentName.trim()) {
      onUpdateName(studentName.trim());
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden my-4 flex flex-col max-h-[92vh]">
        {/* TOP TOOLBAR */}
        <div className="bg-slate-900 text-white px-5 py-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-700/80 rounded-lg text-emerald-200">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                Official Verified Certificate of Completion
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Verification ID: {currentCert.verificationHash}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => downloadLevelCertificatePdf(currentCert)}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF (.pdf)</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors hidden sm:flex"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* NAME CUSTOMIZER BAR */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-600">
            <span>Name on Certificate:</span>
            {isEditingName ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded text-slate-900 font-semibold focus:outline-emerald-700 text-xs"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveName}
                  className="px-2 py-1 bg-emerald-800 text-white rounded font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3 h-3" />
                  Save
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <strong className="text-slate-900 font-bold">{studentName}</strong>
                <button
                  type="button"
                  onClick={() => setIsEditingName(true)}
                  className="text-slate-500 hover:text-emerald-800 flex items-center gap-1 text-[11px] underline cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit Spelling
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyHash}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded text-[11px] font-mono text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
              title="Copy Certificate Verification ID"
            >
              {copiedHash ? (
                <>
                  <CheckCheck className="w-3 h-3 text-emerald-700" />
                  <span className="text-emerald-700 font-semibold">ID Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy ID</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* CERTIFICATE CANVAS PREVIEW */}
        <div className="p-4 sm:p-8 bg-slate-200/70 overflow-y-auto flex items-center justify-center flex-1">
          {/* A4 Landscape Ratio Card */}
          <div
            id="printable-certificate"
            className="w-full max-w-3xl bg-[#FDFCF8] border-[6px] border-[#064E3B] p-6 sm:p-10 shadow-2xl relative text-center space-y-5 rounded-sm select-none"
            style={{
              aspectRatio: '1.414 / 1',
              boxShadow: '0 20px 50px rgba(0,0,0,0.18)',
            }}
          >
            {/* Inner Gold Border */}
            <div className="absolute inset-2 border-2 border-[#D97706] pointer-events-none" />
            <div className="absolute inset-3 border border-[#064E3B]/30 pointer-events-none" />

            {/* Corner Blocks */}
            <div className="absolute top-2 left-2 w-2.5 h-2.5 bg-[#D97706]" />
            <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#D97706]" />
            <div className="absolute bottom-2 left-2 w-2.5 h-2.5 bg-[#D97706]" />
            <div className="absolute bottom-2 right-2 w-2.5 h-2.5 bg-[#D97706]" />

            {/* Header Content */}
            <div className="space-y-1 relative z-10 pt-1">
              <div className="text-xs sm:text-sm font-black text-[#064E3B] tracking-widest uppercase font-sans">
                EXCEL TO DATA ANALYST ACADEMY
              </div>
              <div className="text-[10px] text-slate-500 tracking-wider uppercase font-mono">
                Official Professional Certification · Practical Skills Verification
              </div>
              <div className="w-32 h-0.5 bg-[#D97706] mx-auto my-1.5" />
              <div className="text-xs sm:text-sm font-bold text-[#B45309] tracking-wider uppercase">
                Certificate of Achievement
              </div>
            </div>

            {/* Recipient */}
            <div className="space-y-1 relative z-10">
              <div className="text-[11px] sm:text-xs text-slate-500 italic font-serif">
                This is to certify that
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight underline decoration-[#D97706] underline-offset-4 decoration-2">
                {studentName}
              </h2>
            </div>

            {/* Attestation */}
            <div className="text-[11px] sm:text-xs text-slate-600 max-w-xl mx-auto leading-relaxed relative z-10">
              has successfully completed all required video modules, practical hands-on Excel workbooks, and verified assessment examinations demonstrating professional competence in:
            </div>

            {/* Credential Box */}
            <div className="p-3 bg-slate-100/90 border border-slate-300 rounded-md max-w-xl mx-auto relative z-10 shadow-xs">
              <div className="text-xs sm:text-sm font-extrabold text-[#064E3B] uppercase tracking-wide">
                {currentCert.credentialTitle}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                {currentCert.levelTitle}
              </div>
            </div>

            {/* Signatures & Seal */}
            <div className="pt-2 grid grid-cols-3 items-end gap-4 relative z-10 text-[10px]">
              {/* Date */}
              <div className="text-center space-y-1">
                <div className="font-bold text-slate-900 font-mono">
                  {currentCert.issuedDate}
                </div>
                <div className="w-24 h-px bg-slate-300 mx-auto" />
                <div className="text-slate-500 uppercase tracking-wider text-[9px]">
                  Date of Conferral
                </div>
                {currentCert.scorePercent && (
                  <div className="text-[9px] font-bold text-[#064E3B]">
                    Score: {currentCert.scorePercent}%
                  </div>
                )}
              </div>

              {/* Official Gold Seal */}
              <div className="text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-amber-100 border-2 border-[#D97706] mx-auto flex items-center justify-center shadow-md relative">
                  <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-[#064E3B] text-white flex flex-col items-center justify-center p-0.5 text-center">
                    <span className="text-[7px] font-bold tracking-tighter">EXCEL</span>
                    <span className="text-[8px] text-amber-300">★ ★ ★</span>
                    <span className="text-[6px] tracking-widest uppercase">VERIFIED</span>
                  </div>
                </div>
                <div className="text-[8px] font-bold text-[#B45309] uppercase tracking-tighter mt-1">
                  Official Academic Seal
                </div>
              </div>

              {/* Signature */}
              <div className="text-center space-y-1">
                <div className="font-serif italic font-bold text-sm text-[#064E3B]">
                  Dr. O. Tochukwu
                </div>
                <div className="w-24 h-px bg-slate-300 mx-auto" />
                <div className="text-slate-500 uppercase tracking-wider text-[9px]">
                  Lead Excel &amp; Data Instructor
                </div>
                <div className="text-[9px] text-slate-400">
                  Excel to Data Analyst Academy
                </div>
              </div>
            </div>

            {/* Bottom Verification Footer */}
            <div className="pt-2 border-t border-slate-200 text-[9px] text-slate-500 font-mono flex items-center justify-between relative z-10">
              <span>Verified Credential</span>
              <span className="font-bold text-slate-700">
                ID: {currentCert.verificationHash}
              </span>
              <span>All 6 Levels Accredited</span>
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="bg-white border-t border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>
              Official verifiable certificate issued directly by Excel to Data Analyst Academy.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => downloadLevelCertificatePdf(currentCert)}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Official PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
