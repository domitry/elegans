define([],function(){
    function Space(ranges){
	var BIGIN=-10, END=10, WIDTH=END-BIGIN;
	var geometry = new THREE.PlaneGeometry(WIDTH,WIDTH);
	var material = new THREE.MeshBasicMaterial({color:0xf0f0f0, shading: THREE.FlatShading, overdraw: 0.5, side: THREE.DoubleSide});

	var xy_plane = new THREE.Mesh(geometry, material);
	var xz_plane = new THREE.Mesh(geometry, material);
	var yz_plane = new THREE.Mesh(geometry, material);

	xz_plane.rotateOnAxis(new THREE.Vector3(1,0,0), Math.PI/2);
	xz_plane.translateOnAxis(new THREE.Vector3(0,1,0), 10);
	xz_plane.translateOnAxis(new THREE.Vector3(0,0,1), 10);

	yz_plane.rotateOnAxis(new THREE.Vector3(0,1,0), Math.PI/2);
	yz_plane.translateOnAxis(new THREE.Vector3(-1,0,0), 10);
	yz_plane.translateOnAxis(new THREE.Vector3(0,0,1), 10);

	this.meshes = [];

	this.meshes.push(xy_plane);
	this.meshes.push(xz_plane);
	this.meshes.push(yz_plane);

	this.meshes.push(generateGrid([-10,10],[-10,10],[0,0],2));//x-y
	this.meshes.push(generateGrid([-10,10],[-10,-10],[0,20],2));//x-z
	this.meshes.push(generateGrid([10,10],[-10,10],[0,20],2));//y-z

	this.scales = {};
	this.scales.x = d3.scale.linear().domain([ranges[0][0], ranges[0][1]]).range([10, -10])
	this.scales.y = d3.scale.linear().domain([ranges[1][0], ranges[1][1]]).range([10, -10])
	this.scales.z = d3.scale.linear().domain([ranges[2][0], ranges[2][1]]).range([15,0])

	return this;
    }

    function generateGrid(x_range, y_range, z_range, interval){
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
