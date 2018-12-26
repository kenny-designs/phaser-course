// create a new scene
let gameScene = new Phaser.Scene('Game');

// some parameters for our scene
gameScene.init = function() {
  // game stats
  this.stats = {
    health: 100,
    fun: 100
  };

  // decay parameters
  this.decayRates = {
    health: -5,
    fun: -2
  };
};

// executed once, after assets were loaded
gameScene.create = function() {
  // game background
  let bg = this.add.sprite(0, 0, 'backyard').setInteractive();
  bg.setOrigin(0, 0);

  // event listener for the background
  bg.on('pointerdown', this.placeItem, this);

  this.pet = this.add.sprite(100, 200, 'pet', 0).setInteractive();
  this.pet.setDepth(1);

  // make pet draggable
  this.input.setDraggable(this.pet);

  // follow pointer when dragging
  this.input.on('drag', function(pointer, gameObject, dragX, dragY) {
    // make sprite be located at the coordinates of the dragging
    gameObject.x = dragX;
    gameObject.y = dragY;
  });

  // create ui
  this.createUi();

  // show stats to the user
  this.createHud();
  this.refreshHud();

  // decay of health and fun over time
  this.timedEventStats = this.time.addEvent({
    delay: 1000,
    repeat: -1, // infinite repeats
    callback: function() {
      // update stats
      this.updateStats(this.decayRates);
    },
    callbackScope: this
  });
};

// create ui
gameScene.createUi = function() {
  // buttons
  this.appleBtn = this.add.sprite(72, 570, 'apple').setInteractive();
  this.appleBtn.customStats = { health: 20, fun: 0 };
  this.appleBtn.on('pointerdown', this.pickItem);

  this.candyBtn = this.add.sprite(144, 570, 'candy').setInteractive();
  this.candyBtn.customStats = { health: -10, fun: 10 };
  this.candyBtn.on('pointerdown', this.pickItem);

  this.toyBtn = this.add.sprite(216, 570, 'toy').setInteractive();
  this.toyBtn.customStats = { health: 0, fun: 15 };
  this.toyBtn.on('pointerdown', this.pickItem);

  this.rotateBtn = this.add.sprite(288, 570, 'rotate').setInteractive();
  this.rotateBtn.customStats = { fun: 20 };
  this.rotateBtn.on('pointerdown', this.rotatePet);

  // array with all buttons
  this.buttons = [this.appleBtn, this.candyBtn, this.toyBtn, this.rotateBtn];

  // ui is not blocked
  this.uiBlocked = false;

  // refresh ui
  this.uiReady();
};

// rotate pet
gameScene.rotatePet = function() {
  // the ui can't be blocked in order to rotate
  if (this.scene.uiBlocked) {
    return;
  }

  // make sure the ui is ready
  this.scene.uiReady();

  // block the ui
  this.scene.uiBlocked = true;

  // dim the rotate icon
  this.alpha = 0.5;

  // rotation tween
  let rotateTween = this.scene.tweens.add({
    targets: this.scene.pet,
    duration: 600,
    angle: 720,
    pause: false,
    callbackScope: this, // for onComplete, scope is the sprite
    onComplete: function(tween, sprite) {
      // update stats
      this.scene.updateStats(this.customStats);

      // set UI to ready
      this.scene.uiReady();
    }
  });
};

// pick item - something very interesting to note is that if we
// do not give the on() method a context, it will be of the
// gameobject that we clicked! So, 'this' refers to the gameobject
gameScene.pickItem = function() {
  // the ui can't be blocked in order to select an error
  // remember, the context here is of the gameobject we clicked
  // therefore, we must use this.scene for scene variables
  if (this.scene.uiBlocked) {
    return;
  }

  // make sure the ui is ready
  this.scene.uiReady();

  // select item
  this.scene.selectedItem = this;

  // change transparency
  this.alpha = 0.5;
};

// set ui to "ready"
gameScene.uiReady = function() {
  // nothing is being selected
  this.selectedItem = null;

  // set all buttons to alpha 1 (no transparency)
  for (let i = 0; i < this.buttons.length; i++) {
    this.buttons[i].alpha = 1;
  }

  // scene must be unblocked
  this.uiBlocked = false;
};

// place new item on the game
gameScene.placeItem = function(pointer, localX, localY) {
  // check that an item was selected
  if (!this.selectedItem) {
    return;
  }

  // ui must be unblocked
  if (this.uiBlocked) {
    return;
  }

  // create a new item in the position the player clicked/tapped
  let newItem = this.add.sprite(localX, localY, this.selectedItem.texture.key);

  // block UI
  this.uiBlocked = true;

  // pet movement (tween)
  let petTween = this.tweens.add({
    targets: this.pet,
    duration: 500,
    x: newItem.x,
    y: newItem.y,
    paused: false,
    callbackScope: this,
    onComplete: function(tween, sprites) {
      // destroy the item
      newItem.destroy();

      // event listener for when spritesheet animation ends
      this.pet.on('animationcomplete', function() {
        // set pet back to neutral face
        this.pet.setFrame(0);

        // clear UI
        this.uiReady();
      }, this);

      // play spritesheet animation
      this.pet.play('funnyfaces');

      // update stats
      this.updateStats(this.selectedItem.customStats);
    }
  });
};

// create the text elements that will show the stats
gameScene.createHud = function() {
  // health stat
  this.healthText = this.add.text(20, 20, 'Health: ', {
    font: '24px Arial',
    fill: '#ffffff'
  });

  // health stat
  this.funText = this.add.text(170, 20, 'Fun: ', {
    font: '24px Arial',
    fill: '#ffffff'
  });
};

// show the current value of health and fun
gameScene.refreshHud = function() {
  this.healthText.setText('Health: ' + this.stats.health);
  this.funText.setText('Fun: ' + this.stats.fun);
};

// stat updater
gameScene.updateStats = function(statDiff) {
  // flag to see if it's game over
  let isGameOver = false;

  for(stat in statDiff) {
    // only use properties that don't come from the prototype
    if (statDiff.hasOwnProperty(stat)) {
      this.stats[stat] += statDiff[stat];

      // stats can't be less than 0
      if (this.stats[stat] < 0) {
        isGameOver = true;
        this.stats[stat] = 0;
      }
    }
  }

  // refresh HUD
  this.refreshHud();

  // check to see if the game ended
  if (isGameOver) {
    this.gameOver();
  }
};

gameScene.gameOver = function() {
  // block ui
  this.uiBlocked = true;

  // change frame of the pet
  this.pet.setFrame(4);

  // keep the game on for some time, then move on
  this.time.addEvent({
    delay: 2000,
    repeat: 0,
    callback: function() {
      this.scene.start('Home');
    },
    callbackScope: this
  });
};
