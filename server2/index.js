const WebSocket = require('ws');

const server = new WebSocket.Server({
        host: '192.168.1.34',
        port: 8080
    },
    () => {
        console.log('Server started on port 8080');
    }
);

const users = new Set();
const rooms = new Map();

function randomColor() {
    const colors = [
        'AliceBlue',
        'AntiqueWhite',
        'Aqua',
        'Aquamarine',
        'Azure',
        'Beige',
        'Bisque',
        'Black',
        'BlanchedAlmond',
        'Blue',
        'BlueViolet',
        'Brown',
        'BurlyWood',
        'CadetBlue',
        'Chartreuse',
        'Chocolate',
        'Coral',
        'CornflowerBlue',
        'Cornsilk',
        'Crimson',
        'Cyan',
        'DarkBlue',
        'DarkCyan',
        'DarkGoldenrod',
        'DarkGray',
        'DarkGreen',
        'DarkGrey',
        'DarkKhaki',
        'DarkMagenta',
        'DarkOliveGreen',
        'DarkOrange',
        'DarkOrchid',
        'DarkRed',
        'DarkSalmon',
        'DarkSeaGreen',
        'DarkSlateBlue',
        'DarkSlateGray',
        'DarkSlateGrey',
        'DarkTurquoise',
        'DarkViolet',
        'DeepPink',
        'DeepSkyBlue',
        'DimGray',
        'DodgerBlue',
        'FireBrick',
        'FloralWhite',
        'ForestGreen',
        'Fuchsia',
        'Gainsboro',
        'GhostWhite',
        'Gold',
        'Goldenrod',
        'Gray',
        'Green',
        'GreenYellow',
        'Grey',
        'Honeydew',
        'HotPink',
        'IndianRed',
        'Indigo',
        'Ivory',
        'Khaki',
        'Lavender',
        'LavenderBlush',
        'LawnGreen',
        'LemonChiffon',
        'LightBlue',
        'LightCoral',
        'LightCyan',
        'LightGoldenrodYellow',
        'LightGray',
        'LightGreen',
        'LightGrey',
        'LightPink',
        'LightSalmon',
        'LightSeaGreen',
        'LightSkyBlue',
        'LightSlateGray',
        'LightSlateGrey',
        'LightSteelBlue',
        'LightYellow',
        'Lime',
        'LimeGreen',
        'Linen',
        'Magenta',
        'Maroon',
        'MediumAquamarine',
        'MediumBlue',
        'MediumOrchid',
        'MediumPurple',
        'MediumSeaGreen',
        'MediumSlateBlue',
        'MediumSpringGreen',
        'MediumTurquoise',
        'MediumVioletRed',
        'MidnightBlue',
        'MintCream',
        'MistyRose',
        'Moccasin',
        'NavajoWhite',
        'Navy',
        'OldLace',
        'Olive',
        'OliveDrab',
        'Orange',
        'OrangeRed',
        'Orchid',
        'PaleGoldenrod',
        'PaleGreen',
        'PaleTurquoise',
        'PaleVioletRed',
        'PapayaWhip',
        'PeachPuff',
        'Peru',
        'Pink',
        'Plum',
        'PowderBlue',
        'Purple',
        'Rebeccapurple',
        'Red',
        'RosyBrown',
        'RoyalBlue',
        'SaddleBrown',
        'Salmon',
        'SandyBrown',
        'SeaGreen',
        'Seashell',
        'Sienna',
        'Silver',
        'SkyBlue',
        'SlateBlue',
        'SlateGray',
        'SlateGrey',
        'Snow',
        'SpringGreen',
        'SteelBlue',
        'Tan',
        'Teal',
        'Thistle',
        'Tomato',
        'Turquoise',
        'Violet',
        'Wheat',
        'White',
        'WhiteSmoke',
        'Yellow',
        'YellowGreen',
    ];

    return colors[Math.floor(Math.random() * colors.length)];
}

function sendRoomMessage(msg, room_id) {
    const room = rooms.get(room_id);
    Array.from(room.users).forEach(user => {
        user.ws.send(JSON.stringify(msg));
    });
}

function deleteUser(room, userRef) {
    room.users.delete(userRef);
    room.usernames.delete(userRef.name);

    if (room.users.size === 0 || userRef.isHost) {

        const msg = {
            sender: 'server',
            type: 'host-disconnected',
        }
        
        Array.from(room.users).forEach(user => {
            user.ws.send(JSON.stringify(msg));
        });
        rooms.delete(room);
    } else {
        rooms.set(room.id, room);
    }

    // Send message to the room
    const messageToSend = {
        sender: 'server',
        type: 'updateUsers',
        body: `${userRef.name} left the room`,
        users: Array.from(room.users).map(user => ({ name: user.name, color: user.color })),
        sentAt: Date.now()
    }
    sendRoomMessage(messageToSend, room.id);
}


server.on('connection', (ws) => {
    const userRef = {
        ws,
    };

    users.add(userRef);

    // Get user name and room
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            if (data.type === 'register') {

                console.log("\nRegistering user")

                if (typeof data.name !== 'string' || typeof data.room !== 'string') {
                    console.error('Invalid message');
                    return;
                }
    
                // If room doesnt exist, create it
                if (!rooms.has(data.room)) {
                    
                    // Assign user name and room id
                    userRef.name = data.name;
                    userRef.room = data.room;
                    userRef.color = randomColor();
                    userRef.isHost = true;
                    userRef.x = 0;
                    userRef.y = 0;

                    console.log(`🆕 Creating room: ${data.room}, user: ${data.name} / ${userRef.color}`);
    
                    rooms.set(data.room, {
                        id: data.room,
                        users: new Set(
                            [userRef]
                        ),
                        usernames: new Set(
                            [data.name]
                        ),
                        state: 'waiting',
                    });

                    // Send message to the room
                    const messageToSend = {
                        sender: 'server',
                        type: 'updateUsers',
                        body: `${data.name} joined the room`,
                        users: Array.from(rooms.get(data.room).users).map(user => ({ name: user.name, color: user.color, isHost: user.isHost, x: user.x, y: user.y })),
                        sentAt: Date.now()
                    }
                    sendRoomMessage(messageToSend, data.room);
                }
                // Check if room has max users (6)
                else if (rooms.get(data.room).users.size === 6) {
                    console.error(`🚧 Room ${data.room} is full (6 users)`);

                    const msg = {
                        type: 'disconnect',
                        body: 'No+more+room+in+the+room',
                    }
                    ws.send(JSON.stringify(msg));
                    ws.close();
                    return;
                
                // Add user to the room
                }
                else {
                    // Check if room alrady has a user with the same name
                    if (rooms.get(data.room).usernames.has(data.name)) {
                        console.error(`✌ Room ${data.room} already has a user with name ${data.name}`);

                        const msg = {
                            type: 'disconnect',
                            body: 'Somebody+took+your+name+already',
                        }
                        ws.send(JSON.stringify(msg));
                        ws.close();

                        return;
                    }
                    
                    // Assign user name and room id
                    userRef.name = data.name;
                    userRef.isHost = false;
                    userRef.room = data.room;
                    userRef.color = randomColor();
                    userRef.x = 0;
                    userRef.y = 0;

                    // Add the user to the room
                    let currentRoom = rooms.get(data.room);
                    currentRoom.users.add(userRef);
                    currentRoom.usernames.add(data.name);
                    rooms.set(data.room, currentRoom);
                    
                    console.log(`🚬 user: ${userRef.name} / ${userRef.color} joined: ${userRef.room} `);
                    console.log(currentRoom.state)
    
                    // If room has more than 1 user, send the message to the room
                    if (rooms.get(userRef.room).users.size > 1) {
                        const messageToSend = {
                            sender: 'server',
                            type: 'updateUsers',
                            body: `${userRef.name} joined the room`,
                            users: Array.from(currentRoom.users).map(user => ({ name: user.name, color: user.color, isHost: user.isHost, x: user.x, y: user.y})),
                            sentAt: Date.now()
                        }
                        sendRoomMessage(messageToSend, userRef.room);
                    }
                }   
            }
            else if (data.type === 'start-game') {

                // Check if user is the host
                if (!userRef.isHost) {
                    console.error(`🚫 User ${userRef.name} is not the host`);
                    return;
                }

                console.log(`\n🎮 Starting game in room: ${userRef.room}`);
                const room = rooms.get(userRef.room);
                room.state = 'playing';
                rooms.set(userRef.room, room);

                const msg = {
                    sender: 'server',
                    type: 'start-game',
                }
                sendRoomMessage(msg, userRef.room);
            }
            else if (data.type === 'mouse') {

                // Save user position to userRef
                userRef.x = data.x;
                userRef.y = data.y;

                // Update user position in the room
                const room = rooms.get(userRef.room);
                room.users.forEach(user => {
                    if (user.name === data.user) {
                        user.x = data.x;
                        user.y = data.y;
                    }
                });
                rooms.set(userRef.room, room);

                // Send message to the room
                const msg = {
                    sender: 'server',
                    type: 'mouse',
                    users: Array.from(room.users).map(user => ({ name: user.name, color: user.color, isHost: user.isHost, x: user.x, y: user.y })),
                }

                sendRoomMessage(msg, userRef.room);
            }


        } catch (e) {
            console.error('Error passing message!', e)
        }
    });


    ws.on('close', (code, reason) => {

        console.log(`\n ♻ Connection closed user: ${userRef.name} / ${userRef.color} room: ${userRef.room}`)
        // Get room of the user
        const room = rooms.get(userRef.room);

        if (room === undefined) {
            return;
        }

        deleteUser(room, userRef);

        console.log(`🔴 Connection closed: ${code} ${reason}! | ${userRef.name} / ${userRef.color} room: ${userRef.room}`);
    });
}); 