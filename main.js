const BTN_MONTHLY = document.getElementById("btn-monthly"),
      BTN_DAILY = document.getElementById("btn-daily"),
      BTN_YEARLY = document.getElementById("btn-yearly"),
      BTN_ADD = document.getElementById("btn-add"),
      BTN_DELETE = document.getElementById("btn-delete"),
      BTN_COLOR = document.getElementById("btn-color"),
      DLG_COLOR = document.getElementById("dlg-color"),
      DLG_ADD_EVENT = document.getElementById("dlg-add-event");

// Event management variables
let events = JSON.parse(localStorage.getItem('calendarEvents')) || [];
let deleteMode = false;

// Color picker functionality
BTN_COLOR.addEventListener("click", () => {
    const BTN_BOUNDS = BTN_COLOR.getBoundingClientRect();
    DLG_COLOR.show();
    DLG_COLOR.style.position = "absolute";
    DLG_COLOR.style.top = BTN_BOUNDS.bottom + "px";
    DLG_COLOR.style.left = BTN_BOUNDS.left + "px";
});

// Add event functionality
BTN_ADD.addEventListener("click", () => {
    const BTN_BOUNDS = BTN_ADD.getBoundingClientRect();
    DLG_ADD_EVENT.show();
    DLG_ADD_EVENT.style.position = "absolute";
    DLG_ADD_EVENT.style.top = BTN_BOUNDS.bottom + "px";
    DLG_ADD_EVENT.style.left = BTN_BOUNDS.left + "px";
    
    // Set default date to today
    const today = new Date();
    const todayString = today.getFullYear() + '-' + 
        String(today.getMonth() + 1).padStart(2, '0') + '-' + 
        String(today.getDate()).padStart(2, '0');
    document.getElementById('eventDate').value = todayString;
});

// Toggle time fields visibility
document.addEventListener('DOMContentLoaded', () => {
    const timeCheckbox = document.getElementById('addSpecificTime');
    const timeFields = document.getElementById('timeFields');
    
    if (timeCheckbox && timeFields) {
        timeCheckbox.addEventListener('change', (e) => {
            timeFields.style.display = e.target.checked ? 'block' : 'none';
        });
    }
});

// Handle add event form submission
DLG_ADD_EVENT.addEventListener("close", () => {
    if (DLG_ADD_EVENT.returnValue === "add") {
        const title = document.getElementById('eventTitle').value.trim();
        const description = document.getElementById('eventDescription').value.trim();
        const date = document.getElementById('eventDate').value;
        const hasTime = document.getElementById('addSpecificTime').checked;
        const startTime = hasTime ? document.getElementById('eventStartTime').value : null;
        const endTime = hasTime ? document.getElementById('eventEndTime').value : null;
        
        if (title && date) {
            const newEvent = {
                id: Date.now(), // Simple ID generation
                title: title,
                description: description,
                date: date,
                startTime: startTime,
                endTime: endTime
            };
            
            events.push(newEvent);
            localStorage.setItem('calendarEvents', JSON.stringify(events));
            
            // Refresh calendar view based on which page we're on
            if (typeof renderCalendarWithEvents === 'function') {
                renderCalendarWithEvents();
            }
            if (typeof renderMonth === 'function') {
                renderMonth();
            }
            if (typeof renderWeek === 'function') {
                renderWeek();
            }
            if (typeof renderYear === 'function') {
                renderYear();
            }
            
            // Apply event colors after rendering
            setTimeout(() => {
                if (typeof markOverdueEvents === 'function') {
                    markOverdueEvents();
                }
            }, 100);
        }
    }
    
    // Always clear form when dialog closes (whether add or cancel)
    document.getElementById('eventTitle').value = '';
    document.getElementById('eventDescription').value = '';
    document.getElementById('eventDate').value = '';
    document.getElementById('addSpecificTime').checked = false;
    document.getElementById('eventStartTime').value = '';
    document.getElementById('eventEndTime').value = '';
    document.getElementById('timeFields').style.display = 'none';
});

// Delete mode toggle
BTN_DELETE.addEventListener("click", () => {
    deleteMode = !deleteMode;
    BTN_DELETE.textContent = deleteMode ? "Cancel" : "Delete";
    BTN_DELETE.style.backgroundColor = deleteMode ? "#ff6b6b" : "";
    
    if (!deleteMode) {
        // Refresh display when exiting delete mode
        if (typeof renderCalendarWithEvents === 'function') {
            renderCalendarWithEvents();
        }
        if (typeof renderMonth === 'function') {
            renderMonth();
        }
        if (typeof renderWeek === 'function') {
            renderWeek();
        }
        if (typeof renderYear === 'function') {
            renderYear();
        }
        
        // Apply event colors after rendering
        setTimeout(() => {
            if (typeof markOverdueEvents === 'function') {
                markOverdueEvents();
            }
        }, 100);
    }
    
    // Update cursor style for day cells
    const dayCells = document.querySelectorAll('.day-cell');
    dayCells.forEach(cell => {
        cell.style.cursor = deleteMode ? "pointer" : "default";
    });
});

// Function to render calendar with events
function renderCalendarWithEvents() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const grid = document.getElementById('daysGrid');
    
    grid.innerHTML = '';
    
    // Add empty cells before the first day of the month
    for (let i = 0; i < firstDay; i++) {
        grid.innerHTML += '<div class="day-cell"></div>';
    }
    
    // Add cells for each day of the month
    for (let d = 1; d <= daysInMonth; d++) {
        const isToday = d === now.getDate() ? ' today' : '';
        const dayCell = document.createElement('div');
        dayCell.className = `day-cell${isToday}`;
        dayCell.innerHTML = `<div class="day-number">${d}</div>`;
        
        // Check for events on this day
        const dayString = now.getFullYear() + '-' + 
            String(now.getMonth() + 1).padStart(2, '0') + '-' + 
            String(d).padStart(2, '0');
        
        const dayEvents = events.filter(event => event.date === dayString);
        
        if (dayEvents.length > 0) {
            const eventsContainer = document.createElement('div');
            eventsContainer.className = 'day-events';
            
            dayEvents.forEach(event => {
                const eventElement = document.createElement('div');
                eventElement.className = 'event-item';
                eventElement.innerHTML = `
                    <div class="event-title">${event.title}</div>
                    ${event.description ? `<div class="event-desc">${event.description}</div>` : ''}
                `;
                eventElement.setAttribute('data-event-id', event.id);
                
                // Add click handler for delete mode
                eventElement.addEventListener('click', (e) => {
                    if (deleteMode) {
                        e.stopPropagation();
                        if (confirm(`Delete event "${event.title}"?`)) {
                            // Reload events from localStorage to get latest data
                            events = JSON.parse(localStorage.getItem('calendarEvents')) || [];
                            events = events.filter(evt => evt.id !== event.id);
                            localStorage.setItem('calendarEvents', JSON.stringify(events));
                            renderCalendarWithEvents();
                        }
                    }
                });
                
                eventsContainer.appendChild(eventElement);
            });
            
            dayCell.appendChild(eventsContainer);
        }
        
        grid.appendChild(dayCell);
    }
}

// Initialize calendar with events when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure the original calendar rendering is complete
    setTimeout(() => {
        renderCalendarWithEvents();
        // Apply event colors after rendering
        if (typeof markOverdueEvents === 'function') {
            markOverdueEvents();
        }
    }, 100);
});