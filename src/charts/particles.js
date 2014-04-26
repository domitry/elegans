define([
    "components/legends",
    "utils/utils",
    "utils/datasets",
    "utils/colorbrewer"
],function(Legends, Utils, Datasets, colorbrewer){
    function Particles(data, options){
	this.options = {
	    color: colorbrewer.Reds[3][1],
	    size: 0.3,
	    has_legend: true
	};

	if(arguments.length > 1){
	    Utils.merge(this.options, options);
	}

	this.dataset = new Datasets.Array(data);
	this.ranges = this.dataset.getRanges();
    }

    Particles.prototype.generateMesh = function(scales){
	var data = this.dataset.raw;
	var geometry = new THREE.Geometry();
	for(var i=0;i<data.x.length;i++){
	    var mesh = new THREE.Mesh(new THREE.SphereGeometry(this.options.size));
	    mesh.position = new THREE.Vector3(
		scales.x(data.x[i]),
		scales.y(data.y[i]),
		scales.z(data.z[i])
	    );
	    THREE.GeometryUtils.merge(geometry, mesh);
	}
	var material = new THREE.MeshBasicMaterial({color: this.options.color});
	this.mesh = new THREE.Mesh(geometry, material);
    }

    Particles.prototype.getDataRanges = function(){
	return this.ranges;
    }
    
    Particles.prototype.hasLegend = function(){
	return this.options.has_legend;
    }

    Particles.prototype.addLegend = function(svg){
    }
    
    Particles.prototype.getMesh = function(){
	return this.mesh;
    };

    return Particles;
});
