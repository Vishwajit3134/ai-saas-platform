import React, { useState, useRef, createContext, useContext, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import { supabase } from './supabaseClient';

// --- Global CSS with Tailwind ---
const style = document.createElement('style');
style.textContent = `
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  body { 
    background-color: #f8fafc;
    font-family: 'Inter', sans-serif;
  }
  .hero-gradient-bg {
    background-color: #020617;
    background-image: radial-gradient(at 27% 37%, hsla(215, 98%, 61%, 0.1) 0px, transparent 50%), 
                      radial-gradient(at 77% 42%, hsla(259, 94%, 68%, 0.1) 0px, transparent 50%);
  }
`;
document.head.append(style);
const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap';
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);


// --- Axios Interceptor ---
const api = axios.create({
    baseURL: 'https://cortex-ai.onrender.com/api' // Your live backend URL
});

api.interceptors.request.use(async (config) => {
    // Fetches the latest session token from Supabase before every request
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
}, (error) => Promise.reject(error));


// --- Authentication Context ---
const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for an active session on initial load
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) {
                fetchProfile(session.user.id);
            }
            setLoading(false);
        });

        // Listen for real-time changes in authentication state
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setSession(session);
                if (session) {
                    await fetchProfile(session.user.id);
                } else {
                    setProfile(null);
                }
            }
        );

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const fetchProfile = async (userId) => {
        try {
            // Fetches all necessary profile data, including the user's role
            const { data, error } = await supabase.from('profiles').select('credits, email, role').eq('id', userId).single();
            if (error) throw error;
            setProfile(data);
        } catch (error) {
            console.error("Failed to fetch profile:", error);
        }
    };
    
    const logout = async () => {
        await supabase.auth.signOut();
        setSession(null);
        setProfile(null);
    };

    const value = { session, profile, logout, isAuthenticated: !!session, fetchProfile };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

const useAuth = () => useContext(AuthContext);

// --- Protected Route Component ---
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, session } = useAuth();
    if (session === null && !isAuthenticated) { // Handles initial loading state
        return <div className="flex justify-center items-center h-screen"><div>Loading...</div></div>;
    }
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return children;
};

// ... (Other components like Home, Login, Dashboard, etc., remain the same)

const AdminDashboard = () => {
    // ... AdminDashboard component logic ...
};

const Navbar = () => {
    const { isAuthenticated, logout, profile } = useAuth();
    const navigate = useNavigate();

    return (
        <nav className="bg-slate-900/80 backdrop-blur-sm text-white p-4 shadow-lg sticky top-0 z-50">
            <div className="container mx-auto flex justify-between items-center">
                <Link to="/" className="text-2xl font-bold tracking-wider">Cortex.ai</Link>
                <div className="flex items-center space-x-6 text-lg">
                    {isAuthenticated ? (
                        <>
                            {/* This is the corrected conditional link for the admin dashboard */}
                            {profile && profile.role === 'admin' && (
                                <Link to="/admin" className="text-yellow-400 hover:text-yellow-300 transition-colors font-semibold">
                                    Admin
                                </Link>
                            )}
                            <Link to="/dashboard" className="hover:text-gray-300 transition-colors">Dashboard</Link>
                            <Link to="/profile" className="hidden md:block hover:text-gray-300 transition-colors">Profile</Link>
                             {profile && (
                                <Link to="/pricing" className="bg-indigo-600 text-sm font-medium px-4 py-2 rounded-full hover:bg-indigo-700 transition-colors">
                                    Credits: {profile.credits}
                                </Link>
                            )}
                            <button onClick={() => { logout(); navigate('/'); }} className="hover:text-gray-300 transition-colors">Logout</button>
                        </>
                    ) : (
                        <>
                            <Link to="/register" className="hover:text-gray-300 transition-colors">Register</Link>
                            <Link to="/login" className="bg-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-semibold">Login</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};


// --- Main App Component ---
function App() {
  return (
    <div className="App">
      <Navbar />
      <main>
        <Routes>
          {/* ... all your other routes ... */}
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}

// --- Render the Application ---
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Router>
  </React.StrictMode>
);

