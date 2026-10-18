import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  ChevronRight,
  Cpu
} from 'lucide-react';
import { Patient, QueueRoutingPlan, RouteStep, QueueToken, ClinicalReport } from '../../types';
import { askQBieAI, QBiePatientContext } from '../../engine/groqService';

interface QBieCompanionProps {
  patient: Patient;
  routingPlan: QueueRoutingPlan;
  upNextStep?: RouteStep;
  calledToken?: QueueToken;
  inProgressToken?: QueueToken;
  allCompleted: boolean;
  reports: ClinicalReport[];
  language?: 'en' | 'hi';
}

export const QBieCompanion: React.FC<QBieCompanionProps> = ({
  patient,
  routingPlan,
  upNextStep,
  calledToken,
  inProgressToken,
  allCompleted,
  reports,
  language = 'en'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [frameIndex, setFrameIndex] = useState(1);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'qbie' | 'user'; text: string; time: string }>>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Position coordinates of draggable avatar
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    if (typeof window !== 'undefined') {
      return {
        x: Math.max(16, window.innerWidth - 96),
        y: Math.max(16, window.innerHeight - 120)
      };
    }
    return { x: 300, y: 500 };
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number; moved: boolean }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    moved: false
  });

  const avatarWidth = 76;
  const avatarHeight = 76;

  // Window resize bounds protection: ensures mascot never gets lost off-screen
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => ({
        x: Math.max(12, Math.min(window.innerWidth - avatarWidth - 12, prev.x)),
        y: Math.max(12, Math.min(window.innerHeight - avatarHeight - 12, prev.y))
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mouse drag handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.startX;
      const dy = e.clientY - dragStartRef.current.startY;

      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        dragStartRef.current.moved = true;
      }

      const newX = Math.max(12, Math.min(window.innerWidth - avatarWidth - 12, dragStartRef.current.initialX + dx));
      const newY = Math.max(12, Math.min(window.innerHeight - avatarHeight - 12, dragStartRef.current.initialY + dy));

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Touch drag handlers for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    dragStartRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      initialX: position.x,
      initialY: position.y,
      moved: false
    };
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragStartRef.current.startX;
    const dy = touch.clientY - dragStartRef.current.startY;

    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      dragStartRef.current.moved = true;
    }

    const newX = Math.max(12, Math.min(window.innerWidth - avatarWidth - 12, dragStartRef.current.initialX + dx));
    const newY = Math.max(12, Math.min(window.innerHeight - avatarHeight - 12, dragStartRef.current.initialY + dy));

    setPosition({ x: newX, y: newY });
  };

  const handleTouchEnd = () => {
    if (isDragging) {
      setIsDragging(false);
      if (!dragStartRef.current.moved) {
        setIsOpen(prev => !prev);
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag with left click
    if (e.button !== 0) return;
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
      moved: false
    };
    setIsDragging(true);
  };

  const handleClickAvatar = () => {
    if (!dragStartRef.current.moved) {
      setIsOpen(prev => !prev);
    }
  };

  // Smooth animation frames
  useEffect(() => {
    const timer = setInterval(() => {
      setFrameIndex(prev => (prev >= 6 ? 1 : prev + 1));
    }, 1200);
    return () => clearInterval(timer);
  }, []);

  // Build live patient context object for Groq
  const patientContext: QBiePatientContext = useMemo(() => {
    return {
      patientName: patient.name,
      uhid: patient.uhid,
      age: patient.age,
      gender: patient.gender,
      hospitalName: patient.hospitalName || 'QCare Demo Hospital',
      doctorName: patient.prescribedDoctorName,
      doctorDepartment: patient.department || 'Cardiology OPD',
      doctorRoom: patient.prescribedDoctorRoom || 'OPD Room 204',
      symptoms: patient.currentIllness || patient.symptoms,
      opdTokenNumber: patient.opdTokenNumber,
      currentStop: upNextStep ? {
        testName: upNextStep.testName,
        room: upNextStep.location.room,
        floor: upNextStep.location.floor,
        estimatedWaitMinutes: upNextStep.estimatedWaitMinutes,
        patientsAhead: 2,
        reason: upNextStep.reasonForSequence
      } : undefined,
      calledToken: calledToken ? {
        tokenNumber: calledToken.tokenNumber,
        room: upNextStep?.location.room
      } : undefined,
      inProgressToken: inProgressToken ? {
        tokenNumber: inProgressToken.tokenNumber,
        testName: upNextStep?.testName
      } : undefined,
      allCompleted,
      prescribedTests: routingPlan.smartRouteSteps.map(s => ({
        name: s.testName,
        room: s.location.room,
        floor: s.location.floor,
        status: patient.completedTests.includes(s.testId) 
          ? 'completed' 
          : (s.testId === upNextStep?.testId ? 'up_next' : 'queued'),
        waitMinutes: s.estimatedWaitMinutes,
        queueCount: 2
      })),
      completedReports: reports.map(r => ({
        testName: r.testName,
        summary: r.summary
      })),
      language
    };
  }, [patient, routingPlan, upNextStep, calledToken, inProgressToken, allCompleted, reports, language]);

  // Initial greeting
  useEffect(() => {
    if (chatMessages.length === 0) {
      const greeting = language === 'hi'
        ? `नमस्ते ${patient.name.split(' ')[0]} जी! मैं Q-Bie हूँ 🤖, Groq AI संचालित अस्पताल साथी। मैं सबसे कम इंतज़ार में आपकी जांचें पूरी करवाने में मदद करूँगा। मुझसे कुछ भी पूछें!`
        : `Hi ${patient.name.split(' ')[0]}! I'm Q-Bie, your Groq AI-powered hospital companion 🤖. I track all diagnostic queues in real-time. Ask me anything or tap any quick question below!`;

      setChatMessages([
        {
          sender: 'qbie',
          text: greeting,
          time: 'Just now'
        }
      ]);
    }
  }, [patient.name, chatMessages.length, language]);

  const handleQuickQuestion = async (type: 'where' | 'why_skip' | 'explain_reports' | 'how_called') => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let userText = '';

    if (type === 'where') {
      userText = language === 'hi' ? 'मुझे अभी कहाँ जाना चाहिए और किस कमरे में? 📍' : 'Where should I go right now and in which room? 📍';
    } else if (type === 'why_skip') {
      userText = language === 'hi' ? 'स्मार्ट रूटिंग से मेरा समय कैसे बचता है? ⚡' : 'Why did Q-Care optimize my test sequence? ⚡';
    } else if (type === 'explain_reports') {
      userText = language === 'hi' ? 'मेरी जांच रिपोर्ट की क्या स्थिति है? 📋' : 'What is the status of my completed test reports? 📋';
    } else if (type === 'how_called') {
      userText = language === 'hi' ? 'मेरी बारी कब और कैसे आएगी? 🕒' : 'How will I know when my turn is called? 🕒';
    }

    setChatMessages(prev => [...prev, { sender: 'user', text: userText, time: nowStr }]);
    setIsTyping(true);

    try {
      const aiReply = await askQBieAI(userText, patientContext);
      setChatMessages(prev => [...prev, { sender: 'qbie', text: aiReply, time: nowStr }]);
    } catch {
      setChatMessages(prev => [...prev, { 
        sender: 'qbie', 
        text: upNextStep 
          ? `Please proceed to ${upNextStep.location.room} (${upNextStep.location.floor}) for ${upNextStep.testName}. Estimated wait is ~${upNextStep.estimatedWaitMinutes} mins!` 
          : `All tests are complete! Please return to ${patient.prescribedDoctorName}.`, 
        time: nowStr 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setInputValue('');

    setChatMessages(prev => [...prev, { sender: 'user', text: userText, time: nowStr }]);
    setIsTyping(true);

    try {
      const aiReply = await askQBieAI(userText, patientContext);
      setChatMessages(prev => [...prev, { sender: 'qbie', text: aiReply, time: nowStr }]);
    } catch {
      setChatMessages(prev => [...prev, { 
        sender: 'qbie', 
        text: upNextStep 
          ? `Head to ${upNextStep.location.room} for your ${upNextStep.testName}. Wait is only ~${upNextStep.estimatedWaitMinutes} mins!` 
          : `All tests complete! Please return to ${patient.prescribedDoctorName}.`, 
        time: nowStr 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Smart responsive boundary-aware panel placement
  // Calculate panel position so it NEVER overflows or clips off viewport edges
  const panelWidth = typeof window !== 'undefined' ? Math.min(390, window.innerWidth - 24) : 380;
  const panelHeight = typeof window !== 'undefined' ? Math.min(540, window.innerHeight - 40) : 500;

  let panelStyle: React.CSSProperties = {};
  if (typeof window !== 'undefined') {
    const isBottomHalf = position.y > window.innerHeight / 2;
    const isRightHalf = position.x > window.innerWidth / 2;

    const top = isBottomHalf 
      ? Math.max(12, position.y - panelHeight - 12)
      : Math.min(window.innerHeight - panelHeight - 12, position.y + avatarHeight + 12);

    const left = isRightHalf
      ? Math.max(12, position.x + avatarWidth - panelWidth)
      : Math.min(window.innerWidth - panelWidth - 12, position.x);

    panelStyle = {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${panelWidth}px`,
      maxHeight: `${panelHeight}px`,
      zIndex: 55
    };
  }

  return (
    <>
      {/* Freely Draggable Prominent Q-Bie Avatar (Rule 2) */}
      <div
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          zIndex: 50,
          touchAction: 'none'
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClickAvatar}
        className={`group select-none cursor-grab active:cursor-grabbing transition-transform ${isDragging ? 'scale-105' : 'hover:scale-105'}`}
      >
        <div className="relative flex items-center justify-center">
          {/* Pulsing Aura Halo */}
          <span className="absolute inset-0 rounded-full bg-blue-500/25 animate-ping pointer-events-none" />

          {/* Thick-Sized Avatar Bubble (Rule 2) */}
          <div className="w-[74px] h-[74px] sm:w-[80px] sm:h-[80px] rounded-full bg-gradient-to-br from-white via-blue-50 to-indigo-100 border-4 border-blue-600 shadow-2xl flex items-center justify-center p-1.5 relative overflow-hidden backdrop-blur-md">
            <img 
              src={`/robot_frames/robot_${frameIndex}.png`} 
              alt="Q-Bie AI Hospital Companion Mascot" 
              className="w-full h-full object-contain pointer-events-none select-none drop-shadow-sm"
              draggable={false}
            />

            {/* Online Green Indicator Dot */}
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 absolute top-1 right-1 border-2 border-white shadow-xs" />

            {/* Drag Handle Indicator */}
            <div className="absolute bottom-0 inset-x-0 bg-slate-900/60 text-white text-[7px] font-black uppercase text-center tracking-tighter py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              Drag Me
            </div>
          </div>

          {/* Pill Badge Tag */}
          <div className="absolute -bottom-2 bg-slate-950 text-white px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-tight border border-blue-400 shadow-md flex items-center gap-1 pointer-events-none whitespace-nowrap">
            <Sparkles className="w-2.5 h-2.5 text-amber-400" />
            <span>Q-Bie AI</span>
          </div>
        </div>
      </div>

      {/* Smart Responsive Dialogue Panel (Rule 3: Boundary-Aware Positioning) */}
      {isOpen && (
        <div 
          style={panelStyle}
          className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col animate-scaleUp text-slate-900"
        >
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-white/15 p-1 flex items-center justify-center border border-white/20">
                <img 
                  src={`/robot_frames/robot_${frameIndex}.png`} 
                  alt="Q-Bie" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-xs tracking-tight">Q-Bie AI Mascot</h3>
                  <span className="text-[9px] font-bold bg-emerald-400 text-slate-950 px-1.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 animate-pulse" />
                    <span>Groq Live</span>
                  </span>
                </div>
                <p className="text-[10px] text-blue-100 flex items-center gap-1">
                  <Cpu className="w-2.5 h-2.5" />
                  <span>qwen3.8-27b • Real Hospital Context</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="p-3.5 overflow-y-auto flex-1 space-y-2.5 bg-slate-50/60 text-xs">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'qbie' && (
                  <div className="w-6 h-6 rounded-lg bg-blue-100 border border-blue-200 p-0.5 shrink-0 self-end">
                    <img 
                      src={`/robot_frames/robot_${frameIndex}.png`} 
                      alt="Q-Bie" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <div
                  className={`max-w-[84%] p-2.5 rounded-2xl shadow-2xs leading-relaxed whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-xs'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                  }`}
                >
                  <p>{msg.text}</p>
                  <span className={`text-[8px] block mt-1 ${msg.sender === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-1.5 text-slate-400 text-xs italic pl-8">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce delay-100" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce delay-200" />
                <span>Q-Bie is thinking with Groq AI...</span>
              </div>
            )}
          </div>

          {/* Quick Suggestions Chips */}
          <div className="p-2.5 bg-white border-t border-slate-100 space-y-1 shrink-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block px-1">
              {language === 'hi' ? 'त्वरित सहायता' : 'Quick Questions'}
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickQuestion('where')}
                className="p-1.5 text-left bg-slate-50 hover:bg-blue-50/70 border border-slate-200 rounded-xl text-[10px] font-semibold text-slate-700 hover:text-blue-700 transition-colors flex items-center justify-between"
              >
                <span className="truncate">📍 {language === 'hi' ? 'कहाँ जाना है?' : 'Where to go now?'}</span>
                <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickQuestion('why_skip')}
                className="p-1.5 text-left bg-slate-50 hover:bg-blue-50/70 border border-slate-200 rounded-xl text-[10px] font-semibold text-slate-700 hover:text-blue-700 transition-colors flex items-center justify-between"
              >
                <span className="truncate">⚡ {language === 'hi' ? 'समय कैसे बचा?' : 'Why smart route?'}</span>
                <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickQuestion('explain_reports')}
                className="p-1.5 text-left bg-slate-50 hover:bg-blue-50/70 border border-slate-200 rounded-xl text-[10px] font-semibold text-slate-700 hover:text-blue-700 transition-colors flex items-center justify-between"
              >
                <span className="truncate">📋 {language === 'hi' ? 'मेरी रिपोर्ट स्थिति' : 'Report status'}</span>
                <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickQuestion('how_called')}
                className="p-1.5 text-left bg-slate-50 hover:bg-blue-50/70 border border-slate-200 rounded-xl text-[10px] font-semibold text-slate-700 hover:text-blue-700 transition-colors flex items-center justify-between"
              >
                <span className="truncate">🕒 {language === 'hi' ? 'मेरी बारी कब?' : 'How am I called?'}</span>
                <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              </button>
            </div>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center gap-1.5 shrink-0">
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder={language === 'hi' ? 'फास्टिंग, कमरा या रिपोर्ट के बारे में पूछें...' : 'Ask Q-Bie anything (fasting, room, reports)...'}
              className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition-all shadow-2xs"
            >
              <Send className="w-3 h-3" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
