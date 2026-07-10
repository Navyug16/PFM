import React from 'react'
import { Link } from 'react-router-dom'
import { Eye, HardDrive, ShieldCheck, RefreshCw } from 'lucide-react'

export const DataPrivacySettings: React.FC = () => {
  return (
    <div className="bg-surface-primary border border-border-neutral rounded-custom-xl p-6 space-y-6">
      <div>
        <h3 className="text-base font-bold text-text-primary">Data & Privacy</h3>
        <p className="text-xs text-text-secondary mt-1">
          Factual disclosures regarding your data sovereignty and storage architecture.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* RLS Security */}
        <div className="flex gap-4 p-4 bg-surface-secondary/40 border border-border-neutral/60 rounded-custom-lg">
          <ShieldCheck size={20} className="text-brand-purple shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-text-primary">Row-Level Security (RLS)</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              All transaction, account, and rule entries are secured under strict PostgreSQL RLS policies. Only your authenticated user ID holds reading and writing ownership.
            </p>
          </div>
        </div>

        {/* Local CSV Assembling */}
        <div className="flex gap-4 p-4 bg-surface-secondary/40 border border-border-neutral/60 rounded-custom-lg">
          <HardDrive size={20} className="text-brand-purple shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-text-primary">Local CSV Compile</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              CSV file assemblies for Transactions, Accounts, Category aggregates, and Goals are performed entirely in your browser window. Zero data is shared with third-party servers.
            </p>
          </div>
        </div>

        {/* Zero Sync */}
        <div className="flex gap-4 p-4 bg-surface-secondary/40 border border-border-neutral/60 rounded-custom-lg">
          <RefreshCw size={20} className="text-brand-purple shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-text-primary">No Automatic Banking Sync</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              PFM does not link to bank accounts, credentials, or credit score agencies. You retain absolute control over manual ledger entry and rule generations.
            </p>
          </div>
        </div>

        {/* Browser storage */}
        <div className="flex gap-4 p-4 bg-surface-secondary/40 border border-border-neutral/60 rounded-custom-lg">
          <Eye size={20} className="text-brand-purple shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-text-primary">Minimal Cache Cookies</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Cookies and local browser storage are restricted to active session persistence and visual theme bootstrap values, ensuring no financial preference tracking.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-border-neutral pt-6 flex justify-between items-center text-xs">
        <span className="text-text-secondary">Export all your historical data safely:</span>
        <Link
          to="/insights"
          className="px-4 py-2 bg-surface-secondary border border-border-neutral hover:bg-surface-secondary/80 text-text-primary font-medium rounded-custom-md transition-all"
        >
          Go to Export Panel
        </Link>
      </div>
    </div>
  )
}
