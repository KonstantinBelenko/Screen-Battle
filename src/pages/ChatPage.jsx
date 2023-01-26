import { useRef, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { useNavigate } from "react-router-dom";



export default function ChatPage(props) {
    const nav = useNavigate();
    const { name, room } = useParams();

    const [isConnectionOpen, setIsConnectionOpen] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);

    const [userX, setUserX] = useState(0);
    const [userY, setUserY] = useState(0);
    const [mouseDown, setMouseDown] = useState(false);
    const [restartGame, setRestartGame] = useState(false);
    const [winner, setWinner] = useState('');
    const [timer, setTimer] = useState(0);
    
    const [usersList, setUsersList] = useState([
        {
            name,
            color: 'pink'
        }
    ]);

    const ws = useRef();

    function startGame () {
        ws.current.send(JSON.stringify({
            type: 'start-game',
        }));
    }

    function emojiFromPercentage(percentage, min) {
        if (min === 50) {
            if (percentage < 15) {
                return '🥵';
            } else if (percentage < 25) {
                return '😱';
            } else if (percentage < 35) {
                return '😨';
            } else if (percentage < 45) {
                return '😲';
            } else if (percentage > 95) {
                return '🤩';
            } else if (percentage > 85) {
                return '🥴';
            } else if (percentage > 75) {
                return '😍';
            } else if (percentage > 65) {
                return '😘';
            } else {
                return '😎';
            }
        }
    }

    function redrawCanvas(users) {
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');

        ctx.lineWidth = 1;

        if (users.length === 1) {
            ctx.fillStyle = users.find(user => user.name === name).color;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        if (users.length === 2) {

            // Create two rects using the colors of the users
            const userPercent1 = users[0].percentage / 100;
            ctx.fillStyle = users[0].color;
            ctx.fillRect(0, 0, canvas.width*userPercent1, canvas.height);

            ctx.textAlign = 'center';
            ctx.fillStyle = 'white';
            ctx.font = '60px Arial';
            ctx.fillText(`${emojiFromPercentage(users[0].percentage, 50)}`, canvas.width*userPercent1/2, canvas.height/2);
            
            const userPercent2 = users[1].percentage / 100;
            ctx.fillStyle = users[1].color; 
            ctx.fillRect(canvas.width*userPercent1, 0, canvas.width, canvas.height);

            ctx.textAlign = 'center';
            ctx.fillStyle = 'white';
            ctx.font = '60px Arial';
            ctx.fillText(`${emojiFromPercentage(users[1].percentage, 50)}`, canvas.width*userPercent1 + canvas.width*userPercent2/2, canvas.height/2);
        }

        if (users.length === 3) {
            // Create three equal rects using the colors of the users
            ctx.fillStyle = users[0].color;
            ctx.fillRect(0, 0, canvas.width/3, canvas.height);

            ctx.fillStyle = users[1].color;
            ctx.fillRect(canvas.width/3, 0, canvas.width/3*2, canvas.height);

            ctx.fillStyle = users[2].color;
            ctx.fillRect(canvas.width/3*2, 0, canvas.width, canvas.height);
        }

        if (users.length === 4) {
            // Create four rects using the colors of the users
            ctx.fillStyle = users[0].color;
            ctx.fillRect(0, 0, canvas.width/2, canvas.height/2);
            
            ctx.fillStyle = users[1].color;
            ctx.fillRect(canvas.width/2, 0, canvas.width/2, canvas.height/2);

            ctx.fillStyle = users[2].color;
            ctx.fillRect(0, canvas.height/2, canvas.width/2, canvas.height/2);

            ctx.fillStyle = users[3].color;
            ctx.fillRect(canvas.width/2, canvas.height/2, canvas.width/2, canvas.height/2);
        }

        if (users.length === 5) {
            // Create five equal rects using the colors of the users
            ctx.fillStyle = users[0].color;
            ctx.fillRect(0, 0, canvas.width/5, canvas.height);

            ctx.fillStyle = users[1].color;
            ctx.fillRect(canvas.width/5, 0, canvas.width/5*2, canvas.height);

            ctx.fillStyle = users[2].color;
            ctx.fillRect(canvas.width/5*2, 0, canvas.width/5*3, canvas.height);

            ctx.fillStyle = users[3].color;
            ctx.fillRect(canvas.width/5*3, 0, canvas.width/5*4, canvas.height);

            ctx.fillStyle = users[4].color;
            ctx.fillRect(canvas.width/5*4, 0, canvas.width, canvas.height);
        }

        if (users.length === 6) {
            // Create six rects using the colors of the users
            ctx.fillStyle = users[0].color;
            ctx.fillRect(0, 0, canvas.width/3, canvas.height/2);
            
            ctx.fillStyle = users[1].color;
            ctx.fillRect(canvas.width/3, 0, canvas.width/3*2, canvas.height/2);

            ctx.fillStyle = users[2].color;
            ctx.fillRect(canvas.width/3*2, 0, canvas.width, canvas.height/2);

            ctx.fillStyle = users[3].color;
            ctx.fillRect(0, canvas.height/2, canvas.width/3, canvas.height);

            ctx.fillStyle = users[4].color;
            ctx.fillRect(canvas.width/3, canvas.height/2, canvas.width/3*2, canvas.height);

            ctx.fillStyle = users[5].color;
            ctx.fillRect(canvas.width/3*2, canvas.height/2, canvas.width, canvas.height);
        }

        users.forEach(user => {
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(user.mouseX, user.mouseY, 20, 0, 2 * Math.PI);
            ctx.fill();

            ctx.fillStyle = user.color;
            ctx.beginPath();
            ctx.arc(user.mouseX, user.mouseY, 17, 0, 2 * Math.PI);
            ctx.fill();

            // Draw the name of the user
            ctx.textAlign = 'center';
            ctx.font = '20px Arial';
            ctx.fillStyle = 'white';
            ctx.fillText(user.name, user.mouseX, user.mouseY-25);
        });

        // Draw timer
        ctx.textAlign = 'center';
        ctx.fillStyle = 'white';
        ctx.font = '60px Arial';
        ctx.fillText(`${timer}`, canvas.width/2, canvas.height/2-200);

    }


    useEffect(() => {

        async function copyHref() {
            await navigator.clipboard.writeText(room);
        }

        const copyRoomButton = document.getElementById('copy-room-button');
        copyRoomButton.addEventListener('click', () => {
            copyHref()

            const tooltip = document.getElementById('copy-room-tooltip');
            tooltip.classList.remove('hidden');
            setTimeout(() => {
                tooltip.classList.add('hidden');
            }
            , 1300);

        });

        document.addEventListener('mousemove', (event) => {
            setUserX(event.clientX);
            setUserY(event.clientY);
        });
        document.addEventListener('mousedown', (event) => {
            setUserX(event.clientX);
            setUserY(event.clientY);
            setMouseDown(true);
        });


        ws.current = new WebSocket('ws://79.152.67.184:8080');
        ws.current.onopen = () => {
    
            console.log('Connection opened');
            setIsConnectionOpen(true);
            
            // Send a message to the server to register the user with the username & room id
            ws.current.send(JSON.stringify({
                type: 'register-user',
                name,
                room,
            }));
        };

        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === 'update-users') {
                console.log("User joined: ", data.users);
                setUsersList(Array.from(data.users));
            }

            if (data.type === 'disconnect') {
                nav(`/?msg=${data.body}`);
            }

            if (data.type === 'start-game') {
                // Check if the user is the host
                setGameStarted(true);   
            }

            if (data.type === 'update-canvas') {
                setUsersList(Array.from(data.users));
                setMouseDown(false);
            }
            
            if (data.type === 'win') {
                setGameStarted(false);
                setWinner(data.winner);
            }

            if (data.type === 'restart-game') {
                setGameStarted(false);
                setWinner('');
                setTimer(0);
            }
        };

        return () => {
            console.log('Closing connection');
            ws.current.close();
        }
    }, []);

    const scrollTarget = useRef(null);

    useEffect(() => {
        if (scrollTarget.current) {
            scrollTarget.current.scrollIntoView({ behaviour: 'smooth' });
        }
        redrawCanvas(usersList);
    }, [usersList]);

    useEffect(() => {
        if (isConnectionOpen) {
            ws.current.send(JSON.stringify({
                type: 'update-mouse',
                user: name,
                room: room,
                mouseX: userX,
                mouseY: userY,
            }));
        }
    }, [userX, userY]);

    useEffect(() => {
        redrawCanvas(usersList);
    }, [usersList]);

    useEffect(() => {
        if (isConnectionOpen && gameStarted) {
            ws.current.send(JSON.stringify({
                type: 'update-click',
                user: name,
                room: room,
            }));
        }
    }, [mouseDown]);

    useEffect(() => {
        if (isConnectionOpen && restartGame) {
            ws.current.send(JSON.stringify({
                type: 'restart-game',
                room: room,
            }));
        }
    }, [restartGame]);
    
    // Timer
    useEffect(() => {
        if (gameStarted) {
            // Add time to the timer
            const interval = setInterval(() => {
                setTimer(timer => timer + 1);
            }
            , 1000);
            return () => clearInterval(interval);
        }
    }, [gameStarted, timer]);


    return (
        <Layout title=''>

            {/* <canvas id='canvas' width='1000' height='1000' className='absolute w-full h-full z-[-1]'></canvas> */}
            <canvas id='canvas' width={window.innerWidth} height={window.innerHeight} className='absolute w-full h-full z-[-1]'></canvas>


            { gameStarted === false && <>
                <div className='flex flex-col justify-center items-center gap-6'>

                    {/* Tooltip as side toaster message */}
                    <div id='copy-room-tooltip' className='hidden absolute right-0 left-0 mx-auto top-10 w-fit bg-gray-800 text-white font-mono rounded-md p-2'>
                        Copied to clipboard!
                    </div>

                    <div className='text-4xl text-white font-bold font-mono'> 
                        <button id='copy-room-button' className='hover:rounded-md hover:bg-gray-700 bg-gray-800 rounded-md py-2 px-4'>'{room}' </button>
                    </div>
                    
                    {/* User List */}
                    <div className='text-xl font-mono animate-bounce mt-8 py-2 px-4 w-fit h-fit bg-gray-800 rounded-md'>
                        { usersList.length > 1 ? <div> {
                            usersList.map((user, index) => {
                                return <div className='text-white' key={index}>{index+1}: {user.name}</div>
                            })
                        } </div> : <div className='text-white'>Waiting for others...</div> }
                    </div>

                    {/* Start Game Button */}
                    {
                        usersList.find(user => user.name === name).isHost && usersList.length > 1 && 
                        <button onClick={startGame} className='absolute left-0 right-0 mx-auto bottom-[20vh] text-white text-4xl bg-gray-800 w-fit px-4 py-3 hover:scale-110 transition-all duration-350 rounded-md font-mono font-bold'>
                            Start Game!
                        </button>
                    }

                </div>                
            </> }

            { winner !== '' && 
            <div className='absolute top-0 left-0 right-0 bottom-0 bg-gray-800 bg-opacity-80 flex flex-col justify-center items-center'>
                <div className='text-4xl text-white font-mono font-bold'>Winner: {winner}</div>
                { usersList.find(user => user.name === name).isHost && 
                    <button onClick={() => setRestartGame(true)} className='mt-4 text-gray-800 text-4xl bg-white w-fit px-4 py-3 hover:scale-110 transition-all duration-350 rounded-md font-mono font-bold'>
                        Play Again!
                    </button>
                }
            </div>
            }
        </Layout>
    )
}