/**
 * #input data includes host_name and plugin_output
 * #input result include query time
 */
class CPUTempInfo {
    constructor(data, result) {
        this.host_name = data.service.host_name;
        this.info = data.service.plugin_output;
        this.timequery = result.query_time
        this.dateInfo = new Date(result.query_time)
    }

    update() {
        this.CPU1 = parseInt(this.info.slice(this.info.indexOf("CPU1 Temp") + 9, this.info.indexOf("CPU2 Temp")).replace(/\D/g, ''));
        this.CPU2 = parseInt(this.info.slice(this.info.indexOf("CPU2 Temp") + 9, this.info.indexOf("Inlet Temp")).replace(/\D/g, ''));
        this.InletTemp = parseInt(this.info.slice(this.info.indexOf("Inlet Temp") + 9, this.info.length).replace(/\D/g, ''))
    }
}

class CPULoadInfo {
    constructor(data, result) {
        this.host_name = data.service.host_name;
        this.info = data.service.plugin_output;
        this.timequery = result.query_time
        this.dateInfo = new Date(result.query_time)
    }

    update() {
        if (this.info.indexOf("Average CPU load is normal") >= 0) {
            this.status = 'Normal';
            this.load = parseFloat(this.info.slice(this.info.indexOf("CPU Load:") + 9, this.info.length))
        } else {
            this.status = 'UNKNOWN'
            this.load = null;
        }
    }
}

class FanHealth {
    constructor(data, result) {
        this.host_name = data.service.host_name;
        this.info = data.service.plugin_output;
        this.timequery = result.query_time
        this.dateInfo = new Date(result.query_time)
    }

    update() {

    }
}

class MemoryUsage {
    constructor(data, result) {
    }

    update() {
    }
}

class PowerUsage {
    constructor(data, result) {
    }

    update() {
    }
}

class Temperature {
    constructor(data, result) {
        this.host_name = data.service.host_name;
        this.info = data.service.plugin_output;
        this.timequery = result.query_time
        this.dateInfo = new Date(result.query_time);
        this.status = data.service.status;
    }

    update() {
        if (this.status === 2) {
            this.CPU1 = parseInt(this.info.slice(this.info.indexOf("CPU1 Temp") + 9, this.info.indexOf("CPU2 Temp")).replace(/\D/g, ''));
            this.CPU2 = parseInt(this.info.slice(this.info.indexOf("CPU2 Temp") + 9, this.info.indexOf("Inlet Temp")).replace(/\D/g, ''));
            this.InletTemp = parseInt(this.info.slice(this.info.indexOf("Inlet Temp") + 9, this.info.length).replace(/\D/g, ''))
        } else {
            if (this.status === 16 && this.info.indexOf("Service") < 0) {
                this.CPU1 = parseInt(this.info.slice(this.info.indexOf("CPU1 Temp") + 9, this.info.indexOf("CPU2 Temp")).replace(/\D/g, ''));
                this.CPU2 = parseInt(this.info.slice(this.info.indexOf("CPU2 Temp") + 9, this.info.indexOf("Inlet Temp")).replace(/\D/g, ''));
                this.InletTemp = parseInt(this.info.slice(this.info.indexOf("Inlet Temp") + 9, this.info.length).replace(/\D/g, ''))
            }
        }
    }
}

class ComputeNode {
    constructor(_name) {
        this.cpuTempInfo = [];
        this.cpuLoad = [];
        this.fansHealth = [];
        this.temperature = [];
        this.temperatureCPU1 = [];
        this.temperatureCPU2 = [];
        this.computeName = _name;
    }

    insertTemperature(data, result) {
        let _temperature = new Temperature(data, result)
        _temperature.update();
        this.temperature.push(_temperature)
    }

    insertCPUTempInfo(data, result) {
        let _cpuTempInfo = new CPUTempInfo(data, result)
        _cpuTempInfo.update();
        this.cpuTempInfo.push(_cpuTempInfo)
    }

    insertCPULoad(data, result) {
        let _cpuLoad = new CPULoadInfo(data, result)
        _cpuLoad.update();
        this.cpuLoad.push(_cpuLoad)
    }

    insertFansHealth(data, result) {
        let _fanHealth = new FanHealth(data, result)
        _fanHealth.update();
        this.fansHealth.push(_fanHealth)
    }

    gettemperatureCPU1() {
        let _return = [];

        this.temperature.forEach(el => {
            _return.push(el.CPU1)
        });
        return _return;
    }

    gettemperatureCPU2() {
        let _return = [];
        this.temperature.forEach(el => {
            _return.push(el.CPU2)
        });
        return _return;
    }

    gettemperatureInletTemp() {
        let _return = [];
        this.temperature.forEach(el => {
            _return.push(el.InletTemp)
        });
        return _return;
    }
}

class ChangeDetector {
    constructor() {
        this.trackedChanges = [];

    }

    step(value) {
        if (value) {
            if (this.trackedChanges.length > 0) {
                let lastSeen = this.trackedChanges[this.trackedChanges.length - 1]
                let distance = Math.pow(value - lastSeen.y, 2);
                if (distance < 20 * 20) {
                    this.trackedChanges.push({y: value, index: this.trackedChanges.length, dotVisible: false})
                } else {
                    this.trackedChanges.push({y: value, index: this.trackedChanges.length, dotVisible: true})

                }
            } else {
                this.trackedChanges.push({y: value, index: this.trackedChanges.length, dotVisible: false})

            }

        } else {
            let lastSeen = this.trackedChanges[this.trackedChanges.length - 1]
            if (lastSeen && lastSeen.y !== 0) {
                this.trackedChanges.push({y: 0, index: this.trackedChanges.length, dotVisible: true})

            } else {
                this.trackedChanges.push({y: 0, index: this.trackedChanges.length, dotVisible: false})

            }
        }

    }
}

class HPCViz {
    constructor() {
        this.nodes = [];
    }

    update(computeNode) {
        this.nodes.push(computeNode)
    }

    generateLineCPUTemp1() {
        var div = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);
        var xScale = d3.scaleLinear()
            .domain([0, 7]) // input
            .range([0, 150]); // output

        var yScale = d3.scaleLinear()
            .domain([0, 100]) // input
            .range([30, 0]); // output
        var lineGraph = d3.line()
            .x(function (d, i) {
                return xScale(i);
            }) // set the x values for the line generator
            .y(function (d) {
                return yScale(d.y);
            }) // set the y values for the line generator
            .curve(d3.curveStepAfter) // apply smoothing to the line

        let svg_m = d3.select("#main")
            .attr("width", window.innerWidth)
            .attr("height", 1500);
        let lines = svg_m.selectAll('.lineChart').data(this.nodes).enter()
        let line = lines.append("g")
            .attr("class", 'lineChart')
            .attr("id", d => d.computeName)
            .attr("transform", function (d, i) {

                return `translate(${(i % 10) * 150}, ${(Math.floor(i / 10)) * 25})`
            });
        line.append("path")
            .datum(function (d) {
                return d.trackedCPU1.trackedChanges
            }) // 10. Binds data to the line
            .attr("class", "line") // Assign a class for styling
            .attr("d", lineGraph); // 11. Calls the line generator
        line.selectAll(".dot")
            .data(function (d) {
                return d.trackedCPU1.trackedChanges
            })
            .enter().append("circle") // Uses the enter().append() method
            .attr("class", "dot") // Assign a class for styling
            .attr("cx", function (d, i) {
                return xScale(i)
            })
            .attr("cy", function (d) {
                return yScale(d.y)
            })
            .attr("r", 3)
            .on("mouseover", function (d) {
                div.transition()
                    .duration(200)
                    .style("opacity", .9);
                div.html(d.computeName + "<br/>")
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
            })
            .on("mouseout", function (d) {
                div.transition()
                    .duration(500)
                    .style("opacity", 0);
            });
    }

    generateLineCPUTemp2(params) {
        let svg_m = d3.select("#main")
            .attr("width", params.screen_width)
            .attr("height", params.screen_height)
        let defaultRackWidth = (params.screen_width - 9 * params.rack_padding) / 10;
        let defaultRackHeight = (params.screen_height) / 61;
        console.log(defaultRackHeight)
        let yScale = d3.scaleLinear()
            .domain([0, 100]) // input
            .range([defaultRackHeight, 0]); // output
        let groups = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        let titleGroup = svg_m.selectAll('.groupM').data(groups).enter()
        titleGroup.append('rect')
            .attr('x', function (d, i) {
                return i * (defaultRackWidth + params.rack_padding)

            })
            .attr('id', (d, i) => "rect " + i)
            .attr("class", 'groupM')
            .attr('y', 10)
            .attr('width', defaultRackWidth)
            .attr('height', params.screen_height - 10)
            .style('fill', 'none')
            .style("stroke", 'black')
            .attr('rx', "5px")
        titleGroup.append("text").text(function (d, i) {
            return `Rack ${i + 1}`
        }).attr('y', 25)
            .attr('x', function (d, i) {
                return i * (defaultRackWidth + params.rack_padding) + defaultRackWidth / 4
            });


        // let groupNode = svg_m.selectAll('.groupCompute').data(this.nodes).enter();
        // groupNode.append("g")
        //     .attr("class", 'groupCompute')
        //     .attr("transform", function (d, i) {
        //         let _removeCompute = d.computeName.slice(8);
        //         let _rackIndex = _removeCompute.slice(0, _removeCompute.indexOf("-"));
        //         let _hostIndex = _removeCompute.slice(_removeCompute.indexOf("-") + 1);
        //         return `translate(${((_rackIndex - 1) % 10) * (defaultRackWidth + params.rack_padding)},${_hostIndex * (defaultRackHeight) + 20})`
        //      });
        // let backgroundRect = groupNode.append("rect")
        //     .style('fill', 'rgba(0,0,0,0.1)')
        //     .attr("height", defaultRackHeight - 2)
        //     .attr("width", defaultRackWidth)
        //     .attr("id", d => d.computeName)
        // let lineChart = groupNode.append("path").datum(d=>d.trackedCPU2.trackedChanges) // 10. Binds data to the line
        //     .attr("class", "line") // Assign a class for styling
        //     .attr("d", function (d) {
        //         console.log(d)
        //         let xScale = d3.scaleLinear()
        //             .domain([0, d.length]) // input
        //             .range([0, defaultRackWidth]); // output
        //       return  d3.line()
        //             .x(function (d, i) {
        //                 return xScale(i);
        //             }) // set the x values for the line generator
        //             .y(function (d) {
        //                 return yScale(d.y);
        //             }) // set the y values for the line generator
        //             .curve(d3.curveStepAfter)
        //     });
        let colorScale = d3.scaleLinear()
            .domain([0, 100]) // input
            .range([1, 0]); // output
        this.nodes.forEach((compute, index) => {
            let ticks = defaultRackWidth / (compute.trackedCPU2.trackedChanges.length+1);
            let missingVals = compute.trackedCPU2.trackedChanges.filter(function (d, i) {
                return d.y === 0
            })


            let xScale = d3.scaleLinear()
                .domain([0, compute.trackedCPU2.trackedChanges.length-1]) // input
                .range([0, defaultRackWidth]); // output
            function drawLine(dat){
                let path ="";
                for(let i=0; i<dat.length-1;i++){
                    if(i===0){
                        if(dat[i].y!==0){
                            path =`M0,${xScale(i)} L${i*50},${yScale(dat[i+1].y)} `
                        }else{
                            path =`M0,${xScale(i)} L${i*50},${yScale(dat[i].y)} `
                        }

                    }else{
                        if(dat[i].y===0){
                            path += ` M${xScale(i)},${yScale(dat[i+1].y)}`
                        }else{
                            let distance = Math.pow(dat[i+1].y - dat[i].y, 2);
                            if(distance < 20*20){
                                path += ` L${xScale(i)},${yScale(dat[i+1].y)}`
                            }else{
                                path += ` L${xScale(i+1)},${yScale(dat[i+1].y)}`
                            }

                        }

                    }
                }
                return path;
            }
            let lineGraph = d3.line()
                .defined(d => d)
                .x(function (d, i) {
                    return xScale(i);
                }) // set the x values for the line generator
                .y(function (d) {
                    return yScale(d.y);
                }) // set the y values for the line generator
                .curve(d3.curveStepAfter)
            let lineGroup = svg_m.append("g").attr("class", 'lineChart')
                .attr("id", compute.computeName)
                .attr("transform", function () {
                    let _removeCompute = compute.computeName.slice(8);
                    let _rackIndex = _removeCompute.slice(0, _removeCompute.indexOf("-"));
                    let _hostIndex = _removeCompute.slice(_removeCompute.indexOf("-") + 1)
                    return `translate(${((_rackIndex - 1) % 10) * (defaultRackWidth + params.rack_padding)}, ${_hostIndex * (defaultRackHeight) + 20})`
                });
            lineGroup.append('rect')
                .attr('id',compute.computeName)
                .attr('x', 0).attr('y', 0)
                .attr('width', defaultRackWidth)
                .attr("height", defaultRackHeight-1)
                .style('fill', 'rgba(0,0,0,0.01)')



            lineGroup.append("path")
                .datum(function (d) {
                    return compute.trackedCPU2.trackedChanges
                        .filter(lineGraph.defined())
                })
                .attr("class", "line") // Assign a class for styling
                .attr("d", function (d) {
                    return drawLine(d)
                });

            missingVals.forEach((m,i) => {
                let rect = lineGroup.append("rect")
                    .attr('x', function (d) {
                    return xScale(m.index)
                    })
                    .attr('width', ticks)
                    .attr("height", defaultRackHeight)
                    .style('fill', function (d,i) {
                        return '#bbb'
                    })
            })
            let dot = lineGroup.selectAll('.dot').data(compute.trackedCPU2.trackedChanges).enter()
            dot.append("circle") // Uses the enter().append() method
                .attr("class", "dot") // Assign a class for styling
                .attr("fill", function (d) {
                    if (d.y > 90) {
                        return 'red'
                    } else if (0 < d.y && d.y < 90) {

                        return d3.interpolateRdBu(colorScale(d.y))
                    } else {
                        return 'rgba(0,0,0,0.5)'
                    }
                })
                .attr("cx", function (d, i) {
                    return xScale(i)
                })
                .attr("cy", function (d) {
                    return yScale(d.y)
                })
                .attr("r", function (d,i) {
                    if(d.dotVisible) return 3
                    else return 0
                })


        })

    }
}

function updateBoardLayout(params) {
    // Update with and height
    d3.select("#main").selectAll('.groupM')
        .attr("width", params.rack_width)
        .attr('x', function (d, i) {
            return i * (params.rack_width + params.rack_padding)

        });
    d3.select("#main").selectAll('text')
        .attr('x', function (d, i) {
            return i * (params.rack_width + params.rack_padding) + params.rack_padding / 2
        });
}

const HPCVizManager = new HPCViz();
d3.json("data/serviceWed26Sep.json", function (error, progress) {
}).then(function (data) {
    Object.keys(data).forEach((compute, index) => {
        let _computeNode = new ComputeNode(compute);
        if (data[compute].hasOwnProperty('arr')) {
            data[compute].arr.forEach((_data, _index) => {
                _computeNode.insertCPUTempInfo(_data.data, _data.result)
            });
        }
        data[compute].arrCPU_load.forEach((_data, _index) => {
            _computeNode.insertCPULoad(_data.data, _data.result)
        });
        data[compute].arrFans_health.forEach((_data, _index) => {
            _computeNode.insertFansHealth(_data.data, _data.result)
        });
        data[compute].arrTemperature.forEach((_data, _index) => {
            _computeNode.insertTemperature(_data.data, _data.result)
        });
        HPCVizManager.update(_computeNode)
    });
    HPCVizManager.nodes.forEach(node => {
        let _temp1 = node.gettemperatureCPU1();
        let _temp2 = node.gettemperatureCPU2();
        node.trackedCPU1 = new ChangeDetector()
        node.trackedCPU2 = new ChangeDetector()
        _temp1.forEach(temp => {
            if (temp) {
                node.trackedCPU1.step(temp)

            } else {
                node.trackedCPU1.step(50)

            }
        });
        _temp2.forEach(temp => {
            node.trackedCPU2.step(temp)
        });
    });

    let sw = $("#rack_size").width();
    let sh = $("#rack_size").height();
    let params = {rack_width: 150, screen_width: sw, screen_height: sh, rack_padding: 10};
    HPCVizManager.generateLineCPUTemp2(params);
    $("#rack_width").change(function () {
        params.rack_width = +this.value;
        updateBoardLayout(params)
    })
});
