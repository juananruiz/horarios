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

    // Crear encabezado con los nombres de profesores
    const thead = document.createElement('thead');
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
    
    // Generar todas las horas (de 8:00 a 14:00)
    const timeSlots = [];
    for (let hour = 9; hour <= 14; hour++) {
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
                            eventSpan.textContent = `${subjectInitials}${groupName ? '-' + groupName : ''}`;
                            
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
function getSubjectInitials(subjectName) {
    if (!subjectName) return '';
    // Para asignaturas compuestas, tomar primera letra de cada palabra
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

    // Buscar en todos los grupos para este día específico
    Object.keys(schedules).forEach(group => {
        const daySchedules = schedules[group][scheduleDay] || {};

        Object.keys(daySchedules).forEach(time => {
            const scheduleItems = daySchedules[time];
            if (Array.isArray(scheduleItems)) {
                scheduleItems.forEach(item => {
                    if (item.teacherId === teacherId && !item.isContinuation) {
                        const scheduleStart = parseTime(item.startTime);
                        const slotTime = timeSlot.hour * 60 + timeSlot.minute;

                        // Verificar si el slot de tiempo coincide con el inicio del horario
                        if (slotTime === scheduleStart) {
                            events.push({
                                ...item,
                                day: scheduleDay,
                                group: group
                            });
                        }
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
            grid-template-columns: 60px repeat(var(--teacher-count), 1fr);
            min-width: 100%;
            overflow-x: auto;
        }

        .compact-time-header {
            background: var(--md-surface-variant);
            color: var(--md-on-surface-variant);
            padding: 6px;
            text-align: center;
            font-weight: 600;
            border-right: 1px solid var(--md-outline);
            border-bottom: 2px solid var(--md-outline);
            position: sticky;
            left: 0;
            z-index: 2;
            font-size: 12px;
        }

        .compact-teacher-header {
            background: var(--md-surface-variant);
            color: var(--md-on-surface-variant);
            padding: 4px;
            text-align: center;
            font-weight: 600;
            border-right: 1px solid var(--md-outline);
            border-bottom: 2px solid var(--md-outline);
            font-size: 10px;
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
            font-size: 10px;
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
            font-size: 9px;
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
            font-size: 10px;
            font-weight: 700;
            line-height: 1.0;
        }

        .compact-event-group {
            font-size: 8px;
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
    `;

    document.head.appendChild(style);
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

    // Crear encabezado con los nombres de profesores
    const thead = document.createElement('thead');
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
    
    // Generar todas las horas (de 8:00 a 14:00)
    const timeSlots = [];
    for (let hour = 8; hour <= 14; hour++) {
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
                            eventSpan.textContent = `${subjectInitials}${groupName ? '-' + groupName : ''}`;
                            
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
function getSubjectInitials(subjectName) {
    if (!subjectName) return '';
    // Para asignaturas compuestas, tomar primera letra de cada palabra
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

    // Buscar en todos los grupos para este día específico
    Object.keys(schedules).forEach(group => {
        const daySchedules = schedules[group][scheduleDay] || {};

        Object.keys(daySchedules).forEach(time => {
            const scheduleItems = daySchedules[time];
            if (Array.isArray(scheduleItems)) {
                scheduleItems.forEach(item => {
                    if (item.teacherId === teacherId && !item.isContinuation) {
                        const scheduleStart = parseTime(item.startTime);
                        const slotTime = timeSlot.hour * 60 + timeSlot.minute;

                        // Verificar si el slot de tiempo coincide con el inicio del horario
                        if (slotTime === scheduleStart) {
                            events.push({
                                ...item,
                                day: scheduleDay,
                                group: group
                            });
                        }
                    }
                });
            }
        });
    });

    return events;
}

/**
 * Verifica si un evento es de recreo
 */
function isRecreoEvent(event) {
    const subjectName = event.subject ? event.subject.toLowerCase() : '';
    return subjectName.includes('recreo') || subjectName.includes('descanso') || subjectName.includes('receso');
}

/**
 * Crea un elemento de evento para la vista compacta
 */
function createCompactEventElement(event) {
    const eventDiv = document.createElement('div');
    eventDiv.className = 'compact-schedule-event';

    // Aplicar color de asignatura
    if (event.subject) {
        const colorClass = getSubjectClass(event.subject);
        if (colorClass) {
            eventDiv.classList.add(colorClass);
        }
    }

    // Contenido del evento
    const subjectDiv = document.createElement('div');
    subjectDiv.className = 'compact-event-subject';
    subjectDiv.textContent = getSubjectInitials(event.subject);

    const groupDiv = document.createElement('div');
    groupDiv.className = 'compact-event-group';
    groupDiv.textContent = event.group || '';

    eventDiv.appendChild(subjectDiv);
    eventDiv.appendChild(groupDiv);

    return eventDiv;
}

/**
 * Convierte tiempo string a minutos
 */
function parseTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
}

/**
 * Abre el modal para editar una celda en la vista compacta
 */
function openCompactScheduleModal(cell, teacher, timeSlot, day) {
    currentCompactScheduleEditingCell = cell;

    const modal = document.getElementById('subjectSelector');
    const modalTitle = document.getElementById('modalTitle');

    modalTitle.textContent = `Editar - ${getInitials(teacher.name)} ${timeSlot.display} (${day})`;

    // Guardar el día en el cell para usarlo en la asignación
    cell.dataset.day = day;

    // Rellenar opciones de grupo
    populateGroupSelectForCompact();

    modal.style.display = 'block';
}

/**
 * Rellena el select de grupos para la vista compacta
 */
function populateGroupSelectForCompact() {
    const groupSelect = document.getElementById('groupSelect');
    groupSelect.innerHTML = '<option value="">-- Seleccionar Grupo --</option>';

    Object.values(groups).forEach(group => {
        const option = document.createElement('option');
        option.value = group.id;
        option.textContent = group.name;
        groupSelect.appendChild(option);
    });
}

/**
 * Rellena el select de asignaturas para la vista compacta
 */
function populateSubjectSelectForCompact() {
    const groupSelect = document.getElementById('groupSelect');
    const subjectSelect = document.getElementById('subjectSelect');
    const selectedGroupId = groupSelect.value;

    subjectSelect.innerHTML = '<option value="">-- Seleccionar Asignatura --</option>';

    if (selectedGroupId && groups[selectedGroupId]) {
        const group = groups[selectedGroupId];
        const subjects = group.subjects || [];

        subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject.name;
            option.textContent = `${getSubjectInitials(subject.name)} - ${subject.name}`;
            subjectSelect.appendChild(option);
        });
    }
}

/**
 * Asigna una asignatura en la vista compacta
 */
function assignSubjectForCompactSchedule() {
    if (!currentCompactScheduleEditingCell) return;

    const groupSelect = document.getElementById('groupSelect');
    const subjectSelect = document.getElementById('subjectSelect');
    const durationSelect = document.getElementById('durationSelect');

    const groupId = groupSelect.value;
    const subjectName = subjectSelect.value;
    const duration = parseFloat(durationSelect.value);

    if (!groupId || !subjectName) {
        alert('Por favor selecciona un grupo y una asignatura');
        return;
    }

    const teacherId = currentCompactScheduleEditingCell.dataset.teacherId;
    const timeSlot = currentCompactScheduleEditingCell.dataset.timeSlot;
    const day = currentCompactScheduleEditingCell.dataset.day;

    // Encontrar el grupo por ID
    const groupName = Object.keys(groups).find(key => groups[key].id === groupId);
    if (!groupName) {
        alert('Grupo no encontrado');
        return;
    }

    // Verificar que el profesor esté asignado a esta asignatura en este grupo
    const groupData = groups[groupName];
    if (!groupData.subjects || !groupData.subjects[subjectName]) {
        alert('Esta asignatura no existe en el grupo seleccionado');
        return;
    }

    const assignedTeacher = groupData.subjects[subjectName].teacher;
    if (assignedTeacher !== teacherId) {
        alert('Este profesor no está asignado a esta asignatura en este grupo');
        return;
    }

    // Calcular slots de tiempo necesarios (1 hora = 4 slots de 15 minutos)
    const numSlots = (duration * 60) / 15;
    const timeSlotsToOccupy = [];
    let currentTime = new Date(`1970-01-01T${timeSlot}:00`);

    for (let i = 0; i < numSlots; i++) {
        timeSlotsToOccupy.push(currentTime.toTimeString().substring(0, 5));
        currentTime.setMinutes(currentTime.getMinutes() + 15);
    }

    // Validaciones
    const lastSlot = timeSlotsToOccupy[timeSlotsToOccupy.length - 1];
    if (new Date(`1970-01-01T${lastSlot}:00`) >= new Date(`1970-01-01T14:00:00`)) {
        alert('La clase no puede terminar después de las 14:00.');
        return;
    }

    for (const slot of timeSlotsToOccupy) {
        if (slot === "12:00" || slot === "12:15") {
            alert('La clase no puede solaparse con el recreo.');
            return;
        }

        const itemsInSlot = schedules[groupName]?.[day]?.[slot] || [];
        if (itemsInSlot.length >= 2 && slot !== timeSlot) {
            alert(`El slot ${slot} ya tiene dos clases. No se pueden añadir más.`);
            return;
        }
    }

    // Eliminar asignatura existente del mismo profesor si la hay
    const existingItems = schedules[groupName][day][timeSlot];
    if (existingItems && existingItems.length > 0) {
        const existingIndex = existingItems.findIndex(item => item.teacherId === teacherId);
        if (existingIndex !== -1) {
            // Remover el item existente
            existingItems.splice(existingIndex, 1);
        } else if (existingItems.length >= 2) {
            alert('Este hueco ya tiene dos asignaturas. No se pueden añadir más.');
            return;
        }
    }

    // Crear nuevo item
    const newScheduleItem = {
        id: generateUniqueId(),
        subject: subjectName,
        teacherId: teacherId,
        group: groupName,
        duration: duration,
        startTime: timeSlot,
        endTime: lastSlot,
        isStart: true,
        createdAt: new Date().toISOString()
    };

    // Asegurar que el slot es un array y añadir el item
    if (!Array.isArray(schedules[groupName][day][timeSlot])) {
        schedules[groupName][day][timeSlot] = [];
    }
    schedules[groupName][day][timeSlot].push(newScheduleItem);

    // Crear celdas de continuación
    const parentId = newScheduleItem.id;
    for (let i = 1; i < timeSlotsToOccupy.length; i++) {
        const continuationSlot = timeSlotsToOccupy[i];

        if (!Array.isArray(schedules[groupName][day][continuationSlot])) {
            schedules[groupName][day][continuationSlot] = [];
        }

        const continuationItem = {
            id: generateUniqueId(),
            subject: subjectName,
            teacherId: teacherId,
            group: groupName,
            duration: duration,
            startTime: timeSlot,
            isContinuation: true,
            parentId: parentId,
            createdAt: new Date().toISOString()
        };

        schedules[groupName][day][continuationSlot].push(continuationItem);
    }

    // Guardar cambios
    saveSchedulesToStorage();

    // Cerrar modal y refrescar vista
    closeCompactScheduleModal();
    renderCompactScheduleView();
}

/**
 * Quita una asignatura en la vista compacta
 */
function removeSubjectForCompactSchedule(shouldRender = true) {
    if (!currentCompactScheduleEditingCell) return;

    const teacherId = currentCompactScheduleEditingCell.dataset.teacherId;
    const timeSlot = currentCompactScheduleEditingCell.dataset.timeSlot;
    const day = currentCompactScheduleEditingCell.dataset.day;

    // Buscar el elemento a eliminar
    const scheduleItems = schedules[day]?.[timeSlot];
    if (!scheduleItems || scheduleItems.length === 0) {
        console.warn(`No hay elementos para eliminar en ${day}/${timeSlot}`);
        return;
    }

    // Encontrar el elemento del profesor específico
    const itemToRemove = scheduleItems.find(item => item.teacherId === teacherId);
    if (!itemToRemove) {
        console.warn(`No se encontró elemento para el profesor ${teacherId} en ${day}/${timeSlot}`);
        return;
    }

    const idsToRemove = new Set();
    idsToRemove.add(itemToRemove.id);

    // Buscar elementos relacionados (continuaciones)
    Object.keys(schedules).forEach(group => {
        if (schedules[group][day]) {
            Object.keys(schedules[group][day]).forEach(slotTime => {
                schedules[group][day][slotTime].forEach(item => {
                    if ((item.parentId === itemToRemove.id) ||
                        (item.startTime === timeSlot && item.teacherId === teacherId && item.isContinuation)) {
                        if (item.id) idsToRemove.add(item.id);
                    }
                });
            });
        }
    });

    // Eliminar elementos
    let elementsRemoved = 0;
    Object.keys(schedules).forEach(group => {
        if (schedules[group][day]) {
            Object.keys(schedules[group][day]).forEach(slotTime => {
                const beforeCount = schedules[group][day][slotTime].length;
                schedules[group][day][slotTime] = schedules[group][day][slotTime].filter(item => !idsToRemove.has(item.id));
                elementsRemoved += (beforeCount - schedules[group][day][slotTime].length);
            });
        }
    });

    console.log(`Eliminados ${elementsRemoved} elementos relacionados`);

    // Guardar cambios
    saveSchedulesToStorage();

    // Cerrar modal y refrescar vista
    closeCompactScheduleModal();
    if (shouldRender) {
        renderCompactScheduleView();
    }
}

/**
 * Cierra el modal de la vista compacta
 */
function closeCompactScheduleModal() {
    const modal = document.getElementById('subjectSelector');
    modal.style.display = 'none';
    currentCompactScheduleEditingCell = null;
}

/**
 * Añade los event listeners para la vista compacta
 */
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