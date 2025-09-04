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
    'inglés': 'ingles',
    'francés': 'frances',
    'música': 'musica',
    'plástica': 'plastica',
    'religión': 'religion',
    'mates': 'mates-lengua',
    'lengua': 'mates-lengua',
    'fisica': 'ed-fisica', // Cambiado de 'ed. fisica' a 'fisica' para más flexibilidad
    'refuerzo': 'refuerzo'
};

function getSubjectClass(subjectName) {
    if (!subjectName) return '';
    const lowerSubject = subjectName.toLowerCase();
    // Buscar coincidencias exactas o parciales
    for (const key in subjectClassMapping) {
        if (lowerSubject.includes(key)) {
            return `subject-color--${subjectClassMapping[key]}`;
        }
    }
    return '';
}

let schedules = {};
let currentEditingCell = null;

function initializeAppData() {
    loadGroupsData();
    loadTeachersData();
    loadSchedulesFromStorage();
    ensureAllScheduleSlotsAreArrays(); // Agregar esta verificación adicional

    // Reconciliación de datos: asegurar que cada grupo tiene un horario.
    Object.keys(groups).forEach(groupName => {
        ensureScheduleExistsForGroup(groupName);
    });
    saveSchedulesToStorage(); // Guardar por si se ha creado algún horario para un grupo que no lo tenía
}

// Función para garantizar que todas las estructuras de horarios sean arrays
function ensureAllScheduleSlotsAreArrays() {
    Object.keys(schedules).forEach(group => {
        Object.keys(schedules[group]).forEach(day => {
            Object.keys(schedules[group][day]).forEach(time => {
                if (!Array.isArray(schedules[group][day][time])) {
                    console.warn(`Convertido slot no-array en grupo ${group}, día ${day}, hora ${time}`);
                    
                    // Si es un objeto (asignatura), convertirlo a array con ese objeto
                    if (schedules[group][day][time] && typeof schedules[group][day][time] === 'object') {
                        schedules[group][day][time] = [schedules[group][day][time]];
                    } else {
                        schedules[group][day][time] = [];
                    }
                }
            });
        });
    });
}

// --- Persistencia de Datos ---
function saveSchedulesToStorage() {
    try {
        // Crear una copia profunda para evitar problemas con referencias
        const schedulesToSave = JSON.parse(JSON.stringify(schedules));
        
        // Verificar la estructura antes de guardar
        Object.keys(schedulesToSave).forEach(group => {
            Object.keys(schedulesToSave[group]).forEach(day => {
                Object.keys(schedulesToSave[group][day]).forEach(time => {
                    // Asegurarse de que cada slot sea un array
                    if (!Array.isArray(schedulesToSave[group][day][time])) {
                        console.warn(`Corrigiendo formato antes de guardar: ${group}/${day}/${time}`);
                        schedulesToSave[group][day][time] = [];
                    }
                });
            });
        });
        
        // Guardar en localStorage
        const jsonData = JSON.stringify(schedulesToSave);
        localStorage.setItem('horariosSchedules', jsonData);
        
        console.log(`Datos guardados correctamente: ${jsonData.length} bytes`);
        return true;
    } catch (error) {
        console.error('Error al guardar datos:', error);
        alert('Hubo un error al guardar los datos. Por favor, verifica la consola.');
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
    updateStats();
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
        const statusLines = [];
        let hasSurplus = false;

        Object.keys(totalRequiredHours).forEach(subject => {
            const assigned = assignedHours[subject] || 0;
            const required = totalRequiredHours[subject];
            const remaining = required - assigned;
            
            if (remaining > 0) {
                statusLines.push(`<span>${subject}: Faltan ${remaining}h</span>`);
            } else if (remaining < 0) {
                statusLines.push(`<span class="surplus-subject">${subject}: Sobran ${Math.abs(remaining)}h</span>`);
                hasSurplus = true;
            }
        });

        if (statusLines.length > 0) {
            remainingHoursHtml = `<div class="remaining-hours ${hasSurplus ? 'has-surplus' : ''}">${statusLines.join('<br>')}</div>`;
        } else {
            remainingHoursHtml = `<div class="remaining-hours">Todas las horas asignadas</div>`;
        }

        title.innerHTML += remainingHoursHtml;
        
        const table = document.createElement('table');
        table.className = 'schedule-table';
        
        // Header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = '<th>Hora</th>';
        days.forEach(day => {
            headerRow.innerHTML += `<th>${day}</th>`;
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Body
        const tbody = document.createElement('tbody');
        timeIntervals.forEach((time, index) => {
            const row = document.createElement('tr');
            
            if (index % 4 === 0) {
                const timeCell = document.createElement('td');
                timeCell.className = 'time-slot';
                timeCell.rowSpan = 4;
                timeCell.textContent = time;
                row.appendChild(timeCell);
            }

            if (time >= "12:00" && time < "12:30") {
                if (time === "12:00") {
                    const cell = document.createElement('td');
                    cell.className = 'recreo';
                    cell.textContent = 'RECREO';
                    cell.colSpan = days.length;
                    cell.rowSpan = 2; // 2 * 15min = 30min
                    row.appendChild(cell);
                }
            } else {
                days.forEach(day => {
                    // Mover la comprobación aquí, donde 'day' está definido.
                    if (!schedules[groupName]?.[day]) return;

                    const schedule = schedules[groupName]?.[day]?.[time] || [];
                    
                    // Verificación mejorada: Si hay algún elemento de continuación, no renderizar la celda
                    let isContinuation = false;
                    if (schedule && schedule.length > 0) {
                        isContinuation = schedule.every(item => item.isContinuation);
                    }
                    
                    if (isContinuation) {
                        return; // No renderizar celdas de continuación
                    }

                    const cell = document.createElement('td');
                    cell.className = 'class-slot' + (schedule.length > 1 ? ' double-slot' : '');
                    cell.dataset.group = groupName;
                    cell.dataset.day = day;
                    cell.dataset.time = time;
                    cell.addEventListener('click', () => openSubjectSelector(cell));

                    // Lógica para celdas con múltiples asignaturas
                    if (schedule && schedule.length > 0) {
                        cell.classList.add('occupied');
                        // Asumimos que todas las clases en un slot tienen la misma duración
                        const firstItem = schedule.find(s => s.isStart) || schedule[0];
                        const numSlots = (firstItem.duration * 60) / 15;
                        if (numSlots > 1) cell.rowSpan = numSlots;
                        cell.innerHTML = schedule.map(s => {
                            if (s.isStart) { // Solo mostrar las clases que comienzan en este slot
                                const colorClass = getSubjectClass(s.subject);
                                return `<div class="class-info-wrapper ${colorClass}">
                                            <div class="class-info">${s.subject}</div>
                                            <div class="teacher-info">${s.teacher}</div>
                                        </div>`;
                            }
                            return '';
                        }).join('');
                    } else {
                        cell.innerHTML = '+';
                    }
                    row.appendChild(cell);
                });
            }
            
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        groupDiv.appendChild(title);
        groupDiv.appendChild(table);
        container.appendChild(groupDiv);
    });
    
    setTimeout(checkAllConflicts, 100);
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

    const numSlots = (duration * 60) / 15;
    const timeSlotsToOccupy = [];
    let currentTime = new Date(`1970-01-01T${time}:00`);
    for (let i = 0; i < numSlots; i++) {
        timeSlotsToOccupy.push(currentTime.toTimeString().substring(0, 5));
        currentTime.setMinutes(currentTime.getMinutes() + 15);
    }

    // --- NUEVA VALIDACIÓN ---
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
        // --- VALIDACIÓN MEJORADA ---
        // Permitir hasta 2 clases por slot.
        const itemsInSlot = schedules[group]?.[day]?.[slot] || [];
        // La condición `slot !== time` es para evitar que la validación falle al editar una clase existente.
        if (itemsInSlot.length >= 2 && slot !== time) {
            alert(`El slot ${slot} ya tiene dos clases. No se pueden añadir más.`);
            return;
        }
    }
    // --- FIN DE LA VALIDACIÓN ---

    // --- LÓGICA DE ASIGNACIÓN MODIFICADA ---
    // Eliminar solo la asignatura que se está editando (si existe) en lugar de todo el slot.
    // Esto es importante para permitir dos clases en el mismo slot.
    const existingItems = schedules[group][day][time];
    if (existingItems.length > 0) {
        // Si estamos editando, quitamos la clase anterior del mismo profesor.
        const itemIndex = existingItems.findIndex(item => item.teacher === teacher);
        if (itemIndex !== -1) {
            // Creamos una "célula de edición falsa" para eliminar solo esa asignatura.
            const tempEditingCell = { ...currentEditingCell, subjectToRemove: existingItems[itemIndex].subject };
            removeSubject(false, tempEditingCell);
        } else if (existingItems.length >= 2) {
            alert('Este hueco ya tiene dos asignaturas. No se pueden añadir más.');
            return;
        }
    }

    const newScheduleItem = {
        id: generateUniqueId(),  // Añadir ID único
        subject: subject,
        teacher: teacher,
        duration: duration,
        isStart: true,
        createdAt: new Date().toISOString()  // Añadir timestamp
    };

    // Asegurarnos de que schedules[group][day][time] sea un array
    if (!Array.isArray(schedules[group][day][time])) {
        schedules[group][day][time] = [];
    }

    // Añadimos la nueva asignatura al array.
    // Aquí está la clave: si ya hay una, se añade la segunda.
    schedules[group][day][time].push(newScheduleItem);

    // Guardar el ID para usarlo en las celdas de continuación
    const parentId = newScheduleItem.id;

    for (let i = 1; i < timeSlotsToOccupy.length; i++) {
        // Asegurarnos de que cada celda de continuación sea un array
        if (!Array.isArray(schedules[group][day][timeSlotsToOccupy[i]])) {
            schedules[group][day][timeSlotsToOccupy[i]] = [];
        }
        
        // Las celdas de continuación también son arrays
        schedules[group][day][timeSlotsToOccupy[i]].push({
            id: generateUniqueId(),  // ID único para la continuación
            parentId: parentId,      // Referencia al ID padre
            isContinuation: true,
            startTime: time
        });
    }
    
    closeModal();
    renderSchedules();
    updateStats();
    saveSchedulesToStorage();
}

function removeSubject(shouldRender = true, cellInfo = currentEditingCell) {
    if (!cellInfo) {
        console.warn('No hay celda seleccionada para eliminar');
        return;
    }
    
    const { group, day, time } = cellInfo;
    if (!schedules[group] || !schedules[group][day] || !schedules[group][day][time]) {
        console.warn(`No hay horario para ${group} ${day} ${time}`);
        return;
    }
    
    const scheduleItems = schedules[group][day][time];
    if (!scheduleItems || scheduleItems.length === 0) {
        console.warn(`No hay elementos en el horario para ${group} ${day} ${time}`);
        return;
    }

    // Determinar qué elemento eliminar
    let itemToRemove = null;
    let itemId = null;
    let parentId = null;
    let startTime = time;

    // 1. Si es una continuación, encontrar el elemento de inicio
    const isContinuation = scheduleItems.some(item => item.isContinuation);
    
    if (isContinuation) {
        // Si es una continuación, necesitamos el parentId para encontrar el elemento principal
        const continuationItem = schedules[group][day][time].find(item => item.isContinuation);
        
        if (continuationItem) {
            // Si tiene parentId, usar eso para identificar todas las partes de la asignatura
            if (continuationItem.parentId) {
                parentId = continuationItem.parentId;
                console.log(`Encontrada celda de continuación con parentId: ${parentId}`);
            } 
            // Si no tiene parentId (datos antiguos), usar el startTime
            else if (continuationItem.startTime) {
                startTime = continuationItem.startTime;
                
                // Buscar en el slot de inicio
                if (schedules[group]?.[day]?.[startTime]) {
                    const startSlotItems = schedules[group][day][startTime];
                    
                    // Si solo hay un elemento en el slot de inicio, usarlo
                    if (startSlotItems.length === 1) {
                        itemToRemove = startSlotItems[0];
                        console.log(`Usando único elemento del slot de inicio: ${startSlotItems[0].subject}`);
                    } 
                    // Si hay varios elementos, usar el selector para elegir
                    else {
                        const subjectNameToRemove = cellInfo.subjectToRemove || document.getElementById('subjectSelect').value;
                        console.log('Intentando eliminar asignatura:', subjectNameToRemove);
                        console.log('Asignaturas disponibles:', startSlotItems.map(item => item.subject));
                        
                        itemToRemove = startSlotItems.find(item => item.subject === subjectNameToRemove);
                        console.log(`Buscando ${subjectNameToRemove} en slot ${startTime}`);
                    }
                }
            }
        }
    } 
    // 2. Si no es continuación, intentar encontrar por subject o directamente
    else {
        const subjectNameToRemove = cellInfo.subjectToRemove || document.getElementById('subjectSelect').value;
        
        if (subjectNameToRemove && subjectNameToRemove !== '') {
            console.log('Intentando eliminar asignatura:', subjectNameToRemove);
            console.log('Asignaturas disponibles:', scheduleItems.map(item => item.subject));
            
            itemToRemove = scheduleItems.find(item => item.subject === subjectNameToRemove);
            console.log(`Buscando asignatura ${subjectNameToRemove} en slot actual`);
        } 
        // Si no hay un valor específico, tomar el primero
        else if (scheduleItems.length > 0) {
            itemToRemove = scheduleItems.find(item => item.isStart) || scheduleItems[0];
            console.log(`Tomando primer elemento del slot: ${itemToRemove.subject}`);
        }
    }

    // 3. Recopilar todos los IDs a eliminar
    const idsToRemove = new Set();
    
    // Si encontramos un elemento directamente
    if (itemToRemove) {
        if (itemToRemove.id) {
            idsToRemove.add(itemToRemove.id);
            console.log(`Añadiendo ID a eliminar: ${itemToRemove.id} (${itemToRemove.subject})`);
        }
        
        // También buscar elementos de continuación por startTime (compatibilidad)
        
        // Recorrer todos los días y horas para encontrar continuaciones
        Object.keys(schedules[group][day]).forEach(slotTime => {
            const slotItems = schedules[group][day][slotTime];
            
            slotItems.forEach(item => {
                // Eliminar por parentId (nuevo método)
                if (itemToRemove.id && item.parentId === itemToRemove.id) {
                    idsToRemove.add(item.id);
                    console.log(`Añadiendo continuación por parentId: ${item.id}`);
                }
                // Eliminar por startTime (compatibilidad con datos antiguos)
                else if (item.startTime === startTime && item.isContinuation) {
                    if (item.id) idsToRemove.add(item.id);
                    console.log(`Añadiendo continuación por startTime: ${item.id || 'sin ID'}`);
                }
            });
        });
        
        // Si tenemos itemToRemove pero no tiene ID, usamos el método antiguo
        if (!itemToRemove.id) {
            console.log('Eliminando:', itemToRemove.subject, 'en', startTime);
            
            // Determinar cuántos slots ocupa esta asignatura
            const numSlots = (itemToRemove.duration * 60) / 15;
            console.log(`La asignatura ocupa ${numSlots} slots`);
            
            // Eliminar la asignatura de todos los slots que ocupa
            for (let i = 0; i < numSlots; i++) {
                let d = new Date(`1970-01-01T${startTime}:00`);
                d.setMinutes(d.getMinutes() + i * 15);
                const slotToClear = d.toTimeString().substring(0, 5);
                
                if (schedules[group]?.[day]?.[slotToClear]) {
                    console.log(`Limpiando slot ${slotToClear}`);
                    
                    // Crear una nueva copia del array sin los elementos que queremos eliminar
                    const oldItems = [...schedules[group][day][slotToClear]];
                    const newItems = oldItems.filter(item => {
                        // Mantener elementos que NO coincidan con la clase que estamos eliminando
                        const isPartOfRemovedClass = 
                            (item.startTime === startTime && 
                             (item.subject === itemToRemove.subject || 
                              (item.isContinuation && !item.subject)));
                        
                        const shouldKeep = !isPartOfRemovedClass;
                        if (!shouldKeep) {
                            console.log(`  - Eliminando elemento en ${slotToClear}:`, item);
                        }
                        return shouldKeep;
                    });
                    
                    console.log(`Slot ${slotToClear}: ${oldItems.length} elementos antes, ${newItems.length} después`);
                    
                    // Asignar el nuevo array de elementos - IMPORTANTE: crear un nuevo array para forzar la actualización
                    schedules[group][day][slotToClear] = [...newItems];
                }
            }
            
            // Guardamos y retornamos para no seguir con el resto del algoritmo
            saveSchedulesToStorage();
            console.log('Cambios guardados en localStorage (método antiguo)');
            
            if (shouldRender) {
                closeModal();
                renderSchedules();
                updateStats();
            }
            return;
        }
    }
    // Si encontramos un parentId (de una continuación)
    else if (parentId) {
        // Buscar en todos los slots del día para encontrar elementos con este parentId
        Object.keys(schedules[group][day]).forEach(slotTime => {
            const slotItems = schedules[group][day][slotTime];
            
            slotItems.forEach(item => {
                if (item.id === parentId || item.parentId === parentId) {
                    idsToRemove.add(item.id);
                    console.log(`Añadiendo elemento por parentId: ${item.id}`);
                }
            });
        });
    }
    // Si no encontramos ni elemento ni parentId, fallback a método antiguo
    else {
        console.warn('No se pudo determinar qué elementos eliminar');
        return;
    }

    if (idsToRemove.size === 0) {
        console.warn('No se encontraron IDs para eliminar');
        return;
    }
    
    console.log(`Eliminando ${idsToRemove.size} elementos con IDs:`, Array.from(idsToRemove));
    
    // 4. Eliminar todos los elementos con los IDs recopilados
    let elementosEliminados = 0;
    
    Object.keys(schedules[group][day]).forEach(slotTime => {
        if (!schedules[group][day][slotTime]) return;
        
        const beforeCount = schedules[group][day][slotTime].length;
        
        // Filtrar eliminando los elementos con IDs en el conjunto
        schedules[group][day][slotTime] = schedules[group][day][slotTime].filter(item => {
            // Para datos antiguos que no tienen ID
            if (!item.id) {
                // Si es continuación, verificar por startTime
                if (item.isContinuation && itemToRemove && item.startTime === startTime) {
                    elementosEliminados++;
                    return false; // Eliminar
                }
                // Si es elemento principal, verificar por subject
                else if (itemToRemove && item.subject === itemToRemove.subject) {
                    elementosEliminados++;
                    return false; // Eliminar
                }
                return true; // Mantener
            }
            
            // Para datos con ID
            const shouldRemove = idsToRemove.has(item.id);
            if (shouldRemove) elementosEliminados++;
            return !shouldRemove; // Mantener si no está en la lista de eliminación
        });
        
        const afterCount = schedules[group][day][slotTime].length;
        if (beforeCount !== afterCount) {
            console.log(`Slot ${slotTime}: ${beforeCount} elementos antes, ${afterCount} después`);
        }
    });
    
    console.log(`Se eliminaron ${elementosEliminados} elementos en total`);
    
    // 5. Guardar cambios y actualizar interfaz
    saveSchedulesToStorage();
    console.log('Cambios guardados en localStorage (método de IDs)');
    
    if (shouldRender) {
        closeModal();
        renderSchedules();
        updateStats();
    }
}

// Función de diagnóstico para verificar si los cambios se están guardando correctamente
function diagnosticarGuardado() {
    console.log('--- DIAGNÓSTICO DE GUARDADO ---');
    
    // 1. Verificar si hay datos en schedules
    console.log('Datos en memoria:', JSON.stringify(schedules).length, 'bytes');
    
    // 2. Verificar localStorage
    const storedData = localStorage.getItem('horariosSchedules');
    console.log('Datos en localStorage:', storedData ? storedData.length : 0, 'bytes');
    
    // 3. Comparar datos
    if (storedData) {
        const parsedStored = JSON.parse(storedData);
        let diferencias = false;
        
        Object.keys(schedules).forEach(group => {
            if (!parsedStored[group]) {
                console.log(`Grupo ${group} no existe en localStorage`);
                diferencias = true;
                return;
            }
            
            Object.keys(schedules[group]).forEach(day => {
                if (!parsedStored[group][day]) {
                    console.log(`Día ${day} no existe en localStorage para el grupo ${group}`);
                    diferencias = true;
                    return;
                }
                
                Object.keys(schedules[group][day]).forEach(time => {
                    if (!parsedStored[group][day][time]) {
                        console.log(`Hora ${time} no existe en localStorage para ${group}/${day}`);
                        diferencias = true;
                        return;
                    }
                    
                    const memItems = schedules[group][day][time];
                    const storedItems = parsedStored[group][day][time];
                    
                    if (memItems.length !== storedItems.length) {
                        console.log(`Diferencia en número de elementos en ${group}/${day}/${time}: memoria=${memItems.length}, localStorage=${storedItems.length}`);
                        diferencias = true;
                    }
                });
            });
        });
        
        if (!diferencias) {
            console.log('No se encontraron diferencias entre memoria y localStorage');
        }
    }
    
    console.log('--- FIN DEL DIAGNÓSTICO ---');
}

// Agregar la función al objeto window para poder llamarla desde la consola del navegador
window.diagnosticarGuardado = diagnosticarGuardado;

// Sobrescribir saveSchedulesToStorage para llamar a diagnosticarGuardado automáticamente
const originalSaveSchedulesToStorage = saveSchedulesToStorage;
saveSchedulesToStorage = function() {
    console.log('Guardando horarios en localStorage...');
    originalSaveSchedulesToStorage();
    diagnosticarGuardado();
};

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
    updateStats();
}

function displayConflicts(conflicts) {
    const panel = document.getElementById('conflictsPanel');
    const list = document.getElementById('conflictsList');
    const conflictCountEl = document.getElementById('conflictCount');

    const uniqueConflicts = Array.from(new Set(conflicts.map(c => JSON.stringify(c)))).map(s => JSON.parse(s));

    if (conflictCountEl) {
        conflictCountEl.textContent = uniqueConflicts.length;
    }

    // Si el panel de conflictos no existe en la página actual, no continuar.
    if (!panel || !list) {
        return;
    }

    if (uniqueConflicts.length === 0) {
        panel.classList.remove('show');
        return;
    }

    panel.classList.add('show');
    list.innerHTML = '';

    uniqueConflicts.forEach(conflict => {
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
    document.querySelectorAll('.class-slot.conflict, .teacher-schedule-compact td.conflict').forEach(cell => {
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
                const cellSelector = `.class-slot[data-group="${groupInfo.group}"][data-day="${day}"][data-time="${startTime}"]`;
                cell = document.querySelector(cellSelector);
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

function updateStats() {
    const totalClassesEl = document.getElementById('totalClasses');
    const completionRateEl = document.getElementById('completionRate');
    const conflictCountEl = document.getElementById('conflictCount');

    // Si no existen los elementos de estadísticas, no hacer nada.
    if (!totalClassesEl || !completionRateEl || !conflictCountEl) {
        return;
    }

    let totalAssigned = 0;
    let totalRequired = 0;

    Object.keys(groups).forEach(group => {
        if (groups[group] && groups[group].subjects) {
            Object.keys(groups[group].subjects).forEach(subject => {
                totalRequired += groups[group].subjects[subject].hours;
            });
        }

        if (schedules[group]) {
            Object.keys(schedules[group]).forEach(day => {
                Object.keys(schedules[group][day]).forEach(time => {
                    const scheduleItems = schedules[group][day][time];
                    if (scheduleItems && scheduleItems.length > 0) {
                        scheduleItems.forEach(schedule => {
                            if (schedule.isStart) totalAssigned += schedule.duration || 1;
                        });
                    }
                });
            });
        }
    });

    totalClassesEl.textContent = Math.round(totalAssigned * 100) / 100;

    const completionRate = totalRequired > 0 ? Math.round((totalAssigned / totalRequired) * 100) : 0;
    completionRateEl.textContent = completionRate + '%';
}

function calculateAssignedHours(groupName) {
    const assigned = {};
    if (!schedules[groupName]) return assigned; // No schedule for this group yet

    days.forEach(day => {
        timeIntervals.forEach(time => {
            // Añadir una comprobación para asegurarse de que scheduleItems es un array.
            const scheduleItems = schedules[groupName]?.[day]?.[time];
            if (scheduleItems && scheduleItems.length > 0) {
                scheduleItems.forEach(item => {
                    if (item.isStart) {
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
    document.getElementById('groupFilter').addEventListener('change', renderSchedules);
    // document.getElementById('checkConflictsBtn').addEventListener('click', checkAllConflicts);
    
    document.getElementById('exportBtn').addEventListener('click', exportData);
    document.getElementById('importBtn').addEventListener('click', importData);

    document.getElementById('assignSubjectBtn').addEventListener('click', assignSubject);
    document.getElementById('removeSubjectBtn').addEventListener('click', () => removeSubject(true));
    document.getElementById('cancelBtn').addEventListener('click', closeModal);

    document.getElementById('importFile').addEventListener('change', function(e) {
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

    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
}
