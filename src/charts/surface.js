define([
    "components/legends",
    "utils/utils",
    "utils/datasets",
    "utils/colorbrewer"
],function(Legends, Utils, Datasets, colorbrewer){
    function Surface(data, options){
	this.options = {
	    fill_colors: colorbrewer.Reds[3],
	    has_legend: true
	};

	if(arguments.length > 1){
	    Utils.merge(this.options, options);
	}

	this.dataset = new Datasets.Matrix(data);
	this.ranges = this.dataset.ranges;
    }

    Surface.prototype.generateMesh = function(scales){
	var data = this.dataset.raw;
	var geometry = new THREE.Geometry();
	var color_scale = d3.scale.linear()
	    .domain(this.ranges.z.divide(this.options.fill_colors.length))
	    .range(this.options.fill_colors);
	var colors = [];
	var offset = function(x,y){return x*width+y;};
	var fillFace = function(geometry, p1, p2, p3, colors){
	    var vec0 = new THREE.Vector3(), vec1 = new THREE.Vector3();
	    vec0.subVectors(geometry.vertices[p1],geometry.vertices[p2]);
	    vec1.subVectors(geometry.vertices[p1],geometry.vertices[p3]);
	    vec1.cross(vec0).normalize();
	    var color_arr = [colors[p1], colors[p2], colors[p3]];
	    geometry.faces.push(new THREE.Face3(p1, p2, p3, vec1, color_arr));
	    color_arr = [colors[p3], colors[p2], colors[p1]];
	    geometry.faces.push(new THREE.Face3(p3, p2, p1, vec1.negate(), color_arr));
	}
	var width = data.x.length, height = data.x[0].length;

	for(var i=0;i<width;i++){
	    for(var j=0;j<height;j++){
		geometry.vertices.push(new THREE.Vector3(
		    scales.x(data.x[i][j]),
		    scales.y(data.y[i][j]),
		    scales.z(data.z[i][j])
		));
		colors.push(new THREE.Color(color_scale(data.z[i][j])));
	    }
	}

	for(var x=0;x<width-1;x++){
	    for(var y=0;y<height-1;y++){
		fillFace(geometry, offset(x,y), offset(x+1,y), offset(x,y+1), colors);
		fillFace(geometry, offset(x+1,y), offset(x+1,y+1), offset(x, y+1), colors);
	    }
	}
	var material = new THREE.MeshBasicMaterial({ vertexColors: THREE.VertexColors});
	this.mesh = new THREE.Mesh(geometry, material);
    }

    Surface.prototype.getDataRanges = function(){
	return this.ranges;
    }
    
    Surface.prototype.hasLegend = function(){
	return this.options.has_legend;
    }

    Surface.prototype.getLegend = function(){
	return Legends.generateContinuousLegend(this.ranges.z, this.options.fill_colors);
    }
    
    Surface.prototype.getMesh = function(){
	return this.mesh;
    };

    return Surface;
});
