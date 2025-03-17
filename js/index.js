class Elemento {
    static novoElemento(tagName, className) {
        const elemento = document.createElement(tagName);
        elemento.className = className;
        return elemento;
    }
}

class Barreira {
    constructor(reversa = false) {
        this.elemento = Elemento.novoElemento('div', 'barrier');
        
        const border = Elemento.novoElemento('div', 'barrier-border');
        const barrierBody = Elemento.novoElemento('div', 'barrier-body');
        
        this.elemento.appendChild(reversa ? barrierBody : border);
        this.elemento.appendChild(reversa ? border : barrierBody);
        
        this.setAltura = altura => barrierBody.style.height = `${altura}px`;
    }
}

class ParDeBarreiras {
    constructor(altura, abertura, x) {
        this.elemento = Elemento.novoElemento('div', 'barrier-pair');
        this.superior = new Barreira(true);
        this.inferior = new Barreira(false);
        
        this.elemento.appendChild(this.superior.elemento);
        this.elemento.appendChild(this.inferior.elemento);
        
        this.sortearAbertura = () => {
            const alturaSuperior = Math.random() * (altura - abertura);
            const alturaInferior = altura - abertura - alturaSuperior;
            
            this.superior.setAltura(alturaSuperior);
            this.inferior.setAltura(alturaInferior);
        };
        
        this.getX = () => parseInt(this.elemento.style.left.split('px')[0]);
        this.setX = x => this.elemento.style.left = `${x}px`;
        this.getLargura = () => this.elemento.clientWidth;
        
        this.sortearAbertura();
        this.setX(x);
    }
}

class Barreiras {
    constructor(altura, largura, abertura, espaco, notificarPonto) {
        this.pares = [
            new ParDeBarreiras(altura, abertura, largura),
            new ParDeBarreiras(altura, abertura, largura + espaco),
            new ParDeBarreiras(altura, abertura, largura + espaco * 2),
            new ParDeBarreiras(altura, abertura, largura + espaco * 3)
        ];
        this.deslocamento = 3;
        
        this.animar = () => {
            this.pares.forEach(par => {
                par.setX(par.getX() - this.deslocamento);
                
                if (par.getX() < -par.getLargura()) {
                    par.setX(par.getX() + espaco * this.pares.length);
                    par.sortearAbertura();
                }
                
                const meio = largura / 2;
                const cruzouOMeio = par.getX() + this.deslocamento >= meio && par.getX() < meio;
                if (cruzouOMeio) notificarPonto();
            });
        };
    }
}

class Passaro {
    constructor(alturaDoJogo) {
        this.voando = false;
        this.elemento = Elemento.novoElemento('img', 'bird');
        this.elemento.src = "images/passaro.png";
        
        this.getY = () => parseInt(this.elemento.style.bottom.split('px')[0]);
        this.setY = y => this.elemento.style.bottom = `${y}px`;
        
        window.onkeydown = () => this.voando = true;
        window.onkeyup = () => this.voando = false;
        
        this.animar = () => {
            const novoY = this.getY() + (this.voando ? 8 : -5);
            const alturaMaxima = alturaDoJogo - this.elemento.clientHeight;
            
            if (novoY <= 0) this.setY(0);
            else if (novoY >= alturaMaxima) this.setY(alturaMaxima);
            else this.setY(novoY);
        };
        
        this.setY(alturaDoJogo / 2);
    }
}

class Progresso {
    constructor() {
        this.elemento = Elemento.novoElemento('span', 'progress');
        this.atualizarPontos(0);
    }
    
    atualizarPontos(pontos) {
        this.elemento.innerHTML = pontos;
    }
}

function estaoSobrepostos(elementoA, elementoB) {
    const a = elementoA.getBoundingClientRect();
    const b = elementoB.getBoundingClientRect();
    
    const horizontal = a.left + a.width >= b.left && b.left + b.width >= a.left;
    const vertical = a.top + a.height >= b.top && b.top + b.height >= a.top;
    
    return horizontal && vertical;
}

function colidiu(passaro, barreiras) {
    return barreiras.pares.some(parDeBarreiras => {
        const superior = parDeBarreiras.superior.elemento;
        const inferior = parDeBarreiras.inferior.elemento;
        
        return estaoSobrepostos(passaro.elemento, superior) || estaoSobrepostos(passaro.elemento, inferior);
    });
}

function FlappyBird() {
    let pontos = 0;
    let temporizador;

    const areaDoJogo = document.querySelector('[tp-flappy]');
    const altura = areaDoJogo.clientHeight;
    const largura = areaDoJogo.clientWidth;

    const progresso = new Progresso();
    const barreiras = new Barreiras(altura, largura, 200, 400, 
        () => progresso.atualizarPontos(++pontos));

    const passaro = new Passaro(altura);

    areaDoJogo.appendChild(progresso.elemento);
    areaDoJogo.appendChild(passaro.elemento);

    barreiras.pares.forEach(par => areaDoJogo.appendChild(par.elemento));

    const overlay = document.getElementById('overlay'); // A sobreposição para o game over

    // Função para reiniciar o jogo
    const reiniciarJogo = () => {
        pontos = 0;
        progresso.atualizarPontos(pontos);
        passaro.setY(altura / 2);

        // Resetar as barreiras
        barreiras.pares.forEach((par, index) => {
            // Reiniciar posição das barreiras de acordo com o índice (espaco entre as barreiras)
            par.setX(largura + 400 * index); // Ajuste o va lor de 300 conforme necessário
            par.sortearAbertura(); // Sorteia novas aberturas para as barreiras
        });

        // Remover a sobreposição de reinício
        overlay.style.display = 'none';

        // Reiniciar o temporizador
        temporizador = setInterval(() => {
            barreiras.animar();
            passaro.animar();

            if (colidiu(passaro, barreiras)) {
                clearInterval(temporizador);
                mostrarGameOver(); // Chama a função para mostrar a tela de Game Over
            }
        }, 20);
    };

    // Função que exibe o game over e mostra a pontuação
    const mostrarGameOver = () => {
        const scoreElement = document.getElementById('score'); // Obtém o elemento da pontuação no overlay
        if (scoreElement) {
            scoreElement.textContent = `${pontos}`; // Atualiza o texto com a pontuação
        }
        overlay.style.display = 'flex'; // Exibe a sobreposição
    };

    // Função de clique na sobreposição para reiniciar
    overlay.onclick = () => {
        reiniciarJogo(); // Reinicia o jogo ao clicar no overlay
    };

    // Iniciar o jogo
    this.start = () => {
        reiniciarJogo(); // Chama a função de reiniciar logo no início
    };
}

new FlappyBird().start();
