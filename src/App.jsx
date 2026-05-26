import { Routes, Route, useLocation } from 'react-router-dom';
import Nav from './components/Nav';
import Home from './pages/Home';
import Understand from './pages/Understand';
import Prepare from './pages/Prepare';
import Connect from './pages/Connect';
import About from './pages/About';
import Onboarding from './pages/Onboarding';

export default function App() {
  const { pathname } = useLocation();
  const hideNav = pathname === '/onboarding';

  return (
    <>
      {!hideNav && <Nav />}
      <Routes>
        <Route path="/"           element={<Home />} />
        <Route path="/understand" element={<Understand />} />
        <Route path="/prepare"    element={<Prepare />} />
        <Route path="/connect"    element={<Connect />} />
        <Route path="/about"      element={<About />} />
        <Route path="/onboarding" element={<Onboarding />} />
      </Routes>
    </>
  );
}
