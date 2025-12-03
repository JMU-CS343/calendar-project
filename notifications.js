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

// Check for upcoming and overdue events
function checkUpcomingEvents() {
    const now = new Date();
    const events = JSON.parse(localStorage.getItem('calendarEvents')) || [];
    const upcomingEvents = [];
    
    events.forEach(event => {
        const eventDate = new Date(event.date);
        
        if (event.startTime) {
            const [hours, minutes] = event.startTime.split(':');
            eventDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        } else {
            eventDate.setHours(0, 0, 0, 0);
        }
        
        const timeDiff = eventDate - now;
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        // Event is within the next 24 hours
        if (hoursDiff > 0 && hoursDiff <= 24) {
            upcomingEvents.push({
                ...event,
                hoursDiff: hoursDiff
            });
        }
    });
    
    if (upcomingEvents.length > 0) {
        showUpcomingNotification(upcomingEvents);
    }
    
    // Mark overdue events
    markOverdueEvents();
}

// Show notification popup for upcoming events
function showUpcomingNotification(events) {
    // Check if notification was already shown recently
    const lastNotification = localStorage.getItem('lastNotificationTime');
    const now = new Date().getTime();
    
    // Don't show notification if one was shown in the last hour
    if (lastNotification && (now - parseInt(lastNotification)) < 60 * 60 * 1000) {
        return;
    }
    
    // Remove existing notification if any
    const existingNotif = document.querySelector('.notification-popup');
    if (existingNotif) {
        existingNotif.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = 'notification-popup';
    
    let eventList = '';
    events.slice(0, 3).forEach(event => {
        const hours = Math.round(event.hoursDiff);
        const timeText = hours < 1 ? 'Less than 1 hour' : `${hours} hour${hours > 1 ? 's' : ''}`;
        eventList += `<p><strong>${event.title}</strong> - ${timeText}</p>`;
    });
    
    if (events.length > 3) {
        eventList += `<p><em>...and ${events.length - 3} more</em></p>`;
    }
    
    notification.innerHTML = `
        <button class="close-btn" onclick="this.parentElement.remove()">×</button>
        <h3>📅 Upcoming Events</h3>
        ${eventList}
    `;
    
    document.body.appendChild(notification);
    
    // Save notification time
    localStorage.setItem('lastNotificationTime', now.toString());
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 10000);
}

// Mark overdue events in red
function markOverdueEvents() {
    const now = new Date();
    const events = JSON.parse(localStorage.getItem('calendarEvents')) || [];
    
    // Check each event on the page
    document.querySelectorAll('.event-item, .schedule-event').forEach(element => {
        const eventId = element.getAttribute('data-event-id');
        if (!eventId) return;
        
        const event = events.find(e => e.id == eventId);
        if (!event) return;
        
        const eventDate = new Date(event.date);
        
        if (event.endTime) {
            const [hours, minutes] = event.endTime.split(':');
            eventDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        } else if (event.startTime) {
            const [hours, minutes] = event.startTime.split(':');
            eventDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        } else {
            // All-day event - check if date has passed
            eventDate.setHours(23, 59, 59, 999);
        }
        
        // If event time has passed, mark as overdue
        if (eventDate < now) {
            element.classList.add('overdue');
        }
    });
}

// Initialize notifications and checks
document.addEventListener('DOMContentLoaded', () => {
    // Check for upcoming events after page loads
    setTimeout(() => {
        checkUpcomingEvents();
        // Check every 5 minutes
        setInterval(checkUpcomingEvents, 5 * 60 * 1000);
    }, 2000);
    
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
