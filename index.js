let express = require('express')
let app = express();

let http = require('http');
let server = http.Server(app)

let socketIO = require('socket.io');
let io = socketIO(server);

const port = process.env.PORT || 3000;

let mapUsuario = new Map();
let indexUsuario = 0;

io.on('connection', (socket) => {

    mapUsuario.set(indexUsuario, '');
    indexUsuario++;

    socket.on('entrar', (data) => {

        //joing

        console.log(data.usuario.usuario, 'entrou');

        for (let [key, value] of mapUsuario) {

            if (!value) {
                mapUsuario.set(key, data.usuario.usuario);
                break;
            }
        }

        console.log(mapUsuario);

        let dataLogin = {
            usuario: data.usuario,
            sala: data.sala,
            mensagem: 'entrou na sala.',
        }

        socket.join(data.sala.code)

        socket.broadcast.to(data.sala.code).emit('novo-usuario-entrou', dataLogin);

    });

    socket.on('carregar-lista-usuarios', (codigoSala) => {

        //carregar lista de usuarios

        let listaUsuarioFromMap = JSON.stringify(Array.from(mapUsuario));
        io.in(codigoSala).emit('enviar-lista-usuarios', listaUsuarioFromMap);
    });

    socket.on('verificar-lista-usuarios', () => {

        let listaUsuarioFromMap = JSON.stringify(Array.from(mapUsuario));
        socket.emit('lista-usuarios', listaUsuarioFromMap);
    });

    socket.on('mensagem', (data) => {

        //sending message

        io.in(data.sala.code).emit('nova-mensagem', {usuario: data.usuario, mensagem: data.mensagem})
    });

    socket.on('sair', (data) => {

        //leaving

        if (data) {
            if (data.sala) {
                socket.broadcast.to(data.sala.code).emit('deixou-sala', {
                    usuario: data.usuario,
                    mensagem: 'saiu da sala.'
                });

                socket.leave(data.sala.code)
            }
            console.log(data.usuario.usuario, 'saiu');
            mapUsuario.delete(data.usuario.code);
        } else {
            indexUsuario--;
            mapUsuario.delete(indexUsuario);
        }

        console.log(mapUsuario);

    });

    socket.on('disconnect', () => {

        console.log('disconnected');

    });
});

server.listen(port, () => {
    console.log(`started on port: ${port}`);
});