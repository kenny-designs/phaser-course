// create a new scene
let loadingScene = new Phaser.Scene('Loading');

loadingScene.preload = function() {
  // show logo
  // normally, we wouldn't do this but we preloaded in bootScene
  let logo = this.add.sprite(this.sys.game.config.width / 2, 250, 'logo');

  // progress bar background
  let bgBar = this.add.graphics();

  let barW = 150;
  let barH = 30;
  bgBar.setPosition(this.sys.game.config.width / 2 - barW / 2,
                    this.sys.game.config.height / 2 - barH / 2);
  bgBar.fillStyle(0xf5f5f5, 1);
  bgBar.fillRect(0, 0, barW, barH);

  // progress bar
  let progressBar = this.add.graphics();
  progressBar.setPosition(this.sys.game.config.width / 2 - barW / 2,
                          this.sys.game.config.height / 2 - barH / 2);

  // listen to the 'progress' event. An event that is triggered
  // as file are being loaded
  this.load.on('progress', function(value) {
    // clear progress bar (so we can draw it again)
    progressBar.clear();

    // set style
    progressBar.fillStyle(0x9ad98d, 1);

    // draw rectangle
    progressBar.fillRect(0, 0, value * barW, barH);
  }, this);

  // load assets
  this.load.image('backyard', 'assets/images/backyard.png');
  this.load.image('apple', 'assets/images/apple.png');
  this.load.image('candy', 'assets/images/candy.png');
  this.load.image('rotate', 'assets/images/rotate.png');
  this.load.image('toy', 'assets/images/rubber_duck.png');

  this.load.spritesheet('pet', 'assets/images/pet.png', {
    frameWidth: 97,
    frameHeight: 83,
    margin: 1,  // each image has 1 pixel margin
    spacing: 1  // there's also 1 pixel spacing between frames
  });

  // TESTING LOADING BAR ONLY
  /*
  for (let i = 0; i < 100; i++) {
    this.load.image('test' + i, 'assets/images/candy.png');
  }
  */
};

loadingScene.create = function() {
  // animation
  // good to know, animations will be available in all Scenes
  // they are a global system within Phaser
  // also, the same animation can be used in multiple sprites
  this.anims.create({
    key: 'funnyfaces',
    frames: this.anims.generateFrameNames('pet', {frames: [1, 2, 3]}),
    frameRate: 7,
    yoyo: true,
    repeat: 0
  });

  this.scene.start('Home');
};
