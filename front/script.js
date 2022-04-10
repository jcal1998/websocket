var script = document.createElement('script');
script.type = 'text/javascript';

script.src = '/socket.io/socket.io.js';
document.body.appendChild(script);

var socket = ws.io()
