// URL to explain PHASER scene: https://rexrainbow.github.io/phaser3-rex-notes/docs/site/scene/

export default class Game extends Phaser.Scene {
  constructor() {
    super("main");
  }

  init() {
    this.gameOver = false;
    this.timer = 30;
    this.score = 0;
    this.shapes = {
      triangulo: { points: 10, count: 0 },
      cuadrado: { points: 20, count: 0 },
      diamante: { points: 30, count: 0 },
      bomb: { points: -10, count: 0 },
    };
  }

  preload() {
    // Cargar imágenes
    this.load.image("cielo", "./assets/Cielo.webp");
    this.load.image("cuadrado", "./assets/square.png");
    this.load.image("diamante", "./assets/diamond.png");
    this.load.image("triangulo", "./assets/triangle.png");
    this.load.image("plataforma", "./assets/platform.png");
    this.load.image("personaje", "./assets/Ninja.png");
    this.load.image("bomb", "./assets/bomb.png");
  }

  create() {
    this.cielo = this.add.image(400, 300, "cielo");
    this.cielo.setScale(2);
    this.plataformas = this.physics.add.staticGroup();
    this.plataformas.create(400, 568, "plataforma").setScale(2).refreshBody();
    this.plataformas.create(200, 400, "plataforma");
    this.personaje = this.physics.add.sprite(400, 300, "personaje");
    this.personaje.setScale(0.1);
    this.personaje.setCollideWorldBounds(true);

    // Colisión personaje-plataforma
    this.physics.add.collider(this.personaje, this.plataformas);

    // Teclas
    this.cursor = this.input.keyboard.createCursorKeys();
    this.r = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    // Crear recolectables
    this.recolectables = this.physics.add.group();

    // Colisiones
    this.physics.add.collider(this.recolectables, this.plataformas, this.onRecolectableBounced, null, this);
    this.physics.add.collider(this.personaje, this.recolectables, this.onShapeCollect, null, this);
    this.physics.add.overlap(this.recolectables, this.plataformas, this.floor, null, this);

    // Timer
    this.time.addEvent({
      delay: 1000,
      callback: this.HandlerTimer,
      callbackScope: this,
      loop: true,
    });

    // Texto del timer
    this.timerText = this.add.text(10, 10, `tiempo restante: ${this.timer}`, {
      fontSize: "32px",
      fill: "#fff",
    });

    // Texto del score
    this.scoreText = this.add.text(10, 50, `puntaje: ${this.score} T: ${this.shapes["triangulo"].count} C: ${this.shapes["cuadrado"].count} D: ${this.shapes["diamante"].count}`, {
      fontSize: "32px",
      fill: "#fff",
    });

    // Evento cada segundo
    this.time.addEvent({
      delay: 1000,
      callback: this.onSecond,
      callbackScope: this,
      loop: true,
    });
  }

  update() {
    if (this.gameOver && this.r.isDown) {
      this.scene.restart();
    }
    if (this.gameOver) {
      this.physics.pause();
      this.timerText.setText("Game Over");
      return;
    }

    // Movimiento del personaje
    if (this.cursor.left.isDown) {
      this.personaje.setVelocityX(-160);
    } else if (this.cursor.right.isDown) {
      this.personaje.setVelocityX(160);
    } else {
      this.personaje.setVelocityX(0);
    }

    if (this.cursor.up.isDown && this.personaje.body.touching.down) {
      this.personaje.setVelocityY(-330);
    }
  }

  onShapeCollect(personaje, recolectable) {
    const nombreFig = recolectable.texture.key;
    const puntosFig = this.shapes[nombreFig].points;
    this.score += puntosFig;
    this.shapes[nombreFig].count += 1;
    console.table(this.shapes);
    console.log("score", this.score);
    recolectable.destroy();

    this.scoreText.setText(`puntaje: ${this.score} T: ${this.shapes["triangulo"].count} C: ${this.shapes["cuadrado"].count} D: ${this.shapes["diamante"].count}`);

    this.checkWin();
  }

  checkWin() {
    const cumplePuntos = this.score >= 100;
    const cumpleFiguras = this.shapes["triangulo"].count >= 2 && this.shapes["cuadrado"].count >= 2 && this.shapes["diamante"].count >= 2;

    if (cumplePuntos && cumpleFiguras) {
      console.log("Ganaste");
      this.scene.start("end", {
        score: this.score,
        gameOver: this.gameOver,
      });
    }
  }

  floor(recolectables, _plataformas) {
    recolectables.destroy(true, true);
  }

  HandlerTimer() {
    this.timer -= 1;
    this.timerText.setText(`tiempo restante: ${this.timer}`);
    if (this.timer === 0) {
      this.gameOver = true;
      this.scene.start("end", {
        score: this.score,
        gameOver: this.gameOver,
      });
    }
  }

  onSecond() {
    if (this.gameOver) {
      return;
    }
    // Crear recolectable
    const tipos = ["triangulo", "cuadrado", "diamante", "bomb"];
    const tipo = Phaser.Math.RND.pick(tipos);
    let recolectable = this.recolectables.create(Phaser.Math.Between(10, 790), 0, tipo);
    recolectable.setVelocity(0, 100);

    // Asignar rebote: busca un número entre 0.4 y 0.8
    const rebote = Phaser.Math.FloatBetween(0.4, 0.8);
    recolectable.setBounce(rebote);

    // Set data
    recolectable.setData("points", this.shapes[tipo].points);
    recolectable.setData("tipo", tipo);
  }
  onRecolectableBounced(recolectable, plataforma) {
    console.log("recolectable rebote");
    let points = recolectable.getData("points");
    points -= 1;  // Descuenta 1 punto por cada rebote
    recolectable.setData("points", points);
    if (points <= 0) {
      recolectable.destroy();
    }
  }
}