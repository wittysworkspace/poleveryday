import React, { useState, useEffect, useRef } from 'react';
import { 
  GraduationCap, Briefcase, Laptop, Store, Wind, Car, TrendingUp, 
  Hammer, Coffee, Wrench, Landmark, AlertTriangle, CheckCircle, 
  Activity, Clock, DollarSign, ChevronRight, ShieldAlert, Heart, Map, Info, Users, Copy, LogIn, Play, Loader
} from 'lucide-react';

// --- Firebase Imports ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyAkrhvM9TtdBl5laZ-QVSgZjm5boAicYcY",
  authDomain: "poleveryday.firebaseapp.com",
  projectId: "poleveryday",
  storageBucket: "poleveryday.firebasestorage.app",
  messagingSenderId: "641725643801",
  appId: "1:641725643801:web:016d360044bc8cbfb5fe88",
  measurementId: "G-VMGQYM1C8J"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const globalAppId = typeof __app_id !== 'undefined' ? __app_id : 'pol-everyday-production';

// --- Constants & Layout Data ---
const ZONES = ['Residential', 'CBD', 'City Hall', 'University', 'Industrial'];

const MAP_LAYOUT = [
  { name: 'Residential', col: 'col-span-1', row: 'row-span-1', gradient: 'from-green-900/40 to-emerald-900/20', border: 'border-green-500/30', text: 'text-green-400' },
  { name: 'CBD', col: 'col-span-1', row: 'row-span-1', gradient: 'from-blue-900/40 to-cyan-900/20', border: 'border-blue-500/30', text: 'text-blue-400' },
  { name: 'City Hall', col: 'col-span-1', row: 'row-span-1', gradient: 'from-amber-900/40 to-orange-900/20', border: 'border-amber-500/30', text: 'text-amber-400', isHub: true },
  { name: 'University', col: 'col-span-1', row: 'row-span-1', gradient: 'from-purple-900/40 to-fuchsia-900/20', border: 'border-purple-500/30', text: 'text-purple-400' },
  { name: 'Industrial', col: 'col-span-1 sm:col-span-3', row: 'row-span-1', gradient: 'from-slate-800/40 to-gray-800/20', border: 'border-slate-500/30', text: 'text-slate-400' }
];

const CRISIS_TYPES = [
  { type: 'PM 2.5', effect: 'Drain Mental Health', icon: Wind, color: 'text-gray-400' },
  { type: 'Traffic Jam', effect: 'Drain Time', icon: Car, color: 'text-orange-400' },
  { type: 'High Cost', effect: 'Drain Money', icon: TrendingUp, color: 'text-red-400' }
];

const POLICIES = [
  { id: 'cleanAir', name: 'Clean Air Act', costMoney: 8, costTime: 2 },
  { id: 'publicTransport', name: 'Public Transit Fund', costMoney: 8, costTime: 2 },
  { id: 'safeWalkways', name: 'Safe Walkways', costMoney: 8, costTime: 2 }
];

const INITIAL_CHARS = [
  { id: 0, role: 'Student', iconName: 'GraduationCap', color: 'text-blue-400', bg: 'bg-blue-900/30', money: 2, maxMoney: 15, time: 5, maxTime: 5, mh: 10, maxMh: 10, location: 'University', perk: '1st move is free' },
  { id: 1, role: 'Salaryman', iconName: 'Briefcase', color: 'text-gray-300', bg: 'bg-gray-700/50', money: 8, maxMoney: 15, time: 3, maxTime: 5, mh: 6, maxMh: 10, location: 'CBD', perk: '+1 Money per turn' },
  { id: 2, role: 'Freelancer', iconName: 'Laptop', color: 'text-purple-400', bg: 'bg-purple-900/30', money: 4, maxMoney: 15, time: 4, maxTime: 5, mh: 8, maxMh: 10, location: 'Residential', perk: 'Earns +3 Money when working' },
  { id: 3, role: 'Merchant', iconName: 'Store', color: 'text-green-400', bg: 'bg-green-900/30', money: 6, maxMoney: 15, time: 3, maxTime: 5, mh: 9, maxMh: 10, location: 'Industrial', perk: 'Rest heals all in zone' },
];

const ICONS = { GraduationCap, Briefcase, Laptop, Store };

const generateLobbyCode = () => Math.random().toString(36).substring(2, 6).toUpperCase();

export default function App() {
  const [user, setUser] = useState(null);
  const [appStatus, setAppStatus] = useState('MENU'); 
  const [lobbyCode, setLobbyCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [gameData, setGameData] = useState(null);
  const [moveMode, setMoveMode] = useState(false);
  const logsEndRef = useRef(null);
  
  const [timeLeft, setTimeLeft] = useState(30);
  const isEndingTurn = useRef(false);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameData?.logs]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        setAuthError(err.message);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !lobbyCode) return;
    const lobbyRef = doc(db, 'artifacts', globalAppId, 'public', 'data', 'lobbies', lobbyCode);
    const unsubscribe = onSnapshot(lobbyRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setGameData(data);
        if (data.gameState === 'PLAYING' && appStatus !== 'PLAYING') setAppStatus('PLAYING');
      } else {
        if (appStatus !== 'MENU') {
          setErrorMsg("ไม่พบห้องนี้ หรือห้องถูกปิดแล้ว");
          setAppStatus('MENU');
        }
      }
    });
    return () => unsubscribe();
  }, [user, lobbyCode, appStatus]);

  useEffect(() => {
    if (appStatus !== 'PLAYING' || !gameData?.turnEndTime) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((gameData.turnEndTime - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining === 0 && isMyTurn() && !isEndingTurn.current) {
        isEndingTurn.current = true;
        handleEndTurn();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [appStatus, gameData?.turnEndTime, gameData?.turnIndex]);

  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      const BASE_WIDTH = 1366; 
      const BASE_HEIGHT = 768;
      const scaleX = window.innerWidth / BASE_WIDTH;
      const scaleY = window.innerHeight / BASE_HEIGHT;
      
      setScale(Math.min(scaleX, scaleY));
    };
    
    handleResize(); // สั่งคำนวณครั้งแรกตอนเปิดหน้าเว็บ
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const createLobby = async () => {
    if (!user) return;
    setIsLoading(true);
    const newCode = generateLobbyCode();
    const lobbyRef = doc(db, 'artifacts', globalAppId, 'public', 'data', 'lobbies', newCode);
    const initialGameData = {
      host: user.uid,
      gameState: 'LOBBY',
      panic: 0,
      policies: { cleanAir: false, publicTransport: false, safeWalkways: false },
      characters: INITIAL_CHARS,
      turnIndex: 0,
      turnCount: 1,
      logs: [{ id: Date.now(), msg: "CRISIS PROTOCOL INITIATED. รอผู้เล่นอย่างน้อย 2 คน...", type: "system" }],
      studentFreeMove: true,
      zones: { 'Residential': [], 'CBD': [], 'City Hall': [], 'University': [], 'Industrial': [] },
      players: {} 
    };
    try {
      await setDoc(lobbyRef, initialGameData);
      setLobbyCode(newCode);
      setAppStatus('LOBBY');
    } catch (e) { setErrorMsg(e.message); }
    setIsLoading(false);
  };

  const joinLobby = async (code) => {
    if (!user) return;
    setIsLoading(true);
    const codeUpper = code.toUpperCase();
    const lobbyRef = doc(db, 'artifacts', globalAppId, 'public', 'data', 'lobbies', codeUpper);
    try {
      const docSnap = await getDoc(lobbyRef);
      if (docSnap.exists()) {
        setLobbyCode(codeUpper);
        const data = docSnap.data();
        setAppStatus(data.gameState === 'PLAYING' ? 'PLAYING' : 'LOBBY');
        setErrorMsg('');
      } else { setErrorMsg("ไม่พบรหัสห้องนี้"); }
    } catch (e) { setErrorMsg(e.message); }
    setIsLoading(false);
  };

  const syncState = async (updates) => {
    if (!lobbyCode || !user || !gameData) return;
    const lobbyRef = doc(db, 'artifacts', globalAppId, 'public', 'data', 'lobbies', lobbyCode);
    await updateDoc(lobbyRef, updates);
  };

  const claimCharacter = (charId) => {
    const newPlayers = { ...gameData.players };
    if (newPlayers[charId] === user.uid) {
      delete newPlayers[charId];
    } else {
      Object.keys(newPlayers).forEach(key => {
        if (newPlayers[key] === user.uid) delete newPlayers[key];
      });
      newPlayers[charId] = user.uid;
    }
    syncState({ players: newPlayers });
  };

  const startGamePlay = async () => {
    setIsLoading(true);
    await syncState({ 
      gameState: 'PLAYING', 
      turnEndTime: Date.now() + (30 * 1000),
      logs: [...gameData.logs, { id: Date.now(), msg: "=== ภารกิจเริ่มต้น! โปรดรักษาเมืองไว้ให้ได้ ===", type: "system" }] 
    });
    setIsLoading(false);
  };

  const isMyTurn = () => {
    if (!gameData || !user) return false;
    const activeCharOwner = gameData.players[gameData.turnIndex];
    return activeCharOwner === user.uid || !activeCharOwner;
  };

  const handleEndTurn = () => {
    if (!isMyTurn()) return;
    const nextIndex = (gameData.turnIndex + 1) % 4;
    const isNewRound = nextIndex === 0;
    const newTurnCount = isNewRound ? gameData.turnCount + 1 : gameData.turnCount;
    
    let nextChar = { ...gameData.characters[nextIndex] };
    let newChars = [...gameData.characters];
    let newZones = { ...gameData.zones };
    let newPanic = gameData.panic;
    let newLogs = [...gameData.logs];
    let newStudentFreeMove = gameData.studentFreeMove;

    const addLog = (msg, type='normal') => newLogs.push({ id: Date.now() + Math.random(), msg, type });
    nextChar.time = nextChar.maxTime; 
    
    if (nextChar.role === 'Student') newStudentFreeMove = true;
    if (nextChar.role === 'Salaryman') {
      nextChar.money = Math.min(nextChar.maxMoney, nextChar.money + 1);
      addLog("Salaryman ได้รับรายได้เสริม +1 Money", 'good');
    }

    const crisisZones = ['Residential', 'CBD', 'University', 'Industrial']; 
    const targetZone = crisisZones[Math.floor(Math.random() * crisisZones.length)];
    const newCrisis = CRISIS_TYPES[Math.floor(Math.random() * CRISIS_TYPES.length)];
    newZones[targetZone] = [...newZones[targetZone], newCrisis];
    addLog(`ALERT: ${newCrisis.type} เกิดขึ้นที่โซน ${targetZone}!`, 'crisis');

    if (newZones[targetZone].length > 3) {
      newZones[targetZone] = [];
      newPanic = Math.min(100, newPanic + 20);
      addLog(`SYSTEM COLLAPSE ใน ${targetZone}! ค่า Panic +20%`, 'critical');
    }

    const activeCrises = newZones[nextChar.location];
    if (activeCrises && activeCrises.length > 0) {
      activeCrises.forEach(c => {
        if (c.type === 'PM 2.5') nextChar.mh -= 1;
        if (c.type === 'Traffic Jam') nextChar.time -= 1;
        if (c.type === 'High Cost') nextChar.money -= 1;
      });
      nextChar.mh = Math.max(0, nextChar.mh);
      nextChar.time = Math.max(0, nextChar.time);
      nextChar.money = Math.max(0, nextChar.money);
    }

    newChars[nextIndex] = nextChar;
    let finalState = 'PLAYING';
    if (newPanic >= 100 || newChars.some(c => c.mh <= 0)) finalState = 'LOST';
    else if (Object.values(gameData.policies).every(Boolean)) finalState = 'WON';

    syncState({
      turnIndex: nextIndex, turnCount: newTurnCount, characters: newChars, zones: newZones, panic: newPanic,
      logs: newLogs, studentFreeMove: newStudentFreeMove, gameState: finalState,
      turnEndTime: Date.now() + (30 * 1000)
    });
    setMoveMode(false);
    setTimeout(() => { isEndingTurn.current = false; }, 1000);
  };

  const handleZoneClick = (zoneName) => {
    if (!moveMode || !isMyTurn()) return;
    const char = gameData.characters[gameData.turnIndex];
    if (char.location === zoneName) { setMoveMode(false); return; }
    const cost = (char.role === 'Student' && gameData.studentFreeMove) ? 0 : 1;
    if (char.time < cost) return;
    let newChars = [...gameData.characters];
    newChars[gameData.turnIndex] = { ...char, time: char.time - cost, location: zoneName };
    syncState({ characters: newChars, studentFreeMove: cost === 0 ? false : gameData.studentFreeMove, logs: [...gameData.logs, { id: Date.now(), msg: `${char.role} เดินทางไปที่ ${zoneName}`, type: 'normal' }] });
    setMoveMode(false);
  };

  const handleWork = () => {
    if (!isMyTurn()) return;
    const char = gameData.characters[gameData.turnIndex];
    if (char.time < 1) return;
    let moneyGain = char.role === 'Freelancer' ? 3 : 2;
    let mhLoss = 1;
    if (char.location === 'CBD') { moneyGain += 2; mhLoss += 1; }
    else if (char.location === 'Industrial') moneyGain += 1;
    let newChars = [...gameData.characters];
    newChars[gameData.turnIndex] = { ...char, time: char.time - 1, money: Math.min(char.maxMoney, char.money + moneyGain), mh: Math.max(0, char.mh - mhLoss) };
    syncState({ characters: newChars, logs: [...gameData.logs, { id: Date.now(), msg: `${char.role} ทำงานใน ${char.location}: +${moneyGain}$, -${mhLoss}MH`, type: 'normal' }] });
  };

  const handleRest = () => {
    if (!isMyTurn()) return;
    const char = gameData.characters[gameData.turnIndex];
    if (char.time < 1) return;
    let baseHeal = char.location === 'Residential' ? 4 : 2;
    let newChars = [...gameData.characters];
    if (char.role === 'Merchant') {
      newChars.filter(c => c.location === char.location).forEach(c => {
        const idx = newChars.findIndex(x => x.id === c.id);
        newChars[idx].mh = Math.min(newChars[idx].maxMh, newChars[idx].mh + baseHeal);
      });
      newChars[gameData.turnIndex].time -= 1;
    } else {
      newChars[gameData.turnIndex] = { ...char, time: char.time - 1, mh: Math.min(char.maxMh, char.mh + baseHeal) };
    }
    syncState({ characters: newChars, logs: [...gameData.logs, { id: Date.now(), msg: `${char.role} พักผ่อน: +${baseHeal}MH`, type: 'good' }] });
  };

  const handleFix = () => {
    if (!isMyTurn()) return;
    const char = gameData.characters[gameData.turnIndex];
    if (char.time < 1 || gameData.zones[char.location].length === 0) return;
    const zoneCrises = [...gameData.zones[char.location]];
    zoneCrises.pop();
    let newChars = [...gameData.characters];
    const updatedChar = { ...char, time: char.time - 1 };
    if (Math.random() > 0.5) updatedChar.money = Math.min(char.maxMoney, char.money + 1);
    else updatedChar.mh = Math.min(char.maxMh, char.mh + 1);
    newChars[gameData.turnIndex] = updatedChar;
    syncState({ zones: { ...gameData.zones, [char.location]: zoneCrises }, characters: newChars, logs: [...gameData.logs, { id: Date.now(), msg: `${char.role} แก้ไขวิกฤตสำเร็จ!`, type: 'good' }] });
  };

  const handlePassPolicy = (policy) => {
    if (!isMyTurn()) return;
    const activeChar = gameData.characters[gameData.turnIndex];
    if (activeChar.location !== 'City Hall' || activeChar.time < policy.costTime || activeChar.money < policy.costMoney) return;
    let newChars = [...gameData.characters];
    newChars[gameData.turnIndex] = { ...activeChar, time: activeChar.time - policy.costTime, money: activeChar.money - policy.costMoney };
    const newPolicies = { ...gameData.policies, [policy.id]: true };
    syncState({ characters: newChars, policies: newPolicies, logs: [...gameData.logs, { id: Date.now(), msg: `SUCCESS: นโยบาย ${policy.name} ผ่านแล้ว!`, type: 'critical' }] });
  };

  const myTurn = isMyTurn();

  const renderLoading = () => (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center">
      <Loader className="w-16 h-16 text-blue-500 animate-spin mb-4" />
      <div className="text-blue-400 font-bold tracking-widest animate-pulse uppercase">Syncing City Data...</div>
    </div>
  );

  const getProgressColor = (val, max, inverse = false) => {
    const pct = val / max;
    if (inverse) return pct > 0.7 ? 'bg-red-500' : pct > 0.4 ? 'bg-yellow-500' : 'bg-green-500';
    return pct > 0.7 ? 'bg-green-500' : pct > 0.3 ? 'bg-yellow-500' : 'bg-red-500';
  };

  if (appStatus === 'MENU') {
    return (
      <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center text-slate-200 p-6 relative overflow-hidden">
        {isLoading && renderLoading()}
        <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
        <div className="max-w-xl text-center space-y-8 relative z-10 w-full">
          <ShieldAlert className="w-24 h-24 mx-auto text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
          <h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-blue-400 via-emerald-300 to-cyan-500">POL EVERYDAY<span className="block text-2xl mt-2 text-slate-400 tracking-widest font-bold uppercase">Multiplayer Crisis</span></h1>
          <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 p-6 rounded-[2.5rem] flex flex-col gap-4 shadow-2xl">
            <button onClick={createLobby} disabled={!user} className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"><Users className="w-5 h-5"/> สร้างห้องใหม่</button>
            <div className="flex items-center gap-4 text-slate-500"><hr className="flex-1 border-white/10" /><span>หรือ</span><hr className="flex-1 border-white/10" /></div>
            <div className="flex gap-2">
              <input type="text" maxLength={4} value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="รหัสห้อง" className="w-32 bg-slate-950 border border-white/10 rounded-2xl px-4 text-center font-mono text-white focus:border-blue-500" />
              <button onClick={() => joinLobby(joinCode)} disabled={!user || joinCode.length !== 4} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl border border-white/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"><LogIn className="w-5 h-5"/> เข้าร่วม</button>
            </div>
            {errorMsg && <div className="text-red-400 text-sm font-bold animate-pulse">{errorMsg}</div>}
          </div>
          {authError && <div className="text-xs text-red-400 bg-red-900/20 p-3 rounded-xl border border-red-500/30">⚠️ Auth Error: {authError}</div>}
        </div>
        <div className="fixed bottom-4 left-4 text-[10px] sm:text-xs text-slate-500/60 font-mono z-50 pointer-events-none">v1.0.3</div>
      </div>
    );
  }

  if (appStatus === 'LOBBY' && gameData) {
    const uniquePlayers = new Set(Object.values(gameData.players).filter(Boolean)).size;
    const canStart = uniquePlayers >= 2;
    return (
      <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center text-slate-200 p-4 sm:p-6 relative overflow-hidden">
        {isLoading && renderLoading()}
        <div className="max-w-2xl w-full bg-slate-900/80 backdrop-blur-xl border border-white/10 p-5 sm:p-8 rounded-3xl sm:rounded-[2.5rem] shadow-2xl relative z-10 overflow-y-auto max-h-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6 sm:mb-8 border-b border-white/10 pb-5 sm:pb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">ห้องเตรียมตัว <span className="text-xs sm:text-sm font-bold bg-blue-900/50 text-blue-300 px-3 py-1 rounded-full">{uniquePlayers}/4</span></h2>
              <div className="text-slate-400 text-xs sm:text-sm mt-1">เลือกบทบาท (ต้องการอย่างน้อย 2 คน)</div>
            </div>
            <div className="w-full sm:w-auto bg-slate-950 border border-blue-500/30 px-4 py-2 sm:px-5 rounded-2xl flex flex-row sm:flex-col justify-between sm:justify-center items-center">
              <div className="text-[10px] text-blue-400 uppercase font-bold tracking-widest">Invite Code</div>
              <div className="text-xl sm:text-2xl font-mono font-black text-white flex items-center gap-2">
                {lobbyCode}
                <button onClick={() => { navigator.clipboard.writeText(lobbyCode); alert("Copied!"); }} className="p-1 hover:bg-white/10 rounded"><Copy className="w-4 h-4 text-slate-400"/></button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {gameData.characters.map((c) => {
              const Icon = ICONS[c.iconName]; const isMe = gameData.players[c.id] === user.uid; const isOther = gameData.players[c.id] && !isMe;
              return (
                <button key={c.id} onClick={() => claimCharacter(c.id)} disabled={isOther} className={`p-3 sm:p-4 rounded-2xl border text-left transition-all flex items-center gap-3 sm:gap-4 ${isMe ? 'bg-blue-600/20 border-blue-500 ring-1 ring-blue-500' : isOther ? 'bg-slate-950 border-white/5 opacity-50 cursor-not-allowed' : 'bg-slate-800/50 border-white/10 hover:border-white/30'}`}>
                  <div className={`p-2 sm:p-3 rounded-xl min-w-[40px] flex justify-center ${c.bg}`}><Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${c.color}`} /></div>
                  <div className="min-w-0 flex-1"><div className="font-bold text-white text-sm sm:text-base truncate">{c.role}</div><div className="text-[9px] sm:text-[10px] text-slate-400 uppercase truncate">{isMe ? "คุณเลือกแล้ว" : isOther ? "มีคนเลือก" : "ว่าง"}</div></div>
                </button>
              )
            })}
          </div>
          {gameData.host === user.uid ? (
            <button onClick={startGamePlay} disabled={!canStart} className={`w-full py-4 sm:py-5 rounded-2xl text-lg sm:text-xl font-black transition-all flex justify-center items-center gap-2 ${canStart ? 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.3)] text-white hover:scale-[1.02]' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}>{canStart ? <><Play className="w-5 h-5 sm:w-6 sm:h-6"/> เริ่มภารกิจ</> : `รอผู้เล่นอีก ${2 - uniquePlayers} คน...`}</button>
          ) : <div className="text-center p-3 sm:p-4 bg-slate-800/30 rounded-2xl text-slate-400 animate-pulse border border-white/5 text-sm sm:text-base">รอหัวหน้าห้องเริ่มเกม...</div>}
        </div>
      </div>
    );
  }

    if (!gameData) return null;

  return (
    // 1. นำกล่อง Scale ออก กลับมาใช้ Full Screen ปกติ
    <div className="fixed inset-0 overflow-hidden bg-slate-950 text-slate-200 font-sans flex flex-col">
      {isLoading && renderLoading()}
      
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-lg border-b border-white/5 h-14 sm:h-16 px-4 flex items-center justify-between z-50 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
          <h1 className="text-sm sm:text-lg font-black tracking-wider text-white">POL EVERYDAY <span className="hidden sm:inline text-xs text-blue-400 font-mono ml-2">#{lobbyCode}</span></h1>
        </div>
        
        <div className="flex-1 max-w-[120px] sm:max-w-xs px-2 sm:px-4">
          <div className="flex justify-between text-[8px] sm:text-[10px] mb-1 font-bold uppercase tracking-wider">
            <span className="text-red-400">CITY PANIC</span>
            <span>{gameData.panic}%</span>
          </div>
          <div className="h-1.5 sm:h-2 bg-slate-950 rounded-full border border-white/5">
            <div className={`h-full transition-all duration-700 ${getProgressColor(gameData.panic, 100, true)}`} style={{ width: `${gameData.panic}%` }} />
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold bg-slate-950/80 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-white/10 shrink-0">
          <span className="hidden sm:inline text-slate-400 uppercase">Policies</span>
          <div className="flex gap-1">
            {[1, 2, 3].map(i => <div key={i} className={`w-2 h-2 rounded-full ${i <= Object.values(gameData.policies).filter(Boolean).length ? 'bg-emerald-400' : 'bg-slate-800'}`} />)}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      {/* 2. ✅ แก้ให้จอเล็กไถขึ้นลงได้ (overflow-y-auto) ส่วนจอใหญ่ล็อกไว้ (lg:overflow-hidden) */}
      <main className="flex-1 flex flex-col lg:flex-row p-2 sm:p-3 gap-2 sm:gap-3 overflow-y-auto lg:overflow-hidden">
        
        {/* Left Side: Map & Logs */}
        {/* 3. ✅ ป้องกันไม่ให้ฝั่งซ้ายโดนบีบตอนอยู่บนจอเล็ก (shrink-0) */}
        <div className="flex-[1.5] flex flex-col gap-2 sm:gap-3 shrink-0 lg:min-h-0 lg:shrink">
          
          {/* Map Grid */}
          {/* 4. ✅ บังคับความสูงขั้นต่ำ (min-h-[300px]) แผนที่จะได้ไม่แบน */}
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl sm:rounded-[2rem] p-2 sm:p-3 flex-1 min-h-[300px] lg:min-h-0 overflow-hidden relative">
            {/* 5. ✅ ปรับจำนวนแถว Grid ให้สมส่วน */}
            <div className="grid grid-cols-2 sm:grid-cols-3 grid-rows-3 sm:grid-rows-2 gap-2 h-full">
              {MAP_LAYOUT.map(zone => (
                <div 
                  key={zone.name} 
                  onClick={() => handleZoneClick(zone.name)} 
                  className={`${zone.col} ${zone.row} flex flex-col relative bg-gradient-to-br ${zone.gradient} border ${zone.border} rounded-2xl sm:rounded-3xl p-2 transition-all 
                  ${moveMode && myTurn && gameData.characters[gameData.turnIndex].location !== zone.name ? 'cursor-pointer hover:scale-105 border-blue-400 ring-2 ring-blue-400/20' : ''} 
                  ${gameData.characters[gameData.turnIndex].location === zone.name ? 'ring-2 ring-white/10' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`font-black uppercase text-[8px] sm:text-[10px] ${zone.text} truncate`}>{zone.name}</h3>
                    {zone.isHub && <Landmark className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400"/>}
                  </div>
                  
                  {/* Crisis List */}
                  <div className="flex flex-col gap-1 overflow-y-auto mb-auto scrollbar-hide">
                    {gameData.zones[zone.name].map((c, i) => (
                      <div key={i} className="flex items-center gap-1 bg-slate-950/80 px-1.5 py-0.5 rounded-lg border border-red-500/30 w-fit">
                        <span className="text-[7px] sm:text-[9px] font-bold text-slate-300 truncate">{c.type}</span>
                      </div>
                    ))}
                  </div>

                  {/* Character Icons in Zone */}
                  <div className="flex flex-wrap gap-1 mt-1 pt-1 border-t border-white/5">
                    {gameData.characters.filter(c => c.location === zone.name).map(c => {
                      const CIco = ICONS[c.iconName];
                      const isActive = gameData.turnIndex === c.id;
                      return (
                        <div key={c.id} className={`${c.bg} p-1 sm:p-1.5 rounded-lg sm:rounded-xl border relative ${isActive ? 'border-white' : 'border-white/10'}`}>
                          <CIco className={`w-3 h-3 sm:w-4 sm:h-4 ${c.color}`} />
                          {isActive && <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-ping"/>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Network Logs */}
          <div className="bg-slate-950 border border-white/5 rounded-2xl h-24 sm:h-32 shrink-0 flex flex-col overflow-hidden">
            <div className="bg-slate-900/80 p-2 border-b border-white/5 font-bold text-[8px] sm:text-[10px] text-slate-400 px-4 uppercase flex items-center gap-2">
              <Activity className="w-3 h-3 text-emerald-400"/> Network Logs
            </div>
            <div className="p-2 sm:p-3 overflow-y-auto flex-1 space-y-1 text-[9px] sm:text-[11px] font-mono scrollbar-hide">
              {gameData.logs.map(log => (
                <div key={log.id} className={`flex gap-2 ${log.type === 'crisis' ? 'text-red-400' : log.type === 'critical' ? 'text-yellow-400 font-bold' : log.type === 'good' ? 'text-emerald-400' : log.type === 'system' ? 'text-cyan-400' : 'text-slate-400'}`}>
                  <span className="opacity-50">{'>'}</span>{log.msg}
                </div>
              ))}
              <div ref={logsEndRef}/>
            </div>
          </div>
        </div>

        {/* Right Side: Players & Controls */}
        {/* 6. ✅ ป้องกันไม่ให้ฝั่งขวาโดนบีบตอนจอเล็กเช่นกัน */}
        <div className="lg:w-[350px] xl:w-[400px] flex flex-col gap-2 sm:gap-3 shrink-0 lg:min-h-0 lg:shrink">
          
          {/* Player Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
            {gameData.characters.map((c, i) => {
              const active = gameData.turnIndex === i;
              const CIco = ICONS[c.iconName];
              const owner = gameData.players[c.id];
              const isMine = owner === user.uid;
              return (
                <div key={c.id} className={`relative p-2 sm:p-3 rounded-2xl sm:rounded-3xl border transition-all ${active ? 'bg-slate-800 border-blue-500 shadow-lg' : 'bg-slate-900/50 border-white/5 opacity-70'}`}>
                  <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                    <div className={`p-1 sm:p-1.5 rounded-lg sm:rounded-xl ${c.bg}`}><CIco className="w-3 h-3 sm:w-4 sm:h-4 text-white"/></div>
                    <div className="min-w-0">
                      <div className="font-bold text-[10px] sm:text-xs truncate">{c.role} {isMine && ' (YOU)'}</div>
                      <div className="text-[8px] sm:text-[9px] text-blue-300 truncate uppercase tracking-tighter">{c.location}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[8px] sm:text-[9px] font-mono">
                    <div className="flex items-center gap-1 justify-center"><Heart className="w-2 h-2 text-pink-500"/>{c.mh}</div>
                    <div className="flex items-center gap-1 justify-center border-x border-white/10"><Clock className="w-2 h-2 text-blue-500"/>{c.time}</div>
                    <div className="flex items-center gap-1 justify-center"><DollarSign className="w-2 h-2 text-emerald-500"/>{c.money}</div>
                  </div>
                  {!owner && (
                    <button onClick={() => claimCharacter(c.id)} className="w-full mt-2 py-1 bg-emerald-600/30 hover:bg-emerald-600 rounded-lg text-[8px] font-black uppercase transition-colors">Take Control</button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Control Panel */}
          {/* 7. ✅ ใส่ min-h ให้ Control Panel เผื่อไว้ */}
          <div className="bg-slate-900/60 border border-white/5 rounded-2xl sm:rounded-[2rem] flex flex-col flex-1 min-h-[350px] lg:min-h-0 overflow-hidden relative shadow-2xl">
            {/* Status & Timer Header */}
            <div className="p-3 sm:p-4 border-b border-white/5 flex justify-between items-center bg-blue-950/20">
              <div className="min-w-0">
                <span className="text-[8px] sm:text-[10px] text-blue-400 font-bold block uppercase tracking-widest">Active Turn</span>
                <div className="text-sm sm:text-xl font-black truncate">{gameData.characters[gameData.turnIndex].role}</div>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <div className={`flex flex-col items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 ${timeLeft <= 10 ? 'border-red-500 text-red-500 animate-pulse bg-red-900/20' : 'border-blue-500/50 text-blue-400 bg-blue-950/50'}`}>
                  <span className="text-sm sm:text-lg font-black leading-none">{timeLeft}</span>
                  <span className="text-[6px] sm:text-[8px] uppercase tracking-widest font-bold">Sec</span>
                </div>
                <div className="bg-slate-950/80 px-2 sm:px-4 py-1 rounded-xl sm:rounded-2xl border border-white/5 text-center">
                  <span className="text-[8px] sm:text-[10px] font-bold opacity-50 block uppercase">AP</span>
                  <span className="text-sm sm:text-xl font-black text-blue-400">{gameData.characters[gameData.turnIndex].time}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-3 sm:p-4 flex flex-col gap-3 sm:gap-4 flex-1 overflow-y-auto">
              {/* Wait indicator (Non-blur) */}
              {!myTurn && (
                <div className="bg-blue-600/10 border border-blue-500/20 p-2 rounded-xl text-center flex items-center justify-center gap-2">
                  <Loader className="w-3 h-3 text-blue-400 animate-spin"/>
                  <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">Waiting for player...</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setMoveMode(!moveMode)} 
                  disabled={!myTurn || (gameData.characters[gameData.turnIndex].time < 1 && !(gameData.characters[gameData.turnIndex].role === 'Student' && gameData.studentFreeMove))} 
                  className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-bold flex flex-col items-center gap-1 transition-all ${moveMode ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 border border-white/5 hover:bg-slate-700 disabled:opacity-40'}`}
                >
                  <Map className="w-4 h-4"/>MOVE
                </button>
                <button 
                  onClick={handleWork} 
                  disabled={!myTurn || gameData.characters[gameData.turnIndex].time < 1} 
                  className="p-2 sm:p-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-white/5 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-bold flex flex-col items-center gap-1 transition-all"
                >
                  <Hammer className="w-4 h-4 text-emerald-400"/>WORK
                </button>
                <button 
                  onClick={handleRest} 
                  disabled={!myTurn || gameData.characters[gameData.turnIndex].time < 1} 
                  className="p-2 sm:p-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-white/5 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-bold flex flex-col items-center gap-1 transition-all"
                >
                  <Coffee className="w-4 h-4 text-pink-400"/>REST
                </button>
                <button 
                  onClick={handleFix} 
                  disabled={!myTurn || gameData.characters[gameData.turnIndex].time < 1 || gameData.zones[gameData.characters[gameData.turnIndex].location].length === 0} 
                  className="p-2 sm:p-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-white/5 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-bold flex flex-col items-center gap-1 transition-all"
                >
                  <Wrench className="w-4 h-4 text-orange-400"/>FIX
                </button>
              </div>

              {/* Policies Area */}
              <div className="mt-1 pt-2 border-t border-white/10 flex-1">
                <span className="text-[8px] sm:text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2 block">Available Policies</span>
                {gameData.characters[gameData.turnIndex].location !== 'City Hall' ? (
                  <div className="text-center p-3 sm:p-4 border border-dashed border-white/10 rounded-xl sm:rounded-2xl text-slate-500 text-[10px] uppercase font-bold">Go to City Hall to pass policies</div>
                ) : (
                  <div className="space-y-1.5 sm:space-y-2">
                    {POLICIES.map(p => (
                      <button 
                        key={p.id} 
                        onClick={() => handlePassPolicy(p)} 
                        disabled={!myTurn || gameData.policies[p.id] || gameData.characters[gameData.turnIndex].time < p.costTime || gameData.characters[gameData.turnIndex].money < p.costMoney} 
                        className={`w-full flex justify-between items-center p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border transition-all ${gameData.policies[p.id] ? 'bg-emerald-900/20 border-emerald-500/50 text-emerald-400' : 'bg-purple-900/30 border-purple-500/50 hover:bg-purple-900/50 disabled:opacity-40'}`}
                      >
                        <span className="text-[10px] sm:text-xs font-bold">{p.name}</span>
                        {gameData.policies[p.id] ? <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4"/> : <div className="text-[8px] sm:text-[10px] font-black"><span className="text-emerald-400">${p.costMoney}</span> <span className="text-blue-400">{p.costTime}AP</span></div>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* End Turn Button */}
              <button 
                onClick={handleEndTurn} 
                disabled={!myTurn} 
                className="mt-auto w-full py-3 sm:py-4 bg-gradient-to-r from-slate-800 to-slate-700 disabled:opacity-40 text-white text-[11px] sm:text-sm font-black rounded-xl sm:rounded-2xl border border-white/10 transition-all uppercase flex justify-center items-center gap-2 group shadow-lg"
              >
                END TURN <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform"/>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Game End Overlay */}
      {gameData.gameState !== 'PLAYING' && gameData.gameState !== 'LOBBY' && (
        <div className="fixed inset-0 bg-slate-950/90 z-[60] flex items-center justify-center p-6 backdrop-blur-xl">
          <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] sm:rounded-[3rem] max-w-md w-full p-8 sm:p-10 text-center shadow-2xl relative overflow-hidden">
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-[100px] opacity-30 ${gameData.gameState === 'WON' ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <div className="relative z-10">
              {gameData.gameState === 'WON' ? <><CheckCircle className="w-16 h-16 sm:w-20 sm:h-20 text-emerald-400 mx-auto mb-6"/><h2 className="text-2xl sm:text-4xl font-black text-white mb-2 uppercase tracking-tighter">City Secured</h2></> : <><AlertTriangle className="w-16 h-16 sm:w-20 sm:h-20 text-red-500 mx-auto mb-6"/><h2 className="text-2xl sm:text-4xl font-black text-white mb-2 uppercase tracking-tighter">System Collapse</h2></>}
              <p className="text-slate-400 mb-8 text-xs sm:text-sm">{gameData.gameState === 'WON' ? "Your policies restored the city's balance." : "The city fell into chaos or your team burned out."}</p>
              <button onClick={() => setAppStatus('MENU')} className="w-full py-4 sm:py-5 rounded-2xl font-black text-white bg-blue-600 hover:bg-blue-500 shadow-xl transition-all uppercase tracking-widest text-sm sm:text-base">Main Menu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}