// Newest first. Each entry lists what got better for users, per language; `en` is the fallback.
export const UPDATES = [
  {
    date: '2026-11-04',
    notes: {
      en: ['The whole app now follows your phone\'s language.', 'Star a country next to its name, and the arrow buttons will move only between your favorites.'],
      ko: ['스마트폰 언어에 맞춰 앱 전체가 바뀌어요.', '나라 이름 옆 별표로 즐겨찾기를 하면, 좌우 이동 버튼이 즐겨찾기한 나라만 오가요.'],
      ja: ['スマートフォンの言語に合わせて、アプリ全体が切り替わります。', '国名の横の星でお気に入りに登録すると、左右の矢印ボタンはお気に入りの国の間だけを移動します。'],
      zh: ['整个应用会跟随手机的语言。', '点按国家名称旁的星标加入收藏后，左右箭头按钮只会在收藏的国家之间切换。'],
      es: ['Toda la app ahora sigue el idioma de tu teléfono.', 'Marca un país con la estrella junto a su nombre y las flechas solo se moverán entre tus favoritos.'],
      fr: ['Toute l’app suit désormais la langue de votre téléphone.', 'Mettez un pays en favori avec l’étoile à côté de son nom : les flèches ne passeront alors qu’entre vos favoris.'],
      de: ['Die ganze App folgt jetzt der Sprache deines Handys.', 'Markiere ein Land mit dem Stern neben seinem Namen, dann wechseln die Pfeiltasten nur noch zwischen deinen Favoriten.']
    }
  },
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
