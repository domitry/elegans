define([
    "components/legends",
    "utils/utils",
    "utils/datasets",
    "utils/colorbrewer"
],function(Legends, Utils, Datasets, colorbrewer){
    function Cylinder(data, options){
	this.options = {
	    name: "Cylinder",
	    color: "#756bb1",
	    size: 0.3,
	    has_legend: true
	};

	if(arguments.length > 1){
	    Utils.merge(this.options, options);
	}

	this.data = data;
	this.dataset = new Datasets.Array(data);
	this.ranges = this.dataset.ranges;
    }

    Cylinder.prototype.generateMesh = function(scales){
	    var data = new Datasets.Array(this.data).raw;
	    var geometry = new THREE.Geometry();
	    for(var i=0;i<data.x.length;i++){
            var height = Math.abs(scales.x(data.height[i]) - scales.x(0));
            var rad = Math.abs(scales.x(data.radius[i]) - scales.x(0));
	        var mesh = new THREE.Mesh(new THREE.CylinderGeometry(rad,rad,height,16));
	        mesh.position.set(
		        scales.x(data.x[i]),
		        scales.y(data.y[i]),
		        scales.z(data.z[i])
	        );
            mesh.useQuaternion = true;
            var axis = new THREE.Vector3(data.x_rad[i], data.y_rad[i], data.z_rad[i]).normalize();
            var angle = data.angle[i];
            var q = new THREE.Quaternion();
            q.setFromAxisAngle(axis, angle);
            mesh.rotation.setFromQuaternion(q);
	        THREE.GeometryUtils.merge(geometry, mesh);
        }
        var material = new THREE.MeshLambertMaterial({transparent:true, color: this.options.color});
	this.mesh = new THREE.Mesh(geometry, material);
    };

    Cylinder.prototype.getDataRanges = function(){
	return this.ranges;
    };
    
    Cylinder.prototype.hasLegend = function(){
	return this.options.has_legend;
    };

    Cylinder.prototype.disappear = function(){
	this.mesh.material.opacity = 0;
	this.mesh.material.needsUpdate = true;
    };

    Cylinder.prototype.appear = function(){
	this.mesh.material.opacity = 1;
    };

    Cylinder.prototype.getLegend = function(){
	return Legends.generateDiscreteLegend(this.options.name, this.options.color, this);
    };
    
    Cylinder.prototype.getMesh = function(){
	return this.mesh;
    };

    return Cylinder;
});
