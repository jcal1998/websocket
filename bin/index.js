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
      status: 'green',
      idChat: socket.id
    }
    members.push(member);
  } else {
    members.forEach(member => {
      if (member.nick === socket.handshake.query.loggeduser) {
        member.idChat = socket.id
        member.status = 'green';
      }
    })
  }

  io.emit('members', members)

  socket.on('chat', (msg) => {
    if (msg.destiny === 'Todos') {
      delete msg.destiny;
      io.emit('chat', msg);
    } else {
      const idChat = members.filter(member => member.nick === msg.destiny)[0].idChat
      delete msg.destiny;
      msg.idChat = idChat
      io.emit('private', msg);
    }
  });

  socket.on('typing', (msg) => {
    io.emit('typing', msg);
    members.forEach(member => {
      if (member.nick === socket.handshake.query.loggeduser) {
        member.status = 'green'
      }
    })
    io.emit('members', members)
  });

  socket.on('disconnect', () => {
    members.forEach(m => {
      if (m.nick === socket.handshake.query.loggeduser) m.status = 'red'
    })
    io.emit('members', members)
  });

  socket.on('away', (msg) => {

    members.forEach(member => {
      if (member.nick === socket.handshake.query.loggeduser) {
        member.status = msg.status
      }
    })
    io.emit('members', members)
  })
});

server.listen(3000, () => {
  console.log('listening on port:3000');
});
