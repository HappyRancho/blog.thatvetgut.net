import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Clock,
  User,
  Activity,
  Filter,
  RefreshCw,
  FileText,
  Lock,
  Globe,
  Trash2,
} from 'lucide-react';
import { AuditLogEntry, getRecentAuditLogs } from '../../services/auditService';

export const AuditLogsViewer: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string>('ALL');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await getRecentAuditLogs(100);
      setLogs(data);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (filterAction !== 'ALL' && log.action !== filterAction) return false;
    return true;
  });

  const getActionBadge = (action: AuditLogEntry['action']) => {
    switch (action) {
      case 'ARTICLE_PUBLISH':
        return <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded text-[10px] font-bold">PUBLISHED</span>;
      case 'ARTICLE_CREATE':
        return <span className="bg-blue-100 text-blue-900 px-2 py-0.5 rounded text-[10px] font-bold">CREATE</span>;
      case 'ARTICLE_UPDATE':
        return <span className="bg-stone-100 text-stone-800 px-2 py-0.5 rounded text-[10px] font-bold">UPDATE</span>;
      case 'ARTICLE_SUBMIT':
        return <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded text-[10px] font-bold">SUBMITTED</span>;
      case 'ARTICLE_DELETE':
        return <span className="bg-red-100 text-red-900 px-2 py-0.5 rounded text-[10px] font-bold">DELETED</span>;
      case 'IMPORT_LINKEDIN':
        return <span className="bg-sky-100 text-sky-900 px-2 py-0.5 rounded text-[10px] font-bold">LINKEDIN IMPORT</span>;
      case 'LOGIN':
        return <span className="bg-purple-100 text-purple-900 px-2 py-0.5 rounded text-[10px] font-bold">SIGN IN</span>;
      case 'LOGOUT':
        return <span className="bg-stone-100 text-stone-600 px-2 py-0.5 rounded text-[10px] font-bold">SIGN OUT</span>;
      case 'PASSWORD_CHANGE':
        return <span className="bg-orange-100 text-orange-900 px-2 py-0.5 rounded text-[10px] font-bold">PW CHANGE</span>;
      default:
        return <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded text-[10px] font-bold">{action}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-900" />
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-stone-900">
              CMS Security & Editorial Audit Logs
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Immutable tracking of all clinical publications, status updates, team logins, and credential changes.
          </p>
        </div>

        <button
          type="button"
          onClick={loadLogs}
          className="px-3.5 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-stone-500" />
          <span className="text-xs font-semibold text-stone-700">Filter Event:</span>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="text-xs bg-stone-50 border border-stone-300 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-emerald-800 focus:outline-none"
          >
            <option value="ALL">All Events ({logs.length})</option>
            <option value="ARTICLE_PUBLISH">Publish Events</option>
            <option value="ARTICLE_UPDATE">Article Updates</option>
            <option value="ARTICLE_CREATE">Article Creations</option>
            <option value="IMPORT_LINKEDIN">LinkedIn Imports</option>
            <option value="ARTICLE_DELETE">Deletions</option>
            <option value="LOGIN">Sign In Events</option>
            <option value="PASSWORD_CHANGE">Password Changes</option>
          </select>
        </div>

        <span className="text-xs text-stone-500">
          Showing {filteredLogs.length} events
        </span>
      </div>

      {/* Logs Table / Stream */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-stone-500 flex flex-col items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-emerald-900" />
            <span>Loading security audit records...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-500">
            No audit log records found for this filter.
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {filteredLogs.map((log, idx) => (
              <div
                key={log.id || idx}
                className="p-4 hover:bg-stone-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {getActionBadge(log.action)}
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900 leading-snug">
                      {log.details}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-stone-500 mt-1">
                      <span className="flex items-center gap-1 font-medium text-stone-700">
                        <User className="w-3 h-3 text-stone-400" />
                        {log.performedBy?.name || 'System'} ({log.performedBy?.role || 'Staff'})
                      </span>
                      {log.targetTitle && (
                        <span className="truncate max-w-xs text-stone-500">
                          Target: &quot;{log.targetTitle}&quot;
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-stone-400 shrink-0 font-mono flex items-center gap-1 self-end sm:self-auto">
                  <Clock className="w-3 h-3 text-stone-300" />
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
