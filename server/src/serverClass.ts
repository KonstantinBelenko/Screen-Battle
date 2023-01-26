"use strict"
import * as WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';
import randomColor  from 'randomcolor';
import Game from './gameClass';

type User = {
    ws: WebSocket;
    name: string;
    color: string;
    roomname: string;
    mouseX: number;
    mouseY: number;
    isHost: boolean;
    id: string;
    percentage: number;
}

type Room = {
    name: string;
    state: string;
    users: User[];
}

export default class Server {

    private server: WebSocket.Server;
    private users: Set<User> = new Set<User>();
    private rooms: Map<string, Room> = new Map<string, Room>();

    constructor(_host?:string) {

        if (!_host) _host = 'localhost';

        this.server = new WebSocket.Server({ host: _host, port: 8080 });
        console.log('⭐ Server started on port 8080');
    }

    public start() {
        this.server.on('connection', (ws: WebSocket) => {
            const newUser: User = { ws, name: '', color: '', roomname: '', mouseX: 0, mouseY: 0, isHost: false, id: '', percentage: 0 };
            this.users.add(newUser);

            ws.on('message', (message: string) => this.processMessage(message, newUser));
            ws.on('close', (code: number, reason: Buffer) => this.closeConnection(code, reason, newUser));
        });
    }

    public broadcastWs(message: string, roomId: string) {
        const room = this.rooms.get(roomId);
        if (room === undefined) return;

        room.users.forEach(user => {
            user.ws.send(message);
        });
    }

    public sendToWs(message: string, user: User) {
        user.ws.send(message);
    }

    public disconnectWs(text: string, user: User) {
        console.log(`\n👺: ${text}`)
        const msg = {
            type: 'disconnect',
            body: text.replace(/ /g, '+')
        }

        user.ws.send(JSON.stringify(msg));
        user.ws.close();
    }

    private updateUserPercentage(room: Room, targetUser?: User): Room {
        const total = room.users.length;

        if (targetUser === undefined) {
            const percentage = Math.floor(100 / total);
            
            room.users.forEach(user => {
                user.percentage = percentage;
            });

            return room;
        }

        // Increase percentage of target user and decrease percentage of other users
        const percentage = Math.floor(100 / total);
        const targetPercentage = targetUser.percentage + 1;
        
        room.users.forEach(user => {
            if (user.id === targetUser.id) {
                user.percentage = targetPercentage;
            } else {
                user.percentage = user.percentage - 1;
            }
        });

        return room;
    }

    private checkWinWS(room: Room): boolean {
        const users = room.users;

        const winner = users.find(user => user.percentage >= 100);
        if (winner !== undefined) {
            const msg = JSON.stringify({ type: 'win', winner: winner.name });
            this.broadcastWs(msg, room.name);
            return true;
        }

        return false;
    }

    public updateUsersWS(roomId: string, overrideType?: string) {

        let type = 'update-users';
        if (overrideType !== undefined) type = overrideType; 

        const room = this.rooms.get(roomId);
        if (room === undefined) return;

        const users = Array.from(room.users.map(user => {
            return {
                name: user.name,
                color: user.color,
                mouseX: user.mouseX,
                mouseY: user.mouseY,
                isHost: user.isHost,
                percentage: user.percentage
            }
        }));

        const msg = JSON.stringify({ type: type, users });
        this.broadcastWs(msg, roomId);
    }

    private processMessage(message: string, user: User) {

        const msg = JSON.parse(message);
        const type = msg.type;

        switch (type) {
            case 'register-user':
                const username = msg.name;
                const roomname = msg.room;
                const roomExists = this.rooms.has(roomname);

                user.name = username;
                user.roomname = roomname; 
                user.color = randomColor({ luminosity: 'bright', format: 'hex' });
                user.isHost = !roomExists;
                user.mouseX = 50;
                user.mouseY = 50;
                user.id = uuidv4();

                if (roomExists) {
                    const room = this.rooms.get(roomname);
                    if (room === undefined) return;

                    // Check restrictions
                    const roomIsFull = room.users.length === 6;
                    const userExists = room.users.some(u => u.name === username);
                    const roomIsStarted = room.state === 'started';
                    
                    if (roomIsFull) { this.disconnectWs('No more place :P', user); return; };
                    if (userExists) { this.disconnectWs('This name is taken', user); return; };
                    if (roomIsStarted) { this.disconnectWs('The game has already started', user); return; };

                    room.users.push(user);
                    this.rooms.set(roomname, room);

                    console.log(`\n🙋 User ${username} joined room ${roomname}`);
                } else {
                    const newRoom: Room = { name: roomname, state: 'waiting', users: [user] };
                    this.rooms.set(roomname, newRoom);
                    console.log(`\n👶 User ${username} registered | ${user.id}`);
                    console.log(`🧽 Room ${roomname} created`);
                }

                this.updateUserPercentage(this.rooms.get(roomname)!);
                this.updateUsersWS(roomname);

                break;
            case 'start-game':
                const room = this.rooms.get(user.roomname);
                if (room === undefined) return;

                if (user.isHost) {
                    room.state = 'started';
                    this.rooms.set(room.name, room);

                    const msg = {
                        type: 'start-game',
                    }
                    this.broadcastWs(JSON.stringify(msg), room.name);
                }
                break;
            case 'update-mouse':
                const roomname2 = msg.room;
                const username2 = msg.user;
                const mouseX = msg.mouseX;
                const mouseY = msg.mouseY;

                const room2 = this.rooms.get(roomname2);
                if (room2 === undefined) return;

                const user2 = room2.users.find(u => u.name === username2);
                if (user2 === undefined) return;

                user2.mouseX = mouseX;
                user2.mouseY = mouseY;

                this.rooms.set(roomname2, room2);
                this.updateUsersWS(roomname2, 'update-canvas');
                break;
            case 'update-click':
                const roomname3 = msg.room;
                const username3 = msg.user;

                const room3 = this.rooms.get(roomname3);
                if (room3 === undefined) return;

                const user3 = room3.users.find(u => u.name === username3);
                if (user3 === undefined) return;

                const newRoom = this.updateUserPercentage(room3, user3)
                
                this.rooms.set(roomname3, newRoom);
                this.updateUsersWS(roomname3, 'update-canvas');
                this.checkWinWS(newRoom);
                break;
            case 'restart-game':
                const roomname4 = msg.room;
                const room4 = this.rooms.get(roomname4);
                if (room4 === undefined) return;

                if (user.isHost) {
                    room4.state = 'waiting';
                    this.rooms.set(room4.name, room4);

                    const msg = {
                        type: 'restart-game',
                    }
                    this.broadcastWs(JSON.stringify(msg), room4.name);
                    this.updateUserPercentage(room4);
                }
                break;

            default:
                break;
        }
    }

    private closeConnection(code: number, reason: Buffer, user: User) {

        let room = this.rooms.get(user.roomname);
        if (room === undefined) return;

        const filteredUsers = room.users.filter(u => u.name !== user.name);
        room.users = filteredUsers;

        this.rooms.set(room.name, room);

        if (room.users.length === 0) {
            this.rooms.delete(room.name);
            console.log(`\n❌ Room ${room.name} deleted`);
        } else if (user.isHost && room.users.length > 0) {
            room.users[0].isHost = true;
            this.rooms.set(room.name, room);
            console.log(`\n🏥 New host: ${room.users[0].name}`);
        }

        this.updateUsersWS(room.name);
        console.log('\n💔 Connection closed', user.name, user.id);
    }

}