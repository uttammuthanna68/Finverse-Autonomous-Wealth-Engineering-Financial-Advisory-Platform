import React, { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { API_BASE_URL } from '../api/config';
import { Terminal, CheckCircle2, AlertTriangle } from 'lucide-react';


export const SystemStatusPage: React.FC = () => {
  const [health, setHealth] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/health`)
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center space-x-3 border-b border-black/5 pb-4">
        <div className="w-10 h-10 rounded-xl bg-muted/20 text-muted flex items-center justify-center font-bold">
          <Terminal className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-main font-mono">/dev/system-status</h1>
          <p className="text-xs text-muted">Developer-only unlinked diagnostics page</p>
        </div>
      </div>

      <Card className="p-6 space-y-4 shadow-card rounded-card border border-black/5 bg-card-bg">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-main uppercase font-mono">Backend API Endpoint</span>
          <span className="text-xs font-mono bg-surface px-2 py-1 rounded text-main">{API_BASE_URL}</span>
        </div>

        <div className="flex items-center justify-between border-t border-black/5 pt-3">
          <span className="text-xs font-bold text-main uppercase font-mono">API Health Check</span>
          {health ? (
            <span className="inline-flex items-center space-x-1 text-xs font-bold text-success">
              <CheckCircle2 className="w-4 h-4" />
              <span>{health.status}</span>
            </span>
          ) : error ? (
            <span className="inline-flex items-center space-x-1 text-xs font-bold text-warning">
              <AlertTriangle className="w-4 h-4" />
              <span>Unreachable ({error})</span>
            </span>
          ) : (
            <span className="text-xs text-muted">Checking status...</span>
          )}
        </div>
      </Card>
    </div>
  );
};
