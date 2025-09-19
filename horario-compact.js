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