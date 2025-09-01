



function renderTeacherSchedules() {
    initializeAppData();
    const container = document.getElementById('scheduleContainer');
    container.innerHTML = '';
    
    const teacherSchedules = buildTeacherSchedules(schedules);

    Object.keys(teacherSchedules).sort().forEach(teacherName => {
        const teacherDiv = document.createElement('div');
        teacherDiv.className = 'group-schedule'; // Reutilizamos estilos
        
        const title = document.createElement('div');
        title.className = 'group-title';
        title.textContent = teacherName;
        
        const table = document.createElement('table');
        table.className = 'schedule-table';
        
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = '<th>Hora</th>' + days.map(day => `<th>${day}</th>`).join('');
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
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
                    cell.rowSpan = 2;
                    row.appendChild(cell);
                }
            } else {
                days.forEach(day => {
                    const schedule = teacherSchedules[teacherName][day][time];

                    if (schedule && schedule.isContinuation) {
                        return;
                    }

                    const cell = document.createElement('td');
                    cell.className = 'class-slot';

                    if (schedule && schedule.isStart) {
                        const numSlots = (schedule.duration * 60) / 15;
                        cell.rowSpan = numSlots;
                        cell.classList.add('occupied');
                        cell.innerHTML = `
                            <div class="class-info">${schedule.subject}</div>
                            <div class="teacher-info">${schedule.group}</div>
                        `;
                    } else {
                        cell.innerHTML = '&nbsp;'; // Espacio para celdas vacías
                    }
                    row.appendChild(cell);
                });
            }
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        teacherDiv.appendChild(title);
        teacherDiv.appendChild(table);
        container.appendChild(teacherDiv);
    });
}

window.addEventListener('load', renderTeacherSchedules);

window.addEventListener('load', renderTeacherSchedules);
