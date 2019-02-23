// connect to ui and backend
var socket = io();
var mainSocket = new WebSocket('ws://localhost:9002');

function refresh() {
    // load page
    var url = new URL(document.location);
    var page = url.searchParams.get('page');
    switch (page) {
        case 'editor':
            var directory = url.searchParams.get('disk');
            socket.emit('loadeditor', directory);
            break;
        case 'channel':
            var channelName = url.searchParams.get('channel');
            socket.emit('loadchannel', channelName);
            break;
        default:
            // check if index page is loaded
            if (document.getElementById("diskFeedContainer").childNodes.length === 0) {
                socket.emit('load');
            } else {
                // hide/show containers
                document.getElementById("indexContainer").style.display = "block";
                document.getElementById("diskChannelContainer").style.display = "none";
                document.getElementById("diskFeedContainer").style.display = "flex";
                document.getElementById("diskContainer").style.display = "none";
            }
            break;
    }
}

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
    document.querySelector('#urlInput').onkeyup = function (event) {
        if (event.keyCode == 13) { // 'Enter'
            socket.emit('playURL', this.value);
            console.log("sent " + this.value);
        }
    };
}, false);

// input handlers
socket.on('load', function (msg) {
    // insert HTML body received from server into page
    document.getElementById("diskFeedContainer").innerHTML += msg;
    // hide/show containers
    document.getElementById("indexContainer").style.display = "block";
    document.getElementById("diskChannelContainer").style.display = "none";
    document.getElementById("diskFeedContainer").style.display = "flex";
    document.getElementById("diskContainer").style.display = "none";
    // add input handlers
    document.querySelectorAll('.viewChannelButton').forEach(function (viewChannelButton) {
        viewChannelButton.onclick = viewChannelButtonHandler;
    });
    document.querySelectorAll('.playDiskButton').forEach(function (playDiskButton) {
        playDiskButton.onclick = playDiskButtonHandler;
    });
    document.querySelectorAll('.editDiskButton').forEach(function (editDiskButton) {
        editDiskButton.onclick = editDiskButtonHandler;
    });
});
socket.on('loadchannel', function (msg) {
    // insert HTML body received from server into page
    document.getElementById("diskChannelContainer").innerHTML = msg;
    // hide/show containers
    document.getElementById("indexContainer").style.display = "block";
    document.getElementById("diskChannelContainer").style.display = "flex";
    document.getElementById("diskFeedContainer").style.display = "none";
    document.getElementById("diskContainer").style.display = "none";
    // add input handlers
    document.querySelectorAll('.newDiskButton').forEach(function (newDiskButton) {
        newDiskButton.onclick = newDiskButtonHandler;
    });
    document.querySelectorAll('.playDiskButton').forEach(function (playDiskButton) {
        playDiskButton.onclick = playDiskButtonHandler;
    });
    document.querySelectorAll('.editDiskButton').forEach(function (editDiskButton) {
        editDiskButton.onclick = editDiskButtonHandler;
    });
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

function editDiskButtonHandler() {
    var diskDirectory = this.parentElement.dataset.directory;
    window.history.pushState({
        page: 'editor',
        disk: diskDirectory
    }, diskDirectory, "?page=editor&disk=" + diskDirectory);
    refresh();
}

function playDiskButtonHandler() {
    var diskDirectory = this.parentElement.dataset.directory;
    socket.emit('play', diskDirectory);
}

function viewChannelButtonHandler() {
    var channelName = this.parentElement.dataset.channel;
    window.history.pushState({
        page: 'channel'
    }, channelName, "?page=channel&channel=" + channelName);
    refresh();
}

function newDiskButtonHandler() {
    var channelName = this.parentElement.dataset.channel;
    socket.emit('createdisk', channelName);
}

socket.emit('loadoutput');
var s_width = 0;
var s_height = 0;
var gap = 50;
var x_min = gap;
var x_max = 0;
var y_min = gap;
var y_max = 0;
var lastReceivedOutputMsg;

socket.on('loadoutput', function (msg) {
    lastReceivedOutputMsg = msg;
    setConfig();
});

function setConfig(msg = lastReceivedOutputMsg) {
    // add svg to HTML
    document.getElementById("outputGraphic").innerHTML = msg;
    // style SVG using measurements based on shortest distance between LEDs
    function distanceBetweenPoints(p1, p2) {
        return Math.sqrt((p1[0] - p2[0]) * (p1[0] - p2[0]) + (p1[1] - p2[1]) * (p1[1] - p2[1]));
    }
    var min_distance = 9999;
    var circles = document.getElementsByClassName('circle');
    for (var i = 1; i < circles.length; i++) {
        var p1 = [circles[i - 1].getAttribute('x1'), circles[i - 1].getAttribute('y1')];
        var p2 = [circles[i].getAttribute('x1'), circles[i].getAttribute('y1')];
        var dist = distanceBetweenPoints(p1, p2);
        if (dist < min_distance) min_distance = dist;
    }
    var svgStyle = document.createElement('style');
    svgStyle.innerHTML = ".circle{stroke:white;stroke-width:" + (0.8 * min_distance) + ";stroke-linecap:round;}.circle:hover{stroke-width:" + (1.3 * min_distance) + ";}.line{stroke:white;stroke-width:" + (0.25 * min_distance) + ";}";
    document.body.appendChild(svgStyle);
    gap = 0.5 * min_distance;
    x_min = gap;
    y_min = gap;
    // get SVG width+height and set boundaries
    s_width = document.querySelector("svg").width.baseVal.value;
    s_height = document.querySelector("svg").height.baseVal.value;
    x_max = s_width - gap;
    y_max = s_height - gap;
    // click circle event
    document.querySelectorAll(".circle").forEach(function (circle) {
        circle.onmousedown = function () {
            _drag_init(this);
            return false;
        };
    });
    // file drag and drop event
    document.querySelector('#outputForm').ondrop = function (evt) {
        evt.stopPropagation();
        evt.preventDefault(); // prevent default behaviour (file being opened)
        var files = evt.dataTransfer.files;
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
    };
    document.querySelector('#outputForm').ondragover = function (evt) {
        evt.stopPropagation();
        evt.preventDefault(); // turn off browser's default drag behaviour
    };
    // save output event
    document.querySelector('#saveOutputButton').onclick = function () {
        socket.emit('saveconfig');
    };
    // update output event
    document.querySelector('#updateOutputButton').onclick = function () {
        // update config (data structure resembles host's config.json)
        var data = {
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
    };
    // reset output event
    document.querySelector('#resetOutputButton').onclick = function () {
        setConfig();
    };
}

socket.on('loadeditor', function (msg) {
    // add received HTML to DOM
    document.getElementById("diskContainer").innerHTML = msg;
    // hide/show containers
    document.getElementById("indexContainer").style.display = "none";
    document.getElementById("diskContainer").style.display = "block";
    // enter text in channel search box event
    document.getElementById("editorChannelsInput").onkeyup = function () {
        // declare variables
        var input = this.value.toUpperCase();
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
    };
    // create channel event
    document.getElementById("newChannelButton").onclick = function () {
        // get new channel name
        var name = document.getElementById("editorChannelsInput").value;
        // todo: add disk open in editor to new channel...
        //var directory = this.parentElement.children[1].innerHTML;
        socket.emit('createchannel', name);

    };
    // delete from channel event
    document.querySelectorAll('.editorConnectedChannelItem').forEach(function (editorConnectedChannelItem) {
        editorConnectedChannelItem.onclick = editorDisconnectChannelHandler;
    });
    // add to channel event
    document.querySelectorAll('.editorDisconnectedChannelItem').forEach(function (editorDisconnectedChannelItem) {
        editorDisconnectedChannelItem.onclick = editorConnectChannelHandler;
    });
    // update file event
    document.querySelectorAll('.editorUpdateFileButton').forEach(function (editorUpdateFileButton) {
        editorUpdateFileButton.onclick = editorUpdateFileHandler;
    });
    // commit/save version event
    document.getElementById("editorSaveButton").onclick = function () {
        var directory = this.parentElement.children[1].innerHTML;
        socket.emit('saveversion', directory);
    };
    // close editor event
    document.getElementById("editorCloseButton").onclick = function () {
        // return to channel if window.history.back() is possible, else to index
        if (window.history.length > 2)
            window.history.back();
        else {
            window.history.pushState({
                page: 'index'
            }, "Home", "/");
            refresh();
        }
    };
});

function editorUpdateFileHandler() {
    // get data
    var directory, filename, fileindex, text;
    directory = this.parentElement.parentElement.children[1].innerHTML;
    filename = this.parentElement.firstElementChild.innerHTML;
    fileindex = this.parentElement.dataset.rowId;
    text = this.parentElement.children[1].value;
    // format
    var data = {
        directory: directory,
        filename: filename,
        fileID: fileindex,
        text: text
    };
    // send to server
    socket.emit('updatefile', data);
}

function editorConnectChannelHandler() {
    var directory = this.parentElement.parentElement.parentElement.children[1].innerHTML;
    var channel = this.innerHTML;
    socket.emit('createconnection', [directory, channel]);
}

function editorDisconnectChannelHandler() {
    var directory = this.parentElement.parentElement.parentElement.children[1].innerHTML;
    var channel = this.innerHTML;
    socket.emit('deleteconnection', [directory, channel]);
}

//
//
//

var selected = null, // Object of the element to be moved
    lineIn = null,
    lineOut = null,
    x_pos = 0,
    y_pos = 0, // Stores x & y coordinates of the mouse pointer
    x_elem = 0,
    y_elem = 0; // Stores top, left values (edge) of the element

// Will be called when user starts dragging an element
function _drag_init(elem) {
    // Store the object of the element which needs to be moved
    selected = elem;
    var circleId = selected.dataset.circleId;
    // get connected lines
    lineOut = selected.parentElement.querySelector('[data-from-circle-id="' + circleId + '"]');
    lineIn = selected.parentElement.querySelector('[data-from-circle-id="' + (circleId - 1) + '"]');
    // store element's top left coord
    x_elem = x_pos - selected.x1.baseVal.value;
    y_elem = y_pos - selected.y1.baseVal.value;
}

// Will be called when user dragging an element
function _move_elem(e) {
    x_pos = document.all ? window.event.clientX : e.pageX;
    y_pos = document.all ? window.event.clientY : e.pageY;
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
}

// Destroy the object when we are done
function _drop_elem() {
    // keep led in boundaries
    if (selected !== null) {
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
    // reset
    selected = null;
}

// location change
window.onpopstate = function () {
    refresh();
};

document.onmousemove = _move_elem;
document.onmouseup = _drop_elem;