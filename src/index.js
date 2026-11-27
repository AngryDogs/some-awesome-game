import constructGameBoard from './scripts/gameboard/gameboard';
import { start3D, can3D } from './scripts/game3d/game3d';
import { getShipyard } from './scripts/shipyard/shipyard';
import { getProfile, onProfileChange, isDebug, setDebug } from './scripts/shipyard/profile';
import './styles/main.css';
import { isTouchDevice } from './scripts/ui/touch';

if(isTouchDevice()) document.body.classList.add('touch');

const startGame = document.getElementById('startGame');
const openShipyard = document.getElementById('openShipyard');
const menu = document.getElementById('menu');
const menuCredits = document.getElementById('menuCredits');

const renderMenuCredits = () => {
    const profile = getProfile();
    const cargo = Object.keys(profile.cargo).reduce((sum, id) => sum + profile.cargo[id], 0);
    menuCredits.textContent = 'Credits: ' + Math.round(profile.credits).toLocaleString('en-US') +
        (cargo ? ' · Ore in hold: ' + cargo : '');
};

const debugToggle = document.getElementById('debugToggle');
const renderDebug = () => {
    debugToggle.textContent = isDebug() ? 'Debug mode: ON (everything unlocked and free)' : 'Debug mode: OFF';
    debugToggle.classList.toggle('on', isDebug());
};
debugToggle.addEventListener('click', () => setDebug(!isDebug()));

// Debug mode can also be switched on from the address bar: index.html?debug
if(/[?&]debug\b/.test(window.location.search) && !isDebug()) setDebug(true);

renderMenuCredits();
renderDebug();
onProfileChange(() => {
    renderMenuCredits();
    renderDebug();
});

// On phones, go full screen in landscape when launching so the browser bars don't eat
// the view. Both calls may be refused (iOS Safari has no fullscreen API); that's fine.
const goFullscreen = () => {
    if(!isTouchDevice()) return;
    const root = document.documentElement;
    const request = root.requestFullscreen || root.webkitRequestFullscreen;
    if(!request || document.fullscreenElement || document.webkitFullscreenElement) return;
    try {
        const result = request.call(root, { navigationUI: 'hide' });
        if(result && result.then) {
            result.then(() => {
                if(screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {});
            }).catch(() => {});
        }
    } catch(e) { /* not allowed */ }
};

// The full 3D game on computers with WebGL; phones (touch controls) and browsers without
// WebGL get the classic 2D game, which is always available from the menu too.
const use3D = () => can3D() && !isTouchDevice();

startGame.addEventListener('click', () => {
    goFullscreen();
    menu.style.visibility = 'hidden';
    if(use3D()) start3D();
    else constructGameBoard();
});

document.getElementById('classicGame').addEventListener('click', () => {
    goFullscreen();
    menu.style.visibility = 'hidden';
    constructGameBoard();
});
if(!use3D()) document.getElementById('classicGame').style.display = 'none';

openShipyard.addEventListener('click', () => {
    menu.style.visibility = 'hidden';
    getShipyard().open({
        closeLabel: 'Done',
        onClose: () => { menu.style.visibility = 'visible'; }
    });
});
