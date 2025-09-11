// Variable para gestionar la celda que se está editando en la vista completa
let currentFullScheduleEditingCell = null;

/**
 * Inicializa la página de horario completo.
 */
function initFullSchedulePage() {
    initializeAppData();
    addFullScheduleStyles();
    renderFullScheduleView();
    addFullScheduleEventListeners();
}

/**
 * Añade estilos CSS para la vista de horario completo basada en divs
 */
function addFullScheduleStyles() {
    const existingStyle = document.getElementById('fullScheduleStyles');
    if (existingStyle) return;

    const style = document.createElement('style');
    style.id = 'fullScheduleStyles';
    style.textContent = `
        /* Estilos para la vista de horario completo */
        .full-schedule-container {
            background: var(--md-surface);
            border-radius: var(--border-radius-m);
            overflow: hidden;
            box-shadow: var(--shadow-1);
            margin-top: var(--spacing-l);
        }
        
        .full-schedule-grid {
            display: grid;
            grid-template-columns: 80px repeat(var(--teacher-count), 1fr);
            min-width: 100%;
            overflow-x: auto;
        }
        
        .time-header {
            background: var(--md-surface-variant);
            color: var(--md-on-surface-variant);
            padding: 8px;
            text-align: center;
            font-weight: 600;
            border-right: 1px solid var(--md-outline);
            border-bottom: 2px solid var(--md-outline);
            position: sticky;
            left: 0;
            z-index: 2;
        }
        
        .teacher-header {
            background: var(--md-secondary-container);
            color: var(--md-on-secondary-container);
            padding: 8px;
            text-align: center;
            font-weight: 600;
            font-size: 14px;
            border-right: 1px solid var(--md-outline);
            border-bottom: 2px solid var(--md-outline);
            min-width: 110px;
            max-width: 130px;
            word-wrap: break-word;
        }
        
        .time-label {
            background: var(--md-surface-variant);
            color: var(--md-on-surface-variant);
            padding: 4px;
            text-align: center;
            font-size: 13px;
            font-weight: 500;
            border-right: 1px solid var(--md-outline);
            border-bottom: 1px solid #f1f3f4;
            position: sticky;
            left: 0;
            z-index: 1;
        }
        
        .day-separator {
            background: var(--md-tertiary-container);
            color: var(--md-on-tertiary-container);
            padding: 8px;
            text-align: center;
            font-weight: 700;
            font-size: 14px;
            border-right: 1px solid var(--md-outline);
            border-bottom: 1px solid var(--md-outline);
            grid-column: 1 / -1;
            letter-spacing: 2px;
        }
        
        .recreo-row {
            background: var(--recreo-bg);
            color: var(--recreo-text);
            padding: 6px 8px;
            text-align: center;
            font-weight: 700;
            font-size: 13px;
            border-right: 1px solid var(--md-outline);
            border-bottom: 1px solid var(--md-outline);
            grid-column: 1 / -1;
        }
        
        .schedule-cell {
            border-right: 1px solid var(--md-outline);
            border-bottom: 1px solid #f1f3f4;
            min-height: 26px;
            position: relative;
            cursor: pointer;
            transition: background-color 0.2s ease;
        }
        
        .schedule-cell:hover {
            background-color: rgba(66, 133, 244, 0.1);
        }
        
        .schedule-cell.occupied {
            background: transparent;
            cursor: pointer;
        }
        
        .schedule-cell.occupied:hover {
            background-color: rgba(0, 0, 0, 0.05);
        }
        
        .continuation-cell {
            background: transparent !important;
            cursor: default !important;
        }
        
        .continuation-cell:hover {
            background: transparent !important;
        }
        
        .schedule-event {
            position: absolute;
            top: 1px;
            left: 2px;
            right: 2px;
            bottom: 1px;
            background: var(--md-primary-container);
            color: var(--md-on-primary-container);
            border-radius: 4px;
            padding: 3px 4px;
            font-size: 12px;
            line-height: 1.2;
            display: flex;
            flex-direction: column;
            justify-content: center;
            text-align: center;
            cursor: pointer;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
            overflow: hidden;
            z-index: 1;
        }
        
        .schedule-event:hover {
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .event-subject {
            font-weight: 600;
            margin-bottom: 2px;
            font-size: 12px;
        }
        
        .event-group {
            font-size: 10px;
            opacity: 0.8;
        }
        
        .conflict-cell {
            background: var(--conflict-bg) !important;
        }
        
        .conflict-event {
            background: var(--conflict-bg) !important;
            color: var(--conflict-text) !important;
            border: 1px solid var(--conflict-border);
        }
        
        .conflict-indicator {
            font-weight: 700;
            font-size: 11px;
        }
        
        .conflict-count {
            font-size: 10px;
            margin: 1px 0;
        }
        
        .conflict-action {
            font-size: 9px;
            opacity: 0.8;
        }
        
        /* Selector de items para conflictos */
        .item-selector {
            position: absolute;
            background: white;
            border: 2px solid #333;
            border-radius: 5px;
            z-index: 1000;
            min-width: 200px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            font-size: 12px;
        }
        
        .selector-item {
            padding: 8px 12px;
            cursor: pointer;
            border-bottom: 1px solid #eee;
            transition: background-color 0.2s ease;
        }
        
        .selector-item:hover {
            background-color: #f0f0f0;
        }
        
        .selector-item[data-action="cancel"] {
            background: #f9f9f9;
            border-top: 1px solid #ccc;
            color: #666;
            text-align: center;
        }
        
        /* Responsivo - scroll horizontal en pantallas pequeñas */
        @media (max-width: 1200px) {
            .full-schedule-container {
                overflow-x: auto;
            }
        }
        
        /* Colores específicos para diferentes duraciones */
        .duration-050 { min-height: 12px; }
        .duration-075 { min-height: 18px; }
        .duration-100 { min-height: 24px; }
        .duration-125 { min-height: 30px; }
        .duration-150 { min-height: 36px; }
    `;
    document.head.appendChild(style);
}

/**
 * Añade los listeners de eventos para la vista de horario completo.
 */
function addFullScheduleEventListeners() {
    document.getElementById('assignSubjectBtn').addEventListener('click', assignSubjectForFullSchedule);
    document.getElementById('removeSubjectBtn').addEventListener('click', () => removeSubjectForFullSchedule(true));
    document.getElementById('cancelBtn').addEventListener('click', closeFullScheduleModal);
    document.getElementById('groupSelect').addEventListener('change', populateSubjectSelectForFullSchedule);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeFullScheduleModal();
        }
    });
}

/**
 * Renderiza la vista de horario completo usando divs en forma de matriz.
 */
function renderFullScheduleView() {
    const container = document.getElementById('fullScheduleContainer');
    container.innerHTML = '';

    // Ordenar la lista de profesores por el campo ID
    teachers.sort((a, b) => {
        const idA = a.id || 'ZZZ_' + a.name; // Si no tiene ID, usar nombre como fallback al final
        const idB = b.id || 'ZZZ_' + b.name;
        return idA.localeCompare(idB);
    });
    const sortedTeachers = teachers.map(teacher => teacher.name);

    if (sortedTeachers.length === 0) {
        container.innerHTML = '<div style="padding: 2rem; text-align: center; color: #666;">No hay profesores configurados.</div>';
        return;
    }

    const teacherSchedules = buildTeacherSchedules(schedules);

    // Crear el grid principal
    const scheduleGrid = document.createElement('div');
    scheduleGrid.className = 'full-schedule-grid';
    scheduleGrid.style.setProperty('--teacher-count', sortedTeachers.length);

    // Header: celda vacía + profesores
    const timeHeader = document.createElement('div');
    timeHeader.className = 'time-header';
    timeHeader.textContent = 'Hora';
    scheduleGrid.appendChild(timeHeader);

    sortedTeachers.forEach(teacherName => {
        const teacherHeader = document.createElement('div');
        teacherHeader.className = 'teacher-header';
        
        // Calcular carga lectiva
        const teachingLoad = calculateTeachingLoadForTeacher(teacherName);
        teacherHeader.innerHTML = `
            <div style="font-weight: 700; font-size: 14px;">${teacherName}</div>
            <div style="font-size: 12px; opacity: 0.8; margin-top: 2px;">${teachingLoad}h/sem</div>
        `;
        scheduleGrid.appendChild(teacherHeader);
    });

    // Filas de horarios por día
    days.forEach(day => {
        // Separador de día
        const daySeparator = document.createElement('div');
        daySeparator.className = 'day-separator';
        daySeparator.textContent = day.toUpperCase();
        scheduleGrid.appendChild(daySeparator);

        timeIntervals.forEach(time => {
            // Recreo
            if (time >= "12:00" && time < "12:30") {
                if (time === "12:00") {
                    const recreoRow = document.createElement('div');
                    recreoRow.className = 'recreo-row';
                    recreoRow.textContent = 'RECREO';
                    scheduleGrid.appendChild(recreoRow);
                }
                return;
            }

            // Etiqueta de tiempo
            const timeLabel = document.createElement('div');
            timeLabel.className = 'time-label';
            timeLabel.textContent = time;
            scheduleGrid.appendChild(timeLabel);

            // Celdas de profesores para esta hora
            sortedTeachers.forEach((teacherName, teacherIndex) => {
                const cell = document.createElement('div');
                cell.className = 'schedule-cell';
                cell.dataset.teacher = teacherName;
                cell.dataset.day = day;
                cell.dataset.time = time;

                const schedule = teacherSchedules[teacherName]?.[day]?.[time];

                if (schedule && schedule.length > 0) {
                    // Filtrar solo elementos que son inicio (no continuaciones)
                    const startItems = schedule.filter(item => item.isStart);
                    
                    if (startItems.length > 0) {
                        if (startItems.length === 1) {
                            // Una sola clase
                            const item = startItems[0];
                            const eventDiv = document.createElement('div');
                            eventDiv.className = 'schedule-event';
                            
                            // Añadir clase de color para la asignatura
                            const colorClass = getSubjectClass(item.subject);
                            if (colorClass) {
                                eventDiv.classList.add(colorClass);
                            }
                            
                            // Calcular la altura según la duración
                            const duration = item.duration || 1;
                            const heightSlots = (duration * 60) / 15; // Cuántos slots de 15 min
                            const cellHeight = 26.25; // Altura para que 60min = 105px (105/4 = 26.25)
                            const totalHeight = (heightSlots * cellHeight);
                            
                            eventDiv.style.height = `${totalHeight}px`;
                            eventDiv.innerHTML = `
                                <div class="event-subject">${item.subject}</div>
                                <div class="event-group">${item.group}</div>
                            `;
                            
                            // Click listener
                            eventDiv.addEventListener('click', (e) => {
                                e.stopPropagation();
                                openFullScheduleModal(eventDiv, teacherName, day, time);
                            });
                            
                            cell.appendChild(eventDiv);
                            cell.classList.add('occupied');
                            
                        } else {
                            // Múltiples clases (conflicto)
                            const conflictDiv = document.createElement('div');
                            conflictDiv.className = 'schedule-event conflict-event';
                            
                            // Calcular altura basada en la duración máxima
                            const maxDuration = Math.max(...startItems.map(item => item.duration || 1));
                            const heightSlots = (maxDuration * 60) / 15;
                            const cellHeight = 26.25; // Altura para que 60min = 105px (105/4 = 26.25)
                            const totalHeight = (heightSlots * cellHeight);
                            
                            conflictDiv.style.height = `${totalHeight}px`;
                            conflictDiv.innerHTML = `
                                <div class="conflict-indicator">⚠️</div>
                                <div class="conflict-count">${startItems.length}</div>
                                <div class="conflict-action">Click</div>
                            `;
                            
                            // Click listener para mostrar selector
                            conflictDiv.addEventListener('click', (e) => {
                                e.stopPropagation();
                                showFullScheduleItemSelector(conflictDiv, teacherName, day, time, startItems);
                            });
                            
                            cell.appendChild(conflictDiv);
                            cell.classList.add('occupied', 'conflict-cell');
                        }
                    } else if (schedule.length > 0 && schedule.some(item => item.isContinuation)) {
                        // Esta celda es continuación de una clase anterior
                        // No mostrar nada, pero marcar como ocupada para evitar clicks
                        cell.classList.add('continuation-cell');
                        cell.style.background = 'transparent';
                        // No agregar event listeners para evitar edición
                    }
                } else {
                    // Celda vacía - click listener para crear nueva asignación
                    cell.addEventListener('click', () => openFullScheduleModal(cell, teacherName, day, time));
                }
                
                scheduleGrid.appendChild(cell);
            });
        });
    });

    container.appendChild(scheduleGrid);
    
    setTimeout(checkAllConflicts, 100);
}

/**
 * Calcula la carga lectiva de un profesor.
 */
function calculateTeachingLoadForTeacher(teacherName) {
    let totalHours = 0;

    Object.keys(schedules).forEach(groupName => {
        Object.keys(schedules[groupName]).forEach(day => {
            Object.keys(schedules[groupName][day]).forEach(time => {
                const slot = schedules[groupName][day][time];
                if (Array.isArray(slot)) {
                    slot.forEach(item => {
                        if (item.teacher === teacherName && item.isStart) {
                            totalHours += item.duration || 1;
                        }
                    });
                }
            });
        });
    });

    return totalHours;
}

/**
 * Abre el modal de edición para una celda específica del horario completo.
 */
function openFullScheduleModal(element, teacherName, day, time) {
    const scheduleData = getScheduleDataFromCellForTeacher(teacherName, day, time);
    currentFullScheduleEditingCell = { cell: element, teacherName, day, time, scheduleData };

    const modal = document.getElementById('subjectSelector');
    const modalTitle = document.getElementById('modalTitle');
    const groupSelect = document.getElementById('groupSelect');
    const subjectSelect = document.getElementById('subjectSelect');
    const durationSelect = document.getElementById('durationSelect');
    const removeBtn = document.getElementById('removeSubjectBtn');
    const conflictInfo = document.getElementById('conflictInfo');

    // Resetear selects
    groupSelect.innerHTML = '<option value="">-- Seleccionar Grupo --</option>';
    subjectSelect.innerHTML = '<option value="">-- Seleccionar Asignatura --</option>';

    // Título
    modalTitle.textContent = `${teacherName} - ${day} ${time}`;
    conflictInfo.style.display = 'none';

    // Llenar el selector de grupos
    Object.keys(groups).sort((a, b) => (groups[a].orden || 0) - (groups[b].orden || 0)).forEach(groupName => {
        const option = document.createElement('option');
        option.value = groupName;
        option.textContent = groupName;
        groupSelect.appendChild(option);
    });

    if (scheduleData && scheduleData.isStart) {
        // Editando una clase existente
        groupSelect.value = scheduleData.group;
        populateSubjectSelectForFullSchedule();
        subjectSelect.value = scheduleData.subject;
        durationSelect.value = scheduleData.duration;
        removeBtn.style.display = 'inline-block';
    } else {
        // Añadiendo una nueva clase
        groupSelect.value = '';
        subjectSelect.value = '';
        durationSelect.value = '1';
        removeBtn.style.display = 'none';
    }

    modal.style.display = 'block';
}

/**
 * Muestra un selector para elegir entre múltiples horarios en conflicto.
 */
function showFullScheduleItemSelector(element, teacherName, day, time, items) {
    // Remover selector existente si lo hay
    const existingSelector = document.querySelector('.item-selector');
    if (existingSelector) {
        existingSelector.remove();
    }

    // Crear selector simple
    const selector = document.createElement('div');
    selector.className = 'item-selector';

    let selectorHTML = '<div style="font-weight: bold; padding: 8px; background: #f5f5f5; border-bottom: 1px solid #ccc;">Opciones para conflicto:</div>';
    
    items.forEach((item, index) => {
        selectorHTML += `
            <div class="selector-item" 
                 data-index="${index}"
                 title="${item.subject} - ${item.group} (${item.duration}h)">
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%">
                    <span>
                        ${index + 1}. ${item.subject}
                        <div style="font-size: 10px; color: #666;">${item.group} • ${item.duration}h</div>
                    </span>
                    <span class="selector-actions">
                        <button class="micro-button edit" data-index="${index}">✏️</button>
                        <button class="micro-button delete" data-index="${index}">🗑️</button>
                    </span>
                </div>
            </div>
        `;
    });
    
    selectorHTML += `
        <div class="selector-item" 
             data-action="add"
             style="background-color: #e6f7e6; color: #2e7d32;">
            ➕ Añadir nueva clase
        </div>
        <div class="selector-item" 
             data-action="cancel"
             style="background-color: #f5f5f5;">
            ❌ Cancelar
        </div>
    `;

    selector.innerHTML = selectorHTML;

    // Añadir un estilo para los micro-botones
    const microButtonStyle = document.createElement('style');
    microButtonStyle.textContent = `
        .micro-button {
            padding: 2px 4px;
            border: none;
            border-radius: 3px;
            margin-left: 5px;
            cursor: pointer;
            font-size: 12px;
            background: none;
        }
        .micro-button:hover {
            background-color: rgba(0,0,0,0.1);
        }
        .micro-button.edit:hover {
            color: #1976d2;
        }
        .micro-button.delete:hover {
            color: #d32f2f;
        }
        .selector-actions {
            display: flex;
            align-items: center;
        }
        .selector-item {
            padding: 8px;
            cursor: pointer;
            border-bottom: 1px solid #eee;
            transition: background-color 0.2s;
        }
        .selector-item:hover {
            background-color: #f9f9f9;
        }
    `;
    document.head.appendChild(microButtonStyle);

    // Posicionar el selector
    const rect = element.getBoundingClientRect();
    selector.style.left = (rect.right + 10) + 'px';
    selector.style.top = rect.top + 'px';
    
    // Ajustar si se sale de la pantalla
    setTimeout(() => {
        const selectorRect = selector.getBoundingClientRect();
        if (selectorRect.right > window.innerWidth) {
            selector.style.left = (rect.left - selectorRect.width - 10) + 'px';
        }
        if (selectorRect.bottom > window.innerHeight) {
            selector.style.top = (window.innerHeight - selectorRect.height - 10) + 'px';
        }
    }, 1);

    document.body.appendChild(selector);

    // Event listeners para las opciones principales
    selector.querySelectorAll('.selector-item').forEach(option => {        
        option.addEventListener('click', (e) => {
            // Si el clic fue en un botón, no hacer nada (los botones tienen sus propios listeners)
            if (e.target.classList.contains('micro-button')) {
                return;
            }
            
            const action = option.dataset.action;
            const index = option.dataset.index;
            
            if (action === 'cancel') {
                selector.remove();
                return;
            }
            
            if (action === 'add') {
                selector.remove();
                currentFullScheduleEditingCell = {
                    cell: element,
                    teacherName: teacherName,
                    day: day,
                    time: time,
                    scheduleData: null // Crear nuevo
                };
                openFullScheduleModal(element, teacherName, day, time);
                return;
            }
            
            if (index !== undefined) {
                const selectedItem = items[parseInt(index)];
                
                // Guardar la referencia del elemento y el item seleccionado
                currentFullScheduleEditingCell = {
                    cell: element,
                    teacherName: teacherName,
                    day: day,
                    time: time,
                    scheduleData: selectedItem
                };
                
                selector.remove();
                // Abrir modal para el item seleccionado
                openFullScheduleModal(element, teacherName, day, time);
            }
        });
    });
    
    // Event listeners para los botones de edición
    selector.querySelectorAll('.micro-button.edit').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = button.dataset.index;
            const selectedItem = items[parseInt(index)];
            
            currentFullScheduleEditingCell = {
                cell: element,
                teacherName: teacherName,
                day: day,
                time: time,
                scheduleData: selectedItem
            };
            
            selector.remove();
            openFullScheduleModal(element, teacherName, day, time);
        });
    });
    
    // Event listeners para los botones de eliminación
    selector.querySelectorAll('.micro-button.delete').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = button.dataset.index;
            const selectedItem = items[parseInt(index)];
            
            if (confirm(`¿Estás seguro de eliminar ${selectedItem.subject} del grupo ${selectedItem.group}?`)) {
                currentFullScheduleEditingCell = {
                    cell: element,
                    teacherName: teacherName,
                    day: day,
                    time: time,
                    scheduleData: selectedItem
                };
                
                selector.remove();
                removeSubjectForFullSchedule(true);
            }
        });
    });

    // Cerrar al hacer click fuera
    setTimeout(() => {
        const clickOutsideHandler = (e) => {
            if (!selector.contains(e.target)) {
                selector.remove();
                document.removeEventListener('click', clickOutsideHandler);
            }
        };
        document.addEventListener('click', clickOutsideHandler);
    }, 100);
}

/**
 * Popula el selector de asignaturas basándose en el grupo seleccionado.
 */
function populateSubjectSelectForFullSchedule() {
    const groupName = document.getElementById('groupSelect').value;
    const subjectSelect = document.getElementById('subjectSelect');
    subjectSelect.innerHTML = '<option value="">-- Seleccionar Asignatura --</option>';

    if (groupName && groups[groupName] && groups[groupName].subjects) {
        Object.keys(groups[groupName].subjects).forEach(subjectName => {
            if (groups[groupName].subjects[subjectName].teacher === currentFullScheduleEditingCell.teacherName) {
                const option = document.createElement('option');
                option.value = subjectName;
                option.textContent = subjectName;
                subjectSelect.appendChild(option);
            }
        });
    }
}

/**
 * Asigna una asignatura en la vista de horario completo.
 */
function assignSubjectForFullSchedule() {
    if (!currentFullScheduleEditingCell) return;

    const group = document.getElementById('groupSelect').value;
    const subject = document.getElementById('subjectSelect').value;
    const duration = parseFloat(document.getElementById('durationSelect').value);
    const { day, time, teacherName } = currentFullScheduleEditingCell;

    if (!group || !subject) {
        alert('Por favor, selecciona un grupo y una asignatura.');
        return;
    }
    
    const teacherForSubject = groups[group].subjects[subject]?.teacher;
    if (teacherForSubject !== teacherName) {
        alert(`La asignatura '${subject}' no la imparte ${teacherName}, sino ${teacherForSubject || 'nadie'}.`);
        return;
    }

    const numSlots = (duration * 60) / 15;
    const timeSlotsToOccupy = Array.from({ length: numSlots }, (_, i) => {
        let d = new Date(`1970-01-01T${time}:00`);
        d.setMinutes(d.getMinutes() + i * 15);
        return d.toTimeString().substring(0, 5);
    });

    if (new Date(`1970-01-01T${timeSlotsToOccupy[timeSlotsToOccupy.length - 1]}:00`) >= new Date(`1970-01-01T14:00:00`)) {
        alert('La clase no puede terminar después de las 14:00.');
        return;
    }

    for (const slot of timeSlotsToOccupy) {
        if (slot >= "12:00" && slot < "12:30") {
            alert('La clase no puede solaparse con el recreo.');
            return;
        }
        
        const itemsInSlot = schedules[group]?.[day]?.[slot] || [];
        const isSameTeacherAssigned = itemsInSlot.some(item => item.isStart && item.teacher === teacherName);

        if (isSameTeacherAssigned && slot !== time) {
            alert(`El profesor '${teacherName}' ya tiene una clase asignada para el grupo '${group}' en este espacio de tiempo.`);
            return;
        }
    }

    if (currentFullScheduleEditingCell.scheduleData) {
        removeSubjectForFullSchedule(false);
    }

    if (!Array.isArray(schedules[group][day][time])) {
        schedules[group][day][time] = [];
    }
    
    const newScheduleItem = {
        id: generateUniqueId(),
        subject: subject,
        teacher: teacherName,
        duration: duration,
        isStart: true,
        createdAt: new Date().toISOString()
    };
    
    schedules[group][day][time].push(newScheduleItem);

    const parentId = newScheduleItem.id;
    for (let i = 1; i < timeSlotsToOccupy.length; i++) {
        const slot = timeSlotsToOccupy[i];
        if (!Array.isArray(schedules[group][day][slot])) {
            schedules[group][day][slot] = [];
        }
        schedules[group][day][slot].push({
            id: generateUniqueId(),
            parentId: parentId,
            isContinuation: true,
            startTime: time
        });
    }

    closeFullScheduleModal();
    saveSchedulesToStorage();
    renderFullScheduleView();
}

/**
 * Elimina una asignatura del horario completo.
 */
function removeSubjectForFullSchedule(shouldRender = true) {
    if (!currentFullScheduleEditingCell || !currentFullScheduleEditingCell.scheduleData) {
        console.error('❌ No hay celda o datos para eliminar');
        return;
    }

    const { group, day, time, subject, id } = currentFullScheduleEditingCell.scheduleData;
    
    console.log(`🗑️ ELIMINANDO: ${subject} de ${group} para ${currentFullScheduleEditingCell.teacherName} en ${day}/${time}`);
    
    if (!schedules[group] || !schedules[group][day]) {
        console.error(`❌ No se encuentran datos para ${group}/${day}`);
        return;
    }
    
    if (id) {
        const idsToRemove = new Set([id]);
        
        Object.keys(schedules[group][day]).forEach(slotTime => {
            const slotItems = schedules[group][day][slotTime];
            if (Array.isArray(slotItems)) {
                slotItems.forEach(item => {
                    if (item.parentId === id) {
                        idsToRemove.add(item.id);
                    }
                });
            }
        });
        
        let totalRemoved = 0;
        Object.keys(schedules[group][day]).forEach(slotTime => {
            if (!Array.isArray(schedules[group][day][slotTime])) {
                schedules[group][day][slotTime] = [];
                return;
            }
            
            const beforeLength = schedules[group][day][slotTime].length;
            schedules[group][day][slotTime] = schedules[group][day][slotTime].filter(item => {
                return !idsToRemove.has(item.id);
            });
            const afterLength = schedules[group][day][slotTime].length;
            totalRemoved += (beforeLength - afterLength);
        });
        
        console.log(`✅ Eliminados ${totalRemoved} elementos en total`);
    }

    if (shouldRender) {
        closeFullScheduleModal();
        saveSchedulesToStorage();
        renderFullScheduleView();
    }
}

/**
 * Cierra el modal de edición.
 */
function closeFullScheduleModal() {
    document.getElementById('subjectSelector').style.display = 'none';
    currentFullScheduleEditingCell = null;
}

/**
 * Obtiene los datos de una clase a partir del profesor, día y hora.
 */
function getScheduleDataFromCellForTeacher(teacherName, day, time) {
    for (const groupName of Object.keys(schedules)) {
        const scheduleItems = schedules[groupName]?.[day]?.[time];
        if (Array.isArray(scheduleItems) && scheduleItems.length > 0) {
            const itemForTeacher = scheduleItems.find(item => item.teacher === teacherName);
            if (itemForTeacher && itemForTeacher.isStart) {
                return { ...itemForTeacher, group: groupName, day, time };
            }

            const continuationItem = scheduleItems.find(item => item.isContinuation);
            if (continuationItem) {
                const startItems = schedules[groupName]?.[day]?.[continuationItem.startTime];
                const originalItem = startItems?.find(item => item.teacher === teacherName);
                if (originalItem) {
                    return { ...originalItem, group: groupName, day: day, time: continuationItem.startTime };
                }
            }
        }
    }
    return null;
}

// Iniciar la página al cargar el script
window.addEventListener('load', initFullSchedulePage);
