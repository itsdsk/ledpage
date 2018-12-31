var socket = io();

socket.emit('load');
socket.on('load', function (msg) {
    //console.log(msg);
    document.getElementById("container").innerHTML += (msg);
});

socket.emit('loadoutput');
var s_width = 0,
    s_height = 0;
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
    // get SVG width+height and set boundaries
    s_width = document.querySelector("svg").width.baseVal.value;
    s_height = document.querySelector("svg").height.baseVal.value;
    x_max = s_width - gap;
    y_max = s_height - gap;
    // add event for dragging to circles
    document.querySelectorAll("circle").forEach(function (circle) {
        circle.onmousedown = function () {
            // circle id (e.g. output 0 circle 1 = "o0_c1") has connected line IN with id "o0_c0l" and line OUT with id "o0_c1l"
            var _lineIn = document.querySelector("#" + circle.id.replace(/.$/, parseInt(circle.id.slice(-1)) - 1) + "l");
            var _lineOut = document.querySelector("#" + circle.id + "l");
            _drag_init(this, _lineIn, _lineOut);
            return false;
        };
    });
}

function resetConfig() {
    setConfig();
}

function updateConfig() {
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
            "device": outputDiv.className,
            "properties": {}
        };
        outputDiv.querySelectorAll(".properties textarea,input").forEach(function (propertyInput) {
            output.properties[propertyInput.className] = propertyInput.value;
        });
        data.outputs.push(output);
    });
    // send to server
    socket.emit('updateconfig', data);
}

function updateFile(directory, filename, fileIndex) {
    var html = document.querySelector('#' + directory + '_' + fileIndex).value;
    var data = {
        directory: directory,
        filename: filename,
        fileID: fileIndex,
        text: html
    };
    socket.emit('updatefile', data);
}

function deleteConnection(directory, channel) {
    socket.emit('deleteconnection', [directory, channel]);
}

function createConnection(directory, channel) {
    socket.emit('createconnection', [directory, channel]);
}

function createChannel(directory) {
    // get channel name
    var name = document.getElementById(directory + "_channelInput").value;
    socket.emit('createchannel', name);
}

function channelSearch(directory) {
    // declare variables
    var input, filter, ul, li, a, i, txtValue;
    input = document.getElementById(directory + "_channelInput");
    filter = input.value.toUpperCase();
    ul = document.getElementById(directory + "_channelList");
    li = ul.getElementsByTagName("li");
    // loop through list items
    for (i = 0; i < li.length; i++) {
        a = li[i].getElementsByTagName("a")[0];
        txtValue = a.textContent || a.innerText;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
            li[i].style.display = "";
        } else {
            li[i].style.display = "none";
        }
    }
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
function _drag_init(elem, _lineIn, _lineOut) {
    // Store the object of the element which needs to be moved
    selected = elem;
    lineIn = _lineIn;
    lineOut = _lineOut;
    x_elem = x_pos - selected.cx.baseVal.value;
    y_elem = y_pos - selected.cy.baseVal.value;
}

// Will be called when user dragging an element
function _move_elem(e) {
    x_pos = document.all ? window.event.clientX : e.pageX;
    y_pos = document.all ? window.event.clientY : e.pageY;
    if (selected !== null) {
        selected.cx.baseVal.value = x_pos - x_elem;
        selected.cy.baseVal.value = y_pos - y_elem;
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
        y_pos = Math.min(Math.max(y_pos - y_elem, y_min), x_max);
        selected.cx.baseVal.value = x_pos;
        selected.cy.baseVal.value = y_pos;
        if (lineIn) {
            lineIn.x2.baseVal.value = x_pos;
            lineIn.y2.baseVal.value = y_pos;
        }
        if (lineOut) {
            lineOut.x1.baseVal.value = x_pos;
            lineOut.y1.baseVal.value = y_pos;
        }
        // send updated led to server (data structure resembles host's config.json)
        var data = {
            "outputs": [{
                "device": selected.parentElement.className.baseVal,
                "leds": [{
                    "index": parseInt(selected.id.slice(-1)),
                    "x": selected.cx.baseVal.value,
                    "y": selected.cy.baseVal.value,
                    "r": selected.r.baseVal.value
                }]
            }]
        };
        socket.emit('updateconfig', data);
    }
    // reset
    selected = null;
}

document.onmousemove = _move_elem;
document.onmouseup = _drop_elem;