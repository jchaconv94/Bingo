
import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Participant, GameState, Winner, TOTAL_BALLS, NUMBERS_PER_CARD, BingoCard, PatternKey, Prize } from './types.ts';
import { generateBingoCardNumbers, generateId, checkWinners, WIN_PATTERNS } from './utils/helpers.ts';
import { exportToExcel, parseExcel, downloadCardImage, downloadAllCardsZip, generateBingoCardsPDF } from './services/exportService.ts';
import { SheetAPI } from './services/googleSheetService.ts';
import RegistrationPanel from './components/RegistrationPanel.tsx';
import GamePanel from './components/GamePanel.tsx';
import ParticipantsPanel from './components/ParticipantsPanel.tsx';
import WinnerModal from './components/WinnerModal.tsx';
import WinnerDetailsModal from './components/WinnerDetailsModal.tsx';
import PrizesPanel from './components/PrizesPanel.tsx';
import EditTitleModal from './components/EditTitleModal.tsx';
import ConnectionModal from './components/ConnectionModal.tsx';
import Login from './components/Login.tsx';
import { Maximize2, Minimize2, PanelLeftOpen, Edit, FileText, Image as ImageIcon, Cloud, RefreshCw, Loader2, Link, Zap, LogOut } from 'lucide-react';
import { useAlert, AlertAction } from './contexts/AlertContext.tsx';

// LocalStorage Keys
const LS_KEYS = {
  PARTICIPANTS: 'bingo_participants_v1',
  GAME_STATE: 'bingo_gamestate_v1',
  WINNERS: 'bingo_winners_v1',
  PRIZES: 'bingo_prizes_v1',
  TITLE: 'bingo_title_v1',
  SUBTITLE: 'bingo_subtitle_v1',
  SHEET_URL: 'bingo_sheet_url_v1',
  AUTO_SYNC: 'bingo_auto_sync_v1',
  SYNC_INTERVAL: 'bingo_sync_interval_v1'
};

// URL por defecto proporcionada por el usuario
const DEFAULT_SHEET_URL = "https://script.google.com/macros/s/AKfycbwdNFDlQ2Hq7bFKEO1KpzUk5NeOh847jPjGJVlHNqI9TiW1nqP6NxnrT9OmHH2N6HvBsw/exec";

const loadFromStorage = <T,>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error(`Error cargando ${key} de localStorage`, e);
    return fallback;
  }
};

const App: React.FC = () => {
  const { showAlert, showConfirm } = useAlert();

  // --- Auth State ---
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('bingo_auth') === 'true';
  });
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // --- Configuración de Nube ---
  const [sheetUrl, setSheetUrl] = useState<string>(() => {
    const saved = loadFromStorage(LS_KEYS.SHEET_URL, '');
    return saved || DEFAULT_SHEET_URL;
  });

  // Auto Sync Config
  const [autoSync, setAutoSync] = useState<boolean>(() => loadFromStorage(LS_KEYS.AUTO_SYNC, true));
  const [syncInterval, setSyncInterval] = useState<number>(() => loadFromStorage(LS_KEYS.SYNC_INTERVAL, 5000));

  const [isSyncing, setIsSyncing] = useState(false);
  const [showConnectionModal, setShowConnectionModal] = useState(false);

  // Ref para evitar solapamiento de peticiones en polling
  const isPollingRef = useRef(false);

  // --- State con Inicialización Perezosa ---
  const [participants, setParticipants] = useState<Participant[]>(() =>
    loadFromStorage(LS_KEYS.PARTICIPANTS, [])
  );

  const [gameState, setGameState] = useState<GameState>(() => {
    const defaults = {
      drawnBalls: [],
      history: [],
      lastCardSequence: 100,
      selectedPattern: 'NONE' as PatternKey,
      roundLocked: false,
      gameRound: 1,
      isPaused: false
    };
    const loaded = loadFromStorage(LS_KEYS.GAME_STATE, defaults);
    return { ...defaults, ...loaded, isPaused: loaded.isPaused || false };
  });

  const [winners, setWinners] = useState<Winner[]>(() =>
    loadFromStorage(LS_KEYS.WINNERS, [])
  );

  const [prizes, setPrizes] = useState<Prize[]>(() =>
    loadFromStorage(LS_KEYS.PRIZES, [])
  );

  const [bingoTitle, setBingoTitle] = useState<string>(() =>
    loadFromStorage(LS_KEYS.TITLE, "VIRTUAL BINGO PRO")
  );

  const [bingoSubtitle, setBingoSubtitle] = useState<string>(() =>
    loadFromStorage(LS_KEYS.SUBTITLE, "Aplicación web de bingo virtual")
  );

  const [showTitleModal, setShowTitleModal] = useState(false);
  const [currentBatchWinners, setCurrentBatchWinners] = useState<Winner[]>([]);
  const [viewingDetailsData, setViewingDetailsData] = useState<{
    winner: Winner;
    participant: Participant;
    card: BingoCard;
  } | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  const totalCards = participants.reduce((acc, p) => acc + p.cards.length, 0);

  // --- Persistence ---
  useEffect(() => { localStorage.setItem(LS_KEYS.PARTICIPANTS, JSON.stringify(participants)); }, [participants]);
  useEffect(() => { localStorage.setItem(LS_KEYS.GAME_STATE, JSON.stringify(gameState)); }, [gameState]);
  useEffect(() => { localStorage.setItem(LS_KEYS.WINNERS, JSON.stringify(winners)); }, [winners]);
  useEffect(() => { localStorage.setItem(LS_KEYS.PRIZES, JSON.stringify(prizes)); }, [prizes]);
  useEffect(() => { localStorage.setItem(LS_KEYS.TITLE, JSON.stringify(bingoTitle)); }, [bingoTitle]);
  useEffect(() => { localStorage.setItem(LS_KEYS.SUBTITLE, JSON.stringify(bingoSubtitle)); }, [bingoSubtitle]);
  useEffect(() => { localStorage.setItem(LS_KEYS.SHEET_URL, JSON.stringify(sheetUrl)); }, [sheetUrl]);
  useEffect(() => { localStorage.setItem(LS_KEYS.AUTO_SYNC, JSON.stringify(autoSync)); }, [autoSync]);
  useEffect(() => { localStorage.setItem(LS_KEYS.SYNC_INTERVAL, JSON.stringify(syncInterval)); }, [syncInterval]);

  // Carga inicial desde Google Sheets - Solo si está autenticado
  useEffect(() => {
    if (sheetUrl && isAuthenticated) {
      loadFromCloud(); 
    }
  }, [isAuthenticated]);

  // Polling Effect (Sincronización automática) - Solo si está autenticado
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    if (autoSync && sheetUrl && isAuthenticated) {
      intervalId = setInterval(() => {
        loadFromCloud(true); // Modo silencioso
      }, syncInterval);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoSync, sheetUrl, syncInterval, isAuthenticated]);

  const handleLogin = async (user: string, pass: string) => {
    if (!sheetUrl) {
      await showAlert({ title: 'Error de Configuración', message: 'Por favor configura la URL del Script de Google Sheets antes de ingresar.', type: 'warning' });
      return false;
    }

    setIsLoginLoading(true);
    try {
       const result = await SheetAPI.login(sheetUrl, user, pass);
       if (result.success) {
          setIsAuthenticated(true);
          sessionStorage.setItem('bingo_auth', 'true');
          // Cargar datos inmediatamente al loguearse
          loadFromCloud();
          return true;
       } else {
          return false;
       }
    } catch (e) {
       console.error(e);
       return false;
    } finally {
       setIsLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('bingo_auth');
    // Opcional: limpiar datos sensibles de la memoria
    // setParticipants([]);
    // setWinners([]);
  };

  const loadFromCloud = async (silent: boolean = false) => {
    if (!sheetUrl) return;

    // Si es sync silencioso y ya hay uno en curso, saltamos este ciclo
    if (silent && isPollingRef.current) return;

    if (silent) isPollingRef.current = true;
    if (!silent) setIsSyncing(true);

    try {
      const cloudData = await SheetAPI.fetchAll(sheetUrl);
      if (cloudData) {
        // Invertimos el orden para que los nuevos (al final del sheet) aparezcan primero
        const reversedData = [...cloudData].reverse();

        setParticipants(prev => {
          // Comprobación simple para evitar re-renders innecesarios si los datos son idénticos
          if (JSON.stringify(prev) === JSON.stringify(reversedData)) {
            return prev;
          }
          return reversedData;
        });

        // Actualizar secuencia de cartones basada en lo importado
        let maxSeq = 100;
        reversedData.forEach(p => p.cards.forEach(c => {
          const num = parseInt(c.id.replace(/\D/g, ''));
          if (!isNaN(num) && num > maxSeq) maxSeq = num;
        }));

        setGameState(prev => {
          if (maxSeq > prev.lastCardSequence) {
            return { ...prev, lastCardSequence: maxSeq };
          }
          return prev;
        });
      }
    } catch (error) {
      console.error("Error polling:", error);
    } finally {
      if (silent) isPollingRef.current = false;
      if (!silent) setIsSyncing(false);
    }
  };

  // Helper para sincronizar un cambio específico inmediatamente
  const syncToCloud = async (action: 'save' | 'delete' | 'deleteAll', data?: any) => {
    if (!sheetUrl) return;

    // Indicador visual solo para acciones de escritura, aunque podríamos dejarlo en background
    // Para feedback inmediato, lo mostramos.
    setIsSyncing(true);
    try {
      if (action === 'save' && data) {
        await SheetAPI.syncParticipant(sheetUrl, data);
      } else if (action === 'delete' && typeof data === 'string') {
        await SheetAPI.deleteParticipant(sheetUrl, data);
      } else if (action === 'deleteAll') {
        await SheetAPI.deleteAll(sheetUrl);
      }
      // Opcional: recargar inmediatamente después de guardar para asegurar consistencia
      // await loadFromCloud(true); 
    } catch (error) {
      console.error("Error sync:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.error(err));
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  const addLog = (msg: string) => {
    setGameState(prev => ({
      ...prev,
      history: [...prev.history, `${new Date().toLocaleTimeString()}: ${msg}`]
    }));
  };

  const handleTogglePause = () => {
    setGameState(prev => {
      const newState = !prev.isPaused;
      return {
        ...prev,
        isPaused: newState,
        history: [...prev.history, newState ? "⏸️ Sorteo Pausado (Modo Admin)" : "▶️ Sorteo Reanudado"]
      };
    });
  };

  const handlePatternChange = async (pattern: PatternKey) => {
    if (gameState.drawnBalls.length > 0) {
      const confirmed = await showConfirm({
        title: '¿Cambiar Patrón?',
        message: "El juego está en curso. Cambiar el patrón no afectará las bolillas, pero cambiará las condiciones para ganar.",
        type: 'warning',
        confirmText: 'Sí, cambiar'
      });
      if (!confirmed) return;
    }
    setGameState(prev => ({ ...prev, selectedPattern: pattern }));
    addLog(`Patrón de victoria cambiado a: ${pattern}`);
  };

  const handleRegister = async (data: Omit<Participant, 'id' | 'cards'>, cardsCount: number) => {
    const isDuplicate = participants.some(p => p.dni.trim().toLowerCase() === data.dni.trim().toLowerCase());
    if (isDuplicate) {
      showAlert({ title: 'DNI Duplicado', message: `Ya existe un participante con ID ${data.dni}.`, type: 'warning' });
      return;
    }

    const newParticipant: Participant = {
      id: generateId('P'),
      ...data,
      cards: []
    };

    let currentSeq = gameState.lastCardSequence;
    for (let i = 0; i < cardsCount; i++) {
      currentSeq++;
      newParticipant.cards.push({
        id: `C${currentSeq.toString().padStart(4, '0')}`,
        numbers: generateBingoCardNumbers()
      });
    }

    // 1. Update Local State (Optimistic)
    setParticipants(prev => [newParticipant, ...prev]);
    setGameState(prev => ({ ...prev, lastCardSequence: currentSeq }));
    addLog(`Registrado ${newParticipant.name} con ${cardsCount} cartones`);

    // 2. Sync to Cloud (Background)
    syncToCloud('save', newParticipant);

    const successActions: AlertAction[] = [];
    if (cardsCount === 1) {
      const singleCard = newParticipant.cards[0];
      successActions.push({
        label: 'Descargar PNG',
        onClick: () => downloadCardImage(newParticipant, singleCard, bingoTitle, bingoSubtitle),
        icon: <ImageIcon size={18} />,
        className: 'bg-slate-800 hover:bg-cyan-900/50 text-cyan-400 border-cyan-800'
      });
      successActions.push({
        label: 'Descargar PDF',
        onClick: () => generateBingoCardsPDF(newParticipant, bingoTitle, bingoSubtitle, singleCard.id),
        icon: <FileText size={18} />,
        className: 'bg-slate-800 hover:bg-emerald-900/50 text-emerald-400 border-emerald-800'
      });
    } else {
      successActions.push({
        label: 'PDF con todos los cartones',
        onClick: () => generateBingoCardsPDF(newParticipant, bingoTitle, bingoSubtitle),
        icon: <FileText size={18} />,
        className: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg'
      });
    }

    showAlert({
      title: 'Registro Exitoso',
      message: `${newParticipant.name} ha sido registrado con ${cardsCount} cartones.\nSe está sincronizando con la hoja de cálculo...`,
      type: 'success',
      actions: successActions
    });
  };

  const handleEditParticipant = async (id: string, data: { name: string, surname: string, dni: string, phone: string }) => {
    const currentP = participants.find(p => p.id === id);
    if (!currentP) return;

    const updatedP = { ...currentP, ...data };

    setParticipants(prev => prev.map(p => p.id === id ? updatedP : p));
    addLog(`Participante editado: ${data.name} ${data.surname}`);

    // Sync
    syncToCloud('save', updatedP);

    showAlert({ title: 'Actualización Exitosa', message: 'Los datos del participante han sido actualizados en local y nube.', type: 'success' });
  };

  const handleDeleteParticipant = async (id: string) => {
    const p = participants.find(p => p.id === id);
    if (!p) return;

    const isWinner = winners.some(w => w.participantId === id);
    if (isWinner) {
      await showAlert({ title: 'Acción Denegada', message: `No puedes eliminar a ${p.name} porque ya ha ganado un premio. El historial de ganadores es sagrado.`, type: 'danger' });
      return;
    }

    const gameInProgress = gameState.drawnBalls.length > 0;
    if (gameInProgress && !gameState.isPaused) {
      await showAlert({ title: 'Juego en Curso', message: `Debes PAUSAR el sorteo antes de eliminar participantes.`, type: 'warning' });
      return;
    }

    const confirmed = await showConfirm({
      title: 'Eliminar Participante',
      message: `¿Estás seguro de eliminar a ${p.name} ${p.surname}?\nSe eliminará también de la Hoja de Cálculo de Google.`,
      type: 'danger',
      confirmText: 'Sí, eliminar'
    });

    if (confirmed) {
      setParticipants(prev => prev.filter(p => p.id !== id));
      addLog(`Participante eliminado: ${p.name} ${p.surname}`);

      // Sync
      syncToCloud('delete', id);

      showAlert({ title: 'Eliminado', message: 'El participante ha sido eliminado correctamente.', type: 'success' });
    }
  };

  const handleDeleteAllParticipants = async () => {
    if (participants.length === 0) return;

    if (winners.length > 0) {
      await showAlert({ title: 'Acción Denegada', message: "No puedes borrar a todos porque existen ganadores. Debes resetear el evento primero.", type: 'danger' });
      return;
    }

    const confirmed1 = await showConfirm({
      title: '¡PELIGRO!',
      message: "Esta acción ELIMINARÁ A TODOS los participantes y sus cartones tanto de la APP como de GOOGLE SHEETS.\n¿Estás seguro?",
      type: 'danger',
      confirmText: 'Entendido, continuar',
      cancelText: 'Cancelar'
    });

    if (confirmed1) {
      const confirmed2 = await showConfirm({
        title: 'Confirmación Final',
        message: "¿Borrar absolutamente TODO?",
        type: 'danger',
        confirmText: 'SÍ, BORRAR TODO'
      });

      if (confirmed2) {
        setParticipants([]);
        addLog("⚠️ Se han eliminado todos los participantes del sistema.");

        // Sync
        syncToCloud('deleteAll');

        showAlert({ title: 'Limpieza Completa', message: 'Todos los participantes han sido eliminados.', type: 'success' });
      }
    }
  };

  const handleAddCard = async (participantId: string) => {
    const newSeq = gameState.lastCardSequence + 1;
    const newCardId = `C${newSeq.toString().padStart(4, '0')}`;
    const currentParticipant = participants.find(p => p.id === participantId);

    if (!currentParticipant) return;

    const newCard = {
      id: newCardId,
      numbers: generateBingoCardNumbers()
    };

    const updatedParticipant = {
      ...currentParticipant,
      cards: [newCard, ...currentParticipant.cards]
    };

    setGameState(prev => ({ ...prev, lastCardSequence: newSeq }));
    setParticipants(prev => prev.map(p => p.id === participantId ? updatedParticipant : p));

    // Sync (Save the whole updated participant)
    syncToCloud('save', updatedParticipant);

    const successActions: AlertAction[] = [
      {
        label: 'Descargar PNG',
        onClick: () => downloadCardImage(updatedParticipant, newCard, bingoTitle, bingoSubtitle),
        icon: <ImageIcon size={18} />,
        className: 'bg-slate-800 hover:bg-cyan-900/50 text-cyan-400 border-cyan-800'
      },
      {
        label: 'Descargar PDF',
        onClick: () => generateBingoCardsPDF(updatedParticipant, bingoTitle, bingoSubtitle, newCard.id),
        icon: <FileText size={18} />,
        className: 'bg-slate-800 hover:bg-emerald-900/50 text-emerald-400 border-emerald-800'
      }
    ];

    showAlert({
      title: 'Cartón Agregado',
      message: `Se ha añadido exitosamente el cartón #${newCardId} a ${currentParticipant.name}.`,
      type: 'success',
      actions: successActions
    });
  };

  const handleDeleteCard = async (participantId: string, cardId: string) => {
    const isWinningCard = winners.some(w => w.cardId === cardId);

    let message = `¿Seguro que deseas eliminar el cartón #${cardId}?`;
    let type: 'danger' | 'warning' = 'danger';

    if (isWinningCard) {
      message = `⚠️ ESTE CARTÓN ES UN GANADOR.\nEliminarlo lo borrará del participante, pero el registro histórico se mantiene.\n¿Estás seguro?`;
      type = 'warning';
    }

    const confirmed = await showConfirm({
      title: 'Eliminar Cartón',
      message: message,
      type: type,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar'
    });

    if (!confirmed) return;

    // Find participant to update
    const participant = participants.find(p => p.id === participantId);
    if (!participant) return;

    const updatedParticipant = {
      ...participant,
      cards: participant.cards.filter(c => c.id !== cardId)
    };

    setParticipants(prev => prev.map(p => p.id === participantId ? updatedParticipant : p));

    if (isWinningCard) {
      addLog(`Cartón ganador #${cardId} eliminado manualmente de ${participantId}.`);
    }

    // Sync
    syncToCloud('save', updatedParticipant);

    showAlert({ title: 'Cartón Eliminado', message: `El cartón #${cardId} ha sido eliminado correctamente.`, type: 'success' });
  };

  const handleDrawBall = async () => {
    if (gameState.isPaused) {
      await showAlert({ title: 'Pausado', message: "El juego está pausado. Reanúdalo para continuar.", type: 'info' });
      return;
    }

    if (participants.length === 0) {
      await showAlert({ title: 'Sin Participantes', message: "No hay participantes registrados.", type: 'warning' });
      return;
    }

    if (gameState.selectedPattern === 'NONE') {
      await showAlert({ title: 'Falta Patrón', message: "Debes seleccionar una forma de ganar (patrón) antes de sacar una bolilla.", type: 'warning' });
      return;
    }

    const allPrizesAwarded = prizes.length > 0 && prizes.every(p => p.isAwarded);
    if (allPrizesAwarded) {
      await showAlert({ title: 'Evento Finalizado', message: "Todos los premios han sido entregados. Resetea el sorteo para jugar de nuevo.", type: 'success' });
      return;
    }

    const available = Array.from({ length: TOTAL_BALLS }, (_, i) => i + 1)
      .filter(n => !gameState.drawnBalls.includes(n));

    if (available.length === 0) {
      await showAlert({ title: 'Fin de Bolillas', message: "¡Se han sorteado todas las bolillas!", type: 'info' });
      return;
    }

    const randomIndex = Math.floor(Math.random() * available.length);
    const newBall = available[randomIndex];
    const time = new Date().toLocaleTimeString();
    const newLogs: string[] = [];

    const patternIndices = WIN_PATTERNS[gameState.selectedPattern].indices;
    let relevantHitFound = false;

    participants.forEach(p => {
      p.cards.forEach(c => {
        if (c.isInvalid) return;
        const ballIndexOnCard = c.numbers.indexOf(newBall);
        if (ballIndexOnCard !== -1 && patternIndices.includes(ballIndexOnCard)) {
          relevantHitFound = true;
          newLogs.push(`${time}: ${p.name} ${p.surname} acertó la bolilla N° ${newBall} en el cartón ${c.id}`);
        }
      });
    });

    if (!relevantHitFound) {
      newLogs.push(`${time}: Bolilla N° ${newBall} fue sorteada`);
    }

    setGameState(prev => ({
      ...prev,
      drawnBalls: [...prev.drawnBalls, newBall],
      history: [...prev.history, ...newLogs]
    }));

    const updatedBalls = [...gameState.drawnBalls, newBall];

    const potentialWinners = checkWinners(
      participants,
      updatedBalls,
      winners,
      gameState.selectedPattern,
      gameState.gameRound
    );

    if (potentialWinners.length > 0) {
      const activePrizeIndex = prizes.findIndex(p => !p.isAwarded);
      let currentPrize: Prize | null = null;
      let finalWinners = potentialWinners;

      if (activePrizeIndex !== -1) {
        currentPrize = prizes[activePrizeIndex];
        finalWinners = potentialWinners.map(w => ({
          ...w,
          prizeId: currentPrize?.id,
          prizeName: currentPrize?.name,
          prizeDescription: currentPrize?.description
        }));

        setPrizes(prev => {
          const newPrizes = [...prev];
          newPrizes[activePrizeIndex] = { ...newPrizes[activePrizeIndex], isAwarded: true };
          return newPrizes;
        });

        setGameState(prev => ({
          ...prev,
          roundLocked: true,
          history: [...prev.history, `🛑 Ronda finalizada. Premio asignado provisionalmente.`]
        }));

        addLog(`🎁 Premio Asignado: ${currentPrize.name}`);
      }

      setWinners(prev => [...prev, ...finalWinners]);
      setCurrentBatchWinners(finalWinners);

      finalWinners.forEach(w => addLog(`🏆 BINGO DETECTADO: ${w.participantName} (${w.cardId})`));

      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#3b82f6']
      });
    }
  };

  const handleConfirmRound = () => {
    setGameState(prev => ({
      ...prev,
      drawnBalls: [],
      history: [...prev.history, "✅ Ronda Confirmada. Preparando siguiente juego."],
      selectedPattern: 'NONE',
      roundLocked: false,
      gameRound: prev.gameRound + 1
    }));
    setCurrentBatchWinners([]);
    addLog("✅ Sorteo continuado. Bolillas reseteadas.");
  };

  const handleRejectWinner = (invalidWinner: Winner) => {
    const remainingInBatch = currentBatchWinners.filter(w =>
      !(w.cardId === invalidWinner.cardId && w.timestamp === invalidWinner.timestamp)
    );

    setWinners(prev => prev.filter(w =>
      !(w.cardId === invalidWinner.cardId && w.timestamp === invalidWinner.timestamp)
    ));

    const updatedParticipants = participants.map(p => {
      if (p.id === invalidWinner.participantId) {
        return {
          ...p,
          cards: p.cards.map(c =>
            c.id === invalidWinner.cardId ? { ...c, isInvalid: true } : c
          )
        };
      }
      return p;
    });

    setParticipants(updatedParticipants);

    // Sync updated invalid card status
    const affectedParticipant = updatedParticipants.find(p => p.id === invalidWinner.participantId);
    if (affectedParticipant) syncToCloud('save', affectedParticipant);

    if (remainingInBatch.length > 0) {
      setCurrentBatchWinners(remainingInBatch);
      addLog(`⚠️ Ganador invalidado: ${invalidWinner.participantName} (Cartón ${invalidWinner.cardId} ANULADO).`);
    } else {
      if (invalidWinner.prizeId) {
        setPrizes(prev => prev.map(p =>
          p.id === invalidWinner.prizeId ? { ...p, isAwarded: false } : p
        ));
        addLog(`↩️ Premio "${invalidWinner.prizeName}" liberado.`);
      }

      setGameState(prev => ({
        ...prev,
        history: [...prev.history, `🚫 Ganador invalidado: ${invalidWinner.participantName}. Cartón ${invalidWinner.cardId} ANULADO.`],
        roundLocked: false
      }));
      setCurrentBatchWinners([]);
      addLog("⚠️ Ganador invalidado. Sorteo reanudado.");
    }
  };

  const handleCloseWinnerModal = () => {
    setCurrentBatchWinners([]);
  };

  const handleViewDetailsFromSummary = (winner: Winner) => {
    const participant = participants.find(p => p.id === winner.participantId);
    if (participant) {
      let card = participant.cards.find(c => c.id === winner.cardId);
      if (!card && winner.cardSnapshot) {
        card = winner.cardSnapshot;
      }
      if (card) {
        setViewingDetailsData({ winner, participant, card });
      } else {
        showAlert({ title: "Cartón no encontrado", message: "El cartón ha sido eliminado.", type: 'danger' });
      }
    } else {
      showAlert({ message: "Participante no encontrado", type: 'danger' });
    }
  };

  const handleReset = async () => {
    const pendingPrizesCount = prizes.filter(p => !p.isAwarded).length;
    const totalPrizes = prizes.length;

    if (totalPrizes > 0 && pendingPrizesCount > 0) {
      const confirmed = await showConfirm({
        title: '¿Siguiente Ronda?',
        message: "Se borrarán las bolillas. Ganadores se mantienen.\n¿Siguiente premio?",
        confirmText: 'Sí, siguiente',
        type: 'info'
      });
      if (!confirmed) return;

      setGameState(prev => ({
        ...prev,
        drawnBalls: [],
        history: [],
        selectedPattern: 'NONE',
        roundLocked: false,
        gameRound: prev.gameRound + 1,
        isPaused: false
      }));
      setCurrentBatchWinners([]);
      return;
    }

    const confirmed = await showConfirm({
      title: 'Resetear Todo',
      message: "¿Borrar progreso, ganadores y bolillas?",
      type: 'danger',
      confirmText: 'SÍ, BORRAR TODO'
    });

    if (!confirmed) return;

    setGameState(prev => ({
      ...prev,
      drawnBalls: [],
      history: [],
      selectedPattern: 'NONE',
      roundLocked: false,
      gameRound: 1,
      isPaused: false
    }));
    setWinners([]);
    setCurrentBatchWinners([]);
    setPrizes([]);

    // Restore cards validity locally
    setParticipants(prev => prev.map(p => ({
      ...p,
      cards: p.cards.map(c => ({ ...c, isInvalid: false }))
    })));

    addLog("♻️ Evento reseteado completamente.");
  };

  const handleImport = async (file: File) => {
    try {
      const imported = await parseExcel(file);
      const existingDNIs = new Set(participants.map(p => String(p.dni).trim().toLowerCase()));

      const uniqueNewParticipants = imported.filter(p => {
        const importedDni = String(p.dni).trim().toLowerCase();
        return !existingDNIs.has(importedDni);
      });

      if (uniqueNewParticipants.length === 0) {
        await showAlert({ title: 'Importación Fallida', message: `Duplicados detectados.`, type: 'warning' });
        return;
      }

      const confirmed = await showConfirm({
        title: 'Confirmar Importación',
        message: `Importar ${uniqueNewParticipants.length} nuevos participantes?`,
        confirmText: 'Importar'
      });

      if (confirmed) {
        setParticipants(prev => [...uniqueNewParticipants, ...prev]);

        let maxSeq = gameState.lastCardSequence;
        uniqueNewParticipants.forEach(p => p.cards.forEach(c => {
          const num = parseInt(c.id.replace(/\D/g, ''));
          if (!isNaN(num) && num > maxSeq) maxSeq = num;
        }));
        setGameState(prev => ({ ...prev, lastCardSequence: maxSeq }));

        // Bulk Sync to Cloud if URL exists
        if (sheetUrl) {
          addLog("Iniciando carga masiva a la nube...");
          setIsSyncing(true);
          // Note: In a real production app, we would add a 'bulkSave' endpoint to GAS
          // to avoid making 100 fetch calls. For now, we loop.
          for (const p of uniqueNewParticipants) {
            await SheetAPI.syncParticipant(sheetUrl, p);
          }
          setIsSyncing(false);
          addLog("Carga masiva completada.");
        }
      }
    } catch (e) {
      showAlert({ title: 'Error', message: "Error al leer Excel.", type: 'danger' });
    }
  };

  const handleDownloadCard = async (p: Participant, cid: string) => {
    const card = p.cards.find(c => c.id === cid);
    if (card) await downloadCardImage(p, card, bingoTitle, bingoSubtitle);
  };

  const handleShareCard = async (p: Participant, cid: string) => {
    if (!p.phone) return;
    const card = p.cards.find(c => c.id === cid);
    if (card) {
      await generateBingoCardsPDF(p, bingoTitle, bingoSubtitle, cid);
      const url = `https://web.whatsapp.com/send?phone=${p.phone.replace(/\D/g, '')}&text=${encodeURIComponent(`Hola ${p.name}, cartón #${card.id}`)}`;
      window.open(url);
    }
  };

  const handleShareAllCards = async (p: Participant) => {
    if (!p.phone) return;
    await generateBingoCardsPDF(p, bingoTitle, bingoSubtitle);
    const url = `https://web.whatsapp.com/send?phone=${p.phone.replace(/\D/g, '')}&text=${encodeURIComponent(`Hola ${p.name}, aquí tus cartones.`)}`;
    window.open(url);
  };

  const handleAddPrize = (name: string, description: string) => {
    setPrizes(prev => [...prev, { id: generateId('PR'), name, description, isAwarded: false }]);
  };

  const handleEditPrize = (id: string, name: string, description: string) => {
    setPrizes(prev => prev.map(p => p.id === id ? { ...p, name, description } : p));
  };

  const handleRemovePrize = async (id: string) => {
    const prize = prizes.find(p => p.id === id);
    if (prize?.isAwarded) {
      await showAlert({ message: "No puedes eliminar premios entregados.", type: 'danger' });
      return;
    }
    if (await showConfirm({ title: 'Eliminar', message: "¿Eliminar premio?", type: 'danger' })) {
      setPrizes(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleTogglePrize = (id: string) => {
    // View-only logic for prizes in this context
  };

  // --- RENDER LOGIN IF NOT AUTHENTICATED ---
  if (!isAuthenticated) {
    return (
      <>
        <Login 
           onLogin={handleLogin} 
           isLoading={isLoginLoading}
           onOpenSettings={() => setShowConnectionModal(true)}
        />
        {showConnectionModal && (
            <ConnectionModal
            currentUrl={sheetUrl}
            currentAutoSync={autoSync}
            currentInterval={syncInterval}
            onSave={(url, newAutoSync, newInterval) => {
                setSheetUrl(url);
                setAutoSync(newAutoSync);
                setSyncInterval(newInterval);
                // No cargamos datos aquí, esperamos al login
            }}
            onClose={() => setShowConnectionModal(false)}
            onSyncNow={() => {}} // Deshabilitado en login
            />
        )}
      </>
    );
  }

  // --- MAIN APP ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative">
      <div
        className={`fixed inset-0 bg-black/70 backdrop-blur-[2px] z-[90] transition-opacity duration-300 ${showSidebar ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setShowSidebar(false)}
      />

      <aside
        className={`fixed top-0 left-0 h-full w-full sm:w-[450px] bg-slate-900/95 border-r border-slate-800 shadow-2xl z-[100] transform transition-transform duration-300 ease-out overflow-y-auto custom-scrollbar p-4 flex flex-col gap-6 ${showSidebar ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex justify-between items-center pb-2 border-b border-slate-800/50 flex-shrink-0">
          <h3 className="font-bold text-white flex items-center gap-2 text-lg">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-lg shadow-cyan-500/50"></div>
            Menú de Gestión
          </h3>
          <button onClick={() => setShowSidebar(false)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
            <PanelLeftOpen className="rotate-180" size={22} />
          </button>
        </div>

        <div className="flex-1 flex flex-col gap-6 min-h-0">
          <RegistrationPanel
            onRegister={handleRegister}
            onImport={handleImport}
            onExport={() => exportToExcel(participants)}
            onGenerateAllImages={() => downloadAllCardsZip(participants, bingoTitle, bingoSubtitle)}
            totalParticipants={participants.length}
            totalCards={totalCards}
          />

          <PrizesPanel
            prizes={prizes}
            onAddPrize={handleAddPrize}
            onEditPrize={handleEditPrize}
            onRemovePrize={handleRemovePrize}
            onTogglePrize={handleTogglePrize}
          />
        </div>
      </aside>

      {showTitleModal && (
        <EditTitleModal
          currentTitle={bingoTitle}
          currentSubtitle={bingoSubtitle}
          onSave={(t, s) => { setBingoTitle(t); setBingoSubtitle(s); setShowTitleModal(false); }}
          onClose={() => setShowTitleModal(false)}
        />
      )}

      {showConnectionModal && (
        <ConnectionModal
          currentUrl={sheetUrl}
          currentAutoSync={autoSync}
          currentInterval={syncInterval}
          onSave={(url, newAutoSync, newInterval) => {
            setSheetUrl(url);
            setAutoSync(newAutoSync);
            setSyncInterval(newInterval);
            // Si ya estamos autenticados, recargamos datos
            if (isAuthenticated) loadFromCloud(false);
          }}
          onClose={() => setShowConnectionModal(false)}
          onSyncNow={() => loadFromCloud(false)}
        />
      )}

      {currentBatchWinners.length > 0 && (
        <WinnerModal
          winners={currentBatchWinners}
          onClose={handleCloseWinnerModal}
          onViewDetails={handleViewDetailsFromSummary}
          onConfirmRound={handleConfirmRound}
          onRejectWinner={handleRejectWinner}
        />
      )}

      {viewingDetailsData && (
        <WinnerDetailsModal
          winner={viewingDetailsData.winner}
          participant={participants.find(p => p.id === viewingDetailsData.participant.id) || viewingDetailsData.participant}
          card={viewingDetailsData.card}
          drawnBalls={gameState.drawnBalls}
          onClose={() => setViewingDetailsData(null)}
          currentPattern={gameState.selectedPattern}
          onDeleteCard={handleDeleteCard}
          onDownloadCard={handleDownloadCard}
          onShareCard={(cardId) => handleShareCard(viewingDetailsData.participant, cardId)}
          prizes={prizes}
          allWinners={winners}
        />
      )}

      <header className="bg-slate-900 border-b border-slate-800 py-3 px-6 flex items-center justify-between shadow-lg sticky top-0 z-20 h-14">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowSidebar(true)}
            className={`p-1.5 rounded-lg transition-colors border border-slate-700 bg-slate-800 text-cyan-400 hover:text-white hover:border-cyan-500/50`}
          >
            <PanelLeftOpen size={20} />
          </button>

          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600 leading-none uppercase">
              {bingoTitle}
            </h1>
            <span className="text-[10px] text-slate-500 font-medium leading-tight">{bingoSubtitle}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Botón de estado de la nube */}
          <button
            onClick={() => setShowConnectionModal(true)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${sheetUrl ? (isSyncing ? 'bg-amber-900/30 text-amber-400 border-amber-500/50' : 'bg-emerald-900/30 text-emerald-400 border-emerald-500/50') : 'bg-slate-800 text-slate-500 border-slate-700 hover:bg-slate-700'}`}
            title={sheetUrl ? "Conectado a Google Sheets" : "Configurar Nube"}
          >
            {isSyncing ? <Loader2 size={14} className="animate-spin" /> : (autoSync ? <Zap size={14} className="text-yellow-400 fill-yellow-400" /> : <Cloud size={14} />)}
            <span className="hidden sm:inline">{sheetUrl ? (isSyncing ? 'Sincronizando...' : (autoSync ? 'Auto-Sync ON' : 'Online')) : 'Offline'}</span>
          </button>

          {sheetUrl && !isSyncing && (
            <button
              onClick={() => loadFromCloud(false)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-emerald-400 border border-slate-700"
              title="Forzar actualización desde Hoja de Cálculo"
            >
              <RefreshCw size={16} />
            </button>
          )}

          <div className="w-px h-6 bg-slate-800 mx-1 hidden sm:block"></div>

          <button onClick={() => setShowTitleModal(true)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700">
            <Edit size={18} />
          </button>

          <button onClick={toggleFullScreen} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700">
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>

          <button onClick={handleLogout} className="p-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 border border-rose-900/50 ml-2" title="Cerrar Sesión">
             <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-[1920px] mx-auto w-full grid grid-cols-1 gap-4 transition-all duration-300 items-start xl:grid-cols-[1fr_400px] 2xl:grid-cols-[1fr_500px]">
        <section className="flex flex-col gap-4">
          <GamePanel
            drawnBalls={gameState.drawnBalls}
            onDrawBall={handleDrawBall}
            onReset={handleReset}
            historyLog={gameState.history}
            hasParticipants={participants.length > 0}
            currentPattern={gameState.selectedPattern}
            onPatternChange={handlePatternChange}
            prizes={prizes}
            onTogglePrize={handleTogglePrize}
            roundLocked={gameState.roundLocked || false}
            isPaused={gameState.isPaused}
            onTogglePause={handleTogglePause}
          />
        </section>

        <section className="h-[500px] xl:h-[calc(100vh-6rem)] xl:sticky xl:top-20">
          <ParticipantsPanel
            participants={participants}
            drawnBalls={gameState.drawnBalls}
            winners={winners}
            onAddCard={handleAddCard}
            onDeleteCard={handleDeleteCard}
            onDownloadCard={handleDownloadCard}
            onEditParticipant={handleEditParticipant}
            onDeleteParticipant={handleDeleteParticipant}
            onDeleteAllParticipants={handleDeleteAllParticipants}
            currentPattern={gameState.selectedPattern}
            onShareCard={handleShareCard}
            onShareAllCards={handleShareAllCards}
            prizes={prizes}
            totalCards={totalCards}
          />
        </section>
      </main>
    </div>
  );
};

export default App;
