let currentHero = 'brish';

function switchHero(hero, btn) {
  if (!window._gameWaitingToStart && !window._gameOver) return;
  currentHero = hero;
  document.querySelectorAll('.hero-switch button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if (window._restartGame) window._restartGame();
}

window.addEventListener('load', () => {
  const canvas = document.getElementById('canvas1');
  const ctx = canvas.getContext('2d');
  canvas.width = 800;
  canvas.height = 720;
  let enemies = [];
  let score = 0;
  let gameOver = false;
  let waitingToStart = true;

  window._gameOver = gameOver;
  window._gameWaitingToStart = waitingToStart;

  class InputHandler {
    constructor() {
      this.keys = new Set();
      this.touchY = '';
      this.touchX = '';
      this.touchThresholdY = 30;
      this.touchThresholdX = 15;

      window.addEventListener('keydown', (e) => {
        if (['ArrowDown','ArrowUp','ArrowLeft','ArrowRight'].includes(e.key)) {
          this.keys.add(e.key);
        } else if (e.key === 'Enter' && gameOver) restartGame();
        else if (e.key === ' ') this.keys.add('ArrowUp');
      });
      window.addEventListener('keyup', (e) => {
        ['ArrowDown','ArrowUp','ArrowLeft','ArrowRight'].forEach(k => {
          if (e.key === k) this.keys.delete(k);
        });
        if (e.key === ' ') this.keys.delete('ArrowUp');
      });
      window.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.touchY = e.changedTouches[0].pageY;
        this.touchX = e.changedTouches[0].pageX;
        // Tap = jump
        if (!gameOver && !waitingToStart) {
          this.keys.add('ArrowUp');
          setTimeout(() => this.keys.delete('ArrowUp'), 150);
        }
        if (waitingToStart) {
          waitingToStart = false;
          window._gameWaitingToStart = false;
        }
        if (gameOver) restartGame();
      }, { passive: false });
      window.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const swipeDistanceY = e.changedTouches[0].pageY - this.touchY;
        const swipeDistanceX = e.changedTouches[0].pageX - this.touchX;
        if (swipeDistanceX < -this.touchThresholdX) this.keys.add('swipe left');
        else if (swipeDistanceX > this.touchThresholdX) this.keys.add('swipe right');
        if (swipeDistanceY < -this.touchThresholdY) this.keys.add('swipe up');
        else if (swipeDistanceY > this.touchThresholdY) {
          this.keys.add('swipe down');
          if (gameOver) restartGame();
        }
      }, { passive: false });
      window.addEventListener('touchend', () => {
        this.keys.delete('swipe up');
        this.keys.delete('swipe down');
        this.keys.delete('swipe left');
        this.keys.delete('swipe right');
      });
    }
  }

  class Player {
    constructor(gameWidth, gameHeight) {
      this.gameWidth = gameWidth;
      this.gameHeight = gameHeight;
      this.image = document.getElementById('playerImage');
      this.image2 = document.getElementById('playerImage2');
      this.width = 200;
      this.height = 200;
      this.x = 20;
      this.y = gameHeight - this.height;
      this.frameX = 0;
      this.frameY = 0;
      this.maxFrame = 8;
      this.fps = 20;
      this.frameTimer = 0;
      this.frameInterval = 1000 / this.fps;
      this.speed = 0;
      this.vy = 0;
      this.weight = 1;
    }
    restart() {
      this.x = 20;
      this.y = this.gameHeight - this.height;
      this.maxFrame = 8;
      this.frameY = 0;
    }
    getImage() {
      return currentHero === 'monko' ? this.image2 : this.image;
    }
    draw(context) {
      context.drawImage(
        this.getImage(),
        this.frameX * this.width, this.frameY * this.height,
        this.width, this.height,
        this.x, this.y,
        this.width, this.height
      );
    }
    update(input, deltaTime, enemies) {
      enemies.forEach((enemy) => {
        const dx = enemy.x + enemy.width / 2 - (this.x + this.width / 2);
        const dy = enemy.y + enemy.height / 2 - (this.y + this.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy) + 20;
        if (distance < enemy.width / 2 + this.width / 2) {
          gameOver = true;
          window._gameOver = true;
        }
      });

      if (this.frameTimer > this.frameInterval) {
        if (this.frameX >= this.maxFrame) this.frameX = 0;
        else this.frameX++;
        this.frameTimer = 0;
      } else this.frameTimer += deltaTime;

      if (input.keys.has('ArrowRight') || input.keys.has('swipe right'))
        this.speed = 5;
      else if (input.keys.has('ArrowLeft') || input.keys.has('swipe left'))
        this.speed = -5;
      else if ((input.keys.has('ArrowUp') || input.keys.has('swipe up')) && this.onGround())
        this.vy -= 32;
      else this.speed = 0;

      this.x += this.speed;
      if (this.x < 0) this.x = 0;
      else if (this.x > this.gameWidth - this.width) this.x = this.gameWidth - this.width;

      this.y += this.vy;
      if (!this.onGround()) {
        this.vy += this.weight;
        this.frameY = 1;
        this.maxFrame = 5;
      } else {
        this.vy = 0;
        this.frameY = 0;
        this.maxFrame = 8;
      }
      if (this.y > this.gameHeight - this.height)
        this.y = this.gameHeight - this.height;
    }
    onGround() {
      return this.y >= this.gameHeight - this.height;
    }
  }

  class Background {
    constructor() {
      this.image = document.getElementById('backgroundImage');
      this.x = 0;
      this.y = 0;
      this.width = 2400;
      this.height = 720;
      this.speed = 1;
    }
    draw(context) {
      context.drawImage(this.image, this.x, this.y, this.width, this.height);
      context.drawImage(this.image, this.x + this.width - this.speed, this.y, this.width, this.height);
    }
    update() {
      this.x -= this.speed;
      if (this.x < -this.width) this.x = 0;
    }
    restart() { this.x = 0; }
  }

  class Enemy {
    constructor(gameWidth, gameHeight) {
      this.gameWidth = gameWidth;
      this.gameHeight = gameHeight;
      this.image = document.getElementById('enemyImage');
      this.width = 160;
      this.height = 119;
      this.x = this.gameWidth;
      this.y = this.gameHeight - this.height;
      this.frameX = 0;
      this.maxFrameX = 5;
      this.fps = 20;
      this.frameTimer = 0;
      this.frameInterval = 1000 / this.fps;
      this.speed = 8;
      this.toBeDeleted = false;
    }
    draw(context) {
      context.drawImage(
        this.image,
        this.frameX * this.width, 0,
        this.width, this.height,
        this.x, this.y,
        this.width, this.height
      );
    }
    update(deltaTime) {
      if (this.frameTimer > this.frameInterval) {
        if (this.frameX >= this.maxFrameX) this.frameX = 0;
        else this.frameX++;
        this.frameTimer = 0;
      } else this.frameTimer += deltaTime;
      this.x -= this.speed;
      if (this.x < -this.width) {
        this.toBeDeleted = true;
        score++;
      }
    }
  }

  function handleEnemies(deltaTime) {
    if (enemyTimer > enemyInterval + randomEnemyInterval) {
      enemies.push(new Enemy(canvas.width, canvas.height));
      randomEnemyInterval = Math.random() * 1000 + 500;
      enemyTimer = 0;
    } else {
      enemyTimer += deltaTime;
    }
    enemies.forEach((enemy) => {
      enemy.draw(ctx);
      enemy.update(deltaTime);
    });
    enemies = enemies.filter((enemy) => !enemy.toBeDeleted);
  }

  function displayStatusText(context) {
    context.textAlign = 'left';
    context.fillStyle = 'white';
    context.font = "bold 40px 'Fredoka', sans-serif";
    context.fillText(`Score: ${score}`, 20, 50);

    const heroName = currentHero === 'brish' ? 'Brish' : 'Monko';
    context.font = "600 24px 'Fredoka', sans-serif";
    context.fillStyle = 'rgba(255,255,255,0.7)';
    context.fillText(heroName, 20, 82);

    if (gameOver) {
      context.textAlign = 'center';
      context.fillStyle = 'rgba(0,0,0,0.5)';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = 'white';
      context.font = "bold 60px 'Fredoka', sans-serif";
      context.fillText('GAME OVER!', canvas.width / 2, canvas.height / 2 - 30);
      context.font = "600 28px 'Fredoka', sans-serif";
      context.fillStyle = 'rgba(255,255,255,0.8)';
      context.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 15);
      context.font = "400 22px 'Fredoka', sans-serif";
      context.fillText('Tap or press Enter to restart', canvas.width / 2, canvas.height / 2 + 55);
    }

    if (waitingToStart) {
      context.textAlign = 'center';
      context.fillStyle = 'rgba(0,0,0,0.4)';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = 'white';
      context.font = "bold 50px 'Fredoka', sans-serif";
      context.fillText('Smash & Bloom', canvas.width / 2, canvas.height / 2 - 60);
      context.font = "600 30px 'Fredoka', sans-serif";
      context.fillText(`Playing as ${heroName}`, canvas.width / 2, canvas.height / 2 - 10);
      context.font = "400 24px 'Fredoka', sans-serif";
      context.fillStyle = 'rgba(255,255,255,0.8)';
      context.fillText('Tap to jump • Swipe to move', canvas.width / 2, canvas.height / 2 + 35);
      context.fillText('Tap anywhere to start', canvas.width / 2, canvas.height / 2 + 75);
    }
  }

  function restartGame() {
    player.restart();
    background.restart();
    enemies = [];
    score = 0;
    gameOver = false;
    waitingToStart = false;
    window._gameOver = false;
    window._gameWaitingToStart = false;
    animate(0);
  }
  window._restartGame = restartGame;

  const input = new InputHandler();
  const player = new Player(canvas.width, canvas.height);
  const background = new Background(canvas.width, canvas.height);

  let lastTime = 0;
  let enemyTimer = 0;
  let enemyInterval = 1000;
  let randomEnemyInterval = Math.random() * 1000 + 500;

  function animate(timeStamp) {
    const deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    background.draw(ctx);
    if (!waitingToStart) background.update();
    player.draw(ctx);
    if (!gameOver && !waitingToStart) {
      player.update(input, deltaTime, enemies);
      handleEnemies(deltaTime);
    }
    displayStatusText(ctx);
    if (!gameOver) requestAnimationFrame(animate);
  }

  animate(0);
});
