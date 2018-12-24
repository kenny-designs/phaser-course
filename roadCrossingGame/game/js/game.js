// create a new scene
let gameScene = new Phaser.Scene('Game');

// initiate scene parameters
gameScene.init = function() {
  // player speed
  this.playerSpeed = 3;

  // enemy speed
  this.enemyMinSpeed = 2;
  this.enemyMaxSpeed = 4.5;

  // boundaries
  this.enemyMinY = 80;
  this.enemyMaxY = 280;

  // game is not over yet, do not terminate
  this.isTerminating = false;

  // current level player is on
  this.score = 1;
};

// load assets
gameScene.preload = function() {
  // load images
  this.load.image('background', 'assets/background.png');
  this.load.image('player', 'assets/player.png');
  this.load.image('enemy', 'assets/dragon.png');
  this.load.image('goal', 'assets/treasure.png');
};

// called once after the preload ends
gameScene.create = function() {
  // create bg sprite
  let bg = this.add.sprite(0, 0, 'background');

  // set the origin
  bg.setOrigin(0, 0);

  // score text
  this.scoreText = this.add.text(5, 5, `Level: ${this.score}`, {
    fontFamily: 'Arial',
    fontSize: 32
  });

  // create the player
  this.player = this.add.sprite( 50, 
                                 this.sys.game.config.height / 2,
                                 'player');

  // reduce width and double height of player
  this.player.setScale(0.5);

  // goal
  this.goal = this.add.sprite(this.sys.game.config.width - 80,
                              this.sys.game.config.height / 2,
                              'goal');
  this.goal.setScale(0.6);

  // enemy group
  this.enemies = this.add.group({
    key: 'enemy',
    repeat: 5,
    setXY: {
      x: 90,
      y: 100,
      stepX: 80,
      stepY: 20
    }
  });

  // setting scale to all of the enemy group
  Phaser.Actions.ScaleXY(this.enemies.getChildren(), -0.8);

  // set flipX and speed
  Phaser.Actions.Call(this.enemies.getChildren(), function(enemy) {
    // set flipX of each enemy
    enemy.flipX = true;

    // set the speed
    this.randEnemySpeed(enemy);
  }, this);
};

// invoked 60 times per second
gameScene.update = function() {
  // don't execute if we are terminating
  if (this.isTerminating) {
    return;
  }

  // check for active input
  if (this.input.activePointer.isDown) {
    // player walks
    this.player.x += this.playerSpeed;
  }

  // check for treasure overlap
  let playerRect = this.player.getBounds(),
      goalRect   = this.goal.getBounds();

  if (Phaser.Geom.Intersects.RectangleToRectangle(playerRect, goalRect)) {
    console.log('Success! You got the treasure!');

    // end game
    return this.levelWin();
  }

  // get enemies
  let enemies = this.enemies.getChildren(),
      numEnemies = enemies.length;


  for (let i = 0; i < numEnemies; i++) {
    // adjust enemy movement
    enemies[i].y += enemies[i].speed;

    // check if we should change direction
    let conditionUp   = enemies[i].speed < 0 && enemies[i].y <= this.enemyMinY,
        conditionDown = enemies[i].speed > 0 && enemies[i].y >= this.enemyMaxY;

    // change direction if upper or lower limit passed
    if (conditionUp || conditionDown) {
      enemies[i].speed *= -1;
    }

    // check for enemy overlap
    let enemyRect = enemies[i].getBounds();

    if (Phaser.Geom.Intersects.RectangleToRectangle(playerRect, enemyRect)) {
      console.log('Oof! You died!');

      // end game
      return this.gameOver();
    }
  }
};

gameScene.gameOver = function() {
  // initiated game over sequence
  this.isTerminating = true;

  // shake camera
  this.cameras.main.shake(500);

  // listen for shake completion
  this.cameras.main.on('camerashakecomplete', function(camera, effect) {
    // fade out
    this.cameras.main.fade(500);
  }, this);

  this.cameras.main.on('camerafadeoutcomplete', function(camera, effect) {
    // restart the scene
    this.scene.restart();
  }, this);
};

/**
 * Level won, advance to slightly harder version
 */ 
gameScene.levelWin = function() {
  // update the score
  this.scoreText.text = `Level: ${++this.score}`;

  // set new speed and make them smaller
  this.enemyMaxSpeed -= 0.5;
  Phaser.Actions.Call(this.enemies.getChildren(), this.randEnemySpeed, this);
  Phaser.Actions.ScaleXY(this.enemies.getChildren(), 0.1);

  // reset player position
  this.player.x = 10;
};

/**
 * Randomize the speed and direction of all dragons when invoked
 */
gameScene.randEnemySpeed = function(enemy) {
  // set speed
  let dir = Math.random() < 0.5 ? 1 : -1;
  let speed = Math.random() * (this.enemyMaxSpeed - this.enemyMinSpeed) + this.enemyMinSpeed;
  enemy.speed = dir * speed;
};

// set the configuration of the game
let config = {
  type: Phaser.AUTO,  // WebGL if available, defaults to canvas
  width: 640,
  height: 360,
  scene: gameScene
};

// create a new game, pass the configuration
let game = new Phaser.Game(config);
