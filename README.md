# Elegans
A 3D plotting library for web browsers enabling WebGL.

![alt text](https://dl.dropboxusercontent.com/u/47978121/ss561.png)

## Description
Elegans is a 3D plotting library written in JavaScript. You can generate charts in JavaScript, and show them on your browser.

We began to develop Elegans in order to embed it into other languages like Ruby and Python, so you can embed it into your environments in a relatively simple way. See 'Embed Elegans into your environments' paragraph in 'Usage' below.

Elegans is still in its alpha release, and some charts and options are not implemented yet.
Please see [documents](http://elegans.readthedocs.org) to learn more.

## Supporting charts
| Name | Shortcuts function | Data type | Legend option | Link to examples |
|:---- |:--------- |:--------- |:-----:|:----------------:|
| Elegans.Surface | Elegans.SurfacePlot | Matrix | o | [example](http://bl.ocks.org/domitry/11322618) |
| Elegans.Line | Elegans.LinePlot | Array | x | [example](http://bl.ocks.org/domitry/11338075) |
| Elegans.Particles | Elegans.ParticlesPlot | Array | x | [example](http://bl.ocks.org/domitry/11322575) |

## Usage
### Getting Started
Download latest version of Elegans from [here](https://raw.githubusercontent.com/domitry/elegans/master/release/elegans.min.js). 
And add code below to your html file.

```html:
<script type="text/javascript" src="http://cdnjs.cloudflare.com/ajax/libs/three.js/r66/three.min.js"></script>
<script type="text/javascript" src="http://cdnjs.cloudflare.com/ajax/libs/d3/3.4.4/d3.min.js"></script>
<script type="text/javascript" src="your_link_to_elegans.min.js"></script>
```

If you needs legends, add link to css file.

```html:
<link rel='stylesheet' href='https://rawgit.com/domitry/elegans/master/examples/common.css'>
```

### Generating charts with JavaScript

First you need to create stage, then generate some charts add them to the stage.

```javascript:
var stage = new Elegans.Stage(d3.select(#vis));
var surface = new Elegans.Surface(data);
stage.add(surface);
stage.render();
```

You can generate the same charts more simply, with d3.js selection and method chain style.

```javascript:
d3.select('#vis').datum(data).call(Elegans.SurfacePlot);
```


### Embed Elegans to your environment
Elegans have api to make it easier to embed it into environments except browsers, like IPython notebook.
What you have to do is to generate simple JSON object, and embed it to static html templates. See below.

```javascript:
var model = {charts:[{type:"Particles",data:{x:[1,2,3],y:[1,2,3],z:[1,2,3]},options:{color:"#000000"}}], options:{width:500, height:500}};
Elegans.Embed.parse(model, "#vis");
```

If you need more information, please see [latest examples](https://github.com/domitry/elegans/tree/master/examples).

## Build Elegans
First, pull repository from github.

```shell:
git pull https://github.com/domitry/elegans.git
```

You need to install npm with node.js before building Elegans. You can build it by running commands below.


```shell:
cd elegans
npm install
grunt release
```

## Supporting browsers
We are checking if Elegans works well on these two browsers.
* Google Chrome: Latest version
* Firefox: Latest version

## Dependency
* d3.js version 3.4.4
* three.js version r66

## License
Copyright (C) 2014 by Naoki Nishida  
This version of Elegans is licensed under the MIT license.
