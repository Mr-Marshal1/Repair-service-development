import React from 'react';
import Map from './components/Map';
import AboutUs from './components/AboutUs';
import Guarantees from './components/Guarantees';
import Device from './components/Device';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';


export default function App() {
    return (
        <Router>
            <header className='MainHeader'>
                <div className='MainHeader__links'>
                    <nav>
                        <ul>
                            <li>
                                <Link to="/">Оформити замовлення</Link>
                            </li>
                            <li>
                                <Link to="/AboutUs">Про нас</Link>
                            </li>
                            <li>
                                <Link to="/Guarantees">Наші гарантії</Link>
                            </li>
                            <li>
                                <Link to="/Device">Девайси</Link>
                            </li>
                        </ul>
                    </nav>
                </div>
            </header>
            <Routes>
                <Route path="/" element={<Map />} />
                <Route path="/AboutUs" element={<AboutUs />} />
                <Route path="/Guarantees" element={<Guarantees />}> </Route>
                <Route path="/Device" element={<Device />}> </Route>
            </Routes>
        </Router>
    )
}