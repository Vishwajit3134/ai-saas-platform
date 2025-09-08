import React, { useState, useRef, createContext, useContext, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';

// --- Global CSS with Tailwind ---
const style = document.createElement('style');
style.textContent = `
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  body { 
    background-color: #f8fafc; /* A lighter, cleaner background */
    font-family: 'Inter', sans-serif; /* A more modern font */
  }
  .hero-gradient-bg {
    background-color: #020617;
    background-image: radial-gradient(at 27% 37%, hsla(215, 98%, 61%, 0.1) 0px, transparent 50%), 
                      radial-gradient(at 77% 42%, hsla(259, 94%, 68%, 0.1) 0px, transparent 50%);
  }
`;
document.head.append(style);
// Add Google Font link for 'Inter'
const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap';
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);


// --- Axios Interceptor ---
const api = axios.create({
    baseURL: 'http://localhost:5000/api'
});

api.interceptors.request.use((config) => {
    const session = JSON.parse(localStorage.getItem('session'));
    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});


// --- Authentication Context ---
const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(() => JSON.parse(localStorage.getItem('session')));
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async () => {
        const currentSession = JSON.parse(localStorage.getItem('session'));
        if (currentSession) {
             try {
                const { data } = await api.get('/user/profile');
                setProfile(data);
            } catch (error) {
                console.error("Failed to fetch profile");
                if (error.response?.status === 401) logout();
            }
        }
    };
    
    useEffect(() => {
        localStorage.setItem('session', JSON.stringify(session));
        if (session) {
            fetchProfile();
        } else {
            setProfile(null);
        }
        setLoading(false);
    }, [session]);

    const login = (sessionData) => setSession(sessionData);
    const logout = () => {
        setSession(null);
        localStorage.removeItem('session');
    };

    const value = { session, profile, fetchProfile, login, logout, isAuthenticated: !!session };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

const useAuth = () => useContext(AuthContext);

// --- Protected Route Component ---
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();
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
        script.onerror = () => console.error('Razorpay script failed to load.');
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        };
    }, []);
    return isLoaded;
};


// --- Component Definitions ---

const Home = () => (
    <div className="relative text-center p-8 md:p-16 hero-gradient-bg rounded-3xl m-4 overflow-hidden">
        <div className="relative z-10">
            <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight">
                Create amazing content with <span className="bg-gradient-to-r from-purple-400 to-indigo-400 text-transparent bg-clip-text">AI tools</span>
            </h1>
            <p className="mt-6 text-lg text-slate-300 max-w-2xl mx-auto">
                Transform your content creation with our suite of premium AI tools. Write articles, generate images, and enhance your workflow.
            </p>
            <div className="mt-10 flex justify-center gap-4">
                <Link to="/register" className="inline-block bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-700 transition-all shadow-lg">
                    Start Creating Now
                </Link>
                <Link to="/demo" className="inline-block bg-slate-700/50 text-white font-bold py-3 px-8 rounded-lg hover:bg-slate-700 transition-all">
                    Watch Demo
                </Link>
            </div>
            <div className="mt-8 flex justify-center items-center gap-2 text-slate-400">
                <div className="flex -space-x-2 overflow-hidden">
                    <img className="inline-block h-8 w-8 rounded-full ring-2 ring-slate-700" src="https://placehold.co/32x32/ffa31a/ffffff?text=A" alt="User"/>
                    <img className="inline-block h-8 w-8 rounded-full ring-2 ring-slate-700" src="https://placehold.co/32x32/9546e8/ffffff?text=B" alt="User"/>
                    <img className="inline-block h-8 w-8 rounded-full ring-2 ring-slate-700" src="https://placehold.co/32x32/1a90ff/ffffff?text=C" alt="User"/>
                </div>
                <span>Trusted by 10,000+ people</span>
            </div>
        </div>
    </div>
);

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/login', formData);
            login(res.data.session);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to log in.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10">
            <div className="bg-white p-8 rounded-xl shadow-2xl">
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Login to Your Account</h2>
                <form onSubmit={handleSubmit}>
                    {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">Email Address</label>
                        <input className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500" id="email" type="email" placeholder="you@example.com" name="email" value={formData.email} onChange={handleChange} required />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">Password</label>
                        <input className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500" id="password" type="password" placeholder="******************" name="password" value={formData.password} onChange={handleChange} required />
                    </div>
                    <div className="flex items-center justify-between">
                        <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg w-full transition-all" type="submit" disabled={isLoading}>
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </div>
                </form>
                <p className="text-center text-gray-600 text-sm mt-6">
                    Don't have an account?{' '}
                    <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">
                        Sign Up
                    </Link>
                </p>
            </div>
        </div>
    );
};

const Register = () => {
    const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        setIsLoading(true);
        setError('');
        setSuccess('');
        try {
            const { email, password } = formData;
            const res = await api.post('/auth/register', { email, password });
            setSuccess(res.data.message || 'Registration successful!');
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to register.');
        } finally {
            setIsLoading(false);
        }
    };

     return (
        <div className="max-w-md mx-auto mt-10">
            <div className="bg-white p-8 rounded-xl shadow-2xl">
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Create a New Account</h2>
                <form onSubmit={handleSubmit}>
                    {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                    {success && <p className="text-green-500 text-center mb-4">{success}</p>}
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">Email</label>
                        <input className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700" id="email" type="email" placeholder="you@example.com" name="email" value={formData.email} onChange={handleChange} required />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">Password</label>
                        <input className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700" id="password" type="password" placeholder="Minimum 6 characters" name="password" value={formData.password} onChange={handleChange} required />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">Confirm Password</label>
                        <input className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700" id="confirmPassword" type="password" placeholder="******************" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
                    </div>
                    <div className="flex items-center justify-between">
                        <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg w-full transition-all" type="submit" disabled={isLoading}>
                             {isLoading ? 'Creating...' : 'Create Account'}
                        </button>
                    </div>
                </form>
                 <p className="text-center text-gray-600 text-sm mt-6">
                    Already have an account?{' '}
                    <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
};

const Dashboard = () => { 
    const navigate = useNavigate();
    const services = [
        { name: 'Text to Image', description: 'Generate images from text.', path: '/text-to-image' },
        { name: 'Resume Analyzer', description: 'Get feedback on your resume.', path: '/resume-analyzer' },
        { name: 'Background Remover', description: 'Remove the background from images.', path: '/background-remover' },
    ];

    return (
        <div className="p-8">
            <h1 className="text-4xl font-bold text-center mb-10 text-gray-800">Our Services</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {services.map((service) => (
                    <div
                        key={service.name}
                        className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out cursor-pointer group"
                        onClick={() => navigate(service.path)}
                    >
                        <h2 className="text-2xl font-semibold mb-2 text-gray-900 group-hover:text-indigo-600 transition-colors">{service.name}</h2>
                        <p className="text-gray-600">{service.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const DemoPage = () => {
    const navigate = useNavigate();
    const services = [
        { name: 'Text to Image', description: 'Generate images from text.' },
        { name: 'Resume Analyzer', description: 'Get feedback on your resume.' },
        { name: 'Background Remover', description: 'Remove the background from images.' },
    ];

    return (
        <div className="p-8">
            <h1 className="text-4xl font-bold text-center mb-4 text-gray-800">Explore Our AI Services</h1>
            <p className="text-lg text-gray-600 text-center mb-10 max-w-2xl mx-auto">
                This is a demo of our powerful AI tools. To start creating and get your results, please sign up or log in.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {services.map((service) => (
                    <div
                        key={service.name}
                        className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out cursor-pointer group"
                        onClick={() => navigate('/login')} // Always navigates to login page
                    >
                        <h2 className="text-2xl font-semibold mb-2 text-gray-900 group-hover:text-indigo-600 transition-colors">{service.name}</h2>
                        <p className="text-gray-600">{service.description}</p>
                    </div>
                ))}
            </div>
             <div className="text-center mt-12">
                <Link to="/register" className="inline-block bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-700 transition-all shadow-lg">
                    Sign Up for Free
                </Link>
            </div>
        </div>
    );
};

const TextToImage = () => {
    const [prompt, setPrompt] = useState('');
    const [imageUrl, setImageUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const { fetchProfile } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setImageUrl(null);
        try {
            const res = await api.post('/ai/text-to-image', { prompt });
            setImageUrl(res.data.imageUrl);
            fetchProfile(); 
        } catch (err) {
            setError(err.response?.data?.error || 'An error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
         <div className="max-w-2xl mx-auto p-8">
            <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">Text to Image Generator</h1>
             <div className="bg-white p-8 rounded-xl shadow-2xl">
                <form onSubmit={handleSubmit}>
                    <label htmlFor="prompt" className="block text-sm font-medium text-gray-700">Enter a prompt</label>
                    <textarea
                        id="prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 sm:text-sm h-28"
                        placeholder="e.g., A majestic lion wearing a crown"
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="mt-6 w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-all"
                    >
                        {isLoading ? 'Generating...' : 'Generate Image'}
                    </button>
                </form>
                {error && <div className="mt-4 text-red-600 bg-red-100 p-3 rounded-md">{error}</div>}
                {isLoading && <div className="mt-6 text-center text-gray-600">Loading... Please wait, this may take a moment.</div>}
                {imageUrl && (
                    <div className="mt-8">
                        <h2 className="text-xl font-semibold text-center text-gray-800">Generated Image:</h2>
                        <div className="mt-4 border-2 border-gray-200 rounded-lg overflow-hidden">
                            <img src={imageUrl} alt="Generated from prompt" className="w-full" />
                        </div>
                    </div>
                )}
             </div>
        </div>
    );
};

const ResumeAnalyzer = () => {
    const [file, setFile] = useState(null);
    const [analysis, setAnalysis] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { fetchProfile } = useAuth();
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setAnalysis('');
        const formData = new FormData();
        formData.append('resume', file);

        try {
            const res = await api.post('/ai/analyze-resume', formData);
            setAnalysis(res.data.analysis);
            fetchProfile();
        } catch (err) {
            setError(err.response?.data?.error || 'An error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <div className="max-w-2xl mx-auto p-8">
            <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">Resume Analyzer</h1>
            <div className="bg-white p-8 rounded-xl shadow-2xl">
                <form onSubmit={handleSubmit}>
                    <label className="block text-sm font-medium text-gray-700">Upload your Resume (PDF or DOCX)</label>
                    <div 
                        className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:border-indigo-500 transition-colors"
                        onClick={() => fileInputRef.current.click()}
                    >
                         <div className="space-y-1 text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            <p className="text-indigo-600 font-semibold">{file ? file.name : 'Click to select a file'}</p>
                            <p className="text-xs text-gray-500">PDF, DOCX up to 10MB</p>
                        </div>
                    </div>
                    <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.docx" />
                    <button type="submit" disabled={!file || isLoading} className="mt-6 w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-all">
                        {isLoading ? 'Analyzing...' : 'Analyze Resume'}
                    </button>
                </form>
                {error && <div className="mt-4 text-red-600 bg-red-100 p-3 rounded-md">{error}</div>}
                {isLoading && <div className="mt-6 text-center text-gray-600">Analyzing...</div>}
                {analysis && (
                    <div className="mt-8">
                        <h2 className="text-xl font-semibold text-gray-800">Analysis Results:</h2>
                        <div className="mt-2 p-4 bg-gray-50 rounded-lg whitespace-pre-wrap border">
                            <p>{analysis}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const BackgroundRemover = () => {
    const [file, setFile] = useState(null);
    const [originalImage, setOriginalImage] = useState(null);
    const [resultImage, setResultImage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { fetchProfile } = useAuth();
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type.startsWith('image/')) {
            setFile(selectedFile);
            setOriginalImage(URL.createObjectURL(selectedFile));
            setResultImage(null);
            setError('');
        } else {
            setFile(null);
            setOriginalImage(null);
            setError('Please upload a valid image file.');
        }
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setResultImage(null);
        const formData = new FormData();
        formData.append('image', file);
        try {
            const res = await api.post('/ai/remove-background', formData);
            setResultImage(res.data.imageUrl);
            fetchProfile();
        } catch (err) {
            setError(err.response?.data?.error || 'An error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <div className="max-w-4xl mx-auto p-8">
            <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">Background Remover</h1>
            <div className="bg-white p-8 rounded-xl shadow-2xl">
                <form onSubmit={handleSubmit}>
                    <label className="block text-sm font-medium text-gray-700">Upload an Image</label>
                    <div 
                        className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:border-indigo-500 transition-colors"
                        onClick={() => fileInputRef.current.click()}
                    >
                         <div className="space-y-1 text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            <p className="text-indigo-600 font-semibold">{file ? file.name : 'Click to select an image'}</p>
                        </div>
                    </div>
                    <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                    <button type="submit" disabled={!file || isLoading} className="mt-6 w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-all">
                        {isLoading ? 'Processing...' : 'Remove Background'}
                    </button>
                </form>
                {error && <div className="mt-4 text-red-600 bg-red-100 p-3 rounded-md">{error}</div>}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h2 className="text-xl font-semibold text-center text-gray-800">Original</h2>
                        <div className="mt-2 border-2 border-gray-200 rounded-lg h-96 flex items-center justify-center bg-gray-50">
                            {originalImage ? <img src={originalImage} alt="Original" className="max-h-full max-w-full object-contain" /> : <p className="text-gray-500">Preview</p>}
                        </div>
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-center text-gray-800">Result</h2>
                        <div className="mt-2 border-2 border-gray-200 rounded-lg h-96 flex items-center justify-center bg-gray-50">
                            {isLoading ? <p>Loading...</p> : resultImage ? <img src={resultImage} alt="Result" className="max-h-full max-w-full object-contain" /> : <p className="text-gray-500">Result</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PricingPage = () => {
    const { profile, fetchProfile, session } = useAuth();
    const [error, setError] = useState('');
    const [loadingPlan, setLoadingPlan] = useState(null);
    const isRazorpayLoaded = useRazorpayScript();

    const plans = [
        { id: 'starter_50', name: 'Starter Pack', credits: 50, price: 499, description: 'Perfect for getting started.' },
        { id: 'pro_250', name: 'Pro Pack', credits: 250, price: 1999, description: 'Ideal for frequent users.', popular: true },
        { id: 'premium_1000', name: 'Premium Pack', credits: 1000, price: 5999, description: 'Best value for power users.' },
    ];

    const handlePurchase = async (plan) => {
        if (!session) {
            setError("You must be logged in to make a purchase.");
            return;
        }
        setLoadingPlan(plan.id);
        setError('');
        try {
            const { data: order } = await api.post('/payment/create-order', {
                amount: plan.price * 100,
                notes: {
                    user_id: session.user.id,
                    credits_to_add: plan.credits
                }
            });

            const options = {
                key: order.key_id,
                amount: order.amount,
                currency: "INR",
                name: "AI SaaS Platform",
                description: `Purchase ${plan.name}`,
                order_id: order.id,
                handler: function (response) {
                    alert('Payment successful! Your credits will be updated shortly.');
                    setTimeout(() => {
                        fetchProfile();
                    }, 3000); 
                },
                prefill: {
                    email: profile.email,
                },
                theme: {
                    color: "#4f46e5"
                }
            };
            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (err) {
            const serverError = err.response ? (err.response.data.error || JSON.stringify(err.response.data)) : err.message;
            setError(`Error: ${serverError}`);
        } finally {
            setLoadingPlan(null);
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-4xl font-bold text-center mb-4 text-gray-800">Pricing Plans</h1>
            <p className="text-lg text-gray-600 text-center mb-12">Purchase credits to use our AI services.</p>
            
            {error && (
                <div className="max-w-5xl mx-auto mb-8 text-center text-red-600 bg-red-100 p-3 rounded-md">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {plans.map((plan) => (
                    <div key={plan.id} className={`relative bg-white p-8 rounded-xl shadow-lg text-center transform hover:-translate-y-2 transition-transform duration-300 ${plan.popular ? 'border-4 border-indigo-500' : 'border'}`}>
                         {plan.popular && <span className="bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase absolute -top-4 left-1/2 -translate-x-1/2">Most Popular</span>}
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">{plan.name}</h2>
                        <p className="text-5xl font-bold mb-4 text-gray-900">₹{plan.price}</p>
                        <p className="text-3xl font-bold mb-4 text-gray-800">{plan.credits} <span className="text-lg font-normal text-gray-600">Credits</span></p>
                        <p className="text-gray-600 mb-6">{plan.description}</p>
                        <button 
                            onClick={() => handlePurchase(plan)}
                            disabled={!isRazorpayLoaded || loadingPlan === plan.id}
                            className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
                        >
                            {loadingPlan === plan.id ? 'Processing...' : 'Buy Now'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ProfilePage = () => {
    const { profile } = useAuth();
    if (!profile) return <div className="text-center mt-8">Loading profile...</div>;

    return (
        <div className="max-w-md mx-auto mt-10">
            <div className="bg-white p-8 rounded-xl shadow-2xl">
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">User Profile</h2>
                <div className="mb-4">
                    <p className="text-gray-700 text-lg"><strong>Email:</strong> {profile.email}</p>
                </div>
                <div>
                    <p className="text-gray-700 text-lg"><strong>Remaining Credits:</strong> <span className="font-bold text-indigo-600">{profile.credits}</span></p>
                </div>
            </div>
        </div>
    );
};

const Navbar = () => {
    const { isAuthenticated, logout, profile } = useAuth();
    const navigate = useNavigate();

    return (
        <nav className="bg-slate-900/80 backdrop-blur-sm text-white p-4 shadow-lg sticky top-0 z-50">
            <div className="container mx-auto flex justify-between items-center">
                <Link to="/" className="text-2xl font-bold tracking-wider">AI.SaaS</Link>
                <div className="flex items-center space-x-6 text-lg">
                    {isAuthenticated ? (
                        <>
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

