define([],function(){

    var world, animate;

    function World(selection, options){
	this.scene = new THREE.Scene();

	// Perspective Camera Support
	//var VIEW_ANGLE=45, ASPECT=SCREEN_WIDTH/SCREEN_HEIGHT, NEAR=0.1, FAR=2000;
	//camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);

	this.camera = new THREE.OrthographicCamera(-20,20,-20,20);
	this.scene.add(this.camera);
	this.camera.position.set(-30, 31,42);
	//this.camera.lookAt(this.scene.position);
	this.camera.rotation.set(-0.6,-0.5,0.6);

	var positions = [[1,1,1],[-1,-1,1],[-1,1,1],[1,-1,1]];
	for(var i=0;i<4;i++){
	    var light=new THREE.DirectionalLight(0xdddddd);
	    light.position.set(positions[i][0],positions[i][1],1*positions[i][2]);
	    this.scene.add(light);
	}

	this.controls = new THREE.TrackballControls(this.camera);
	this.renderer = new THREE.WebGLRenderer({antialias:true});
	this.renderer.setSize(options.width, options.height);
	this.renderer.setClearColor(options.bg_color, 1);

	selection.appendChild(this.renderer.domElement);

	this.camera.position.set(-30, 31,42);
	this.camera.rotation.set(-0.6,-0.5,0.6);

	return this;
    }

    World.prototype.begin = function(){
	world = this;
	this.animate();
    }

    World.prototype.animate = function(){
	requestAnimationFrame(world.animate);
	world.renderer.render(world.scene, world.camera);
	world.controls.update();
	console.log(world.camera.position);
	console.log(world.camera.rotation);
    }

    World.prototype.addMesh = function(mesh){
	if(mesh instanceof Array){
	    for(var i=0; i<mesh.length; i++){
		this.scene.add(mesh[i]);
	    }
	}
	else{
	    this.scene.add(mesh);
	}
    }

    return World;
});
