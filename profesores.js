// Variable para gestionar la celda que se está editando en la vista de profesor
let currentTeacherEditingCell = null;

/**
 * Inicializa la página de horarios por profesor.
 */
function initProfesoresPage() {
    initializeAppData();
    addMultipleScheduleStyles();
    renderCompactTeacherSchedule();
    addProfesoresEventListeners();
}

/**
 * Añade estilos CSS para la nueva vista de profesores basada en divs
 */
function addMultipleScheduleStyles() {
    const existingStyle = document.getElementById('multipleScheduleStyles');
    if (existingStyle) return;

    const style = document.createElement('style');
    style.id = 'multipleScheduleStyles';
    style.textContent = `
        /* Estilos para la vista de profesores */
        .teacher-schedule {
            margin-bottom: 2rem;
            border: 1px solid var(--md-outline);
            border-radius: var(--border-radius-m);
            background: var(--md-surface);
            overflow: hidden;
        }
        
        .teacher-title {
            background: var(--md-primary-container);
            color: var(--md-on-primary-container);
            padding: 1rem;
            border-bottom: 1px solid var(--md-outline);
        }
        
        .teacher-name {
            font-size: 1.2em;
            font-weight: 700;
            margin-bottom: 0.5rem;
        }
        
        .teaching-load {
            font-size: 0.9em;
            opacity: 0.8;
        }
        
        .calendar-container {
            display: flex;
            background: white;
        }
        
        .time-column {
            width: 60px;
            border-right: 1px solid var(--md-outline);
            background: var(--md-surface-variant);
        }
        
        .time-slot {
            height: 20px;
            border-bottom: 1px solid #f1f3f4;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            color: #70757a;
            font-weight: 500;
        }
        
        .recreo-time {
            background: var(--recreo-bg);
            color: var(--recreo-text);
            font-weight: 700;
        }
        
        .calendar-grid {
            flex: 1;
        }
        
        .days-header {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            border-bottom: 2px solid var(--md-outline);
        }
        
        .day-header {
            padding: 0.5rem;
            text-align: center;
            background: var(--md-secondary-container);
            color: var(--md-on-secondary-container);
            font-weight: 600;
            border-right: 1px solid var(--md-outline);
        }
        
        .day-header:last-child {
            border-right: none;
        }
        
        .day-name {
            font-size: 0.9em;
        }
        
        .week-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            min-height: 400px;
        }
        
        .day-column {
            border-right: 1px solid var(--md-outline);
            position: relative;
        }
        
        .day-column:last-child {
            border-right: none;
        }
        
        .day-column .time-slot {
            border-right: none;
            position: relative;
        }
        
        .empty-slot {
            cursor: pointer;
            transition: background-color 0.2s ease;
        }
        
        .empty-slot:hover {
            background-color: rgba(66, 133, 244, 0.1);
        }
        
        .occupied-slot {
            background: transparent;
        }
        
        .recreo-slot {
            background: var(--recreo-bg);
            color: var(--recreo-text);
            font-weight: 700;
            cursor: default;
        }
        
        .event-item {
            position: absolute;
            left: 2px;
            right: 2px;
            top: 1px;
            background: var(--md-primary-container);
            color: var(--md-on-primary-container);
            border-radius: 4px;
            padding: 4px 6px;
            font-size: 11px;
            line-height: 1.2;
            cursor: pointer;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
            overflow: hidden;
            z-index: 1;
        }
        
        .event-item:hover {
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }
        
        .event-subject {
            font-weight: 600;
            margin-bottom: 1px;
        }
        
        .event-group {
            font-size: 9px;
            opacity: 0.8;
        }
        
        .event-duration {
            font-size: 8px;
            opacity: 0.6;
            margin-top: 1px;
        }
        
        .conflict-event {
            background: var(--conflict-bg) !important;
            color: var(--conflict-text) !important;
            border: 1px solid var(--conflict-border);
            text-align: center;
        }
        
        .conflict-indicator {
            font-weight: 700;
            font-size: 10px;
        }
        
        .conflict-count {
            font-size: 9px;
            margin: 1px 0;
        }
        
        .conflict-action {
            font-size: 8px;
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
    `;
    document.head.appendChild(style);
}

/**
 * Añade los listeners de eventos para los elementos de la página de profesores.
 */
function addProfesoresEventListeners() {
    document.getElementById('assignSubjectBtn').addEventListener('click', assignSubjectForTeacher);
    document.getElementById('removeSubjectBtn').addEventListener('click', () => removeSubjectForTeacher(true));
    document.getElementById('cancelBtn').addEventListener('click', closeTeacherModal);
    document.getElementById('groupSelect').addEventListener('change', populateSubjectSelectForTeacher);
    
    // Event listener para resolver conflictos - Ya no es necesario con el nuevo enfoque
    const resolveConflictBtn = document.getElementById('resolveConflictBtn');
    if (resolveConflictBtn) {
        resolveConflictBtn.style.display = 'none'; // Ocultar el botón
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeTeacherModal();
        }
    });
}

/**
 * Abre el modal de edición para un elemento específico del horario del profesor.
 * @param {HTMLElement} cell - La celda HTML que se ha clicado.
 * @param {string} teacherName - El nombre del profesor.
 * @param {string} day - El día de la semana.
 * @param {string} time - La hora de inicio.
 * @param {string} group - El grupo específico.
 * @param {string} subject - La asignatura específica.
 * @param {string} duration - La duración específica.
 */
function openTeacherModalForSpecificItem(cell, teacherName, day, time, group, subject, duration) {
    // Obtener los datos específicos del elemento seleccionado
    const scheduleData = getSpecificScheduleDataFromCell(teacherName, day, time, group, subject);
    
    if (!scheduleData) {
        console.error(`No se encontraron datos para ${teacherName} - ${subject} en ${group}`);
        return;
    }
    
    currentTeacherEditingCell = { cell, teacherName, day, time, scheduleData };

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

    // Título específico para el elemento seleccionado
    modalTitle.textContent = `${teacherName} - ${day} ${time} - ${subject} (${group})`;
    conflictInfo.style.display = 'none';

    // Llenar el selector de grupos
    Object.keys(groups).sort((a, b) => (groups[a].orden || 0) - (groups[b].orden || 0)).forEach(groupName => {
        const option = document.createElement('option');
        option.value = groupName;
        option.textContent = groupName;
        groupSelect.appendChild(option);
    });

    // Precargar los datos del elemento específico
    groupSelect.value = scheduleData.group;
    populateSubjectSelectForTeacher();
    subjectSelect.value = scheduleData.subject;
    durationSelect.value = scheduleData.duration;
    removeBtn.style.display = 'inline-block';

    modal.style.display = 'block';
}

/**
 * Abre el modal de edición para una celda específica del horario del profesor.
 * @param {HTMLElement} cell - La celda HTML que se ha clicado.
 * @param {string} teacherName - El nombre del profesor.
 * @param {string} day - El día de la semana.
 * @param {string} time - La hora de inicio.
 */
function openTeacherModal(cell, teacherName, day, time) {
    const scheduleData = getScheduleDataFromCell(teacherName, day, time);
    currentTeacherEditingCell = { cell, teacherName, day, time, scheduleData };

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

    // Título simple sin conflictos
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
        populateSubjectSelectForTeacher();
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
 * Muestra un selector simple para elegir entre múltiples horarios en conflicto.
 */
function showItemSelector(element, teacherName, day, time, items) {
    // Remover selector existente si lo hay
    const existingSelector = document.querySelector('.item-selector');
    if (existingSelector) {
        existingSelector.remove();
    }

    // Crear selector simple
    const selector = document.createElement('div');
    selector.className = 'item-selector';

    let selectorHTML = '<div style="font-weight: bold; padding: 8px; background: #f5f5f5; border-bottom: 1px solid #ccc;">Seleccionar clase:</div>';
    
    items.forEach((item, index) => {
        selectorHTML += `
            <div class="selector-item" 
                 data-index="${index}"
                 title="${item.subject} - ${item.group} (${item.duration}h)">
                ${index + 1}. ${item.subject}
                <div style="font-size: 10px; color: #666;">${item.group} • ${item.duration}h</div>
            </div>
        `;
    });
    
    selectorHTML += `
        <div class="selector-item" 
             data-action="cancel">
            Cancelar
        </div>
    `;

    selector.innerHTML = selectorHTML;

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

    // Event listeners para las opciones
    selector.querySelectorAll('.selector-item').forEach(option => {        
        option.addEventListener('click', () => {
            selector.remove();
            
            const action = option.dataset.action;
            const index = option.dataset.index;
            
            if (action === 'cancel') {
                return;
            }
            
            if (index !== undefined) {
                const selectedItem = items[parseInt(index)];
                console.log('✅ Usuario seleccionó item:', selectedItem);
                
                // Guardar la referencia del elemento y el item seleccionado
                currentTeacherEditingCell = {
                    cell: element,
                    teacherName: teacherName,
                    day: day,
                    time: time,
                    scheduleData: selectedItem
                };
                
                // Abrir modal para el item seleccionado
                openTeacherModal(element, teacherName, day, time);
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
 * Solo muestra las asignaturas impartidas por el profesor actual.
 */
function populateSubjectSelectForTeacher() {
    const groupName = document.getElementById('groupSelect').value;
    const subjectSelect = document.getElementById('subjectSelect');
    subjectSelect.innerHTML = '<option value="">-- Seleccionar Asignatura --</option>';

    if (groupName && groups[groupName] && groups[groupName].subjects) {
        Object.keys(groups[groupName].subjects).forEach(subjectName => {
            if (groups[groupName].subjects[subjectName].teacher === currentTeacherEditingCell.teacherName) {
                const option = document.createElement('option');
                option.value = subjectName;
                option.textContent = subjectName;
                subjectSelect.appendChild(option);
            }
        });
    }
}

/**
 * Asigna una asignatura a un profesor en un hueco horario.
 */
function assignSubjectForTeacher() {
    if (!currentTeacherEditingCell) return;

    const group = document.getElementById('groupSelect').value;
    const subject = document.getElementById('subjectSelect').value;
    const duration = parseFloat(document.getElementById('durationSelect').value);
    const { day, time, teacherName } = currentTeacherEditingCell;

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
        // Modificamos la validación para permitir la superposición de profesores en un mismo grupo.
        // Ahora solo dará error si el MISMO profesor ya tiene una clase en ese slot (evitando duplicados).
        const itemsInSlot = schedules[group]?.[day]?.[slot] || [];
        const isSameTeacherAssigned = itemsInSlot.some(item => item.isStart && item.teacher === teacherName);

        // La condición `slot !== time` previene que la validación falle al editar una clase existente.
        if (isSameTeacherAssigned && slot !== time) {
            alert(`El profesor '${teacherName}' ya tiene una clase asignada para el grupo '${group}' en este espacio de tiempo.`);
            return;
        }
    }

    if (currentTeacherEditingCell.scheduleData) {
        removeSubjectForTeacher(false); // No renderizar
    }

    // Asegurarse de que el slot es un array y añadir la nueva clase.
    // Esto alinea la lógica con scripts.js y permite la coexistencia de clases.
    if (!Array.isArray(schedules[group][day][time])) {
        schedules[group][day][time] = [];
    }
    
    // Crear nuevo item con ID único (como en scripts.js)
    const newScheduleItem = {
        id: generateUniqueId(),
        subject: subject,
        teacher: teacherName,
        duration: duration,
        isStart: true,
        createdAt: new Date().toISOString()
    };
    
    schedules[group][day][time].push(newScheduleItem);

    // Crear celdas de continuación con parentId
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

    closeTeacherModal();
    saveSchedulesToStorage();
    renderCompactTeacherSchedule();
}

/**
 * Elimina una asignatura del horario.
 * @param {boolean} shouldRender - Indica si se debe re-renderizar el horario.
 */
function removeSubjectForTeacher(shouldRender = true) {
    if (!currentTeacherEditingCell || !currentTeacherEditingCell.scheduleData) {
        console.error('❌ No hay celda o datos para eliminar');
        return;
    }

    const { group, day, time, subject, id } = currentTeacherEditingCell.scheduleData;
    
    console.log(`🗑️ ELIMINANDO: ${subject} de ${group} para ${currentTeacherEditingCell.teacherName} en ${day}/${time}`);
    console.log(`📋 Datos completos:`, currentTeacherEditingCell.scheduleData);
    
    // Verificar que el grupo y día existen
    if (!schedules[group] || !schedules[group][day]) {
        console.error(`❌ No se encuentran datos para ${group}/${day}`);
        console.log('📊 Schedules disponibles:', Object.keys(schedules));
        return;
    }
    
    // Si tiene ID, usar eliminación por ID (más seguro)
    if (id) {
        const idsToRemove = new Set([id]);
        
        // Buscar continuaciones relacionadas en todo el día
        Object.keys(schedules[group][day]).forEach(slotTime => {
            const slotItems = schedules[group][day][slotTime];
            if (Array.isArray(slotItems)) {
                slotItems.forEach(item => {
                    if (item.parentId === id) {
                        console.log(`   📎 Continuación encontrada en ${slotTime}: ID ${item.id}`);
                        idsToRemove.add(item.id);
                    }
                });
            }
        });
        
        console.log(`🗑️ IDs a eliminar:`, Array.from(idsToRemove));
        
        // Eliminar por IDs
        let totalRemoved = 0;
        Object.keys(schedules[group][day]).forEach(slotTime => {
            if (!Array.isArray(schedules[group][day][slotTime])) {
                schedules[group][day][slotTime] = [];
                return;
            }
            
            const beforeLength = schedules[group][day][slotTime].length;
            schedules[group][day][slotTime] = schedules[group][day][slotTime].filter(item => {
                const shouldRemove = idsToRemove.has(item.id);
                if (shouldRemove) {
                    console.log(`   🗑️ Eliminando de ${slotTime}: ${item.subject || 'continuación'} (ID: ${item.id})`);
                }
                return !shouldRemove;
            });
            const afterLength = schedules[group][day][slotTime].length;
            totalRemoved += (beforeLength - afterLength);
        });
        
        console.log(`✅ Eliminados ${totalRemoved} elementos en total`);
        
        if (totalRemoved === 0) {
            console.error(`❌ No se eliminó ningún elemento. Verificando datos...`);
            console.log('🔍 Contenido de schedules[group][day]:', schedules[group][day]);
        }
        
    } else {
        console.error(`❌ Elemento sin ID, no se puede eliminar de forma segura`);
        // Como fallback, intentar eliminación por subject/group/time
        if (schedules[group][day][time] && Array.isArray(schedules[group][day][time])) {
            const originalLength = schedules[group][day][time].length;
            schedules[group][day][time] = schedules[group][day][time].filter(item => 
                !(item.subject === subject && item.group === group)
            );
            const removedCount = originalLength - schedules[group][day][time].length;
            console.log(`⚠️ Fallback: eliminados ${removedCount} elementos sin ID`);
        }
    }

    if (shouldRender) {
        closeTeacherModal();
        saveSchedulesToStorage();
        renderCompactTeacherSchedule();
    }
}

/**
 * Cierra el modal de edición.
 */
function closeTeacherModal() {
    document.getElementById('subjectSelector').style.display = 'none';
    currentTeacherEditingCell = null;
}

/**
 * Obtiene los datos de una clase específica a partir de la celda del profesor.
 * @param {string} teacherName - El nombre del profesor.
 * @param {string} day - El día.
 * @param {string} time - La hora.
 * @param {string} specificGroup - Grupo específico a buscar.
 * @param {string} specificSubject - Asignatura específica a buscar.
 * @returns {object|null} - Los datos de la clase o null si no se encuentra.
 */
function getSpecificScheduleDataFromCell(teacherName, day, time, specificGroup, specificSubject) {
    if (!schedules[specificGroup] || !schedules[specificGroup][day] || !schedules[specificGroup][day][time]) {
        return null;
    }
    
    const scheduleItems = schedules[specificGroup][day][time];
    if (Array.isArray(scheduleItems)) {
        const item = scheduleItems.find(item => 
            item.teacher === teacherName && 
            item.subject === specificSubject &&
            item.isStart
        );
        if (item) {
            return { ...item, group: specificGroup, day, time };
        }
    }
    return null;
}
/**
 * Obtiene los datos de una clase a partir de la celda del profesor.
 * @param {string} teacherName - El nombre del profesor.
 * @param {string} day - El día.
 * @param {string} time - La hora.
 * @returns {object|null} - Los datos de la clase o null si no se encuentra.
 */
function getScheduleDataFromCell(teacherName, day, time) {
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



/**
 * Renderiza la vista de horarios por profesor usando divs (estilo Google Calendar).
 */
function renderCompactTeacherSchedule() {
    const container = document.getElementById('scheduleContainer');
    container.innerHTML = '';

    // Ordenar la lista de profesores por el nuevo campo ID
    teachers.sort((a, b) => (a.id || 'ZZZZZ').localeCompare(b.id || 'ZZZZZ'));
    const sortedTeachers = teachers.map(teacher => teacher.name);

    const teacherSchedules = buildTeacherSchedules(schedules);

    // Crear un grid de profesores similar al grid de grupos
    sortedTeachers.forEach(teacherName => {
        const teacherDiv = document.createElement('div');
        teacherDiv.className = 'teacher-schedule';
        
        // Título del profesor con información de carga lectiva
        const title = document.createElement('div');
        title.className = 'teacher-title';
        const teachingLoad = calculateTeachingLoad(teacherName);
        title.innerHTML = `
            <div class="teacher-name">${teacherName}</div>
            <div class="teaching-load">Carga lectiva: ${teachingLoad}h semanales</div>
        `;
        
        // Crear el calendario estilo Google para este profesor
        const calendarContainer = document.createElement('div');
        calendarContainer.className = 'calendar-container';
        
        // Columna de tiempo
        const timeColumn = document.createElement('div');
        timeColumn.className = 'time-column';
        renderTimeColumnForTeacher(timeColumn);
        
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
            dayColumn.dataset.teacher = teacherName;
            dayColumn.dataset.day = day;
            
            // Crear slots de 15 minutos para el día
            renderTimeSlotsForTeacherDay(dayColumn, teacherName, day);
            
            // Renderizar eventos del día para este profesor
            renderEventsForTeacherDay(dayColumn, teacherName, day, teacherSchedules[teacherName]?.[day] || {});
            
            weekGrid.appendChild(dayColumn);
        });
        
        calendarGrid.appendChild(daysHeader);
        calendarGrid.appendChild(weekGrid);
        
        calendarContainer.appendChild(timeColumn);
        calendarContainer.appendChild(calendarGrid);
        
        teacherDiv.appendChild(title);
        teacherDiv.appendChild(calendarContainer);
        
        container.appendChild(teacherDiv);
    });
    
    setTimeout(checkAllConflicts, 100);
}

/**
 * Renderiza la columna de tiempo para la vista de profesores.
 */
function renderTimeColumnForTeacher(timeColumn) {
    timeIntervals.forEach(time => {
        if (time >= "12:00" && time < "12:30") {
            if (time === "12:00") {
                const recreoSlot = document.createElement('div');
                recreoSlot.className = 'time-slot recreo-time';
                recreoSlot.textContent = 'RECREO';
                timeColumn.appendChild(recreoSlot);
            }
            return;
        }
        
        const timeSlot = document.createElement('div');
        timeSlot.className = 'time-slot';
        timeSlot.textContent = time;
        timeSlot.dataset.time = time;
        timeColumn.appendChild(timeSlot);
    });
}

/**
 * Crea los slots de tiempo para un día específico de un profesor.
 */
function renderTimeSlotsForTeacherDay(dayColumn, teacherName, day) {
    timeIntervals.forEach(time => {
        if (time >= "12:00" && time < "12:30") {
            if (time === "12:00") {
                const recreoSlot = document.createElement('div');
                recreoSlot.className = 'time-slot recreo-slot';
                recreoSlot.textContent = 'RECREO';
                recreoSlot.dataset.time = time;
                dayColumn.appendChild(recreoSlot);
            }
            return;
        }
        
        const timeSlot = document.createElement('div');
        timeSlot.className = 'time-slot empty-slot';
        timeSlot.dataset.time = time;
        timeSlot.dataset.teacher = teacherName;
        timeSlot.dataset.day = day;
        
        // Click listener para crear nueva asignación
        timeSlot.addEventListener('click', () => openTeacherModal(timeSlot, teacherName, day, time));
        
        dayColumn.appendChild(timeSlot);
    });
}

/**
 * Renderiza los eventos (clases) para un día específico de un profesor.
 */
function renderEventsForTeacherDay(dayColumn, teacherName, day, daySchedule) {
    Object.keys(daySchedule || {}).forEach(time => {
        const scheduleItems = daySchedule[time];
        if (!Array.isArray(scheduleItems) || scheduleItems.length === 0) return;
        
        // Filtrar solo elementos que son inicio (no continuaciones)
        const startItems = scheduleItems.filter(item => item.isStart);
        if (startItems.length === 0) return;
        
        const timeSlot = dayColumn.querySelector(`[data-time="${time}"]`);
        if (!timeSlot) return;
        
        if (startItems.length === 1) {
            // Una sola clase
            const item = startItems[0];
            const eventDiv = document.createElement('div');
            eventDiv.className = 'event-item';
            
            // Añadir clase de color para la asignatura
            const colorClass = getSubjectClass(item.subject);
            if (colorClass) {
                eventDiv.classList.add(colorClass);
            }
            
            const duration = item.duration || 1;
            const heightSlots = (duration * 60) / 15;
            
            eventDiv.style.height = `${heightSlots * 20}px`; // 20px por slot de 15min
            eventDiv.innerHTML = `
                <div class="event-subject">${item.subject}</div>
                <div class="event-group">${item.group}</div>
                <div class="event-duration">${duration}h</div>
            `;
            
            // Click listener
            eventDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                openTeacherModal(eventDiv, teacherName, day, time);
            });
            
            timeSlot.appendChild(eventDiv);
            timeSlot.classList.remove('empty-slot');
            timeSlot.classList.add('occupied-slot');
            
        } else {
            // Múltiples clases (conflicto)
            const conflictDiv = document.createElement('div');
            conflictDiv.className = 'event-item conflict-event';
            
            // Calcular altura basada en la duración máxima
            const maxDuration = Math.max(...startItems.map(item => item.duration || 1));
            const heightSlots = (maxDuration * 60) / 15;
            conflictDiv.style.height = `${heightSlots * 20}px`;
            
            conflictDiv.innerHTML = `
                <div class="conflict-indicator">⚠️ CONFLICTO</div>
                <div class="conflict-count">${startItems.length} clases</div>
                <div class="conflict-action">Click para elegir</div>
            `;
            
            // Click listener para mostrar selector
            conflictDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                showItemSelector(conflictDiv, teacherName, day, time, startItems);
            });
            
            timeSlot.appendChild(conflictDiv);
            timeSlot.classList.remove('empty-slot');
            timeSlot.classList.add('occupied-slot', 'conflict-slot');
        }
    });
}

function calculateTeachingLoad(teacherName) {
	let totalHours = 0;

	Object.keys(schedules).forEach(groupName => {
		Object.keys(schedules[groupName]).forEach(day => {
			Object.keys(schedules[groupName][day]).forEach(time => {
				const slot = schedules[groupName][day][time];
				if (Array.isArray(slot)) {
					slot.forEach(item => {
						if (item.teacher === teacherName) {
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
 * Muestra las opciones para resolver un conflicto con una modal detallada
 */
function showConflictResolutionOptions() {
    if (!currentTeacherEditingCell || !currentTeacherEditingCell.cell.classList.contains('conflict')) {
        return;
    }

    const { cell, teacherName, day, time } = currentTeacherEditingCell;
    const conflictGroups = JSON.parse(cell.dataset.conflictGroups || '[]');

    if (conflictGroups.length < 2) {
        alert('No se detectaron conflictos para resolver.');
        return;
    }

    console.log('Conflicto detectado:', { teacherName, day, time, conflictGroups });

    // Crear modal de resolución de conflictos
    const existingModal = document.getElementById('conflictResolutionModal');
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'conflictResolutionModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1001;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 8px;
        padding: 20px;
        max-width: 500px;
        width: 90%;
        max-height: 80%;
        overflow-y: auto;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;

    let html = `
        <h3 style="margin-top: 0; color: #d63384;">⚠️ Conflicto de Horario</h3>
        <p><strong>${teacherName}</strong> - ${day} ${time}</p>
        <p style="margin-bottom: 20px;">Se encontraron múltiples asignaciones para este profesor en el mismo horario:</p>
    `;

    conflictGroups.forEach((group, index) => {
        const colorClass = getSubjectClass(group.subject) || '';
        html += `
            <div style="
                border: 2px solid #ddd;
                border-radius: 6px;
                padding: 15px;
                margin: 10px 0;
                background: #f8f9fa;
            ">
                <h4 style="margin: 0 0 10px 0;">Opción ${index + 1}</h4>
                <div style="margin-bottom: 10px;">
                    <strong>Grupo:</strong> ${group.group}<br>
                    <strong>Asignatura:</strong> <span class="${colorClass}">${group.subject}</span><br>
                    <strong>Duración:</strong> ${group.duration || 1}h
                </div>
                <div style="text-align: center;">
                    <button 
                        onclick="removeConflictOption('${group.group}', '${group.subject}', '${teacherName}', '${day}', '${time}')"
                        style="
                            background: #dc3545;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 4px;
                            cursor: pointer;
                            font-weight: bold;
                        "
                    >🗑️ Eliminar esta opción</button>
                </div>
            </div>
        `;
    });

    html += `
        <div style="text-align: center; margin-top: 20px;">
            <button 
                onclick="closeConflictResolutionModal()"
                style="
                    background: #6c757d;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 4px;
                    cursor: pointer;
                "
            >Cancelar</button>
        </div>
    `;

    modalContent.innerHTML = html;
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Almacenar datos del conflicto para las funciones de callback
    window.currentConflictData = { teacherName, day, time, conflictGroups };
}

/**
 * Cierra la modal de resolución de conflictos
 */
function closeConflictResolutionModal() {
    const modal = document.getElementById('conflictResolutionModal');
    if (modal) {
        modal.remove();
    }
    window.currentConflictData = null;
}

/**
 * Elimina una opción específica del conflicto
 */
function removeConflictOption(groupName, subject, teacherName, day, time) {
    console.log(`🚀 ELIMINANDO opción específica: ${subject} de ${groupName}`);
    
    const success = removeSpecificConflictOption(groupName, subject, teacherName, day, time);
    
    if (success) {
        console.log(`✅ Eliminación exitosa`);
    } else {
        console.error(`❌ Fallo en la eliminación`);
    }
    
    closeConflictResolutionModal();
    saveSchedulesToStorage();
    closeTeacherModal();
    renderCompactTeacherSchedule();
    
    setTimeout(() => {
        console.log('🔄 Verificando conflictos después de eliminar opción...');
        checkAllConflicts();
    }, 300);
}

/**
 * Elimina un elemento específico del horario
 */
function removeSpecificConflictOption(groupName, subjectToRemove, teacherName, day, time) {
    console.log(`🎯 INICIANDO ELIMINACIÓN: ${subjectToRemove} de ${groupName} para ${teacherName} en ${day}/${time}`);
    
    // Verificar que existe el slot
    if (!schedules[groupName] || !schedules[groupName][day] || !schedules[groupName][day][time]) {
        console.error(`❌ No existe el slot ${groupName}/${day}/${time}`);
        console.log("🔍 Estructura disponible:");
        console.log("- schedules[groupName]:", !!schedules[groupName]);
        if (schedules[groupName]) {
            console.log("- schedules[groupName][day]:", !!schedules[groupName][day]);
            if (schedules[groupName][day]) {
                console.log("- schedules[groupName][day][time]:", !!schedules[groupName][day][time]);
            }
        }
        return false;
    }

    const items = schedules[groupName][day][time];
    if (!Array.isArray(items)) {
        console.error(`❌ El slot no es un array válido:`, typeof items, items);
        return false;
    }

    console.log(`📋 Items ANTES de eliminar (${items.length} elementos):`);
    items.forEach((item, idx) => {
        console.log(`   ${idx}: ${item.teacher} - ${item.subject} (isStart: ${item.isStart}, ID: ${item.id})`);
    });

    // Buscar el elemento específico
    const itemToRemove = items.find(item => 
        item.teacher === teacherName && 
        item.subject === subjectToRemove &&
        item.isStart
    );

    if (!itemToRemove) {
        console.error(`❌ No se encontró ${subjectToRemove} para ${teacherName} en ${groupName}/${day}/${time}`);
        console.log(`� Criterios de búsqueda:`);
        console.log(`   - teacher: "${teacherName}"`);
        console.log(`   - subject: "${subjectToRemove}"`);
        console.log(`   - isStart: true`);
        console.log(`📝 Elementos encontrados para ${teacherName}:`);
        items.filter(item => item.teacher === teacherName).forEach((item, idx) => {
            console.log(`   ${idx}: "${item.subject}" (isStart: ${item.isStart})`);
        });
        return false;
    }

    console.log(`✅ ENCONTRADO elemento a eliminar:`, {
        id: itemToRemove.id,
        teacher: itemToRemove.teacher,
        subject: itemToRemove.subject,
        duration: itemToRemove.duration,
        isStart: itemToRemove.isStart
    });

    // Eliminar usando IDs
    if (itemToRemove.id) {
        const idsToRemove = new Set([itemToRemove.id]);
        
        console.log(`🔍 Buscando continuaciones para ID: ${itemToRemove.id}`);
        
        // Buscar continuaciones relacionadas
        Object.keys(schedules[groupName][day]).forEach(slotTime => {
            const slotItems = schedules[groupName][day][slotTime];
            if (Array.isArray(slotItems)) {
                slotItems.forEach(item => {
                    if (item.parentId === itemToRemove.id) {
                        console.log(`   📎 Continuación encontrada en ${slotTime}: ID ${item.id}`);
                        idsToRemove.add(item.id);
                    }
                });
            }
        });
        
        console.log(`🗑️ IDs a eliminar (${idsToRemove.size} elementos):`, Array.from(idsToRemove));
        
        // Eliminar elementos
        let totalRemoved = 0;
        Object.keys(schedules[groupName][day]).forEach(slotTime => {
            const beforeLength = schedules[groupName][day][slotTime].length;
            
            schedules[groupName][day][slotTime] = schedules[groupName][day][slotTime].filter(item => {
                const shouldRemove = idsToRemove.has(item.id);
                if (shouldRemove) {
                    console.log(`   🗑️ Eliminando de ${slotTime}: ${item.teacher} - ${item.subject || 'continuación'} (ID: ${item.id})`);
                }
                return !shouldRemove;
            });
            
            const afterLength = schedules[groupName][day][slotTime].length;
            const removedFromSlot = beforeLength - afterLength;
            if (removedFromSlot > 0) {
                console.log(`   ✅ Eliminados ${removedFromSlot} elementos de ${slotTime}`);
            }
            totalRemoved += removedFromSlot;
        });
        
        console.log(`✅ RESUMEN: Eliminados ${totalRemoved} elementos en total de ${groupName}`);
        
        // Verificar que se eliminó correctamente
        const finalItems = schedules[groupName][day][time];
        console.log(`📋 Items DESPUÉS de eliminar (${finalItems.length} elementos):`);
        finalItems.forEach((item, idx) => {
            console.log(`   ${idx}: ${item.teacher} - ${item.subject} (isStart: ${item.isStart}, ID: ${item.id})`);
        });
        
        return totalRemoved > 0;
    } else {
        console.error(`❌ Elemento sin ID, no se puede eliminar de forma segura`);
        return false;
    }
}
/**
 * Resuelve un conflicto eliminando las asignaciones especificadas (función legacy)
 */
function resolveConflictByRemoving(teacherName, day, time, groupsToRemove) {
    console.log(`Resolviendo conflicto (legacy): ${teacherName}, ${day}, ${time}`, groupsToRemove);
    
    groupsToRemove.forEach(groupInfo => {
        removeSpecificConflictOption(groupInfo.group, groupInfo.subject, teacherName, day, time);
    });

    // Guardar cambios y re-renderizar
    console.log('Guardando cambios y re-renderizando...');
    saveSchedulesToStorage();
    closeTeacherModal();
    
    renderCompactTeacherSchedule();
    
    setTimeout(() => {
        console.log('Verificando conflictos después de resolver...');
        checkAllConflicts();
    }, 300);
}

// Iniciar la página al cargar el script
window.addEventListener('load', initProfesoresPage);

// Hacer las funciones de resolución de conflictos disponibles globalmente
window.closeConflictResolutionModal = closeConflictResolutionModal;
window.removeConflictOption = removeConflictOption;