define([
    "underscore",
    "components/legends",
    "utils/utils",
    "utils/datasets",
    "utils/colorbrewer"
],function(_, Legends, Utils, Datasets, colorbrewer){
    function Particles(data, options){
	    this.options = {
	        name: "Particle",
	        color: colorbrewer.Reds[3],
	        size: 0.3,
	        has_legend: true,
		fill_by: null,
		fill_by_range: null
	    };

	    if(arguments.length > 1){
	        Utils.merge(this.options, options);
	    }

	    this.data = data;
    }

    Particles.prototype.generateMesh = function(scales){
	var data = new Datasets.Array(this.data).raw;
	var meshes = [];
	for(var i=0;i<data.x.length;i++){
	    var mesh = new THREE.Mesh(new THREE.SphereGeometry(this.options.size));
	    mesh.position.set(
		scales.x(data.x[i]),
		scales.y(data.y[i]),
		scales.z(data.z[i])
	    );
	    meshes.push(mesh);
	}

	if(this.options.fill_by){
	    var fill_by_column = data[this.options.fill_by];
	    var range;
	    if(_.isNull(this.options.fill_by_range))
		range = _.map(['min', 'max'], function(name){return _[name](fill_by_column);});
	    else
		range = this.options.fill_by_range;

	    var domain = _.range(range[0], range[1]+1, (range[1]-range[0])/(this.options.color.length));
	    var color_scale = d3.scale.linear()
		    .domain(domain)
		    .range(this.options.color);
	    this.mesh = _.map(meshes, _.bind(function(mesh, i){
		var color = color_scale(fill_by_column[i]);
		mesh.material = new THREE.MeshBasicMaterial({transparent:true, color: color});
		return mesh;
	    }, this));
	}else{
	    var color = (_.isArray(this.options.color) ? this.options.color.shift() : this.options.color);
	    var material = new THREE.MeshBasicMaterial({transparent:true, color: color});
	    _.each(meshes, function(mesh){mesh.material = material;});
	    this.mesh = meshes;
	}
    };

    Particles.prototype.getDataRanges = function(){
	    var dataset = new Datasets.Array(this.data);
	    return dataset.ranges;
    };
    
    Particles.prototype.hasLegend = function(){
	    return this.options.has_legend;
    };

    Particles.prototype.disappear = function(){
	_.each(this.mesh, function(mesh){
	    mesh.material.opacity = 0;
	    mesh.material.needsUpdate = true;
	});
    };

    Particles.prototype.appear = function(){
	_.each(this.mesh, function(mesh){
	    mesh.material.opacity = 1;
	});
    };

    Particles.prototype.getLegend = function(){
	    return Legends.generateDiscreteLegend(this.options.name, this.options.color, this);
    };
    
    Particles.prototype.getMesh = function(){
	    return this.mesh;
    };

    return Particles;
});
