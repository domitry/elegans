define([
    "components/legends",
    "utils/utils",
    "utils/range",
    "utils/datasets",
    "utils/colorbrewer"
],function(Legends, Utils, Range, Datasets, colorbrewer){
    function Line(data, options){
	    this.options = {
	        name: "Line",
	        colors: colorbrewer.Blues[3],
	        thickness: 1,
	        has_legend: true
	    };

	    if(arguments.length > 1){
	        Utils.merge(this.options, options);
	    }

	    this.data = data;
	    this.dataset = new Datasets.Array(data);
	    this.ranges = this.dataset.ranges;
    }

    Line.prototype.generateMesh = function(scales){
        var data = new Datasets.Array(this.data).raw;
	    var geometry = new THREE.Geometry();
	    var range = new Range(data.x.length, 0);
	    var color_scale = d3.scale.linear()
	            .domain(range.divide(this.options.colors.length))
	            .range(this.options.colors);
	    for(var i=0;i<data.x.length;i++){
	        geometry.vertices.push(new THREE.Vector3(
		        scales.x(data.x[i]),
		        scales.y(data.y[i]),
		        scales.z(data.z[i])
	        ));
	        geometry.colors.push(new THREE.Color(color_scale(i)));
	    }
	    geometry.colorsNeedUpdate = true;
	    var material = new THREE.LineBasicMaterial({vertexColors:THREE.VertexColors, linewidth:this.options.thickness, transparent:true});
	    this.mesh = new THREE.Line(geometry, material);
    };

    Line.prototype.getDataRanges = function(){
	    return this.ranges;
    };
    
    Line.prototype.hasLegend = function(){
	    return this.options.has_legend;
    };

    Line.prototype.disappear = function(){
	    this.mesh.material.opacity = 0;
	    this.mesh.material.needsUpdate = true;
    };

    Line.prototype.appear = function(){
	    this.mesh.material.opacity = 1;
    };

    Line.prototype.getLegend = function(){
	    return Legends.generateDiscreteLegend(this.options.name, this.options.colors[0], this);
    };
    
    Line.prototype.getMesh = function(){
	    return this.mesh;
    };

    return Line;
});
