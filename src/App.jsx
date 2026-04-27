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

import polLogo from './assets/pol-logo.png';

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
  { name: 'Industrial', col: 'col-span-2', row: 'row-span-1', gradient: 'from-slate-800/40 to-gray-800/20', border: 'border-slate-500/30', text: 'text-slate-400' }
];

const CRISIS_TYPES = [
  { type: 'PM 2.5', effect: 'Drain Mental Health', iconName: 'Wind', color: 'text-gray-400' },
  { type: 'Traffic Jam', effect: 'Drain Time', iconName: 'Car', color: 'text-orange-400' },
  { type: 'High Cost', effect: 'Drain Money', iconName: 'TrendingUp', color: 'text-red-400' }
];

const CRISIS_ICONS = {
  Wind,
  Car,
  TrendingUp
};

const POLICIES = [
  { id: 'cleanAir', name: 'กฎหมายอากาศสะอาด', costMoney: 8, costTime: 2 },
  { id: 'publicTransport', name: 'กองทุนขนส่งสาธารณะ', costMoney: 8, costTime: 2 },
  { id: 'safeWalkways', name: 'ทางเดินและทางม้าลายปลอดภัย', costMoney: 8, costTime: 2 }
];

const INITIAL_CHARS = [
  { id: 0, role: 'Student', iconName: 'GraduationCap', color: 'text-blue-400', bg: 'bg-blue-900/30', money: 2, maxMoney: 15, time: 5, maxTime: 5, mh: 10, maxMh: 10, location: 'University', perk: '1st move is free' },
  { id: 1, role: 'Salaryman', iconName: 'Briefcase', color: 'text-gray-300', bg: 'bg-gray-700/50', money: 8, maxMoney: 15, time: 3, maxTime: 5, mh: 6, maxMh: 10, location: 'CBD', perk: '+1 Money per turn' },
  { id: 2, role: 'Freelancer', iconName: 'Laptop', color: 'text-purple-400', bg: 'bg-purple-900/30', money: 4, maxMoney: 15, time: 4, maxTime: 5, mh: 8, maxMh: 10, location: 'Residential', perk: 'Earns +3 Money when working' },
  { id: 3, role: 'Merchant', iconName: 'Store', color: 'text-green-400', bg: 'bg-green-900/30', money: 6, maxMoney: 15, time: 3, maxTime: 5, mh: 9, maxMh: 10, location: 'Industrial', perk: 'Rest heals all in zone' },
];

const ICONS = { GraduationCap, Briefcase, Laptop, Store };
const ROLE_LABELS = {
  Student: 'นักศึกษา',
  Salaryman: 'พนักงานออฟฟิศ',
  Freelancer: 'ฟรีแลนซ์',
  Merchant: 'พ่อค้าแม่ค้า'
};

const ZONE_LABELS = {
  Residential: 'ย่านที่พักอาศัย',
  CBD: 'ย่านธุรกิจ',
  'City Hall': 'ศาลาว่าการเมือง',
  University: 'มหาวิทยาลัย',
  Industrial: 'เขตอุตสาหกรรม'
};

const CRISIS_LABELS = {
  'PM 2.5': 'ฝุ่น PM 2.5',
  'Traffic Jam': 'รถติด',
  'High Cost': 'ค่าครองชีพสูง'
};

const POLICY_LABELS = {
  cleanAir: 'กฎหมายอากาศสะอาด',
  publicTransport: 'กองทุนขนส่งสาธารณะ',
  safeWalkways: 'ทางเดินและทางม้าลายปลอดภัย'
};

const getRoleLabel = (role) => ROLE_LABELS[role] || role;
const getZoneLabel = (zone) => ZONE_LABELS[zone] || zone;
const getCrisisLabel = (type) => CRISIS_LABELS[type] || type;

// เปิดปุ่มทดสอบชนะ/แพ้ชั่วคราว ถ้าจะส่งงานจริงให้เปลี่ยนเป็น false
const SHOW_DEBUG_BUTTONS = true;

const createDebugGameData = (gameState, userId = 'debug') => ({
  host: userId,
  gameState,
  panic: gameState === 'LOST' ? 100 : 0,
  policies: {
    cleanAir: gameState === 'WON',
    publicTransport: gameState === 'WON',
    safeWalkways: gameState === 'WON'
  },
  characters: INITIAL_CHARS,
  turnIndex: 0,
  turnCount: 1,
  logs: [],
  studentFreeMove: true,
  zones: {
    Residential: [],
    CBD: [],
    'City Hall': [],
    University: [],
    Industrial: []
  },
  players: {}
});

// --- ปรับให้สุ่มเฉพาะตัวเลข 4 หลัก ---
const generateLobbyCode = () => Math.floor(1000 + Math.random() * 9000).toString();

// --- Component กติกาการเล่น ---
const InstructionsPanel = () => (
  <div className="bg-slate-900/80 backdrop-blur-md border border-blue-500/20 p-5 sm:p-6 rounded-[2rem] text-left shadow-xl w-full">
    <h3 className="text-blue-400 font-black mb-4 flex items-center gap-2 tracking-widest text-sm sm:text-base">
      <Info className="w-5 h-5"/> 📖 กติกาการเล่น
    </h3>

    <ol className="list-decimal pl-5 space-y-3 text-slate-300 text-[11px] sm:text-sm leading-relaxed">
      <li>
        ผลัดกันเล่นคนละเทิร์น มีเวลาตัดสินใจเทิร์นละ{" "}
        <span className="text-white font-bold">30 วินาที</span>
      </li>

      <li>
        บริหาร <span className="text-blue-400 font-bold">แต้ม AP</span> ให้ดี
        เพื่อใช้เดิน พักผ่อน หรือซ่อมแซมสิ่งต่าง ๆ
      </li>

      <li>
        <span className="text-red-400 font-bold">ระวังจุดวิกฤต!</span>{" "}
        มันจะสุ่มเกิดเรื่อย ๆ ถ้าปล่อยให้สะสมจุดเดิมครบ 3 อันเมื่อไหร่
        ค่า Panic ของเมืองจะพุ่งขึ้นทีละ 20%
      </li>

      <li>
        <span className="text-emerald-400 font-bold">🟢 วิธีชนะ:</span>{" "}
        ไปที่ศาลาว่าการเมือง แล้วผลักดันนโยบายให้สำเร็จ 3 อย่าง
      </li>

      <li>
        <span className="text-red-500 font-bold">🔴 แพ้เมื่อ:</span>{" "}
        ค่า Panic ของเมืองทะลุ 100% หรือมีคนค่า MH (Mental Health) หมด
      </li>
    </ol>
  </div>
);


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
  const [showInstructions, setShowInstructions] = useState(false);
  const logsEndRef = useRef(null);
  
  const [timeLeft, setTimeLeft] = useState(30);
  const isEndingTurn = useRef(false);

  const [isCopied, setIsCopied] = useState(false);
  const handleCopyCode = () => {
    navigator.clipboard.writeText(lobbyCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getClaimedCharacterIds = (players = {}) => {
  return Object.keys(players)
    .filter((charId) => players[charId])
    .map((charId) => Number(charId))
    .sort((a, b) => a - b);
};

const getNextPlayableTurnIndex = (currentIndex, players = {}) => {
  const claimedIds = getClaimedCharacterIds(players);

  // ถ้าไม่มีใครเลือกตัวละครเลย ให้ fallback เป็นตัวถัดไปตามปกติ
  if (claimedIds.length === 0) {
    return (currentIndex + 1) % 4;
  }

  // หาตัวละครตัวถัดไปที่มีเจ้าของ
  for (let step = 1; step <= 4; step++) {
    const candidateIndex = (currentIndex + step) % 4;

    if (players[candidateIndex]) {
      return candidateIndex;
    }
  }

  // fallback กันพัง
  return claimedIds[0];
};

const isMyTurn = () => {
  if (!gameData || !user) return false;

  const activeCharOwner = gameData.players[gameData.turnIndex];

  return activeCharOwner === user.uid;
};

  const handleEndTurn = async (force = false) => {
  if (isEndingTurn.current) return;
  if (!force && !isMyTurn()) return;
  if (!gameData) return;

  isEndingTurn.current = true;

  const currentIndex = gameData.turnIndex;
const nextIndex = getNextPlayableTurnIndex(currentIndex, gameData.players);

// ถ้าข้ามวนกลับไปตัวละครเลขน้อยกว่า แปลว่าเริ่มรอบใหม่
const isNewRound = nextIndex <= currentIndex;
const newTurnCount = isNewRound ? gameData.turnCount + 1 : gameData.turnCount;

  let nextChar = { ...gameData.characters[nextIndex] };
  let newChars = [...gameData.characters];
  let newZones = { ...gameData.zones };
  let newPanic = gameData.panic;
  let newLogs = [...gameData.logs];
  let newStudentFreeMove = gameData.studentFreeMove;

  const addLog = (msg, type = 'normal') => {
    newLogs.push({ id: Date.now() + Math.random(), msg, type });
  };

  nextChar.time = nextChar.maxTime;

  if (nextChar.role === 'Student') {
    newStudentFreeMove = true;
  }

  if (nextChar.role === 'Salaryman') {
    nextChar.money = Math.min(nextChar.maxMoney, nextChar.money + 1);
    addLog("พนักงานออฟฟิศได้รับรายได้ประจำ +1 เงิน", 'good');
  }

  const crisisZones = ['Residential', 'CBD', 'University', 'Industrial'];
  const targetZone = crisisZones[Math.floor(Math.random() * crisisZones.length)];
  const crisisTemplate = CRISIS_TYPES[Math.floor(Math.random() * CRISIS_TYPES.length)];

  const newCrisis = {
    type: crisisTemplate.type,
    effect: crisisTemplate.effect,
    iconName: crisisTemplate.iconName,
    color: crisisTemplate.color
  };

  newZones[targetZone] = [...newZones[targetZone], newCrisis];
  addLog(`แจ้งเตือน: ${getCrisisLabel(newCrisis.type)} เกิดขึ้นที่ ${getZoneLabel(targetZone)}`, 'crisis');

  if (newZones[targetZone].length > 3) {
    newZones[targetZone] = [];
    newPanic = Math.min(100, newPanic + 20);
    addLog(`วิกฤตลุกลามที่ ${getZoneLabel(targetZone)}! ค่าความตื่นตระหนกของเมือง +20%`, 'critical');
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

  if (newPanic >= 100 || newChars.some(c => c.mh <= 0)) {
    finalState = 'LOST';
  } else if (Object.values(gameData.policies).every(Boolean)) {
    finalState = 'WON';
  }

  try {
    await syncState({
      turnIndex: nextIndex,
      turnCount: newTurnCount,
      characters: newChars,
      zones: newZones,
      panic: newPanic,
      logs: newLogs,
      studentFreeMove: newStudentFreeMove,
      gameState: finalState,
      turnEndTime: Date.now() + 30 * 1000
    });

    setMoveMode(false);
  } finally {
    setTimeout(() => {
      isEndingTurn.current = false;
    }, 1000);
  }
};

  //useEffect(() => {
  //  logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  //}, [gameData?.logs]);

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
    }, 1000);

    return () => clearInterval(interval);
  }, [appStatus, gameData?.turnEndTime]);

  useEffect(() => {
  if (appStatus !== 'PLAYING') return;
  if (timeLeft !== 0) return;
  if (!gameData || !user) return;
  if (gameData.gameState !== 'PLAYING') return;

  const activeCharOwner = gameData.players[gameData.turnIndex];
  const isMe = activeCharOwner === user.uid;

  if (isMe) {
    handleEndTurn();
  }
}, [timeLeft, appStatus, gameData, user]);

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
    const lobbyRef = doc(db, 'artifacts', globalAppId, 'public', 'data', 'lobbies', code);
    try {
      const docSnap = await getDoc(lobbyRef);
      if (docSnap.exists()) {
        setLobbyCode(code);
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

  try {
    await updateDoc(lobbyRef, updates);
  } catch (err) {
    console.error('SYNC STATE ERROR:', err);
    setErrorMsg(err.message);
  }
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
  if (!gameData) return;

  setIsLoading(true);

  const claimedIds = getClaimedCharacterIds(gameData.players);
  const firstTurnIndex = claimedIds[0] ?? 0;

  await syncState({
    gameState: 'PLAYING',
    turnIndex: firstTurnIndex,
    turnEndTime: Date.now() + 30 * 1000,
    logs: [
      ...gameData.logs,
      {
        id: Date.now(),
        msg: "=== ภารกิจเริ่มต้น! โปรดรักษาเมืองไว้ให้ได้ ===",
        type: "system"
      }
    ]
  });

  setIsLoading(false);
};

  const handleZoneClick = (zoneName) => {
    if (!moveMode || !isMyTurn()) return;
    const char = gameData.characters[gameData.turnIndex];
    if (char.location === zoneName) { setMoveMode(false); return; }
    const cost = (char.role === 'Student' && gameData.studentFreeMove) ? 0 : 1;
    if (char.time < cost) return;
    let newChars = [...gameData.characters];
    newChars[gameData.turnIndex] = { ...char, time: char.time - cost, location: zoneName };
    syncState({ characters: newChars, studentFreeMove: cost === 0 ? false : gameData.studentFreeMove, logs: [...gameData.logs, { id: Date.now(), msg: `${getRoleLabel(char.role)} เดินทางไปที่ ${getZoneLabel(zoneName)}`, type: 'normal' }] });
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
    syncState({ characters: newChars, logs: [...gameData.logs, { id: Date.now(), msg: `${getRoleLabel(char.role)} ทำงานที่${getZoneLabel(char.location)}: ได้เงิน +${moneyGain}, สุขภาพจิต -${mhLoss}`, type: 'normal' }] });
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
    syncState({ characters: newChars, logs: [...gameData.logs, { id: Date.now(), msg: `${getRoleLabel(char.role)} พักผ่อน: สุขภาพจิต +${baseHeal}`, type: 'good' }] });
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
    syncState({ zones: { ...gameData.zones, [char.location]: zoneCrises }, characters: newChars, logs: [...gameData.logs, { id: Date.now(), msg: `${getRoleLabel(char.role)} ช่วยแก้ปัญหาในพื้นที่สำเร็จ`, type: 'good' }] });
  };

  const handlePassPolicy = (policy) => {
    if (!isMyTurn()) return;
    const activeChar = gameData.characters[gameData.turnIndex];
    if (activeChar.location !== 'City Hall' || activeChar.time < policy.costTime || activeChar.money < policy.costMoney) return;
    let newChars = [...gameData.characters];
    newChars[gameData.turnIndex] = { ...activeChar, time: activeChar.time - policy.costTime, money: activeChar.money - policy.costMoney };
    const newPolicies = { ...gameData.policies, [policy.id]: true };
    syncState({ characters: newChars, policies: newPolicies, logs: [...gameData.logs, { id: Date.now(), msg: `สำเร็จ: ผ่านนโยบาย "${policy.name}" แล้ว`, type: 'critical' }] });
  };

  const myTurn = isMyTurn();

  const handleBackToMenu = () => {
  setIsLoading(true);

  setTimeout(() => {
    setMoveMode(false);
    setGameData(null);
    setLobbyCode('');
    setJoinCode('');
    setErrorMsg('');
    setTimeLeft(30);
    setAppStatus('MENU');
    setIsLoading(false);
  }, 700);
};

const handleLeaveLobby = () => {
  setIsLoading(true);

  setTimeout(() => {
    setMoveMode(false);
    setGameData(null);
    setLobbyCode('');
    setJoinCode('');
    setErrorMsg('');
    setTimeLeft(30);
    setAppStatus('MENU');
    setIsLoading(false);
  }, 700);
};

  const renderLoading = () => (
  <div className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center transition-all duration-300">
    <Loader className="w-16 h-16 text-blue-500 animate-spin mb-4" />
    <div className="text-blue-400 font-bold tracking-widest animate-pulse">
      กำลังโหลดข้อมูลเมือง...
    </div>
  </div>
);

  const getProgressColor = (val, max, inverse = false) => {
    const pct = val / max;
    if (inverse) return pct > 0.7 ? 'bg-red-500' : pct > 0.4 ? 'bg-yellow-500' : 'bg-green-500';
    return pct > 0.7 ? 'bg-green-500' : pct > 0.3 ? 'bg-yellow-500' : 'bg-red-500';
  };

  const renderContent = () => {
    if (appStatus === 'MENU') {
      return (
        <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center text-slate-200 p-6 relative overflow-hidden overflow-y-auto custom-scrollbar">
          <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
          <div className="max-w-xl text-center space-y-6 relative z-10 w-full my-auto">
            <div className="flex flex-col items-center">
  <img
    src={polLogo}
    alt="POL EVERYDAY logo"
    className="w-[350px] sm:w-[460px] md:w-[470px] h-auto mb-4 drop-shadow-[0_0_20px_rgba(59,130,246,0.18)]"
  />
  <p className="mt-2 text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-[0.18em]">
  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-red-500 drop-shadow-[0_0_12px_rgba(249,115,22,0.25)]">
    Daily Crisis
  </span>
</p>
</div>
            
            <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 p-6 rounded-[2.5rem] flex flex-col gap-4 shadow-2xl">
              <button onClick={createLobby} disabled={!user} className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"><Users className="w-5 h-5"/> สร้างห้องใหม่</button>
              <div className="flex items-center gap-4 text-slate-500"><hr className="flex-1 border-white/10" /><span>หรือ</span><hr className="flex-1 border-white/10" /></div>
              <div className="flex gap-3">
            <input 
              type="text" 
              maxLength={4} 
              value={joinCode} 
              onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, ''))} 
              placeholder="รหัส 4 หลัก" 
              className="w-[45%] bg-slate-950 border border-white/10 rounded-2xl px-2 sm:px-4 text-center font-mono text-white focus:border-blue-500 text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/50" 
            />
            <button 
              onClick={() => joinLobby(joinCode)} 
              disabled={!user || joinCode.length !== 4} 
              className="w-[55%] py-3 sm:py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl border border-white/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogIn className="w-5 h-5"/> เข้าร่วม
            </button>
          </div>
              {errorMsg && <div className="text-red-400 text-sm font-bold animate-pulse">{errorMsg}</div>}
            </div>

            <InstructionsPanel />

            {authError && <div className="text-xs text-red-400 bg-red-900/20 p-3 rounded-xl border border-red-500/30">⚠️ Auth Error: {authError}</div>}
          </div>
        </div>
      );
    }

    if (appStatus === 'LOBBY' && gameData) {
      const uniquePlayers = new Set(Object.values(gameData.players).filter(Boolean)).size;
      const canStart = uniquePlayers >= 2;
      return (
        <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center text-slate-200 p-4 sm:p-6 relative overflow-hidden">
          <div className="max-w-2xl w-full bg-slate-900/80 backdrop-blur-xl border border-white/10 p-5 sm:p-8 rounded-3xl sm:rounded-[2.5rem] shadow-2xl relative z-10 overflow-y-auto max-h-full custom-scrollbar">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6 sm:mb-8 border-b border-white/10 pb-5 sm:pb-6">
              <div>
  <button
    onClick={handleLeaveLobby}
    className="mb-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-[11px] font-bold text-slate-300 transition-all hover:bg-slate-800 hover:text-white"
  >
    ← กลับหน้าแรก
  </button>

  <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
    ห้องเตรียมตัว 
    <span className="text-xs sm:text-sm font-bold bg-blue-900/50 text-blue-300 px-3 py-1 rounded-full">
      {uniquePlayers}/4
    </span>
  </h2>

  <div className="text-slate-400 text-xs sm:text-sm mt-1">
    เลือกบทบาท (ต้องการอย่างน้อย 2 คน)
  </div>
</div>
              <div className="w-full sm:w-auto bg-slate-950 border border-blue-500/30 px-4 py-2 sm:px-5 rounded-2xl flex flex-row sm:flex-col justify-between sm:justify-center items-center">
                <div className="text-[10px] text-blue-400 uppercase font-bold tracking-widest">รหัสห้อง</div>
                <div className="text-xl sm:text-2xl font-mono font-black text-white flex items-center gap-2 tracking-widest">
                  {lobbyCode}
                  <button 
                    onClick={handleCopyCode} 
                    className="p-1 hover:bg-white/10 rounded flex items-center gap-1.5 transition-all w-[70px] justify-center">
                  {isCopied ? (
                   <>
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                   <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest animate-in fade-in zoom-in duration-200">Copied</span>
                  </>
                  ) : (
                  <Copy className="w-4 h-4 text-slate-400 hover:text-white transition-colors" />
                 )}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
              {gameData.characters.map((c) => {
                const Icon = ICONS[c.iconName]; const isMe = gameData.players[c.id] === user.uid; const isOther = gameData.players[c.id] && !isMe;
                return (
                  <button key={c.id} onClick={() => claimCharacter(c.id)} disabled={isOther} className={`p-3 sm:p-4 rounded-2xl border text-left transition-all flex items-center gap-3 sm:gap-4 ${isMe ? 'bg-blue-600/20 border-blue-500 ring-1 ring-blue-500' : isOther ? 'bg-slate-950 border-white/5 opacity-50 cursor-not-allowed' : 'bg-slate-800/50 border-white/10 hover:border-white/30'}`}>
                    <div className={`p-2 sm:p-3 rounded-xl min-w-[40px] flex justify-center ${c.bg}`}><Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${c.color}`} /></div>
                    <div className="min-w-0 flex-1"><div className="font-bold text-white text-sm sm:text-base truncate">{getRoleLabel(c.role)}</div><div className="text-[9px] sm:text-[10px] text-slate-400 uppercase truncate">{isMe ? "คุณเลือกแล้ว" : isOther ? "มีคนเลือกแล้ว" : "ยังไม่มีตัวแทน"}</div></div>
                  </button>
                )
              })}
            </div>

            <div className="mb-6">
               <InstructionsPanel />
            </div>

            {gameData.host === user.uid ? (
              <button onClick={startGamePlay} disabled={!canStart} className={`w-full py-4 sm:py-5 rounded-2xl text-lg sm:text-xl font-black transition-all flex justify-center items-center gap-2 ${canStart ? 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.3)] text-white hover:scale-[1.02]' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}>{canStart ? <><Play className="w-5 h-5 sm:w-6 sm:h-6"/> เริ่มภารกิจ</> : `รอผู้เล่นอีก ${2 - uniquePlayers} คน...`}</button>
            ) : <div className="text-center p-3 sm:p-4 bg-slate-800/30 rounded-2xl text-slate-400 animate-pulse border border-white/5 text-sm sm:text-base">รอหัวหน้าห้องเริ่มเกม...</div>}
          </div>
        </div>
      );
    }

    if (!gameData) return null;

    if (gameData.gameState !== 'PLAYING' && gameData.gameState !== 'LOBBY') {
      return (
        <div className="fixed inset-0 bg-slate-950/90 z-[60] flex items-center justify-center p-5 backdrop-blur-xl">
          <div className="relative w-full max-w-[500px] overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/95 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
            <div
              className={`absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full blur-[120px] opacity-20 ${
                gameData.gameState === 'WON' ? 'bg-emerald-500' : 'bg-red-500'
              }`}
            />

            <div className="relative z-10 px-7 py-10 sm:px-10 sm:py-12 text-center">
              <div className="mb-6 flex justify-center">
                <div
                  className={`flex h-24 w-24 items-center justify-center rounded-full border ${
                    gameData.gameState === 'WON'
                      ? 'border-emerald-400/20 bg-emerald-500/10'
                      : 'border-red-400/20 bg-red-500/10'
                  }`}
                >
                  {gameData.gameState === 'WON' ? (
                    <CheckCircle className="w-14 h-14 text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.35)]" />
                  ) : (
                    <AlertTriangle className="w-14 h-14 text-red-400 drop-shadow-[0_0_20px_rgba(239,68,68,0.35)]" />
                  )}
                </div>
              </div>

              {gameData.gameState === 'WON' ? (
                <>
                  <h2 className="mx-auto text-[1.65rem] sm:text-[2.1rem] font-black text-white leading-tight tracking-tight whitespace-nowrap">
                    ก้าวแรกสู่การเปลี่ยนแปลง
                  </h2>

                  <p className="mx-auto mt-5 max-w-[390px] text-[13px] sm:text-sm leading-7 text-slate-300">
                    <span className="block">เสียงของคุณทำให้นโยบายนี้เกิดขึ้นจริง แม้หนทางยังอีกไกล</span>
                    <span className="block">แต่นี่คือจุดเริ่มต้นของเมืองที่ยุติธรรมสำหรับทุกคน</span>
                  </p>
                </>
              ) : (
                <>
                  <h2 className="mx-auto text-[1.75rem] sm:text-[2.1rem] font-black text-white leading-tight tracking-tight whitespace-nowrap">
                    เมืองเข้าสู่วิกฤต
                  </h2>

                  <p className="mx-auto mt-5 max-w-[390px] text-[13px] sm:text-sm leading-7 text-slate-300">
                    <span className="block">เมืองรับมือกับวิกฤตไม่ไหว หรือมีใครบางคนหมดแรง</span>
                    <span className="block">เกมจบลงตรงนี้ แต่ปัญหาในชีวิตจริงยังรอการแก้ไข</span>
                  </p>
                </>
              )}

              <div className="mt-8">
                <button
  onClick={handleBackToMenu}
  className="w-full rounded-2xl bg-blue-600 py-4 text-sm font-black tracking-widest text-white transition-all hover:scale-[1.02] hover:bg-blue-500 shadow-[0_0_24px_rgba(59,130,246,0.25)]"
>
  กลับหน้าแรก
</button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 flex flex-col bg-slate-950 text-slate-200 font-sans overflow-hidden">
        <>
  {/* Mobile Header */}
  <header className="sm:hidden bg-slate-900/90 backdrop-blur-lg border-b border-white/5 px-4 py-3 z-50 shrink-0">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <img
          src={polLogo}
          alt="POL EVERYDAY logo"
          className="h-9 w-auto object-contain"
        />

        <span className="inline-flex items-center h-7 px-2.5 rounded-lg bg-blue-900/35 border border-blue-400/15 text-[11px] font-mono font-bold text-blue-300 shrink-0">
          #{lobbyCode}
        </span>
      </div>

      <button
        onClick={() => setShowInstructions(!showInstructions)}
        className={`p-2 rounded-xl border border-white/10 transition-colors ${
          showInstructions ? 'bg-blue-600/30' : 'bg-slate-950/70'
        }`}
      >
        <Info className={`w-5 h-5 ${showInstructions ? 'text-blue-300' : 'text-slate-400'}`} />
      </button>
    </div>

    <div className="mt-3 grid grid-cols-2 gap-3">
      <div className="rounded-2xl bg-slate-950/70 border border-white/10 px-3 py-2">
        <div className="flex items-center justify-between text-[10px] font-black tracking-widest">
          <span className="text-red-400 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            CITY PANIC
          </span>
          <span className="text-white">{gameData.panic}%</span>
        </div>

        <div className="mt-2 h-2 bg-slate-900 rounded-full border border-white/10 overflow-hidden">
          <div
            className={`h-full transition-all duration-700 ${getProgressColor(gameData.panic, 100, true)}`}
            style={{ width: `${gameData.panic}%` }}
          />
        </div>
      </div>

      <div className="rounded-2xl bg-slate-950/70 border border-white/10 px-3 py-2 flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-400 tracking-wider">
          นโยบาย
        </span>

        <div className="flex gap-1.5">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full ${
                i <= Object.values(gameData.policies).filter(Boolean).length
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                  : 'bg-slate-800'
              }`}
            />
          ))}
        </div>
      </div>
    </div>

    {showInstructions && (
      <div className="absolute top-[104px] left-4 right-4 z-[999] bg-slate-900/95 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
        <button
          onClick={() => setShowInstructions(false)}
          className="absolute top-3 right-3 text-slate-500 hover:text-white text-xs font-bold"
        >
          ✕
        </button>

        <h3 className="text-blue-400 font-black text-xs mb-2 border-b border-white/10 pb-2">
          📖 กติกาการเล่น
        </h3>

        <ol className="list-decimal pl-4 space-y-2 text-slate-300 text-[11px] leading-relaxed">
          <li>
            ผลัดกันเล่นคนละเทิร์น มีเวลาตัดสินใจเทิร์นละ{" "}
            <span className="text-white font-bold">30 วินาที</span>
          </li>

          <li>
            บริหาร <span className="text-blue-400 font-bold">แต้ม AP</span> ให้ดี
            เพื่อใช้เดิน พักผ่อน หรือซ่อมแซมสิ่งต่าง ๆ
          </li>

          <li>
            <span className="text-red-400 font-bold">ระวังจุดวิกฤต!</span>{" "}
            ถ้าสะสมจุดเดิมครบ 3 อัน ค่า Panic จะเพิ่ม 20%
          </li>

          <li>
            <span className="text-emerald-400 font-bold">🟢 วิธีชนะ:</span>{" "}
            ไปที่ศาลาว่าการเมือง แล้วผลักดันนโยบายให้สำเร็จ 3 อย่าง
          </li>

          <li>
            <span className="text-red-500 font-bold">🔴 แพ้เมื่อ:</span>{" "}
            Panic ทะลุ 100% หรือมีคนค่า MH หมด
          </li>
        </ol>
      </div>
    )}
  </header>

  {/* Desktop Header */}
  <header className="hidden sm:flex bg-slate-900/80 backdrop-blur-lg border-b border-white/5 h-16 px-4 items-center justify-between z-50 shrink-0">
    <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
      <img
        src={polLogo}
        alt="POL EVERYDAY logo"
        className="h-8 sm:h-9 md:h-10 w-auto object-contain drop-shadow-[0_0_8px_rgba(59,130,246,0.12)]"
      />

      <span className="inline-flex items-center h-6 px-2.5 rounded-lg bg-blue-900/30 border border-blue-400/15 text-[10px] sm:text-[11px] font-mono font-bold text-blue-300 tracking-wide shrink-0">
        #{lobbyCode}
      </span>
    </div>

    <div className="flex-1 max-w-md px-4">
      <div className="flex justify-between text-[10px] mb-1 font-bold uppercase tracking-wider">
        <span className="text-red-400 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> CITY PANIC
        </span>
        <span className="text-white">{gameData.panic}%</span>
      </div>

      <div className="h-3 bg-slate-950 rounded-full border border-white/10 overflow-hidden shadow-inner">
        <div
          className={`h-full transition-all duration-700 ${getProgressColor(gameData.panic, 100, true)}`}
          style={{ width: `${gameData.panic}%` }}
        />
      </div>
    </div>

    <div className="flex items-center gap-3 shrink-0">
      <div className="flex items-center gap-2 text-xs font-bold bg-slate-950/80 px-3 py-1.5 rounded-xl border border-white/10 shadow-lg">
        <span className="text-slate-400 tracking-widest">นโยบาย</span>

        <div className="flex gap-1.5">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full ${
                i <= Object.values(gameData.policies).filter(Boolean).length
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                  : 'bg-slate-800'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="relative flex items-center">
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className={`p-2 rounded-xl border border-white/10 transition-colors ${
            showInstructions ? 'bg-blue-600/30' : 'bg-slate-900/80 hover:bg-slate-800'
          }`}
        >
          <Info className={`w-5 h-5 transition-colors ${
            showInstructions ? 'text-blue-300' : 'text-slate-400'
          }`} />
        </button>

        <div className={`absolute top-full right-0 mt-3 w-[340px] bg-slate-900/95 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] transition-all duration-300 z-[999] ${
          showInstructions
            ? 'opacity-100 visible translate-y-0 pointer-events-auto'
            : 'opacity-0 invisible -translate-y-2 pointer-events-none'
        }`}>
          <button
            onClick={() => setShowInstructions(false)}
            className="absolute top-3 right-3 text-slate-500 hover:text-white text-xs font-bold"
          >
            ✕
          </button>

          <h3 className="text-blue-400 font-black text-xs sm:text-sm mb-2 border-b border-white/10 pb-2">
            📖 กติกาการเล่น
          </h3>

          <ol className="list-decimal pl-4 space-y-2 text-slate-300 text-xs leading-relaxed font-normal">
            <li>
              ผลัดกันเล่นคนละเทิร์น มีเวลาตัดสินใจเทิร์นละ{" "}
              <span className="text-white font-bold">30 วินาที</span>
            </li>

            <li>
              บริหาร <span className="text-blue-400 font-bold">แต้ม AP</span> ให้ดี
              เพื่อใช้เดิน พักผ่อน หรือซ่อมแซมสิ่งต่าง ๆ
            </li>

            <li>
              <span className="text-red-400 font-bold">ระวังจุดวิกฤต!</span>{" "}
              ถ้าสะสมจุดเดิมครบ 3 อัน ค่า Panic จะเพิ่ม 20%
            </li>

            <li>
              <span className="text-emerald-400 font-bold">🟢 วิธีชนะ:</span>{" "}
              ไปที่ศาลาว่าการเมือง แล้วผลักดันนโยบายให้สำเร็จ 3 อย่าง
            </li>

            <li>
              <span className="text-red-500 font-bold">🔴 แพ้เมื่อ:</span>{" "}
              Panic ทะลุ 100% หรือมีคนค่า MH หมด
            </li>
          </ol>
        </div>
      </div>
    </div>
  </header>
</>

        <main className="flex-1 overflow-y-auto custom-scrollbar flex justify-center p-3 sm:p-4 lg:p-6">
          <div className="w-full max-w-[1440px] flex flex-col lg:flex-row gap-4 lg:gap-6 h-max lg:h-full">
            <div className="flex-[1.8] xl:flex-[2.2] flex flex-col gap-4 lg:gap-6 min-h-0">
              <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-3 sm:p-5 shrink-0 shadow-2xl">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 auto-rows-[130px] sm:auto-rows-[160px] xl:auto-rows-[180px]">
                  {MAP_LAYOUT.map(zone => (
                    <div 
                      key={zone.name} 
                      onClick={() => handleZoneClick(zone.name)} 
                      className={`${zone.col} ${zone.row} flex flex-col relative bg-gradient-to-br ${zone.gradient} border ${zone.border} rounded-2xl p-3 transition-all duration-300 overflow-hidden
                      ${moveMode && myTurn && gameData.characters[gameData.turnIndex].location !== zone.name ? 'cursor-pointer hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.4)] border-blue-400 ring-2 ring-blue-400/30' : ''} 
                      ${gameData.characters[gameData.turnIndex].location === zone.name ? 'ring-2 ring-white/20 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className={`font-black uppercase text-[10px] sm:text-xs tracking-widest ${zone.text} truncate`}>{getZoneLabel(zone.name)}</h3>
                        {zone.isHub && <Landmark className="w-4 h-4 text-amber-400 drop-shadow-md"/>}
                      </div>
                      
                      <div className="flex flex-col gap-1 overflow-y-auto mb-auto pr-1 custom-scrollbar">
                        {gameData.zones[zone.name].map((c, i) => (
                          <div key={i} className="flex items-center gap-1.5 bg-slate-950/80 px-2 py-1 rounded-lg border border-red-500/30 w-fit backdrop-blur-sm">
                            <AlertTriangle className="w-2.5 h-2.5 text-red-400" />
                            <span className="text-[9px] sm:text-[10px] font-bold text-slate-200 tracking-wide">{getCrisisLabel(c.type)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-white/10">
                        {gameData.characters.filter(c => c.location === zone.name).map(c => {
                          const CIco = ICONS[c.iconName];
                          const isActive = gameData.turnIndex === c.id;
                          return (
                            <div key={c.id} className={`${c.bg} p-1.5 rounded-xl border relative shadow-md ${isActive ? 'border-white scale-110' : 'border-white/10 opacity-80'}`}>
                              <CIco className={`w-4 h-4 ${c.color}`} />
                              {isActive && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-400 rounded-full animate-ping"/>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900/60 border border-white/5 rounded-3xl flex flex-col overflow-hidden shadow-2xl flex-1 min-h-[200px] lg:min-h-0">
                <div className="bg-slate-950/80 p-3 border-b border-white/5 font-bold text-[10px] text-slate-400 px-5 uppercase tracking-widest flex items-center gap-2 shrink-0">
                  <Activity className="w-4 h-4 text-emerald-400"/> บันทึกเหตุการณ์
                </div>
                <div className="p-4 overflow-y-auto flex-1 space-y-2 text-[11px] sm:text-xs font-mono custom-scrollbar">
                  {gameData.logs.map(log => (
                    <div key={log.id} className={`flex gap-3 leading-relaxed ${log.type === 'crisis' ? 'text-red-400 bg-red-950/20 p-1.5 rounded' : log.type === 'critical' ? 'text-yellow-400 font-bold' : log.type === 'good' ? 'text-emerald-400' : log.type === 'system' ? 'text-cyan-400' : 'text-slate-300'}`}>
                      <span className="opacity-40 shrink-0">{'>'}</span><span className="break-words">{log.msg}</span>
                    </div>
                  ))}
                  <div ref={logsEndRef}/>
                </div>
              </div>
            </div>

            <div className="lg:w-[380px] xl:w-[420px] flex flex-col gap-4 lg:gap-6 shrink-0 h-max lg:h-full">
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
                {gameData.characters.map((c, i) => {
  const active = gameData.turnIndex === i;
  const CIco = ICONS[c.iconName];
  const owner = gameData.players[c.id];
  const isMine = owner === user.uid;
  const isUnclaimed = !owner;

  return (
    <div
      key={c.id}
      className={`relative p-3 sm:p-4 rounded-2xl border transition-all duration-300 ${
        isUnclaimed
          ? 'bg-slate-900/20 border-slate-700/40 opacity-55'
          : active
          ? 'bg-slate-800 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.15)] scale-[1.02]'
          : 'bg-slate-900/40 border-white/5 opacity-90 hover:opacity-100'
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`p-2 rounded-xl shadow-inner ${
            isUnclaimed ? 'bg-slate-800/80' : c.bg
          }`}
        >
          <CIco
            className={`w-5 h-5 ${
              isUnclaimed ? 'text-slate-500' : 'text-white'
            }`}
          />
        </div>

        <div className="min-w-0">
          <div
            className={`font-bold text-xs sm:text-sm truncate ${
              isUnclaimed ? 'text-slate-500' : 'text-white'
            }`}
          >
            {c.role}{' '}
            {isMine && !isUnclaimed && (
              <span className="text-blue-400 text-[10px] ml-1 uppercase">(You)</span>
            )}
          </div>

          <div
            className={`text-[9px] sm:text-[10px] uppercase tracking-widest truncate ${
              isUnclaimed ? 'text-slate-600' : 'text-blue-300/70'
            }`}
          >
            {isUnclaimed ? 'ยังไม่มีตัวแทน' : getZoneLabel(c.location)}
          </div>
        </div>
      </div>

      <div
        className={`grid grid-cols-3 gap-1 text-[10px] sm:text-xs font-mono font-bold p-2 rounded-xl ${
          isUnclaimed
            ? 'bg-slate-950/30 text-slate-600'
            : 'bg-slate-950/50 text-white'
        }`}
      >
        <div className="flex items-center gap-1.5 justify-center">
          <Heart className={`w-3 h-3 ${isUnclaimed ? 'text-slate-600' : 'text-pink-500'}`} />
          {c.mh}
        </div>

        <div className={`flex items-center gap-1.5 justify-center border-x ${isUnclaimed ? 'border-slate-800' : 'border-white/10'}`}>
          <Clock className={`w-3 h-3 ${isUnclaimed ? 'text-slate-600' : 'text-blue-500'}`} />
          {c.time}
        </div>

        <div className="flex items-center gap-1.5 justify-center">
          <DollarSign className={`w-3 h-3 ${isUnclaimed ? 'text-slate-600' : 'text-emerald-500'}`} />
          {c.money}
        </div>
      </div>

      {isUnclaimed && (
        <div className="mt-3 w-full py-2 text-center rounded-xl bg-slate-950/40 border border-slate-700/40 text-slate-500 text-[10px] font-black uppercase tracking-widest">
          ยังไม่มีตัวแทน
        </div>
      )}
    </div>
  );
})}
              </div>

              <div className="bg-slate-900/60 border border-white/5 rounded-[2rem] flex flex-col flex-1 shadow-2xl min-h-[450px] overflow-hidden">
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-blue-950/30 to-slate-900/30 shrink-0">
                  <div className="min-w-0">
                    <span className="text-[9px] text-blue-400 font-bold block uppercase tracking-widest mb-1">ตาของผู้เล่น</span>
                    <div className="text-xl sm:text-2xl font-black truncate text-white">{getRoleLabel(gameData.characters[gameData.turnIndex].role)}</div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-full border-2 transition-colors duration-300 ${timeLeft <= 10 ? 'border-red-500 text-red-400 animate-pulse bg-red-950/40 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'border-blue-500/50 text-blue-400 bg-blue-950/50'}`}>
                  <span className="text-lg font-black leading-none">{timeLeft}</span>
                  <span className="text-[7px] uppercase tracking-widest font-bold mt-0.5">Sec</span>
                </div>

                <div className="bg-slate-950/80 px-3 py-2 rounded-2xl border border-white/5 text-center shadow-inner">
                  <span className="text-[9px] font-bold opacity-50 block uppercase tracking-wider mb-0.5">AP</span>
                  <span className="text-xl font-black text-blue-400">{gameData.characters[gameData.turnIndex].time}</span>
                </div>

                {(() => {
                  const canForceEnd = !myTurn && timeLeft === 0;

                  return (
                    <button
                      onClick={() => handleEndTurn(canForceEnd)}
                      disabled={!myTurn && !canForceEnd}
                      className={`h-12 px-3 rounded-2xl text-[10px] font-black border transition-all uppercase tracking-wider flex items-center justify-center disabled:opacity-40
                        ${canForceEnd
                          ? 'bg-gradient-to-r from-red-800 to-orange-700 border-red-500/50 text-white animate-pulse'
                          : 'bg-blue-600/20 border-blue-500/30 text-blue-300 hover:bg-blue-600 hover:text-white'
                        }`}
                    >
                      {canForceEnd ? 'ข้าม' : 'จบเทิร์น'}
                    </button>
                  );
                })()}
              </div>
                </div>

                <div className="p-4 flex flex-col gap-4 flex-1 overflow-y-auto custom-scrollbar">
                  {!myTurn && (
                    <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded-2xl text-center flex items-center justify-center gap-2 shadow-inner">
                      <Loader className="w-4 h-4 text-blue-400 animate-spin"/>
                      <span className="text-xs font-bold text-blue-300 uppercase tracking-widest">รอผู้เล่นคนอื่น...</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setMoveMode(!moveMode)} 
                      disabled={!myTurn || (gameData.characters[gameData.turnIndex].time < 1 && !(gameData.characters[gameData.turnIndex].role === 'Student' && gameData.studentFreeMove))} 
                      className={`p-3 rounded-2xl text-[11px] font-black uppercase tracking-widest flex flex-col items-center gap-2 transition-all duration-300 ${moveMode ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] scale-105' : 'bg-slate-800 border border-white/5 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800'}`}
                    >
                      <Map className="w-5 h-5"/>เดินทาง
                    </button>
                    <button 
                      onClick={handleWork} 
                      disabled={!myTurn || gameData.characters[gameData.turnIndex].time < 1} 
                      className="p-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 border border-white/5 rounded-2xl text-[11px] font-black uppercase tracking-widest flex flex-col items-center gap-2 transition-all duration-300 hover:text-emerald-400"
                    >
                      <Hammer className="w-5 h-5 text-emerald-500"/>ทำงาน
                    </button>
                    <button 
                      onClick={handleRest} 
                      disabled={!myTurn || gameData.characters[gameData.turnIndex].time < 1} 
                      className="p-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 border border-white/5 rounded-2xl text-[11px] font-black uppercase tracking-widest flex flex-col items-center gap-2 transition-all duration-300 hover:text-pink-400"
                    >
                      <Coffee className="w-5 h-5 text-pink-500"/>พักผ่อน
                    </button>
                    <button 
                      onClick={handleFix} 
                      disabled={!myTurn || gameData.characters[gameData.turnIndex].time < 1 || gameData.zones[gameData.characters[gameData.turnIndex].location].length === 0} 
                      className="p-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 border border-white/5 rounded-2xl text-[11px] font-black uppercase tracking-widest flex flex-col items-center gap-2 transition-all duration-300 hover:text-orange-400"
                    >
                      <Wrench className="w-5 h-5 text-orange-500"/>แก้ปัญหา
                    </button>
                  </div>

                  <div className="mt-2 pt-4 border-t border-white/10 flex-1">
                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-3 block">นโยบายที่เสนอได้</span>
                    {gameData.characters[gameData.turnIndex].location !== 'City Hall' ? (
                      <div className="flex items-center justify-center h-24 border-2 border-dashed border-white/10 rounded-2xl bg-slate-900/30">
                        <span className="text-slate-500 text-[10px] uppercase font-bold tracking-widest px-4 text-center leading-relaxed">ต้องไปที่ศาลาว่าการเมือง<br/>เพื่อเสนอนโยบาย</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {POLICIES.map(p => (
                          <button 
                            key={p.id} 
                            onClick={() => handlePassPolicy(p)} 
                            disabled={!myTurn || gameData.policies[p.id] || gameData.characters[gameData.turnIndex].time < p.costTime || gameData.characters[gameData.turnIndex].money < p.costMoney} 
                            className={`w-full flex justify-between items-center p-3 sm:p-4 rounded-2xl border transition-all duration-300 ${gameData.policies[p.id] ? 'bg-emerald-900/20 border-emerald-500/50 text-emerald-400' : 'bg-purple-900/30 border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-900/50 disabled:opacity-40 disabled:hover:bg-purple-900/30'}`}
                          >
                            <span className="text-xs font-bold tracking-wide">{p.name}</span>
                            {gameData.policies[p.id] ? <CheckCircle className="w-4 h-4"/> : <div className="text-[10px] font-black bg-slate-950/80 px-2 py-1 rounded-lg"><span className="text-emerald-400">${p.costMoney}</span> <span className="text-blue-400 ml-1">{p.costTime}AP</span></div>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  };

  return (
  <>
    {isLoading && renderLoading()}
    {renderContent()}

    <div className="fixed bottom-2 left-4 text-[9px] sm:text-xs text-slate-500/50 font-mono z-[100] pointer-events-none">
      beta version 1.12
    </div>

    {/* DEBUG ONLY - ถ้าจะส่งงานจริงให้เปลี่ยน SHOW_DEBUG_BUTTONS เป็น false */}
    {SHOW_DEBUG_BUTTONS && (
      <div className="fixed bottom-20 right-4 z-[999] flex gap-2">
        <button
          onClick={() => {
            if (gameData && lobbyCode && appStatus === 'PLAYING') {
              syncState({ gameState: 'WON' });
            } else {
              setGameData(createDebugGameData('WON', user?.uid));
              setAppStatus('PLAYING');
            }
          }}
          className="rounded-xl bg-emerald-600 px-4 py-3 text-xs font-black text-white shadow-lg"
        >
          TEST WIN
        </button>

        <button
          onClick={() => {
            if (gameData && lobbyCode && appStatus === 'PLAYING') {
              syncState({ gameState: 'LOST' });
            } else {
              setGameData(createDebugGameData('LOST', user?.uid));
              setAppStatus('PLAYING');
            }
          }}
          className="rounded-xl bg-red-600 px-4 py-3 text-xs font-black text-white shadow-lg"
        >
          TEST LOSE
        </button>
      </div>
    )}
  </>
);
}