import constructGameBoard from './scripts/gameboard/gameboard';
import './styles/main.css';

const startGame = document.getElementById('startGame');
const menu = document.getElementById('menu');

startGame.addEventListener('click', () => {
    menu.style.visibility = 'hidden';
    constructGameBoard();
});