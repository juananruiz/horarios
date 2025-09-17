/**
 * Convierte nombres de grupos reemplazando ordinales por números
 * y abreviando el resto de palabras a 3 letras
 */
function formatGroupName(groupName) {
    if (!groupName) return '';
    
    // Reemplazar ordinales por números
    const replacements = {
        'Primero': '1',
        'Segundo': '2',
        'Tercero': '3',
        'Cuarto': '4',
        'Quinto': '5',
        'Sexto': '6'
    };
    
    // Primero intentar encontrar y reemplazar ordinales
    for (const [ordinal, numero] of Object.entries(replacements)) {
        // Buscar el ordinal al inicio de la cadena
        const regex = new RegExp(`^${ordinal}\\b`, 'i');
        if (regex.test(groupName)) {
            // Si hay una letra después del ordinal, mantenerla
            const afterOrdinal = groupName.replace(regex, '').trim();
            if (afterOrdinal.length > 0) {
                // Si hay contenido después del ordinal, verificar si es una sola letra
                if (afterOrdinal.length === 1 && /[A-Za-z]/.test(afterOrdinal)) {
                    return `${numero}${afterOrdinal}`;
                } else {
                    // Si hay más contenido, abreviarlo
                    return `${numero}${afterOrdinal.substring(0, 3)}`;
                }
            } else {
                // Solo el ordinal
                return numero;
            }
        }
    }
    
    // Si no es un grupo con ordinal, abreviar a 3 letras
    return groupName
        .split(' ')
        .map(word => word.substring(0, 3))
        .join('');
}

// Variable para gestionar los datos en la vista compacta
let currentCompactScheduleEditingCell = null;

/**
 * Inicializa la página de horario compacto.
 */
function initCompactSchedulePage() {
    initializeAppData();
    
    // Renderizar la vista compacta después de un breve delay para asegurar que los datos estén listos
    setTimeout(() => {
        renderCompactScheduleView();
    }, 100);
    
    // Solo agregar event listeners para botones de exportación e impresión, no para edición
    addCompactSchedulePrintListeners();
}

/**
 * Renderiza la vista de horario compacto como tabla unificada para impresión
 */
function renderCompactScheduleView() {
    const container = document.getElementById('compactScheduleContainer');
    container.innerHTML = '';

    // Ordenar la lista de profesores por el campo ID
    teachers.sort((a, b) => {
        const idA = a.id || '';
        const idB = b.id || '';
        return idA.localeCompare(idB);
    });

    // Establecer la variable CSS para el número de profesores
    document.documentElement.style.setProperty('--teacher-count', teachers.length);

    // Crear tabla principal
    const table = document.createElement('table');
    table.className = 'compact-schedule-table';
    table.style.width = '100%';
    table.style.tableLayout = 'fixed';

    // Crear encabezado con los nombres de profesores
    const thead = document.createElement('thead');

    // Fila para los IDs de los profesores
    const idRow = document.createElement('tr');
    const idHeaderCell = document.createElement('th');
    idHeaderCell.className = 'compact-day-header'; // Reutilizar estilo
    idRow.appendChild(idHeaderCell); // Celda vacía para la columna de DÍAS/HORAS

    teachers.forEach(teacher => {
        const idCell = document.createElement('th');
        idCell.className = 'compact-teacher-id';
        idCell.textContent = teacher.id || '';
        idRow.appendChild(idCell);
    });
    thead.appendChild(idRow);

    // Fila para los nombres de los profesores
    const headerRow = document.createElement('tr');

    // Celda de días
    const dayHeaderCell = document.createElement('th');
    dayHeaderCell.textContent = 'DÍAS';
    dayHeaderCell.className = 'compact-day-header';
    headerRow.appendChild(dayHeaderCell);

    // Celdas de profesores
    teachers.forEach(teacher => {
        const teacherCell = document.createElement('th');
        teacherCell.className = 'compact-teacher-header';
        teacherCell.style.width = '25px'; // Ancho fijo más estrecho
        
        // Crear contenido vertical del nombre del profesor
        const teacherName = teacher.name.toUpperCase();
        const nameDiv = document.createElement('div');
        nameDiv.className = 'teacher-name-vertical';
        nameDiv.textContent = teacherName;
        
        teacherCell.appendChild(nameDiv);
        teacherCell.title = teacherName;
        headerRow.appendChild(teacherCell);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Crear cuerpo de la tabla con todos los días y horas
    const tbody = document.createElement('tbody');
    const daysOfWeek = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES'];
    
    // Generar todas las horas (de 9:00 a 13:00)
    const timeSlots = [];
    for (let hour = 9; hour <= 13; hour++) {
        timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    }   

    daysOfWeek.forEach(day => {
        timeSlots.forEach((time, timeIndex) => {
            const row = document.createElement('tr');
            
            // Primera columna: día y hora
            const timeCell = document.createElement('td');
            timeCell.className = 'compact-time-cell';
            
            // Mostrar el día solo en la primera hora
            if (timeIndex === 0) {
                const daySpan = document.createElement('div');
                daySpan.className = 'day-label';
                daySpan.textContent = day;
                timeCell.appendChild(daySpan);
            }
            
            const timeSpan = document.createElement('div');
            timeSpan.className = 'time-label';
            timeSpan.textContent = time;
            timeCell.appendChild(timeSpan);
            
            row.appendChild(timeCell);

            // Celdas para cada profesor
            teachers.forEach(teacher => {
                const scheduleCell = document.createElement('td');
                scheduleCell.className = 'compact-schedule-cell';

                // Buscar eventos para este profesor en este día y horario
                const events = findEventsForTeacherAndTime(teacher.id, { hour: parseInt(time.split(':')[0]), minute: 0 }, day);

                if (events.length > 0) {
                    // Filtrar recreos
                    const nonRecreoEvents = events.filter(event => !isRecreoEvent(event));

                    if (nonRecreoEvents.length > 0) {
                        const eventContent = document.createElement('div');
                        eventContent.className = 'compact-event-content';

                        nonRecreoEvents.forEach((event, index) => {
                            if (index > 0) {
                                eventContent.appendChild(document.createElement('br'));
                            }
                            
                            const eventSpan = document.createElement('span');
                            eventSpan.className = 'compact-event-item';
                            
                            // Formato: ASIGNATURA-GRUPO
                            const subjectInitials = getSubjectInitials(event.subject);
                            const groupName = event.group || '';
                            const formattedGroupName = formatGroupName(groupName);
                            eventSpan.textContent = `${subjectInitials}${groupName ? '-' + formattedGroupName : ''}`
                            
                            // Aplicar color de asignatura
                            const colorClass = getSubjectClass(event.subject);
                            if (colorClass) {
                                // Convertir clase de color a clase específica para vista compacta
                                const compactClass = colorClass.replace('subject-color--', 'compact-event-item.');
                                eventSpan.classList.add(compactClass.split('.')[1]);
                            }
                            
                            eventContent.appendChild(eventSpan);
                        });

                        scheduleCell.appendChild(eventContent);
                    }
                }

                row.appendChild(scheduleCell);
            });

            tbody.appendChild(row);
        });
    });

    table.appendChild(tbody);
    container.appendChild(table);
}

/**
 * Obtiene las iniciales de un nombre completo
 */
function getInitials(fullName) {
    if (!fullName) return '';
    return fullName
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .join('')
        .substring(0, 3); // Máximo 3 iniciales
}

/**
 * Obtiene las iniciales de una asignatura
 */
/**
 * Obtiene las iniciales de una asignatura
 */
function getSubjectInitials(subjectName) {
    if (!subjectName) return '';
    
    // Reemplazar literales de grupos por números
    const replacements = {
        'Primero': '1',
        'Segundo': '2',
        'Tercero': '3',
        'Cuarto': '4',
        'Quinto': '5',
        'Sexto': '6'
    };
    
    // Buscar si el nombre de la asignatura contiene alguno de los literales
    for (const [literal, numero] of Object.entries(replacements)) {
        // Usar expresión regular para encontrar el literal seguido de una letra
        const regex = new RegExp(`${literal}\s+([A-Za-z])`, 'i');
        const match = subjectName.match(regex);
        
        if (match) {
            // Reemplazar el literal por el número y mantener la letra
            return `${numero}${match[1]}`;
        }
    }
    
    // Si no es un grupo con literal, usar el comportamiento original
    return subjectName
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .join('')
        .substring(0, 4); // Máximo 4 caracteres
}

/**
 * Busca eventos para un profesor en un horario específico
 */
function findEventsForTeacherAndTime(teacherId, timeSlot, specificDay) {
    const events = [];
    const dayKey = specificDay || 'LUNES'; // Convertir formato

    // Mapear día en español a clave de schedules
    const dayMap = {
        'LUNES': 'Lunes',
        'MARTES': 'Martes',
        'MIÉRCOLES': 'Miércoles',
        'JUEVES': 'Jueves',
        'VIERNES': 'Viernes'
    };
    const scheduleDay = dayMap[dayKey] || dayKey;

    // Encontrar el nombre del profesor a partir de su ID
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) return [];
    const teacherName = teacher.name;

    // Buscar en todos los grupos para este día específico
    Object.keys(schedules).forEach(group => {
        const daySchedules = schedules[group][scheduleDay] || {};
        
        // Modificación: Buscar todas las horas posibles dentro de esta hora (XX:00, XX:15, XX:30, XX:45)
        const possibleTimes = [
            `${String(timeSlot.hour).padStart(2, '0')}:00`,
            `${String(timeSlot.hour).padStart(2, '0')}:15`,
            `${String(timeSlot.hour).padStart(2, '0')}:30`,
            `${String(timeSlot.hour).padStart(2, '0')}:45`
        ];
        
        possibleTimes.forEach(timeKey => {
            const scheduleItems = daySchedules[timeKey];
            if (Array.isArray(scheduleItems)) {
                scheduleItems.forEach(item => {
                    // Comprobar si la clase es de este profesor y es el inicio de un bloque
                    if (item.teacher === teacherName && item.isStart) {
                        events.push({
                            ...item,
                            day: scheduleDay,
                            group: group
                        });
                    }
                });
            }
        });
    });

    return events;
}

/**
 * Verifica si un evento es un recreo
 */
function isRecreoEvent(event) {
    const subjectName = event.subject ? event.subject.toLowerCase() : '';
    return subjectName.includes('recreo') || subjectName.includes('descanso') || subjectName.includes('receso');
}

/**
 * Convierte tiempo string a minutos
 */
function parseTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
}

/**
 * Añade solo los event listeners necesarios para la vista compacta (impresión)
 */
function addCompactSchedulePrintListeners() {
    // Event listener para el botón de impresión
    const printBtn = document.getElementById('printBtn');
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            alert('Para imprimir correctamente:\n\n1. Usa Ctrl+P (o Cmd+P en Mac)\n2. Selecciona formato A3 horizontal\n3. Asegúrate de activar "Imprimir fondos" o "Imprimir colores de fondo"\n4. Los botones de navegación se ocultarán automáticamente');
            window.print();
        });
    }

    // Event listeners para exportar/importar (reutilizar los del sistema principal)
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const importFile = document.getElementById('importFile');

    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }

    if (importBtn && importFile) {
        importBtn.addEventListener('click', () => importFile.click());
        importFile.addEventListener('change', importData);
    }
}

/**
 * Añade estilos CSS para la vista de horario compacto basada en divs
 */
function addCompactScheduleStyles() {
    const existingStyle = document.getElementById('compactScheduleStyles');
    if (existingStyle) return;

    const style = document.createElement('style');
    style.id = 'compactScheduleStyles';
    style.textContent = `
        /* Estilos para la vista de horario compacto */
        .compact-schedule-container {
            background: var(--md-surface);
            border-radius: var(--border-radius-m);
            overflow: hidden;
            box-shadow: var(--shadow-1);
            margin-top: var(--spacing-l);
        }

        .compact-schedule-grid {
            display: grid;
            grid-template-columns: 40px repeat(var(--teacher-count), 1fr);
            min-width: 100%;
            overflow-x: auto;
        }

        .compact-time-header {
            background: var(--md-surface-variant);
            color: var(--md-on-surface-variant);
            padding: 4px;
            text-align: center;
            font-weight: 600;
            border-right: 1px solid var(--md-outline);
            border-bottom: 2px solid var(--md-outline);
            position: sticky;
            left: 0;
            z-index: 2;
            font-size: 14px; /* Aumentado en 2pt */
        }

        .compact-teacher-header {
            background: var(--md-surface-variant);
            color: var(--md-on-surface-variant);
            padding: 4px;
            text-align: center;
            font-weight: 600;
            border-right: 1px solid var(--md-outline);
            border-bottom: 2px solid var(--md-outline);
            font-size: 12px; /* Aumentado en 2pt */
            writing-mode: vertical-rl;
            text-orientation: mixed;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-height: 120px;
        }

        .compact-time-column {
            position: sticky;
            left: 0;
            z-index: 1;
            background: var(--md-surface);
        }

        .compact-teacher-column {
            min-width: 35px;
            max-width: 45px;
        }

        .compact-time-cell {
            background: #F8F9FA;
            border-right: 1px solid var(--md-outline);
            border-bottom: 1px solid var(--md-outline);
            padding: 4px;
            text-align: center;
            font-size: 12px; /* Aumentado en 2pt */
            font-weight: 500;
            min-height: 25px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .compact-schedule-cell {
            border-right: 1px solid var(--md-outline);
            border-bottom: 1px solid var(--md-outline);
            min-height: 25px;
            position: relative;
            background: var(--md-surface);
            cursor: pointer;
            transition: background-color 0.2s;
        }

        .compact-schedule-cell:hover {
            background-color: var(--md-surface-variant);
        }

        .compact-schedule-event {
            position: absolute;
            top: 1px;
            left: 1px;
            right: 1px;
            bottom: 1px;
            border-radius: 2px;
            padding: 2px;
            font-size: 11px; /* Aumentado en 2pt */
            font-weight: 600;
            text-align: center;
            line-height: 1.1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            overflow: hidden;
        }

        .compact-event-subject {
            font-size: 12px; /* Aumentado en 2pt */
            font-weight: 700;
            line-height: 1.0;
        }

        .compact-event-group {
            font-size: 10px; /* Aumentado en 2pt */
            opacity: 0.8;
            line-height: 1.0;
        }

        /* Estilos para conflictos */
        .compact-conflict-cell {
            background-color: var(--conflict-bg) !important;
        }

        .compact-conflict-cell .compact-schedule-event {
            background-color: var(--conflict-bg) !important;
            color: var(--conflict-text) !important;
            border: 1px solid var(--conflict-border);
        }

        .compact-teacher-id {
            background: var(--md-surface-variant);
            color: var(--md-on-surface-variant);
            padding: 4px;
            text-align: center;
            font-weight: 700;
            border-right: 1px solid var(--md-outline);
            border-bottom: 1px solid var(--md-outline);
            font-size: 13px; /* Aumentado en 2pt */
        }
        
        /* Estilo específico para impresión */
        @media print {
            /* Aumentar tamaño de fuente solo al imprimir */
            .compact-time-header,
            .compact-teacher-header,
            .compact-time-cell,
            .compact-schedule-event,
            .compact-event-subject,
            .compact-event-group,
            .compact-teacher-id {
                font-size: calc(100% + 2pt);
            }
        }
    `;

    document.head.appendChild(style);
}
