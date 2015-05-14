define(function(require, exports, module){
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
    Elegans.Volume = require("charts/volume");
    Elegans.Cylinder = require("charts/cylinder");
    Elegans.DebugObject = require("charts/debug_object");

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

    Elegans.DataBase = require("utils/database");
    Elegans.Embed = require("embed/embed");
    Elegans.Nya = require("embed/nyaplot");

    return Elegans;
});
