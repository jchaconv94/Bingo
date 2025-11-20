
import * as XLSX from 'xlsx';
import saveAs from 'file-saver';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import { Participant, BingoCard } from '../types.ts';

// --- Excel Functions ---

export const exportToExcel = (participants: Participant[]) => {
  // Sheet 1: Participants
  const participantsData = participants.map(p => ({
    ID: p.id,
    Nombre: p.name,
    Apellidos: p.surname,
    DNI: p.dni,
    Telefono: p.phone || ''
  }));

  // Sheet 2: Cartones
  const cardsData: any[] = [];
  participants.forEach(p => {
    p.cards.forEach(c => {
      const row: any = {
        ID_Part: p.id,
        ID_Carton: c.id,
      };
      // Filter out the 0 center to save clean data
      const validNumbers = c.numbers.filter(n => n !== 0);
      validNumbers.forEach((num, idx) => {
        row[`N${idx + 1}`] = num;
      });
      cardsData.push(row);
    });
  });

  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.json_to_sheet(participantsData);
  const ws2 = XLSX.utils.json_to_sheet(cardsData);

  XLSX.utils.book_append_sheet(wb, ws1, "Participantes");
  XLSX.utils.book_append_sheet(wb, ws2, "Cartones");

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  saveAs(blob, `bingo_participantes_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const parseExcel = async (file: File): Promise<Participant[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        
        const wsP = wb.Sheets['Participantes'] || wb.Sheets[wb.SheetNames[0]];
        const wsC = wb.Sheets['Cartones'] || wb.Sheets[wb.SheetNames[1]];

        if (!wsP) throw new Error("No se encontró la hoja 'Participantes'");

        const rawPart = XLSX.utils.sheet_to_json(wsP) as any[];
        const rawCards = wsC ? XLSX.utils.sheet_to_json(wsC) as any[] : [];

        const participantsMap = new Map<string, Participant>();

        // Process Participants
        rawPart.forEach(r => {
          const id = r.ID ? String(r.ID) : `P${Math.random().toString(36).substr(2, 6)}`;
          participantsMap.set(id, {
            id,
            name: r.Nombre ? String(r.Nombre) : 'Sin Nombre',
            surname: r.Apellidos ? String(r.Apellidos) : '',
            dni: r.DNI ? String(r.DNI) : '',
            phone: r.Telefono ? String(r.Telefono) : '',
            cards: []
          });
        });

        // Process Cards
        rawCards.forEach(r => {
          const pId = r.ID_Part ? String(r.ID_Part) : null;
          if (!pId) return;

          const participant = participantsMap.get(pId);
          if (participant) {
            const numbers: number[] = [];
            for (let i = 1; i <= 24; i++) {
              const val = parseInt(r[`N${i}`]);
              if (!isNaN(val)) numbers.push(val);
            }
            
            if (numbers.length === 24) {
               numbers.splice(12, 0, 0); // Insert center placeholder
            }

            participant.cards.push({
              id: r.ID_Carton ? String(r.ID_Carton) : `C${Math.random().toString(36).substr(2, 4)}`,
              numbers: numbers
            });
          }
        });

        resolve(Array.from(participantsMap.values()));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

// --- SVG Generation Logic (Vector-Based for High Quality) ---

const generateBingoCardSVG = (participant: Participant, card: BingoCard, title: string, subtitle: string = ""): string => {
  // Dimensions (Aspect Ratio optimized for A4 grid)
  const width = 800;
  const height = 1100;
  const padding = 30; // Reduced global padding
  
  // Colors configuration
  const colConfigs = [
    { bg: '#2563eb', text: '#ffffff', char: 'B' },
    { bg: '#dc2626', text: '#ffffff', char: 'I' },
    { bg: '#e2e8f0', text: '#334155', char: 'N' },
    { bg: '#059669', text: '#ffffff', char: 'G' },
    { bg: '#d97706', text: '#ffffff', char: 'O' }
  ];

  // Utilities
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const nameEsc = esc(`${participant.name} ${participant.surname}`.toUpperCase());
  const dniEsc = esc(participant.dni);

  // Build SVG String
  // Grid Margin X adjusted to 80 to reduce grid height and give more footer space
  const gridMarginX = 80; 
  const gridWidth = width - (gridMarginX * 2);
  const gap = 10; 
  const cellSize = (gridWidth - (4 * gap)) / 5; 

  let svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <style>
      text { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
    </style>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f8fafc;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ffffff;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="100%" height="100%" fill="url(#bgGrad)"/>
  
  <!-- HEADER -->
  <text x="${padding}" y="60" font-size="42" font-weight="900" fill="#000000">${esc(title.toUpperCase())}</text>
  ${subtitle ? `<text x="${padding}" y="85" font-size="18" font-weight="600" fill="#444444">${esc(subtitle)}</text>` : ''}
  
  <line x1="${padding}" y1="100" x2="${width - padding}" y2="100" stroke="#000000" stroke-width="3" />
  
  <!-- PARTICIPANT INFO (Moved Up) -->
  <g transform="translate(${padding}, 130)">
    <text x="0" y="0" font-size="12" font-weight="800" fill="#666666" letter-spacing="1">PARTICIPANTE</text>
    <text x="0" y="30" font-size="28" font-weight="800" fill="#000000">${nameEsc}</text>
    
    <line x1="0" y1="45" x2="350" y2="45" stroke="#e2e8f0" stroke-width="1"/>
    
    <text x="400" y="0" font-size="12" font-weight="800" fill="#666666" letter-spacing="1">DNI/ID</text>
    <text x="400" y="30" font-size="24" font-weight="700" fill="#222222">${dniEsc}</text>
  </g>
  
  <!-- CARD ID (Top Right) -->
  <g transform="translate(${width - padding}, 60)" text-anchor="end">
    <text x="0" y="0" font-size="14" font-weight="800" fill="#64748b" letter-spacing="1">CARTÓN N°</text>
    <text x="0" y="35" font-size="35" font-weight="900" fill="#000000" letter-spacing="-1" style="line-height: 1;">${esc(card.id)}</text>
    <text x="0" y="55" font-size="14" font-weight="600" fill="#666666">${new Date().toLocaleDateString()}</text>
  </g>
  
  <!-- BINGO GRID (Moved Up to 205 to avoid footer collision) -->
  <g transform="translate(${gridMarginX}, 205)">
`;

  // 1. Column Headers (B I N G O)
  colConfigs.forEach((conf, i) => {
    const cx = i * (cellSize + gap) + cellSize / 2;
    const cy = cellSize / 2;
    
    svg += `
    <circle cx="${cx}" cy="${cy}" r="${cellSize/2}" fill="${conf.bg}" />
    <text x="${cx}" y="${cy + 20}" font-size="50" font-weight="900" fill="${conf.text}" text-anchor="middle">${conf.char}</text>
    `;
  });

  // 2. Grid Cells
  for (let r = 0; r < 5; r++) {
    const y = (r + 1) * (cellSize + gap);
    for (let c = 0; c < 5; c++) {
      const x = c * (cellSize + gap);
      const idx = r * 5 + c;
      const num = card.numbers[idx];
      const isCenter = idx === 12;
      
      const rectFill = isCenter ? '#f1f5f9' : '#ffffff';
      const rectStroke = isCenter ? '#cbd5e1' : '#e2e8f0';
      
      svg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="16" ry="16" fill="${rectFill}" stroke="${rectStroke}" stroke-width="2" />`;
      
      const cx = x + cellSize / 2;
      const cy = y + cellSize / 2;
      
      if (isCenter) {
         // Center Star Icon
         svg += `
         <g transform="translate(${cx}, ${cy}) scale(1.8)">
           <path d="M0 -10 L2.5 -3 L10 -2 L4.5 3 L6 10 L0 6 L-6 10 L-4.5 3 L-12 -2 L-2.5 -3 Z" fill="#94a3b8"/>
         </g>
         <text x="${cx}" y="${cy + 35}" font-size="12" font-weight="900" fill="#94a3b8" text-anchor="middle" letter-spacing="1">LIBRE</text>
         `;
      } else {
         // Adjusted number font size to 46px
         svg += `<text x="${cx}" y="${cy + 18}" font-size="46" font-weight="800" fill="#000000" text-anchor="middle">${num}</text>`;
      }
    }
  }

  svg += `
  </g>
  
  <!-- FOOTER -->
  <g transform="translate(${padding}, ${height - 80})">
    <line x1="0" y1="0" x2="${width - (padding*2)}" y2="0" stroke="#e2e8f0" stroke-width="2"/>
    <text x="0" y="35" font-size="16" font-weight="600" fill="#64748b">¡Mucha Suerte! 🍀</text>
    <text x="${width - (padding*2)}" y="25" font-size="16" font-weight="800" fill="#0f172a" text-anchor="end">Sistema de Bingo Virtual</text>
    <text x="${width - (padding*2)}" y="45" font-size="13" font-weight="400" fill="#94a3b8" text-anchor="end">Generado automáticamente</text>
  </g>
</svg>`;

  return svg;
};

// Helper: Render SVG string to a high-resolution Canvas
const renderSvgToCanvas = async (svgStr: string, scale: number = 2): Promise<HTMLCanvasElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            // Set canvas size based on SVG viewBox (800x1100) * scale
            canvas.width = 800 * scale;
            canvas.height = 1100 * scale;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                URL.revokeObjectURL(url);
                reject(new Error("Canvas context not available"));
                return;
            }
            
            // Background white (to avoid transparency issues in JPG/PDF)
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw SVG
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            URL.revokeObjectURL(url);
            resolve(canvas);
        };
        
        img.onerror = (e) => {
            URL.revokeObjectURL(url);
            reject(e);
        };
        
        img.src = url;
    });
};

// --- Export Functions ---

export const downloadCardImage = async (participant: Participant, card: BingoCard, title: string = "BINGO VIRTUAL", subtitle: string = "") => {
  const svgStr = generateBingoCardSVG(participant, card, title, subtitle);
  // Render at 2.5x scale for high quality PNG (approx 2000px wide)
  const canvas = await renderSvgToCanvas(svgStr, 2.5);
  
  canvas.toBlob((blob) => {
      if (blob) {
          saveAs(blob, `bingo_${participant.name.replace(/\s+/g,'_')}_${card.id}.png`);
      }
  }, 'image/png');
};

export const downloadAllCardsZip = async (participants: Participant[], title: string = "BINGO VIRTUAL", subtitle: string = "") => {
  const zip = new JSZip();
  const folder = zip.folder("cartones_bingo");
  
  for (const p of participants) {
    for (const card of p.cards) {
      const svgStr = generateBingoCardSVG(p, card, title, subtitle);
      // Scale 1.5 is good balance for bulk zip (1200px wide)
      const canvas = await renderSvgToCanvas(svgStr, 1.5);
      const dataUrl = canvas.toDataURL('image/png');
      const base64 = dataUrl.split(',')[1];
      folder?.file(`${p.name.replace(/\s+/g,'_')}_${card.id}.png`, base64, { base64: true });
    }
  }

  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, "todos_cartones.zip");
};

export const generateBingoCardsPDF = async (participant: Participant, title: string, subtitle: string = "", specificCardId?: string) => {
  // Initialize PDF in A4 Portrait (mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 10;
  const gap = 10;
  
  // Grid Calculations (2 columns, 2 rows)
  const cardWidth = (pageWidth - (margin * 2) - gap) / 2; 
  const cardHeight = (pageHeight - (margin * 2) - gap) / 2; 

  const positions = [
    { x: margin, y: margin },
    { x: margin + cardWidth + gap, y: margin },
    { x: margin, y: margin + cardHeight + gap },
    { x: margin + cardWidth + gap, y: margin + cardHeight + gap }
  ];

  const cardsToProcess = specificCardId 
    ? participant.cards.filter(c => c.id === specificCardId)
    : participant.cards;

  if (cardsToProcess.length === 0) return;

  for (let i = 0; i < cardsToProcess.length; i++) {
    const card = cardsToProcess[i];
    const posIndex = i % 4;

    if (i > 0 && posIndex === 0) {
      doc.addPage();
    }

    // Generate SVG
    const svgStr = generateBingoCardSVG(participant, card, title, subtitle);
    
    // Render to Canvas at Scale 3 (2400px wide) for "Super Sharp" Print Quality
    // This ensures 300 DPI equivalent when scaled down to A4 quadrant
    const canvas = await renderSvgToCanvas(svgStr, 3.0);
    const imgData = canvas.toDataURL('image/png');

    let pos = positions[posIndex];
    
    // Center single card
    if (specificCardId && cardsToProcess.length === 1) {
      pos = {
          x: (pageWidth - cardWidth) / 2,
          y: (pageHeight - cardHeight) / 2
      };
    }
    
    // Maintain Aspect Ratio in PDF Cell
    const pdfRatio = cardWidth / cardHeight;
    const imgRatio = canvas.width / canvas.height;

    let w = cardWidth;
    let h = cardHeight;

    if (imgRatio > pdfRatio) {
      h = w / imgRatio;
    } else {
      w = h * imgRatio;
    }
    
    const xCentered = pos.x + (cardWidth - w) / 2;
    const yCentered = pos.y + (cardHeight - h) / 2;

    doc.addImage(imgData, 'PNG', xCentered, yCentered, w, h, '', 'FAST');
    
    // Cutting lines guide (Light gray)
    doc.setDrawColor(220, 220, 220);
    doc.rect(xCentered, yCentered, w, h);
  }

  let fileName = `Cartones_Bingo_${participant.name.replace(/\s+/g, '_')}.pdf`;
  if (specificCardId) {
      fileName = `Bingo_${participant.name.replace(/\s+/g, '_')}_${specificCardId}.pdf`;
  }
  doc.save(fileName);
  
  return fileName;
};
