import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Clock, 
  TrendingDown, 
  Flame 
} from 'lucide-react';
import { useHospitalStore } from '../../store/useHospitalStore';

interface TimeWarpSimulatorProps {
  onClose?: () => void;
}

export const TimeWarpSimulator: React.FC<TimeWarpSimulatorProps> = ({ onClose }) => {
  const { simulateRush } = useHospitalStore();

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentMinute, setCurrentMinute] = useState<number>(0);
  const [rushInjected, setRushInjected] = useState<boolean>(false);

  const naiveSteps = [
    {
      name: 'Blood Lab (Phlebotomy)',
      code: 'BLD-101',
      waitMinutes: 45,
      testMinutes: 10,
      startMin: 0,
      endMin: 55,
      bottleneck: '45-Min Morning Peak Line',
      color: 'bg-rose-500'
    },
    {
      name: 'Cardiology (12-Lead ECG)',
      code: 'ECG-301',
      waitMinutes: 15,
      testMinutes: 8,
      startMin: 57,
      endMin: 80,
      bottleneck: '15-Min Midday Queue Delay',
      color: 'bg-amber-500'
    },
    {
      name: 'Ultrasound (Abdomen)',
      code: 'USG-501',
      waitMinutes: 25,
      testMinutes: 15,
      startMin: 82,
      endMin: 135,
      bottleneck: '25-Min Backlog & Transit',
      color: 'bg-rose-600'
    }
  ];
  const naiveTotal = 135;

  const qcareSteps = [
    {
      name: 'Cardiology (12-Lead ECG)',
      code: 'ECG-301',
      waitMinutes: 2,
      testMinutes: 8,
      startMin: 0,
      endMin: 10,
      highlight: 'Rerouted (2m wait)',
      color: 'bg-emerald-500'
    },
    {
      name: 'Ultrasound (Abdomen)',
      code: 'USG-501',
      waitMinutes: 5,
      testMinutes: 15,
      startMin: 11,
      endMin: 26,
      highlight: 'Optimal Slot (5m wait)',
      color: 'bg-blue-500'
    },
    {
      name: 'Blood Lab (Phlebotomy)',
      code: 'BLD-101',
      waitMinutes: 10,
      testMinutes: 5,
      startMin: 27,
      endMin: 42,
      highlight: 'Crowd Cleared (10m wait)',
      color: 'bg-emerald-600'
    }
  ];
  const qcareTotal = 42;
  const minutesSaved = naiveTotal - qcareTotal;
  const percentageSaved = Math.round((minutesSaved / naiveTotal) * 100);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentMinute(prev => {
          if (prev >= 135) {
            setIsPlaying(false);
            return 135;
          }
          return prev + 1;
        });
      }, 70);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  const handleInjectSurge = () => {
    simulateRush('dept-pathology', 3);
    setRushInjected(true);
    setTimeout(() => setRushInjected(false), 3000);
  };

  const getStepStatus = (step: { startMin: number; endMin: number }, min: number) => {
    if (min < step.startMin) return 'waiting';
    if (min >= step.endMin) return 'completed';
    return 'in_progress';
  };

  return (
    <div className="bg-white text-slate-900 rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
      {/* Header & Controls Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs uppercase tracking-wider text-emerald-700 font-bold">
              Queue Benchmark
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            Time Comparison Simulator
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Sequential Walk-in vs Q-Care Smart Routing.
          </p>
        </div>

        {/* Big Savings Metric Pill */}
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-2xl shrink-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase text-emerald-800 tracking-wider font-bold">
              TOTAL TIME SAVED
            </div>
            <div className="text-xl font-bold text-emerald-700">
              -{minutesSaved} Mins <span className="text-xs font-semibold text-emerald-600">({percentageSaved}% Faster)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Controls */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4 relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-2xs"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlaying ? 'Pause' : 'Play Simulation'}</span>
            </button>

            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentMinute(0);
              }}
              className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200 shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <span className="text-xs text-slate-500 uppercase font-semibold">Clock:</span>
            <span className="text-lg font-bold text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-2xs">
              +{currentMinute} Mins
            </span>
          </div>

          <button
            onClick={handleInjectSurge}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all border shadow-2xs ${
              rushInjected
                ? 'bg-rose-100 border-rose-300 text-rose-800'
                : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Inject Rush (+3 Patients)</span>
          </button>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
            <span>Start (0m)</span>
            <span className="text-emerald-700 font-bold">Q-Care (~42m)</span>
            <span className="text-rose-600 font-bold">Sequential (135m)</span>
          </div>
          <input
            type="range"
            min={0}
            max={135}
            value={currentMinute}
            onChange={e => setCurrentMinute(Number(e.target.value))}
            className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
          />
        </div>
      </div>

      {/* Dual Timelines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        
        {/* PATH A */}
        <div className="rounded-2xl bg-white border border-rose-200 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] text-rose-600 uppercase tracking-wider font-bold block">
                Standard Walk-in
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Blind Order
              </h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-rose-600 font-bold block">135 Mins Total</span>
              <span className="text-[10px] text-slate-500 font-medium">85 mins in lines</span>
            </div>
          </div>

          <div className="space-y-3">
            {naiveSteps.map((step, idx) => {
              const status = getStepStatus(step, currentMinute);
              const progressPct = Math.min(100, Math.max(0, ((currentMinute - step.startMin) / (step.endMin - step.startMin)) * 100));

              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border transition-all ${
                    status === 'in_progress'
                      ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-300 shadow-xs'
                      : status === 'completed'
                      ? 'bg-slate-50 border-slate-200 opacity-60'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-900">
                      0{idx + 1}. {step.name}
                    </span>
                    <span className="text-[10px] text-rose-600 font-bold">
                      {step.waitMinutes}m Wait + {step.testMinutes}m Test
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-500 flex items-center justify-between mb-2">
                    <span className="text-amber-700 font-medium">⚠ {step.bottleneck}</span>
                    <span>Starts: +{step.startMin}m</span>
                  </div>

                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 transition-all duration-150"
                      style={{ width: `${status === 'completed' ? 100 : status === 'in_progress' ? progressPct : 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PATH B */}
        <div className="rounded-2xl bg-white border border-emerald-200 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] text-emerald-700 uppercase tracking-wider font-bold block">
                Q-Care Smart Flow
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Dynamic Sequence
              </h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-emerald-700 font-bold block">42 Mins Total</span>
              <span className="text-[10px] text-emerald-700 font-semibold">Saved 93 Minutes (-69%)</span>
            </div>
          </div>

          <div className="space-y-3">
            {qcareSteps.map((step, idx) => {
              const status = getStepStatus(step, currentMinute);
              const progressPct = Math.min(100, Math.max(0, ((currentMinute - step.startMin) / (step.endMin - step.startMin)) * 100));

              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border transition-all ${
                    status === 'in_progress'
                      ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-300 shadow-xs'
                      : status === 'completed'
                      ? 'bg-slate-50 border-slate-200 opacity-60'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-900">
                      0{idx + 1}. {step.name}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold">
                      {step.waitMinutes}m Wait + {step.testMinutes}m Test
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-500 flex items-center justify-between mb-2">
                    <span className="text-emerald-700 font-medium">✓ {step.highlight}</span>
                    <span>Starts: +{step.startMin}m</span>
                  </div>

                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-150"
                      style={{ width: `${status === 'completed' ? 100 : status === 'in_progress' ? progressPct : 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {onClose && (
        <div className="text-right pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors border border-slate-200"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};
