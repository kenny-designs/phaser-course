// the purpose of the boot scene is to preload a tiny image for
// our loading scene
let bootScene = new Phaser.Scene('Boot');

bootScene.preload = function() {
  this.load.image('logo', 'assets/images/rubber_duck.png');
};

bootScene.create = function() {
  this.scene.start('Loading');
};
