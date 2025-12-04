// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + A: Add event
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        const btnAdd = document.getElementById('btn-add');
        if (btnAdd) btnAdd.click();
    }
    
    // Ctrl/Cmd + D: Delete mode
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        const btnDelete = document.getElementById('btn-delete');
        if (btnDelete) btnDelete.click();
    }
    
    // Ctrl/Cmd + 1: Monthly calendar
    if ((e.ctrlKey || e.metaKey) && e.key === '1') {
        e.preventDefault();
        window.location.href = 'calendar.html';
    }
    
    // Ctrl/Cmd + 2: Daily calendar
    if ((e.ctrlKey || e.metaKey) && e.key === '2') {
        e.preventDefault();
        window.location.href = 'daily.html';
    }
    
    // Ctrl/Cmd + 3: Yearly calendar
    if ((e.ctrlKey || e.metaKey) && e.key === '3') {
        e.preventDefault();
        window.location.href = 'yearly.html';
    }
    
    // Ctrl/Cmd + 4: Monthly view
    if ((e.ctrlKey || e.metaKey) && e.key === '4') {
        e.preventDefault();
        window.location.href = 'monthly.html';
    }
});

// Real-time event monitoring - checks every minute
function checkUpcomingEvents() {
    const now = new Date();
    const events = JSON.parse(localStorage.getItem('calendarEvents')) || {};
    const notifiedEvents = JSON.parse(localStorage.getItem('notifiedEvents')) || {};
    
    events.forEach(event => {
        if (!event.startTime) return; // Skip all-day events
        
        // Parse event date correctly
        const eventDateParts = event.date.split('-');
        const eventStartTime = new Date(
            parseInt(eventDateParts[0]),
            parseInt(eventDateParts[1]) - 1,
            parseInt(eventDateParts[2])
        );
        const [hours, minutes] = event.startTime.split(':');
        eventStartTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        const eventEndTime = new Date(
            parseInt(eventDateParts[0]),
            parseInt(eventDateParts[1]) - 1,
            parseInt(eventDateParts[2])
        );
        if (event.endTime) {
            const [endHours, endMinutes] = event.endTime.split(':');
            eventEndTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);
        } else {
            eventEndTime.setTime(eventStartTime.getTime() + 60 * 60 * 1000); // 1 hour default
        }
        
        const timeDiffMs = eventStartTime - now;
        const minutesDiff = timeDiffMs / (1000 * 60);
        
        // 1-hour reminder notification (between 59-61 minutes before)
        if (minutesDiff > 59 && minutesDiff <= 61 && !notifiedEvents[event.id + '_reminder']) {
            showReminderNotification(event);
            notifiedEvents[event.id + '_reminder'] = true;
            localStorage.setItem('notifiedEvents', JSON.stringify(notifiedEvents));
        }
        
        // Late notification (event started but not ended)
        if (now >= eventStartTime && now < eventEndTime && !notifiedEvents[event.id + '_started']) {
            showLateNotification(event, 'started');
            notifiedEvents[event.id + '_started'] = true;
            localStorage.setItem('notifiedEvents', JSON.stringify(notifiedEvents));
        }
        
        // Overdue notification (event ended)
        if (now >= eventEndTime && !notifiedEvents[event.id + '_overdue']) {
            showLateNotification(event, 'overdue');
            notifiedEvents[event.id + '_overdue'] = true;
            localStorage.setItem('notifiedEvents', JSON.stringify(notifiedEvents));
        }
    });
    
    // Clean up old notifications (older than 24 hours)
    cleanupOldNotifications();
    
    // Update event colors in real-time
    markOverdueEvents();
}

// Show 1-hour reminder notification
function showReminderNotification(event) {
    const notification = createNotificationPopup('⏰ Reminder', `
        <p><strong>${event.title}</strong> starts in 1 hour</p>
        <p>Time: ${event.startTime}${event.endTime ? ' - ' + event.endTime : ''}</p>
        ${event.description ? `<p>${event.description}</p>` : ''}
    `, '#FFD700');
}

// Show late/overdue notification
function showLateNotification(event, type) {
    if (type === 'started') {
        const notification = createNotificationPopup('🔴 Event Started', `
            <p><strong>${event.title}</strong> is happening now!</p>
            <p>Time: ${event.startTime}${event.endTime ? ' - ' + event.endTime : ''}</p>
        `, '#ff6b6b');
    } else if (type === 'overdue') {
        const notification = createNotificationPopup('⏰ Event Ended', `
            <p><strong>${event.title}</strong> has ended</p>
            <p>Time: ${event.startTime}${event.endTime ? ' - ' + event.endTime : ''}</p>
        `, '#8b0000');
    }
}

// Create notification popup with custom styling
function createNotificationPopup(title, content, bgColor = '#FFD700') {
    // Remove existing notification if any
    const existingNotif = document.querySelector('.notification-popup');
    if (existingNotif) {
        existingNotif.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = 'notification-popup';
    notification.style.borderLeft = `5px solid ${bgColor}`;
    
    notification.innerHTML = `
        <button class="close-btn" onclick="this.parentElement.remove()">×</button>
        <h3>${title}</h3>
        ${content}
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 10000);
    
    return notification;
}

// Clean up old notification records
function cleanupOldNotifications() {
    const notifiedEvents = JSON.parse(localStorage.getItem('notifiedEvents')) || {};
    const events = JSON.parse(localStorage.getItem('calendarEvents')) || [];
    const eventIds = events.map(e => e.id);
    
    // Remove notifications for deleted events
    Object.keys(notifiedEvents).forEach(key => {
        const eventId = key.split('_')[0];
        if (!eventIds.includes(parseInt(eventId))) {
            delete notifiedEvents[key];
        }
    });
    
    localStorage.setItem('notifiedEvents', JSON.stringify(notifiedEvents));
}

// Mark events with color based on time proximity - LIVE UPDATES
function markOverdueEvents() {
    const now = new Date();
    const events = JSON.parse(localStorage.getItem('calendarEvents')) || [];
    
    console.log('🔍 Marking events at:', now.toLocaleString());
    
    // Check each event on the page
    document.querySelectorAll('.event-item, .schedule-event').forEach(element => {
        const eventId = element.getAttribute('data-event-id');
        if (!eventId) return;
        
        const event = events.find(e => e.id == eventId);
        if (!event) return;
        
        // Remove all status classes first
        element.classList.remove('overdue', 'imminent', 'upcoming');
        
        // For events with specific times
        if (event.startTime) {
            // Parse event date correctly (handle YYYY-MM-DD format)
            const eventDateParts = event.date.split('-');
            const eventStartTime = new Date(
                parseInt(eventDateParts[0]), // year
                parseInt(eventDateParts[1]) - 1, // month (0-indexed)
                parseInt(eventDateParts[2]) // day
            );
            const [startHours, startMinutes] = event.startTime.split(':');
            eventStartTime.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0);
            
            const eventEndTime = new Date(
                parseInt(eventDateParts[0]),
                parseInt(eventDateParts[1]) - 1,
                parseInt(eventDateParts[2])
            );
            if (event.endTime) {
                const [endHours, endMinutes] = event.endTime.split(':');
                eventEndTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);
            } else {
                eventEndTime.setTime(eventStartTime.getTime() + 60 * 60 * 1000); // 1 hour default
            }
            
            const timeDiffMs = eventStartTime - now;
            const minutesDiff = timeDiffMs / (1000 * 60);
            
            console.log(`📅 Event: ${event.title}`);
            console.log(`   Start: ${eventStartTime.toLocaleString()}`);
            console.log(`   End: ${eventEndTime.toLocaleString()}`);
            console.log(`   Minutes until start: ${minutesDiff.toFixed(1)}`);
            
            // OVERDUE: Event has ended (dark red)
            if (now >= eventEndTime) {
                element.classList.add('overdue');
                console.log(`   ❌ OVERDUE (ended)`);
            }
            // IMMINENT: Event is happening now OR starts within 1 hour (red with pulse)
            else if (now >= eventStartTime || (minutesDiff > 0 && minutesDiff <= 60)) {
                element.classList.add('imminent');
                console.log(`   🔴 IMMINENT (${now >= eventStartTime ? 'happening now' : 'within 1 hour'})`);
            }
            // UPCOMING: Event starts more than 1 hour away (yellow - for visibility)
            else if (minutesDiff > 60) {
                element.classList.add('upcoming');
                console.log(`   🟡 UPCOMING (${(minutesDiff / 60).toFixed(1)} hours away)`);
            }
        } else {
            // All-day events - check if date has passed
            const eventDateParts = event.date.split('-');
            const eventDate = new Date(
                parseInt(eventDateParts[0]),
                parseInt(eventDateParts[1]) - 1,
                parseInt(eventDateParts[2])
            );
            eventDate.setHours(23, 59, 59, 999);
            
            if (eventDate < now) {
                element.classList.add('overdue');
                console.log(`📅 All-day event: ${event.title} - OVERDUE`);
            }
        }
    });
    
    console.log('✅ Color marking complete\n');
}

// Initialize real-time monitoring system

// Initialize real-time monitoring system
document.addEventListener('DOMContentLoaded', () => {
    // Initial check immediately after page loads
    setTimeout(() => {
        checkUpcomingEvents();
    }, 500);
    
    // LIVE UPDATES: Check every 60 seconds for real-time color changes and notifications
    setInterval(() => {
        checkUpcomingEvents();
    }, 60 * 1000);
    
    // Help button toggle
    const btnHelp = document.getElementById('btn-help');
    const dropdown = document.getElementById('shortcuts-dropdown');
    
    if (btnHelp && dropdown) {
        btnHelp.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target) && e.target !== btnHelp) {
                dropdown.classList.remove('show');
            }
        });
    }
});
