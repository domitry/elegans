define([
    "underscore",
    "components/legends",
    "utils/utils",
    "utils/range",
    "utils/datasets",
    "utils/colorbrewer",
    "shaders/fs",
    "shaders/vs"
],function(_, Legends, Utils, Range, Datasets, colorbrewer, fs, vs){
    var THREE = window.THREE;

    function Volume(data, _options){
	this.options = {
	    name: "Volume",
	    has_legend: true,
	    width: 100,
	    height: 100,
	    depth: 100,
	    f_per_row: 1,
	    f_per_column: 1,
	    filter: THREE.NearestFilter
	};
	if(arguments.length>1)_.extend(this.options, _options);

	this.data = new Datasets.Compressed(data);
	this.ranges = {x: [0,1], y: [0,1], z: [0,1]};
    }

    Volume.prototype.generateMesh = function(scales, stage){
	var uniforms = (_.bind(function(){
            var voltexDim = new THREE.Vector3(this.options.width, this.options.height, this.options.depth);
            var texture = (_.bind(function(){
		var image = document.createElement("img");
		var voltex = new THREE.Texture(image);
		image.onload = function(){
		    console.log("Texture loading finished");
                    voltex.needsUpdate=true;
		};
		image.src = this.data.raw;
		voltex.minFilter = voltex.magFilter = this.options.filter;
		voltex.wrapS = voltex.wrapT = THREE.ClampToEdgeWrapping;
		voltex.flipX = true;
		voltex.flipY = false;
		return voltex;
            }, this))();

	    var camera = stage.world.camera;

            return {
		uCamPos: {type: "v3", value: camera.position},
		uColor: {type: "v3", value: new THREE.Vector3(1.0, 1.0, 1.0)},
		uTex: {type: "t", value: texture},
		uTexDim: {type: "v3", value: voltexDim},
		fPerRow: {type: "f", value: this.options.f_per_row},
		fPerColumn: {type: "f", value: this.options.f_per_column},
		uOffset: {type: "v3", value: new THREE.Vector3()},
		uTMK: {type: "f", value: 16.0}
            };
        }, this))();

	var material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: vs,
            fragmentShader: fs,
            depthWrite: false
        });

	this.mesh =  new THREE.Mesh(
	    new THREE.CubeGeometry(1, 1, 1),
	    material
	);
	this.mesh.scale.set(20, 20, 20);
    };

    Volume.prototype.getDataRanges = function(){
	return this.ranges;
    };
    
    Volume.prototype.hasLegend = function(){
	return this.options.has_legend;
    };

    Volume.prototype.disappear = function(){
	this.mesh.material.opacity = 0;
	this.mesh.material.needsUpdate = true;
    };

    Volume.prototype.appear = function(){
	this.mesh.material.opacity = 1;
    };

    Volume.prototype.getLegend = function(){
	return Legends.generateDiscreteLegend(this.options.name, "#000", this);
    };
    
    Volume.prototype.getMesh = function(){
	return this.mesh;
    };

    return Volume;
});
