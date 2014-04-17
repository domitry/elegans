define([
    "charts/base",
    "components/world",
    "components/space",
    "components/legend",
    "utils/utils"
],function(Base, World, Space, Legend, Utils){

    function Surface(selection){
	Utils.mixin(this, Base);
	Utils.merge(this.options, {
	    fill_colors:colorbrewer.Reds[3]
	});
	
	// generate world //
	var world, world_options = {
	    width:this.options.width,
	    height:this.options.height,
	    bg_color:this.options.bg_color
	};
	selection.each(function(data){world = new World(this, world_options);});
	
	// add space to world //
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
	var space = new Space(ranges);
	world.addMesh(space.getMesh());

	// add surface //
	var med = (ranges[2][0]+ranges[2][1])/2;
	var color_scale =
	    d3.scale.linear().domain([ranges[2][1],med,ranges[2][0]]).range(this.options.fill_colors);
	var surface = generateMesh(data, space.getScales(), color_scale);
	world.addMesh(surface);

	// add legend //
	if(this.options.legend == true){
	    var legend = new Legend();
	    legend.addContinuousColormap(ranges[2], this.options.fill_colors);
	}
	world.begin();
    }

    function generateMesh(data, scales, color_scale){
	var geometry = new THREE.Geometry();
	var width = data.length, height = data[0].length;
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
	var mesh = new THREE.Mesh(geometry, material);
	return mesh;
    }

    Surface.fill_colors = function(_){
	if(!arguments.length)return this.options.bg_color;
	this.options.fill_colors = _;
    }

    return Surface;
});
