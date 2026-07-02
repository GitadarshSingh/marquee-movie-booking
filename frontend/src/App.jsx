import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import MovieDetails from "./pages/MovieDetails";
import TheaterSelection from "./pages/TheaterSelection";
import ShowSelection from "./pages/ShowSelection";
import SeatSelection from "./pages/SeatSelection";
import PaymentPage from "./pages/PaymentPage";
import MyBookings from "./pages/MyBookings";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Settings from "./pages/Settings";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProfilePage from "./pages/ProfilePage";

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/movie/:id" element={<MovieDetails />} />
            <Route path="/movie/:id/theaters" element={<TheaterSelection />} />
            <Route path="/movie/:movieId/theaters/:theaterId/shows" element={<ShowSelection />} />
            <Route path="/shows/:showId/seats" element={<SeatSelection />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/login" element={<Login />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;