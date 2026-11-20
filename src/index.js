import constructGameBoard from './scripts/gameboard/gameboard';
import { getShipyard } from './scripts/shipyard/shipyard';
import { getProfile, onProfileChange } from './scripts/shipyard/profile';
import './styles/main.css';

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

renderMenuCredits();
onProfileChange(renderMenuCredits);

startGame.addEventListener('click', () => {
    menu.style.visibility = 'hidden';
    constructGameBoard();
});

openShipyard.addEventListener('click', () => {
    menu.style.visibility = 'hidden';
    getShipyard().open({
        closeLabel: 'Done',
        onClose: () => { menu.style.visibility = 'visible'; }
    });
});
