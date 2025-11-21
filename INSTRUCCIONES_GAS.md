
# Corrección del Script de Google Apps Script

He notado que en tu código tenías dos funciones `doPost`, lo cual causa conflicto. He unificado todo en un solo script correcto.

**Instrucciones:**
1. Borra **TODO** el código que tienes actualmente en tu proyecto de Apps Script.
2. Copia y pega este código completo.
3. Guarda y **Vuelve a Implementar** (Deploy) como Aplicación Web (Nueva versión).

```javascript
// --- CÓDIGO COMPLETO UNIFICADO ---

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const lock = LockService.getScriptLock();
  // Esperar hasta 10 segundos para evitar conflictos de escritura simultánea
  lock.tryLock(10000);

  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. Determinar la acción
    // Puede venir en la URL (?action=...) o en el cuerpo del POST si se enviara así (aunque usualmente va en URL)
    const action = e.parameter.action || 'read';
    
    // 2. Parsear el cuerpo de la solicitud (para save/login)
    let params = {};
    if (e.postData && e.postData.contents) {
      try {
        params = JSON.parse(e.postData.contents);
      } catch (err) {
        // Si falla el parseo, seguimos, quizás no se necesiten params
      }
    }

    let result = {};

    // --- LÓGICA DE LOGIN ---
    if (action === 'login') {
      return handleLogin(params, spreadsheet);
    }

    // --- LÓGICA DE PARTICIPANTES (Hoja 'Participantes') ---
    let sheet = spreadsheet.getSheetByName('Participantes');
    if (!sheet) {
      sheet = spreadsheet.insertSheet('Participantes');
      sheet.appendRow(['ID', 'JSON_DATA', 'UPDATED_AT']); // Encabezados
    }
    // Asegurar encabezados si la hoja existe pero está vacía
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['ID', 'JSON_DATA', 'UPDATED_AT']);
    }

    if (action === 'read') {
      const data = sheet.getDataRange().getValues();
      const participants = [];
      // Empezamos en 1 para saltar encabezados
      for (let i = 1; i < data.length; i++) {
        // data[i][1] es la columna JSON_DATA
        if (data[i][1]) { 
          try {
            participants.push(JSON.parse(data[i][1]));
          } catch (err) {}
        }
      }
      result = { success: true, data: participants };
    } 
    
    else if (action === 'save') {
      // Esperamos que el payload tenga { participant: { ... } }
      const p = params.participant;
      if (!p || !p.id) {
        throw new Error("Datos de participante inválidos");
      }

      const data = sheet.getDataRange().getValues();
      let rowIndex = -1;

      // Buscar si ya existe por ID (Columna 0)
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(p.id)) {
          rowIndex = i + 1; // +1 porque los índices de fila empiezan en 1
          break;
        }
      }

      const jsonString = JSON.stringify(p);
      const timestamp = new Date();

      if (rowIndex > 0) {
        // Actualizar existente
        sheet.getRange(rowIndex, 2).setValue(jsonString);
        sheet.getRange(rowIndex, 3).setValue(timestamp);
      } else {
        // Crear nuevo
        sheet.appendRow([p.id, jsonString, timestamp]);
      }
      result = { success: true, message: 'Saved' };
    }

    else if (action === 'delete') {
      const id = e.parameter.id || params.id;
      const data = sheet.getDataRange().getValues();
      let deleted = false;
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(id)) {
          sheet.deleteRow(i + 1);
          deleted = true;
          break;
        }
      }
      result = { success: true, message: deleted ? 'Deleted' : 'Not Found' };
    }

    else if (action === 'delete_all') {
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.deleteRows(2, lastRow - 1);
      }
      result = { success: true, message: 'All Deleted' };
    }
    
    else {
      result = { success: false, error: 'Acción desconocida: ' + action };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// --- FUNCIÓN AUXILIAR DE LOGIN ---
function handleLogin(params, spreadsheet) {
  // Busca una hoja llamada "Admin". Si no existe, la crea.
  let authSheet = spreadsheet.getSheetByName("Admin");
  if (!authSheet) {
    authSheet = spreadsheet.insertSheet("Admin");
    authSheet.appendRow(["User", "Password"]);
    // Usuario por defecto
    authSheet.appendRow(["admin", "admin123"]); 
  }

  const data = authSheet.getDataRange().getValues();
  // Itera buscando coincidencia (saltando encabezado)
  for (let i = 1; i < data.length; i++) {
    // Columna 0 = User, Columna 1 = Password
    if (String(data[i][0]) === String(params.user) && String(data[i][1]) === String(params.pass)) {
      return ContentService.createTextOutput(JSON.stringify({ "success": true }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ "success": false, "message": "Credenciales incorrectas" }))
    .setMimeType(ContentService.MimeType.JSON);
}
```
