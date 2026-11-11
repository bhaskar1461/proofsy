import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 font-sans selection:bg-indigo-600 selection:text-white">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Shield Icon with 404 badge */}
        <div className="mx-auto w-20 h-20 rounded-3xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-sm">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
            Error 404 · Page Not Found
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Resource Missing or Moved
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            The page, certificate record, or route you requested cannot be located. Please check the URL or use our public verification portal.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-2.5 rounded-full text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/25 transition active:scale-95 text-center"
          >
            Return to Home
          </Link>
          <Link
            href="/verify"
            className="w-full sm:w-auto px-6 py-2.5 rounded-full text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-2xs transition active:scale-95 text-center"
          >
            Verify a Certificate
          </Link>
        </div>

        <p className="text-[11px] font-mono text-slate-400">
          Proofsy Digital Verification Platform · proofsy.tech
        </p>
      </div>
    </div>
  );
}

