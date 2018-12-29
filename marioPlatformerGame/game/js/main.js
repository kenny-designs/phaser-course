// create a new scene
let gameScene = new Phaser.Scene('Game');

// some parameters for our scene
gameScene.init = function() {
  // player parameters
  this.playerSpeed = 150;
  this.jumpSpeed = -600;
};

// load asset files for our game
gameScene.preload = function() {

  // load images
  this.load.image('ground', 'assets/images/ground.png');
  this.load.image('platform', 'assets/images/platform.png');
  this.load.image('block', 'assets/images/block.png');
  this.load.image('goal', 'assets/images/gorilla3.png');
  this.load.image('barrel', 'assets/images/barrel.png');

  // load spritesheets
  this.load.spritesheet('player', 'assets/images/player_spritesheet.png', {
    frameWidth: 28,
    frameHeight: 30,
    margin: 1,
    spacing: 1
  });

  this.load.spritesheet('fire', 'assets/images/fire_spritesheet.png', {
    frameWidth: 20,
    frameHeight: 21,
    margin: 1,
    spacing: 1
  });

  // load in our level data
  this.load.json('levelData', 'assets/json/levelData.json');
};

// executed once, after assets were loaded
gameScene.create = function() {
  // check if walking animation exists, if not then create
  if (!this.anims.get('walking')) {
    // walking animation
    this.anims.create({
      key: 'walking',
      frames: this.anims.generateFrameNames('player', {
        frames: [0, 1, 2]
      }),
      frameRate: 12,
      yoyo: true,
      repeat: -1
    });
  }

  // check if burning animation exists, if not then create
  if (!this.anims.get('burning')) {
    // fire animation
    this.anims.create({
      key: 'burning',
      frames: this.anims.generateFrameNames('fire', {
        frames: [0, 1]
      }),
      frameRate: 4,
      repeat: -1
    });
  }

  // add all level elements
  this.setupLevel();

  // initiate barrel spawner
  this.setupSpawner();

  // collision detection, notice that a group makes this easy!
  this.physics.add.collider([this.player, this.goal, this.barrels], this.platforms);

  // overlap checks
  this.physics.add.overlap(this.player, [this.fires, this.goal, this.barrels], this.restartGame, null, this);

  // create cursor keys for the game
  this.cursors = this.input.keyboard.addKeys({
    'up': Phaser.Input.Keyboard.KeyCodes.W,
    'down': Phaser.Input.Keyboard.KeyCodes.S,
    'left': Phaser.Input.Keyboard.KeyCodes.A,
    'right': Phaser.Input.Keyboard.KeyCodes.D,
    'space': Phaser.Input.Keyboard.KeyCodes.SPACE
  });

  // print coordinates upon mouse click
  this.input.on('pointerdown', function(pointer) {
    console.log(pointer.position);
  });
};

// executed on every frame
gameScene.update = function() {
  // are we on the ground?
  let onGround = this.player.body.blocked.down || // colliding with tile or world boundary
                 this.player.body.touching.down;  // colliding with another body

  // move to the left
  if (this.cursors.left.isDown) {
    this.player.body.setVelocityX(-this.playerSpeed);

    this.player.flipX = false;

    // play animation if none is playing
    if (onGround && !this.player.anims.isPlaying) {
      this.player.anims.play('walking');
    }
  }
  // move to the right
  else if (this.cursors.right.isDown) {
    this.player.body.setVelocityX(this.playerSpeed);

    this.player.flipX = true;

    // play animation if none is playing
    if (onGround && !this.player.anims.isPlaying) {
      this.player.anims.play('walking');
    }
  }
  // default to no movement
  else {
    // make the player stop
    this.player.body.setVelocityX(0);

    // stop the walking animation
    this.player.anims.stop('walking');

    // set default frame
    if (onGround) {
      this.player.setFrame(3);
    }
  }

  // handle jumping
  if (onGround && (this.cursors.space.isDown || this.cursors.up.isDown)) {
    // give the player a velocity in Y
    this.player.body.setVelocityY(this.jumpSpeed);
   
    // stop the walking animation
    this.player.anims.stop('walking');
   
    // change frame
    this.player.setFrame(2);
  }
};

// sets up all the elements in the level
gameScene.setupLevel = function() {
  // load json data
  // aside from textures, data we load in is available within cache
  this.levelData = this.cache.json.get('levelData');

  // world bounds
  this.physics.world.bounds.width = this.levelData.world.width;
  this.physics.world.bounds.height = this.levelData.world.height;

  // create all the platforms
  // we could use a regular group but staticGroup is more efficient due to
  // an underlying tree structure. Also, it has the same API as regular groups
  this.platforms = this.physics.add.staticGroup();
  for (let i = 0; i < this.levelData.platforms.length; i++) {
    let curr = this.levelData.platforms[i];

    let newObj;

    // create object
    if (curr.numTiles === 1) {
      // create sprite
      newObj = this.add.sprite(curr.x, curr.y, curr.key).setOrigin(0);
    }
    else {
      // create tilesprite
      let width = this.textures.get(curr.key).get(0).width,   // get first frame
          height = this.textures.get(curr.key).get(0).height;
      newObj = this.add.tileSprite(curr.x, curr.y, curr.numTiles * width, height, curr.key).setOrigin(0);
    }

    // enable physics
    this.physics.add.existing(newObj, true);

    // add to the group
    this.platforms.add(newObj);
  }

  // create all fires
  // before, we used this.add.group() but we can have a dynamic physics group
  // by going this.physics.add.group()
  this.fires = this.physics.add.group({
    allowGravity: false,
    immovable: true
  });
  for (let i = 0; i < this.levelData.fires.length; i++) {
    let curr = this.levelData.fires[i];

    // create sprite
    let newObj = this.add.sprite(curr.x, curr.y, 'fire').setOrigin(0);

    // play burning animation
    newObj.anims.play('burning');

    // add to the group
    this.fires.add(newObj);

    newObj.setInteractive();
    this.input.setDraggable(newObj);
  }

  this.input.on('drag', function(pointer, gameObject, dragX, dragY) {
    gameObject.x = dragX;
    gameObject.y = dragY;

    console.log(dragX, dragY);
  });

  // player
  this.player = this.add.sprite(this.levelData.player.x, this.levelData.player.y, 'player', 3);
  this.physics.add.existing(this.player);

  // constrain player to the game bounds
  // we can manually set what the bounds are or it'll be the natural width + height
  // of our scene
  this.player.body.setCollideWorldBounds(true);

  // camera bounds
  this.cameras.main.setBounds(0, 0, this.levelData.world.width, this.levelData.world.height);
  this.cameras.main.startFollow(this.player); // make camera follow player

  // goal
  this.goal = this.add.sprite(this.levelData.goal.x, this.levelData.goal.y, 'goal');
  this.physics.add.existing(this.goal);
};

// restart game (game over + you won!)
gameScene.restartGame = function(sourceSprite, targetSprite) {
  // fade out
  this.cameras.main.fade(500);
  
  // when fade out completes, restart scene
  this.cameras.main.on('camerafadeoutcomplete', function(camera, effect) {
    // restart the scene
    this.scene.restart();
  }, this);
};

// generation of barrels
gameScene.setupSpawner = function() {
  // barrel group
  this.barrels = this.physics.add.group({
    bounceY: 0.1,
    bounceX: 1,
    collideWorldBounds: true
  });

  // spawn barrels
  let spawningEvent = this.time.addEvent({
    delay: this.levelData.spawner.interval,
    loop: true,
    callbackScope: this,
    callback: function() {
      // create a barrel via object pooling
      // get() looks for a deactivated object and reuses it
      // if there is nothing to reuse, it'll create a fresh object
      let barrel = this.barrels.get(this.goal.x, this.goal.y, 'barrel');

      // reactivate
      barrel.setActive(true);
      barrel.setVisible(true);
      barrel.body.enable = true;
      
      // set properties
      barrel.setVelocityX(this.levelData.spawner.speed);
      
      // lifespan
      this.time.addEvent({
        delay: this.levelData.spawner.lifespan,
        repeat: 0,
        callbackScope: this,
        callback: function() {
          // instead of barrel.destroy(), we do this so we can make use of the
          // object pooling functionality that comes with our barrels group
          this.barrels.killAndHide(barrel);
          // we also have to do this or else the physics body will remain
          barrel.body.enable = false;
        }
      });
    }
  });
};

// our game's configuration
let config = {
  type: Phaser.AUTO,
  width: 360,
  height: 640,
  scene: gameScene,
  title: 'Monster Kong',
  pixelArt: false,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: {
        y: 1000
      },
      debug: true // allows us to see green arrow and pink border
    }
  }
};

// create the game, and pass it the configuration
let game = new Phaser.Game(config);
