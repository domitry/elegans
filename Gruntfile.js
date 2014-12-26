module.exports = function(grunt){
    grunt.initConfig({
        requirejs: {
            options: {
                baseUrl: 'src',
                name: '../lib/almond/almond',
		mainConfigFile: './src/config.js',
		include: ['main'],
                wrap: {
                    startFile: 'src/wrap/start.js',
                    endFile: 'src/wrap/end.js'
                }
	    },
            production: {
                options: {
		    optimizeAllPluginResources: true,
		    optimize: 'uglify2',
		    out: "release/elegans.min.js"
		}
	    },
            development: {
		options: {
                    optimize: "none",
                    out: "release/elegans.js"
		}
	    }
	}
    });
    
    grunt.loadNpmTasks("grunt-contrib-requirejs");

    grunt.registerTask("default", ["release"]);
    grunt.registerTask("deploy", ["requirejs"]);
    grunt.registerTask("release", ["deploy"]);
};
