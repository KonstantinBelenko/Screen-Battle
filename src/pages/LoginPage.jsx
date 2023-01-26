import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { useState, useEffect } from "react";
import randomWords from 'random-words';

export default function LoginPage() {
    const nav = useNavigate();
    const [username, setUsername] = useState('');
    const [roomId, setRoomId] = useState('');

    function handleSubmit () {
        if (username && roomId) {
            nav(`/game/${roomId}/${username}`);
        }
    }

    useEffect(() => {

        const tooltip = document.getElementById('tooltip');
        if (window.location.search.includes('msg=')) {
            tooltip.classList.remove('hidden');
            setTimeout(() => {
                tooltip.classList.add('hidden');
            }, 3000);
        }

        const randomRoomNameButton = document.getElementById('random-room-name');
        randomRoomNameButton.addEventListener('click', (e) => {
            e.preventDefault();
            const randomRoomName = randomWords({ exactly: 3, join: '-' });
            setRoomId(randomRoomName);
        });
    }, []);

    return (
        <Layout title='🖥 Screen Battle ⚔'>

            {/* Tooltip as side toaster message */}
            <div id='tooltip' className='hidden absolute right-0 left-0 mx-auto top-10 w-fit bg-red-500 text-white font-mono rounded-md p-2'>
                {window.location.search.replace('?msg=', '').replace(/\+/g, ' ')}
            </div>

            <form className="w-full max-w-sm flex flex-col">
                
                {/* Username */}
                <div className="flex flex-col items-start mb-6 space-y-2">
                <input
                    className="bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500"
                    id="username"
                    type="text"
                    placeholder="Your name"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    maxLength="32"
                    required
                />
                <div className="relative w-full">
                    <input
                        className="z-0 bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500"
                        id="roomid"
                        type="text"
                        placeholder="Room id"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        maxLength="32"
                        required
                    />
                    <div className="absolute top-0 right-0">
                        <button id='random-room-name' className="bg-purple-400 w-10 h-10 rounded-r-md hover:bg-purple-500 transition-all duration-350">🗿</button>
                    </div>
                </div>
                
                </div>

                <div>
                    <button
                    className="self-center shadow bg-purple-500 hover:bg-purple-400 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded w-full"
                    type="submit"
                    onClick={handleSubmit}
                    >
                    Play
                    </button>
                </div>
            </form>
        </Layout>
    )
}