import React from 'react'
import { AlertOctagon, HelpCircle } from 'lucide-react'

export const AccountDangerZone: React.FC = () => {
  return (
    <div className="bg-surface-primary border border-state-expense/30 rounded-custom-xl p-6 space-y-6">
      <div className="flex items-center gap-3">
        <AlertOctagon className="text-state-expense shrink-0" size={22} />
        <div>
          <h3 className="text-base font-bold text-text-primary">Danger Zone</h3>
          <p className="text-xs text-text-secondary mt-1">
            Destructive options and account deletion management.
          </p>
        </div>
      </div>

      <div className="border border-border-neutral rounded-custom-lg p-5 space-y-4 bg-surface-secondary/20">
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-text-primary">Delete Account</h4>
          <p className="text-xs text-text-secondary leading-relaxed">
            Deleting your account will permanently erase your personal profiles, financial ledgers, recurring templates, and historical transactions from the database. This action is irreversible.
          </p>
        </div>

        <div className="p-3 bg-brand-purple/10 border border-brand-purple/20 rounded-custom-md text-xs text-text-secondary space-y-2">
          <div className="flex items-center gap-2 font-bold text-brand-purple">
            <HelpCircle size={16} />
            <span>V1 Account Deletion Status: Deferred</span>
          </div>
          <p className="leading-relaxed">
            For security compliance, complete database cascades and account deletions require a secure server-side execution context. Exposing administrative <code>service_role</code> bypass keys in browser code is a critical vulnerability and is strictly blocked in V1.
          </p>
          <p className="leading-relaxed">
            To request permanent deletion of your account and related data, please email our security officer at: <strong className="text-brand-purple">security@pfm-app.local</strong>.
          </p>
        </div>

        {/* Disabled Button showing it is unavailable directly */}
        <button
          type="button"
          disabled
          className="px-4 py-2.5 bg-state-expense/10 text-state-expense/50 border border-state-expense/25 text-xs font-bold rounded-custom-md cursor-not-allowed"
        >
          Browser Deletion Unavailable
        </button>
      </div>
    </div>
  )
}
