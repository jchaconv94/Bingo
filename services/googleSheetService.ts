
import { Participant } from '../types.ts';

export interface ApiResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

export const SheetAPI = {
  // Método para autenticación
  async login(url: string, user: string, pass: string): Promise<ApiResponse> {
    try {
        const endpoint = `${url}?action=login`;
        const response = await fetch(endpoint, {
            method: 'POST',
            body: JSON.stringify({ user, pass }),
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
        });
        const json = await response.json();
        return json;
    } catch (error) {
        console.error("Login Error:", error);
        return { success: false, error: String(error) };
    }
  },

  // Método genérico para enviar datos (Google Apps Script requiere POST para payloads JSON o GET para queries simples)
  // Usamos "no-cors" en fetch standard, pero para recibir respuesta JSON de GAS necesitamos un truco.
  // GAS devuelve redirects, fetch los sigue.
  
  async syncParticipant(url: string, participant: Participant): Promise<ApiResponse> {
    try {
      // Usamos el parámetro ?action=save en la URL y enviamos el body
      const endpoint = `${url}?action=save`;
      
      // Para evitar problemas de CORS con GAS, usamos text/plain
      const response = await fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ participant }),
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
      });
      
      const json = await response.json();
      return json;
    } catch (error) {
      console.error("Sync Error:", error);
      return { success: false, error: String(error) };
    }
  },

  async deleteParticipant(url: string, id: string): Promise<ApiResponse> {
    try {
      const endpoint = `${url}?action=delete&id=${id}`;
      const response = await fetch(endpoint, {
        method: 'POST', // Usamos POST para activar el trigger doPost aunque sea delete
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      });
      const json = await response.json();
      return json;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  async deleteAll(url: string): Promise<ApiResponse> {
    try {
        const endpoint = `${url}?action=delete_all`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        });
        const json = await response.json();
        return json;
    } catch (error) {
        return { success: false, error: String(error) };
    }
  },

  async fetchAll(url: string): Promise<Participant[] | null> {
    try {
      const endpoint = `${url}?action=read`;
      const response = await fetch(endpoint);
      const json = await response.json();
      
      if (json.success && Array.isArray(json.data)) {
        return json.data as Participant[];
      }
      return null;
    } catch (error) {
      console.error("Fetch Error:", error);
      return null;
    }
  }
};
