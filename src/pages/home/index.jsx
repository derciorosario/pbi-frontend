// src/App.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

function App() {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-r from-[#8A358A] to-pink-500">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-8">Welcome</h1>
        <div className="space-x-4">
          <button
            onClick={() => navigate("/login")}
            className="px-6 py-2 bg-white text-[#8A358A] font-semibold rounded-lg shadow-md hover:bg-gray-100"
          >
            Login
          </button>
          <button
            onClick={() => navigate("/signup")}
            className="px-6 py-2 bg-[#8A358A] text-white font-semibold rounded-lg shadow-md hover:bg-[#8A358A]"
          >
            Signup
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
