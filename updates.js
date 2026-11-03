// Newest first. Each entry lists what got better for users, per language; `en` is the fallback.
export const UPDATES = [
  {
    date: '2026-11-03',
    notes: {
      en: ['Improved the UI and options.'],
      ko: ['UI와 옵션 내용을 개선했어요.'],
      ja: ['UIとオプションを改善しました。'],
      zh: ['优化了界面和选项。'],
      es: ['Hemos mejorado la interfaz y las opciones.'],
      fr: ['Nous avons amélioré l’interface et les options.'],
      de: ['Wir haben die Oberfläche und die Optionen verbessert.']
    }
  }
];

function formatDate(date, lang) {
  const value = new Date(`${date}T00:00:00`);
  try { return value.toLocaleDateString(lang, { year: 'numeric', month: 'long', day: 'numeric' }); } catch { return date; }
}

export function renderUpdates(host, lang) {
  host.replaceChildren(...UPDATES.map(entry => {
    const section = document.createElement('section');
    section.className = 'update-entry';
    const time = document.createElement('time');
    time.dateTime = entry.date;
    time.textContent = formatDate(entry.date, lang);
    const list = document.createElement('ul');
    for (const note of entry.notes[lang] ?? entry.notes.en) {
      const item = document.createElement('li');
      item.textContent = note;
      list.append(item);
    }
    section.append(time, list);
    return section;
  }));
}
