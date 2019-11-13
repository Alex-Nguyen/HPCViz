
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
            if(this.trackedChanges.length>0){
                let lastSeen = this.trackedChanges[this.trackedChanges.length -1]
                let distance = Math.pow(value-lastSeen.y, 2)
                if(distance < 20*20){
                    this.trackedChanges.push({y: value, index: this.trackedChanges.length,dotVisible:false})
                }else{
                    this.trackedChanges.push({y: value, index: this.trackedChanges.length,dotVisible:true})

                }
            }else{
                this.trackedChanges.push({y: value, index: this.trackedChanges.length,dotVisible:false})

            }

        } else {
            let lastSeen = this.trackedChanges[this.trackedChanges.length -1]
            if(lastSeen&&lastSeen.y!==0){
                this.trackedChanges.push({y: 0, index: this.trackedChanges.length,dotVisible:true})

            }else{
                this.trackedChanges.push({y: 0, index: this.trackedChanges.length,dotVisible:false})

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
            .attr("height", 1600)
        let yScale = d3.scaleLinear()
            .domain([0, 100]) // input
            .range([25, 0]); // output
        let groups = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        let titleGroup = svg_m.selectAll('.groupM').data(groups).enter()
        titleGroup.append('rect')
            .attr('x', function (d, i) {
                return (i % 10) * params.rack_width
            })
            .attr('y', 10)
            .attr('width', params.rack_width)
            .attr('height', 1550)
            .style('fill', 'none')
            .style("stroke", 'black')
            .attr('rx', "10px")
        titleGroup.append("text").text(function (d, i) {
            return `Rack ${i + 1}`
        }).attr('y', 25).attr('x', function (d, i) {
            return (i % 10) * params.rack_width + 40
        });
        this.nodes.forEach((compute, index) => {
            let ticks = 100 / compute.trackedCPU2.trackedChanges.length;
            let missingVals = compute.trackedCPU2.trackedChanges.filter(function (d, i) {
                return d.y === 0
            })


            let xScale = d3.scaleLinear()
                .domain([0, compute.trackedCPU2.trackedChanges.length]) // input
                .range([0, params.rack_width-20]); // output
            let lineGraph = d3.line()
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
                    return `translate(${((_rackIndex - 1) % 10) * params.rack_width + 30}, ${_hostIndex * 25 + 5})`
                });
            lineGroup.append('rect').attr('x', 0).attr('y', 0).attr('width', 110).attr("height", 24).style('fill', 'rgba(0,0,0,0.01)')
            lineGroup.append('text').text(function () {
                let _removeCompute = compute.computeName.slice(8);
                let _hostIndex = _removeCompute.slice(_removeCompute.indexOf("-") + 1)
                return _hostIndex
            }).attr('x', -25).attr("y", 15)
            lineGroup.append("path")
                .datum(compute.trackedCPU2.trackedChanges) // 10. Binds data to the line
                .attr("class", "line") // Assign a class for styling
                .attr("d", lineGraph); // 11. Calls the line generator

            missingVals.forEach(m => {
                let rect = lineGroup.append("rect").attr('x', function (d) {
                    return xScale(m.index)
                }).attr('width', ticks).attr("height", 25).style('fill', '#bbb')
            })
            let dot = lineGroup.selectAll('.dot').data(compute.trackedCPU2.trackedChanges).enter()
            dot.append("circle") // Uses the enter().append() method
                .attr("class", "dot") // Assign a class for styling
                .attr("fill", function (d) {
                    if (d.y > 90) {
                        return 'red'
                    } else if (0 < d.y && d.y < 90) {
                        return 'blue'
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
    HPCVizManager.generateLineCPUTemp2({rack_width:150,screen_width:1800});
    $("#rack_width").change(function () {
        console.log(this.value)
        HPCVizManager.generateLineCPUTemp2({rack_width:this.value, screen_width:1800});
    })
});
