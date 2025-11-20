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
  // --- State con Inicialización Perezosa ---
  // Leemos el localStorage DIRECTAMENTE al iniciar. Si existe, se usa; si no, usa el valor por defecto.
  
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
      gameRound: 1 // START AT ROUND 1
    };
    const loaded = loadFromStorage(LS_KEYS.GAME_STATE, defaults);
    // Ensure new property exists if loaded from old state
    return { ...defaults, ...loaded };
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

  // Estado para el modal de RESUMEN de ganadores (cuando salen nuevos ganadores)
  const [currentBatchWinners, setCurrentBatchWinners] = useState<Winner[]>([]);

  // Estado para ver el DETALLE de un ganador (desde el modal resumen o cualquier otro lado)
  const [viewingDetailsData, setViewingDetailsData] = useState<{
    winner: Winner;
    participant: Participant;
    card: BingoCard;
  } | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false); // Default closed for floating behavior

  // --- Persistence (Solo Guardar) ---
  useEffect(() => {
    localStorage.setItem(LS_KEYS.PARTICIPANTS, JSON.stringify(participants));
  }, [participants]);

  useEffect(() => {
    localStorage.setItem(LS_KEYS.GAME_STATE, JSON.stringify(gameState));
  }, [gameState]);

  useEffect(() => {
    localStorage.setItem(LS_KEYS.WINNERS, JSON.stringify(winners));
  }, [winners]);

  useEffect(() => {
    localStorage.setItem(LS_KEYS.PRIZES, JSON.stringify(prizes));
  }, [prizes]);

  useEffect(() => {
    localStorage.setItem(LS_KEYS.TITLE, JSON.stringify(bingoTitle));
  }, [bingoTitle]);

  useEffect(() => {
    localStorage.setItem(LS_KEYS.SUBTITLE, JSON.stringify(bingoSubtitle));
  }, [bingoSubtitle]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  // --- Actions ---

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const addLog = (msg: string) => {
    setGameState(prev => ({
      ...prev,
      history: [...prev.history, `${new Date().toLocaleTimeString()}: ${msg}`]
    }));
  };

  const handlePatternChange = (pattern: PatternKey) => {
    if (gameState.drawnBalls.length > 0) {
       if (!window.confirm("¿Cambiar el patrón a mitad de juego? Esto no afectará las bolillas ya sorteadas, pero cambiará las condiciones de victoria.")) return;
    }
    setGameState(prev => ({ ...prev, selectedPattern: pattern }));
    addLog(`Patrón de victoria cambiado a: ${pattern}`);
  };

  const handleRegister = (data: Omit<Participant, 'id' | 'cards'>, cardsCount: number) => {
    const isDuplicate = participants.some(p => p.dni.trim().toLowerCase() === data.dni.trim().toLowerCase());
    if (isDuplicate) {
      alert(`Ya existe un participante con el DNI ${data.dni}.`);
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

    setParticipants(prev => [...prev, newParticipant]);
    setGameState(prev => ({ ...prev, lastCardSequence: currentSeq }));
    addLog(`Registrado ${newParticipant.name} con ${cardsCount} cartones`);
  };

  const handleEditParticipant = (id: string, data: { name: string, surname: string, dni: string, phone: string }) => {
    setParticipants(prev => prev.map(p =>
      p.id === id ? { ...p, ...data } : p
    ));
    addLog(`Participante editado: ${data.name} ${data.surname}`);
  };

  const handleDeleteParticipant = (id: string) => {
    const p = participants.find(p => p.id === id);
    if (window.confirm(`¿Estás seguro de eliminar a ${p?.name} ${p?.surname}? Se eliminarán también sus cartones.`)) {
      setParticipants(prev => prev.filter(p => p.id !== id));
      addLog(`Participante eliminado: ${p?.name} ${p?.surname}`);
    }
  };

  const handleDeleteAllParticipants = () => {
    if (participants.length === 0) return;
    if (window.confirm("¡PELIGRO! ESTA ACCIÓN ES IRREVERSIBLE.\n\n¿Estás seguro de que deseas ELIMINAR A TODOS LOS PARTICIPANTES y sus cartones?")) {
      if (window.confirm("Confirma por segunda vez: ¿Borrar TODO?")) {
        setParticipants([]);
        addLog("⚠️ Se han eliminado todos los participantes del sistema.");
      }
    }
  };

  const handleAddCard = (participantId: string) => {
    let newCardId = '';
    setGameState(prev => {
       const newSeq = prev.lastCardSequence + 1;
       newCardId = `C${newSeq.toString().padStart(4, '0')}`;
       return { ...prev, lastCardSequence: newSeq };
    });

    setParticipants(prev => prev.map(p => {
      if (p.id === participantId) {
        return {
          ...p,
          cards: [...p.cards, {
            id: newCardId,
            numbers: generateBingoCardNumbers()
          }]
        };
      }
      return p;
    }));
  };

  const handleDeleteCard = (participantId: string, cardId: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar este cartón?")) return;
    setParticipants(prev => prev.map(p => {
      if (p.id === participantId) {
        return {
          ...p,
          cards: p.cards.filter(c => c.id !== cardId)
        };
      }
      return p;
    }));
  };

  const handleDrawBall = () => {
    if (participants.length === 0) {
      alert("¡Atención! No hay participantes registrados.");
      return;
    }
    
    if (gameState.selectedPattern === 'NONE') {
      alert("Debes seleccionar una forma de ganar (patrón) antes de sacar una bolilla.");
      return;
    }

    // 1. Verificar si ya se entregaron todos los premios
    const allPrizesAwarded = prizes.length > 0 && prizes.every(p => p.isAwarded);
    if (allPrizesAwarded) {
       alert("¡JUEGO COMPLETADO!\n\nTodos los premios han sido entregados. Debes resetear el sorteo para iniciar una nueva partida.");
       return;
    }

    const available = Array.from({ length: TOTAL_BALLS }, (_, i) => i + 1)
      .filter(n => !gameState.drawnBalls.includes(n));
    
    if (available.length === 0) {
      alert("¡Se han sorteado todas las bolillas!");
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
    
    // PASS THE CURRENT ROUND to checkWinners to allow same card winning in different rounds
    const potentialWinners = checkWinners(
       participants, 
       updatedBalls, 
       winners, 
       gameState.selectedPattern,
       gameState.gameRound
    );

    if (potentialWinners.length > 0) {
      
      // --- AUTO AWARD LOGIC (Provisional, validated in Modal) ---
      // Detectar el premio activo actual
      const activePrizeIndex = prizes.findIndex(p => !p.isAwarded);
      let currentPrize: Prize | null = null;
      let finalWinners = potentialWinners;

      if (activePrizeIndex !== -1) {
        currentPrize = prizes[activePrizeIndex];
        
        // Asignar el premio a los ganadores (Snapshot)
        finalWinners = potentialWinners.map(w => ({
           ...w,
           prizeId: currentPrize?.id,
           prizeName: currentPrize?.name,
           prizeDescription: currentPrize?.description
        }));

        // Marcar premio como entregado automáticamente (Puede ser revertido en modal)
        setPrizes(prev => {
           const newPrizes = [...prev];
           newPrizes[activePrizeIndex] = { ...newPrizes[activePrizeIndex], isAwarded: true };
           return newPrizes;
        });
        
        // IMPORTANT: Set roundLocked to true.
        setGameState(prev => ({
           ...prev,
           roundLocked: true,
           history: [...prev.history, `🛑 Ronda finalizada. Premio asignado provisionalmente.`]
        }));
        
        addLog(`🎁 Premio Asignado (Pendiente Confirmar): ${currentPrize.name}`);
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

  // --- LOGICA DE VALIDACION DE GANADORES (NUEVA) ---

  const handleConfirmRound = () => {
    // El usuario validó que todo está OK.
    // Acciones: Resetear bolillas, limpiar patrón, incrementar ronda.
    // El premio YA está marcado como entregado (se hizo al detectar ganador), así que lo dejamos así.
    
    setGameState(prev => ({
      ...prev,
      drawnBalls: [], // Reset Bolillas
      history: [...prev.history, "✅ Ronda Confirmada. Preparando siguiente juego."],
      selectedPattern: 'NONE', // Limpiar patrón
      roundLocked: false, // Desbloquear juego
      gameRound: prev.gameRound + 1 // Avanzar ronda interna
    }));
    
    setCurrentBatchWinners([]);
    addLog("✅ Sorteo continuado. Bolillas reseteadas.");
  };

  const handleRejectWinner = (invalidWinner: Winner) => {
    // Determinar si hay otros ganadores en el lote actual (concurrentes)
    const remainingInBatch = currentBatchWinners.filter(w => 
       !(w.cardId === invalidWinner.cardId && w.timestamp === invalidWinner.timestamp)
    );

    // 1. Siempre eliminar al ganador inválido del historial global
    setWinners(prev => prev.filter(w => 
       !(w.cardId === invalidWinner.cardId && w.timestamp === invalidWinner.timestamp)
    ));

    if (remainingInBatch.length > 0) {
       // ESCENARIO: Hay otros ganadores válidos en esta ronda.
       // Acción: Solo eliminar a este ganador, mantener el estado del juego bloqueado/premiado para los demás.
       setCurrentBatchWinners(remainingInBatch);
       addLog(`⚠️ Ganador invalidado: ${invalidWinner.participantName}. Quedan ${remainingInBatch.length} ganadores.`);
    } else {
       // ESCENARIO: Era el único ganador (o el último que quedaba).
       // Acción: Invalidar la ronda completamente.
       
       // 2. Reabrir el premio si fue asignado provisionalmente
       if (invalidWinner.prizeId) {
          setPrizes(prev => prev.map(p => 
             p.id === invalidWinner.prizeId ? { ...p, isAwarded: false } : p
          ));
          addLog(`↩️ Premio "${invalidWinner.prizeName}" reabierto.`);
       }

       // 3. Resetear estado del juego (Void Round)
       setGameState(prev => ({
          ...prev,
          drawnBalls: [],
          history: [...prev.history, `🚫 Ganador invalidado: ${invalidWinner.participantName}. Ronda reiniciada.`],
          selectedPattern: 'NONE',
          roundLocked: false
       }));

       setCurrentBatchWinners([]);
       addLog("⚠️ Ronda invalidada y reiniciada por falta de ganadores válidos.");
    }
  };

  const handleCloseWinnerModal = () => {
    // Fallback close only (should normally use Confirm or Reject)
    // If user clicks outside, we assume they want to review later, but game stays locked.
    setCurrentBatchWinners([]);
  };

  const handleViewDetailsFromSummary = (winner: Winner) => {
    const participant = participants.find(p => p.id === winner.participantId);
    if (participant) {
      const card = participant.cards.find(c => c.id === winner.cardId);
      if (card) {
        setViewingDetailsData({ winner, participant, card });
      } else {
        alert("Cartón no encontrado");
      }
    } else {
      alert("Participante no encontrado");
    }
  };

  const handleReset = () => {
    const pendingPrizesCount = prizes.filter(p => !p.isAwarded).length;
    const totalPrizes = prizes.length;

    // ESCENARIO 1: Aún hay premios por jugar (Siguiente Ronda MANUAL)
    // Esto es si el usuario cerró el modal sin confirmar y quiere resetear manualmente
    if (totalPrizes > 0 && pendingPrizesCount > 0) {
       const confirmMsg = `¿Iniciar Sorteo por el SIGUIENTE PREMIO?\n\nAcciones:\n1. Se borrarán las bolillas sorteadas.\n2. Se mantendrá la lista de ganadores anteriores.\n3. La forma de ganar se reiniciará a vacío.`;
       
       if (!window.confirm(confirmMsg)) return;

       // Resetear estado del juego: Borrar bolillas, Borrar Patrón, Quitar candado
       setGameState(prev => ({
          ...prev,
          drawnBalls: [],
          history: [],
          selectedPattern: 'NONE',
          roundLocked: false,
          gameRound: prev.gameRound + 1 // INCREMENT ROUND TO ALLOW NEW WINNERS
       }));
       setCurrentBatchWinners([]); // Cerrar modal si estaba abierto
       addLog("🔄 Iniciando nueva ronda para el siguiente premio.");
       return;
    }

    // ESCENARIO 2: Reset Total
    const confirmMsg = totalPrizes > 0 
       ? "¡EVENTO COMPLETADO!\n\nTodos los premios han sido entregados.\n¿Deseas BORRAR TODO para iniciar un evento totalmente nuevo?"
       : "¿Reiniciar el sorteo? Se borrará el progreso actual y la lista de ganadores.";

    if (!window.confirm(confirmMsg)) return;

    // Limpieza Total
    setGameState(prev => ({
      ...prev,
      drawnBalls: [],
      history: [],
      selectedPattern: 'NONE',
      roundLocked: false,
      gameRound: 1 // RESET ROUND TO 1
    }));
    setWinners([]);
    setCurrentBatchWinners([]);
    
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
        alert(`No se importaron participantes. ${duplicatesCount} duplicados detectados.`);
        return;
      }

      if (window.confirm(`Importar ${uniqueNewParticipants.length} nuevos participantes? (${duplicatesCount} duplicados)`)) {
        setParticipants(prev => [...prev, ...uniqueNewParticipants]);
        
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
      alert("Error al importar archivo.");
    }
  };

  const handleDownloadCard = async (p: Participant, cid: string) => {
    const card = p.cards.find(c => c.id === cid);
    if (!card) return;
    try {
      await downloadCardImage(p, card, bingoTitle, bingoSubtitle);
    } catch (e) { console.error(e); alert("Error al generar imagen"); }
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
    } catch (e) { console.error(e); alert("Error generando PDF"); }
  };

  const handleShareAllCards = async (p: Participant) => {
    if (!p.phone || p.cards.length === 0) return;
    if (p.cards.length > 10 && !window.confirm("¿Generar muchos cartones?")) return;
    addLog(`Generando PDF masivo para ${p.name}...`);
    try {
      await generateBingoCardsPDF(p, bingoTitle, bingoSubtitle);
      const message = `Hola ${p.name.toUpperCase()}, tus ${p.cards.length} cartones de Bingo Virtual 📄\n\n¡Suerte! 🎱`;
      setTimeout(() => openWhatsApp(p.phone!, encodeURIComponent(message)), 1000);
    } catch (error) { console.error(error); alert("Error generando PDF"); }
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

  const handleRemovePrize = (id: string) => {
    const prizeToRemove = prizes.find(p => p.id === id);
    // Validation: Cannot remove awarded prize
    if (prizeToRemove && prizeToRemove.isAwarded) {
       alert("🚫 ACCIÓN BLOQUEADA\n\nNo se puede eliminar un premio que ya ha sido entregado.");
       return;
    }

    const lastPrize = prizes.length > 0 ? prizes[prizes.length - 1] : null;
    if (lastPrize && lastPrize.isAwarded) {
       alert("🔒 EVENTO FINALIZADO\n\nEl último premio ya ha sido entregado. No es posible eliminar premios.");
       return;
    }
    if (window.confirm('¿Eliminar este premio?')) {
      setPrizes(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleTogglePrize = (id: string) => {
    const prize = prizes.find(p => p.id === id);
    if (!prize) return;

    // LOGICA REQUERIDA: BLOQUEO TOTAL DE MANIPULACIÓN MANUAL DE ESTADO
    
    if (!prize.isAwarded) {
       // Intentar marcar como entregado
       alert("🚫 ACCIÓN MANUAL NO PERMITIDA\n\nLos premios se entregan AUTOMÁTICAMENTE cuando:\n1. El sistema detecta un ganador.\n2. Verificas al ganador.\n3. Confirmas el sorteo.");
       return;
    } else {
       // Intentar desmarcar (ya está entregado)
       alert("🔒 PREMIO CERRADO\n\nEste premio ya fue entregado automáticamente.\n\nSi hubo un error, debes INVALIDAR al ganador desde la alerta de Bingo para revertir el proceso.");
       return;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/70 backdrop-blur-[2px] z-[90] transition-opacity duration-300 ${showSidebar ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setShowSidebar(false)}
      />

      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 h-full w-[320px] bg-slate-900/95 border-r border-slate-800 shadow-2xl z-[100] transform transition-transform duration-300 ease-out overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4 ${showSidebar ? 'translate-x-0' : '-translate-x-full'}`}
      >
         <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-800/50">
            <h3 className="font-bold text-white flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
               Menú de Gestión
            </h3>
            <button onClick={() => setShowSidebar(false)} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
         </div>

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
          
          <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-3 text-[11px] text-slate-500 mt-auto">
            <h4 className="font-bold text-slate-400 mb-1 text-[12px]">Reglas de Juego</h4>
            <ul className="list-disc list-inside space-y-0.5">
              <li>La partida dura hasta entregar todos los premios.</li>
              <li>Resetear borra ganadores, bolillas y premios.</li>
            </ul>
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
          participant={viewingDetailsData.participant}
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

      {/* Header */}
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

      <main className="flex-1 p-4 max-w-[1920px] mx-auto w-full grid grid-cols-1 gap-4 transition-all duration-300 items-start xl:grid-cols-[1fr_360px] 2xl:grid-cols-[1fr_500px]">
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