import { supabase, TABLES } from './supabase-config.js';
import { authService } from './auth.js';

class DataService {
  constructor() {
    this.cache = new Map();
  }

  // Obtener ID del centro actual
  getCurrentCentroId() {
    const centro = authService.getCurrentCentro();
    return centro?.id;
  }

  // CENTROS
  async getCentros() {
    try {
      const { data, error } = await supabase
        .from(TABLES.CENTROS)
        .select('*')
        .order('nombre');
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async createCentro(centro) {
    try {
      const { data, error } = await supabase
        .from(TABLES.CENTROS)
        .insert(centro)
        .select()
        .single();
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // PROFESORES
  async getProfesores(centroId = null) {
    const targetCentroId = centroId || this.getCurrentCentroId();
    if (!targetCentroId) return { success: false, error: 'No hay centro seleccionado' };

    try {
      const { data, error } = await supabase
        .from(TABLES.PROFESORES)
        .select('*')
        .eq('centro_id', targetCentroId)
        .order('nombre');
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async createProfesor(profesor) {
    const centroId = this.getCurrentCentroId();
    if (!centroId) return { success: false, error: 'No hay centro seleccionado' };

    try {
      const profesorData = { ...profesor, centro_id: centroId };
      const { data, error } = await supabase
        .from(TABLES.PROFESORES)
        .insert(profesorData)
        .select()
        .single();
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // GRUPOS
  async getGrupos(centroId = null) {
    const targetCentroId = centroId || this.getCurrentCentroId();
    if (!targetCentroId) return { success: false, error: 'No hay centro seleccionado' };

    try {
      const { data, error } = await supabase
        .from(TABLES.GRUPOS)
        .select(`
          *,
          profesores!tutor_id (
            id,
            nombre,
            nombre_corto,
            codigo
          )
        `)
        .eq('centro_id', targetCentroId)
        .order('nombre');
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async createGrupo(grupo) {
    const centroId = this.getCurrentCentroId();
    if (!centroId) return { success: false, error: 'No hay centro seleccionado' };

    try {
      const grupoData = { ...grupo, centro_id: centroId };
      const { data, error } = await supabase
        .from(TABLES.GRUPOS)
        .insert(grupoData)
        .select()
        .single();
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ASIGNATURAS
  async getAsignaturas(grupoId = null) {
    try {
      let query = supabase
        .from(TABLES.ASIGNATURAS)
        .select(`
          *,
          grupos (
            id,
            nombre,
            nombre_corto
          ),
          profesores (
            id,
            nombre,
            nombre_corto,
            codigo
          )
        `);

      if (grupoId) {
        query = query.eq('grupo_id', grupoId);
      } else {
        // Si no se especifica grupo, obtener todas las del centro actual
        const centroId = this.getCurrentCentroId();
        if (!centroId) return { success: false, error: 'No hay centro seleccionado' };
        
        query = query.or(`grupo_id.is.null,grupos.centro_id.eq.${centroId}`);
      }

      const { data, error } = await query.order('nombre');
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async createAsignatura(asignatura) {
    try {
      const { data, error } = await supabase
        .from(TABLES.ASIGNATURAS)
        .insert(asignatura)
        .select()
        .single();
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // HORARIOS
  async getHorarios(grupoId = null) {
    try {
      let query = supabase
        .from(TABLES.HORARIOS)
        .select(`
          *,
          grupos (
            id,
            nombre,
            nombre_corto
          ),
          asignaturas (
            id,
            nombre,
            nombre_corto
          ),
          profesores (
            id,
            nombre,
            nombre_corto,
            codigo
          )
        `);

      if (grupoId) {
        query = query.eq('grupo_id', grupoId);
      } else {
        // Si no se especifica grupo, obtener todos los del centro actual
        const centroId = this.getCurrentCentroId();
        if (!centroId) return { success: false, error: 'No hay centro seleccionado' };
        
        query = query.or(`grupo_id.is.null,grupos.centro_id.eq.${centroId}`);
      }

      const { data, error } = await query.order(['dia', 'hora']);
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async createHorario(horario) {
    try {
      const { data, error } = await supabase
        .from(TABLES.HORARIOS)
        .insert(horario)
        .select()
        .single();
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async updateHorario(id, horario) {
    try {
      const { data, error } = await supabase
        .from(TABLES.HORARIOS)
        .update(horario)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async deleteHorario(id) {
    try {
      const { error } = await supabase
        .from(TABLES.HORARIOS)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // UTILIDADES
  clearCache() {
    this.cache.clear();
  }

  // Migración de datos desde localStorage
  async migrateFromLocalStorage() {
    try {
      const localData = localStorage.getItem('horarios');
      if (!localData) return { success: false, error: 'No hay datos en localStorage' };

      const data = JSON.parse(localData);
      
      // Aquí implementarías la lógica de migración
      // según la estructura actual de tus datos
      
      return { success: true, message: 'Datos migrados correctamente' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Instancia global del servicio de datos
export const dataService = new DataService();