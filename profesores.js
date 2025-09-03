function renderCompactTeacherSchedule() {
    initializeAppData();
    const container = document.getElementById('scheduleContainer');
    container.innerHTML = ''; // Limpiar el contenedor

    const teacherSchedules = buildTeacherSchedules(schedules);
    const sortedTeachers = Object.keys(teacherSchedules).sort();

    const dayInitials = {
        "Lunes": "L",
        "Martes": "M",
        "Miércoles": "X",
        "Jueves": "J",
        "Viernes": "V"
    };

    // Crear la tabla principal
    const table = document.createElement('table');
    table.className = 'schedule-table teacher-schedule-compact';

    // --- Cabecera de la tabla (Profesores) ---
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const timeHeader = document.createElement('th');
    timeHeader.textContent = '';
    headerRow.appendChild(timeHeader);

    sortedTeachers.forEach(teacherName => {
        const teacherHeader = document.createElement('th');
        teacherHeader.textContent = teacherName;
        headerRow.appendChild(teacherHeader);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // --- Cuerpo de la tabla (Horas y Asignaturas) ---
    const tbody = document.createElement('tbody');
    
    days.forEach(day => {
        // Fila para el nombre del día
        const dayRow = document.createElement('tr');
        const dayCell = document.createElement('td');
        dayCell.colSpan = sortedTeachers.length + 1;
        dayCell.textContent = day.toUpperCase().split('').join(' ');
        dayCell.className = 'day-separator';
        dayRow.appendChild(dayCell);
        tbody.appendChild(dayRow);

        timeIntervals.forEach(time => {
            // Omitir las horas del recreo para compactar
            if (time >= "12:00" && time < "12:30") {
                if (time === "12:00") {
                    const recreoRow = document.createElement('tr');
                    const recreoCell = document.createElement('td');
                    recreoCell.colSpan = sortedTeachers.length + 1;
                    recreoCell.textContent = 'RECREO';
                    recreoCell.className = 'recreo';
                    recreoRow.appendChild(recreoCell);
                    tbody.appendChild(recreoRow);
                }
                return; // No generar filas para cada intervalo del recreo
            }

            const hourRow = document.createElement('tr');
            const hourCell = document.createElement('td');
            hourCell.className = 'time-slot';
            hourCell.textContent = `${dayInitials[day]} ${time}`;
            hourRow.appendChild(hourCell);

            sortedTeachers.forEach(teacherName => {
                const cell = document.createElement('td');
                const schedule = teacherSchedules[teacherName]?.[day]?.[time];

                if (schedule && schedule.isStart) {
                    cell.innerHTML = `<div>${schedule.subject}</div><div class="group-info">${schedule.group}</div>`;
                    // Aplicar rowspan si la clase dura más de un intervalo
                    const numSlots = (schedule.duration * 60) / 15;
                    if (numSlots > 1) {
                        cell.rowSpan = numSlots;
                    }
                } else if (schedule && schedule.isContinuation) {
                    // No renderizar nada, ya que la celda anterior ocupa este espacio con rowspan
                    return;
                } else {
                    cell.innerHTML = '&nbsp;'; // Celda vacía
                }
                hourRow.appendChild(cell);
            });
            tbody.appendChild(hourRow);
        });
    });

    table.appendChild(tbody);
    container.appendChild(table);
}

// Modificar el listener para llamar a la nueva función
window.addEventListener('load', renderCompactTeacherSchedule);