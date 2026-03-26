
class LottoBall extends HTMLElement {
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });

        const number = this.getAttribute('number');
        const color = this.getAttribute('color');

        const ball = document.createElement('div');
        ball.style.backgroundColor = color;
        ball.style.width = '50px';
        ball.style.height = '50px';
        ball.style.borderRadius = '50%';
        ball.style.display = 'flex';
        ball.style.justifyContent = 'center';
        ball.style.alignItems = 'center';
        ball.style.fontSize = '24px';
        ball.style.fontWeight = 'bold';
        ball.style.color = 'white';

        ball.textContent = number;

        shadow.appendChild(ball);
    }
}

customElements.define('lotto-ball', LottoBall);

const generatorBtn = document.getElementById('generator-btn');
const numbersContainer = document.getElementById('numbers');

generatorBtn.addEventListener('click', () => {
    numbersContainer.innerHTML = '';
    const numbers = new Set();
    while (numbers.size < 6) {
        const randomNumber = Math.floor(Math.random() * 45) + 1;
        numbers.add(randomNumber);
    }

    const sortedNumbers = Array.from(numbers).sort((a, b) => a - b);

    sortedNumbers.forEach(number => {
        const lottoBall = document.createElement('lotto-ball');
        lottoBall.setAttribute('number', number);
        lottoBall.setAttribute('color', getColor(number));
        numbersContainer.appendChild(lottoBall);
    });
});

function getColor(number) {
    if (number <= 10) {
        return '#fbc400'; // yellow
    } else if (number <= 20) {
        return '#69c8f2'; // blue
    } else if (number <= 30) {
        return '#ff7272'; // red
    } else if (number <= 40) {
        return '#aaa'; // gray
    } else {
        return '#b0d840'; // green
    }
}
