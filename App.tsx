
import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Participant, GameState, Winner, TOTAL_BALLS, NUMBERS_PER_CARD, BingoCard, PatternKey, Prize } from './types.ts';
import { generateBingoCardNumbers, generateId, checkWinners, WIN_PATTERNS, toTitleCase } from './utils/helpers.ts';
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
import ManagementMenu from './components/ManagementMenu.tsx';
import Modal from './components/Modal.tsx';
import Login from './components/Login.tsx';
import { Maximize2, Minimize2, PanelLeftOpen, Edit, FileText, Image as ImageIcon, Cloud, RefreshCw, Loader2, Link, Zap, LogOut, Menu, X, MessageCircle, ChevronRight } from 'lucide-react';
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
  SYNC_INTERVAL: 'bingo_sync_interval_v1',
  CARD_PRICE: 'bingo_card_price_v1'
};

// URL por defecto proporcionada por el usuario
const DEFAULT_SHEET_URL = "https://script.google.com/macros/s/AKfycbwwZi4WJVS4GueSLZ_rO140w5jLE67qjOSdMRJoSUADSNv9erRmvvzhqFrqWs-IhM7Kog/exec";

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
  const { showAlert, showConfirm, showToast } = useAlert();

  // --- Auth State ---
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('bingo_auth') === 'true';
  });
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // --- Configuración de Nube ---
  const [sheetUrl, setSheetUrl] = useState<string>(() => {
    // Limpiamos la memoria local para forzar siempre la URL del código
    localStorage.removeItem(LS_KEYS.SHEET_URL);
    return DEFAULT_SHEET_URL;
  });

  // Auto Sync Config
  const [autoSync, setAutoSync] = useState<boolean>(() => loadFromStorage(LS_KEYS.AUTO_SYNC, true));
  const [syncInterval, setSyncInterval] = useState<number>(() => loadFromStorage(LS_KEYS.SYNC_INTERVAL, 5000));

  const [isSyncing, setIsSyncing] = useState(false);
  const [showLoginConnection, setShowLoginConnection] = useState(false);

  // --- REFERENCIAS DE SINCRONIZACIÓN Y BLOQUEO MULTIDISPOSITIVO ---
  const isPollingRef = useRef(false);
  const isFirstLoadRef = useRef(true); 
  const [hasInitialCloudSync, setHasInitialCloudSync] = useState(false);
  
  // Contadores para evitar que polling sobreescriba cambios locales
  const syncLockRef = useRef({ gameState: false, winners: false, prizes: false, config: false, participants: false });
  // Banderas para ignorar eventos de autosync tras recibir un payload en la nube
  const skipSyncRef = useRef({ gameState: false, winners: false, prizes: false });
  const timersRef = useRef<{ [key: string]: NodeJS.Timeout | null }>({ gameState: null, winners: null, prizes: null, config: null });

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

  const [cardPrice, setCardPrice] = useState<number>(() =>
    loadFromStorage(LS_KEYS.CARD_PRICE, 5)
  );

  const [currentBatchWinners, setCurrentBatchWinners] = useState<Winner[]>([]);
  const [viewingDetailsData, setViewingDetailsData] = useState<{
    winner: Winner;
    participant: Participant;
    card: BingoCard;
  } | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showManagementMenu, setShowManagementMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [activeManagementModal, setActiveManagementModal] = useState<'none' | 'register' | 'prizes' | 'participants' | 'settings' | 'connection'>('none');
  const [isParticipantsDrawerOpen, setIsParticipantsDrawerOpen] = useState(false);

  const totalCards = participants.reduce((acc, p) => acc + p.cards.length, 0);

  // --- Persistence ---
  useEffect(() => { localStorage.setItem(LS_KEYS.PARTICIPANTS, JSON.stringify(participants)); }, [participants]);
  useEffect(() => { localStorage.setItem(LS_KEYS.GAME_STATE, JSON.stringify(gameState)); }, [gameState]);
  useEffect(() => { localStorage.setItem(LS_KEYS.WINNERS, JSON.stringify(winners)); }, [winners]);
  useEffect(() => { localStorage.setItem(LS_KEYS.PRIZES, JSON.stringify(prizes)); }, [prizes]);
  useEffect(() => { localStorage.setItem(LS_KEYS.TITLE, JSON.stringify(bingoTitle)); }, [bingoTitle]);
  useEffect(() => { localStorage.setItem(LS_KEYS.SUBTITLE, JSON.stringify(bingoSubtitle)); }, [bingoSubtitle]);
  // Ya no guardamos sheetUrl en localStorage para que siempre use la del código
  useEffect(() => { localStorage.setItem(LS_KEYS.AUTO_SYNC, JSON.stringify(autoSync)); }, [autoSync]);
  useEffect(() => { localStorage.setItem(LS_KEYS.SYNC_INTERVAL, JSON.stringify(syncInterval)); }, [syncInterval]);
  useEffect(() => { localStorage.setItem(LS_KEYS.CARD_PRICE, JSON.stringify(cardPrice)); }, [cardPrice]);

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

    if (silent && isPollingRef.current) return;
    if (silent) isPollingRef.current = true;
    if (!silent) setIsSyncing(true);

    try {
      // 1. Fetch Participants
      const result = await SheetAPI.fetchAll(sheetUrl);
      if (result.success && Array.isArray(result.data)) {
        const cloudData = result.data;
        console.log("loadFromCloud: Fetched data", cloudData);
        const reversedData = [...cloudData].reverse();
        setParticipants(prev => {
          if (syncLockRef.current.participants) return prev;
          if (JSON.stringify(prev) === JSON.stringify(reversedData)) return prev;
          return reversedData;
        });

        // Actualizar secuencia de cartones
        let maxSeq = 100;
        reversedData.forEach(p => p.cards.forEach(c => {
          const num = parseInt(c.id.split('-')[0].replace(/\D/g, ''));
          if (!isNaN(num) && num > maxSeq) maxSeq = num;
        }));
        setGameState(prev => {
          if (maxSeq > prev.lastCardSequence) return { ...prev, lastCardSequence: maxSeq };
          return prev;
        });
      }

      // 2. Fetch Settings & Full Game State (Balls, Winners, Prizes)
      const settingsResult = await SheetAPI.fetchSettings(sheetUrl);
      if (settingsResult.success && settingsResult.settings) {
        const s = settingsResult.settings;
        
        // Settings Básicos
        if (s.eventTitle) setBingoTitle(s.eventTitle);
        if (s.eventSubtitle) setBingoSubtitle(s.eventSubtitle);
        if (s.cardPrice) setCardPrice(Number(s.cardPrice));
        if (s.sheetUrl && s.sheetUrl !== sheetUrl) setSheetUrl(s.sheetUrl);

        // --- 2. GAME STATE ---
        if (s.gameState && !syncLockRef.current.gameState) {
          try {
            const cloudGS = typeof s.gameState === 'string' ? JSON.parse(s.gameState) : s.gameState;
            setGameState(prev => {
              // Bailout instantáneo si es igual para no renderizar
              if (prev.drawnBalls.join(',') === (cloudGS.drawnBalls || []).join(',') && 
                  prev.selectedPattern === cloudGS.selectedPattern && 
                  prev.gameRound === cloudGS.gameRound && 
                  prev.isPaused === cloudGS.isPaused) {
                return prev; 
              }
              // Marca para omitir subida inútil a la nube porque los datos acaban de bajar de allí
              skipSyncRef.current.gameState = true;
              return { ...cloudGS, lastCardSequence: prev.lastCardSequence };
            });
          } catch (e) { console.error("Sync GS Error:", e); }
        }

        // --- 3. WINNERS ---
        if (s.winners && !syncLockRef.current.winners) {
          try {
            const cloudWinners = typeof s.winners === 'string' ? JSON.parse(s.winners) : s.winners;
            setWinners(prev => {
              if (JSON.stringify(prev) === JSON.stringify(cloudWinners)) return prev; 
              skipSyncRef.current.winners = true;
              return cloudWinners;
            });
          } catch (e) { console.error("Sync Winners Error:", e); }
        }

        // --- 4. PRIZES ---
        if (s.prizes && !syncLockRef.current.prizes) {
          try {
            const cloudPrizes = typeof s.prizes === 'string' ? JSON.parse(s.prizes) : s.prizes;
            setPrizes(prev => {
              if (JSON.stringify(prev) === JSON.stringify(cloudPrizes)) return prev;
              skipSyncRef.current.prizes = true;
              return cloudPrizes;
            });
          } catch (e) { console.error("Sync Prizes Error:", e); }
        }
      }
      

      if (!silent) showToast('¡Datos sincronizados correctamente!', 'success');
      setHasInitialCloudSync(true);
    } catch (error) {
      console.error("Error inesperado en loadFromCloud:", error);
      if (!silent) showAlert({ title: 'Error de Sincronización', message: 'Ocurrió un error al intentar conectar con la nube.', type: 'danger' });
    } finally {
      if (silent) isPollingRef.current = false;
      if (!silent) setIsSyncing(false);
      isFirstLoadRef.current = false;
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

  // Función para subir una porción específica del estado de forma atómica (Partial Push)
  const pushPartialToCloud = async (key: 'gameState' | 'winners' | 'prizes' | 'config', value: any) => {
    if (!sheetUrl || !isAuthenticated || !hasInitialCloudSync) return;
    
    if (timersRef.current[key]) clearTimeout(timersRef.current[key]!);
    
    // Bloqueamos la descarga (polling) para esta llave para evitar que la nube sobrescriba con datos viejos
    syncLockRef.current[key] = true; 
    setIsSyncing(true);

    timersRef.current[key] = setTimeout(async () => {
      try {
        const payload: any = {};
        if (key === 'config') {
          Object.assign(payload, value); // { eventTitle, etc... }
        } else {
          payload[key] = value;
        }
        await SheetAPI.syncSettings(sheetUrl, payload);
      } catch (e) {
        console.error(`Error partial sync ${key}:`, e);
      } finally {
        syncLockRef.current[key] = false;
        setIsSyncing(false);
      }
    }, 600); // 600ms de reactividad, sin solapamientos
  };

  const handleSaveSettings = async (title?: string, subtitle?: string, price?: number, url?: string, silent: boolean = false) => {
    const newTitle = title ?? bingoTitle;
    const newSubtitle = subtitle ?? bingoSubtitle;
    const newPrice = price ?? cardPrice;
    const targetUrl = url || sheetUrl;

    if (title !== undefined) setBingoTitle(title);
    if (subtitle !== undefined) setBingoSubtitle(subtitle);
    if (price !== undefined) setCardPrice(newPrice);
    if (url !== undefined) setSheetUrl(targetUrl);
    
    if (targetUrl) {
      if (!silent) showToast('Guardando configuración...', 'info');
      await pushPartialToCloud('config', {
        eventTitle: newTitle,
        eventSubtitle: newSubtitle,
        cardPrice: newPrice,
        sheetUrl: targetUrl
      });
      if (!silent) showToast('¡Ajustes guardados!', 'success');
    }
  };

  // --- EFECTOS DE AUTO-GUARDADO REACTIVO ---
  useEffect(() => {
    if (skipSyncRef.current.gameState) { skipSyncRef.current.gameState = false; return; }
    if (autoSync) pushPartialToCloud('gameState', gameState);
  }, [gameState.drawnBalls.length, gameState.isPaused, gameState.selectedPattern, gameState.gameRound, gameState.roundLocked]);

  useEffect(() => {
    if (skipSyncRef.current.winners) { skipSyncRef.current.winners = false; return; }
    if (autoSync) pushPartialToCloud('winners', winners);
  }, [winners.length]);

  useEffect(() => {
    if (skipSyncRef.current.prizes) { skipSyncRef.current.prizes = false; return; }
    if (autoSync) pushPartialToCloud('prizes', prizes);
  }, [prizes]);

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
      name: toTitleCase(data.name),
      surname: toTitleCase(data.surname),
      cards: []
    };

    let currentSeq = gameState.lastCardSequence;
    for (let i = 0; i < cardsCount; i++) {
      currentSeq++;
      // Añadimos un sufijo aleatorio de 4 caracteres para evitar duplicados en registros concurrentes
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      newParticipant.cards.push({
        id: `C${currentSeq.toString().padStart(4, '0')}-${randomSuffix}`,
        numbers: generateBingoCardNumbers()
      });
    }

    // 1. Update Local State (Optimistic)
    syncLockRef.current.participants = true;
    setParticipants(prev => [newParticipant, ...prev]);
    setGameState(prev => ({ ...prev, lastCardSequence: currentSeq }));
    addLog(`Registrado ${newParticipant.name} con ${cardsCount} cartones`);

    // 2. Sync to Cloud (Background)
    await syncToCloud('save', newParticipant);
    syncLockRef.current.participants = false;

    const successActions: AlertAction[] = [];

    // WhatsApp button (Primary action)
    successActions.push({
      label: 'Compartir cartones a WhatsApp',
      onClick: async () => {
        // Open WhatsApp (which now handles the correct file download internally)
        await shareOrOpenWhatsApp(newParticipant, cardsCount === 1 ? newParticipant.cards[0].id : undefined);
      },
      icon: <MessageCircle size={20} />,
      className: 'w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-5 rounded-lg shadow-lg flex items-center justify-center gap-2 border-none'
    });

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

    syncLockRef.current.participants = true;
    const updatedP = {
      ...currentP,
      ...data,
      name: toTitleCase(data.name),
      surname: toTitleCase(data.surname)
    };

    setParticipants(prev => prev.map(p => p.id === id ? updatedP : p));
    addLog(`Participante editado: ${data.name} ${data.surname}`);

    // Sync
    await syncToCloud('save', updatedP);
    syncLockRef.current.participants = false;

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
      syncLockRef.current.participants = true;
      setParticipants(prev => prev.filter(p => p.id !== id));
      addLog(`Participante eliminado: ${p.name} ${p.surname}`);

      // Sync
      await syncToCloud('delete', id);
      syncLockRef.current.participants = false;

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
    // Añadimos un sufijo aleatorio de 4 caracteres para evitar duplicados en registros concurrentes
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const newCardId = `C${newSeq.toString().padStart(4, '0')}-${randomSuffix}`;
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

  const handleRetireCard = async (participantId: string, cardId: string) => {
    syncLockRef.current.participants = true;
    let updatedParticipant: Participant | null = null;
    setParticipants(prev => prev.map(p => {
      if (p.id === participantId) {
        updatedParticipant = {
          ...p,
          cards: p.cards.map(c => c.id === cardId ? { ...c, isRetired: true } : c)
        };
        return updatedParticipant;
      }
      return p;
    }));
    
    if (updatedParticipant) {
      await syncToCloud('save', updatedParticipant);
      await loadFromCloud(false);
    }
    
    syncLockRef.current.participants = false;
    setViewingDetailsData(null);
    showAlert({ title: 'Cartón Retirado', message: 'El cartón ha sido retirado del juego exitosamente.', type: 'success' });
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
    const hasDrawnBalls = gameState.drawnBalls.length > 0;

    if ((totalPrizes > 0 && pendingPrizesCount > 0) || hasDrawnBalls) {
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
        // Normalizar nombres y apellidos de participantes importados
        const normalizedParticipants = uniqueNewParticipants.map(p => ({
          ...p,
          name: toTitleCase(p.name),
          surname: toTitleCase(p.surname)
        }));

        setParticipants(prev => [...normalizedParticipants, ...prev]);

        let maxSeq = gameState.lastCardSequence;
        normalizedParticipants.forEach(p => p.cards.forEach(c => {
          // Extraer solo la parte numérica antes del guion (ej: C0298-A1B -> 0298)
          const num = parseInt(c.id.split('-')[0].replace(/\D/g, ''));
          if (!isNaN(num) && num > maxSeq) maxSeq = num;
        }));
        setGameState(prev => ({ ...prev, lastCardSequence: maxSeq }));

        // Bulk Sync to Cloud if URL exists
        if (sheetUrl) {
          addLog("Iniciando carga masiva a la nube...");
          setIsSyncing(true);
          // Note: In a real production app, we would add a 'bulkSave' endpoint to GAS
          // to avoid making 100 fetch calls. For now, we loop.
          for (const p of normalizedParticipants) {
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
      const url = `https://web.whatsapp.com/send?phone=${p.phone.replace(/\D/g, '')}&text=${encodeURIComponent(`Hola ${p.name}, este es tu cartón #${card.id}, para jugar en Bingo Virtual,\nBuena suerte! 🍀`)}`;
      window.open(url);
    }
  };

  const shareOrOpenWhatsApp = async (p: Participant, cardId?: string) => {
    if (!p.phone) {
      showAlert({ title: 'Sin teléfono', message: 'El participante no tiene un número de teléfono registrado.', type: 'warning' });
      return;
    }

    const card = cardId ? p.cards.find(c => c.id === cardId) : p.cards[0];
    if (!card) return;

    // Generate the appropriate file type
    if (cardId) {
      await downloadCardImage(p, card, bingoTitle, bingoSubtitle);
    } else {
      await generateBingoCardsPDF(p, bingoTitle, bingoSubtitle);
    }

    // Customize message based on card count
    let message = '';
    if (p.cards.length === 1) {
      message = `Hola ${p.name}, este es tu cartón #${p.cards[0].id}, para jugar en Bingo Virtual. ¡Buena suerte!`;
    } else {
      const cardIds = p.cards.map(c => `#${c.id}`).join(', ');
      message = `Hola ${p.name}, estos son tus ${p.cards.length} cartones: ${cardIds}, para jugar en Bingo Virtual. ¡Buena suerte!`;
    }

    const phone = p.phone.replace(/\D/g, '');

    // Use wa.me API which automatically detects mobile app or desktop browser
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    // Open in a new tab/window
    window.open(url, '_blank');
  };

  const handleShareAllCards = async (p: Participant) => {
    if (!p.phone) {
      showAlert({ title: 'Sin teléfono', message: 'El participante no tiene un número de teléfono registrado.', type: 'warning' });
      return;
    }

    await generateBingoCardsPDF(p, bingoTitle, bingoSubtitle);

    const message = `Hola ${p.name}, adjuntamos tus cartones para jugar en Bingo Virtual,\nBuena suerte! 🍀`;
    const phone = p.phone.replace(/\D/g, '');

    // Use wa.me API which automatically detects mobile app or desktop browser
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    window.open(url, '_blank');
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
          onOpenSettings={() => setShowLoginConnection(true)}
        />
        {showLoginConnection && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl h-[80vh] sm:h-auto sm:max-h-[90vh] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col">
              <ConnectionModal
                currentUrl={sheetUrl}
                currentAutoSync={autoSync}
                currentInterval={syncInterval}
                onSave={(url, newAutoSync, newInterval) => {
                  setSheetUrl(url);
                  setAutoSync(newAutoSync);
                  setSyncInterval(newInterval);
                  setShowLoginConnection(false);
                }}
                onClose={() => setShowLoginConnection(false)}
                onSyncNow={() => { }} // Deshabilitado en login
              />
            </div>
          </div>
        )}
      </>
    );
  }

  // --- MAIN APP ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative">
      <ManagementMenu
        isOpen={showManagementMenu}
        onClose={() => setShowManagementMenu(false)}
        onOpenModal={(modal) => setActiveManagementModal(modal)}
        onImport={handleImport}
        onExport={() => exportToExcel(participants)}
        onBackup={() => downloadAllCardsZip(participants, bingoTitle, bingoSubtitle)}
        totalParticipants={participants.length}
        totalCards={totalCards}
      />

      {/* Participants Side Drawer */}
      <div
        className={`fixed top-0 right-0 h-full bg-slate-900 border-l border-slate-800 shadow-2xl z-[100] transition-all duration-500 ease-in-out ${isParticipantsDrawerOpen ? 'w-full md:w-1/3 translate-x-0' : 'w-0 translate-x-full'}`}
      >
        {isParticipantsDrawerOpen && (
          <div className="h-full w-full overflow-hidden flex flex-col">
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
              onRetireCard={handleRetireCard}
              prizes={prizes}
              totalCards={totalCards}
              variant="drawer"
              onClose={() => setIsParticipantsDrawerOpen(false)}
            />
          </div>
        )}
      </div>

      {/* Drawer Toggle Arrow */}
      {!isParticipantsDrawerOpen && (
        <button
          onClick={() => setIsParticipantsDrawerOpen(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-[90] bg-slate-800/50 hover:bg-cyan-600/80 text-cyan-400 hover:text-white p-1.5 pl-0.5 rounded-l-xl border border-r-0 border-slate-700 transition-all group shadow-lg backdrop-blur-sm"
          title="Ver Participantes"
        >
          <ChevronRight size={24} className="rotate-180 group-hover:-translate-x-0.5 transition-transform" />
        </button>
      )}

      {/* Overlay for Drawer */}
      {isParticipantsDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[95] md:hidden"
          onClick={() => setIsParticipantsDrawerOpen(false)}
        />
      )}

      <Modal
        isOpen={activeManagementModal === 'register'}
        onClose={() => setActiveManagementModal('none')}
        maxWidth="max-w-xl"
        noPadding
      >
        <RegistrationPanel
          onRegister={(data, count) => {
            handleRegister(data, count);
            setActiveManagementModal('none');
          }}
          totalParticipants={participants.length}
          totalCards={totalCards}
          cardPrice={cardPrice}
          onClose={() => setActiveManagementModal('none')}
        />
      </Modal>

      <Modal
        isOpen={activeManagementModal === 'prizes'}
        onClose={() => setActiveManagementModal('none')}
        maxWidth="max-w-xl"
        noPadding
      >
        <PrizesPanel
          prizes={prizes}
          onAddPrize={handleAddPrize}
          onEditPrize={handleEditPrize}
          onRemovePrize={handleRemovePrize}
          onTogglePrize={handleTogglePrize}
          onClose={() => setActiveManagementModal('none')}
        />
      </Modal>

      <Modal
        isOpen={activeManagementModal === 'participants'}
        onClose={() => setActiveManagementModal('none')}
        maxWidth="max-w-4xl"
        noPadding
        fullScreenMobile
      >
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
          onRetireCard={handleRetireCard}
          prizes={prizes}
          totalCards={totalCards}
          onClose={() => setActiveManagementModal('none')}
        />
      </Modal>

      <Modal
        isOpen={activeManagementModal === 'settings'}
        onClose={() => setActiveManagementModal('none')}
        maxWidth="max-w-2xl"
      >
        <EditTitleModal
          currentTitle={bingoTitle}
          currentSubtitle={bingoSubtitle}
          currentPrice={cardPrice}
          onSave={(t, s, p) => {
            handleSaveSettings(t, s, p);
            setActiveManagementModal('none');
          }}
          onClose={() => setActiveManagementModal('none')}
        />
      </Modal>

      <Modal
        isOpen={activeManagementModal === 'connection'}
        onClose={() => setActiveManagementModal('none')}
        maxWidth="max-w-2xl"
      >
        <ConnectionModal
          currentUrl={sheetUrl}
          currentAutoSync={autoSync}
          currentInterval={syncInterval}
          onSave={(url, newAutoSync, newInterval) => {
            setSheetUrl(url);
            setAutoSync(newAutoSync);
            setSyncInterval(newInterval);
            // Sync to cloud as requested
            handleSaveSettings(undefined, undefined, undefined, url);
            setActiveManagementModal('none');
            // Recargar si ya autenticado
            if (isAuthenticated) loadFromCloud(false);
          }}
          onClose={() => setActiveManagementModal('none')}
          onSyncNow={() => loadFromCloud(false)}
        />
      </Modal>



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
          onRetireCard={() => handleRetireCard(viewingDetailsData.participant.id, viewingDetailsData.card.id)}
          prizes={prizes}
          allWinners={winners}
        />
      )}

      <header className="bg-slate-900 border-b border-slate-800 py-3 px-6 flex items-center justify-between shadow-lg sticky top-0 z-20 h-14">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowManagementMenu(true)}
            className={`p-1.5 rounded-lg transition-colors border border-slate-700 bg-slate-800 text-cyan-400 hover:text-white hover:border-cyan-500/50`}
          >
            <Menu size={20} />
          </button>

          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600 leading-none uppercase">
              {bingoTitle}
            </h1>
            <span className="text-[10px] text-slate-500 font-medium leading-tight">{bingoSubtitle}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-3">
            {sheetUrl && (
              <button
                onClick={() => !isSyncing && loadFromCloud(false)}
                disabled={isSyncing}
                className={`p-1.5 rounded-lg bg-slate-800 border border-slate-700 transition-all ${isSyncing ? 'text-amber-500 bg-amber-500/10' : 'hover:bg-slate-700 text-slate-400 hover:text-emerald-400'}`}
                title={isSyncing ? "Sincronizando..." : "Forzar actualización desde Hoja de Cálculo"}
              >
                <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
              </button>
            )}

            <button onClick={toggleFullScreen} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700">
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>

            <button onClick={handleLogout} className="p-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 border border-rose-900/50 ml-2" title="Cerrar Sesión">
              <LogOut size={18} />
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
          >
            {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Mobile Menu Dropdown */}
          {showMobileMenu && (
            <div className="absolute top-16 right-4 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-4 flex flex-col gap-3 z-50 md:hidden">


              <button
                onClick={() => { toggleFullScreen(); setShowMobileMenu(false); }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 w-full"
              >
                {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                <span>{isFullscreen ? 'Salir Pantalla Completa' : 'Pantalla Completa'}</span>
              </button>

              <div className="h-px bg-slate-800 my-1"></div>
              {sheetUrl && (
                <button
                  onClick={() => { if (!isSyncing) loadFromCloud(false); }}
                  disabled={isSyncing}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg border w-full transition-all ${isSyncing ? 'bg-amber-900/40 text-amber-400 border-amber-500/50' : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-emerald-400 border-slate-700'}`}
                >
                  <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
                  <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Ahora'}</span>
                </button>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 border border-rose-900/50 w-full"
              >
                <LogOut size={18} />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 p-4 max-w-[1920px] mx-auto w-full flex flex-col items-center justify-center transition-all duration-300">
        <section className="w-full max-w-[1600px]">
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
            winners={winners}
            onViewWinner={handleViewDetailsFromSummary}
          />
        </section>
      </main>
    </div>
  );
};

export default App;
