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
	},
	shell: {
	    make_shader: {
		command: "\
		cd ./src/shaders;\
		for file in *.glsl; do\
		    c=`cat \"${file}\"`;\
		    c=`echo \"$c\" | sed -e \"s/$/__terminate__\\\\\\\\\\\\/g\"`\
		    c=\"define(function(){return \\\"$c\n\\\".replace(\/__terminate__\/g, \\\"\\\\\\n\\\");});\";\
		    fname=\`echo ${file} | sed -e s/.glsl/.js/g\`;\
		    echo \"$c\" > $fname;\
		done"
	    }
	}
    });
    grunt.loadNpmTasks("grunt-contrib-requirejs");
    grunt.loadNpmTasks("grunt-shell");

    grunt.registerTask("default", ["release"]);
    grunt.registerTask("deploy", ["shell:make_shader", "requirejs"]);
    grunt.registerTask("release", ["deploy"]);
};
