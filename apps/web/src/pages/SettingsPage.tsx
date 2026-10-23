import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Settings,
  Mic,
  Volume2,
  ScreenShare,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { useVoiceStore, ScreenQualityProfile } from '../stores/voiceStore';

export const SettingsPage: React.FC = () => {
  const {
    isPushToTalk,
    setPushToTalk,
    pttKey,
    setPttKey,
    screenQuality,
    setScreenQuality,
    mediaVolume,
    setMediaVolume,
    voiceVolume,
    setVoiceVolume,
    audioInputDeviceId,
    setAudioInputDevice,
    audioOutputDeviceId,
    setAudioOutputDevice,
  } = useVoiceStore();

  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    async function getDevices() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          setInputDevices(devices.filter((d) => d.kind === 'audioinput'));
          setOutputDevices(devices.filter((d) => d.kind === 'audiooutput'));
        }
      } catch (err) {
        console.warn('Cannot enumerate devices:', err);
      }
    }
    getDevices();
  }, []);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-graphite-950 text-graphite-100 p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-6 border-b border-graphite-850 mb-8">
          <Link
            to="/"
            className="flex items-center space-x-1.5 text-xs text-graphite-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Link>

          <div className="flex items-center space-x-2 text-white font-bold text-lg">
            <Settings className="w-5 h-5 text-indigo-400" />
            <span>Preferences & Devices</span>
          </div>

          <div className="w-12" />
        </div>

        <div className="space-y-6">
          {/* Section 1: Audio Devices */}
          <section className="bg-graphite-900 border border-graphite-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center space-x-2 text-white font-semibold text-sm">
              <Mic className="w-4 h-4 text-emerald-400" />
              <span>Microphone & Hardware Input</span>
            </div>

            <div>
              <label className="block text-xs text-graphite-400 mb-1.5">Input Device</label>
              <select
                value={audioInputDeviceId}
                onChange={(e) => setAudioInputDevice(e.target.value)}
                className="w-full bg-graphite-850 border border-graphite-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="default">Default System Microphone</option>
                {inputDevices.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Microphone (${d.deviceId.substring(0, 8)}...)`}
                  </option>
                ))}
              </select>
            </div>

            {outputDevices.length > 0 && (
              <div>
                <label className="block text-xs text-graphite-400 mb-1.5">Output Device (Speakers/Headset)</label>
                <select
                  value={audioOutputDeviceId}
                  onChange={(e) => setAudioOutputDevice(e.target.value)}
                  className="w-full bg-graphite-850 border border-graphite-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="default">Default System Output</option>
                  {outputDevices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Speaker (${d.deviceId.substring(0, 8)}...)`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Push to talk */}
            <div className="pt-2 border-t border-graphite-800">
              <label className="flex items-center space-x-2 cursor-pointer select-none mb-3">
                <input
                  type="checkbox"
                  checked={isPushToTalk}
                  onChange={(e) => setPushToTalk(e.target.checked)}
                  className="w-4 h-4 rounded bg-graphite-800 border-graphite-700 text-indigo-600 focus:ring-0"
                />
                <span className="text-xs font-medium text-white">Enable Push-to-Talk (PTT)</span>
              </label>

              {isPushToTalk && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-graphite-400">Activation Key:</span>
                  <input
                    type="text"
                    value={pttKey}
                    onChange={(e) => setPttKey(e.target.value)}
                    className="w-24 bg-graphite-850 border border-graphite-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono text-center focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}
            </div>
          </section>

          {/* Section 2: Volume Levels */}
          <section className="bg-graphite-900 border border-graphite-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center space-x-2 text-white font-semibold text-sm">
              <Volume2 className="w-4 h-4 text-indigo-400" />
              <span>Independent Audio Volumes</span>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-graphite-300">Voice Chat Volume</span>
                <span className="font-mono text-indigo-400">{Math.round(voiceVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={voiceVolume}
                onChange={(e) => setVoiceVolume(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-graphite-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-graphite-300">Media / Movie Volume</span>
                <span className="font-mono text-indigo-400">{Math.round(mediaVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={mediaVolume}
                onChange={(e) => setMediaVolume(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-graphite-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </section>

          {/* Section 3: Screen Share Quality */}
          <section className="bg-graphite-900 border border-graphite-800 rounded-2xl p-6 space-y-3">
            <div className="flex items-center space-x-2 text-white font-semibold text-sm">
              <ScreenShare className="w-4 h-4 text-violet-400" />
              <span>Screen Share Quality Profile</span>
            </div>
            <p className="text-xs text-graphite-400 leading-relaxed">
              Choose your preferred capture target. Dynamic WebRTC adapts smoothly if network constraints arise.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {[
                { id: '1080p60', title: '1080p 60 FPS', sub: 'High Quality & Smooth Motion' },
                { id: '1080p30', title: '1080p 30 FPS', sub: 'Balanced Performance' },
                { id: '720p30', title: '720p 30 FPS', sub: 'Data Saver' },
              ].map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setScreenQuality(preset.id as ScreenQualityProfile)}
                  className={`p-3 rounded-xl border text-left transition ${
                    screenQuality === preset.id
                      ? 'border-indigo-500 bg-indigo-500/10 text-white'
                      : 'border-graphite-800 bg-graphite-850/60 text-graphite-300 hover:border-graphite-700'
                  }`}
                >
                  <div className="font-bold text-xs mb-0.5">{preset.title}</div>
                  <div className="text-[10px] text-graphite-400">{preset.sub}</div>
                </button>
              ))}
            </div>
          </section>

          {/* Save notification */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition shadow-md"
            >
              {isSaved ? <Check className="w-4 h-4 text-emerald-300" /> : null}
              <span>{isSaved ? 'Settings Saved!' : 'Save Preferences'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
