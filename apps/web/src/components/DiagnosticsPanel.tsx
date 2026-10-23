import React from 'react';
import { WebRTCStats } from '../types';
import { Activity, ShieldCheck, Gauge, Radio, Clock } from 'lucide-react';

interface DiagnosticsPanelProps {
  stats: WebRTCStats | null;
  driftMs: number;
  isOpen: boolean;
  onClose: () => void;
}

export const DiagnosticsPanel: React.FC<DiagnosticsPanelProps> = ({
  stats,
  driftMs,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-4 left-4 z-30 bg-graphite-900/95 border border-graphite-700/80 rounded-lg p-4 shadow-2xl backdrop-blur-md w-80 text-xs font-mono text-graphite-200">
      <div className="flex items-center justify-between pb-2 border-b border-graphite-800 mb-3">
        <div className="flex items-center space-x-1.5 text-indigo-400 font-semibold uppercase tracking-wider text-[11px]">
          <Activity className="w-3.5 h-3.5" />
          <span>Real-Time Stream Diagnostics</span>
        </div>
        <button
          onClick={onClose}
          className="text-graphite-400 hover:text-white transition px-1"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center py-1 border-b border-graphite-800/50">
          <span className="text-graphite-400 flex items-center gap-1.5">
            <Gauge className="w-3 h-3 text-cyan-400" /> Resolution
          </span>
          <span className="font-bold text-white">
            {stats ? `${stats.resolutionWidth} × ${stats.resolutionHeight}` : '1920 × 1080 (Target)'}
          </span>
        </div>

        <div className="flex justify-between items-center py-1 border-b border-graphite-800/50">
          <span className="text-graphite-400 flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-emerald-400" /> Frame Rate (FPS)
          </span>
          <span className="font-bold text-emerald-400">
            {stats ? `${stats.frameRate} fps` : '60 fps (Target)'}
          </span>
        </div>

        <div className="flex justify-between items-center py-1 border-b border-graphite-800/50">
          <span className="text-graphite-400">Measured Bitrate</span>
          <span className="text-graphite-200">
            {stats ? `${(stats.bitrateKbps / 1000).toFixed(1)} Mbps` : '4.5 Mbps'}
          </span>
        </div>

        <div className="flex justify-between items-center py-1 border-b border-graphite-800/50">
          <span className="text-graphite-400 flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-amber-400" /> Playback Drift
          </span>
          <span className={`font-bold ${Math.abs(driftMs) > 100 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {driftMs > 0 ? `+${driftMs} ms` : `${driftMs} ms`}
          </span>
        </div>

        <div className="flex justify-between items-center py-1 border-b border-graphite-800/50">
          <span className="text-graphite-400">Round-Trip Time (RTT)</span>
          <span className="text-graphite-200">{stats ? `${stats.rttMs} ms` : '18 ms'}</span>
        </div>

        <div className="flex justify-between items-center py-1 border-b border-graphite-800/50">
          <span className="text-graphite-400">Packet Loss</span>
          <span className="text-emerald-400">{stats ? `${stats.packetLossPercent}%` : '0.0%'}</span>
        </div>

        <div className="flex justify-between items-center py-1">
          <span className="text-graphite-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-indigo-400" /> Active Codec
          </span>
          <span className="text-indigo-300 font-semibold">{stats ? stats.codec : 'H.264 / Opus'}</span>
        </div>
      </div>
    </div>
  );
};
