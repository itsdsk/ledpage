// connect to ui and backend
var socket = io();
var mainSocket = new WebSocket('ws://localhost:9002');

var selected = null, // Object of the element to be moved
    lineIn = null,
    lineOut = null,
    x_pos = 0,
    y_pos = 0, // Stores x & y coordinates of the mouse pointer
    x_elem = 0,
    y_elem = 0; // Stores top, left values (edge) of the element
var s_width = 0;
var s_height = 0;
var gap = 50;
var x_min = gap;
var x_max = 0;
var y_min = gap;
var y_max = 0;
var lastReceivedOutputMsg;

socket.emit('loadoutput');

function refresh() {
    // load page
    var url = new URL(document.location);
    var page = url.searchParams.get('page');
    switch (page) {
        case 'editor':
            socket.emit('loadeditor', url.searchParams.get('disk'));
            break;
        case 'channel':
            socket.emit('loadchannel', url.searchParams.get('channel'));
            break;
        default:
            // check if index page is loaded
            if (document.getElementById("diskFeedContainer").childNodes.length === 0) {
                socket.emit('load');
            } else {
                // show feed div and hide other containers
                changeStyleToView('feed');
            }
            break;
    }
}

function setConfig(msg = lastReceivedOutputMsg) {
    // add svg to HTML
    document.getElementById("outputGraphic").innerHTML = msg;
    // 2D euclidean distance helper
    function distanceBetweenPoints(p1, p2) {
        return Math.sqrt((p1[0] - p2[0]) * (p1[0] - p2[0]) + (p1[1] - p2[1]) * (p1[1] - p2[1]));
    }
    // try to get shortest distance between points (for SVG styling)
    var min_distance = 9999;
    var circles = document.getElementsByClassName('circle');
    for (var i = 1; i < circles.length; i++) {
        var p1 = [circles[i].getAttribute('x1'), circles[i].getAttribute('y1')];
        var p2 = [circles[0].getAttribute('x1'), circles[0].getAttribute('y1')];
        var dist = distanceBetweenPoints(p1, p2);
        if (dist < min_distance) min_distance = dist;
    }
    // use calculated min_distance between points as SVG circle width
    var circleWidth = Math.min(0.8 * min_distance, 25);
    // style SVG
    var svgStyle = document.createElement('style');
    svgStyle.innerHTML = `
        .circle{stroke:white;stroke-width:` + circleWidth.toString() + `px;stroke-linecap:round;}
        .circle:hover{stroke-width:` + (circleWidth + 5).toString() + `px;}
        .line{stroke:white;stroke-width:` + (0.25 * circleWidth).toString() + `px;}
    `;
    document.body.appendChild(svgStyle);
    // get SVG width+height
    s_width = document.querySelector("svg").width.baseVal.value;
    s_height = document.querySelector("svg").height.baseVal.value;
    // set boundary values for SVG interaction
    gap = 0.5 * min_distance;
    x_min = gap;
    y_min = gap;
    x_max = s_width - gap;
    y_max = s_height - gap;
}

function changeStyleToView(view) {
    // show/hide containers, argument should be 'feed', 'channel' or 'editor'
    document.getElementById("indexContainer").style.display = (view == "editor" ? "none" : "block");
    document.getElementById("diskChannelContainer").style.display = (view == "channel" ? "flex" : "none");
    document.getElementById("diskFeedContainer").style.display = (view == "feed" ? "flex" : "none");
    document.getElementById("diskContainer").style.display = (view == "editor" ? "block" : "none");
}

// event handlers
document.addEventListener('DOMContentLoaded', function () {
    // load page
    refresh();
    // events to handle user interactions on main page
    document.querySelector('#brightnessInput').onchange = function () {
        var data = {
            "window": {
                "brightness": parseFloat(this.value)
            }
        };
        console.log(JSON.stringify(data));
        mainSocket.send(JSON.stringify(data));
    };
}, false);
document.addEventListener('click', function (event) {
    // handle mouseclick events
    var channelName, diskDirectory, data;
    // mouseclick events
    if (event.target.matches('.viewChannelButton')) {
        //
        channelName = event.target.parentElement.dataset.channel;
        window.history.pushState({
            page: 'channel'
        }, channelName, "?page=channel&channel=" + channelName);
        refresh();
    } else if (event.target.matches('.playDiskButton')) {
        //
        diskDirectory = event.target.parentElement.dataset.directory;
        socket.emit('play', {
            directory: diskDirectory
        });
    } else if (event.target.matches('.editDiskButton')) {
        //
        diskDirectory = event.target.parentElement.dataset.directory;
        window.history.pushState({
            page: 'editor',
            disk: diskDirectory
        }, diskDirectory, "?page=editor&disk=" + diskDirectory);
        refresh();
    } else if (event.target.matches('.newDiskButton')) {
        //
        channelName = event.target.parentElement.dataset.channel;
        socket.emit('createdisk', channelName);
    } else if (event.target.matches('#newChannelButton')) {
        // get new channel name
        var name = document.getElementById("editorChannelsInput").value;
        // todo: add disk open in editor to new channel...
        // also todo: add new channel list element
        //var directory = this.parentElement.children[1].innerHTML;
        socket.emit('createchannel', name);
    } else if (event.target.matches('.editorConnectedChannelItem')) {
        // disconnect
        diskDirectory = event.target.parentElement.parentElement.parentElement.dataset.diskDirectory;
        channelName = event.target.innerHTML;
        socket.emit('deleteconnection', [diskDirectory, channelName]);
    } else if (event.target.matches('.editorDisconnectedChannelItem')) {
        // connect
        diskDirectory = event.target.parentElement.parentElement.parentElement.dataset.diskDirectory;
        channelName = event.target.innerHTML;
        socket.emit('createconnection', [diskDirectory, channelName]);
    } else if (event.target.matches('#editorCreateFileButton')) {
        // new file
        diskDirectory = event.target.parentElement.dataset.diskDirectory;
        socket.emit('createfile', diskDirectory);
    } else if (event.target.matches('.editorUpdateFileButton')) {
        // get data
        var filename, fileindex, text;
        diskDirectory = event.target.parentElement.parentElement.dataset.diskDirectory;
        filename = event.target.parentElement.firstElementChild.innerHTML;
        fileindex = event.target.parentElement.dataset.rowId;
        text = event.target.parentElement.children[1].value;
        // format
        data = {
            directory: diskDirectory,
            filename: filename,
            fileID: fileindex,
            text: text
        };
        // send to server
        socket.emit('updatefile', data);
    } else if (event.target.matches('.editorRemoveFileButton')) {
        // get data
        var filename, fileindex;
        diskDirectory = event.target.parentElement.parentElement.dataset.diskDirectory;
        filename = event.target.parentElement.firstElementChild.innerHTML;
        fileindex = event.target.parentElement.dataset.rowId;
        // format
        data = {
            directory: diskDirectory,
            filename: filename,
            fileID: fileindex
        };
        // send to server
        socket.emit('removefile', data);
    } else if (event.target.matches('#editorSaveButton')) {
        // commit/save version event
        diskDirectory = event.target.parentElement.dataset.diskDirectory;
        socket.emit('saveversion', diskDirectory);
    } else if (event.target.matches('#editorCloseButton')) {
        // return to channel if window.history.back() is possible, else to index
        if (window.history.length > 2)
            window.history.back();
        else {
            window.history.pushState({
                page: 'index'
            }, "Home", "/");
            refresh();
        }
    } else if (event.target.matches('.editorVersionButton')) {
        // edit version event
        var version = event.target.dataset.id;
        diskDirectory = event.target.parentElement.parentElement.parentElement.dataset.diskDirectory;
        socket.emit('play', {
            directory: diskDirectory,
            version: +version
        });
    } else if (event.target.matches('#saveOutputButton')) {
        // save output button
        socket.emit('saveconfig');
    } else if (event.target.matches('#updateOutputButton')) {
        // update config (data structure resembles host's config.json)
        data = {
            "window": {},
            "outputs": []
        };
        // get window properties
        document.querySelectorAll("#outputForm .window input").forEach(function (windowProperty) {
            data.window[windowProperty.className] = windowProperty.value;
        });
        // get output properties (except LEDs)
        document.querySelectorAll("#outputForm .outputs > div").forEach(function (outputDiv) {
            var output = {
                "index": parseInt(outputDiv.dataset.outputId),
                "properties": {}
            };
            outputDiv.querySelectorAll(".properties textarea,input").forEach(function (propertyInput) {
                output.properties[propertyInput.className] = propertyInput.value;
            });
            data.outputs.push(output);
        });
        // send to server
        socket.emit('updateconfig', data);
    } else if (event.target.matches('#resetOutputButton')) {
        // reset output
        setConfig();
    } else if (event.target.matches('#restartBackendButton')) {
        // restart backend process
        socket.emit('restartservice', 'disk-backend-daemon.service');
    } else if (event.target.matches('#restartRendererButton')) {
        // restart renderer process
        socket.emit('restartservice', 'disk-renderer-daemon.service');
    } else if (event.target.matches('#getLogsButton')) {
        // get process logs
        socket.emit('getlogs');
    } else if (event.target.matches('#shutdownButton')) {
        socket.emit('systempower', 'shutdown');
    } else if (event.target.matches('#rebootButton')) {
        socket.emit('systempower', 'reboot');
    }
}, false);
document.addEventListener('mousedown', function (event) {
    // click circle event, will be called when user starts dragging LED
    if (event.target.matches('.circle')) {
        // Store the object of the element which needs to be moved
        selected = event.target;
        var circleId = selected.dataset.circleId;
        // get connected lines
        lineOut = selected.parentElement.querySelector('[data-from-circle-id="' + circleId + '"]');
        lineIn = selected.parentElement.querySelector('[data-from-circle-id="' + (circleId - 1) + '"]');
        // store element's top left coord
        x_elem = x_pos - selected.x1.baseVal.value;
        y_elem = y_pos - selected.y1.baseVal.value;
        return false;
    }
}, false);
document.addEventListener('mouseup', function () {
    if (selected !== null) {
        // keep led in boundaries
        x_pos = Math.min(Math.max(x_pos - x_elem, x_min), x_max);
        y_pos = Math.min(Math.max(y_pos - y_elem, y_min), y_max);
        selected.x1.baseVal.value = x_pos;
        selected.y1.baseVal.value = y_pos;
        selected.x2.baseVal.value = x_pos;
        selected.y2.baseVal.value = y_pos;
        if (lineIn) {
            lineIn.x2.baseVal.value = x_pos;
            lineIn.y2.baseVal.value = y_pos;
        }
        if (lineOut) {
            lineOut.x1.baseVal.value = x_pos;
            lineOut.y1.baseVal.value = y_pos;
        }
        // LED formatted as a subset of the host's config.json
        var data = {
            "outputs": [{
                "index": parseInt(selected.parentElement.dataset.outputId),
                "leds": [{
                    "index": parseInt(selected.dataset.circleId),
                    "x": selected.x1.baseVal.value,
                    "y": selected.y1.baseVal.value,
                    "r": parseInt(selected.dataset.radiusId)
                }]
            }]
        };
        // send updated led(s) to server
        //socket.emit('updateconfig', data); // sends full structure of LEDs?
        mainSocket.send(JSON.stringify(data)); // send direct to host backend?
    }
    // destroy/reset SVG object used for interaction
    selected = null;
}, false);
document.addEventListener('dragover', function (event) {
    // file drag and drop event
    if (document.getElementById('outputForm').contains(event.target)) {
        // turn off browser's default drag behaviour
        event.stopPropagation();
        event.preventDefault();
    }
}, false);
document.addEventListener('mousemove', function (event) {
    // called when user is dragging an element
    x_pos = document.all ? window.event.clientX : event.pageX;
    y_pos = document.all ? window.event.clientY : event.pageY;
    if (selected !== null) {
        selected.x1.baseVal.value = x_pos - x_elem;
        selected.y1.baseVal.value = y_pos - y_elem;
        selected.x2.baseVal.value = x_pos - x_elem;
        selected.y2.baseVal.value = y_pos - y_elem;
        if (lineIn) {
            lineIn.x2.baseVal.value = x_pos - x_elem;
            lineIn.y2.baseVal.value = y_pos - y_elem;
        }
        if (lineOut) {
            lineOut.x1.baseVal.value = x_pos - x_elem;
            lineOut.y1.baseVal.value = y_pos - y_elem;
        }
    }
}, false);
document.addEventListener('drop', function (event) {
    // file drag and drop event
    if (document.getElementById('outputForm').contains(event.target)) {
        event.stopPropagation();
        event.preventDefault(); // prevent default behaviour (file being opened)
        var files = event.dataTransfer.files;
        // continue if single JSON file was dropped
        if (files.length == 1) {
            if (files[0].type == "application/json") {
                // parse JSON file
                var reader = new FileReader();
                reader.onload = (function () {
                    return function (e) {
                        var jsonconf;
                        try {
                            jsonconf = JSON.parse(e.target.result);
                        } catch (ex) {
                            alert('exception caught when parsing json: ' + ex);
                        }
                        // send uploaded config to server
                        socket.emit('uploadconfig', jsonconf);
                    };
                })(files[0]);
                reader.readAsText(files[0]);
            }
        }
    }
}, false);
document.addEventListener('keyup', function (event) {
    // handle keyboard button up events
    if (event.target.matches('#urlInput')) {
        if (event.keyCode == 13) { // 'Enter'
            socket.emit('playURL', event.target.value);
            console.log("sent " + event.target.value);
        }
    } else if (event.target.matches('.filenameInput')) {
        if (event.keyCode == 13) { // 'Enter'
            // get data
            var oldName, newName, fileindex, diskDirectory;
            diskDirectory = event.target.parentElement.parentElement.dataset.diskDirectory;
            newName = event.target.value;
            oldName = event.target.parentElement.firstElementChild.innerHTML;
            fileindex = event.target.parentElement.dataset.rowId;
            // format
            var data = {
                directory: diskDirectory,
                oldName: oldName,
                newName: newName,
                fileID: fileindex
            };
            // send to server
            socket.emit('renamefile', data);
        }
    } else if (event.target.matches('#editorChannelsInput')) {
        // filter channels when text is entered into channel search box
        // declare variables
        var input = event.target.value.toUpperCase();
        var ul, li, a, i, txtValue;
        ul = document.getElementById('editorChannelList');
        li = ul.getElementsByTagName("li");
        // loop through list items
        for (i = 0; i < li.length; i++) {
            a = li[i].getElementsByTagName("a")[0];
            txtValue = a.textContent || a.innerText;
            if (txtValue.toUpperCase().indexOf(input) > -1) {
                li[i].style.display = "";
            } else {
                li[i].style.display = "none";
            }
        }
    }
}, false);
window.onpopstate = function () {
    // location change
    refresh();
};

// websocket handlers
socket.on('load', function (msg) {
    // insert HTML body received from server into page
    document.getElementById("diskFeedContainer").innerHTML += msg;
    // show feed div and hide other containers
    changeStyleToView('feed');
});
socket.on('loadchannel', function (msg) {
    // insert HTML body received from server into page
    document.getElementById("diskChannelContainer").innerHTML = msg;
    // show channel div and hide other containers
    changeStyleToView('channel');
});
socket.on('changeddisk', function (msg) {
    // load editor on disk received from server, adding to URL history if new
    if (JSON.stringify(window.history.state) !== msg) {
        var parsedMsg = JSON.parse(msg);
        window.history.pushState({
            page: 'editor',
            disk: parsedMsg.disk
        }, parsedMsg.disk, "?page=editor&disk=" + parsedMsg.disk);
    }
    refresh();
});
socket.on('loadoutput', function (msg) {
    lastReceivedOutputMsg = msg;
    setConfig();
});
socket.on('loadeditor', function (msg) {
    // add received HTML to DOM
    document.getElementById("diskContainer").innerHTML = msg;
    // show editor div and hide other containers
    changeStyleToView('editor');
});
socket.on('getlogs', function (msg) {
    console.log(msg);
});