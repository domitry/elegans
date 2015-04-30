define([
    "components/legends",
    "utils/utils",
    "utils/datasets",
    "utils/colorbrewer"
],function(Legends, Utils, Datasets, colorbrewer){
    function Scatter(data, options){
	this.options = {
	    name: "Scatter",
	    shape: "circle",
	    size: 1.5,
	    stroke_width: 3,
	    stroke_color: "#000000",
	    fill_color: colorbrewer.Reds[3][1],
	    has_legend: true
	};

	if(arguments.length > 1){
	    Utils.merge(this.options, options);
	}

	this.dataset = new Datasets.Array(data);
	this.ranges = this.dataset.ranges;
    }

    Scatter.prototype.generateMesh = function(scales){
	var shape_funcs = {
	    circle: function(ctx){
		ctx.arc(50, 50, 40, 0, Math.PI*2, false);
	    },
	    rect: function(ctx){
		ctx.beginPath();
		ctx.moveTo(20,20);
		ctx.lineTo(80,20);
		ctx.lineTo(80,80);
		ctx.lineTo(20,80);
		ctx.lineTo(20,20);
	    },
	    cross: function(ctx){
		var vertexes = [[35,5],[65,5],[65,35],[95,35],[95,65],[65,65],[65,95],[35,95],[35,65],[5,65],[5,35],[35,35]];
		ctx.moveTo(vertexes[11][0],vertexes[11][1]);
		for(var i=0;i<vertexes.length;i++){
		    ctx.lineTo(vertexes[i][0],vertexes[i][1]);
		}
	    },
	    diamond: function(ctx){
		ctx.moveTo(50,5);
		ctx.lineTo(85,50);
		ctx.lineTo(50,95);
		ctx.lineTo(15,50);
		ctx.lineTo(50,5);
	    }
	};

	var canvas = document.createElement('canvas');
	canvas.width = 100;
	canvas.height = 100;
	var ctx = canvas.getContext('2d');
	ctx.fillStyle = this.options.fill_color;
	shape_funcs[this.options.shape](ctx);
	ctx.fill();
	ctx.lineWidth = this.options.stroke_width;
	ctx.strokeStyle = this.options.stroke_color;
	ctx.stroke();

	var texture = new THREE.Texture(canvas);
	texture.flipY = false;
	texture.needsUpdate = true;
	var material = new THREE.SpriteMaterial({
	    map: texture,
	    size: 10,
	    transparent: true
	});

	var data = this.dataset.raw;
	var meshes = [];
	for(var i=0;i<data.x.length;i++){
	    var sprite = new THREE.Sprite(material);
	    sprite.position.set(
		scales.x(data.x[i]),
		scales.y(data.y[i]),
		scales.z(data.z[i])
	    );
	    var size = this.options.size;
	    sprite.scale.set(size,size,size);
	    meshes.push(sprite);
	}
	this.mesh = meshes;
    };

    Scatter.prototype.getDataRanges = function(){
	return this.ranges;
    };
    
    Scatter.prototype.hasLegend = function(){
	return this.options.has_legend;
    };

    Scatter.prototype.disappear = function(){
	for(var i=0;i<this.mesh.length;i++){
	    this.mesh[i].material.opacity = 0;
	}
    };

    Scatter.prototype.appear = function(){
	for(var i=0;i<this.mesh.length;i++){
	    this.mesh[i].material.opacity = 1;
	}
    };

    Scatter.prototype.getLegend = function(){
	return Legends.generateDiscreteLegend(this.options.name, this.options.fill_color, this);
    };

    Scatter.prototype.getMesh = function(){
	return this.mesh;
    };

    return Scatter;
});
