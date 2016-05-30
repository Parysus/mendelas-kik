var express = require('express');
var app = express();
var http = require('http').Server(app);
var port = Number( process.env.PORT || 3000);
var io = require('socket.io')(http);

app.use(express.static('public'));

var queueRoom = [];
var roomsId = 0;

io.on('connection', function(client){
    console.log('Client connected: ' + client.id);

    client.emit('yourId', { id: client.id });

    client.on('logged', function(data){
        if(queueRoom.length == 0){
            queueRoom.push({id: '' + roomsId++});
            client.join(queueRoom[0].id);
            client.emit('status', { status: 'queued' });
            client.room = queueRoom[0].id;
        }
        else {
            var currentRoom = queueRoom.shift().id;
            client.room = currentRoom;
            client.join(currentRoom);
            io.in(currentRoom).emit('status', { status: 'gamefound'});
        }
    });

    client.on('sayhi', function(data){
        client.broadcast.in(client.room).emit('status', { status: 'response', nick: data.nick, id: data.id });
    })

    client.on('wyborDokonany', function(data){
        var wybor = (data.wybor == 'X') ? 'O' : 'X';
        client.broadcast.in(client.room).emit('wyborDokonanyResponse', {wybor: wybor})
    });
    client.on('turn', function(data){
        io.sockets.in(client.room).emit('turnResponse', {id: data.id, znaczek: data.znaczek})
    });

    client.on('disconnect', function(){
        console.log('Client disconected: ' + client.id);
        if(typeof io.sockets.adapter.rooms[client.room] !== 'undefined'){
            queueRoom.push({id: client.room});
            io.in(client.room).emit('status', { status: 'queued' });
        }
        else{
            for(var i = 0; i < queueRoom.length; i++)
                if(queueRoom[i].id = client.room)
                    queueRoom.splice(i, 1);
        }
    });
});

http.listen(port, function(){
    console.log('listening on ' + port);
});
