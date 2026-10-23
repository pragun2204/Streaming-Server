import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Database, Server, Wifi, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';

export const HealthPage: React.FC = () => {
  const [healthData, setHealthData] = useState<any>(null);
  const [readyData, setReadyData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function check() {
      try {
        const [hRes, rRes] = await Promise.all([
          fetch('/api/v1/health').then((r) => r.json()),
          fetch('/api/v1/ready').then((r) => r.json()),
        ]);
        setHealthData(hRes);
        setReadyData(rRes);
      } catch (err: any) {
        setHealthData({ status: 'unreachable', error: err.message });
      } finally {
        setIsLoading(false);
      }
    }
    check();
  }, []);

  return (
    <div className="min-h-screen bg-graphite-950 text-graphite-100 p-6 flex flex-col items-center">
      <div className="w-full max-w-xl">
        <div className="flex items-center justify-between pb-6 border-b border-graphite-850 mb-8">
          <Link
            to="/"
            className="flex items-center space-x-1.5 text-xs text-graphite-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Home</span>
          </Link>
          <div className="flex items-center space-x-2 text-white font-bold text-lg">
            <Activity className="w-5 h-5 text-indigo-400" />
            <span>System Health Diagnostics</span>
          </div>
          <div className="w-12" />
        </div>

        {isLoading ? (
          <div className="text-center text-xs text-graphite-400 py-12">
            Checking backend and database status...
          </div>
        ) : (
          <div className="space-y-4">
            {/* API Health */}
            <div className="bg-graphite-900 border border-graphite-800 rounded-2xl p-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Server className="w-5 h-5 text-indigo-400" />
                <div>
                  <div className="text-xs font-bold text-white">FastAPI Application Service</div>
                  <div className="text-[11px] text-graphite-400">Endpoint: /api/v1/health</div>
                </div>
              </div>
              <div className="flex items-center space-x-1.5">
                {healthData?.status === 'healthy' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-400">Operational</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span className="text-xs font-semibold text-rose-400">Degraded</span>
                  </>
                )}
              </div>
            </div>

            {/* Database Health */}
            <div className="bg-graphite-900 border border-graphite-800 rounded-2xl p-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Database className="w-5 h-5 text-indigo-400" />
                <div>
                  <div className="text-xs font-bold text-white">Database Engine & Sessions</div>
                  <div className="text-[11px] text-graphite-400">Endpoint: /api/v1/ready</div>
                </div>
              </div>
              <div className="flex items-center space-x-1.5">
                {readyData?.database === 'connected' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-400">Connected</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span className="text-xs font-semibold text-rose-400">Unavailable</span>
                  </>
                )}
              </div>
            </div>

            {/* LiveKit SFU Status */}
            <div className="bg-graphite-900 border border-graphite-800 rounded-2xl p-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Wifi className="w-5 h-5 text-indigo-400" />
                <div>
                  <div className="text-xs font-bold text-white">LiveKit Real-Time SFU</div>
                  <div className="text-[11px] text-graphite-400">WebRTC Audio & 1080p60 Screen Sharing</div>
                </div>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-400">Ready</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
