define([
    "components/legends",
    "utils/utils",
    "utils/datasets",
    "utils/colorbrewer"
],function(Legends, Utils, Datasets, colorbrewer){
    /*
     * Experimental Implementation of Debug Objects whose material is wireframe
     * DO NOT APPLY THIS OBJECT TO PRACTICAL USE
     *
     * column layout:
     *   [{x: 0, y: 0, z: 0, type: "box", options: {width: 1, height: 1}}, {}, {}, ...]
     *   optional: x_rad, y_rad, z_rad are set when option.rotate == true
     */

    function Debug_Object(data, options){
	this.options = {
	    name: "objects",
	    color: "#000",
	    has_legend: true,
	    rotate: false
	};

	if(arguments.length > 1){
	    Utils.merge(this.options, options);
	}

	this.data = data;
	this.dataset = new Datasets.Array(data);
	this.ranges = this.dataset.ranges;
    }

    Debug_Object.prototype.generateMesh = function(scales){
	var data = new Datasets.Array(this.data).raw;
	var geometry = new THREE.Geometry();
	for(var i=0;i<data.x.length;i++){
	    var geo, options;
	    switch(data.type[i]){
	    case "box":
		options = Utils.merge({
		    width: 1,
		    height: 1,
		    depth: 1,
		    widthSegments: 1,
		    heightSegments: 1,
		    depthSegments: 1
		}, data.options[i]);
		geo = new THREE.BoxGeometry(
		    Math.abs(scales.x(options.width) - scales.x(0)),
		    Math.abs(scales.y(options.height) - scales.y(0)),
		    Math.abs(scales.z(options.depth) - scales.z(0)),
		    options.widthSegments,
		    options.heightSegments,
		    options.depthSegments
		);
		break;

	    case "cylinder":
		options = Utils.merge({
		    radius: 1,
		    height: 100,
		    radiusSegments: 8,
		    heightSegments: 1
		}, data.options[i]);
		geo = new THREE.CylinderGeometry(
		    Math.abs(scales.x(options.radius) - scales.x(0)),
		    Math.abs(scales.x(options.radius) - scales.x(0)),
		    Math.abs(scales.y(options.height) - scales.y(0)),
		    options.radiusSegments,
		    options.heightSegments
		);
		break;

	    case "sphere":
		options = Utils.merge({
		    radius: 1,
		    horizontalSegments: 8,
		    verticalSegments: 6
		}, data.options[i]);
		geo = new THREE.SphereGeometry(
		    Math.abs(scales.x(options.radius) - scales.x(0)),
		    options.horizontalSegments,
		    options.verticalSegments
		);
		break;

	    case "plane":
		options = Utils.merge({
		    width: 1,
		    height: 1,
		    widthSegments: 1,
		    heightSegments: 1
		}, data.options[i]);
		geo = new THREE.PlaneGeometry(
		    Math.abs(scales.x(options.width) - scales.x(0)),
		    Math.abs(scales.y(options.height) - scales.y(0)),
		    options.widthSegments,
		    options.heightSegments
		);
		break;
	    }

	    var mesh = new THREE.Mesh(geo);

	    mesh.position = new THREE.Vector3(
		scales.x(data.x[i]),
		scales.y(data.y[i]),
		scales.z(data.z[i])
	    );

	    if(this.options.rotate != false){
		mesh.useQuaternion = true;
		var axis = new THREE.Vector3(data.x_rad[i], data.y_rad[i], data.z_rad[i]).normalize();
		var angle = data.angle[i];
		var q = new THREE.Quaternion();
		q.setFromAxisAngle(axis, angle);
		mesh.rotation.setFromQuaternion(q);
	    }
	    THREE.GeometryUtils.merge(geometry, mesh);
        }

        var material = new THREE.MeshPhongMaterial({
            color: this.options.color,
            wireframe: true
	});
	this.mesh = new THREE.Mesh(geometry, material);
    };

    Debug_Object.prototype.getDataRanges = function(){
	return this.ranges;
    };
    
    Debug_Object.prototype.hasLegend = function(){
	return this.options.has_legend;
    };

    Debug_Object.prototype.disappear = function(){
	this.mesh.material.opacity = 0;
	this.mesh.material.needsUpdate = true;
    };

    Debug_Object.prototype.appear = function(){
	this.mesh.material.opacity = 1;
    };

    Debug_Object.prototype.getLegend = function(){
	return Legends.generateDiscreteLegend(this.options.name, this.options.color, this);
    };
    
    Debug_Object.prototype.getMesh = function(){
	return this.mesh;
    };

    return Debug_Object;
});
