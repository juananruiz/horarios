// Importar Supabase desde CDN para evitar problemas de módulos
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = 'https://tu-proyecto.supabase.co';
const supabaseKey = 'tu-clave-publica-aqui';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Configuración de las tablas
export const TABLES = {
  CENTROS: 'centros',
  USUARIOS: 'usuarios', 
  PROFESORES: 'profesores',
  GRUPOS: 'grupos',
  ASIGNATURAS: 'asignaturas',
  HORARIOS: 'horarios'
};