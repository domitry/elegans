define([
    "components/legends",
    "utils/utils"
],function(Legends, Utils){
    function Surface(data, options){
	this.options = {
	    fill_colors: colorbrewer.Reds[3],
	    has_legend: true
	};

	if(arguments.length > 1){
	    Utils.merge(this.options, options);
	}
	
	ranges = [];
	var functions = [
	    function(val){return val.x},
	    function(val){return val.y},
	    function(val){return val.z}
	];
	for(var i=0;i<3;i++){
	    ranges[i] = [
		d3.max(data, function(d){return d3.max(d, functions[i])}),
		d3.min(data, function(d){return d3.min(d, functions[i])})
	    ];
	}

	var med = (ranges[2][0]+ranges[2][1])/2;
	this.color_scale =
	    d3.scale.linear().domain([ranges[2][1],med,ranges[2][0]]).range(this.options.fill_colors);
	this.ranges = ranges; //dirty. must be modified.
	this.data = data;
    }

    Surface.prototype.getDataRanges = function(){
	return this.ranges;
    }
    
    Surface.prototype.hasLegend = function(){
	return this.options.has_legend;
    }

    Surface.prototype.addLegend = function(svg){
	Legends.addContinuousLegend(svg, this.ranges[2], this.options.fill_colors);
    }
    
    Surface.prototype.getMesh = function(){return this.mesh};

    Surface.prototype.generateMesh = function(scales){
	var data = this.data;
	var geometry = new THREE.Geometry();
	var width = data.length, height = data[0].length;
	var color_scale = this.color_scale;
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

	data.forEach(function(col){
	    col.forEach(function(val){
		geometry.vertices.push(new THREE.Vector3(
		    scales.x(val.x),
		    scales.y(val.y),
		    scales.z(val.z)
		));
		colors.push(new THREE.Color(color_scale(val.z)));
	    });
	});

	for(var x=0;x<width-1;x++){
	    for(var y=0;y<height-1;y++){
		fillFace(geometry, offset(x,y), offset(x+1,y), offset(x,y+1), colors);
		fillFace(geometry, offset(x+1,y), offset(x+1,y+1), offset(x, y+1), colors);
	    }
	}
	var material = new THREE.MeshBasicMaterial({ vertexColors: THREE.VertexColors});
	this.mesh = new THREE.Mesh(geometry, material);
    }

    return Surface;
});
