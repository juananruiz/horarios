-- Esquema de base de datos para Supabase
-- Gestor de Horarios Multicentro

-- Habilitar RLS (Row Level Security)
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Tabla de centros educativos
CREATE TABLE centros (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    codigo VARCHAR(5) UNIQUE NOT NULL,
    direccion TEXT,
    telefono VARCHAR(20),
    email VARCHAR(255),
    logo_url TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de usuarios (extiende auth.users de Supabase)
CREATE TABLE usuarios (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    nombre_corto VARCHAR(5) NOT NULL,
    centro_id UUID REFERENCES centros(id) ON DELETE CASCADE,
    rol VARCHAR(20) CHECK (rol IN ('admin', 'directiva', 'profesor')) DEFAULT 'profesor',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de profesores
CREATE TABLE profesores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    nombre_corto VARCHAR(5) NOT NULL,
    centro_id UUID REFERENCES centros(id) ON DELETE CASCADE,
    email VARCHAR(255),
    telefono VARCHAR(20),
    especialidad VARCHAR(100),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(codigo, centro_id)
);

-- Tabla de grupos
CREATE TABLE grupos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    nombre_corto VARCHAR(50) NOT NULL,
    tutor_id UUID REFERENCES profesores(id) ON DELETE SET NULL,
    centro_id UUID REFERENCES centros(id) ON DELETE CASCADE,
    num_alumnos INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(nombre, centro_id)
);

-- Tabla de asignaturas
CREATE TABLE asignaturas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    nombre_corto VARCHAR(50) NOT NULL,
    codigo VARCHAR(50), -- Código de la asignatura
    grupo_id UUID REFERENCES grupos(id) ON DELETE CASCADE NULL, -- Puede ser NULL para asignaturas generales
    profesor_id UUID REFERENCES profesores(id) ON DELETE SET NULL,
    horas_semanales INTEGER DEFAULT 1,
    color VARCHAR(7) DEFAULT '#3498db', -- Color hex para la UI
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de horarios
CREATE TABLE horarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    grupo_id UUID REFERENCES grupos(id) ON DELETE CASCADE NULL, -- Puede ser NULL para eventos generales
    asignatura_id UUID REFERENCES asignaturas(id) ON DELETE CASCADE,
    profesor_id UUID REFERENCES profesores(id) ON DELETE SET NULL,
    dia INTEGER CHECK (dia >= 0 AND dia <= 6), -- 0=Domingo, 1=Lunes, etc.
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    duracion INTEGER DEFAULT 60, -- Duración en minutos
    aula VARCHAR(50),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_usuarios_centro_id ON usuarios(centro_id);
CREATE INDEX idx_profesores_centro_id ON profesores(centro_id);
CREATE INDEX idx_grupos_centro_id ON grupos(centro_id);
CREATE INDEX idx_grupos_tutor_id ON grupos(tutor_id);
CREATE INDEX idx_asignaturas_grupo_id ON asignaturas(grupo_id);
CREATE INDEX idx_asignaturas_profesor_id ON asignaturas(profesor_id);
CREATE INDEX idx_horarios_grupo_id ON horarios(grupo_id);
CREATE INDEX idx_horarios_profesor_id ON horarios(profesor_id);
CREATE INDEX idx_horarios_dia_hora ON horarios(dia, hora_inicio);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_centros_updated_at BEFORE UPDATE ON centros FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profesores_updated_at BEFORE UPDATE ON profesores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_grupos_updated_at BEFORE UPDATE ON grupos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_asignaturas_updated_at BEFORE UPDATE ON asignaturas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_horarios_updated_at BEFORE UPDATE ON horarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Políticas de seguridad RLS (Row Level Security)
ALTER TABLE centros ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE profesores ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE asignaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE horarios ENABLE ROW LEVEL SECURITY;

-- Políticas para centros (solo admins pueden ver todos)
CREATE POLICY "Usuarios pueden ver su centro" ON centros FOR SELECT USING (
    id IN (SELECT centro_id FROM usuarios WHERE id = auth.uid())
);

CREATE POLICY "Solo admins pueden modificar centros" ON centros FOR ALL USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin')
);

-- Políticas para usuarios (cada usuario ve solo su información y la de su centro)
CREATE POLICY "Usuarios pueden ver su información" ON usuarios FOR SELECT USING (
    id = auth.uid() OR 
    centro_id IN (SELECT centro_id FROM usuarios WHERE id = auth.uid())
);

-- Políticas para profesores (solo del mismo centro)
CREATE POLICY "Ver profesores del mismo centro" ON profesores FOR SELECT USING (
    centro_id IN (SELECT centro_id FROM usuarios WHERE id = auth.uid())
);

-- Políticas para grupos (solo del mismo centro)
CREATE POLICY "Ver grupos del mismo centro" ON grupos FOR SELECT USING (
    centro_id IN (SELECT centro_id FROM usuarios WHERE id = auth.uid())
);

-- Políticas para asignaturas (solo del mismo centro)
CREATE POLICY "Ver asignaturas del mismo centro" ON asignaturas FOR SELECT USING (
    grupo_id IS NULL OR 
    grupo_id IN (SELECT id FROM grupos WHERE centro_id IN (SELECT centro_id FROM usuarios WHERE id = auth.uid()))
);

-- Políticas para horarios (solo del mismo centro)
CREATE POLICY "Ver horarios del mismo centro" ON horarios FOR SELECT USING (
    grupo_id IS NULL OR 
    grupo_id IN (SELECT id FROM grupos WHERE centro_id IN (SELECT centro_id FROM usuarios WHERE id = auth.uid()))
);