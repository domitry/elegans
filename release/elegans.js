(function (root, initialize){
    var Elegans = initialize();
    if(typeof define !== "undefined" && define.amd)define(Elegans);
    root.Elegans = Elegans;
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

define("../lib/almond/almond", function(){});

/**
 * @author Eberhard Graether / http://egraether.com/
 */
define('utils/TrackballControls',[],function(){
    TrackballControls = function ( object, domElement ) {

	var _this = this;
	var STATE = { NONE: -1, ROTATE: 0, ZOOM: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_ZOOM: 4, TOUCH_PAN: 5 };

	this.object = object;
	this.domElement = ( domElement !== undefined ) ? domElement : document;

	// API

	this.enabled = true;

	this.screen = { width: 0, height: 0, offsetLeft: 0, offsetTop: 0 };
	this.radius = ( this.screen.width + this.screen.height ) / 4;

	this.rotateSpeed = 1.0;
	this.zoomSpeed = 1.2;
	this.panSpeed = 0.3;

	this.noRotate = false;
	this.noZoom = false;
	this.noPan = false;

	this.staticMoving = false;
	this.dynamicDampingFactor = 0.2;

	this.minDistance = 0;
	this.maxDistance = Infinity;

	this.keys = [ 65 /*A*/, 83 /*S*/, 68 /*D*/ ];

	// internals

	this.target = new THREE.Vector3();

	var lastPosition = new THREE.Vector3();

	var _state = STATE.NONE,
	_prevState = STATE.NONE,

	_eye = new THREE.Vector3(),

	_rotateStart = new THREE.Vector3(),
	_rotateEnd = new THREE.Vector3(),

	_zoomStart = new THREE.Vector2(),
	_zoomEnd = new THREE.Vector2(),

	_touchZoomDistanceStart = 0,
	_touchZoomDistanceEnd = 0,

	_panStart = new THREE.Vector2(),
	_panEnd = new THREE.Vector2();

	// for reset

	this.target0 = this.target.clone();
	this.position0 = this.object.position.clone();
	this.up0 = this.object.up.clone();

	// events

	var changeEvent = { type: 'change' };


	// methods

	this.handleResize = function () {

	    this.screen.width = window.innerWidth;
	    this.screen.height = window.innerHeight;

	    this.screen.offsetLeft = 0;
	    this.screen.offsetTop = 0;

	    this.radius = ( this.screen.width + this.screen.height ) / 4;

	};

	this.handleEvent = function ( event ) {

	    if ( typeof this[ event.type ] == 'function' ) {

		this[ event.type ]( event );

	    }

	};

	this.getMouseOnScreen = function ( clientX, clientY ) {

	    return new THREE.Vector2(
		( clientX - _this.screen.offsetLeft ) / _this.radius * 0.5,
		( clientY - _this.screen.offsetTop ) / _this.radius * 0.5
	    );

	};

	this.getMouseProjectionOnBall = function ( clientX, clientY ) {

	    var mouseOnBall = new THREE.Vector3(
		( clientX - _this.screen.width * 0.5 - _this.screen.offsetLeft ) / _this.radius,
		( _this.screen.height * 0.5 + _this.screen.offsetTop - clientY ) / _this.radius,
		0.0
	    );

	    var length = mouseOnBall.length();

	    if ( length > 1.0 ) {

		mouseOnBall.normalize();

	    } else {

		mouseOnBall.z = Math.sqrt( 1.0 - length * length );

	    }

	    _eye.copy( _this.object.position ).sub( _this.target );

	    var projection = _this.object.up.clone().setLength( mouseOnBall.y );
	    projection.add( _this.object.up.clone().cross( _eye ).setLength( mouseOnBall.x ) );
	    projection.add( _eye.setLength( mouseOnBall.z ) );

	    return projection;

	};

	this.rotateCamera = function () {

	    var angle = Math.acos( _rotateStart.dot( _rotateEnd ) / _rotateStart.length() / _rotateEnd.length() );

	    if ( angle ) {

		var axis = ( new THREE.Vector3() ).crossVectors( _rotateStart, _rotateEnd ).normalize(),
		quaternion = new THREE.Quaternion();

		angle *= _this.rotateSpeed;

		quaternion.setFromAxisAngle( axis, -angle );

		_eye.applyQuaternion( quaternion );
		_this.object.up.applyQuaternion( quaternion );

		_rotateEnd.applyQuaternion( quaternion );

		if ( _this.staticMoving ) {

		    _rotateStart.copy( _rotateEnd );

		} else {

		    quaternion.setFromAxisAngle( axis, angle * ( _this.dynamicDampingFactor - 1.0 ) );
		    _rotateStart.applyQuaternion( quaternion );

		}

	    }

	};

	this.zoomCamera = function () {

	    if ( _state === STATE.TOUCH_ZOOM ) {

		var factor = _touchZoomDistanceStart / _touchZoomDistanceEnd;
		_touchZoomDistanceStart = _touchZoomDistanceEnd;
		_eye.multiplyScalar( factor );

	    } else {

		var factor = 1.0 + ( _zoomEnd.y - _zoomStart.y ) * this.zoomSpeed;

		if ( factor !== 1.0 && factor > 0.0 ) {

		    if ( this.object instanceof THREE.PerspectiveCamera ) {

			_eye.multiplyScalar( factor );

		    } else {

			this.object.left *= factor;
			this.object.right *= factor;
			this.object.top *= factor;
			this.object.bottom *= factor;

			this.object.updateProjectionMatrix();
		    }

		    if ( _this.staticMoving ) {

			_zoomStart.copy( _zoomEnd );

		    } else {

			_zoomStart.y += ( _zoomEnd.y - _zoomStart.y ) * this.dynamicDampingFactor;

		    }

		}
	    }
	};

	this.panCamera = function () {

	    var mouseChange = _panEnd.clone().sub( _panStart );

	    if ( mouseChange.lengthSq() ) {

		mouseChange.multiplyScalar( _eye.length() * _this.panSpeed );

		var pan = _eye.clone().cross( _this.object.up ).setLength( mouseChange.x );
		pan.add( _this.object.up.clone().setLength( mouseChange.y ) );

		_this.object.position.add( pan );
		_this.target.add( pan );

		if ( _this.staticMoving ) {

		    _panStart = _panEnd;

		} else {

		    _panStart.add( mouseChange.subVectors( _panEnd, _panStart ).multiplyScalar( _this.dynamicDampingFactor ) );

		}

	    }

	};

	this.checkDistances = function () {

	    if ( !_this.noZoom || !_this.noPan ) {

		if ( _this.object.position.lengthSq() > _this.maxDistance * _this.maxDistance ) {

		    _this.object.position.setLength( _this.maxDistance );

		}

		if ( _eye.lengthSq() < _this.minDistance * _this.minDistance ) {

		    _this.object.position.addVectors( _this.target, _eye.setLength( _this.minDistance ) );

		}

	    }

	};

	this.update = function () {

	    _eye.subVectors( _this.object.position, _this.target );

	    if ( !_this.noRotate ) {

		_this.rotateCamera();

	    }

	    if ( !_this.noZoom ) {

		_this.zoomCamera();

	    }

	    if ( !_this.noPan ) {

		_this.panCamera();

	    }

	    _this.object.position.addVectors( _this.target, _eye );

	    _this.checkDistances();

	    _this.object.lookAt( _this.target );

	    if ( lastPosition.distanceToSquared( _this.object.position ) > 0 ) {

		_this.dispatchEvent( changeEvent );

		lastPosition.copy( _this.object.position );

	    }

	};

	this.reset = function () {

	    _state = STATE.NONE;
	    _prevState = STATE.NONE;

	    _this.target.copy( _this.target0 );
	    _this.object.position.copy( _this.position0 );
	    _this.object.up.copy( _this.up0 );

	    _eye.subVectors( _this.object.position, _this.target );

	    _this.object.lookAt( _this.target );

	    _this.dispatchEvent( changeEvent );

	    lastPosition.copy( _this.object.position );

	};

	// listeners

	function keydown( event ) {

	    if ( _this.enabled === false ) return;

	    window.removeEventListener( 'keydown', keydown );

	    _prevState = _state;

	    if ( _state !== STATE.NONE ) {

		return;

	    } else if ( event.keyCode === _this.keys[ STATE.ROTATE ] && !_this.noRotate ) {

		_state = STATE.ROTATE;

	    } else if ( event.keyCode === _this.keys[ STATE.ZOOM ] && !_this.noZoom ) {

		_state = STATE.ZOOM;

	    } else if ( event.keyCode === _this.keys[ STATE.PAN ] && !_this.noPan ) {

		_state = STATE.PAN;

	    }

	}

	function keyup( event ) {

	    if ( _this.enabled === false ) return;

	    _state = _prevState;

	    window.addEventListener( 'keydown', keydown, false );

	}

	function mousedown( event ) {

	    if ( _this.enabled === false ) return;

	    event.preventDefault();
	    event.stopPropagation();

	    if ( _state === STATE.NONE ) {

		_state = event.button;

	    }

	    if ( _state === STATE.ROTATE && !_this.noRotate ) {

		_rotateStart = _rotateEnd = _this.getMouseProjectionOnBall( event.clientX, event.clientY );

	    } else if ( _state === STATE.ZOOM && !_this.noZoom ) {

		_zoomStart = _zoomEnd = _this.getMouseOnScreen( event.clientX, event.clientY );

	    } else if ( _state === STATE.PAN && !_this.noPan ) {

		_panStart = _panEnd = _this.getMouseOnScreen( event.clientX, event.clientY );

	    }

	    document.addEventListener( 'mousemove', mousemove, false );
	    document.addEventListener( 'mouseup', mouseup, false );

	}

	function mousemove( event ) {

	    if ( _this.enabled === false ) return;

	    event.preventDefault();
	    event.stopPropagation();

	    if ( _state === STATE.ROTATE && !_this.noRotate ) {

		_rotateEnd = _this.getMouseProjectionOnBall( event.clientX, event.clientY );

	    } else if ( _state === STATE.ZOOM && !_this.noZoom ) {

		_zoomEnd = _this.getMouseOnScreen( event.clientX, event.clientY );

	    } else if ( _state === STATE.PAN && !_this.noPan ) {

		_panEnd = _this.getMouseOnScreen( event.clientX, event.clientY );

	    }

	}

	function mouseup( event ) {

	    if ( _this.enabled === false ) return;

	    event.preventDefault();
	    event.stopPropagation();

	    _state = STATE.NONE;

	    document.removeEventListener( 'mousemove', mousemove );
	    document.removeEventListener( 'mouseup', mouseup );

	}

	function mousewheel( event ) {

	    if ( _this.enabled === false ) return;

	    event.preventDefault();
	    event.stopPropagation();

	    var delta = 0;

	    if ( event.wheelDelta ) { // WebKit / Opera / Explorer 9

		delta = event.wheelDelta / 40;

	    } else if ( event.detail ) { // Firefox

		delta = - event.detail / 3;

	    }

	    _zoomStart.y += delta * 0.01;

	}

	function touchstart( event ) {

	    if ( _this.enabled === false ) return;

	    switch ( event.touches.length ) {

	    case 1:
		_state = STATE.TOUCH_ROTATE;
		_rotateStart = _rotateEnd = _this.getMouseProjectionOnBall( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
		break;

	    case 2:
		_state = STATE.TOUCH_ZOOM;
		var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
		var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
		_touchZoomDistanceEnd = _touchZoomDistanceStart = Math.sqrt( dx * dx + dy * dy );
		break;

	    case 3:
		_state = STATE.TOUCH_PAN;
		_panStart = _panEnd = _this.getMouseOnScreen( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
		break;

	    default:
		_state = STATE.NONE;

	    }

	}

	function touchmove( event ) {

	    if ( _this.enabled === false ) return;

	    event.preventDefault();
	    event.stopPropagation();

	    switch ( event.touches.length ) {

	    case 1:
		_rotateEnd = _this.getMouseProjectionOnBall( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
		break;

	    case 2:
		var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
		var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
		_touchZoomDistanceEnd = Math.sqrt( dx * dx + dy * dy )
		break;

	    case 3:
		_panEnd = _this.getMouseOnScreen( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
		break;

	    default:
		_state = STATE.NONE;

	    }

	}

	function touchend( event ) {

	    if ( _this.enabled === false ) return;

	    switch ( event.touches.length ) {

	    case 1:
		_rotateStart = _rotateEnd = _this.getMouseProjectionOnBall( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
		break;

	    case 2:
		_touchZoomDistanceStart = _touchZoomDistanceEnd = 0;
		break;

	    case 3:
		_panStart = _panEnd = _this.getMouseOnScreen( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
		break;

	    }

	    _state = STATE.NONE;

	}

	this.domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );

	this.domElement.addEventListener( 'mousedown', mousedown, false );

	this.domElement.addEventListener( 'mousewheel', mousewheel, false );
	this.domElement.addEventListener( 'DOMMouseScroll', mousewheel, false ); // firefox

	this.domElement.addEventListener( 'touchstart', touchstart, false );
	this.domElement.addEventListener( 'touchend', touchend, false );
	this.domElement.addEventListener( 'touchmove', touchmove, false );

	window.addEventListener( 'keydown', keydown, false );
	window.addEventListener( 'keyup', keyup, false );

	this.handleResize();

    };

    TrackballControls.prototype = Object.create( THREE.EventDispatcher.prototype );
    THREE.TrackballControls = TrackballControls;
    return TrackballControls;
});

define('components/world',[
    "utils/TrackballControls"
],function(TrackballControls){

    function World(options){
	this.scene = new THREE.Scene();

	this.camera = new THREE.OrthographicCamera(-20,20,-20,20);
	this.camera.position.set(-30, 31,42);
	this.camera.rotation.set(-0.6,-0.5,0.6);
	this.scene.add(this.camera);

	var positions = [[1,1,1],[-1,-1,1],[-1,1,1],[1,-1,1]];
	for(var i=0;i<4;i++){
	    var light=new THREE.DirectionalLight(0xdddddd);
	    light.position.set(positions[i][0],positions[i][1],1*positions[i][2]);
	    this.scene.add(light);
	}

	this.renderer = new THREE.WebGLRenderer({antialias:true});
	this.renderer.setSize(options.width, options.height);
	this.renderer.setClearColor(options.bg_color, 1);
	this.controls = new TrackballControls(this.camera, this.renderer.domElement);
	this.camera.position.set(-30, 31,42);
	this.camera.rotation.set(-0.6,-0.5,0.6);

	return this;
    }

    World.prototype.begin = function(selection){
	selection[0][0].appendChild(this.renderer.domElement);

	var world = this;
	this.animate = function(){
	    requestAnimationFrame(world.animate);
	    world.renderer.render(world.scene, world.camera);
	    world.controls.update();
	};
	this.animate();
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

define('components/space',[
    "utils/utils"
],function(Utils){
    function Space(ranges, options){
	this.options = {
	    axis_labels: {x:"X", y:"Y", z:"Z"}
	};

	if(arguments.length > 1){
	    Utils.merge(this.options, options);
	};
	
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
	this.scales.x = d3.scale.linear().domain([ranges.x.max, ranges.x.min]).range([-10, 10])
	this.scales.y = d3.scale.linear().domain([ranges.y.max, ranges.y.min]).range([10, -10])
	this.scales.z = d3.scale.linear().domain([ranges.z.max, ranges.z.min]).range([15,0])

	this.meshes = [];

	this.meshes.push(xy_plane);
	this.meshes.push(xz_plane);
	this.meshes.push(yz_plane);

	// generate axis
	var x_scale = d3.scale.linear().domain([ranges.x.max, ranges.x.min]).range([20, 0]);
	var y_scale = d3.scale.linear().domain([ranges.y.max, ranges.y.min]).range([20, 0]);
	var z_scale = d3.scale.linear().domain([ranges.z.max, ranges.z.min]).range([15,0]);
	this.meshes = this.meshes.concat(generateAxisAndLabels(this.options.axis_labels.x, newV(10,10,0),newV(-10,10,0),newV(0,1,0),x_scale));
	this.meshes = this.meshes.concat(generateAxisAndLabels(this.options.axis_labels.y, newV(-10,-10,0),newV(-10,10,0),newV(-1,0,0),y_scale));
	this.meshes = this.meshes.concat(generateAxisAndLabels(this.options.axis_labels.z, newV(10,10,0),newV(10,10,20),newV(0,1,0),z_scale));

	// generate grids
	this.meshes.push(generateGrid([-10,10],[-10,10],[0,0],2));//x-y
	this.meshes.push(generateGrid([-10,10],[-10,-10],[0,20],2));//x-z
	this.meshes.push(generateGrid([10,10],[-10,10],[0,20],2));//y-z

	return this;
    }

    var generateLabel = function(text, position){
	var canvas = document.createElement('canvas');
	canvas.width = 100;
	canvas.height = 100;
	var context = canvas.getContext('2d');
	context.fillStyle = "rgb(0, 0, 0)";
	context.font = "60px sans-serif";
	text_width = context.measureText(text).width;
	context.fillText(text, (100-text_width)/2, 80);
	var texture = new THREE.Texture(canvas);
	texture.flipY = false;
	texture.needsUpdate = true;
	var material = new THREE.SpriteMaterial({
	    map: texture,
	    transparent: true,
	    useScreenCoordinates: false
	});
	var sprite = new THREE.Sprite(material);
	sprite.scale.set(1.5,1.5);
	sprite.position = position;
	return sprite;
    }

    var generateAxisAndLabels = function(axis_label, axis_start, axis_end, nv_tick, scale){
	var meshes = [];
	var geometry = new THREE.Geometry();
	var nv_start2end = (new THREE.Vector3).subVectors(axis_end, axis_start).normalize();

	geometry.vertices.push(axis_start);
	geometry.vertices.push(axis_end);

	var label_position = (new THREE.Vector3).addVectors(axis_end, axis_start).divideScalar(2);
	label_position.add(nv_tick.clone().multiplyScalar(3));
	meshes.push(generateLabel(axis_label, label_position));

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
	    var tick_center = (new THREE.Vector3).addVectors(axis_start, nv_start2end.clone().multiplyScalar(valueArr[2]));
	    var tick_start = (new THREE.Vector3).addVectors(tick_center, nv_tick.clone().multiplyScalar(0.3));
	    var tick_end = (new THREE.Vector3).addVectors(tick_center, nv_tick.clone().multiplyScalar(-0.3));
	    geometry.vertices.push(tick_start);
	    geometry.vertices.push(tick_end);

	    //generate labels
	    var text = ticks[0][i].children[1].childNodes[0].nodeValue;
	    var label_center = (new THREE.Vector3).addVectors(tick_center ,nv_tick.clone().multiplyScalar(1.0));
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

    Range.expand = function(range1, range2){
	return new Range(Math.max(range1.max, range2.max), Math.min(range1.min, range2.min));
    }

    return Range;
});

define('components/stage',[
    "components/world",
    "components/space",
    "utils/utils",
    "utils/range"
], function(World, Space, Utils, Range){
    function Stage(element, options){
	this.options = {
	    width:700,
	    height:500,
	    world_width:500,
	    axis_labels: {x:"X", y:"Y", z:"Z"},
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

	this.legend_space = selection.append("div")
	    .style("float","left")
	    .style("width",String(this.options.width - this.options.world_width))
	    .style("height",String(this.options.height));

	this.charts = [];

	this.world = new World({
	    width:this.options.world_width,
	    height:this.options.height,
	    bg_color:this.options.bg_color
	});

	this.data_ranges = {x:new Range(0,0),y:new Range(0,0),z:new Range(0,0)};

	return this;
    }

    Stage.prototype.add = function(chart){
        var ranges = chart.getDataRanges();
        for(var i in ranges){
            this.data_ranges[i] = Range.expand(this.data_ranges[i], ranges[i]);
	}
	this.charts.push(chart);
    }

    Stage.prototype.render = function(){
	this.space = new Space(this.data_ranges, {axis_labels:this.options.axis_labels});
	this.world.addMesh(this.space.getMeshes());
        for(var i=0;i<this.charts.length;i++){
            var chart=this.charts[i];
            chart.generateMesh(this.space.getScales());
	    this.world.addMesh(chart.getMesh());
            if(chart.hasLegend()){
		var legend = chart.getLegend();
		this.legend_space[0][0].appendChild(legend[0][0]);
	    }
        }
	this.world.begin(this.world_space);
    }

    return Stage;
});

define('components/legends',[],function(){

    function generateContinuousLegend(range, color){
	var scale = d3.scale.linear().domain([range.max, range.min]).range([0,200]);

	var div = d3.select(document.createElement("div"))
	    .style("padding", "5px")
	    .style("float", "left")
	    .style("width","100")
	    .style("height","auto");
	
	var svg = div.append("svg")
	    .style("height","100%") // fixed for Mozilla Firefox Bug 736431
	    .style("width", "100px");

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

	svg.selectAll(".axis").selectAll("path")
	    .style("fill", "none")
	    .style("stroke", "black")
	    .style("shape-rendering", "crispEdges");

	svg.selectAll(".axis").selectAll("line")
	    .style("fill", "none")
	    .style("stroke", "black")
	    .style("shape-rendering", "crispEdges");

	svg.selectAll(".axis").selectAll("text")
	    .style("font-family", "san-serif")
	    .style("font-size", "11px");

	return div;
    };

    function generateDiscreteLegend(name, color, chart){
	var div = d3.select(document.createElement("div"))
	    .style("padding", "4")
	    .style("height","16")
	    .style("width","100%");
	
	var svg = div.append("svg")
	    .style("height","30px") // fixed for Mozilla Firefox Bug 736431
	    .style("width", "100px");
	
	var onclick_func = function(event){
	    var element = event.target;
	    if(element.getAttribute("fill-opacity")=="0.0"){
		element.setAttribute("fill-opacity","1.0");
		element.chart.appear();
	    }else{
		element.setAttribute("fill-opacity","0.0");
		element.chart.disappear();
	    }
	};

	var circle = svg.append("circle")
	    .attr("cx","8")
	    .attr("cy","8")
	    .attr("r","6")
	    .attr("stroke",color)
	    .attr("stroke-width","2")
	    .attr("fill",color)
	    .style("cursor","pointer");

	circle[0][0].chart = chart;

	circle[0][0].onclick = onclick_func;

	svg.append("text")
	    .attr("x","18")
	    .attr("y","12")
	    .attr("font-size","12")
	    .text(name);

	return div;
    }

    var Legends = {
	generateContinuousLegend:generateContinuousLegend,
	generateDiscreteLegend:generateDiscreteLegend
    };

    return Legends;
});

define('utils/datasets',[
    "utils/range"
],function(Range){
    function MatrixDataset(data){
	var ranges = {};
	for(i in data){
	    ranges[i] = new Range(
		d3.max(data[i], function(d){return Math.max.apply(null,d);}),
		d3.min(data[i], function(d){return Math.min.apply(null,d);})
	    );
	}
	this.ranges = ranges;
	this.raw = data;
	return this;
    }

    MatrixDataset.prototype.getRanges = function(){
	return this.ranges;
    };

    function ArrayDataset(data){
	this.ranges = {};
	for(var i in data){
	    this.ranges[i] = new Range(
		d3.max(data[i], function(d){return d;}),
		d3.min(data[i], function(d){return d;})
	    );
	}
	this.raw = data;
    }

    ArrayDataset.prototype.getRanges = function(){
	return this.ranges;
    };

    Datasets = {
	Matrix:MatrixDataset,
	Array:ArrayDataset
    };

    return Datasets;
});

// This product includes color specifications and designs developed by Cynthia Brewer (http://colorbrewer.org/).
// JavaScript specs as packaged in the D3 library (d3js.org). Please see license at http://colorbrewer.org/export/LICENSE.txt

define('utils/colorbrewer',[],function(){

    var colorbrewer = {YlGn: {
	3: ["#f7fcb9","#addd8e","#31a354"],
	4: ["#ffffcc","#c2e699","#78c679","#238443"],
	5: ["#ffffcc","#c2e699","#78c679","#31a354","#006837"],
	6: ["#ffffcc","#d9f0a3","#addd8e","#78c679","#31a354","#006837"],
	7: ["#ffffcc","#d9f0a3","#addd8e","#78c679","#41ab5d","#238443","#005a32"],
	8: ["#ffffe5","#f7fcb9","#d9f0a3","#addd8e","#78c679","#41ab5d","#238443","#005a32"],
	9: ["#ffffe5","#f7fcb9","#d9f0a3","#addd8e","#78c679","#41ab5d","#238443","#006837","#004529"]
    },YlGnBu: {
	3: ["#edf8b1","#7fcdbb","#2c7fb8"],
	4: ["#ffffcc","#a1dab4","#41b6c4","#225ea8"],
	5: ["#ffffcc","#a1dab4","#41b6c4","#2c7fb8","#253494"],
	6: ["#ffffcc","#c7e9b4","#7fcdbb","#41b6c4","#2c7fb8","#253494"],
	7: ["#ffffcc","#c7e9b4","#7fcdbb","#41b6c4","#1d91c0","#225ea8","#0c2c84"],
	8: ["#ffffd9","#edf8b1","#c7e9b4","#7fcdbb","#41b6c4","#1d91c0","#225ea8","#0c2c84"],
	9: ["#ffffd9","#edf8b1","#c7e9b4","#7fcdbb","#41b6c4","#1d91c0","#225ea8","#253494","#081d58"]
    },GnBu: {
	3: ["#e0f3db","#a8ddb5","#43a2ca"],
	4: ["#f0f9e8","#bae4bc","#7bccc4","#2b8cbe"],
	5: ["#f0f9e8","#bae4bc","#7bccc4","#43a2ca","#0868ac"],
	6: ["#f0f9e8","#ccebc5","#a8ddb5","#7bccc4","#43a2ca","#0868ac"],
	7: ["#f0f9e8","#ccebc5","#a8ddb5","#7bccc4","#4eb3d3","#2b8cbe","#08589e"],
	8: ["#f7fcf0","#e0f3db","#ccebc5","#a8ddb5","#7bccc4","#4eb3d3","#2b8cbe","#08589e"],
	9: ["#f7fcf0","#e0f3db","#ccebc5","#a8ddb5","#7bccc4","#4eb3d3","#2b8cbe","#0868ac","#084081"]
    },BuGn: {
	3: ["#e5f5f9","#99d8c9","#2ca25f"],
	4: ["#edf8fb","#b2e2e2","#66c2a4","#238b45"],
	5: ["#edf8fb","#b2e2e2","#66c2a4","#2ca25f","#006d2c"],
	6: ["#edf8fb","#ccece6","#99d8c9","#66c2a4","#2ca25f","#006d2c"],
	7: ["#edf8fb","#ccece6","#99d8c9","#66c2a4","#41ae76","#238b45","#005824"],
	8: ["#f7fcfd","#e5f5f9","#ccece6","#99d8c9","#66c2a4","#41ae76","#238b45","#005824"],
	9: ["#f7fcfd","#e5f5f9","#ccece6","#99d8c9","#66c2a4","#41ae76","#238b45","#006d2c","#00441b"]
    },PuBuGn: {
	3: ["#ece2f0","#a6bddb","#1c9099"],
	4: ["#f6eff7","#bdc9e1","#67a9cf","#02818a"],
	5: ["#f6eff7","#bdc9e1","#67a9cf","#1c9099","#016c59"],
	6: ["#f6eff7","#d0d1e6","#a6bddb","#67a9cf","#1c9099","#016c59"],
	7: ["#f6eff7","#d0d1e6","#a6bddb","#67a9cf","#3690c0","#02818a","#016450"],
	8: ["#fff7fb","#ece2f0","#d0d1e6","#a6bddb","#67a9cf","#3690c0","#02818a","#016450"],
	9: ["#fff7fb","#ece2f0","#d0d1e6","#a6bddb","#67a9cf","#3690c0","#02818a","#016c59","#014636"]
    },PuBu: {
	3: ["#ece7f2","#a6bddb","#2b8cbe"],
	4: ["#f1eef6","#bdc9e1","#74a9cf","#0570b0"],
	5: ["#f1eef6","#bdc9e1","#74a9cf","#2b8cbe","#045a8d"],
	6: ["#f1eef6","#d0d1e6","#a6bddb","#74a9cf","#2b8cbe","#045a8d"],
	7: ["#f1eef6","#d0d1e6","#a6bddb","#74a9cf","#3690c0","#0570b0","#034e7b"],
	8: ["#fff7fb","#ece7f2","#d0d1e6","#a6bddb","#74a9cf","#3690c0","#0570b0","#034e7b"],
	9: ["#fff7fb","#ece7f2","#d0d1e6","#a6bddb","#74a9cf","#3690c0","#0570b0","#045a8d","#023858"]
    },BuPu: {
	3: ["#e0ecf4","#9ebcda","#8856a7"],
	4: ["#edf8fb","#b3cde3","#8c96c6","#88419d"],
	5: ["#edf8fb","#b3cde3","#8c96c6","#8856a7","#810f7c"],
	6: ["#edf8fb","#bfd3e6","#9ebcda","#8c96c6","#8856a7","#810f7c"],
	7: ["#edf8fb","#bfd3e6","#9ebcda","#8c96c6","#8c6bb1","#88419d","#6e016b"],
	8: ["#f7fcfd","#e0ecf4","#bfd3e6","#9ebcda","#8c96c6","#8c6bb1","#88419d","#6e016b"],
	9: ["#f7fcfd","#e0ecf4","#bfd3e6","#9ebcda","#8c96c6","#8c6bb1","#88419d","#810f7c","#4d004b"]
    },RdPu: {
	3: ["#fde0dd","#fa9fb5","#c51b8a"],
	4: ["#feebe2","#fbb4b9","#f768a1","#ae017e"],
	5: ["#feebe2","#fbb4b9","#f768a1","#c51b8a","#7a0177"],
	6: ["#feebe2","#fcc5c0","#fa9fb5","#f768a1","#c51b8a","#7a0177"],
	7: ["#feebe2","#fcc5c0","#fa9fb5","#f768a1","#dd3497","#ae017e","#7a0177"],
	8: ["#fff7f3","#fde0dd","#fcc5c0","#fa9fb5","#f768a1","#dd3497","#ae017e","#7a0177"],
	9: ["#fff7f3","#fde0dd","#fcc5c0","#fa9fb5","#f768a1","#dd3497","#ae017e","#7a0177","#49006a"]
    },PuRd: {
	3: ["#e7e1ef","#c994c7","#dd1c77"],
	4: ["#f1eef6","#d7b5d8","#df65b0","#ce1256"],
	5: ["#f1eef6","#d7b5d8","#df65b0","#dd1c77","#980043"],
	6: ["#f1eef6","#d4b9da","#c994c7","#df65b0","#dd1c77","#980043"],
	7: ["#f1eef6","#d4b9da","#c994c7","#df65b0","#e7298a","#ce1256","#91003f"],
	8: ["#f7f4f9","#e7e1ef","#d4b9da","#c994c7","#df65b0","#e7298a","#ce1256","#91003f"],
	9: ["#f7f4f9","#e7e1ef","#d4b9da","#c994c7","#df65b0","#e7298a","#ce1256","#980043","#67001f"]
    },OrRd: {
	3: ["#fee8c8","#fdbb84","#e34a33"],
	4: ["#fef0d9","#fdcc8a","#fc8d59","#d7301f"],
	5: ["#fef0d9","#fdcc8a","#fc8d59","#e34a33","#b30000"],
	6: ["#fef0d9","#fdd49e","#fdbb84","#fc8d59","#e34a33","#b30000"],
	7: ["#fef0d9","#fdd49e","#fdbb84","#fc8d59","#ef6548","#d7301f","#990000"],
	8: ["#fff7ec","#fee8c8","#fdd49e","#fdbb84","#fc8d59","#ef6548","#d7301f","#990000"],
	9: ["#fff7ec","#fee8c8","#fdd49e","#fdbb84","#fc8d59","#ef6548","#d7301f","#b30000","#7f0000"]
    },YlOrRd: {
	3: ["#ffeda0","#feb24c","#f03b20"],
	4: ["#ffffb2","#fecc5c","#fd8d3c","#e31a1c"],
	5: ["#ffffb2","#fecc5c","#fd8d3c","#f03b20","#bd0026"],
	6: ["#ffffb2","#fed976","#feb24c","#fd8d3c","#f03b20","#bd0026"],
	7: ["#ffffb2","#fed976","#feb24c","#fd8d3c","#fc4e2a","#e31a1c","#b10026"],
	8: ["#ffffcc","#ffeda0","#fed976","#feb24c","#fd8d3c","#fc4e2a","#e31a1c","#b10026"],
	9: ["#ffffcc","#ffeda0","#fed976","#feb24c","#fd8d3c","#fc4e2a","#e31a1c","#bd0026","#800026"]
    },YlOrBr: {
	3: ["#fff7bc","#fec44f","#d95f0e"],
	4: ["#ffffd4","#fed98e","#fe9929","#cc4c02"],
	5: ["#ffffd4","#fed98e","#fe9929","#d95f0e","#993404"],
	6: ["#ffffd4","#fee391","#fec44f","#fe9929","#d95f0e","#993404"],
	7: ["#ffffd4","#fee391","#fec44f","#fe9929","#ec7014","#cc4c02","#8c2d04"],
	8: ["#ffffe5","#fff7bc","#fee391","#fec44f","#fe9929","#ec7014","#cc4c02","#8c2d04"],
	9: ["#ffffe5","#fff7bc","#fee391","#fec44f","#fe9929","#ec7014","#cc4c02","#993404","#662506"]
    },Purples: {
	3: ["#efedf5","#bcbddc","#756bb1"],
	4: ["#f2f0f7","#cbc9e2","#9e9ac8","#6a51a3"],
	5: ["#f2f0f7","#cbc9e2","#9e9ac8","#756bb1","#54278f"],
	6: ["#f2f0f7","#dadaeb","#bcbddc","#9e9ac8","#756bb1","#54278f"],
	7: ["#f2f0f7","#dadaeb","#bcbddc","#9e9ac8","#807dba","#6a51a3","#4a1486"],
	8: ["#fcfbfd","#efedf5","#dadaeb","#bcbddc","#9e9ac8","#807dba","#6a51a3","#4a1486"],
	9: ["#fcfbfd","#efedf5","#dadaeb","#bcbddc","#9e9ac8","#807dba","#6a51a3","#54278f","#3f007d"]
    },Blues: {
	3: ["#deebf7","#9ecae1","#3182bd"],
	4: ["#eff3ff","#bdd7e7","#6baed6","#2171b5"],
	5: ["#eff3ff","#bdd7e7","#6baed6","#3182bd","#08519c"],
	6: ["#eff3ff","#c6dbef","#9ecae1","#6baed6","#3182bd","#08519c"],
	7: ["#eff3ff","#c6dbef","#9ecae1","#6baed6","#4292c6","#2171b5","#084594"],
	8: ["#f7fbff","#deebf7","#c6dbef","#9ecae1","#6baed6","#4292c6","#2171b5","#084594"],
	9: ["#f7fbff","#deebf7","#c6dbef","#9ecae1","#6baed6","#4292c6","#2171b5","#08519c","#08306b"]
    },Greens: {
	3: ["#e5f5e0","#a1d99b","#31a354"],
	4: ["#edf8e9","#bae4b3","#74c476","#238b45"],
	5: ["#edf8e9","#bae4b3","#74c476","#31a354","#006d2c"],
	6: ["#edf8e9","#c7e9c0","#a1d99b","#74c476","#31a354","#006d2c"],
	7: ["#edf8e9","#c7e9c0","#a1d99b","#74c476","#41ab5d","#238b45","#005a32"],
	8: ["#f7fcf5","#e5f5e0","#c7e9c0","#a1d99b","#74c476","#41ab5d","#238b45","#005a32"],
	9: ["#f7fcf5","#e5f5e0","#c7e9c0","#a1d99b","#74c476","#41ab5d","#238b45","#006d2c","#00441b"]
    },Oranges: {
	3: ["#fee6ce","#fdae6b","#e6550d"],
	4: ["#feedde","#fdbe85","#fd8d3c","#d94701"],
	5: ["#feedde","#fdbe85","#fd8d3c","#e6550d","#a63603"],
	6: ["#feedde","#fdd0a2","#fdae6b","#fd8d3c","#e6550d","#a63603"],
	7: ["#feedde","#fdd0a2","#fdae6b","#fd8d3c","#f16913","#d94801","#8c2d04"],
	8: ["#fff5eb","#fee6ce","#fdd0a2","#fdae6b","#fd8d3c","#f16913","#d94801","#8c2d04"],
	9: ["#fff5eb","#fee6ce","#fdd0a2","#fdae6b","#fd8d3c","#f16913","#d94801","#a63603","#7f2704"]
    },Reds: {
	3: ["#fee0d2","#fc9272","#de2d26"],
	4: ["#fee5d9","#fcae91","#fb6a4a","#cb181d"],
	5: ["#fee5d9","#fcae91","#fb6a4a","#de2d26","#a50f15"],
	6: ["#fee5d9","#fcbba1","#fc9272","#fb6a4a","#de2d26","#a50f15"],
	7: ["#fee5d9","#fcbba1","#fc9272","#fb6a4a","#ef3b2c","#cb181d","#99000d"],
	8: ["#fff5f0","#fee0d2","#fcbba1","#fc9272","#fb6a4a","#ef3b2c","#cb181d","#99000d"],
	9: ["#fff5f0","#fee0d2","#fcbba1","#fc9272","#fb6a4a","#ef3b2c","#cb181d","#a50f15","#67000d"]
    },Greys: {
	3: ["#f0f0f0","#bdbdbd","#636363"],
	4: ["#f7f7f7","#cccccc","#969696","#525252"],
	5: ["#f7f7f7","#cccccc","#969696","#636363","#252525"],
	6: ["#f7f7f7","#d9d9d9","#bdbdbd","#969696","#636363","#252525"],
	7: ["#f7f7f7","#d9d9d9","#bdbdbd","#969696","#737373","#525252","#252525"],
	8: ["#ffffff","#f0f0f0","#d9d9d9","#bdbdbd","#969696","#737373","#525252","#252525"],
	9: ["#ffffff","#f0f0f0","#d9d9d9","#bdbdbd","#969696","#737373","#525252","#252525","#000000"]
    },PuOr: {
	3: ["#f1a340","#f7f7f7","#998ec3"],
	4: ["#e66101","#fdb863","#b2abd2","#5e3c99"],
	5: ["#e66101","#fdb863","#f7f7f7","#b2abd2","#5e3c99"],
	6: ["#b35806","#f1a340","#fee0b6","#d8daeb","#998ec3","#542788"],
	7: ["#b35806","#f1a340","#fee0b6","#f7f7f7","#d8daeb","#998ec3","#542788"],
	8: ["#b35806","#e08214","#fdb863","#fee0b6","#d8daeb","#b2abd2","#8073ac","#542788"],
	9: ["#b35806","#e08214","#fdb863","#fee0b6","#f7f7f7","#d8daeb","#b2abd2","#8073ac","#542788"],
	10: ["#7f3b08","#b35806","#e08214","#fdb863","#fee0b6","#d8daeb","#b2abd2","#8073ac","#542788","#2d004b"],
	11: ["#7f3b08","#b35806","#e08214","#fdb863","#fee0b6","#f7f7f7","#d8daeb","#b2abd2","#8073ac","#542788","#2d004b"]
    },BrBG: {
	3: ["#d8b365","#f5f5f5","#5ab4ac"],
	4: ["#a6611a","#dfc27d","#80cdc1","#018571"],
	5: ["#a6611a","#dfc27d","#f5f5f5","#80cdc1","#018571"],
	6: ["#8c510a","#d8b365","#f6e8c3","#c7eae5","#5ab4ac","#01665e"],
	7: ["#8c510a","#d8b365","#f6e8c3","#f5f5f5","#c7eae5","#5ab4ac","#01665e"],
	8: ["#8c510a","#bf812d","#dfc27d","#f6e8c3","#c7eae5","#80cdc1","#35978f","#01665e"],
	9: ["#8c510a","#bf812d","#dfc27d","#f6e8c3","#f5f5f5","#c7eae5","#80cdc1","#35978f","#01665e"],
	10: ["#543005","#8c510a","#bf812d","#dfc27d","#f6e8c3","#c7eae5","#80cdc1","#35978f","#01665e","#003c30"],
	11: ["#543005","#8c510a","#bf812d","#dfc27d","#f6e8c3","#f5f5f5","#c7eae5","#80cdc1","#35978f","#01665e","#003c30"]
    },PRGn: {
	3: ["#af8dc3","#f7f7f7","#7fbf7b"],
	4: ["#7b3294","#c2a5cf","#a6dba0","#008837"],
	5: ["#7b3294","#c2a5cf","#f7f7f7","#a6dba0","#008837"],
	6: ["#762a83","#af8dc3","#e7d4e8","#d9f0d3","#7fbf7b","#1b7837"],
	7: ["#762a83","#af8dc3","#e7d4e8","#f7f7f7","#d9f0d3","#7fbf7b","#1b7837"],
	8: ["#762a83","#9970ab","#c2a5cf","#e7d4e8","#d9f0d3","#a6dba0","#5aae61","#1b7837"],
	9: ["#762a83","#9970ab","#c2a5cf","#e7d4e8","#f7f7f7","#d9f0d3","#a6dba0","#5aae61","#1b7837"],
	10: ["#40004b","#762a83","#9970ab","#c2a5cf","#e7d4e8","#d9f0d3","#a6dba0","#5aae61","#1b7837","#00441b"],
	11: ["#40004b","#762a83","#9970ab","#c2a5cf","#e7d4e8","#f7f7f7","#d9f0d3","#a6dba0","#5aae61","#1b7837","#00441b"]
    },PiYG: {
	3: ["#e9a3c9","#f7f7f7","#a1d76a"],
	4: ["#d01c8b","#f1b6da","#b8e186","#4dac26"],
	5: ["#d01c8b","#f1b6da","#f7f7f7","#b8e186","#4dac26"],
	6: ["#c51b7d","#e9a3c9","#fde0ef","#e6f5d0","#a1d76a","#4d9221"],
	7: ["#c51b7d","#e9a3c9","#fde0ef","#f7f7f7","#e6f5d0","#a1d76a","#4d9221"],
	8: ["#c51b7d","#de77ae","#f1b6da","#fde0ef","#e6f5d0","#b8e186","#7fbc41","#4d9221"],
	9: ["#c51b7d","#de77ae","#f1b6da","#fde0ef","#f7f7f7","#e6f5d0","#b8e186","#7fbc41","#4d9221"],
	10: ["#8e0152","#c51b7d","#de77ae","#f1b6da","#fde0ef","#e6f5d0","#b8e186","#7fbc41","#4d9221","#276419"],
	11: ["#8e0152","#c51b7d","#de77ae","#f1b6da","#fde0ef","#f7f7f7","#e6f5d0","#b8e186","#7fbc41","#4d9221","#276419"]
    },RdBu: {
	3: ["#ef8a62","#f7f7f7","#67a9cf"],
	4: ["#ca0020","#f4a582","#92c5de","#0571b0"],
	5: ["#ca0020","#f4a582","#f7f7f7","#92c5de","#0571b0"],
	6: ["#b2182b","#ef8a62","#fddbc7","#d1e5f0","#67a9cf","#2166ac"],
	7: ["#b2182b","#ef8a62","#fddbc7","#f7f7f7","#d1e5f0","#67a9cf","#2166ac"],
	8: ["#b2182b","#d6604d","#f4a582","#fddbc7","#d1e5f0","#92c5de","#4393c3","#2166ac"],
	9: ["#b2182b","#d6604d","#f4a582","#fddbc7","#f7f7f7","#d1e5f0","#92c5de","#4393c3","#2166ac"],
	10: ["#67001f","#b2182b","#d6604d","#f4a582","#fddbc7","#d1e5f0","#92c5de","#4393c3","#2166ac","#053061"],
	11: ["#67001f","#b2182b","#d6604d","#f4a582","#fddbc7","#f7f7f7","#d1e5f0","#92c5de","#4393c3","#2166ac","#053061"]
    },RdGy: {
	3: ["#ef8a62","#ffffff","#999999"],
	4: ["#ca0020","#f4a582","#bababa","#404040"],
	5: ["#ca0020","#f4a582","#ffffff","#bababa","#404040"],
	6: ["#b2182b","#ef8a62","#fddbc7","#e0e0e0","#999999","#4d4d4d"],
	7: ["#b2182b","#ef8a62","#fddbc7","#ffffff","#e0e0e0","#999999","#4d4d4d"],
	8: ["#b2182b","#d6604d","#f4a582","#fddbc7","#e0e0e0","#bababa","#878787","#4d4d4d"],
	9: ["#b2182b","#d6604d","#f4a582","#fddbc7","#ffffff","#e0e0e0","#bababa","#878787","#4d4d4d"],
	10: ["#67001f","#b2182b","#d6604d","#f4a582","#fddbc7","#e0e0e0","#bababa","#878787","#4d4d4d","#1a1a1a"],
	11: ["#67001f","#b2182b","#d6604d","#f4a582","#fddbc7","#ffffff","#e0e0e0","#bababa","#878787","#4d4d4d","#1a1a1a"]
    },RdYlBu: {
	3: ["#fc8d59","#ffffbf","#91bfdb"],
	4: ["#d7191c","#fdae61","#abd9e9","#2c7bb6"],
	5: ["#d7191c","#fdae61","#ffffbf","#abd9e9","#2c7bb6"],
	6: ["#d73027","#fc8d59","#fee090","#e0f3f8","#91bfdb","#4575b4"],
	7: ["#d73027","#fc8d59","#fee090","#ffffbf","#e0f3f8","#91bfdb","#4575b4"],
	8: ["#d73027","#f46d43","#fdae61","#fee090","#e0f3f8","#abd9e9","#74add1","#4575b4"],
	9: ["#d73027","#f46d43","#fdae61","#fee090","#ffffbf","#e0f3f8","#abd9e9","#74add1","#4575b4"],
	10: ["#a50026","#d73027","#f46d43","#fdae61","#fee090","#e0f3f8","#abd9e9","#74add1","#4575b4","#313695"],
	11: ["#a50026","#d73027","#f46d43","#fdae61","#fee090","#ffffbf","#e0f3f8","#abd9e9","#74add1","#4575b4","#313695"]
    },Spectral: {
	3: ["#fc8d59","#ffffbf","#99d594"],
	4: ["#d7191c","#fdae61","#abdda4","#2b83ba"],
	5: ["#d7191c","#fdae61","#ffffbf","#abdda4","#2b83ba"],
	6: ["#d53e4f","#fc8d59","#fee08b","#e6f598","#99d594","#3288bd"],
	7: ["#d53e4f","#fc8d59","#fee08b","#ffffbf","#e6f598","#99d594","#3288bd"],
	8: ["#d53e4f","#f46d43","#fdae61","#fee08b","#e6f598","#abdda4","#66c2a5","#3288bd"],
	9: ["#d53e4f","#f46d43","#fdae61","#fee08b","#ffffbf","#e6f598","#abdda4","#66c2a5","#3288bd"],
	10: ["#9e0142","#d53e4f","#f46d43","#fdae61","#fee08b","#e6f598","#abdda4","#66c2a5","#3288bd","#5e4fa2"],
	11: ["#9e0142","#d53e4f","#f46d43","#fdae61","#fee08b","#ffffbf","#e6f598","#abdda4","#66c2a5","#3288bd","#5e4fa2"]
    },RdYlGn: {
	3: ["#fc8d59","#ffffbf","#91cf60"],
	4: ["#d7191c","#fdae61","#a6d96a","#1a9641"],
	5: ["#d7191c","#fdae61","#ffffbf","#a6d96a","#1a9641"],
	6: ["#d73027","#fc8d59","#fee08b","#d9ef8b","#91cf60","#1a9850"],
	7: ["#d73027","#fc8d59","#fee08b","#ffffbf","#d9ef8b","#91cf60","#1a9850"],
	8: ["#d73027","#f46d43","#fdae61","#fee08b","#d9ef8b","#a6d96a","#66bd63","#1a9850"],
	9: ["#d73027","#f46d43","#fdae61","#fee08b","#ffffbf","#d9ef8b","#a6d96a","#66bd63","#1a9850"],
	10: ["#a50026","#d73027","#f46d43","#fdae61","#fee08b","#d9ef8b","#a6d96a","#66bd63","#1a9850","#006837"],
	11: ["#a50026","#d73027","#f46d43","#fdae61","#fee08b","#ffffbf","#d9ef8b","#a6d96a","#66bd63","#1a9850","#006837"]
    },Accent: {
	3: ["#7fc97f","#beaed4","#fdc086"],
	4: ["#7fc97f","#beaed4","#fdc086","#ffff99"],
	5: ["#7fc97f","#beaed4","#fdc086","#ffff99","#386cb0"],
	6: ["#7fc97f","#beaed4","#fdc086","#ffff99","#386cb0","#f0027f"],
	7: ["#7fc97f","#beaed4","#fdc086","#ffff99","#386cb0","#f0027f","#bf5b17"],
	8: ["#7fc97f","#beaed4","#fdc086","#ffff99","#386cb0","#f0027f","#bf5b17","#666666"]
    },Dark2: {
	3: ["#1b9e77","#d95f02","#7570b3"],
	4: ["#1b9e77","#d95f02","#7570b3","#e7298a"],
	5: ["#1b9e77","#d95f02","#7570b3","#e7298a","#66a61e"],
	6: ["#1b9e77","#d95f02","#7570b3","#e7298a","#66a61e","#e6ab02"],
	7: ["#1b9e77","#d95f02","#7570b3","#e7298a","#66a61e","#e6ab02","#a6761d"],
	8: ["#1b9e77","#d95f02","#7570b3","#e7298a","#66a61e","#e6ab02","#a6761d","#666666"]
    },Paired: {
	3: ["#a6cee3","#1f78b4","#b2df8a"],
	4: ["#a6cee3","#1f78b4","#b2df8a","#33a02c"],
	5: ["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99"],
	6: ["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e31a1c"],
	7: ["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e31a1c","#fdbf6f"],
	8: ["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e31a1c","#fdbf6f","#ff7f00"],
	9: ["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e31a1c","#fdbf6f","#ff7f00","#cab2d6"],
	10: ["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e31a1c","#fdbf6f","#ff7f00","#cab2d6","#6a3d9a"],
	11: ["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e31a1c","#fdbf6f","#ff7f00","#cab2d6","#6a3d9a","#ffff99"],
	12: ["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e31a1c","#fdbf6f","#ff7f00","#cab2d6","#6a3d9a","#ffff99","#b15928"]
    },Pastel1: {
	3: ["#fbb4ae","#b3cde3","#ccebc5"],
	4: ["#fbb4ae","#b3cde3","#ccebc5","#decbe4"],
	5: ["#fbb4ae","#b3cde3","#ccebc5","#decbe4","#fed9a6"],
	6: ["#fbb4ae","#b3cde3","#ccebc5","#decbe4","#fed9a6","#ffffcc"],
	7: ["#fbb4ae","#b3cde3","#ccebc5","#decbe4","#fed9a6","#ffffcc","#e5d8bd"],
	8: ["#fbb4ae","#b3cde3","#ccebc5","#decbe4","#fed9a6","#ffffcc","#e5d8bd","#fddaec"],
	9: ["#fbb4ae","#b3cde3","#ccebc5","#decbe4","#fed9a6","#ffffcc","#e5d8bd","#fddaec","#f2f2f2"]
    },Pastel2: {
	3: ["#b3e2cd","#fdcdac","#cbd5e8"],
	4: ["#b3e2cd","#fdcdac","#cbd5e8","#f4cae4"],
	5: ["#b3e2cd","#fdcdac","#cbd5e8","#f4cae4","#e6f5c9"],
	6: ["#b3e2cd","#fdcdac","#cbd5e8","#f4cae4","#e6f5c9","#fff2ae"],
	7: ["#b3e2cd","#fdcdac","#cbd5e8","#f4cae4","#e6f5c9","#fff2ae","#f1e2cc"],
	8: ["#b3e2cd","#fdcdac","#cbd5e8","#f4cae4","#e6f5c9","#fff2ae","#f1e2cc","#cccccc"]
    },Set1: {
	3: ["#e41a1c","#377eb8","#4daf4a"],
	4: ["#e41a1c","#377eb8","#4daf4a","#984ea3"],
	5: ["#e41a1c","#377eb8","#4daf4a","#984ea3","#ff7f00"],
	6: ["#e41a1c","#377eb8","#4daf4a","#984ea3","#ff7f00","#ffff33"],
	7: ["#e41a1c","#377eb8","#4daf4a","#984ea3","#ff7f00","#ffff33","#a65628"],
	8: ["#e41a1c","#377eb8","#4daf4a","#984ea3","#ff7f00","#ffff33","#a65628","#f781bf"],
	9: ["#e41a1c","#377eb8","#4daf4a","#984ea3","#ff7f00","#ffff33","#a65628","#f781bf","#999999"]
    },Set2: {
	3: ["#66c2a5","#fc8d62","#8da0cb"],
	4: ["#66c2a5","#fc8d62","#8da0cb","#e78ac3"],
	5: ["#66c2a5","#fc8d62","#8da0cb","#e78ac3","#a6d854"],
	6: ["#66c2a5","#fc8d62","#8da0cb","#e78ac3","#a6d854","#ffd92f"],
	7: ["#66c2a5","#fc8d62","#8da0cb","#e78ac3","#a6d854","#ffd92f","#e5c494"],
	8: ["#66c2a5","#fc8d62","#8da0cb","#e78ac3","#a6d854","#ffd92f","#e5c494","#b3b3b3"]
    },Set3: {
	3: ["#8dd3c7","#ffffb3","#bebada"],
	4: ["#8dd3c7","#ffffb3","#bebada","#fb8072"],
	5: ["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3"],
	6: ["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462"],
	7: ["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69"],
	8: ["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5"],
	9: ["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5","#d9d9d9"],
	10: ["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5","#d9d9d9","#bc80bd"],
	11: ["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5","#d9d9d9","#bc80bd","#ccebc5"],
	12: ["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5","#d9d9d9","#bc80bd","#ccebc5","#ffed6f"]
    }};

    return colorbrewer;
});

define('charts/surface',[
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
	this.ranges = this.dataset.getRanges();
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

define('charts/wireframe',[
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
	this.ranges = this.dataset.getRanges();
    }

    Wireframe.prototype.generateMesh = function(scales){
	var data = this.dataset.raw;
	var width = data.x.length, height = data.x[0].length;
	var material = new THREE.LineBasicMaterial({ 
	    color: this.options.color,
	    type: THREE.LineStrip,
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
    }

    Wireframe.prototype.getDataRanges = function(){
	return this.ranges;
    }
    
    Wireframe.prototype.hasLegend = function(){
	return this.options.has_legend;
    }

    Wireframe.prototype.disappear = function(){
	for(var i=0;i<this.mesh.length;i++){
	    this.mesh[i].material.opacity = 0;
	    this.mesh[i].material.needsUpdate = true;
	}
    }

    Wireframe.prototype.appear = function(){
	for(var i=0;i<this.mesh.length;i++){
	    this.mesh[i].material.opacity = 1;
	    this.mesh[i].material.needsUpdate = true;
	}
    }

    Wireframe.prototype.getLegend = function(){
	return Legends.generateDiscreteLegend(this.options.name, this.options.color, this);
    }
    
    Wireframe.prototype.getMesh = function(){
	return this.mesh;
    };

    return Wireframe;
});

define('charts/particles',[
    "components/legends",
    "utils/utils",
    "utils/datasets",
    "utils/colorbrewer"
],function(Legends, Utils, Datasets, colorbrewer){
    function Particles(data, options){
	this.options = {
	    name: "Particle",
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
	var material = new THREE.MeshBasicMaterial({transparent:true, color: this.options.color});
	this.mesh = new THREE.Mesh(geometry, material);
    }

    Particles.prototype.getDataRanges = function(){
	return this.ranges;
    }
    
    Particles.prototype.hasLegend = function(){
	return this.options.has_legend;
    }

    Particles.prototype.disappear = function(){
	this.mesh.material.opacity = 0;
	this.mesh.material.needsUpdate = true;
    }

    Particles.prototype.appear = function(){
	this.mesh.material.opacity = 1;
    }

    Particles.prototype.getLegend = function(){
	return Legends.generateDiscreteLegend(this.options.name, this.options.color, this);
    }
    
    Particles.prototype.getMesh = function(){
	return this.mesh;
    };

    return Particles;
});

define('charts/line',[
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

	this.dataset = new Datasets.Array(data);
	this.ranges = this.dataset.getRanges();
    }

    Line.prototype.generateMesh = function(scales){
	var data = this.dataset.raw;
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
    }

    Line.prototype.getDataRanges = function(){
	return this.ranges;
    }
    
    Line.prototype.hasLegend = function(){
	return this.options.has_legend;
    }

    Line.prototype.disappear = function(){
	this.mesh.material.opacity = 0;
	this.mesh.material.needsUpdate = true;
    }

    Line.prototype.appear = function(){
	this.mesh.material.opacity = 1;
    }

    Line.prototype.getLegend = function(){
	return Legends.generateDiscreteLegend(this.options.name, this.options.colors[0], this);
    }
    
    Line.prototype.getMesh = function(){
	return this.mesh;
    };

    return Line;
});

define('charts/scatter',[
    "components/legends",
    "utils/utils",
    "utils/datasets",
    "utils/colorbrewer"
],function(Legends, Utils, Datasets, colorbrewer){
    function Scatter(data, options){
	this.options = {
	    name: "Scatter",
	    shape: "circle",
	    size: 1.5,
	    stroke_width: 3,
	    stroke_color: "#000000",
	    fill_color: colorbrewer.Reds[3][1],
	    has_legend: true
	};

	if(arguments.length > 1){
	    Utils.merge(this.options, options);
	}

	this.dataset = new Datasets.Array(data);
	this.ranges = this.dataset.getRanges();
    }

    Scatter.prototype.generateMesh = function(scales){
	var shape_funcs = {
	    circle: function(ctx){
		ctx.arc(50, 50, 40, 0, Math.PI*2, false);
	    },
	    rect: function(ctx){
		ctx.beginPath();
		ctx.moveTo(20,20);
		ctx.lineTo(80,20);
		ctx.lineTo(80,80);
		ctx.lineTo(20,80);
		ctx.lineTo(20,20);
	    },
	    cross: function(ctx){
		var vertexes = [[35,5],[65,5],[65,35],[95,35],[95,65],[65,65],[65,95],[35,95],[35,65],[5,65],[5,35],[35,35]];
		ctx.moveTo(vertexes[11][0],vertexes[11][1]);
		for(var i=0;i<vertexes.length;i++){
		    ctx.lineTo(vertexes[i][0],vertexes[i][1]);
		}
	    },
	    diamond: function(ctx){
		ctx.moveTo(50,5);
		ctx.lineTo(85,50);
		ctx.lineTo(50,95);
		ctx.lineTo(15,50);
		ctx.lineTo(50,5);
	    }
	};

	var canvas = document.createElement('canvas');
	canvas.width = 100;
	canvas.height = 100;
	var ctx = canvas.getContext('2d');
	ctx.fillStyle = this.options.fill_color;
	shape_funcs[this.options.shape](ctx);
	ctx.fill();
	ctx.lineWidth = this.options.stroke_width;
	ctx.strokeStyle = this.options.stroke_color;
	ctx.stroke();

	var texture = new THREE.Texture(canvas);
	texture.flipY = false;
	texture.needsUpdate = true;
	var material = new THREE.SpriteMaterial({
	    map: texture,
	    size: 10,
	    transparent: true
	});

	var data = this.dataset.raw;
	var meshes = [];
	for(var i=0;i<data.x.length;i++){
	    var sprite = new THREE.Sprite(material);
	    sprite.position = new THREE.Vector3(
		scales.x(data.x[i]),
		scales.y(data.y[i]),
		scales.z(data.z[i])
	    );
	    var size = this.options.size;
	    sprite.scale.set(size,size,size);
	    meshes.push(sprite);
	}
	this.mesh = meshes;
    }

    Scatter.prototype.getDataRanges = function(){
	return this.ranges;
    }
    
    Scatter.prototype.hasLegend = function(){
	return this.options.has_legend;
    }

    Scatter.prototype.disappear = function(){
	for(var i=0;i<this.mesh.length;i++){
	    this.mesh[i].material.opacity = 0;
	}
    }

    Scatter.prototype.appear = function(){
	for(var i=0;i<this.mesh.length;i++){
	    this.mesh[i].material.opacity = 1;
	}
    }

    Scatter.prototype.getLegend = function(){
	return Legends.generateDiscreteLegend(this.options.name, this.options.fill_color, this);
    }

    Scatter.prototype.getMesh = function(){
	return this.mesh;
    };

    return Scatter;
});

define('quick/base',[],function(){
    /********************************
      Base function of all quick functions
     **********************************/
    Base = function(){
	options = {};
	this.options = {};

	//setters
	this.width = function(_){
	    this.options.width = _;
	    options = this.options;
	    return this;
	};

	this.height = function(_){
	    this.options.height = _;
	    options = this.options;
	    return this;
	};

	this.bg_color = function(_){
	    this.options.bg_color = _;
	    options = this.options;
	    return this;
	}

	this.legend = function(_){
	    this.options.legend = _;
	    options = this.options;
	    return this;
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

    SurfacePlot.fill_colors = function(_){
	this.options.fill_colors = _;
	options = this.options;
	return this;
    }

    SurfacePlot.has_legend = function(_){
	this.options.has_legend = _;
	options = this.options;
	return this;
    }

    Utils.mixin(SurfacePlot, Base);

    return SurfacePlot;
});

define('quick/wireframe_plot',[
    "components/stage",
    "quick/base",
    "charts/wireframe",
    "utils/utils"
],function(Stage, Base, Wireframe, Utils){

    function WireframePlot(selection){
	selection.each(function(data){
	    var stage = new Stage(this);
	    stage.add(new Wireframe(data, options));
	    stage.render();
	});
    }

    WireframePlot.data_name = function(_){
	this.options.name = _;
	options = this.options;
	return this;
    }

    WireframePlot.color = function(_){
	this.options.color = _;
	options = this.options;
	return this;
    }

    WireframePlot.thickness = function(_){
	this.options.thickness = _;
	options = this.options;
	return this;
    }

    WireframePlot.has_legend = function(_){
	this.options.has_legend = _;
	options = this.options;
	return this;
    }

    Utils.mixin(WireframePlot, Base);

    return WireframePlot;
});

define('quick/particles_plot',[
    "components/stage",
    "quick/base",
    "charts/particles",
    "utils/utils"
],function(Stage, Base, Particles, Utils){

    function ParticlesPlot(selection){
	selection.each(function(data){
	    var stage = new Stage(this);
	    stage.add(new Particles(data, options));
	    stage.render();
	});
    }

    ParticlesPlot.color = function(_){
	this.options.color = _;
	options = this.options;
	return this;
    }

    ParticlesPlot.size = function(_){
	this.options.size = _;
	options = this.options;
	return this;
    }

    ParticlesPlot.has_legend = function(_){
	this.options.has_legend = _;
	options = this.options;
	return this;
    }

    Utils.mixin(ParticlesPlot, Base);

    return ParticlesPlot;
});

define('quick/line_plot',[
    "components/stage",
    "quick/base",
    "charts/line",
    "utils/utils"
],function(Stage, Base, Line, Utils){

    function LinePlot(selection){
	selection.each(function(data){
	    var stage = new Stage(this);
	    stage.add(new Line(data, options));
	    stage.render();
	});
    }

    LinePlot.data_name = function(_){
	this.options.name = _;
	options = this.options;
	return this;
    }

    LinePlot.colors = function(_){
	this.options.colors = _;
	options = this.options;
	return this;
    }

    LinePlot.thickness = function(_){
	this.options.thickness = _;
	options = this.options;
	return this;
    }

    LinePlot.has_legend = function(_){
	this.options.has_legend = _;
	options = this.options;
	return this;
    }

    Utils.mixin(LinePlot, Base);

    return LinePlot;
});

define('quick/scatter_plot',[
    "components/stage",
    "quick/base",
    "charts/scatter",
    "utils/utils"
],function(Stage, Base, Scatter, Utils){

    function ScatterPlot(selection){
	selection.each(function(data){
	    var stage = new Stage(this);
	    stage.add(new Scatter(data, options));
	    stage.render();
	});
    }

    ScatterPlot.data_name = function(_){
	this.options.name = _;
	options = this.options;
	return this;
    }

    ScatterPlot.shape = function(_){
	this.options.shape = _;
	options = this.options;
	return this;
    }

    ScatterPlot.size = function(_){
	this.options.size = _;
	options = this.options;
	return this;
    }

    ScatterPlot.stroke_width = function(_){
	this.options.stroke_width = _;
	options = this.options;
	return this;
    }

    ScatterPlot.stroke_color = function(_){
	this.options.stroke_color = _;
	options = this.options;
	return this;
    }

    ScatterPlot.fill_color = function(_){
	this.options.fill_color = _;
	options = this.options;
	return this;
    }

    ScatterPlot.has_legend = function(_){
	this.options.has_legend = _;
	options = this.options;
	return this;
    }

    Utils.mixin(ScatterPlot, Base);

    return ScatterPlot;
});

define('embed/embed',[
    "components/stage",
    "charts/surface",
    "charts/wireframe",
    "charts/scatter",
    "charts/particles",
    "charts/line"
],function(Stage, Surface, Wireframe, Scatter, Particles, Line){
    function Embed(){
	return this;
    }

    Embed.parse = function(element_name, model){
	var selection = d3.select(element_name);
	var stage = new Stage(selection[0][0],model.options);
	var plots = model.plots;
	var plot_types = {
	    Surface: Surface,
	    Wireframe: Wireframe,
	    Scatter: Scatter,
	    Particles: Particles,
	    Line: Line
	};
	for(var i=0;i<plots.length;i++){
	    var plot = new (plot_types[plots[i].type])(plots[i].data,plots[i].options);
	    stage.add(plot);
	}
	return stage;
    };

    return Embed;
});

define('embed/nyaplot',[
    "components/stage",
    "charts/surface",
    "charts/wireframe",
    "charts/scatter",
    "charts/particles",
    "charts/line"
],function(Stage, Surface, Wireframe, Scatter, Particles, Line){
	var diagrams = {
	    surface: {chart: Surface, dtype: 'Matrix'},
	    wireframe: {chart: Wireframe, dtype: 'Matrix'},
	    scatter: {chart: Scatter, dtype: 'Array'},
	    particles: {chart: Particles, dtype: 'Array'},
	    line: {chart: Line, dtype: 'Array'}
	};

    function Pane(parent, _options){
        this.uuid = Nyaplot.uuid.v4();
        this.stage = new Stage(parent[0][0], _options);
        this.rendered = false;
    }

    Pane.prototype.addDiagram = function(type, df_id, options){
        var data = ({
            'Matrix': prepareMatrix,
            'Array': prepareArray
        }[diagrams[type].dtype])(df_id, options);

        var plot = new (diagrams[type].chart)(data, options);
        this.stage.add(plot);
    };

    function initComponent(df_id, options){
        var df = Nyaplot.Manager.getData(df_id);
        var uuid = Nyaplot.uuid.v4();
        var x = df.columnWithFilters(uuid, options.x);
        var y = df.columnWithFilters(uuid, options.y);
        var z = df.columnWithFilters(uuid, options.z);
        return {x:x, y:y, z:z};
    }

    function prepareArray(df_id, _options){
        var columns = initComponent(df_id, _options);
        return {x: columns.x, y:columns.y, z:columns.z};
    }

    function prepareMatrix(df_id, _options){
        var mat = {};
        var columns = initComponent(df_id, _options);
        ['x','y'].forEach(function(label){
            var column = columns[label];
            var values = column.filter(function(x,i){return column.indexOf(x)==i;});
            var continuous_num = values.map(function(val){
                var first = column.indexOf(val);
                var seek = first;
                while(column[seek]==val)seek++;
                return seek-first;
            });
            if(continuous_num.every(function(val){return (val==continuous_num[0] && val != 1);})){
                var len = continuous_num[0];
                var generate_mat = function(arr, length){
                    var result = [];
                    for(var i=0;i<arr.length;i+=length){
                        result.push(arr.slice(i, i+length));
                    }
                    return result;
                };
                mat.x = generate_mat(columns['x'], len);
                mat.y = generate_mat(columns['y'], len);
                mat.z = generate_mat(columns['z'], len);
                return;
            }
        });
        return mat;
    }

    Pane.prototype.addFilter = function(target, options){
        return;
    };

    Pane.prototype.update = function(){
        if(!this.rendered){
            this.stage.render();
            this.rendered=true;
        }
        return;
    };

    return {
        pane: Pane
    };
});

define('main',['require','exports','module','components/stage','charts/surface','charts/wireframe','charts/particles','charts/line','charts/scatter','quick/surface_plot','quick/wireframe_plot','quick/particles_plot','quick/line_plot','quick/scatter_plot','embed/embed','embed/nyaplot'],function(require, exports, module){
    var Elegans = {};

    /***************************
      Prototype Objects for plotting
      e.g. var stage = new Elegant.Stage(d3.select("#vis"), {width:500, height:500});
           stage.add(new Elegant.Surface(data, {fill_colors:[#000000, #ffffff]}));
           stage.render();
    ****************/

    Elegans.Stage = require("components/stage");
    Elegans.Surface = require("charts/surface");
    Elegans.Wireframe = require("charts/wireframe");
    Elegans.Particles = require("charts/particles");
    Elegans.Line = require("charts/line");
    Elegans.Scatter = require("charts/scatter");

    /***************************
      Functions for quick plotting with method chain style  
      e.g. d3.select('#vis').datum(data).call(Elegans.SurfacePlot);
    ****************/

    Elegans.SurfacePlot = require("quick/surface_plot");
    Elegans.WireframePlot = require("quick/wireframe_plot");
    Elegans.ParticlesPlot = require("quick/particles_plot");
    Elegans.LinePlot = require("quick/line_plot");
    Elegans.ScatterPlot = require("quick/scatter_plot");

    /***************************
       Prototype Object for embedding to other language.
       e.g. var model = [{plots:[{type:"Surface",data={[...]},options={...}}],option:{...}}]
            Elegans.Embed.parse(model).render();
    ****************/

    Elegans.Embed = require("embed/embed");
    Elegans.Nya = require("embed/nyaplot");

    return Elegans;
});

return require('main');
}));