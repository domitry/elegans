define([],function(){
    function Space(ranges){
	var BIGIN=-10, END=10, WIDTH=END-BIGIN;
	var geometry = new THREE.PlaneGeometry(WIDTH,WIDTH);
	var material = new THREE.MeshBasicMaterial({color:0xf0f0f0, shading: THREE.FlatShading, overdraw: 0.5, side: THREE.DoubleSide});

	var xy_plane = new THREE.Mesh(geometry, material);
	var xz_plane = new THREE.Mesh(geometry, material);
	var yz_plane = new THREE.Mesh(geometry, material);

	var newV = function(x,y,z){return new THREE.Vector3(x,y,z);}

	xz_plane.rotateOnAxis(newV(1,0,0), Math.PI/2);
	xz_plane.translateOnAxis(newV(0,1,0), 10);
	xz_plane.translateOnAxis(newV(0,0,1), 10);

	yz_plane.rotateOnAxis(newV(0,1,0), Math.PI/2);
	yz_plane.translateOnAxis(newV(-1,0,0), 10);
	yz_plane.translateOnAxis(newV(0,0,1), 10);

	this.scales = {};
	this.scales.x = d3.scale.linear().domain([ranges[0][0], ranges[0][1]]).range([10, -10])
	this.scales.y = d3.scale.linear().domain([ranges[1][0], ranges[1][1]]).range([10, -10])
	this.scales.z = d3.scale.linear().domain([ranges[2][0], ranges[2][1]]).range([15,0])

	this.meshes = [];

	this.meshes.push(xy_plane);
	this.meshes.push(xz_plane);
	this.meshes.push(yz_plane);

	// generate axis (dirty. must be modified.)
	var x_scale = d3.scale.linear().domain([ranges[0][0], ranges[0][1]]).range([20, 0]);
	var y_scale = d3.scale.linear().domain([ranges[1][0], ranges[1][1]]).range([20, 0]);
	var z_scale = d3.scale.linear().domain([ranges[2][0], ranges[2][1]]).range([15,0]);
	this.meshes = this.meshes.concat(generateAxisAndLabels(newV(-10,10,0),newV(10,10,0),newV(0,1,0),x_scale));
	this.meshes = this.meshes.concat(generateAxisAndLabels(newV(-10,-10,0),newV(-10,10,0),newV(-1,0,0),y_scale));
	this.meshes = this.meshes.concat(generateAxisAndLabels(newV(10,10,0),newV(10,10,20),newV(0,1,0),z_scale));

	// generate grids
	this.meshes.push(generateGrid([-10,10],[-10,10],[0,0],2));//x-y
	this.meshes.push(generateGrid([-10,10],[-10,-10],[0,20],2));//x-z
	this.meshes.push(generateGrid([10,10],[-10,10],[0,20],2));//y-z

	return this;
    }

    var generateAxisAndLabels = function(axis_start, axis_end, nv_tick, scale){
	var meshes = [];
	var geometry = new THREE.Geometry();
	var nv_start2end = (new THREE.Vector3).subVectors(axis_end, axis_start).normalize();
	var generateLabel = function(text, position){
	    var geometry = new THREE.TextGeometry(text, {size:1, font:"helvetiker", height:1});
	    var material = new THREE.MeshBasicMaterial({color:0x000000});
	    mesh = new THREE.Mesh(geometry, material);
	    mesh.position = position;
	    return mesh;
	}

	geometry.vertices.push(axis_start);
	geometry.vertices.push(axis_end);

	// generate d3.js axis
	var svg = d3.select("body")
	    .append("svg")
	    .style("width", "500")
	    .style("height", "500")
	    .style("display", "none")
	var ticks = svg.append("g")
	    .call(d3.svg.axis()
		  .scale(scale)
		  .orient("left")
		  .ticks(5))
	    .selectAll(".tick");

	// parse svg axis, and generate ticks and labels mimicing svg's.
	tick_values = [];
	for(var i=0; i<ticks[0].length; i++){
	    // generate tick line
	    attr = ticks[0][i].getAttribute("transform");
	    valueArr = /translate\(((?:-|\d|.)+),((?:-|\d|.)+)\)/g.exec(attr);
	    var nv_s2e = (new THREE.Vector3).copy(nv_start2end);
	    var nv_t = (new THREE.Vector3).copy(nv_tick);
	    var tick_center = (new THREE.Vector3).addVectors(axis_start, nv_s2e.multiplyScalar(valueArr[2]));
	    var tick_start = (new THREE.Vector3).addVectors(tick_center, nv_t.multiplyScalar(0.3));
	    nv_t.copy(nv_tick);
	    var tick_end = (new THREE.Vector3).addVectors(tick_center, nv_t.multiplyScalar(-0.3));
	    geometry.vertices.push(tick_start);
	    geometry.vertices.push(tick_end);

	    //generate labels
	    var text = ticks[0][i].children[1].childNodes[0].nodeValue;
	    nv_t.copy(nv_tick);
	    //var label_center = (new THREE.Vector3).addVectors(tick_center ,nv_t.multiplyScalar(1.0));
	    label = generateLabel(text, tick_end);
	    meshes.push(label);
	}

	//svg.remove();

	var material = new THREE.LineBasicMaterial( { color: 0x000000, opacity: 0.2 } );
	var line = new THREE.Line(geometry, material);
	line.type = THREE.LinePieces;
	meshes.push(line);
	return meshes;
    }

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
    }

    Space.prototype.getScales= function(){
	return this.scales;
    };

    Space.prototype.getMesh = function(){
	return this.meshes;
    };

    return Space;
});
