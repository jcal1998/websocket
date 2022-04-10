const express = require('express');
const path = require("path");
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server, Socket } = require("socket.io");
const io = new Server(server);

const members = []

app.use("/static", express.static(path.join(__dirname, "../front")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, '../front/index.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../front/name.html'));
});

app.post('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../front/index.html'));
  res.redirect(`/chat?nick=${req.body.person}`);
});

io.on('connection', (socket) => {
  if (!members.some(m => m.nick === socket.handshake.query.loggeduser)) {
    const member = {
      nick: socket.handshake.query.loggeduser,
      online: true,
    }
    members.push(member);
  } else {
    members.forEach(member => {
      if (member.nick === socket.handshake.query.loggeduser) {
        member.online = true
      }
    })
  }

  io.emit('members', members)

  socket.on('chat', (msg) => {
    io.emit('chat', msg);
  });

  socket.on('typing', (msg) => {
    io.emit('typing', msg);
    members.forEach(member => {
      if (member.nick === socket.handshake.query.loggeduser) {
        member.online = true
      }
    })
    io.emit('members', members)
  });

  socket.on('disconnect', () => {
    members.forEach(m => {
      if (m.nick === socket.handshake.query.loggeduser) m.online = false
    })
    io.emit('members', members)
  });
});

server.listen(3000, () => {
  console.log('listening on port:3000');
});
