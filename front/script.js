const { randomUUID } = require('crypto');
const nick = Object.fromEntries(new URLSearchParams(window.location.search)).nick
const idChat = randomUUID()
var socket = io.connect({ query: `loggeduser=${nick}&idChat=${idChat}` });

let channel = ''

var members = document.getElementById('members')
var messages = document.getElementById('messages');
var form = document.getElementById('form');
var input = document.getElementById('input');
var online = document.getElementById('select')

const createMessage = (msg, sender, privado) => {
    var item = document.createElement('li');
    var name = document.createElement('div');
    var time = document.createElement('div');
    var message = document.createElement('div');
    item.className = privado ? `${sender} private` : `${sender} not`
    name.textContent = msg.nick;
    name.className = 'nick'
    time.textContent = msg.time;
    time.className = 'time'
    message.textContent = msg.data;
    message.className = 'message'
    item.appendChild(name)
    item.appendChild(time)
    item.appendChild(message)
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
}

form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (input.value.trim()) {
        const msg = {
            nick: nick,
            data: input.value,
            time: `${new Date().getHours()}:${new Date().getMinutes()}`,
            destiny: select.value
        }
        socket.emit('chat', msg);
        input.value = '';

        const privado = msg.destiny === 'Todos' ? false : true;
        createMessage(msg, `my__message`, privado)

        socket.emit('typing', { nick, typing: false });
    }
});

form.addEventListener('input', function (e) {
    const typing = Boolean(input.value.trim());
    const msg = {
        nick,
        typing,
    }
    socket.emit('typing', msg);
});

socket.on('privado', (msg) => {
    msg.forEach(member => {
        if (nick === member.nick) {
            channel = member.idChat
            console.log('meu channel é', channel)
            console.log('do tipo', typeof (channel))
        }
    })
})

console.log('channel instanciado', channel)

socket.on('5b48203e-026e-4862-a888-d6cd565b2b2a', (msg) => {
    console.log('asdsadsas')
    console.log('chamou o channel', channel)
    createMessage(msg, `others__message`, true);
})

socket.on('chat', (msg) => {
    if (nick !== msg.nick) {
        createMessage(msg, `others__message`, false);
    }
});

socket.on('members', (msg) => {
    if (!document.getElementById(`${nick}`)) {
        var item = document.createElement('li');
        var name = document.createElement('div');
        name.textContent = `Você`;
        var status = document.createElement('div');
        status.className = 'statuscircle'
        status.setAttribute('id', `${nick}`)
        status.style.backgroundColor = 'green';
        item.appendChild(status)
        item.appendChild(name)
        members.appendChild(item)

        var item = document.createElement('option');
        item.setAttribute('id', `all`)
        item.setAttribute('value', `Todos`)
        item.textContent = `Todos`
        online.appendChild(item)
    }

    msg.map(member => {
        if (nick !== member.nick && !document.getElementById(`${member.nick}`)) {
            var item = document.createElement('li');
            var name = document.createElement('div');
            name.textContent = nick === member.nick ? `Você` : `${member.nick}`;
            var status = document.createElement('div');
            status.className = 'statuscircle'
            status.setAttribute('id', `${member.nick}`)
            status.style.backgroundColor = member.online ? 'green' : 'red';
            item.appendChild(status)
            item.appendChild(name)
            members.appendChild(item)
        } else {
            member.online ? document.getElementById(`${member.nick}`).style.backgroundColor = 'green' : document.getElementById(`${member.nick}`).style.backgroundColor = 'red';
        }

        if (nick !== member.nick) {
            if (!document.getElementById(`${member.nick}__status`)) {
                var item = document.createElement('option');
                item.setAttribute('id', `${member.nick}__status`)
                item.setAttribute('value', `${member.nick}`)
                item.disabled = !member.online
                item.textContent = `${member.nick}`
                online.appendChild(item)
            } else {
                const bool = member.online ? true : false
                var status = document.getElementById(`${member.nick}__status`)
                status.disabled = !bool;
            }
        }
    })
})

socket.on('typing', (msg) => {
    const nickname = msg.nick === nick ? 'Você' : `${msg.nick}`
    document.getElementById('typing').innerHTML = msg.typing ? `${nickname} está digitando ...` : '';
});
