export default function Layout(props) {
    return (
        <div className="w-full h-screen flex flex-col justify-center items-center">
            { props.title !== '' && <h1 className="text-4xl font-mono font-bold text-gray-800 mb-6">Screen Battle</h1>}
            {props.children}
        </div>
    );
}