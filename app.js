var express = require('express');
var app = express();
app.use(express.static(__dirname + '/public'));
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = 3000;

var users = {};
var activeUsers={};
var activeGames = {};
var playingUsers = {};
var gameStates={};
var serverGames = [];

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/public/default.html');
});

io.on('connection', function(socket) {
    console.log('New connection');

    socket.on('message', function(msg) {
        console.log('Got message from client: ' + msg);
    });
    socket.on('move', function(data) {
    	socket.broadcast.emit('move', data);
	});
	socket.on('login',function(userName){
		console.log("Got username: "+userName);
		socket.userName = userName; 
		if(!users[userName]){
			console.log("Creating new user for "+userName);
			users[userName] = {userName: socket.userName, games: {}};
		}
		console.log("Created user.");
		console.log("Active Users Length: "+activeUsers.size);
		socket.emit('loginResponse',{users: Object.keys(activeUsers)});
		activeUsers[userName] = socket;
		console.log("Added user to activeUsers.");
		socket.broadcast.emit('newUser', socket.userName);
	});
	socket.on('inviteToGame',function(opponentid){
		console.log('got an invite from: ' + socket.userName + ' --> ' + opponentid);
		
		socket.broadcast.emit('leavelobby', socket.userName);
        socket.broadcast.emit('leavelobby', opponentid);

        var game = {
            id: Math.floor((Math.random() *50) + 1),
            board: null, 
            users: {white: socket.userName, black: opponentid}
        };

        serverGames.push(game);
        console.log('Server Games is: '+serverGames);
        console.log('I just Added: '+game + ' to Server Games at: '+game.id);
        activeGames[game.id] = game.id;

        users[game.users.white].games[game.id] = game.id;
        users[game.users.black].games[game.id] = game.id;

        console.log("Starting Game "+game.id);
        activeUsers[game.users.white].emit('joinGame',{game:game,color:'white'});
        activeUsers[game.users.black].emit('joinGame',{game:game, color:'black'});

        activeUsers[game.users.white].gameid = game.id;
        activeUsers[game.users.black].gameid = game.id;

        playingUsers[game.users.white] = activeUsers[game.users.white];
        playingUsers[game.users.black] = activeUsers[game.users.black];
        delete activeUsers[game.users.white];
        delete activeUsers[game.users.black];

        socket.emit('addGame',{game:game});
	});
    socket.on('quitGame',function(data){
        var game = data.game;
        var username = data.username;
        var end = data.end;

        socket.broadcast.emit('endGame',{id:game.id});

        if(data.color=="white"){
            playingUsers[game.users.white].broadcast.emit('addUser',{id: playingUsers[game.users.white].userName});
            activeUsers[game.users.white] = playingUsers[game.users.white];
            delete playingUsers[game.users.white];
        }else{
            playingUsers[game.users.black].broadcast.emit('addUser',{id: playingUsers[game.users.black].userName});
            activeUsers[game.users.black] = playingUsers[game.users.black];
            delete playingUsers[game.users.black];
        }
/*
        if(data.color=="white"){
            playingUsers[game.users.white].emit('',{users: Object.keys(activeUsers)});
        }else{
            playingUsers[game.users.white].emit('',{users: Object.keys(activeUsers)});
        }*/
        
        delete activeGames[game.id];
        var i=0;
        for(i-0;i<serverGames.length;i++){
            if(serverGames[i].id==game.id){
                serverGames.splice(i,1);
            }
        }

        if(data.color=="white"){
            activeUsers[game.users.white].emit('loser');
            if(activeUsers[game.users.black]){
                activeUsers[game.users.black].emit('winner',{color:"black",game:game});
            }else{
                playingUsers[game.users.black].emit('winner',{color:"black",game:game});
            }
            socket.broadcast.emit('updateUsersAndGames',{users: Object.keys(activeUsers), games: serverGames});
        }else{
            activeUsers[game.users.black].emit('loser');
            if(activeUsers[game.users.white]){
                activeUsers[game.users.white].emit('winner',{color:"white",game:game});
            }else{
                playingUsers[game.users.white].emit('winner',{color:"white",game:game});
            }
            socket.broadcast.emit('updateUsersAndGames',{users: Object.keys(activeUsers), games: serverGames});
        }
    });
    socket.on('checkMate',function(data){
        var game = data.game;
        var username = data.username;
        var end = data.end;

        socket.broadcast.emit('endGame',{id:game.id});

        if(data.color=="white"){
            playingUsers[game.users.white].broadcast.emit('addUser',{id: playingUsers[game.users.white].userName});
            activeUsers[game.users.white] = playingUsers[game.users.white];
            delete playingUsers[game.users.white];
        }else{
            playingUsers[game.users.black].broadcast.emit('addUser',{id: playingUsers[game.users.black].userName});
            activeUsers[game.users.black] = playingUsers[game.users.black];
            delete playingUsers[game.users.black];
        }
/*
        if(data.color=="white"){
            playingUsers[game.users.white].emit('',{users: Object.keys(activeUsers)});
        }else{
            playingUsers[game.users.white].emit('',{users: Object.keys(activeUsers)});
        }*/
        
        delete activeGames[game.id];
        var i=0;
        for(i-0;i<serverGames.length;i++){
            if(serverGames[i].id==game.id){
                serverGames.splice(i,1);
            }
        }

        if(data.color=="white"){
            activeUsers[game.users.white].emit('winnerCheckMate');
            if(activeUsers[game.users.black]){
                activeUsers[game.users.black].emit('loserCheckMate',{color:"black",game:game});
            }else{
                playingUsers[game.users.black].emit('loserCheckMate',{color:"black",game:game});
            }
            socket.broadcast.emit('updateUsersAndGames',{users: Object.keys(activeUsers), games: serverGames});
        }else{
            activeUsers[game.users.black].emit('winnerCheckMate');
            if(activeUsers[game.users.white]){
                activeUsers[game.users.white].emit('loserCheckMate',{color:"white",game:game});
            }else{
                playingUsers[game.users.white].emit('loserCheckMate',{color:"white",game:game});
            }
            socket.broadcast.emit('updateUsersAndGames',{users: Object.keys(activeUsers), games: serverGames});
        }
    });
    socket.on('backToLobby',function(data){
        var color = data.color;
        var game = data.game;
        console.log(color);
        if(color=="black"){
            if(activeUsers[game.users.black]){
                console.log('Active User is black.');
                activeUsers[game.users.black].emit('addUser',{id: activeUsers[game.users.black].userName});
                console.log('Added User');
                activeUsers[game.users.black].emit('sendUserBackToLobby',{users: Object.keys(activeUsers)});
            }else{
                console.log('Playing user black: '+playingUsers[game.users.black].userName);
                activeUsers[game.users.black] = playingUsers[game.users.black];
                delete playingUsers[game.users.black];
                activeUsers[game.users.black].emit('addUser',{id: activeUsers[game.users.black].userName});
                activeUsers[game.users.black].emit('sendUserBackToLobby',{users: Object.keys(activeUsers)});
            }
        }else{
            console.log('Playing user white: '+playingUsers[game.users.white].userName);
            activeUsers[game.users.white] = playingUsers[game.users.white];
            delete playingUsers[game.users.white];
            activeUsers[game.users.white].emit('addUser',{id: activeUsers[game.users.white].userName});
            activeUsers[game.users.white].emit('sendUserBackToLobby',{users: Object.keys(activeUsers)});
        }
        console.log('back To lobby call');

        socket.broadcast.emit('updateUsersAndGames',{users: Object.keys(activeUsers), games: serverGames});
    });
    socket.on('gameMove',function(data){
        var game = data.gameState;
        var gameId = data.id;

        gameStates[gameId] = game;
        console.log('Added fen to game: '+gameId+", fen was: "+game);
    });
    socket.on('updateTurn',function(data){
        console.log('Recieved Update Turn');
        var game = data.game;
        var color = data.color;

        if(color=="white"){
            if(playingUsers[game.users.black]){
                console.log('User is playing');
                console.log('Game id from call: '+game.id);
                console.log('Game id from playing user '+ playingUsers[game.users.black].gameid);
               if(playingUsers[game.users.black].gameid==game.id){
                    console.log('User is playing game that is requesting turn');
                    playingUsers[game.users.black].emit('ChangeTurns',{game:game});
               } 
            }
        }else{
            if(playingUsers[game.users.white]){
                console.log('user is playing');
               if(playingUsers[game.users.white].gameid==game.id){
                    console.log('user is playing game that requested turn');
                    playingUsers[game.users.white].emit('ChangeTurns',{game:game});
               } 
            }
        }
    });
    socket.on('gameInitFen',function(data){
        gameStates[data.id] = data.gameFen;
    });
    socket.on('retriveGame',function(gameId){
        var i;
        var game;
        for(i=0;i<serverGames.length;i++){
            if(serverGames[i].id ==gameId){
                game = serverGames[i];
            }
        }
        var gameState = gameStates[gameId];

        console.log('Retrived fen was: '+gameState);

        socket.broadcast.emit('leavelobby', socket.userName);

        activeGames[game.id] = game.id;

        if(activeUsers[game.users.white]){
            activeUsers[game.users.white].gameid = game.id;
        }
        if(activeUsers[game.users.black]){
            activeUsers[game.users.black].gameid = game.id;
        }

        console.log("White: "+game.users.white+", Black: "+game.users.black);

        console.log("Socket Username: "+socket.userName);

        if(game.users.white == socket.userName){
            console.log("User is white.");
            activeUsers[game.users.white].emit('joinGameInProgress',{game:game,gameState:gameState,color:'white'});
            console.log("Active User: "+activeUsers[game.users.white]);
            playingUsers[game.users.white] = activeUsers[game.users.white];
            delete activeUsers[game.users.white];
            console.log('Playing User: '+playingUsers[game.users.white]);
        }else{
            console.log("User is black.");
            activeUsers[game.users.black].emit('joinGameInProgress',{game:game,gameState:gameState,color:'black'});
            console.log("Active User: "+activeUsers[game.users.black]);
            playingUsers[game.users.black] = activeUsers[game.users.black];
            delete activeUsers[game.users.black];
            console.log('Playing User: '+playingUsers[game.users.black]);
        }
    });
});

http.listen(process.env.PORT || port, function() {
    console.log('listening on *: ' + port);
});