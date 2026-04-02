const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_ABBR = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function initCalendar() {
  const dateEl = document.getElementById('cal-date');
  const yearEl = document.getElementById('cal-year');
  const gridEl = document.getElementById('cal-grid');

  function render() {
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth();
    const year = now.getFullYear();
    const dayOfWeek = now.getDay();

    dateEl.textContent = `${DAYS[dayOfWeek]}, ${MONTHS[month]} ${day}`;
    yearEl.textContent = `${year}`;

    // Mini calendar grid
    let html = '';
    for (const d of DAY_ABBR) {
      html += `<span class="cal-header">${d}</span>`;
    }

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
      html += `<span class="cal-day empty"></span>`;
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = d === day ? ' today' : '';
      html += `<span class="cal-day${isToday}">${d}</span>`;
    }

    gridEl.innerHTML = html;
  }

  render();
  // Refresh at midnight
  const now = new Date();
  const msToMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) - now;
  setTimeout(() => {
    render();
    setInterval(render, 24 * 60 * 60 * 1000);
  }, msToMidnight);

  return { render };
}
