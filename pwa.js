import { $, toast } from './lib.js?v=5';
import { t, lang } from './i18n.js?v=13';
const UPDATE_TEXT={
  en:{ready:'A new version is ready.',reload:'Reload'},
  ko:{ready:'새 버전이 준비되었어요.',reload:'새로고침'},
  ja:{ready:'新しいバージョンの準備ができました。',reload:'再読み込み'},
  zh:{ready:'新版本已就绪。',reload:'重新加载'},
  es:{ready:'Hay una nueva versión lista.',reload:'Recargar'},
  fr:{ready:'Une nouvelle version est prête.',reload:'Recharger'},
  de:{ready:'Eine neue Version ist bereit.',reload:'Neu laden'}
};
// The new service worker takes over at once, but this page keeps running the old scripts until it reloads.
function announceUpdate(){const text=UPDATE_TEXT[lang]??UPDATE_TEXT.en,box=$('update-notice'),button=document.createElement('button');button.textContent=text.reload;button.onclick=()=>location.reload();box.replaceChildren(`${text.ready} `,button);box.classList.add('visible');}
export function setupPWA(){let prompt=null;const standalone=matchMedia('(display-mode: standalone)');const update=()=>{$('install').hidden=standalone.matches||navigator.standalone===true;};update();standalone.addEventListener('change',update);window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();prompt=event;update();});window.addEventListener('appinstalled',()=>{prompt=null;$('install').hidden=true;toast(t('install.done'));});$('install').onclick=async()=>{if(!prompt){$('install-dialog').showModal();return;}const event=prompt;prompt=null;await event.prompt();const choice=await event.userChoice;if(choice.outcome==='accepted')$('install').hidden=true;};if('serviceWorker' in navigator&&(location.protocol==='https:'||['localhost','127.0.0.1'].includes(location.hostname))){const hadController=!!navigator.serviceWorker.controller;navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(registration=>{registration.update().catch(()=>{});registration.addEventListener('updatefound',()=>{const worker=registration.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'&&hadController)announceUpdate();});});document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')registration.update().catch(()=>{});});}).catch(()=>toast('Offline setup failed. You can keep using the app online.'));}}
