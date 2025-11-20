
import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Participant, GameState, Winner, TOTAL_BALLS, NUMBERS_PER_CARD, BingoCard, PatternKey, Prize } from './types.ts';
import { generateBingoCardNumbers, generateId, checkWinners, WIN_PATTERNS } from './utils/helpers.ts';
import { exportToExcel, parseExcel, downloadCardImage, downloadAllCardsZip, generateBingoCardsPDF } from './services/exportService.ts';
import RegistrationPanel from './components/RegistrationPanel.tsx';
import GamePanel from './components/GamePanel.tsx';
import ParticipantsPanel from './components/ParticipantsPanel.tsx';
import WinnerModal from './components/WinnerModal.tsx';
import WinnerDetailsModal from './components/WinnerDetailsModal.tsx';
import PrizesPanel from './components/PrizesPanel.tsx';
import EditTitleModal from './components/EditTitleModal.tsx';
import { Maximize2, Minimize2, PanelLeftClose, PanelLeftOpen, Edit, X } from 'lucide-react';
import { useAlert } from './contexts/AlertContext.tsx';

// LocalStorage Keys
const LS_KEYS = {
  PARTICIPANTS: 'bingo_participants_v1',
  GAME_STATE: 'bingo_gamestate_v1',
  WINNERS: 'bingo_winners_v1',
  PRIZES: 'bingo_prizes_v1',
  TITLE: 'bingo_title_v1',
  SUBTITLE: 'bingo_subtitle_v1'
};

// Helper para cargar datos de forma segura (evita errores si el JSON está corrupto)
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

  // --- Persistence ---
  useEffect(() => { localStorage.setItem(LS_KEYS.PARTICIPANTS, JSON.stringify(participants)); }, [participants]);
  useEffect(() => { localStorage.setItem(LS_KEYS.GAME_STATE, JSON.stringify(gameState)); }, [gameState]);
  useEffect(() => { localStorage.setItem(LS_KEYS.WINNERS, JSON.stringify(winners)); }, [winners]);
  useEffect(() => { localStorage.setItem(LS_KEYS.PRIZES, JSON.stringify(prizes)); }, [prizes]);
  useEffect(() => { localStorage.setItem(LS_KEYS.TITLE, JSON.stringify(bingoTitle)); }, [bingoTitle]);
  useEffect(() => { localStorage.setItem(LS_KEYS.SUBTITLE, JSON.stringify(bingoSubtitle)); }, [bingoSubtitle]);

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

  const handleRegister = (data: Omit<Participant, 'id' | 'cards'>, cardsCount: number) => {
    const isDuplicate = participants.some(p => p.dni.trim().toLowerCase() === data.dni.trim().toLowerCase());
    if (isDuplicate) {
      showAlert({ title: 'DNI Duplicado', message: `Ya existe un participante con el DNI ${data.dni}.`, type: 'warning' });
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

    setParticipants(prev => [newParticipant, ...prev]);
    setGameState(prev => ({ ...prev, lastCardSequence: currentSeq }));
    addLog(`Registrado ${newParticipant.name} con ${cardsCount} cartones`);
  };

  const handleEditParticipant = (id: string, data: { name: string, surname: string, dni: string, phone: string }) => {
    setParticipants(prev => prev.map(p =>
      p.id === id ? { ...p, ...data } : p
    ));
    addLog(`Participante editado: ${data.name} ${data.surname}`);
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
        message: `¿Estás seguro de eliminar a ${p.name} ${p.surname}?\nSe eliminarán también sus cartones.`,
        type: 'danger',
        confirmText: 'Sí, eliminar'
    });

    if (confirmed) {
      setParticipants(prev => prev.filter(p => p.id !== id));
      addLog(`Participante eliminado: ${p.name} ${p.surname}`);
    }
  };

  const handleDeleteAllParticipants = async () => {
    if (participants.length === 0) return;

    if (winners.length > 0) {
       await showAlert({ title: 'Acción Denegada', message: "No puedes borrar a todos porque existen ganadores. Debes resetear el evento primero.", type: 'danger' });
       return;
    }

    const gameInProgress = gameState.drawnBalls.length > 0;
    if (gameInProgress && !gameState.isPaused) {
       await showAlert({ title: 'Juego en Curso', message: `Debes PAUSAR o RESETEAR el sorteo antes de eliminar masivamente.`, type: 'warning' });
       return;
    }

    const confirmed1 = await showConfirm({
        title: '¡PELIGRO!',
        message: "Esta acción ELIMINARÁ A TODOS los participantes y sus cartones.\n¿Estás seguro?",
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
      }
    }
  };

  const handleAddCard = (participantId: string) => {
    const newSeq = gameState.lastCardSequence + 1;
    const newCardId = `C${newSeq.toString().padStart(4, '0')}`;

    setGameState(prev => ({ ...prev, lastCardSequence: newSeq }));

    setParticipants(prev => prev.map(p => {
      if (p.id === participantId) {
        return {
          ...p,
          cards: [{
            id: newCardId,
            numbers: generateBingoCardNumbers()
          }, ...p.cards]
        };
      }
      return p;
    }));
  };

  const handleDeleteCard = async (participantId: string, cardId: string) => {
    const gameInProgress = gameState.drawnBalls.length > 0;
    if (gameInProgress && !gameState.isPaused) {
       await showAlert({ title: 'Pausa Requerida', message: `Para eliminar cartones durante el juego, primero debes PAUSAR.`, type: 'warning' });
       return;
    }

    const isWinningCard = winners.some(w => w.cardId === cardId);
    
    let message = `¿Seguro que deseas eliminar el cartón #${cardId}?`;
    let title = 'Eliminar Cartón';
    let type: 'danger' | 'warning' = 'danger';
    
    if (isWinningCard) {
       title = '¿Eliminar Cartón Ganador?';
       // Combinamos el aviso con la confirmación en un solo paso
       message = `⚠️ ESTE CARTÓN ES UN GANADOR.\n\nEliminarlo lo borrará del participante, pero el registro del premio histórico se mantendrá intacto.\n\n¿Estás seguro de eliminar el cartón #${cardId}?`;
       type = 'warning';
    }

    const confirmed = await showConfirm({
        title: title,
        message: message,
        type: type,
        confirmText: 'Sí, eliminar',
        cancelText: 'Cancelar'
    });

    if (!confirmed) return;
    setParticipants(prev => prev.map(p => {
      if (p.id === participantId) {
        return {
          ...p,
          cards: p.cards.filter(c => c.id !== cardId)
        };
      }
      return p;
    }));

    if (isWinningCard) {
      addLog(`Cartón ganador #${cardId} eliminado manualmente del participante ${participantId}.`);
    }
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
        if (c.isInvalid) return; // Skip invalid cards
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
    // 1. Remove from current winners view
    const remainingInBatch = currentBatchWinners.filter(w => 
       !(w.cardId === invalidWinner.cardId && w.timestamp === invalidWinner.timestamp)
    );

    // 2. Remove from historical winners list
    setWinners(prev => prev.filter(w => 
       !(w.cardId === invalidWinner.cardId && w.timestamp === invalidWinner.timestamp)
    ));

    // 3. MARK THE CARD AS INVALID IN THE PARTICIPANTS LIST
    // This ensures checkWinners will ignore this card in the future
    setParticipants(prev => prev.map(p => {
       if (p.id === invalidWinner.participantId) {
          return {
             ...p,
             cards: p.cards.map(c => 
                c.id === invalidWinner.cardId ? { ...c, isInvalid: true } : c
             )
          };
       }
       return p;
    }));

    if (remainingInBatch.length > 0) {
       setCurrentBatchWinners(remainingInBatch);
       addLog(`⚠️ Ganador invalidado: ${invalidWinner.participantName} (Cartón ${invalidWinner.cardId} ANULADO).`);
    } else {
       // Si era el único ganador, liberamos el premio y REANUDAMOS el juego.
       if (invalidWinner.prizeId) {
          setPrizes(prev => prev.map(p => 
             p.id === invalidWinner.prizeId ? { ...p, isAwarded: false } : p
          ));
          addLog(`↩️ Premio "${invalidWinner.prizeName}" liberado.`);
       }
       
       setGameState(prev => ({
          ...prev,
          // NO reseteamos las bolillas ni el patrón, solo desbloqueamos para seguir jugando
          history: [...prev.history, `🚫 Ganador invalidado: ${invalidWinner.participantName}. Cartón ${invalidWinner.cardId} ANULADO. Sorteo reanudado.`],
          roundLocked: false
       }));
       setCurrentBatchWinners([]);
       addLog("⚠️ Ganador invalidado y cartón anulado. Continúa sacando bolillas para encontrar al siguiente ganador.");
    }
  };

  const handleCloseWinnerModal = () => {
    setCurrentBatchWinners([]);
  };

  const handleViewDetailsFromSummary = (winner: Winner) => {
    const participant = participants.find(p => p.id === winner.participantId);
    if (participant) {
      const card = participant.cards.find(c => c.id === winner.cardId);
      if (card) {
        setViewingDetailsData({ winner, participant, card });
      } else {
        showAlert({ message: "Cartón no encontrado", type: 'danger' });
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
           message: "Se borrarán las bolillas pero se mantendrán los ganadores anteriores.\n¿Iniciar sorteo por el siguiente premio?",
           confirmText: 'Sí, siguiente ronda',
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
       addLog("🔄 Iniciando nueva ronda para el siguiente premio.");
       return;
    }

    const confirmed = await showConfirm({
        title: totalPrizes > 0 ? '¡Resetear Evento Completo!' : 'Resetear Sorteo',
        message: totalPrizes > 0 
           ? "Todos los premios han sido entregados.\n¿Deseas BORRAR TODO (ganadores, bolillas, historial) para iniciar un evento nuevo?"
           : "¿Reiniciar el sorteo? Se borrará el progreso actual y la lista de ganadores.",
        type: 'danger',
        confirmText: 'Sí, BORRAR TODO'
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
    
    // Reset invalid status on cards if full reset
    if (totalPrizes > 0 || confirmed) {
       setParticipants(prev => prev.map(p => ({
          ...p,
          cards: p.cards.map(c => ({ ...c, isInvalid: false })) // Restore cards for new event
       })));
    }
    
    if (totalPrizes > 0) {
       setPrizes([]); 
       addLog("♻️ Evento finalizado y reseteado completamente.");
    } else {
       addLog("♻️ Juego reseteado.");
    }
  };

  const handleImport = async (file: File) => {
    try {
      const imported = await parseExcel(file);
      const existingDNIs = new Set(participants.map(p => String(p.dni).trim().toLowerCase()));
      
      const uniqueNewParticipants = imported.filter(p => {
        const importedDni = String(p.dni).trim().toLowerCase();
        return !existingDNIs.has(importedDni);
      });

      const duplicatesCount = imported.length - uniqueNewParticipants.length;

      if (uniqueNewParticipants.length === 0) {
        await showAlert({ title: 'Importación Fallida', message: `No se importaron participantes. ${duplicatesCount} duplicados detectados.`, type: 'warning' });
        return;
      }

      const confirmed = await showConfirm({
          title: 'Confirmar Importación',
          message: `Se importarán ${uniqueNewParticipants.length} nuevos participantes.\n(${duplicatesCount} duplicados ignorados).`,
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
        addLog(`Importados ${uniqueNewParticipants.length} participantes.`);
      }
    } catch (e) {
      console.error(e);
      showAlert({ title: 'Error', message: "Error al leer el archivo Excel.", type: 'danger' });
    }
  };

  const handleDownloadCard = async (p: Participant, cid: string) => {
    const card = p.cards.find(c => c.id === cid);
    if (!card) return;
    try {
      await downloadCardImage(p, card, bingoTitle, bingoSubtitle);
    } catch (e) { console.error(e); showAlert({ message: "Error al generar imagen", type: 'danger' }); }
  };

  const openWhatsApp = (phone: string, text: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const url = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${text}`;
    const win = window.open(url, 'whatsapp_bingo_app');
    if (win) win.focus();
  };

  const handleShareCard = async (p: Participant, cid: string) => {
    if (!p.phone) return;
    const card = p.cards.find(c => c.id === cid);
    if (!card) return;
    addLog(`Generando PDF para ${p.name}...`);
    try {
        await generateBingoCardsPDF(p, bingoTitle, bingoSubtitle, cid);
        const message = `Hola ${p.name.toUpperCase()}, tu cartón de Bingo Virtual #${card.id} 📄\n\n¡Suerte! 🎱`;
        setTimeout(() => openWhatsApp(p.phone!, encodeURIComponent(message)), 1000);
    } catch (e) { console.error(e); showAlert({ message: "Error generando PDF", type: 'danger' }); }
  };

  const handleShareAllCards = async (p: Participant) => {
    if (!p.phone || p.cards.length === 0) return;
    if (p.cards.length > 10) {
        const confirm = await showConfirm({ title: 'Muchos Cartones', message: `¿Seguro que quieres generar ${p.cards.length} cartones?`, type: 'warning' });
        if (!confirm) return;
    }
    addLog(`Generando PDF masivo para ${p.name}...`);
    try {
      await generateBingoCardsPDF(p, bingoTitle, bingoSubtitle);
      const message = `Hola ${p.name.toUpperCase()}, tus ${p.cards.length} cartones de Bingo Virtual 📄\n\n¡Suerte! 🎱`;
      setTimeout(() => openWhatsApp(p.phone!, encodeURIComponent(message)), 1000);
    } catch (error) { console.error(error); showAlert({ message: "Error generando PDF", type: 'danger' }); }
  };

  const handleAddPrize = (name: string, description: string) => {
    setPrizes(prev => [...prev, {
      id: generateId('PR'),
      name,
      description,
      isAwarded: false
    }]);
  };

  const handleEditPrize = (id: string, name: string, description: string) => {
    setPrizes(prev => prev.map(p => p.id === id ? { ...p, name, description } : p));
  };

  const handleRemovePrize = async (id: string) => {
    const prizeToRemove = prizes.find(p => p.id === id);
    if (prizeToRemove && prizeToRemove.isAwarded) {
       await showAlert({ title: 'Acción Bloqueada', message: "No se puede eliminar un premio que ya ha sido entregado.", type: 'danger' });
       return;
    }

    const lastPrize = prizes.length > 0 ? prizes[prizes.length - 1] : null;
    if (lastPrize && lastPrize.isAwarded) {
       await showAlert({ title: 'Evento Finalizado', message: "El último premio ya ha sido entregado. No es posible eliminar premios.", type: 'warning' });
       return;
    }
    
    const confirmed = await showConfirm({ title: 'Eliminar Premio', message: "¿Estás seguro de eliminar este premio?", type: 'danger' });
    if (confirmed) {
      setPrizes(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleTogglePrize = async (id: string) => {
    const prize = prizes.find(p => p.id === id);
    if (!prize) return;

    if (!prize.isAwarded) {
       await showAlert({ title: 'Acción Manual No Permitida', message: "Los premios se entregan AUTOMÁTICAMENTE al detectar un ganador y confirmar el sorteo.", type: 'warning' });
    } else {
       await showAlert({ title: 'Premio Cerrado', message: "Este premio ya fue entregado. Para revertirlo, debes INVALIDAR al ganador desde el panel de victoria.", type: 'info' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
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
            <button onClick={() => setShowSidebar(false)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors border border-transparent hover:border-slate-700">
              <X size={22} />
            </button>
         </div>

         <div className="flex-1 flex flex-col gap-6 min-h-0">
            <RegistrationPanel 
              onRegister={handleRegister}
              onImport={handleImport}
              onExport={() => exportToExcel(participants)}
              onGenerateAllImages={() => downloadAllCardsZip(participants, bingoTitle, bingoSubtitle)}
              totalParticipants={participants.length}
            />
            
            <PrizesPanel 
              prizes={prizes}
              onAddPrize={handleAddPrize}
              onEditPrize={handleEditPrize}
              onRemovePrize={handleRemovePrize}
              onTogglePrize={handleTogglePrize}
            />
            
            <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-4 text-xs text-slate-500 mt-auto flex-shrink-0">
              <h4 className="font-bold text-slate-400 mb-2 text-sm">Reglas de Juego</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>La partida dura hasta entregar todos los premios.</li>
                <li>Resetear borra ganadores, bolillas y premios.</li>
              </ul>
            </div>
         </div>
      </aside>

      {showTitleModal && (
        <EditTitleModal
          currentTitle={bingoTitle}
          currentSubtitle={bingoSubtitle}
          onSave={(newTitle, newSubtitle) => {
            setBingoTitle(newTitle);
            setBingoSubtitle(newSubtitle);
            setShowTitleModal(false);
          }}
          onClose={() => setShowTitleModal(false)}
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
               title="Abrir Panel de Registro"
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
        
        <div className="flex items-center gap-6">
           <div className="text-right hidden sm:block">
             <div className="text-[10px] text-slate-400">Desarrollado por</div>
             <div className="text-xs font-semibold text-slate-200">Ing. Jordan Chacón Villacís</div>
           </div>

           <div className="flex items-center gap-2">
             <button 
               onClick={() => setShowTitleModal(true)}
               className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
             >
               <Edit size={18} />
             </button>

             <button 
               onClick={toggleFullScreen}
               className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
             >
               {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
             </button>
           </div>
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
          />
        </section>
      </main>
    </div>
  );
};

export default App;
