var socket = io();

socket.emit('load');
socket.on('load', function (msg) {
    //console.log(msg);
    document.getElementById("container").innerHTML += (msg);
});

socket.emit('loadoutputgraphic');
socket.on('loadoutputgraphic', function (msg) {
    document.getElementById("outputGraphic").innerHTML = msg;
});

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
    x_pos = 0,
    y_pos = 0, // Stores x & y coordinates of the mouse pointer
    x_elem = 0,
    y_elem = 0; // Stores top, left values (edge) of the element

// Will be called when user starts dragging an element
function _drag_init(elem) {
    // Store the object of the element which needs to be moved
    selected = elem;
    x_elem = x_pos - selected.offsetLeft;
    y_elem = y_pos - selected.offsetTop;
}

// Will be called when user dragging an element
function _move_elem(e) {
    x_pos = document.all ? window.event.clientX : e.pageX;
    y_pos = document.all ? window.event.clientY : e.pageY;
    if (selected !== null) {
        selected.style.left = (x_pos - x_elem) + 'px';
        selected.style.top = (y_pos - y_elem) + 'px';
    }
}

// Destroy the object when we are done
function _drop_elem() {
    if (selected !== null) {

        x_pos = Math.min(Math.max(x_pos, x_min), x_max);
        y_pos = Math.min(Math.max(y_pos, y_min), x_max);
        selected.style.left = (x_pos - x_elem) + 'px';
        selected.style.top = (y_pos - y_elem) + 'px';
    }
    selected = null;

}
document.addEventListener('readystatechange', event => {
    if (event.target.readyState === "interactive") {

        // Bind the functions...
        document.getElementById('circle').onmousedown = function () {
            _drag_init(this);
            return false;
        };
    }
});


document.onmousemove = _move_elem;
document.onmouseup = _drop_elem;

var gap = 200;
var x_min = gap;
var x_max = window.innerWidth - gap;
var y_min = gap;
var y_max = window.innerHeight - gap;