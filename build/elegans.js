(function (root, initialize){
    root.Elegans = initialize();
}(this, function(){
    //modules here
/**
 * @license almond 0.2.9 Copyright (c) 2011-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice,
        jsSuffixRegExp = /\.js$/;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);
                name = name.split('/');
                lastIndex = name.length - 1;

                // Node .js allowance:
                if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                    name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                }

                name = baseParts.concat(name);

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            callbackType = typeof callback,
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback ? callback.apply(defined[name], args) : undefined;

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (config.deps) {
                req(config.deps, config.callback);
            }
            if (!callback) {
                return;
            }

            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("vendor/almond/almond", function(){});

define('components/world',[],function(){

    var world, animate;

    function World(options){
	this.scene = new THREE.Scene();

	// Perspective Camera Support
	//var VIEW_ANGLE=45, ASPECT=SCREEN_WIDTH/SCREEN_HEIGHT, NEAR=0.1, FAR=2000;
	//camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);

	this.camera = new THREE.OrthographicCamera(-20,20,-20,20);
	this.scene.add(this.camera);
	this.camera.position.set(-30, 31,42);
	//this.camera.lookAt(this.scene.position);
	this.camera.rotation.set(-0.6,-0.5,0.6);

	var positions = [[1,1,1],[-1,-1,1],[-1,1,1],[1,-1,1]];
	for(var i=0;i<4;i++){
	    var light=new THREE.DirectionalLight(0xdddddd);
	    light.position.set(positions[i][0],positions[i][1],1*positions[i][2]);
	    this.scene.add(light);
	}

	this.controls = new THREE.TrackballControls(this.camera);
	this.renderer = new THREE.WebGLRenderer({antialias:true});
	this.renderer.setSize(options.width, options.height);
	this.renderer.setClearColor(options.bg_color, 1);

	this.camera.position.set(-30, 31,42);
	this.camera.rotation.set(-0.6,-0.5,0.6);

	return this;
    }

    World.prototype.begin = function(selection){
	var element;
	selection.each(function(){element = this});
	element.appendChild(this.renderer.domElement);
	world = this;
	this.animate();
    }

    World.prototype.animate = function(){
	requestAnimationFrame(world.animate);
	world.renderer.render(world.scene, world.camera);
	world.controls.update();
    }

    World.prototype.addMesh = function(mesh){
	if(mesh instanceof Array){
	    for(var i=0; i<mesh.length; i++){
		this.scene.add(mesh[i]);
	    }
	}
	else{
	    this.scene.add(mesh);
	}
    }

    return World;
});

define('components/space',[],function(){
    function Space(ranges){
	var BIGIN=-10, END=10, WIDTH=END-BIGIN;
	var geometry = new THREE.PlaneGeometry(WIDTH,WIDTH);
	var material = new THREE.MeshBasicMaterial({color:0xf0f0f0, shading: THREE.FlatShading, overdraw: 0.5, side: THREE.DoubleSide});

	var xy_plane = new THREE.Mesh(geometry, material);
	var xz_plane = new THREE.Mesh(geometry, material);
	var yz_plane = new THREE.Mesh(geometry, material);

	var newV = function(x,y,z){return new THREE.Vector3(x,y,z);}

	xz_plane.rotateOnAxis(newV(1,0,0), Math.PI/2);
	xz_plane.translateOnAxis(newV(0,1,0), 10);
	xz_plane.translateOnAxis(newV(0,0,1), 10);

	yz_plane.rotateOnAxis(newV(0,1,0), Math.PI/2);
	yz_plane.translateOnAxis(newV(-1,0,0), 10);
	yz_plane.translateOnAxis(newV(0,0,1), 10);

	this.scales = {};
	this.scales.x = d3.scale.linear().domain([ranges.x.max, ranges.x.min]).range([10, -10])
	this.scales.y = d3.scale.linear().domain([ranges.y.max, ranges.y.min]).range([10, -10])
	this.scales.z = d3.scale.linear().domain([ranges.z.max, ranges.z.min]).range([15,0])

	this.meshes = [];

	this.meshes.push(xy_plane);
	this.meshes.push(xz_plane);
	this.meshes.push(yz_plane);

	// generate axis (dirty. must be modified.)
	var x_scale = d3.scale.linear().domain([ranges.x.max, ranges.x.min]).range([20, 0]);
	var y_scale = d3.scale.linear().domain([ranges.y.max, ranges.y.min]).range([20, 0]);
	var z_scale = d3.scale.linear().domain([ranges.z.max, ranges.z.min]).range([15,0]);
	this.meshes = this.meshes.concat(generateAxisAndLabels(newV(-10,10,0),newV(10,10,0),newV(0,1,0),x_scale));
	this.meshes = this.meshes.concat(generateAxisAndLabels(newV(-10,-10,0),newV(-10,10,0),newV(-1,0,0),y_scale));
	this.meshes = this.meshes.concat(generateAxisAndLabels(newV(10,10,0),newV(10,10,20),newV(0,1,0),z_scale));

	// generate grids
	this.meshes.push(generateGrid([-10,10],[-10,10],[0,0],2));//x-y
	this.meshes.push(generateGrid([-10,10],[-10,-10],[0,20],2));//x-z
	this.meshes.push(generateGrid([10,10],[-10,10],[0,20],2));//y-z

	return this;
    }

    var generateAxisAndLabels = function(axis_start, axis_end, nv_tick, scale){
	var meshes = [];
	var geometry = new THREE.Geometry();
	var nv_start2end = (new THREE.Vector3).subVectors(axis_end, axis_start).normalize();
	var generateLabel = function(text, position){
	    var geometry = new THREE.TextGeometry(text, {size:0.6, font:"helvetiker", height:0.1});
	    var material = new THREE.MeshBasicMaterial({color:0x000000});
	    mesh = new THREE.Mesh(geometry, material);
	    mesh.position = position;
	    return mesh;
	}

	geometry.vertices.push(axis_start);
	geometry.vertices.push(axis_end);

	// generate d3.js axis
	var svg = d3.select("body")
	    .append("svg")
	    .style("width", "500")
	    .style("height", "500")
	    .style("display", "none")
	var ticks = svg.append("g")
	    .call(d3.svg.axis()
		  .scale(scale)
		  .orient("left")
		  .ticks(5))
	    .selectAll(".tick");

	// parse svg axis, and generate ticks and labels mimicing svg's.
	tick_values = [];
	for(var i=0; i<ticks[0].length; i++){
	    // generate tick line
	    attr = ticks[0][i].getAttribute("transform");
	    valueArr = /translate\(((?:-|\d|.)+),((?:-|\d|.)+)\)/g.exec(attr);
	    var nv_s2e = (new THREE.Vector3).copy(nv_start2end);
	    var nv_t = (new THREE.Vector3).copy(nv_tick);
	    var tick_center = (new THREE.Vector3).addVectors(axis_start, nv_s2e.multiplyScalar(valueArr[2]));
	    var tick_start = (new THREE.Vector3).addVectors(tick_center, nv_t.multiplyScalar(0.3));
	    nv_t.copy(nv_tick);
	    var tick_end = (new THREE.Vector3).addVectors(tick_center, nv_t.multiplyScalar(-0.3));
	    geometry.vertices.push(tick_start);
	    geometry.vertices.push(tick_end);

	    //generate labels
	    var text = ticks[0][i].children[1].childNodes[0].nodeValue;
	    nv_t.copy(nv_tick);
	    var label_center = (new THREE.Vector3).addVectors(tick_center ,nv_t.multiplyScalar(1.0));
	    label = generateLabel(text, label_center);
	    meshes.push(label);
	}

	svg.remove();

	var material = new THREE.LineBasicMaterial( { color: 0x000000, opacity: 0.2 } );
	var line = new THREE.Line(geometry, material);
	line.type = THREE.LinePieces;
	meshes.push(line);
	return meshes;
    }

    var generateGrid = function(x_range, y_range, z_range, interval){
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

    Space.prototype.getMeshes = function(){
	return this.meshes;
    };

    return Space;
});

define('utils/utils',[],function(){
    var mixin = function(sub, sup) {
	sup.call(sub);
    };

    var merge = function(dest, src){
	for(var key in src){
	    dest[key] = src[key];
	}
    }

    exports = {
	mixin:mixin,
	merge:merge
    };

    return exports;
});

define('components/stage',[
    "components/world",
    "components/space",
    "utils/utils"
], function(World, Space, Utils){
    function Stage(element, options){
	this.options = {
	    width:700,
	    height:500,
	    world_width:500,
	    bg_color:0xffffff
	};

	if(arguments.length > 1){
	    Utils.merge(this.options, options);
	};
	
	var selection = d3.select(element);
	selection.style("width",String(this.options.width));

	this.world_space = selection.append("div")
	    .style("float","left")
	    .style("width",String(this.options.world_width))
	    .style("height",String(this.options.height));
	this.legend_space = selection.append("svg")
	    .style("float","left")
	    .style("width",String(this.options.width - this.options.world_width))
	    .style("height",String(this.options.height));
	this.charts = [];

	return this;
    }

    Stage.prototype.render = function(){
	this.world.begin(this.world_space);
    }    

    Stage.prototype.add = function(chart){
	if(this.charts.length == 0){
	    this.world = new World({
		width:this.options.world_width,
		height:this.options.height,
		bg_color:this.options.bg_color
	    });
  	    
	    this.space = new Space(chart.getDataRanges());
	    this.world.addMesh(this.space.getMeshes());
	}else{
	    // check ranges of data, and expand space if it is bigger than of data previous charts have
	    // (not implemented yet)
	}

	chart.generateMesh(this.space.getScales());
	this.world.addMesh(chart.getMesh());

	// dirty. must be modified.
	if(chart.hasLegend())chart.addLegend(this.legend_space);

	this.charts.push(chart);
    }

    return Stage;
});

define('components/legends',[],function(){

    function addContinuousLegend(svg, range, color){
	var scale = d3.scale.linear().domain([range.max, range.min]).range([0,200]);

	var gradient = svg.append("svg:defs")
	    .append("svg:linearGradient")
	    .attr("id", "gradient")
	    .attr("x1", "0%")
	    .attr("x2", "0%")
	    .attr("y1", "100%")
	    .attr("y2", "0%");

	for(var i=0; i<color.length; i++){
	    gradient.append("svg:stop")
		.attr("offset", (100/(color.length-1))*i + "%")
		.attr("stop-color", color[i]);
	}

	var group = svg.append("g");

	group.append("svg:rect")
	    .attr("y",10)
	    .attr("width", "25")
	    .attr("height", "200")
	    .style("fill", "url(#gradient)");
	
	svg.append("g")
	    .attr("width", "100")
	    .attr("height", "200")
	    .attr("class", "axis")
	    .attr("transform", "translate(25,10)")
	    .call(d3.svg.axis()
		  .scale(scale)
		  .orient("right")
		  .ticks(5));
    };

    var Legends = {
	addContinuousLegend:addContinuousLegend
    };

    return Legends;
});

define('utils/range',[],function(){
    function Range(max, min){
	this.max = max;
	this.min = min;
    }

    Range.prototype.divide = function(num){
	var arr = new Array();
	var interval = Math.ceil((this.max-this.min)/(num-1));
	for(var i=0;i<num;i++){
	    arr.push(this.min + interval*i);
	}
	return arr;
    }

    return Range;
});

define('utils/datasets',[
    "utils/range"
],function(Range){
    function MatrixDataset(data){
	var ranges = new Array();
	var functions = [
	    function(val){return val.x},
	    function(val){return val.y},
	    function(val){return val.z}
	];
	for(var i=0;i<3;i++){
	    ranges[i] = new Range(
		d3.max(data, function(d){return d3.max(d, functions[i])}),
		d3.min(data, function(d){return d3.min(d, functions[i])})
	    );
	}
	this.ranges = {x:ranges[0], y:ranges[1], z:ranges[2]};
	this.data = data;
	return this;
    }

    MatrixDataset.prototype.getRanges = function(){
	return this.ranges;
    };

    Datasets = {
	Matrix:MatrixDataset
    };

    return Datasets;
});

define('charts/surface',[
    "components/legends",
    "utils/utils",
    "utils/datasets"
],function(Legends, Utils, Datasets){
    function Surface(data, options){
	this.options = {
	    fill_colors: colorbrewer.Reds[3],
	    has_legend: true
	};

	if(arguments.length > 1){
	    Utils.merge(this.options, options);
	}

	this.dataset = new Datasets.Matrix(data);
	this.ranges = this.dataset.getRanges();
	this.color_scale =
	    d3.scale.linear()
	    .domain(this.ranges.z.divide(this.options.fill_colors.length))
	    .range(this.options.fill_colors);
    }

    Surface.prototype.generateMesh = function(scales){
	var data = this.dataset.data;
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

    Surface.prototype.getDataRanges = function(){
	return this.ranges;
    }
    
    Surface.prototype.hasLegend = function(){
	return this.options.has_legend;
    }

    Surface.prototype.addLegend = function(svg){
	Legends.addContinuousLegend(svg, this.ranges.z, this.options.fill_colors);
    }
    
    Surface.prototype.getMesh = function(){
	return this.mesh
    };

    return Surface;
});

define('quick/base',[],function(){
    /********************************
      Base function of all quick functions
     **********************************/
    Base = function(){	
	this.options = {};

	// getters and setters
	this.width = function(_){
	    if(!arguments.length)return this.options.width;
	    this.options.width = _;
	};

	this.height = function(_){
	    if(!arguments.length)return this.options.height;
	    this.options.height = _;
	};

	this.bg_color = function(_){
	    if(!arguments.length)return this.options.bg_color;
	    this.options.bg_color = _;
	}

	this.legend = function(_){
	    if(!arguments.length)return this.options.legend;
	    this.options.legend = _;
	}
    }
    return Base;
});

define('quick/surface_plot',[
    "components/stage",
    "quick/base",
    "charts/surface",
    "utils/utils"
],function(Stage, Base, Surface, Utils){

    function SurfacePlot(selection){
	selection.each(function(data){
	    var stage = new Stage(this);
	    stage.add(new Surface(data, options));
	    stage.render();
	});
    }

    Utils.mixin(SurfacePlot, Base);

    SurfacePlot.fill_colors = function(_){
	if(!arguments.length)return this.options.bg_color;
	this.options.fill_colors = _;
	options = this.options;
	return this;
    }

    return SurfacePlot;
});

define('main',['require','exports','module','components/stage','charts/surface','quick/surface_plot'],function(require, exports, module){
    Elegans = {};

    /***************************
      Prototype Objects for plotting
      e.g. var stage = new Elegant.Stage(d3.select("#vis"), {width:500, height:500});
           stage.add(new Elegant.Surface(data, {fill_colors:[#000000, #ffffff]}));
           stage.render();
    ****************/

    Elegans.Stage = require("components/stage");
    Elegans.Surface = require("charts/surface");
    //Elegans.Scatter = require("charts/scatter");
    //Elegans.Wireframe = require("charts/wireframe");

    /***************************
      Functions for quick plotting with method chain style  
      e.g. d3.select('#vis').datum(data).call(Elegans.SurfacePlot);
    ****************/

    Elegans.SurfacePlot = require("quick/surface_plot");
    //Elegans.ScatterPlot = require("quick/scatter_plot");
    //Elegans.WireframePlot = require("quick/wireframe_plot");

    return Elegans;
});

return require('main');
}));