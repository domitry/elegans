module.exports = function(grunt){
    grunt.initConfig({
        copy: {
                vendor: {
                    files: [{
                        expand: true,
                        cwd: 'src/vendor',
                        src: ['**/*'],
                        dest: 'build/vendor'
                    }]
		},
                release: {
                    files: [{
                        expand: true,
                        cwd: 'src/js',
                        src: '**',
                        dest: 'build'
                    }]
		}
	},
        requirejs: {
            options: {
                baseUrl: 'build',
                name: 'vendor/almond/almond',
                paths: {
                    d3: "vendor/d3.min",
		    threejs: "vendor/three.min.js"
		},
                shim: {
                    d3: {
			exports: 'd3'
		    },
		    threejs: {
			exports: 'THREE'
		    }
		},
		include: ['main'],
                wrap: {
                    startFile: 'src/js/wrap/start.js',
                    endFile: 'src/js/wrap/end.js'
                }
	    },
            production: {
                options: {
		    optimizeAllPluginResources: true,
		    optimize: 'uglify2',
		    out: "build/elegans.min.js"
		}
	    },
            development: {
		options: {
                    optimize: "none",
                    out: "build/elegans.js"
		}
	    }
	}
    });
    
    grunt.loadNpmTasks("grunt-contrib-requirejs")
    grunt.loadNpmTasks("grunt-contrib-copy")

    grunt.registerTask("default", ["build"])
    grunt.registerTask("build", ["copy"])
    grunt.registerTask("deploy", ["build", "requirejs"])
    grunt.registerTask("release", ["deploy", "copy:release"])
};
