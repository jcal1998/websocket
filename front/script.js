const nick = Object.fromEntries(new URLSearchParams(window.location.search)).nick
let socket = io.connect({ query: `loggeduser=${nick}` });

let channel = ''

let members = document.getElementById('members')
let messages = document.getElementById('messages');
let form = document.getElementById('form');
let input = document.getElementById('input');
let online = document.getElementById('select')

const createMessage = (msg, sender, private) => {
    let contentDiv = document.createElement('div')
    let dataDiv = document.createElement('div')
    let item = document.createElement('li');
    let name = document.createElement('div');
    let time = document.createElement('div');
    let message = document.createElement('div');
    contentDiv.className = 'contentDiv'
    dataDiv.className = 'dataDiv'
    item.className = private ? `${sender} private` : `${sender} not`
    if (msg.nick !== nick) {
        name.textContent = msg.nick;
        name.className = 'nick'
        contentDiv.appendChild(name)
    }
    time.textContent = msg.time;
    time.className = 'time'
    message.textContent = msg.data;
    message.className = 'message'

    dataDiv.appendChild(message)
    dataDiv.appendChild(time)
    contentDiv.appendChild(dataDiv)
    item.appendChild(contentDiv)
    if (private) {
        let warning = document.createElement('div');
        warning.textContent = msg.destiny ? `⚠ Mensagem privada para ${msg.destiny}` : '⚠ Mensagem privada';
        warning.className = 'warning'
        item.appendChild(warning)
    }
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

        const private = msg.destiny === 'Todos' ? false : true;
        createMessage(msg, `my__message`, private)

        socket.emit('typing', { nick, typing: false });
    }
});

let tempo = setTimeout(() => {
    const msg = {
        nick,
        status: 'yellow'
    }
    socket.emit('away', msg);
}, 30000)


form.addEventListener('input', function (e) {
    const typing = Boolean(input.value.trim());
    const msg = {
        nick,
        typing,
    }
    socket.emit('typing', msg);
    clearTimeout(tempo);
    tempo = setTimeout(() => {
        const msg = {
            nick,
            status: 'yellow'
        }
        socket.emit('away', msg);
    }, 30000)
});

socket.on('chat', (msg) => {
    if (nick !== msg.nick) {
        createMessage(msg, `others__message`, false);
    }
});

socket.on('private', (msg) => {
    if (msg.idChat === socket.id) {
        createMessage(msg, `others__message`, true);
    }
})



socket.on('members', (msg) => {
    if (!document.getElementById(`${nick}`)) {
        let item = document.createElement('li');
        let name = document.createElement('div');
        name.textContent = `Você`;
        let status = document.createElement('div');
        status.className = 'statuscircle'
        status.setAttribute('id', `${nick}`)
        status.style.backgroundColor = 'green';
        item.appendChild(status)
        item.appendChild(name)
        members.appendChild(item)

        let option = document.createElement('option');
        option.setAttribute('id', `all`)
        option.setAttribute('value', `Todos`)
        option.textContent = `Todos`
        online.appendChild(option)
    }

    msg.map(member => {
        if (nick !== member.nick && !document.getElementById(`${member.nick}`)) {
            let item = document.createElement('li');
            let name = document.createElement('div');
            name.textContent = nick === member.nick ? `Você` : `${member.nick}`;
            let status = document.createElement('div');
            status.className = 'statuscircle'
            status.setAttribute('id', `${member.nick}`)
            status.style.backgroundColor = member.status;
            item.appendChild(status)
            item.appendChild(name)
            members.appendChild(item)
        } else {
            document.getElementById(`${member.nick}`).style.backgroundColor = member.status;
        }

        if (nick !== member.nick) {
            if (!document.getElementById(`${member.nick}__status`)) {
                let item = document.createElement('option');
                item.setAttribute('id', `${member.nick}__status`)
                item.setAttribute('value', `${member.nick}`)
                item.disabled = member.online != 'green'
                item.textContent = `${member.nick}`
                online.appendChild(item)
                //Option voltar ao default TODO
            } else {
                let status = document.getElementById(`${member.nick}__status`)
                status.disabled = member.online != 'green';
            }
        }
    })
})

socket.on('typing', (msg) => {
    const nickname = msg.nick === nick ? 'Você' : `${msg.nick}`
    document.getElementById('typing').innerHTML = msg.typing ? `${nickname} está digitando ...` : '';
});
