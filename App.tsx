
import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Participant, GameState, Winner, TOTAL_BALLS, NUMBERS_PER_CARD, BingoCard, PatternKey, Prize } from './types.ts';
import { generateBingoCardNumbers, generateId, checkWinners, WIN_PATTERNS } from './utils/helpers.ts';
import { exportToExcel, parseExcel, downloadCardImage, downloadAllCardsZip } from './services/exportService.ts';
import RegistrationPanel from './components/RegistrationPanel.tsx';
import GamePanel from './components/GamePanel.tsx';
import ParticipantsPanel from './components/ParticipantsPanel.tsx';
import WinnerModal from './components/WinnerModal.tsx';
import WinnerDetailsModal from './components/WinnerDetailsModal.tsx';
import PrizesPanel from './components/PrizesPanel.tsx';
import EditTitleModal from './components/EditTitleModal.tsx';
import { Maximize2, Minimize2, PanelLeftClose, PanelLeftOpen, Edit } from 'lucide-react';

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
      selectedPattern: 'FULL' as PatternKey
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
  const [showSidebar, setShowSidebar] = useState(true);

  // --- Persistence (Solo Guardar) ---
  // Como el estado inicial YA tiene los datos cargados, estos efectos no sobrescribirán con vacíos.

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

  // Listen for fullscreen changes (e.g. user presses ESC)
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
    // Validación simple de duplicados al registrar manualmente
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
        numbers: generateBingoCardNumbers() // NEW 5x5 GENERATOR
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
    
    const confirmMsg = "¡PELIGRO! ESTA ACCIÓN ES IRREVERSIBLE.\n\n¿Estás seguro de que deseas ELIMINAR A TODOS LOS PARTICIPANTES y sus cartones?\n\nSe perderá todo el registro de jugadores.";
    
    if (window.confirm(confirmMsg)) {
      // Doble confirmación para seguridad
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
            numbers: generateBingoCardNumbers() // NEW 5x5 GENERATOR
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
      alert("¡Atención! No hay participantes registrados.\nPor favor, registra al menos un jugador antes de sacar una bolilla.");
      return;
    }

    const available = Array.from({ length: TOTAL_BALLS }, (_, i) => i + 1)
      .filter(n => !gameState.drawnBalls.includes(n));
    
    if (available.length === 0) {
      alert("¡Se han sorteado todas las bolillas!");
      return;
    }

    // The actual random selection happens here, though visual animation is in GamePanel
    // To sync with visual, GamePanel calls this after animation
    const randomIndex = Math.floor(Math.random() * available.length);
    const newBall = available[randomIndex];

    // Generate Logs based on hits specific to the current PATTERN
    const time = new Date().toLocaleTimeString();
    const newLogs: string[] = [];
    
    // Obtener los índices requeridos por el patrón actual
    const patternIndices = WIN_PATTERNS[gameState.selectedPattern].indices;
    let relevantHitFound = false;

    participants.forEach(p => {
      p.cards.forEach(c => {
        // Encontramos en qué posición (0-24) está la bolilla en este cartón
        const ballIndexOnCard = c.numbers.indexOf(newBall);
        
        // Si el número existe en el cartón (index != -1) Y esa posición es requerida por el patrón actual
        if (ballIndexOnCard !== -1 && patternIndices.includes(ballIndexOnCard)) {
          relevantHitFound = true;
          newLogs.push(`${time}: ${p.name} ${p.surname} acertó la bolilla N° ${newBall} en el cartón ${c.id}`);
        }
      });
    });

    // If no one had the ball in a relevant position
    if (!relevantHitFound) {
      newLogs.push(`${time}: Bolilla N° ${newBall} fue sorteada`);
    }

    setGameState(prev => ({
      ...prev,
      drawnBalls: [...prev.drawnBalls, newBall],
      history: [...prev.history, ...newLogs]
    }));

    // Check winners immediately
    // We pass the updated list of balls manually because state update is async
    const updatedBalls = [...gameState.drawnBalls, newBall];
    const newWinners = checkWinners(participants, updatedBalls, winners, gameState.selectedPattern);

    if (newWinners.length > 0) {
      setWinners(prev => [...prev, ...newWinners]);
      
      // Show the summary modal with the batch of new winners
      setCurrentBatchWinners(newWinners);

      newWinners.forEach(w => addLog(`🏆 BINGO! Ganador (${gameState.selectedPattern}): ${w.participantName} (${w.cardId})`));
      
      // Confetti effect
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#3b82f6']
      });
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
        alert("Cartón no encontrado");
      }
    } else {
      alert("Participante no encontrado");
    }
  };

  const handleReset = () => {
    if (!window.confirm("¿Reiniciar el sorteo? Esto borrará el progreso actual, pero mantendrá los participantes.")) return;
    setGameState(prev => ({
      ...prev,
      drawnBalls: [],
      history: []
    }));
    setWinners([]);
    setCurrentBatchWinners([]);
  };

  const handleImport = async (file: File) => {
    try {
      const imported = await parseExcel(file);

      // 1. Crear un conjunto de DNIs existentes para búsqueda rápida
      const existingDNIs = new Set(participants.map(p => String(p.dni).trim().toLowerCase()));
      
      // 2. Filtrar los importados que ya existen
      const uniqueNewParticipants = imported.filter(p => {
        const importedDni = String(p.dni).trim().toLowerCase();
        // Solo importamos si NO existe en el conjunto actual
        return !existingDNIs.has(importedDni);
      });

      const duplicatesCount = imported.length - uniqueNewParticipants.length;

      if (uniqueNewParticipants.length === 0) {
        alert(`No se importaron participantes.\nSe detectaron ${duplicatesCount} registros que ya existen en el sistema (basado en DNI).`);
        return;
      }

      // 3. Mensaje de confirmación inteligente
      let confirmMessage = "";
      if (duplicatesCount > 0) {
        confirmMessage = `Se encontraron ${imported.length} registros en el archivo:\n` +
                         `• ${uniqueNewParticipants.length} nuevos participantes\n` +
                         `• ${duplicatesCount} duplicados (serán omitidos)\n\n` +
                         `¿Deseas importar los ${uniqueNewParticipants.length} nuevos?`;
      } else {
        confirmMessage = `Se encontraron ${uniqueNewParticipants.length} participantes nuevos. ¿Deseas importarlos?`;
      }

      if (window.confirm(confirmMessage)) {
        setParticipants(prev => [...prev, ...uniqueNewParticipants]);
        
        // Actualizar la secuencia de cartones para evitar IDs duplicados
        let maxSeq = gameState.lastCardSequence;
        uniqueNewParticipants.forEach(p => p.cards.forEach(c => {
           const num = parseInt(c.id.replace(/\D/g, ''));
           if (!isNaN(num) && num > maxSeq) maxSeq = num;
        }));
        
        setGameState(prev => ({ ...prev, lastCardSequence: maxSeq }));
        addLog(`Importados ${uniqueNewParticipants.length} participantes (omitidos ${duplicatesCount} duplicados)`);
      }
    } catch (e) {
      console.error(e);
      alert("Error al importar el archivo. Asegúrate de que el formato sea correcto.");
    }
  };

  const handleDownloadCard = (p: Participant, cid: string) => {
    const card = p.cards.find(c => c.id === cid);
    if (card) downloadCardImage(p, card, bingoTitle, bingoSubtitle);
  };

  // --- Prizes Handlers ---
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
    if (window.confirm('¿Eliminar este premio?')) {
      setPrizes(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleTogglePrize = (id: string) => {
    setPrizes(prev => prev.map(p => p.id === id ? { ...p, isAwarded: !p.isAwarded } : p));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      
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

      {/* 1. Modal Resumen de Ganadores (Aparece cuando alguien gana) */}
      {currentBatchWinners.length > 0 && (
        <WinnerModal 
          winners={currentBatchWinners} 
          onClose={handleCloseWinnerModal} 
          onViewDetails={handleViewDetailsFromSummary}
        />
      )}

      {/* 2. Modal Detalle (Aparece al dar clic en el Ojo desde el Resumen o desde el Panel) */}
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
        />
      )}

      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 py-3 px-6 flex items-center justify-between shadow-lg sticky top-0 z-20 h-14">
        <div className="flex items-center gap-4">
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
               title="Personalizar Título y Descripción"
             >
               <Edit size={18} />
             </button>

             <button 
               onClick={() => setShowSidebar(!showSidebar)}
               className={`p-1.5 rounded-lg transition-colors border border-slate-700 ${showSidebar ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-cyan-900/30 text-cyan-400 border-cyan-800'}`}
               title={showSidebar ? "Ocultar Panel de Registro" : "Mostrar Panel de Registro"}
             >
               {showSidebar ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
             </button>

             <button 
               onClick={toggleFullScreen}
               className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
               title={isFullscreen ? "Salir de Pantalla Completa" : "Pantalla Completa"}
             >
               {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
             </button>
           </div>
        </div>
      </header>

      {/* Main Layout 
          - Adjusted grid columns to increase Participants Panel width for 1366px and larger screens
          - Sticky sidebars
      */}
      <main className={`flex-1 p-4 max-w-[1920px] mx-auto w-full grid grid-cols-1 gap-4 transition-all duration-300 items-start ${
        showSidebar 
          ? 'xl:grid-cols-[240px_1fr_360px] 2xl:grid-cols-[320px_1fr_500px]' 
          : 'xl:grid-cols-[1fr_360px] 2xl:grid-cols-[1fr_500px]'
      }`}>
        
        {/* Left: Registration & Tools */}
        {showSidebar && (
          <section className="flex flex-col gap-4 animate-in slide-in-from-left duration-300 fade-in xl:sticky xl:top-20 xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto custom-scrollbar pr-1">
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
            
            {/* Instructions Mini Panel */}
            <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-3 text-[11px] text-slate-500">
              <h4 className="font-bold text-slate-400 mb-1 text-[12px]">Atajos rápidos</h4>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Usa Excel para carga masiva.</li>
                <li>El sorteo guarda estado automáticamente.</li>
              </ul>
            </div>
          </section>
        )}

        {/* Center: Game */}
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
          />
        </section>

        {/* Right: Participants & Winners 
            - Sticky right sidebar
        */}
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
          />
        </section>

      </main>
    </div>
  );
};

export default App;
