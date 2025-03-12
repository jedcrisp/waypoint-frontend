import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-100 text-center p-8">
      <h1 className="text-4xl font-bold text-gray-700">Welcome to Waypoint</h1>
      <p className="text-gray-500 mt-3">Easily run your NDT compliance testing with our user friendly tool.</p>

      <Link to="/test">
      </Link>
    </div>
  );
}

