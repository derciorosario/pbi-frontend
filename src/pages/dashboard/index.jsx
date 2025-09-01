// src/pages/Dashboard.jsx
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen items-center justify-center bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <p className="text-gray-600 mb-8">Welcome to your dashboard!</p>
      <button
        onClick={() => navigate("/")}
        className="px-6 py-2 bg-purple-600 text-white rounded-lg shadow-md hover:bg-purple-700"
      >
        Back to Home
      </button>
    </div>
  );
}
