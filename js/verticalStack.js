var HPCViz; //Global  namespace
/** Copyright 2019 by Vinh T. Nguyen
 *  Loading map_xml and drone model
 *  Save result to preload.result.{map, model}
 */
!function (e) {
    const t = Backbone.Model.extend({
        init: function () {
            this.result = {};
            this.texture = {};
            this._queue = new createjs.LoadQueue();
            this._queue.on('complete', this._onComplete, this);
            this._queue.on('fileload', this._onFileLoad, this);
            this._queue.on('progress', this._onProgress, this);
            this._queue.loadManifest([
                {id: "data", src: "./data/serviceWed26Sep.js"},
            ]);
        },
        _onProgress: function (e) {
            let progress = Math.round(e.loaded * 100);
            $("#loadingText").text(`Loading ${progress} %...`)

        },
        _onFileLoad: function (e) {
        },
        _onComplete: function () {
            $("#loadingIcons").remove();
            this.trigger('complete');
        }
    });
    e.Preload = t;
    e.preload = new t();
}(HPCViz || (HPCViz = {}));

!function (e) {
    const t = Backbone.Model.extend({
        init: function (dataSource) {
            this.dataSource = dataSource;
            this.layout = {
                computeHeight: 4,
                padding: 2,
                lineThickness: 0.2

            };
            this.CPUTemp1 = [];
            this.CPUTemp2 = [];
            this.CPUInletTemp = [];
            this.extractInformation = this.extractInformation.bind(this);
            this.extractCPUTemp = this.extractCPUTemp.bind(this);
            this.drawCPUTemp1 = this.drawCPUTemp1.bind(this);
            this.extractInformation();
            this.drawCPUTemp1Grid();
        },
        extractInformation: function () {
            Object.keys(this.dataSource).forEach(compute => {
                if (this.dataSource[compute].hasOwnProperty('arrTemperature')) {
                    let _tempCPU1 = [];
                    let _tempCPU2 = [];
                    let _inlet = [];
                    this.dataSource[compute].arrTemperature.forEach((_data, _index) => {
                        let ret = this.extractCPUTemp(_data);
                        if (ret.CPU1) {
                            _tempCPU1.push(ret.CPU1);
                        } else {
                            _tempCPU1.push(0);
                        }
                        _tempCPU2.push(ret.CPU2);
                        _inlet.push(ret.Inlet);
                    });
                    this.CPUTemp1.push({computeName: compute, data: _tempCPU1});
                    this.CPUTemp2.push(_tempCPU2);
                    this.CPUInletTemp.push(_inlet);
                }
            })
        },
        extractCPUTemp: function (_data) {
            let info = _data.data.service.plugin_output;
            let status = _data.data.service.status;
            let _CPUTemp1 = 0;
            let _CPUTemp2 = 0;
            let _InletTemp = 0;
            if (status === 2) {
                _CPUTemp1 = parseInt(info.slice(info.indexOf("CPU1 Temp") + 9, info.indexOf("CPU2 Temp")).replace(/\D/g, ''));
                _CPUTemp2 = parseInt(info.slice(info.indexOf("CPU2 Temp") + 9, info.indexOf("Inlet Temp")).replace(/\D/g, ''));
                _InletTemp = parseInt(info.slice(info.indexOf("Inlet Temp") + 9, info.length).replace(/\D/g, ''))
            } else {
                if (status === 16 && info.indexOf("Service") < 0) {
                    _CPUTemp1 = parseInt(info.slice(info.indexOf("CPU1 Temp") + 9, info.indexOf("CPU2 Temp")).replace(/\D/g, ''));
                    _CPUTemp2 = parseInt(info.slice(info.indexOf("CPU2 Temp") + 9, info.indexOf("Inlet Temp")).replace(/\D/g, ''));
                    _InletTemp = parseInt(info.slice(info.indexOf("Inlet Temp") + 9, info.length).replace(/\D/g, ''))
                }
            }
            return {CPU1: _CPUTemp1, CPU2: _CPUTemp2, Inlet: _InletTemp}
        },
        drawCPUTemp1Grid: function () {

            d3.select("svg#cputemp1").selectAll('g').remove()
            let _this = this;
            let rackDiv = $("#rack_size")
            rackDiv.height(1000);
            let divW = rackDiv.width();
            // let divW = rackDiv.width();
            // let divH = rackDiv.height();
            let divH = 1000;
            let padding = 5;
            let rackWidth = (divW - 9 * padding) / 10;
            let rackHeight = divH / 61;
            // _this.layout.computeHeight = divH / (this.CPUTemp1.length)
            let yScale = d3.scaleLinear()
                .domain([0, 100]) // input
                .range([rackHeight, 0]); // output
            let _totalDataPoints = d3.max(this.CPUTemp1, function (d) {
                return d.data.length
            });
            let xScale = d3.scaleLinear()
                .domain([0, _totalDataPoints - 1]) // input
                .range([0, rackWidth]); // output
            let colorScale = d3.scaleLinear()
                .domain([0, 100]) // input
                .range([1, 0]); // output
            let gap = xScale(1) - xScale(0);


            let svgCPU1 = d3.select("svg#cputemp1")
            svgCPU1.attr("width", divW).attr("height", divH)
            let groups = svgCPU1.selectAll(".computeGroup").data(this.CPUTemp1).enter()
            let compute = groups.append('g').attr("class", 'computeGroup')
                .attr("width", rackWidth)
                .attr("height", rackHeight)
                .attr("id", d => d.computeName)
                .on("click", function (d) {
                    var margin = {top: 50, right: 50, bottom: 50, left: 50}
                        , width = 400 - margin.left - margin.right // Use the window's width
                        , height = 300 - margin.top - margin.bottom; // Use the window's height
                    let _yScale = d3.scaleLinear()
                        .domain([0, 100]) // input
                        .range([height, 0]); // output

                    let _xScale = d3.scaleLinear()
                        .domain([0, d.data.length]) // input
                        .range([0, width]); // output
                    let line = d3.line()
                        .x(function (d, i) {
                            return _xScale(i);
                        }) // set the x values for the line generator
                        .y(function (d) {
                            return _yScale(d);
                        }) // set the y values for the line generator
                        .curve(d3.curveMonotoneX)
                    let tip = d3.select("#tip")
                        .style("left", (d3.event.pageX + 10) + "px")
                        .style("top", (d3.event.pageY - 28) + "px")
                    tip.transition()
                        .duration(200)
                        .style("opacity", 1);
                    tip.selectAll('svg').remove();

                    let svg = tip.append('svg').attr("width", width + margin.left + margin.right)
                        .attr("height", height + margin.top + margin.bottom).append("g")
                        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                    svg.append("text").text(d.computeName).attr("x",width/2 -15).attr("y",-10)
                    svg.append("g")
                        .attr("class", "x axis")
                        .attr("transform", "translate(0," + height + ")")
                        .call(d3.axisBottom(_xScale)); // Create an axis component with d3.axisBottom
                    svg.append("g")
                        .attr("class", "y axis")
                        .call(d3.axisLeft(_yScale)); // Create an axis component with d3.axisLeft

                    svg.append("path")
                        .datum(d.data) // 10. Binds data to the line
                        .attr("class", "line") // Assign a class for styling
                        .attr("d", line); // 11. Calls the line generator

                })
                .on("mouseout", function (d) {
                    d3.select("#tip").transition()
                        .duration(500)
                        .style("opacity", 0);
                })
                .attr("transform", function (d) {
                    let _removeCompute = d.computeName.slice(8);
                    let _rackIndex = _removeCompute.slice(0, _removeCompute.indexOf("-"));
                    let _hostIndex = _removeCompute.slice(_removeCompute.indexOf("-") + 1)
                    return `translate(${((_rackIndex - 1) % 10) * (rackWidth + padding)}, ${(_hostIndex - 1) * (rackHeight + 5)})`
                });

            let rect = compute.append("rect")
                .attr("width", function () {
                    return this.parentNode.getAttribute("width")
                })
                .attr("height", rackHeight)
                .style("fill", 'rgba(0,0,0,0.05)')

            let path = compute.append("path")
                .datum(d => d.data)
                .attr('d', function (d) {
                    let path = "";

                    for (let i = 0; i < d.length; i++) {
                        if (i === 0) {
                            path += `M 0 ${yScale(d[i])}`
                        } else {
                            if (d[i] === 0 && d[i - 1] !== 0) {
                                path += `H ${xScale(i)}`
                            } else if (d[i] === 0 && d[i - 1] === 0) {
                                continue;
                            } else if (d[i] !== 0 && d[i - 1] === 0) {
                                path += `M ${xScale(i)} ${yScale(d[i])} `
                            } else {
                                let dist = Math.pow(d[i] - d[i - 1], 2)

                                if (dist < 15 * 15) {
                                    path += `L ${xScale(i)} ${yScale(d[i])} `
                                } else {
                                    path += `H ${xScale(i)} V ${yScale(d[i])}`
                                }
                            }
                        }

                    }
                    return path;
                })
                .style("stroke-width", _this.layout.lineThickness)
                .style("stroke", function (d) {
                    let _data = d.filter(function (e) {
                        return e > 0
                    });
                    let _average = d3.mean(_data);
                    return d3.interpolateRdBu(colorScale(_average))
                })
                .attr("class", "line");

            let rectNoData = compute.selectAll(".rectNodata")
                .data(function (d) {
                    let _temp = [];
                    d.data.forEach(function (e, i) {
                        if (e === 0) {
                            _temp.push({index: i, value: e})
                        }
                    });
                    return _temp
                })
                .enter().append("rect")
                .attr("class", 'rectNodata')
                .attr("x", function (d) {
                    return xScale(d.index)
                })
                .attr("height", rackHeight)
                .attr("width", gap).style("fill", 'black')
            let circleChange = compute.selectAll('.circle').data(function (d) {
                let _circles = [];
                for (let i = 0; i < d.data.length - 1; i++) {
                    let dist = Math.pow(d.data[i + 1] - d.data[i], 2)
                    if (dist > 15 * 15) {
                        if (d.data[i + 1] !== 0 && d.data[i] !== 0)
                            _circles.push({index: i + 1, value: d.data[i + 1]})
                    }
                }
                return _circles
            }).enter()
            let circle = circleChange.append("circle")
                .attr("class", 'circle')
                .attr("val", d => d.value)
                .attr("cx", function (d) {
                    return xScale(d.index)
                }).attr("cy", function (d) {
                    return yScale(d.value)
                }).attr("r", '3px')
                .style("fill", function (d) {
                    return d3.interpolateRdBu(colorScale(d.value))
                })
        },
        drawCPUTemp1: function () {
            d3.select("svg#cputemp1").selectAll('g').remove()
            let _this = this;
            let rackDiv = $("#rack_size")
            rackDiv.height(3000);
            let divW = rackDiv.width();
            let divH = rackDiv.height();
            let rackWidth = divW;
            let rackHeight = _this.layout.computeHeight
            // _this.layout.computeHeight = divH / (this.CPUTemp1.length)
            let yScale = d3.scaleLinear()
                .domain([0, 100]) // input
                .range([rackHeight, 0]); // output
            let _totalDataPoints = d3.max(this.CPUTemp1, function (d) {
                return d.data.length
            });
            let xScale = d3.scaleLinear()
                .domain([0, _totalDataPoints - 1]) // input
                .range([0, rackWidth]); // output
            let colorScale = d3.scaleLinear()
                .domain([0, 100]) // input
                .range([1, 0]); // output
            let gap = xScale(1) - xScale(0);
            let lineGraph = d3.line()
                .defined(function (d) {
                    return d !== 0;
                })
                .x(function (d, i) {
                    return xScale(i);
                }) // set the x values for the line generator
                .y(function (d) {
                    return yScale(d);
                }) // set the y values for the line generator
                .curve(d3.curveStepAfter)

            let svgCPU1 = d3.select("svg#cputemp1")
            svgCPU1.attr("width", divW).attr("height", divH)
            let groups = svgCPU1.selectAll("g").data(this.CPUTemp1).enter()
            let compute = groups.append('g').attr("class", 'computeGroup')
                .attr("width", rackWidth)
                .attr("height", rackHeight)
                .attr("id", d => d.computeName)
                .attr("transform", function (d, i) {
                    return `translate(0,${i * (_this.layout.computeHeight + _this.layout.padding)})`
                });

            let rect = compute.append("rect")
                .attr("width", function () {
                    return this.parentNode.getAttribute("width")
                })
                .attr("height", function () {
                    return this.parentNode.getAttribute("height")
                })
                .style("fill", 'rgba(0,0,0,0.05)')

            let path = compute.append("path")
                .datum(d => d.data)
                .attr('d', function (d) {
                    let path = "";

                    for (let i = 0; i < d.length; i++) {
                        if (i === 0) {
                            path += `M 0 ${yScale(d[i])}`
                        } else {
                            if (d[i] === 0 && d[i - 1] !== 0) {
                                path += `H ${xScale(i)}`
                            } else if (d[i] === 0 && d[i - 1] === 0) {
                                continue;
                            } else if (d[i] !== 0 && d[i - 1] === 0) {
                                path += `M ${xScale(i)} ${yScale(d[i])} `
                            } else {
                                let dist = Math.pow(d[i] - d[i - 1], 2)

                                if (dist < 15 * 15) {
                                    path += `L ${xScale(i)} ${yScale(d[i])} `
                                } else {
                                    path += `H ${xScale(i)} V ${yScale(d[i])}`
                                }
                            }
                        }

                    }
                    return path;
                })
                .style("stroke-width", _this.layout.lineThickness)
                .attr("class", "line");

            let rectNoData = compute.selectAll(".rectNodata")
                .data(function (d) {
                    let _temp = [];
                    d.data.forEach(function (e, i) {
                        if (e === 0) {
                            _temp.push({index: i, value: e})
                        }
                    });
                    return _temp
                })
                .enter().append("rect")
                .attr("class", 'rectNodata')
                .attr("x", function (d) {
                    return xScale(d.index)
                })
                .attr("height", _this.layout.computeHeight)
                .attr("width", gap).style("fill", 'black')
            let circleChange = compute.selectAll('.circle').data(function (d) {
                let _circles = [];
                for (let i = 0; i < d.data.length - 1; i++) {
                    let dist = Math.pow(d.data[i + 1] - d.data[i], 2)
                    if (dist > 15 * 15) {
                        if (d.data[i + 1] !== 0 && d.data[i] !== 0)
                            _circles.push({index: i + 1, value: d.data[i + 1]})
                    }
                }
                return _circles
            }).enter()
            let circle = circleChange.append("circle")
                .attr("class", 'circle')
                .attr("val", d => d.value)
                .attr("cx", function (d) {
                    return xScale(d.index)
                }).attr("cy", function (d) {
                    return yScale(d.value)
                }).attr("r", '3px')
                .style("fill", function (d) {
                    return d3.interpolateRdBu(colorScale(d.value))
                })
        }

    });
    e.DataManager = new t();
}(HPCViz || (HPCViz = {}));

/**
 * This is the main part of the Drone simulator
 */
!function (e) {
    const t = Backbone.Model.extend({
        init: function () {
            let _this = this;
            this.preloadFinished = this.preloadFinished.bind(this)
            e.preload.on('complete', _this.preloadFinished);
            e.preload.init();

        },
        preloadFinished: function () {
            // console.log(`Loaded`)
            e.DataManager.init(sampleS)
            $('#circleColor').colorpicker().on('changeColor',
                function (event) {
                    d3.selectAll(".circle").style("stroke", event.color.toString())
                });
            $("#circleRadius").change(function () {
                d3.selectAll(".circle").attr("r", +this.value + "px")
            })

            $("#circleStroke").change(function () {
                d3.selectAll(".circle").style("stroke-width", this.value + "px")
            })

            $("#line_thick").change(function () {
                d3.selectAll(".line").style("stroke-width", this.value + "px")
            })

            $('#line_color').colorpicker().on('changeColor',
                function (event) {
                    d3.selectAll(".line").style("stroke", event.color.toString())
                });
            $(".form-check-input").on("click", function (event) {
                let colorRangeChoice = this.value
                let colorScale = d3.scaleLinear()
                    .domain([0, 100]) // input
                    .range([1, 0]); // output
                d3.selectAll(".circle").style("fill", function (d) {
                    console.log(d)
                    return d3[colorRangeChoice](colorScale(+d.value))
                })
            })
            let rackDiv = $("#rack_size")
            let divW = rackDiv.width();
            let divH = rackDiv.height();
            $("#btnGrid").on("click", function (event) {
                HPCViz.DataManager.drawCPUTemp1Grid();
            });
            $("#btnGridH").on("click", function (event) {
                HPCViz.DataManager.drawCPUTemp1();
            })
        },
    });
    e.index = new t();
}(HPCViz || (HPCViz = {}));

HPCViz.index.init();