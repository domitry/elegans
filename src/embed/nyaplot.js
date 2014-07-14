define([
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
        this.stage = new Stage(parent[0][0], _options);
    }

    Pane.prototype.addDiagram = function(type, df_id, options){
        var data = ({
            'Matrix': prepareMatrix,
            'Array': prepareArray
        }[diagrams[type].dtype])(df_id, options);

        var plot = new (diagrams[type].chart)(data, options);
        this.stage.add(plot);
        this.stage.render();
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
        for(var label in ['x','y']){
            var column = columns[label];
            var values = d3.set(column).values();
            var continuous_num = values.map(function(val){
                var first = column.indexOf(val);
                var seek = first;
                while(column[seek]==val)seek++;
                return seek-first;
            });
            if(continuous_num.every(function(val){return val==continuous_num[0];})){
                var len = continuous_num[0];
                var generate_mat = function(arr, length){
                    var result = [];
                    for(var i=0;i<arr.length;i+=length){
                        result.push(arr.slice(i, i+len-1));
                    }
                    return result;
                };
                mat.x = generate_mat(column['x'], len);
                mat.y = generate_mat(column['y'], len);
                mat.z = generate_mat(column['z'], len);
                break;
            }
        }
        return mat;
    }

    Pane.prototype.addFilter = function(target, options){
        return;
    };

    Pane.prototype.update = function(){
        return;
    };

    return {
        pane: Pane
    };
});
