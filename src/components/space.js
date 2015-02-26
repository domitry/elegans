define([
    "utils/utils"
],function(Utils){
    function Space(ranges, options){
	this.options = {
	    axis_labels: {x:"X", y:"Y", z:"Z"},
	    mode: 'solid',
	    grid: true
	};

	if(arguments.length > 1){
	    Utils.merge(this.options, options);
	};
	
	var BIGIN=-10, END=10, WIDTH=END-BIGIN;
	var geometry = new THREE.PlaneGeometry(WIDTH,WIDTH);
	var material = new THREE.MeshBasicMaterial({color:0xf0f0f0, shading: THREE.FlatShading, overdraw: 0.5, side: THREE.DoubleSide});
	var newV = function(x,y,z){return new THREE.Vector3(x,y,z);};
	this.meshes = [];

	if(this.options.mode == "solid"){
	    var xy_plane = new THREE.Mesh(geometry, material);
	    var xz_plane = new THREE.Mesh(geometry, material);
	    var yz_plane = new THREE.Mesh(geometry, material);

	    xz_plane.rotateOnAxis(newV(1,0,0), Math.PI/2);
	    xz_plane.translateOnAxis(newV(0,0,-1), -10);

	    yz_plane.rotateOnAxis(newV(0,1,0), Math.PI/2);
	    yz_plane.translateOnAxis(newV(0,0,-1), -10);

	    xy_plane.translateOnAxis(newV(0,0,1), -10);
	}else{
	    var coordinates = [
		[[-10, 10, -10], [-10, -10, -10],[10,-10,-10]],
		[[-10, 10, 10], [-10, -10, 10], [10,-10,10],[10,10,10], [-10, 10, 10]],
		[[10, -10, -10], [10, -10, 10]],
		[[-10, 10, -10], [-10, 10, 10]],
		[[-10, -10, -10], [-10, -10, 10]],
		[[10, -10, -10], [10, 10, -10]]
	    ];
	    var meshes = this.meshes;

	    material = new THREE.LineBasicMaterial( { color: 0x000000, opacity: 0.2 } );
	    coordinates.forEach(function(arr){
		var geonetry = new THREE.Geometry();
		arr.forEach(function(c){
		    geonetry.vertices.push(newV.apply(null, c));
		});
		meshes.push(new THREE.Line(geonetry, material));
	    });
	}
	
	this.scales = {};
	this.scales.x = d3.scale.linear().domain([ranges.x.max, ranges.x.min]).range([-10, 10]);
	this.scales.y = d3.scale.linear().domain([ranges.y.max, ranges.y.min]).range([10, -10]);
	this.scales.z = d3.scale.linear().domain([ranges.z.max, ranges.z.min]).range([10,-10]);

	this.meshes.push(xy_plane);
	this.meshes.push(xz_plane);
	this.meshes.push(yz_plane);

	// generate axis
	var x_scale = d3.scale.linear().domain([ranges.x.max, ranges.x.min]).range([20, 0]);
	var y_scale = d3.scale.linear().domain([ranges.y.max, ranges.y.min]).range([20, 0]);
	var z_scale = d3.scale.linear().domain([ranges.z.max, ranges.z.min]).range([20,0]);
	this.meshes = this.meshes.concat(generateAxisAndLabels(this.options.axis_labels.x, newV(10,10,-10),newV(-10,10,-10),newV(0,1,0),x_scale));
	this.meshes = this.meshes.concat(generateAxisAndLabels(this.options.axis_labels.y, newV(-10,-10,-10),newV(-10,10,-10),newV(-1,0,0),y_scale));
	this.meshes = this.meshes.concat(generateAxisAndLabels(this.options.axis_labels.z, newV(10,10,-10),newV(10,10,10),newV(0,1,0),z_scale));

	// generate grids
	if(this.options.grid){
	    this.meshes.push(generateGrid([-10,10],[-10,10],[-10,-10],2));//x-y
	    this.meshes.push(generateGrid([-10,10],[-10,-10],[-10,10],2));//x-z
	    this.meshes.push(generateGrid([10,10],[-10,10],[-10,10],2));//y-z
	}

	return this;
    }

    var generateLabel = function(text, position){
	    var canvas = document.createElement('canvas');
	    canvas.width = 100;
	    canvas.height = 100;
	    var context = canvas.getContext('2d');
	    context.fillStyle = "rgb(0, 0, 0)";
	    context.font = "60px sans-serif";
	    var text_width = context.measureText(text).width;
	    context.fillText(text, (100-text_width)/2, 80);
	    var texture = new THREE.Texture(canvas);
	    texture.flipY = false;
	    texture.needsUpdate = true;
	    var material = new THREE.SpriteMaterial({
	        map: texture,
	        transparent: true,
	        useScreenCoordinates: false
	    });
	    var sprite = new THREE.Sprite(material);
	    sprite.scale.set(1.5,1.5);
	    sprite.position = position;
	    return sprite;
    };

    var generateAxisAndLabels = function(axis_label, axis_start, axis_end, nv_tick, scale){
	    var meshes = [];
	    var geometry = new THREE.Geometry();
	    var nv_start2end = (new THREE.Vector3).subVectors(axis_end, axis_start).normalize();

	    geometry.vertices.push(axis_start);
	    geometry.vertices.push(axis_end);

	    var label_position = (new THREE.Vector3).addVectors(axis_end, axis_start).divideScalar(2);
	    label_position.add(nv_tick.clone().multiplyScalar(3));
	    meshes.push(generateLabel(axis_label, label_position));

	    // generate d3.js axis
	    var svg = d3.select("body")
	            .append("svg")
	            .style("width", "500")
	            .style("height", "500")
	            .style("display", "none");
	    var ticks = svg.append("g")
	            .call(d3.svg.axis()
		              .scale(scale)
		              .orient("left")
		              .ticks(5))
	            .selectAll(".tick");

	    // parse svg axis, and generate ticks and labels mimicing svg's.
	    var tick_values = [];
	    for(var i=0; i<ticks[0].length; i++){
	        // generate tick line
	        var nattr = ticks[0][i].getAttribute("transform");
	        var valueArr = /translate\(((?:-|\d|.)+),((?:-|\d|.)+)\)/g.exec(nattr);
	        var tick_center = (new THREE.Vector3).addVectors(axis_start, nv_start2end.clone().multiplyScalar(valueArr[2]));
	        var tick_start = (new THREE.Vector3).addVectors(tick_center, nv_tick.clone().multiplyScalar(0.3));
	        var tick_end = (new THREE.Vector3).addVectors(tick_center, nv_tick.clone().multiplyScalar(-0.3));
	        geometry.vertices.push(tick_start);
	        geometry.vertices.push(tick_end);

	        //generate labels
	        var text = ticks[0][i].children[1].childNodes[0].nodeValue;
	        var label_center = (new THREE.Vector3).addVectors(tick_center ,nv_tick.clone().multiplyScalar(1.0));
	        var label = generateLabel(text, label_center);
	        meshes.push(label);
	    }

	    svg.remove();

	    var material = new THREE.LineBasicMaterial( { color: 0x000000, opacity: 0.2 } );
	    var line = new THREE.Line(geometry, material);
	    line.type = THREE.LinePieces;
	    meshes.push(line);
	    return meshes;
    };

    var generateGrid = function(x_range, y_range, z_range, interval){
	    var geometry = new THREE.Geometry();

	    if(x_range[0]!=x_range[1])for(var x=x_range[0];x<=x_range[1];x+=interval){
	        geometry.vertices.push(new THREE.Vector3(x,y_range[0],z_range[0]));
	        geometry.vertices.push(new THREE.Vector3(x,y_range[1],z_range[1]));
	    }
	    if(y_range[0]!=y_range[1])for(var y=y_range[0];y<=y_range[1];y+=interval){
	        geometry.vertices.push(new THREE.Vector3(x_range[0],y,z_range[0]));
	        geometry.vertices.push(new THREE.Vector3(x_range[1],y,z_range[1]));
	    }
	    if(z_range[0]!=z_range[1])for(var z=z_range[0];z<=z_range[1];z+=interval){
	        geometry.vertices.push(new THREE.Vector3(x_range[0],y_range[0],z));
	        geometry.vertices.push(new THREE.Vector3(x_range[1],y_range[1],z));
	    }
	    var material = new THREE.LineBasicMaterial( { color: 0xcccccc, opacity: 0.2 } );
	    var line = new THREE.Line(geometry, material);
	    line.type = THREE.LinePieces;
	    return line;
    };

    Space.prototype.getScales= function(){
	    return this.scales;
    };

    Space.prototype.getMeshes = function(){
	    return this.meshes;
    };

    return Space;
});
