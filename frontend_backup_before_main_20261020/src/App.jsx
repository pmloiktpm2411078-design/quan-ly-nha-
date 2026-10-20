import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/auth/Login";
import Dashboard from "./pages/dashboard/Dashboard";

import Rooms from "./pages/room/Rooms";
import AddRoom from "./pages/room/AddRoom";
import EditRoom from "./pages/room/EditRoom";
import RoomDetail from "./pages/room/RoomDetail";

import Tenants from "./pages/tenants/Tenants";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/rooms" element={<Rooms />} />
        <Route path="/rooms/add" element={<AddRoom />} />
        <Route path="/rooms/edit/:id" element={<EditRoom />} />
        <Route path="/rooms/:id" element={<RoomDetail />} />

        <Route path="/tenants" element={<Tenants />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
