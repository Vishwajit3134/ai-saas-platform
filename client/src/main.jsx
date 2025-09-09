import React, { useState, useRef, createContext, useContext, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import { supabase } from './supabaseClient'; // This line requires the supabaseClient.js file

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
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) {
                fetchProfile(session.user.id);
            }
            setLoading(false);
        });

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

    const value = { session, profile, logout, isAuthenticated: !!session, fetchProfile, loading };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

const useAuth = () => useContext(AuthContext);

// --- Protected Route Component ---
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    if (loading) {
        return <div className="flex justify-center items-center h-screen"><div>Loading...</div></div>;
    }
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return children;
};

// --- Custom Hook to safely load Razorpay script ---
const useRazorpayScript = () => {
    const [isLoaded, setIsLoaded] = useState(false);
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => setIsLoaded(true);
        document.body.appendChild(script);
        return () => document.body.removeChild(script);
    }, []);
    return isLoaded;
};


// --- Component Definitions ---

const Typewriter = ({ words, speed = 150, eraseSpeed = 100, delay = 1500 }) => {
    const [text, setText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [wordIndex, setWordIndex] = useState(0);
    const [charIndex, setCharIndex] = useState(0);

    useEffect(() => {
        const handleTyping = () => {
            const currentWord = words[wordIndex];
            if (isDeleting) {
                setText(currentWord.substring(0, charIndex - 1));
                setCharIndex(charIndex - 1);
            } else {
                setText(currentWord.substring(0, charIndex + 1));
                setCharIndex(charIndex + 1);
            }

            if (!isDeleting && charIndex === currentWord.length) {
                setTimeout(() => setIsDeleting(true), delay);
            } else if (isDeleting && charIndex === 0) {
                setIsDeleting(false);
                setWordIndex((prev) => (prev + 1) % words.length);
            }
        };

        const timer = setTimeout(handleTyping, isDeleting ? eraseSpeed : speed);
        return () => clearTimeout(timer);
    }, [charIndex, isDeleting, wordIndex, words, speed, eraseSpeed, delay]);

    return <span>{text}</span>;
};

const Home = () => (
    <>
        <div className="relative text-center p-8 md:p-16 hero-gradient-bg overflow-hidden">
            <div className="relative z-10 max-w-4xl mx-auto">
                <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight">
                    The Best AI Tool for <br/>
                    <span className="bg-gradient-to-r from-purple-400 to-indigo-400 text-transparent bg-clip-text">
                         <Typewriter words={["Image Generation.", "Resume Analysis.", "Background Removal."]} />
                    </span>
                </h1>
                <p className="mt-6 text-lg text-slate-300 max-w-2xl mx-auto">
                    Transform your content creation with our suite of premium AI tools. Enhance your workflow and bring your ideas to life.
                </p>
                <div className="mt-10">
                    <Link to="/register" className="inline-block bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-700 transition-all shadow-lg text-lg">
                        Start Generating For Free
                    </Link>
                    <p className="mt-4 text-sm text-slate-400">No credit card required.</p>
                </div>
            </div>
        </div>
        <div className="p-8 md:p-16">
             <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">Explore the power of AI</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8 max-w-7xl mx-auto">
                 <ToolCard icon="image" title="Image Generation" color="text-violet-500" />
                 <ToolCard icon="resume" title="Resume Analysis" color="text-emerald-500" />
                 <ToolCard icon="background" title="Background Removal" color="text-pink-500" />
                 <ToolCard icon="video" title="Video Generation" color="text-orange-500" comingSoon />
                 <ToolCard icon="code" title="Code Generation" color="text-sky-500" comingSoon />
             </div>
        </div>
    </>
);

const ToolCard = ({ icon, title, color, comingSoon = false }) => {
    const icons = {
        image: <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
        resume: <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
        background: <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>,
        video: <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
        code: <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
    };

    return (
        <div className="relative bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out cursor-pointer group">
            <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-lg bg-gray-100 ${color}`}>
                    {icons[icon]}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
            {comingSoon && <span className="absolute top-2 right-2 bg-yellow-400 text-yellow-800 text-xs font-semibold px-2 py-1 rounded-full">Soon</span>}
        </div>
    );
};

const GoogleAuthButton = () => {
    const handleGoogleSignIn = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
        });
        if (error) {
            console.error('Error signing in with Google:', error);
        }
    };

    return (
        <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C39.902,36.561,44,30.852,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path></svg>
            Continue with Google
        </button>
    );
};


const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        const { error } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
        });
        if (error) setError(error.message);
        setIsLoading(false);
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-4">
            <div className="bg-white p-8 rounded-xl shadow-2xl">
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Login to Your Account</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && <p className="text-red-500 text-center">{error}</p>}
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">Email</label>
                        <input className="shadow-sm border rounded-lg w-full py-3 px-4" id="email" type="email" name="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">Password</label>
                        <input className="shadow-sm border rounded-lg w-full py-3 px-4" id="password" type="password" name="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
                    </div>
                    <button className="bg-indigo-600 w-full text-white font-bold py-3 px-4 rounded-lg" type="submit" disabled={isLoading}>
                        {isLoading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>
                <div className="my-6 flex items-center"><div className="flex-grow border-t border-gray-300"></div><span className="flex-shrink mx-4 text-gray-400">OR</span><div className="flex-grow border-t border-gray-300"></div></div>
                <GoogleAuthButton />
                <p className="text-center text-gray-600 text-sm mt-6">Don't have an account? <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">Sign Up</Link></p>
            </div>
        </div>
    );
};

const Register = () => {
    const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        setIsLoading(true);
        setError('');
        setSuccess('');
        const { error } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
        });
        if (error) {
            setError(error.message);
        } else {
             setSuccess('Registration successful! Please check your email to confirm your account.');
        }
        setIsLoading(false);
    };

     return (
        <div className="max-w-md mx-auto mt-10 p-4">
            <div className="bg-white p-8 rounded-xl shadow-2xl">
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Create a New Account</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && <p className="text-red-500 text-center">{error}</p>}
                    {success && <p className="text-green-500 text-center">{success}</p>}
                     <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">Email</label>
                        <input className="shadow-sm border rounded-lg w-full py-3 px-4" id="email" type="email" name="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">Password</label>
                        <input className="shadow-sm border rounded-lg w-full py-3 px-4" id="password" type="password" name="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">Confirm Password</label>
                        <input className="shadow-sm border rounded-lg w-full py-3 px-4" id="confirmPassword" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} required />
                    </div>
                    <button className="bg-indigo-600 w-full text-white font-bold py-3 px-4 rounded-lg" type="submit" disabled={isLoading}>
                         {isLoading ? 'Creating...' : 'Create Account'}
                    </button>
                </form>
                <div className="my-6 flex items-center"><div className="flex-grow border-t border-gray-300"></div><span className="flex-shrink mx-4 text-gray-400">OR</span><div className="flex-grow border-t border-gray-300"></div></div>
                <GoogleAuthButton />
                <p className="text-center text-gray-600 text-sm mt-6">Already have an account? <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">Sign In</Link></p>
            </div>
        </div>
    );
};


const Dashboard = () => { return <div>Dashboard</div>; };
const DemoPage = () => { return <div>Demo Page</div>; };
const TextToImage = () => { return <div>Text to Image</div>; };
const ResumeAnalyzer = () => { return <div>Resume Analyzer</div>; };
const BackgroundRemover = () => { return <div>Background Remover</div>; };
const PricingPage = () => { return <div>Pricing Page</div>; };
const ProfilePage = () => { return <div>Profile Page</div>; };
const AdminDashboard = () => { return <div>Admin Dashboard</div>; };


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
                            {profile && profile.role === 'admin' && (
                                <Link to="/admin" className="text-yellow-400 hover:text-yellow-300 font-semibold">Admin</Link>
                            )}
                            <Link to="/dashboard" className="hover:text-gray-300">Dashboard</Link>
                            <Link to="/profile" className="hidden md:block hover:text-gray-300">Profile</Link>
                             {profile && (
                                <Link to="/pricing" className="bg-indigo-600 text-sm font-medium px-4 py-2 rounded-full hover:bg-indigo-700">
                                    Credits: {profile.credits}
                                </Link>
                            )}
                            <button onClick={() => { logout(); navigate('/'); }} className="hover:text-gray-300">Logout</button>
                        </>
                    ) : (
                        <>
                            <Link to="/register" className="hover:text-gray-300">Register</Link>
                            <Link to="/login" className="bg-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-700 font-semibold">Login</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};


// --- Main App Component ---
function App() {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();
    
  useEffect(() => {
      // After initial load, if user is authenticated, redirect to dashboard
      if(!loading && isAuthenticated) {
          navigate('/dashboard', { replace: true });
      }
  }, [isAuthenticated, loading, navigate]);

  return (
    <div className="App">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/demo" element={<DemoPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/text-to-image" element={<ProtectedRoute><TextToImage /></ProtectedRoute>} />
          <Route path="/resume-analyzer" element={<ProtectedRoute><ResumeAnalyzer /></ProtectedRoute>} />
          <Route path="/background-remover" element={<ProtectedRoute><BackgroundRemover /></ProtectedRoute>} />
          <Route path="/pricing" element={<ProtectedRoute><PricingPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
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

