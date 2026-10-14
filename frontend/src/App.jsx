import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login";
import Dashboard from "./Dashboard";
import Rooms from "./Rooms";
import AddRoom from "./AddRoom";
import EditRoom from "./EditRoom";
import RoomDetail from "./RoomDetail";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/rooms" element={<Rooms />} />
        <Route path="/rooms/add" element={<AddRoom />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/rooms/edit/:id" element={<EditRoom />} />
        <Route path="/rooms/:id" element={<RoomDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
