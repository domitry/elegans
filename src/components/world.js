define([
    "utils/TrackballControls",
    "utils/OrthographicTrackballControls"
],function(TrackballControls, OrthographicTrackballControls){

    function World(options){
	this.options = {
	    width: 0,
	    height: 0,
	    perspective: true
	};

	if(arguments.length > 1){
	    Utils.merge(this.options, options);
	};

	this.scene = new THREE.Scene();

	if(options.perspective)
	    this.camera = new THREE.PerspectiveCamera(45, options.width/options.height, 1, 1000);
	else
	    this.camera = new THREE.OrthographicCamera(-20,20,-20,20);

	this.scene.add(this.camera);

	var positions = [[1,1,1],[-1,-1,1],[-1,1,1],[1,-1,1]];
	for(var i=0;i<4;i++){
	    var light=new THREE.DirectionalLight(0xdddddd);
	    light.position.set(positions[i][0],positions[i][1],1*positions[i][2]);
	    this.scene.add(light);
	}

	this.renderer = new THREE.WebGLRenderer({antialias:true});
	this.renderer.setSize(options.width, options.height);
	this.renderer.setClearColor(options.bg_color, 1);

	if(options.perspective)
	    this.controls = new TrackballControls(this.camera, this.renderer.domElement);
	else
	    this.controls = new OrthographicTrackballControls(this.camera, this.renderer.domElement);

	this.controls.screen = {left: 0, top: 0, width: options.width, height: options.height};
	this.controls.rotateSpeed = 0.5;

	this.camera.position.set(-30, 31,42);
	this.camera.rotation.set(-0.6,-0.5,0.6);

	window.camera = this.camera;

	return this;
    }

    World.prototype.begin = function(selection){
	selection[0][0].appendChild(this.renderer.domElement);
	var world = this;
        var interval = 1000/30;
        var before = Date.now();

	this.animate = function(){
	    window.requestAnimationFrame(world.animate);
            var now = Date.now();
            if(now - before > interval){
                before = now;
	        world.renderer.render(world.scene, world.camera);
	        world.controls.update();
            }
	};

	this.animate();
    };

    World.prototype.addMesh = function(mesh){
	if(mesh instanceof Array){
	    for(var i=0; i<mesh.length; i++){
		this.scene.add(mesh[i]);
	    }
	}else{
	    this.scene.add(mesh);
	}
    };

    World.prototype.removeMesh = function(mesh){
        if(mesh instanceof Array){
	    for(var i=0; i<mesh.length; i++){
		this.scene.remove(mesh[i]);
	    }
        }else{
	    this.scene.remove(mesh);
        }
    };

    return World;
});
