console.log('¡JavaScript está funcionando, Hola mundo!')
let numero1 = 12
let numero2 = 25

let suma = numero1 + numero2

console.log('JavaScript cargado ✅');

const spinButton = document.getElementById('spin-button');
const wheelImage = document.getElementById('wheel-image');

let rotation = 0;

function spinWheel() {
    const randomSpin = Math.floor(Math.random() * 720) + 720;
    rotation += randomSpin;
    
    wheelImage.style.transform = `rotate(${rotation}deg)`;
    wheelImage.style.transition = 'transform 3s ease-out';
    
    console.log(`Girando ${randomSpin} grados`);
}

spinButton.addEventListener('click', spinWheel);