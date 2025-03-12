import { Link } from "react-router-dom";
import Auth from "./Auth";

export default function Navbar() {
  return (
    <nav className="bg-white shadow-md py-4 px-8 flex justify-between items-center">
      <h1 className="text-lg font-semibold text-gray-700">
        Waypoint, The All-In-One Non-Discriminatory Testing Application
      </h1>
      <div className="flex items-center space-x-4">
        <Link to="/" className="text-gray-600 hover:text-blue-600">
          Home
        </Link>
        &nbsp;&nbsp;&nbsp;
        <Link to="/select-test" className="text-gray-600 hover:text-blue-600">
          Choose a Test
        </Link>
        &nbsp;&nbsp;&nbsp;
      </div>
    </nav>
  );
}
