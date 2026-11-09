import { UI } from './ui-strings.js?v=6';

const escapeHTML = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Language order: `?lang=xx` (testing) > the language chosen in Options > the device language. Until a language is chosen
// the first device language that we translate wins (['pt-BR', 'ko'] shows Korean) and is detected again on every launch.
export const SUPPORTED = ['en', 'ko', 'ja', 'zh', 'es', 'fr', 'de'];
export const LANG_NAMES = { en: 'English', ko: '한국어', ja: '日本語', zh: '简体中文', es: 'Español', fr: 'Français', de: 'Deutsch' };
const LANG_KEY = 'orbitone-lang';
const tags = navigator.languages?.length ? [...navigator.languages] : [navigator.language || 'en'];
const primary = tag => String(tag || '').toLowerCase().split('-')[0];
const forced = new URLSearchParams(location.search).get('lang');
export function setLangPref(value) {
  if (!SUPPORTED.includes(value)) return;
  try { localStorage.setItem(LANG_KEY, value); } catch { /* Storage unavailable: the choice cannot be kept. */ }
}
let pref = null;
try { const saved = localStorage.getItem(LANG_KEY); if (SUPPORTED.includes(saved)) pref = saved; } catch { /* storage unavailable */ }
const systemLang = tags.map(primary).find(code => SUPPORTED.includes(code)) ?? 'en';
export const lang = SUPPORTED.includes(forced) ? forced : (pref ?? systemLang);

const LINKS = {
  cloud: 'https://console.cloud.google.com/projectcreate',
  api: 'https://console.cloud.google.com/apis/library/youtube.googleapis.com',
  cred: 'https://console.cloud.google.com/apis/credentials',
  terms: 'https://www.youtube.com/t/terms',
  privacy: 'https://policies.google.com/privacy'
};

const DICT = {
  en: {
    close: 'Close',
    'install.title': 'Add Orbitone to your Home Screen',
    'install.ios': 'iPhone / iPad: In Safari, choose **Share → Add to Home Screen**.',
    'install.android': 'Android / desktop: In your browser menu, choose **Install app** or **Add to Home Screen**.',
    'install.note': 'The install icon disappears once you open the installed app. HTTPS or localhost is required.',
    'install.done': 'Orbitone has been installed.',
    'settings.title': 'Options',
    'updates.title': "What's New",
    'support.title': 'Buy me a coffee',
    'support.text': 'Your support helps a lot with adding new country charts and improving playback.',
    'support.custom': 'Custom',
    'support.note': 'Opens PayPal. Payments are handled by PayPal; Orbitone never sees your payment details.',
    'support.thanks': 'If you chipped in, thank you so much! It helps Orbitone keep growing.',
    'service.legend': 'Full-track service',
    'service.youtube': 'Play inside the app',
    'service.spotify': 'Open this track in Spotify',
    'service.apple': 'Open this track in Apple Music',
    'service.notice': 'Depending on your sign-in or subscription status, playback may not start automatically. A search results screen may open.',
    'settings.privacy': 'The key is stored only in this browser on your device and is never sent to the developer or any other server. Be sure to set the restrictions from step 4.',
    'settings.legal': 'Orbitone uses YouTube API Services. By using full-track playback you agree to the [[terms|YouTube Terms of Service]] and the [[privacy|Google Privacy Policy]].',
    'settings.chartNote': 'Apple Music country charts are used first. On static hosting they may fall back to iTunes sales charts, and the source is always shown.',
    'settings.privacyHeading': 'Playback and privacy',
    'settings.privacyP1': 'YouTube and Spotify connect to their own services when you play or link a track. Autoplay, region, sign-in and subscription limits may apply. Orbitone does not download or store music offline.',
    'settings.privacyP2': 'Your playlist and linked video IDs are stored on this device. If a chart fails to load, a cached chart or a clearly labeled sample is shown.',
  },
  ko: {
    close: '닫기',
    'install.title': 'Orbitone을 홈 화면에',
    'install.ios': 'iPhone / iPad: Safari에서 **공유 → 홈 화면에 추가**를 선택하세요.',
    'install.android': 'Android / 데스크톱: 브라우저 메뉴에서 **앱 설치** 또는 **홈 화면에 추가**를 선택하세요.',
    'install.note': '설치된 앱에서 실행하면 설치 아이콘이 사라집니다. HTTPS 또는 localhost가 필요합니다.',
    'install.done': 'Orbitone이 설치되었습니다.',
    'settings.title': '옵션',
    'updates.title': '새소식',
    'support.title': '커피 한 잔 후원하기',
    'support.text': '새로운 국가 차트와 재생 기능 개선에 큰 도움이 됩니다.',
    'support.custom': '직접 입력',
    'support.note': 'PayPal 결제 페이지가 열립니다. 결제는 PayPal에서 처리되며 Orbitone은 결제 정보를 받지 않습니다.',
    'support.thanks': '후원해 주셨다면 정말 감사합니다! 덕분에 Orbitone이 계속 성장할 수 있어요.',
    'service.legend': '전체 듣기 서비스',
    'service.youtube': '앱 안에서 재생',
    'service.spotify': 'Spotify에서 해당 곡 열기',
    'service.apple': 'Apple Music에서 해당 곡 열기',
    'service.notice': '로그인 또는 구독 상태에 따라 자동 재생되지 않을 수 있습니다. 검색 결과 화면이 열릴 수 있습니다.',
    'settings.privacy': '키는 이 기기의 브라우저에만 저장되고 개발자나 다른 서버로 전송되지 않습니다. 위 4번의 제한을 꼭 설정해 주세요.',
    'settings.legal': 'Orbitone은 YouTube API 서비스를 사용합니다. 전곡 듣기를 사용하면 [[terms|YouTube 서비스 약관]]과 [[privacy|Google 개인정보처리방침]]에 동의하는 것으로 간주됩니다.',
    'settings.chartNote': 'Apple Music 국가별 인기 차트를 우선 사용합니다. 정적 호스팅에서는 iTunes 판매 차트로 대체될 수 있으며 출처를 표시합니다.',
    'settings.privacyHeading': '재생과 개인정보',
    'settings.privacyP1': 'YouTube·Spotify는 재생/연결 시 해당 서비스에 접속합니다. 자동재생, 지역, 로그인 및 구독 제한이 적용될 수 있습니다. 음악을 다운로드하거나 오프라인 저장하지 않습니다.',
    'settings.privacyP2': '플레이리스트와 연결한 영상 ID는 이 기기에 저장됩니다. 차트 로딩 실패 시 캐시 또는 명확히 표시된 예시를 보여줍니다.',
  },
  ja: {
    close: '閉じる',
    'install.title': 'Orbitone をホーム画面に追加',
    'install.ios': 'iPhone / iPad: Safari で **共有 → ホーム画面に追加** を選びます。',
    'install.android': 'Android / デスクトップ: ブラウザのメニューから **アプリをインストール** または **ホーム画面に追加** を選びます。',
    'install.note': 'インストールしたアプリから起動すると、インストールアイコンは表示されなくなります。HTTPS または localhost が必要です。',
    'install.done': 'Orbitone をインストールしました。',
    'settings.title': 'オプション',
    'updates.title': '新着情報',
    'support.title': 'コーヒー1杯のご支援',
    'support.text': '新しい国のチャートの追加や再生機能の改善に大きな助けになります。',
    'support.custom': '金額を入力',
    'support.note': 'PayPal の決済ページが開きます。決済は PayPal が処理し、Orbitone が決済情報を受け取ることはありません。',
    'support.thanks': 'ご支援くださった方、本当にありがとうございます！Orbitone をこれからも育てていけます。',
    'service.legend': 'フル再生のサービス',
    'service.youtube': 'アプリ内で再生',
    'service.spotify': 'Spotify でこの曲を開く',
    'service.apple': 'Apple Music でこの曲を開く',
    'service.notice': 'ログインやサブスクリプションの状態によっては、自動再生されない場合があります。検索結果の画面が開くことがあります。',
    'settings.privacy': 'キーはこの端末のブラウザにのみ保存され、開発者や他のサーバーには送信されません。上の手順4の制限を必ず設定してください。',
    'settings.legal': 'Orbitone は YouTube API サービスを使用します。フル再生を使用すると、[[terms|YouTube 利用規約]]と [[privacy|Google プライバシーポリシー]]に同意したものとみなされます。',
    'settings.chartNote': 'Apple Music の国別チャートを優先して使用します。静的ホスティングでは iTunes の売上チャートに切り替わることがあり、その場合は出典が表示されます。',
    'settings.privacyHeading': '再生とプライバシー',
    'settings.privacyP1': 'YouTube と Spotify は、再生・連携時にそれぞれのサービスへ接続します。自動再生、地域、ログイン、サブスクリプションの制限が適用される場合があります。音楽のダウンロードやオフライン保存は行いません。',
    'settings.privacyP2': 'プレイリストと連携した動画 ID はこの端末に保存されます。チャートの読み込みに失敗した場合は、キャッシュまたは明示されたサンプルを表示します。',
  },
  zh: {
    close: '关闭',
    'install.title': '将 Orbitone 添加到主屏幕',
    'install.ios': 'iPhone / iPad：在 Safari 中选择 **分享 → 添加到主屏幕**。',
    'install.android': 'Android / 桌面：在浏览器菜单中选择 **安装应用** 或 **添加到主屏幕**。',
    'install.note': '从已安装的应用启动后，安装图标会消失。需要 HTTPS 或 localhost。',
    'install.done': 'Orbitone 已安装。',
    'settings.title': '选项',
    'updates.title': '最新消息',
    'support.title': '请我喝杯咖啡',
    'support.text': '这将大大有助于新增国家榜单和改进播放功能。',
    'support.custom': '自定义金额',
    'support.note': '将打开 PayPal 付款页面。付款由 PayPal 处理，Orbitone 不会获取您的付款信息。',
    'support.thanks': '如果您已赞助，非常感谢！这将帮助 Orbitone 不断成长。',
    'service.legend': '完整播放服务',
    'service.youtube': '在应用内播放',
    'service.spotify': '在 Spotify 中打开这首歌',
    'service.apple': '在 Apple Music 中打开这首歌',
    'service.notice': '根据登录或订阅状态，可能无法自动播放，也可能会打开搜索结果页面。',
    'settings.privacy': '密钥只保存在此设备的浏览器中，不会发送给开发者或其他服务器。请务必设置上面第 4 步的限制。',
    'settings.legal': 'Orbitone 使用 YouTube API 服务。使用完整播放即表示您同意 [[terms|YouTube 服务条款]] 和 [[privacy|Google 隐私权政策]]。',
    'settings.chartNote': '优先使用 Apple Music 各国榜单。在静态托管环境下可能改用 iTunes 销量榜，并会标明来源。',
    'settings.privacyHeading': '播放与隐私',
    'settings.privacyP1': '播放或关联时，YouTube 和 Spotify 会连接各自的服务，可能受到自动播放、地区、登录和订阅的限制。Orbitone 不会下载音乐，也不会离线保存。',
    'settings.privacyP2': '播放列表和已关联的视频 ID 保存在此设备上。榜单加载失败时，会显示缓存内容或明确标注的示例。',
  },
  es: {
    close: 'Cerrar',
    'install.title': 'Añade Orbitone a la pantalla de inicio',
    'install.ios': 'iPhone / iPad: en Safari, elige **Compartir → Añadir a pantalla de inicio**.',
    'install.android': 'Android / escritorio: en el menú del navegador, elige **Instalar aplicación** o **Añadir a la pantalla de inicio**.',
    'install.note': 'El icono de instalación desaparece cuando abres la app instalada. Se requiere HTTPS o localhost.',
    'install.done': 'Orbitone se ha instalado.',
    'settings.title': 'Opciones',
    'updates.title': 'Novedades',
    'support.title': 'Invítame a un café',
    'support.text': 'Tu apoyo ayuda mucho a añadir nuevas listas de países y a mejorar la reproducción.',
    'support.custom': 'Otro importe',
    'support.note': 'Se abre PayPal. PayPal gestiona el pago; Orbitone nunca ve tus datos de pago.',
    'support.thanks': 'Si has colaborado, ¡muchas gracias! Ayuda a que Orbitone siga creciendo.',
    'service.legend': 'Servicio de reproducción completa',
    'service.youtube': 'Reproducir dentro de la app',
    'service.spotify': 'Abrir esta canción en Spotify',
    'service.apple': 'Abrir esta canción en Apple Music',
    'service.notice': 'Según tu inicio de sesión o suscripción, es posible que la reproducción no se inicie automáticamente. Puede abrirse una pantalla de resultados de búsqueda.',
    'settings.privacy': 'La clave solo se guarda en el navegador de este dispositivo y nunca se envía al desarrollador ni a otros servidores. Asegúrate de configurar las restricciones del paso 4.',
    'settings.legal': 'Orbitone usa los servicios de la API de YouTube. Al usar la reproducción completa aceptas las [[terms|Condiciones del servicio de YouTube]] y la [[privacy|Política de privacidad de Google]].',
    'settings.chartNote': 'Se usan primero las listas de éxitos de Apple Music por país. En alojamiento estático pueden sustituirse por las listas de ventas de iTunes, y siempre se indica la fuente.',
    'settings.privacyHeading': 'Reproducción y privacidad',
    'settings.privacyP1': 'YouTube y Spotify se conectan a sus propios servicios al reproducir o vincular. Pueden aplicarse límites de reproducción automática, región, inicio de sesión y suscripción. Orbitone no descarga música ni la guarda sin conexión.',
    'settings.privacyP2': 'Tu lista de reproducción y los ID de vídeo vinculados se guardan en este dispositivo. Si falla la carga de una lista, se muestra una copia en caché o un ejemplo claramente indicado.',
  },
  fr: {
    close: 'Fermer',
    'install.title': 'Ajouter Orbitone à l’écran d’accueil',
    'install.ios': 'iPhone / iPad : dans Safari, choisissez **Partager → Sur l’écran d’accueil**.',
    'install.android': 'Android / ordinateur : dans le menu du navigateur, choisissez **Installer l’application** ou **Ajouter à l’écran d’accueil**.',
    'install.note': 'L’icône d’installation disparaît lorsque vous ouvrez l’app installée. HTTPS ou localhost est requis.',
    'install.done': 'Orbitone a été installée.',
    'settings.title': 'Options',
    'updates.title': 'Nouveautés',
    'support.title': 'Offrir un café',
    'support.text': 'Votre soutien aide beaucoup à ajouter de nouveaux classements par pays et à améliorer la lecture.',
    'support.custom': 'Autre montant',
    'support.note': 'PayPal s’ouvre. Le paiement est géré par PayPal ; Orbitone ne voit jamais vos informations de paiement.',
    'support.thanks': 'Si vous avez contribué, merci beaucoup ! Cela aide Orbitone à continuer de grandir.',
    'service.legend': 'Service de lecture complète',
    'service.youtube': 'Lire dans l’application',
    'service.spotify': 'Ouvrir ce titre dans Spotify',
    'service.apple': 'Ouvrir ce titre dans Apple Music',
    'service.notice': 'Selon votre connexion ou votre abonnement, la lecture peut ne pas démarrer automatiquement. Un écran de résultats de recherche peut s’ouvrir.',
    'settings.privacy': 'La clé n’est enregistrée que dans le navigateur de cet appareil et n’est jamais envoyée au développeur ni à un autre serveur. Pensez à définir les restrictions de l’étape 4.',
    'settings.legal': 'Orbitone utilise les services d’API YouTube. En utilisant la lecture complète, vous acceptez les [[terms|Conditions d’utilisation de YouTube]] et la [[privacy|Politique de confidentialité de Google]].',
    'settings.chartNote': 'Les classements Apple Music par pays sont utilisés en priorité. Sur un hébergement statique, ils peuvent être remplacés par les classements des ventes iTunes, et la source est toujours indiquée.',
    'settings.privacyHeading': 'Lecture et confidentialité',
    'settings.privacyP1': 'YouTube et Spotify se connectent à leurs propres services lors de la lecture ou de l’association. Des limites de lecture automatique, de région, de connexion et d’abonnement peuvent s’appliquer. Orbitone ne télécharge pas la musique et ne l’enregistre pas hors ligne.',
    'settings.privacyP2': 'Votre playlist et les identifiants vidéo associés sont enregistrés sur cet appareil. Si le chargement d’un classement échoue, un classement en cache ou un exemple clairement indiqué s’affiche.',
  },
  de: {
    close: 'Schließen',
    'install.title': 'Orbitone zum Home-Bildschirm hinzufügen',
    'install.ios': 'iPhone / iPad: Wähle in Safari **Teilen → Zum Home-Bildschirm**.',
    'install.android': 'Android / Desktop: Wähle im Browsermenü **App installieren** oder **Zum Startbildschirm hinzufügen**.',
    'install.note': 'Das Installationssymbol verschwindet, sobald du die installierte App öffnest. HTTPS oder localhost ist erforderlich.',
    'install.done': 'Orbitone wurde installiert.',
    'settings.title': 'Optionen',
    'updates.title': 'Neuigkeiten',
    'support.title': 'Spendier mir einen Kaffee',
    'support.text': 'Deine Unterstützung hilft sehr dabei, neue Länder-Charts hinzuzufügen und die Wiedergabe zu verbessern.',
    'support.custom': 'Anderer Betrag',
    'support.note': 'PayPal wird geöffnet. Die Zahlung wird von PayPal abgewickelt; Orbitone sieht deine Zahlungsdaten nie.',
    'support.thanks': 'Falls du etwas beigetragen hast: vielen Dank! Damit kann Orbitone weiter wachsen.',
    'service.legend': 'Dienst für ganze Titel',
    'service.youtube': 'In der App abspielen',
    'service.spotify': 'Titel in Spotify öffnen',
    'service.apple': 'Titel in Apple Music öffnen',
    'service.notice': 'Je nach Anmelde- oder Abostatus startet die Wiedergabe möglicherweise nicht automatisch. Es kann eine Suchergebnisseite geöffnet werden.',
    'settings.privacy': 'Der Schlüssel wird nur im Browser dieses Geräts gespeichert und weder an den Entwickler noch an andere Server gesendet. Richte unbedingt die Einschränkungen aus Schritt 4 ein.',
    'settings.legal': 'Orbitone nutzt die YouTube-API-Dienste. Mit der Wiedergabe ganzer Titel stimmst du den [[terms|YouTube-Nutzungsbedingungen]] und der [[privacy|Datenschutzerklärung von Google]] zu.',
    'settings.chartNote': 'Bevorzugt werden die Apple-Music-Länder-Charts verwendet. Bei statischem Hosting kann auf die iTunes-Verkaufscharts ausgewichen werden; die Quelle wird immer angezeigt.',
    'settings.privacyHeading': 'Wiedergabe und Datenschutz',
    'settings.privacyP1': 'YouTube und Spotify verbinden sich beim Abspielen oder Verknüpfen mit ihren eigenen Diensten. Es können Einschränkungen für Autoplay, Region, Anmeldung und Abos gelten. Orbitone lädt keine Musik herunter und speichert sie nicht offline.',
    'settings.privacyP2': 'Deine Playlist und verknüpfte Video-IDs werden auf diesem Gerät gespeichert. Schlägt das Laden eines Charts fehl, werden zwischengespeicherte Daten oder ein klar gekennzeichnetes Beispiel angezeigt.',
  }
};

const strings = { ...DICT.en, ...UI.en, ...DICT[lang], ...UI[lang] };

export const t = (key, vars = {}) => (strings[key] ?? key).replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? '');

// Translation text is trusted but still escaped; [[link|label]], **bold** and `code` are the only markup.
const rich = text => escapeHTML(text)
  .replace(/\[\[(\w+)\|([^\]]+)\]\]/g, (_, key, label) => (LINKS[key] ? `<a href="${LINKS[key]}" target="_blank" rel="noopener noreferrer">${label}</a>` : label))
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/`([^`]+)`/g, '<code>$1</code>');

export function applyLocale() {
  document.documentElement.lang = lang;
  document.title = `Orbitone — ${t('ui.tagline')}`;
  for (const id of ['install-dialog', 'settings-dialog']) document.getElementById(id).lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => { el.innerHTML = rich(t(el.dataset.i18n)); });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
  document.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = t(el.dataset.i18nTitle); });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
  document.querySelectorAll('[data-i18n-alt]').forEach(el => { el.alt = t(el.dataset.i18nAlt); });
}

// Country names use the chosen language, or else the first device language even without a UI translation for it.
const nameTag = (SUPPORTED.includes(forced) && forced) || pref || tags[0] || 'en';
const nameLang = primary(nameTag) || 'en';
let regionNames = null;
try { regionNames = new Intl.DisplayNames([nameTag], { type: 'region' }); } catch { /* unsupported locale */ }

// Name follows the device language; the small English line is dropped when the device language is English.
export function countryLabel(country) {
  const english = country.en || country.name;
  let name = '';
  if (country.code) {
    try { name = regionNames?.of(country.code.toUpperCase()) || ''; } catch { /* unknown region */ }
    if (!name || name.toUpperCase() === country.code.toUpperCase()) name = nameLang === 'ko' ? country.name : english;
  } else {
    name = english;
  }
  const sub = nameLang === 'en' || name.toUpperCase() === english.toUpperCase() ? '' : english.toUpperCase();
  return { name, sub };
}
