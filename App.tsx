import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Participant, GameState, Winner, TOTAL_BALLS, NUMBERS_PER_CARD } from './types.ts';
import { generateUniqueRandomNumbers, generateId, checkWinners } from './utils/helpers.ts';
import { exportToExcel, parseExcel, downloadCardImage, downloadAllCardsZip } from './services/exportService.ts';
import RegistrationPanel from './components/RegistrationPanel.tsx';
import GamePanel from './components/GamePanel.tsx';
import ParticipantsPanel from './components/ParticipantsPanel.tsx';
import WinnerModal from './components/WinnerModal.tsx';

// LocalStorage Keys
const LS_KEYS = {
  PARTICIPANTS: 'bingo_participants_v1',
  GAME_STATE: 'bingo_gamestate_v1',
  WINNERS: 'bingo_winners_v1'
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

  const [gameState, setGameState] = useState<GameState>(() => 
    loadFromStorage(LS_KEYS.GAME_STATE, {
      drawnBalls: [],
      history: [],
      lastCardSequence: 100
    })
  );

  const [winners, setWinners] = useState<Winner[]>(() => 
    loadFromStorage(LS_KEYS.WINNERS, [])
  );
  
  // Cola de visualización de ganadores (para mostrar popups uno por uno)
  // Esta no necesita persistencia estricta, puede reiniciar vacía al recargar
  const [winnerQueue, setWinnerQueue] = useState<Winner[]>([]);

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

  // --- Actions ---

  const addLog = (msg: string) => {
    setGameState(prev => ({
      ...prev,
      history: [...prev.history, `${new Date().toLocaleTimeString()}: ${msg}`]
    }));
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
        numbers: generateUniqueRandomNumbers(NUMBERS_PER_CARD, 1, TOTAL_BALLS)
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
            numbers: generateUniqueRandomNumbers(NUMBERS_PER_CARD, 1, TOTAL_BALLS)
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

    // Generate Logs based on hits
    const time = new Date().toLocaleTimeString();
    const newLogs: string[] = [];
    let hitFound = false;

    participants.forEach(p => {
      p.cards.forEach(c => {
        if (c.numbers.includes(newBall)) {
          hitFound = true;
          newLogs.push(`${time}: ${p.name} ${p.surname} marcó ${newBall} en ${c.id}`);
        }
      });
    });

    // If no one had the ball, show generic message
    if (!hitFound) {
      newLogs.push(`${time}: Bolilla N° ${newBall} salió`);
    }

    setGameState(prev => ({
      ...prev,
      drawnBalls: [...prev.drawnBalls, newBall],
      history: [...prev.history, ...newLogs]
    }));

    // Check winners immediately
    // We pass the updated list of balls manually because state update is async
    const updatedBalls = [...gameState.drawnBalls, newBall];
    const newWinners = checkWinners(participants, updatedBalls, winners);

    if (newWinners.length > 0) {
      setWinners(prev => [...prev, ...newWinners]);
      
      // Agregar nuevos ganadores a la cola de visualización
      setWinnerQueue(prev => [...prev, ...newWinners]);

      newWinners.forEach(w => addLog(`🏆 BINGO! Ganador: ${w.participantName} (${w.cardId})`));
      
      // Confetti effect
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#3b82f6']
      });
    }
  };

  const handleNextWinner = () => {
    // Remove the first winner from the queue
    setWinnerQueue(prev => prev.slice(1));
  };

  const handleReset = () => {
    if (!window.confirm("¿Reiniciar el sorteo? Esto borrará el progreso actual, pero mantendrá los participantes.")) return;
    setGameState(prev => ({
      ...prev,
      drawnBalls: [],
      history: [...prev.history, '--- RESETEO DEL SORTEO ---']
    }));
    setWinners([]);
    setWinnerQueue([]);
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
    if (card) downloadCardImage(p, card);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Winner Modals System */}
      {winnerQueue.length > 0 && (
        <WinnerModal 
          winner={winnerQueue[0]} 
          onClose={handleNextWinner} 
          remaining={winnerQueue.length - 1}
        />
      )}

      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 py-4 px-6 flex items-center justify-between shadow-lg sticky top-0 z-20">
        <div>
          <h1 className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600">
            VIRTUAL BINGO PRO
          </h1>
          <p className="text-xs text-slate-500 font-medium">Sistema de Gestión de Sorteos</p>
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-xs text-slate-400">Desarrollado por</div>
          <div className="text-sm font-semibold text-slate-200">Ing. Jordan Chacón Villacís</div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 p-4 md:p-6 max-w-[1920px] mx-auto w-full grid grid-cols-1 xl:grid-cols-[350px_1fr_400px] gap-6">
        
        {/* Left: Registration */}
        <section className="flex flex-col gap-6">
          <RegistrationPanel 
            onRegister={handleRegister}
            onImport={handleImport}
            onExport={() => exportToExcel(participants)}
            onGenerateAllImages={() => downloadAllCardsZip(participants)}
            totalParticipants={participants.length}
          />
          
          {/* Instructions Mini Panel */}
          <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-4 text-xs text-slate-500">
            <h4 className="font-bold text-slate-400 mb-2">Atajos rápidos</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Usa Excel para carga masiva.</li>
              <li>El sorteo guarda estado automáticamente.</li>
              <li>Descarga cartones antes de empezar.</li>
            </ul>
          </div>
        </section>

        {/* Center: Game */}
        <section className="h-auto min-h-[500px]">
          <GamePanel 
            drawnBalls={gameState.drawnBalls}
            onDrawBall={handleDrawBall}
            onReset={handleReset}
            historyLog={gameState.history}
            hasParticipants={participants.length > 0}
          />
        </section>

        {/* Right: Participants & Winners */}
        <section className="h-[600px] xl:h-[calc(100vh-140px)]">
          <ParticipantsPanel 
            participants={participants}
            drawnBalls={gameState.drawnBalls}
            winners={winners}
            onAddCard={handleAddCard}
            onDeleteCard={handleDeleteCard}
            onDownloadCard={handleDownloadCard}
            onEditParticipant={handleEditParticipant}
            onDeleteParticipant={handleDeleteParticipant}
          />
        </section>

      </main>
    </div>
  );
};

export default App;