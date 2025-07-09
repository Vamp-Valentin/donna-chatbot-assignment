// src/App.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import "./App.css";

import Navbar from "./components/Navbar";

export default function AppLayout() {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Navbar />
      <Outlet />
    </div>
  );
}
