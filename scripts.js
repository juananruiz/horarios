let groups = {};
let teachers = [];

function loadGroupsData() {
    const storedGroups = localStorage.getItem('horariosGroups');
    groups = storedGroups ? JSON.parse(storedGroups) : {};
}

function saveGroupsData() {
    localStorage.setItem('horariosGroups', JSON.stringify(groups));
}

function loadTeachersData() {
    const storedTeachers = localStorage.getItem('horariosTeachers');
    let loadedTeachers = storedTeachers ? JSON.parse(storedTeachers) : [];

    // --- Migración de datos ---
    // Si el primer elemento es un string, asumimos que es el formato antiguo.
    if (loadedTeachers.length > 0 && typeof loadedTeachers[0] === 'string') {
        loadedTeachers = loadedTeachers.map(teacherName => ({
            name: teacherName,
            // Generar un ID por defecto (se puede editar después)
            id: teacherName.substring(0, 5).toUpperCase()
        }));
        // Guardar inmediatamente el nuevo formato
        localStorage.setItem('horariosTeachers', JSON.stringify(loadedTeachers));
    }
    
    teachers = loadedTeachers;
}

function saveTeachersData() {
    localStorage.setItem('horariosTeachers', JSON.stringify(teachers));
}

function generateTimeSlots(start, end, interval) {
    const slots = [];
    let current = new Date(`1970-01-01T${start}:00`);
    const endDate = new Date(`1970-01-01T${end}:00`);

    while (current < endDate) {
        slots.push(current.toTimeString().substring(0, 5));
        current.setMinutes(current.getMinutes() + interval);
    }
    return slots;
}

const timeIntervals = generateTimeSlots("09:00", "14:00", 15);
const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

const subjectClassMapping = {
    'cono': 'cono',
    'ingles': 'ingles',
    'frances': 'frances',
    'musica': 'musica',
    'plastica': 'plastica',
    'religion': 'religion',
    'mates': 'mates-lengua',
    'lengua': 'mates-lengua',
    'fisica': 'ed-fisica',
    'ed fisica': 'ed-fisica',
    'educacion fisica': 'ed-fisica',
    'refuerzo': 'refuerzo',
    'at edu': 'at-edu',
    'atencion educativa': 'at-edu',
    'coord': 'coord-admin',
    'direcc': 'coord-admin',
    'jef': 'coord-admin',
    'secr': 'coord-admin'
};

function getSubjectClass(subjectName) {
    if (!subjectName) return '';
    
    // Normalizar el nombre: quitar acentos, puntos y convertir a minúsculas
    const normalizedSubject = subjectName.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
        .replace(/\./g, ''); // Quitar puntos
    
    const mappingKey = Object.keys(subjectClassMapping).find(key => 
        normalizedSubject.includes(key)
    );
    
    return mappingKey ? `subject-color--${subjectClassMapping[mappingKey]}` : '';
}

let schedules = {};
let currentEditingCell = null;

function initializeAppData() {
    loadGroupsData();
    loadTeachersData();
    loadSchedulesFromStorage();
    ensureAllScheduleSlotsAreArrays();

    // Asegurar que cada grupo tiene un horario inicializado
    Object.keys(groups).forEach(groupName => {
        ensureScheduleExistsForGroup(groupName);
    });
    
    // Guardar solo si hubo cambios
    saveSchedulesToStorage();
}

// Función para garantizar que todas las estructuras de horarios sean arrays
function ensureAllScheduleSlotsAreArrays() {
    let hasChanges = false;
    
    Object.keys(schedules).forEach(group => {
        Object.keys(schedules[group]).forEach(day => {
            Object.keys(schedules[group][day]).forEach(time => {
                const slot = schedules[group][day][time];
                
                if (!Array.isArray(slot)) {
                    hasChanges = true;
                    
                    if (slot && typeof slot === 'object') {
                        // Convertir objeto individual a array
                        schedules[group][day][time] = [slot];
                    } else {
                        // Inicializar como array vacío
                        schedules[group][day][time] = [];
                    }
                }
            });
        });
    });
    
    if (hasChanges) {
        console.log('Se corrigieron algunas estructuras de datos no válidas');
    }
}

// --- Persistencia de Datos ---
function saveSchedulesToStorage() {
    try {
        // Verificar estructura antes de guardar y corregir si es necesario
        const schedulesToSave = {};
        
        Object.keys(schedules).forEach(group => {
            schedulesToSave[group] = {};
            Object.keys(schedules[group]).forEach(day => {
                schedulesToSave[group][day] = {};
                Object.keys(schedules[group][day]).forEach(time => {
                    const slot = schedules[group][day][time];
                    schedulesToSave[group][day][time] = Array.isArray(slot) ? slot : [];
                });
            });
        });
        
        localStorage.setItem('horariosSchedules', JSON.stringify(schedulesToSave));
        return true;
    } catch (error) {
        console.error('Error al guardar datos:', error);
        showNotification('Error al guardar los datos', 'error', 3000);
        return false;
    }
}

function loadSchedulesFromStorage() {
    const savedSchedules = localStorage.getItem('horariosSchedules');
    // Solo cargar si existen datos y no es un objeto vacío. Previene borrados.
    if (savedSchedules && savedSchedules !== '{}') {
        const parsedSchedules = JSON.parse(savedSchedules);
        
        // Verificar si los datos necesitan migración
        if (needsMigration(parsedSchedules)) {
            console.log('Migrando datos antiguos al nuevo formato...');
            schedules = migrateScheduleData(parsedSchedules);
            // Guardar los datos migrados
            saveSchedulesToStorage();
            console.log('Migración completada.');
            
            // Mostrar notificación al usuario
            showNotification('Los datos han sido actualizados automáticamente para soportar múltiples profesores por clase. Si encuentras algún problema, por favor reportalo.', 'success', 8000);
        } else {
            schedules = parsedSchedules;
        }
    } else {
        initializeSchedules();
    }
}

// Función para mostrar notificaciones
function showNotification(message, type = 'info', duration = 5000) {
    // Eliminar notificaciones anteriores
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => notif.remove());
    
    // Crear nueva notificación
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Eliminar después de 'duration' milisegundos
    setTimeout(() => {
        notification.classList.add('hide');
        setTimeout(() => {
            notification.remove();
        }, 500); // Tiempo de la animación
    }, duration);
}

// Función para determinar si los datos necesitan migración
function needsMigration(schedulesData) {
    // 1. Verificar si algún slot de tiempo no es un array
    for (const group in schedulesData) {
        for (const day in schedulesData[group]) {
            for (const time in schedulesData[group][day]) {
                // Si no es un array, necesita migración
                if (!Array.isArray(schedulesData[group][day][time])) {
                    console.log(`Slot ${group}/${day}/${time} no es un array`);
                    return true;
                }
                
                // Si es un array pero algún elemento no tiene ID, necesita migración
                const slotItems = schedulesData[group][day][time];
                for (const item of slotItems) {
                    if (!item.id) {
                        console.log(`Elemento sin ID en ${group}/${day}/${time}`);
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

// Función para migrar datos antiguos al nuevo formato
function migrateScheduleData(oldSchedules) {
    const newSchedules = {};
    
    // Recorrer todos los grupos
    Object.keys(oldSchedules).forEach(group => {
        newSchedules[group] = {};
        
        // Recorrer todos los días
        Object.keys(oldSchedules[group]).forEach(day => {
            newSchedules[group][day] = {};
            
            // Recorrer todos los slots de tiempo
            Object.keys(oldSchedules[group][day]).forEach(time => {
                const oldSlotData = oldSchedules[group][day][time];
                
                // Convertir el slot a un array si no lo es
                if (!Array.isArray(oldSlotData)) {
                    // Si es un objeto con datos (no vacío y no null)
                    if (oldSlotData && typeof oldSlotData === 'object' && (oldSlotData.subject || oldSlotData.isContinuation)) {
                        // Añadir ID al objeto
                        const itemWithId = { ...oldSlotData, id: generateUniqueId() };
                        newSchedules[group][day][time] = [itemWithId];
                    } else {
                        // Si está vacío o es null, inicializar como array vacío
                        newSchedules[group][day][time] = [];
                    }
                } else {
                    // Ya es un array, pero necesitamos verificar si cada elemento tiene ID
                    newSchedules[group][day][time] = oldSlotData.map(item => {
                        if (!item.id) {
                            return { ...item, id: generateUniqueId() };
                        }
                        return item;
                    });
                }
            });
        });
    });
    
    // Segundo paso: relacionar los elementos de continuación con sus elementos principales
    Object.keys(newSchedules).forEach(group => {
        Object.keys(newSchedules[group]).forEach(day => {
            // 1. Primero, recopilar todos los elementos de inicio
            const startItems = {};
            
            Object.keys(newSchedules[group][day]).forEach(time => {
                newSchedules[group][day][time].forEach(item => {
                    if (item.isStart) {
                        startItems[time] = { id: item.id, subject: item.subject };
                    }
                });
            });
            
            // 2. Ahora, asociar las continuaciones con sus elementos principales
            Object.keys(newSchedules[group][day]).forEach(time => {
                newSchedules[group][day][time] = newSchedules[group][day][time].map(item => {
                    if (item.isContinuation && item.startTime && !item.parentId) {
                        const startItem = startItems[item.startTime];
                        if (startItem) {
                            return { ...item, parentId: startItem.id };
                        }
                    }
                    return item;
                });
            });
        });
    });
    
    console.log('Migración con IDs completada');
    return newSchedules;
}

// Función para generar un ID único
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// --- Inicializadores de Página ---

// Se llama desde index.html
function initIndexPage() {
    initializeAppData();
    addEventListeners();
    populateGroupFilter();
    renderSchedules();
}

function buildTeacherSchedules(schedules) {
    const teacherSchedules = {};
    const teacherNames = teachers.map(t => t.name); // Get a list of names for quick lookup

    teachers.forEach(teacher => {
        teacherSchedules[teacher.name] = {};
        days.forEach(day => {
            teacherSchedules[teacher.name][day] = {};
            timeIntervals.forEach(time => {
                teacherSchedules[teacher.name][day][time] = []; // Inicializar como array vacío
            });
        });
    });

    Object.keys(schedules).forEach(groupName => {
        Object.keys(schedules[groupName]).forEach(day => {
            Object.keys(schedules[groupName][day]).forEach(time => {
                const scheduleItems = schedules[groupName][day][time];
                if (Array.isArray(scheduleItems)) {
                    scheduleItems.forEach(scheduleItem => {
                        if (scheduleItem && scheduleItem.isStart) {
                            const teacherName = scheduleItem.teacher;
                            if (teacherSchedules[teacherName]) {
                                // Usamos push para añadir, por si un profesor tiene dos clases a la vez (aunque no debería)
                                teacherSchedules[teacherName][day][time].push({
                                    subject: scheduleItem.subject,
                                    group: groupName,
                                    duration: scheduleItem.duration,
                                    isStart: true
                                });
                                
                                const numSlots = (scheduleItem.duration * 60) / 15;
                                let currentTime = new Date(`1970-01-01T${time}:00`);
                                for (let i = 1; i < numSlots; i++) {
                                    currentTime.setMinutes(currentTime.getMinutes() + 15);
                                    const slotTime = currentTime.toTimeString().substring(0, 5);
                                    if (teacherSchedules[teacherName]?.[day]?.[slotTime]) {
                                        teacherSchedules[teacherName][day][slotTime].push({ isContinuation: true, startTime: time });
                                    }
                                }
                            }
                        }
                    });
                }
            });
        });
    });
    return teacherSchedules;
}

function initializeSchedules() {
    Object.keys(groups).forEach(group => {
        schedules[group] = {};
        days.forEach(day => {
            schedules[group][day] = {};
            // Cada slot ahora es un array para permitir múltiples asignaturas
            timeIntervals.forEach(time => {
                schedules[group][day][time] = [];
            });
        });
    });
}

function ensureScheduleExistsForGroup(groupName) {
    if (!schedules[groupName]) {
        schedules[groupName] = {};
        days.forEach(day => {
            schedules[groupName][day] = {};
            // Cada slot ahora es un array para permitir múltiples asignaturas
            timeIntervals.forEach(time => {
                schedules[groupName][day][time] = [];
            });
        });
    }
}

function populateGroupFilter() {
    const filter = document.getElementById('groupFilter');
    const currentValue = filter.value;
    filter.innerHTML = '<option value="">Todos los grupos</option>'; // Limpiar opciones anteriores
    Object.keys(groups).sort((a, b) => (groups[a].orden || 0) - (groups[b].orden || 0)).forEach(group => {
        const option = document.createElement('option');
        option.value = group;
        option.textContent = group;
        filter.appendChild(option);
    });
    filter.value = currentValue;
}

function renderSchedules() {
    const container = document.getElementById('scheduleContainer');
    const filter = document.getElementById('groupFilter').value;
    container.innerHTML = '';

    const sortedGroups = Object.keys(groups).sort((a, b) => (groups[a].orden || 0) - (groups[b].orden || 0));
    const groupsToShow = filter ? [filter] : sortedGroups;
    
    groupsToShow.forEach(groupName => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'group-schedule';
        
        const title = document.createElement('div');
        title.className = 'group-title';
        title.innerHTML = `${groupName}<br><small>Tutor: ${groups[groupName].tutor}</small>`;
        
        const assignedHours = calculateAssignedHours(groupName);
        const totalRequiredHours = calculateTotalRequiredHours(groupName);
        
        let remainingHoursHtml = '';
        const missingLines = [];
        const surplusLines = [];
        let hasSurplus = false;

        Object.keys(totalRequiredHours).forEach(subject => {
            const assigned = assignedHours[subject] || 0;
            const required = totalRequiredHours[subject];
            const remaining = required - assigned;
            
            if (remaining > 0) {
                missingLines.push(`<span>${subject}: Faltan ${remaining}h</span>`);
            } else if (remaining < 0) {
                surplusLines.push(`<span class="surplus-subject">${subject}: Sobran ${Math.abs(remaining)}h</span>`);
                hasSurplus = true;
            }
        });

        if (missingLines.length > 0 || surplusLines.length > 0) {
            const missingColumn = missingLines.length > 0 ? missingLines.join('<br>') : '';
            const surplusColumn = surplusLines.length > 0 ? surplusLines.join('<br>') : '';
            
            remainingHoursHtml = `<div class="remaining-hours ${hasSurplus ? 'has-surplus' : ''}" style="display: flex; gap: 20px;">
                <div style="flex: 1;">${missingColumn}</div>
                <div style="flex: 1;">${surplusColumn}</div>
            </div>`;
        } else {
            remainingHoursHtml = `<div class="remaining-hours">Todas las horas asignadas</div>`;
        }

        title.innerHTML += remainingHoursHtml;
        
        // Crear el calendario estilo Google
        const calendarContainer = document.createElement('div');
        calendarContainer.className = 'calendar-container';
        
        // Columna de tiempo
        const timeColumn = document.createElement('div');
        timeColumn.className = 'time-column';
        renderTimeColumnForGroup(timeColumn);
        
        // Grid del calendario
        const calendarGrid = document.createElement('div');
        calendarGrid.className = 'calendar-grid';
        
        // Header de días
        const daysHeader = document.createElement('div');
        daysHeader.className = 'days-header';
        days.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-header';
            dayHeader.innerHTML = `<div class="day-name">${day}</div>`;
            daysHeader.appendChild(dayHeader);
        });
        
        // Grid de la semana
        const weekGrid = document.createElement('div');
        weekGrid.className = 'week-grid';
        
        days.forEach(day => {
            const dayColumn = document.createElement('div');
            dayColumn.className = 'day-column';
            dayColumn.dataset.group = groupName;
            dayColumn.dataset.day = day;
            
            // Crear slots de 15 minutos para el día
            renderTimeSlotsForDay(dayColumn, groupName, day);
            
            // Renderizar eventos del día
            renderEventsForDay(dayColumn, groupName, day);
            
            weekGrid.appendChild(dayColumn);
        });
        
        calendarGrid.appendChild(daysHeader);
        calendarGrid.appendChild(weekGrid);
        
        calendarContainer.appendChild(timeColumn);
        calendarContainer.appendChild(calendarGrid);
        
        groupDiv.appendChild(title);
        groupDiv.appendChild(calendarContainer);
        container.appendChild(groupDiv);
    });
    
    setTimeout(checkAllConflicts, 100);
}

function renderTimeColumnForGroup(timeColumn) {
    // Crear el header spacer específicamente para alinearse con el header de días
    const headerSpacer = document.createElement('div');
    headerSpacer.className = 'time-header-spacer';
    headerSpacer.style.height = '50px'; // Mismo height que days-header
    headerSpacer.style.borderBottom = '1px solid #dadce0';
    timeColumn.appendChild(headerSpacer);
    
    // Usar exactamente los mismos intervalos que timeIntervals
    timeIntervals.forEach((time, index) => {
        const timeSlot = document.createElement('div');
        timeSlot.className = 'time-slot';
        
        // Mostrar la hora solo cada 4 slots (cada hora completa)
        if (index % 4 === 0) {
            timeSlot.textContent = time;
            timeSlot.style.fontWeight = '500';
        } else {
            timeSlot.textContent = '';
        }
        
        timeColumn.appendChild(timeSlot);
    });
}

function renderTimeSlotsForDay(dayColumn, groupName, day) {
    timeIntervals.forEach(time => {
        const timeSlot = document.createElement('div');
        timeSlot.className = 'time-slot-15';
        timeSlot.dataset.group = groupName;
        timeSlot.dataset.day = day;
        timeSlot.dataset.time = time;
        timeSlot.addEventListener('click', () => openSubjectSelector(timeSlot));
        dayColumn.appendChild(timeSlot);
    });
}

function renderEventsForDay(dayColumn, groupName, day) {
    if (!schedules[groupName] || !schedules[groupName][day]) return;
    
    // Renderizar recreo solo si no hay clases en ese horario
    const recreoTime = '12:00';
    const recreoSchedule = schedules[groupName][day][recreoTime];
    if (!recreoSchedule || recreoSchedule.length === 0) {
        const recreoEvent = document.createElement('div');
        recreoEvent.className = 'calendar-event recreo-event';
        recreoEvent.textContent = 'RECREO';
        recreoEvent.style.top = calculateEventPosition('12:00') + 'px';
        recreoEvent.style.height = '40px'; // 30 minutos = 2 slots * 20px
        dayColumn.appendChild(recreoEvent);
    }
    
    // Agrupar eventos por hora de inicio para detectar coincidencias
    const eventsByStartTime = {};
    
    timeIntervals.forEach(time => {
        const schedule = schedules[groupName][day][time];
        if (schedule && schedule.length > 0) {
            const startingEvents = schedule.filter(item => item.isStart);
            if (startingEvents.length > 0) {
                eventsByStartTime[time] = startingEvents;
            }
        }
    });
    
    // Renderizar eventos, posicionando múltiples eventos lado a lado
    Object.keys(eventsByStartTime).forEach(startTime => {
        const events = eventsByStartTime[startTime];
        const numEvents = events.length;
        
        events.forEach((item, index) => {
            const event = document.createElement('div');
            event.className = 'calendar-event ' + getSubjectClass(item.subject);
            
            // Agregar atributos data para identificar el evento en conflictos
            event.dataset.group = groupName;
            event.dataset.day = day;
            event.dataset.time = startTime;
            event.dataset.teacher = item.teacher;
            event.dataset.subject = item.subject;
            
            // Añadir clase para eventos múltiples
            if (numEvents > 1) {
                event.classList.add('multiple-event');
            }
            
            const endTime = calculateEndTime(startTime, item.duration);
            
            event.innerHTML = `
                <div class="event-title">${item.subject}</div>
                <div class="event-teacher">${item.teacher}</div>
                <div class="event-time">${startTime}-${endTime}</div>
            `;
            
            event.style.top = calculateEventPosition(startTime) + 'px';
            event.style.height = (item.duration * 80) + 'px'; // 1 hora = 80px
            
            // Posicionar eventos lado a lado cuando hay múltiples
            if (numEvents > 1) {
                const eventWidth = Math.floor(98 / numEvents); // 98% del ancho dividido entre eventos
                const leftOffset = (index * eventWidth) + 1; // 1% de margen
                
                event.style.left = leftOffset + '%';
                event.style.width = eventWidth + '%';
                event.style.right = 'auto'; // Desactivar right para usar width
                
                // Reducir padding y font-size para eventos múltiples
                event.style.padding = '2px 4px';
                event.style.fontSize = '10px';
                
                // Hacer el texto más compacto
                const eventTitle = event.querySelector('.event-title');
                const eventTeacher = event.querySelector('.event-teacher');
                const eventTime = event.querySelector('.event-time');
                
                if (eventTitle) eventTitle.style.fontSize = '10px';
                if (eventTeacher) eventTeacher.style.fontSize = '8px';
                if (eventTime) eventTime.style.fontSize = '8px';
            } else {
                // Evento único, usar posicionamiento normal
                event.style.left = '2px';
                event.style.right = '2px';
            }
            
            event.addEventListener('click', () => {
                const fakeCell = {
                    dataset: { group: groupName, day: day, time: startTime }
                };
                openSubjectSelector(fakeCell);
            });
            
            dayColumn.appendChild(event);
        });
    });
}

function calculateEventPosition(timeStr) {
    const timeIntervalIndex = timeIntervals.indexOf(timeStr);
    return timeIntervalIndex * 20; // 20px por cada slot de 15 minutos
}

function calculateEndTime(startTime, durationHours) {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = new Date(startDate.getTime() + (durationHours * 60 * 60 * 1000));
    
    return endDate.toTimeString().substring(0, 5);
}

function openSubjectSelector(cell) {
    const { group, day, time } = cell.dataset;
    currentEditingCell = { group, day, time, cell };
    
    const modal = document.getElementById('subjectSelector');
    const subjectSelect = document.getElementById('subjectSelect');
    
    subjectSelect.innerHTML = '<option value="">-- Seleccionar --</option>';
    
    Object.keys(groups[group].subjects).forEach(subject => {
        const option = document.createElement('option');
        option.value = subject;
        option.textContent = `${subject} (${groups[group].subjects[subject].teacher})`;
        subjectSelect.appendChild(option);
    });
    
    const scheduleItems = schedules[group][day][time];
    if (scheduleItems && scheduleItems.length > 0) {
        // Encontrar elementos que no sean continuaciones
        const startItems = scheduleItems.filter(item => item.isStart);
        
        if (startItems.length > 0) {
            // Intentar tomar el primer elemento que sea de inicio
            subjectSelect.value = startItems[0].subject;
            document.getElementById('durationSelect').value = startItems[0].duration || "1";
            
            // Si hay múltiples asignaturas, mostrar mensaje informativo
            if (startItems.length > 1) {
                // Añadir texto informativo arriba del selector
                const infoText = document.createElement('div');
                infoText.className = 'multi-subject-info';
                infoText.innerHTML = `<strong>Hay ${startItems.length} asignaturas en este slot:</strong><br>` +
                                    startItems.map(item => `- ${item.subject} (${item.teacher})`).join('<br>');
                
                // Insertar antes del selector
                const modal = document.getElementById('subjectSelector');
                const h4 = modal.querySelector('h4');
                
                // Eliminar mensaje anterior si existe
                const oldInfo = modal.querySelector('.multi-subject-info');
                if (oldInfo) oldInfo.remove();
                
                modal.insertBefore(infoText, h4.nextSibling);
            } else {
                // Eliminar mensaje si solo hay una asignatura
                const oldInfo = document.getElementById('subjectSelector').querySelector('.multi-subject-info');
                if (oldInfo) oldInfo.remove();
            }
        } else if (scheduleItems[0].isContinuation) {
            // Es una continuación, buscar el slot de inicio
            const startTime = scheduleItems[0].startTime;
            const startSlotItems = schedules[group][day][startTime];
            
            if (startSlotItems && startSlotItems.length > 0) {
                const startItems = startSlotItems.filter(item => item.isStart);
                if (startItems.length > 0) {
                    subjectSelect.value = startItems[0].subject;
                    document.getElementById('durationSelect').value = startItems[0].duration || "1";
                }
            }
        }
    } else {
        subjectSelect.value = "";
        document.getElementById('durationSelect').value = "1";
        
        // Eliminar mensaje si no hay asignaturas
        const oldInfo = document.getElementById('subjectSelector').querySelector('.multi-subject-info');
        if (oldInfo) oldInfo.remove();
    }
    
    modal.style.display = 'block';
}

function assignSubject() {
    if (!currentEditingCell) return;
    
    const subject = document.getElementById('subjectSelect').value;
    const duration = parseFloat(document.getElementById('durationSelect').value);
    
    if (!subject) {
        alert('Por favor selecciona una asignatura');
        return;
    }
    
    const { group, day, time } = currentEditingCell;
    const teacher = groups[group].subjects[subject].teacher;

    // Calcular slots de tiempo necesarios
    const numSlots = (duration * 60) / 15;
    const timeSlotsToOccupy = [];
    let currentTime = new Date(`1970-01-01T${time}:00`);
    
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
        
        const itemsInSlot = schedules[group]?.[day]?.[slot] || [];
        if (itemsInSlot.length >= 2 && slot !== time) {
            alert(`El slot ${slot} ya tiene dos clases. No se pueden añadir más.`);
            return;
        }
    }

    // Eliminar asignatura existente del mismo profesor si la hay
    const existingItems = schedules[group][day][time];
    if (existingItems && existingItems.length > 0) {
        const existingIndex = existingItems.findIndex(item => item.teacher === teacher);
        if (existingIndex !== -1) {
            removeSubject(false, { 
                ...currentEditingCell, 
                subjectToRemove: existingItems[existingIndex].subject 
            });
        } else if (existingItems.length >= 2) {
            alert('Este hueco ya tiene dos asignaturas. No se pueden añadir más.');
            return;
        }
    }

    // Crear nuevo item
    const newScheduleItem = {
        id: generateUniqueId(),
        subject: subject,
        teacher: teacher,
        duration: duration,
        isStart: true,
        createdAt: new Date().toISOString()
    };

    // Asegurar que el slot es un array y añadir el item
    if (!Array.isArray(schedules[group][day][time])) {
        schedules[group][day][time] = [];
    }
    schedules[group][day][time].push(newScheduleItem);

    // Crear celdas de continuación
    const parentId = newScheduleItem.id;
    for (let i = 1; i < timeSlotsToOccupy.length; i++) {
        const continuationSlot = timeSlotsToOccupy[i];
        
        if (!Array.isArray(schedules[group][day][continuationSlot])) {
            schedules[group][day][continuationSlot] = [];
        }
        
        schedules[group][day][continuationSlot].push({
            id: generateUniqueId(),
            parentId: parentId,
            isContinuation: true,
            startTime: time
        });
    }
    
    closeModal();
    renderSchedules();
    saveSchedulesToStorage();
}

function removeSubject(shouldRender = true, cellInfo = currentEditingCell) {
    if (!cellInfo) {
        console.warn('No hay celda seleccionada para eliminar');
        return;
    }
    
    const { group, day, time } = cellInfo;
    const scheduleItems = schedules[group]?.[day]?.[time];
    
    if (!scheduleItems || scheduleItems.length === 0) {
        console.warn(`No hay elementos para eliminar en ${group}/${day}/${time}`);
        return;
    }

    let itemToRemove = null;
    let startTime = time;
    const idsToRemove = new Set();

    // Determinar el elemento a eliminar
    const isContinuation = scheduleItems.some(item => item.isContinuation);
    
    if (isContinuation) {
        const continuationItem = scheduleItems.find(item => item.isContinuation);
        
        if (continuationItem?.parentId) {
            // Buscar por parentId en todo el día
            Object.keys(schedules[group][day]).forEach(slotTime => {
                schedules[group][day][slotTime].forEach(item => {
                    if (item.id === continuationItem.parentId || item.parentId === continuationItem.parentId) {
                        idsToRemove.add(item.id);
                    }
                });
            });
        } else if (continuationItem?.startTime) {
            startTime = continuationItem.startTime;
            const startSlotItems = schedules[group][day][startTime];
            
            if (startSlotItems?.length === 1) {
                itemToRemove = startSlotItems[0];
            } else {
                const subjectName = cellInfo.subjectToRemove || document.getElementById('subjectSelect')?.value;
                itemToRemove = startSlotItems?.find(item => item.subject === subjectName);
            }
        }
    } else {
        const subjectName = cellInfo.subjectToRemove || document.getElementById('subjectSelect')?.value;
        
        if (subjectName) {
            itemToRemove = scheduleItems.find(item => item.subject === subjectName);
        } else {
            itemToRemove = scheduleItems.find(item => item.isStart) || scheduleItems[0];
        }
    }

    // Recopilar IDs a eliminar
    if (itemToRemove) {
        if (itemToRemove.id) {
            idsToRemove.add(itemToRemove.id);
            
            // Buscar elementos relacionados
            Object.keys(schedules[group][day]).forEach(slotTime => {
                schedules[group][day][slotTime].forEach(item => {
                    if ((item.parentId === itemToRemove.id) || 
                        (item.startTime === startTime && item.isContinuation)) {
                        if (item.id) idsToRemove.add(item.id);
                    }
                });
            });
        } else {
            // Método antiguo para datos sin ID
            return removeSubjectLegacy(itemToRemove, startTime, group, day, shouldRender);
        }
    }

    if (idsToRemove.size === 0) {
        console.warn('No se encontraron elementos para eliminar');
        return;
    }

    // Eliminar elementos
    let elementsRemoved = 0;
    Object.keys(schedules[group][day]).forEach(slotTime => {
        const beforeCount = schedules[group][day][slotTime].length;
        
        schedules[group][day][slotTime] = schedules[group][day][slotTime].filter(item => {
            const shouldRemove = item.id ? idsToRemove.has(item.id) : false;
            if (shouldRemove) elementsRemoved++;
            return !shouldRemove;
        });
    });

    console.log(`Eliminados ${elementsRemoved} elementos`);
    
    saveSchedulesToStorage();
    
    if (shouldRender) {
        closeModal();
        renderSchedules();
    }
}

// Función auxiliar para compatibilidad con datos antiguos
function removeSubjectLegacy(itemToRemove, startTime, group, day, shouldRender) {
    const numSlots = (itemToRemove.duration * 60) / 15;
    
    for (let i = 0; i < numSlots; i++) {
        const slotTime = new Date(`1970-01-01T${startTime}:00`);
        slotTime.setMinutes(slotTime.getMinutes() + i * 15);
        const timeKey = slotTime.toTimeString().substring(0, 5);
        
        if (schedules[group]?.[day]?.[timeKey]) {
            schedules[group][day][timeKey] = schedules[group][day][timeKey].filter(item => {
                return !(item.startTime === startTime && 
                        (item.subject === itemToRemove.subject || item.isContinuation));
            });
        }
    }
    
    saveSchedulesToStorage();
    
    if (shouldRender) {
        closeModal();
        renderSchedules();
    }
}

function closeModal() {
    document.getElementById('subjectSelector').style.display = 'none';
    currentEditingCell = null;
}

function checkAllConflicts() {
    const conflicts = [];
    const teacherSchedule = {};
    
    Object.keys(schedules).forEach(group => {
        Object.keys(schedules[group]).forEach(day => {
            timeIntervals.forEach(time => {
                const scheduleItems = schedules[group][day][time];
                // Añadir comprobación para asegurar que es un array antes de iterar
                if (Array.isArray(scheduleItems)) {
                    scheduleItems.forEach(schedule => {
                        if (!schedule.isStart) return;

                        const teacher = schedule.teacher;
                        const duration = schedule.duration;
                        const numSlots = (duration * 60) / 15;
                        let currentTime = new Date(`1970-01-01T${time}:00`);

                        for (let i = 0; i < numSlots; i++) {
                            const slotTime = currentTime.toTimeString().substring(0, 5);
                            const key = `${day}-${slotTime}`;
                            
                            if (!teacherSchedule[teacher]) {
                                teacherSchedule[teacher] = {};
                            }
                            
                            if (!teacherSchedule[teacher][key]) {
                                teacherSchedule[teacher][key] = [];
                            }
                            
                            teacherSchedule[teacher][key].push({
                                group: group,
                                subject: schedule.subject
                            });

                            currentTime.setMinutes(currentTime.getMinutes() + 15);
                        }
                    });
                }
            });
        });
    });
    
    Object.keys(teacherSchedule).forEach(teacher => {
        Object.keys(teacherSchedule[teacher]).forEach(timeKey => {
            if (teacherSchedule[teacher][timeKey].length > 1) {
                conflicts.push({
                    teacher: teacher,
                    time: timeKey,
                    groups: teacherSchedule[teacher][timeKey]
                });
            }
        });
    });
    
    displayConflicts(conflicts);
    highlightConflicts(conflicts);
}

function displayConflicts(conflicts) {
    const panel = document.getElementById('conflictsPanel');
    const list = document.getElementById('conflictsList');

    // Si el panel no existe, salir
    if (!panel || !list) return;

    if (conflicts.length === 0) {
        panel.classList.remove('show');
        return;
    }

    panel.classList.add('show');
    list.innerHTML = '';

    conflicts.forEach(conflict => {
        const item = document.createElement('div');
        item.className = 'conflict-item';
        const [day, time] = conflict.time.split('-', 2);
        const groupNames = conflict.groups.map(g => `${g.group} (${g.subject})`).join(', ');
        
        item.innerHTML = `
            <strong>${conflict.teacher}</strong> tiene conflicto el <strong>${day}</strong> 
            a las <strong>${time}</strong>: ${groupNames}
        `;
        list.appendChild(item);
    });
}

function highlightConflicts(conflicts) {
    // Limpiar los conflictos de ambas vistas para evitar inconsistencias
    document.querySelectorAll('.class-slot.conflict, .teacher-schedule-compact td.conflict, .calendar-event.conflict').forEach(cell => {
        cell.classList.remove('conflict');
    });

    // Determinar en qué vista estamos. La vista de grupos tiene el filtro.
    const isGroupView = !!document.getElementById('groupFilter');

    conflicts.forEach(conflict => {
        const [day, timeKey] = conflict.time.split('-', 2);
        
        conflict.groups.forEach(groupInfo => {
            let startTime = timeKey;
            const scheduleItems = schedules[groupInfo.group][day][timeKey];
            if (scheduleItems.length > 0 && scheduleItems[0].isContinuation) {
                startTime = scheduleItems[0].startTime;
            }
            
            let cell;
            if (isGroupView) {
                // Intentar con la nueva vista de calendario primero
                const calendarEventSelector = `.calendar-event[data-group="${groupInfo.group}"][data-day="${day}"][data-time="${startTime}"][data-teacher="${conflict.teacher}"]`;
                cell = document.querySelector(calendarEventSelector);
                
                // Si no lo encuentra, intentar con la vista clásica
                if (!cell) {
                    const cellSelector = `.class-slot[data-group="${groupInfo.group}"][data-day="${day}"][data-time="${startTime}"]`;
                    cell = document.querySelector(cellSelector);
                }
            } else { // Asumimos que es la vista de profesor
                const teacher = conflict.teacher;
                const cellSelector = `td[data-teacher="${teacher}"][data-day="${day}"][data-time="${startTime}"]`;
                cell = document.querySelector(cellSelector);
            }
            
            if (cell) {
                cell.classList.add('conflict');
            }
        });
    });
}

function calculateAssignedHours(groupName) {
    const assigned = {};
    const groupSchedule = schedules[groupName];
    
    if (!groupSchedule) return assigned;

    Object.values(groupSchedule).forEach(daySchedule => {
        Object.values(daySchedule).forEach(timeSlot => {
            if (Array.isArray(timeSlot)) {
                timeSlot.forEach(item => {
                    if (item.isStart && item.subject) {
                        assigned[item.subject] = (assigned[item.subject] || 0) + (item.duration || 1);
                    }
                });
            }
        });
    });
    
    return assigned;
}

function calculateTotalRequiredHours(groupName) {
    const required = {};
    const groupSubjects = groups[groupName] ? groups[groupName].subjects : {};
    Object.entries(groupSubjects).forEach(([subjectName, details]) => {
        required[subjectName] = details.hours;
    });
    return required;
}

function exportData() {
    const data = {
        groups: groups,
        teachers: teachers,
        schedules: schedules,
        timestamp: new Date().toISOString(),
        version: "3.0"
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `horarios_completo_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importData() {
    document.getElementById('importFile').click();
}

function addEventListeners() {
    // Solo agregar listener al filtro de grupos si existe (página principal)
    const groupFilter = document.getElementById('groupFilter');
    if (groupFilter) {
        groupFilter.addEventListener('change', renderSchedules);
    }
    
    // Event listeners para botones de export/import (existen en todas las páginas)
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }
    if (importBtn) {
        importBtn.addEventListener('click', importData);
    }

    // Event listeners para modal de asignaturas (solo en algunas páginas)
    const assignBtn = document.getElementById('assignSubjectBtn');
    const removeBtn = document.getElementById('removeSubjectBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    
    if (assignBtn) {
        assignBtn.addEventListener('click', assignSubject);
    }
    if (removeBtn) {
        removeBtn.addEventListener('click', () => removeSubject(true));
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModal);
    }

    // Event listener para el input de importar archivo
    const importFile = document.getElementById('importFile');
    if (importFile) {
        importFile.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    const data = JSON.parse(event.target.result);
                    let message = '';

                    if (data.groups) {
                        groups = data.groups;
                        saveGroupsData();
                        message += 'Datos de grupos importados. ';
                    }

                    if (data.teachers) {
                        teachers = data.teachers;
                        saveTeachersData();
                        message += 'Datos de profesores importados. ';
                    }

                    if (data.schedules) {
                        schedules = data.schedules;
                        saveSchedulesToStorage();
                        message += 'Datos de horarios importados.';
                    }

                    if (message) {
                        alert(message + ' La página se recargará para aplicar los cambios.');
                        location.reload();
                    } else {
                        alert('El archivo no contiene datos reconocibles (groups, teachers o schedules).');
                    }

                } catch (error) {
                    alert('Error al importar el archivo: ' + error.message);
                }
            };
            reader.readAsText(file);
        });
    }

    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
}
