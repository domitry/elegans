define([
    "components/legends",
    "utils/utils",
    "utils/datasets",
    "utils/colorbrewer"
],function(Legends, Utils, Datasets, colorbrewer){
    function Wireframe(data, options){
	this.options = {
	    name: "wireframe",
	    color: "#999999",
	    thickness: 1,
	    has_legend: true
	};

	if(arguments.length > 1){
	    Utils.merge(this.options, options);
	}

	this.dataset = new Datasets.Matrix(data);
	this.ranges = this.dataset.ranges;
    }

    Wireframe.prototype.generateMesh = function(scales){
	var data = this.dataset.raw;
	var width = data.x.length, height = data.x[0].length;
	var material = new THREE.LineBasicMaterial({ 
	    color: this.options.color,
	    linewidth: this.options.thickness,
	    transparent: true
	});
	var meshes = [];
	for(var i=0;i<width;i++){
	    var geometry = new THREE.Geometry();
	    for(var j=0;j<height;j++){
		geometry.vertices.push(new THREE.Vector3(
		    scales.x(data.x[i][j]),
		    scales.y(data.y[i][j]),
		    scales.z(data.z[i][j])
		));
	    }
	    meshes.push(new THREE.Line(geometry, material));
	}

	for(var j=0;j<height;j++){
	    var geometry = new THREE.Geometry();
	    for(var i=0;i<width;i++){
		geometry.vertices.push(new THREE.Vector3(
		    scales.x(data.x[i][j]),
		    scales.y(data.y[i][j]),
		    scales.z(data.z[i][j])
		));
	    }
	    meshes.push(new THREE.Line(geometry, material));
	}

	this.mesh = meshes;
    };

    Wireframe.prototype.getDataRanges = function(){
	return this.ranges;
    };
    
    Wireframe.prototype.hasLegend = function(){
	return this.options.has_legend;
    };

    Wireframe.prototype.disappear = function(){
	for(var i=0;i<this.mesh.length;i++){
	    this.mesh[i].material.opacity = 0;
	    this.mesh[i].material.needsUpdate = true;
	}
    };

    Wireframe.prototype.appear = function(){
	for(var i=0;i<this.mesh.length;i++){
	    this.mesh[i].material.opacity = 1;
	    this.mesh[i].material.needsUpdate = true;
	}
    };

    Wireframe.prototype.getLegend = function(){
	return Legends.generateDiscreteLegend(this.options.name, this.options.color, this);
    };
    
    Wireframe.prototype.getMesh = function(){
	return this.mesh;
    };

    return Wireframe;
});
