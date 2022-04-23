const nick = Object.fromEntries(new URLSearchParams(window.location.search)).nick
let socket = io.connect({ query: `loggeduser=${nick}` });

let channel = ''

let members = document.getElementById('members')
let messages = document.getElementById('messages');
let form = document.getElementById('form');
let input = document.getElementById('input');
let online = document.getElementById('select');

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
    if (msg.upload) {
        if (msg.upload === 'video/mp4') {
            const video = document.createElement('video')
            video.width = 200
            video.controls = true
            let videoSource = document.createElement('source')
            videoSource.setAttribute('src', msg.url)
            videoSource.setAttribute('type', "video/mp4")
            video.appendChild(videoSource)
            contentDiv.appendChild(video)
        } else {
            let imagem = document.createElement('img')
            imagem.setAttribute('id', 'uploaded')
            imagem.setAttribute('src', msg.url)
            imagem.setAttribute('alt', '')
            contentDiv.appendChild(imagem)
        }
    }
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
    fileInput = document.getElementById('fileupload').files[0];
    if (input.value.trim() || fileInput) {
        const msg = {
            nick: nick,
            data: input.value,
            time: `${new Date().toLocaleTimeString('pt-BR', { hour: 'numeric', minute: 'numeric' })}`,
            destiny: select.value,
            ...fileInput && { upload: fileInput.type, url: URL.createObjectURL(fileInput) }
        }
        socket.emit('chat', msg);
        input.value = '';


        const private = msg.destiny === 'Todos' ? false : true;
        createMessage(msg, `my__message`, private)

        socket.emit('typing', { nick, typing: false });
    }
    cancelUpload()
});

const onChange = () => {
    let fileName = document.getElementById('fileupload').files[0].name
    document.getElementById('selectedImage').innerHTML = fileName ? `Arquivo selecionado: ${fileName}` : ''
    document.getElementById('xdelete').innerHTML = fileName ? `❌` : ''
}

const cancelUpload = () => {
    document.getElementById('fileupload').value = null
    document.getElementById('selectedImage').innerHTML = ''
    document.getElementById('xdelete').innerHTML = ''
}

let tempo = setTimeout(() => {
    const msg = {
        nick,
        status: 'yellow'
    }
    socket.emit('away', msg);
}, 60000)


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
    }, 60000)
});

socket.on('chat', (msg) => {
    if (msg.nick !== nick) createMessage(msg, `others__message`, false);
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
                item.disabled = member.status != 'green'
                item.textContent = `${member.nick}`
                online.appendChild(item)
                //Option voltar ao default TODO
            } else {
                let item = document.getElementById(`${member.nick}__status`)
                item.disabled = member.status != 'green';
                if (member.nick === select.value && item.disabled) {
                    online.value = 'Todos'
                }
            }
        }
    })
})

socket.on('typing', (msg) => {
    if (msg.nick !== nick) {
        document.getElementById('typing').innerHTML = msg.typing ? `${msg.nick} está digitando ...` : '';
    }
});
