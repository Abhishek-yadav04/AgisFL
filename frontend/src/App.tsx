import React, { useState, useEffect, Suspense, lazy } from 'react';
import { create } from 'zustand';
import { Toaster, toast } from 'react-hot-toast';
import { LayoutDashboard, Shield, Network, Brain, Database, Settings, BarChart2, TestTube2, LifeBuoy, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// 1. GLOBAL STATE (Zustand Store)
// ============================================================================
// In a real application, this would be in `src/stores/appStore.ts`.
// For this self-contained example, it's defined here to resolve import errors.

const useAppStore = create((set) => ({
  theme: 'dark',
  sidebarCollapsed: false,
  connectionStatus: 'disconnected',
  user: { name: 'Admin' },
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  addNotification: (notification) => {
    // This is a placeholder. In the real store, it would add to a notification array.
    console.log('New Notification:', notification);
  },
}));


// ============================================================================
// 2. PLACEHOLDER PAGE COMPONENTS
// ============================================================================
// In a real application, each of these would be in its own file under `src/pages/`.
// They are defined here as placeholders to resolve import errors.

const createPlaceholderPage = (name) => () => (
    <div className="p-8">
        <h1 className="text-4xl font-bold text-white">{name}</h1>
        <p className="mt-2 text-gray-400">This is a placeholder for the {name} page.</p>
    </div>
);

const Dashboard = createPlaceholderPage('Dashboard');
const SecurityCenter = createPlaceholderPage('Security Center');
const NetworkMonitoring = createPlaceholderPage('Network Monitoring');
const FederatedLearning = createPlaceholderPage('Federated Learning');
const DatasetManager = createPlaceholderPage('Dataset Manager');
const FLAlgorithms = createPlaceholderPage('FL Algorithms');
const Integrations = createPlaceholderPage('Integrations');
const SettingsPage = createPlaceholderPage('Settings');


// ============================================================================
// 3. LAYOUT COMPONENTS
// ============================================================================

const Sidebar = () => {
    const { sidebarCollapsed, toggleSidebar } = useAppStore();
    const [activePage, setActivePage] = useState(window.location.hash.substring(1) || 'Dashboard');

    useEffect(() => {
        const handleHashChange = () => setActivePage(window.location.hash.substring(1) || 'Dashboard');
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const navItems = [
        { id: 'Dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'SecurityCenter', icon: Shield, label: 'Security Center' },
        { id: 'NetworkMonitoring', icon: Network, label: 'Network' },
        { id: 'FederatedLearning', icon: Brain, label: 'FL Training' },
        { id: 'DatasetManager', icon: Database, label: 'Datasets' },
        { id: 'FLAlgorithms', icon: TestTube2, label: 'FL Algorithms' },
        { id: 'Integrations', icon: BarChart2, label: 'Integrations' },
    ];
    
    const bottomNavItems = [
        { id: 'Settings', icon: Settings, label: 'Settings' },
        { id: 'Help', icon: LifeBuoy, label: 'Help & Support' },
    ];

    return (
        <aside className={`bg-gray-900/80 backdrop-blur-lg border-r border-gray-700/50 flex flex-col transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-6'} h-20 border-b border-gray-700/50 shrink-0`}>
                <img src="https://placehold.co/40x40/1f2937/7dd3fc?text=A" alt="AgisFL Logo" className="h-8 w-8 rounded-lg" />
                <AnimatePresence>
                    {!sidebarCollapsed && (
                        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="ml-3 text-xl font-bold text-white">AgisFL</motion.span>
                    )}
                </AnimatePresence>
            </div>
            <div className="flex-1 flex flex-col justify-between overflow-y-auto">
                <nav className="px-4 py-6 space-y-2">
                    {navItems.map(item => (
                        <a key={item.id} href={`#${item.id}`}
                            className={`flex items-center p-3 rounded-lg transition-colors ${activePage === item.id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                            <item.icon className="h-5 w-5 shrink-0" />
                            <AnimatePresence>
                                {!sidebarCollapsed && (
                                    <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="ml-4 font-medium whitespace-nowrap">{item.label}</motion.span>
                                )}
                            </AnimatePresence>
                        </a>
                    ))}
                </nav>
                <nav className="px-4 py-6 space-y-2 border-t border-gray-700/50">
                    {bottomNavItems.map(item => (
                         <a key={item.id} href={`#${item.id}`}
                            className={`flex items-center p-3 rounded-lg transition-colors ${activePage === item.id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                            <item.icon className="h-5 w-5 shrink-0" />
                            <AnimatePresence>
                                {!sidebarCollapsed && (
                                    <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="ml-4 font-medium whitespace-nowrap">{item.label}</motion.span>
                                )}
                            </AnimatePresence>
                        </a>
                    ))}
                </nav>
            </div>
            <div className={`p-4 border-t border-gray-700/50 shrink-0`}>
                <button onClick={toggleSidebar} className="w-full flex items-center justify-center p-3 text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-colors">
                    {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                </button>
            </div>
        </aside>
    );
};

const Header = ({pageTitle}) => {
    const { user } = useAppStore();
    return (
        <header className="h-20 bg-gray-900/50 backdrop-blur-lg border-b border-gray-700/50 flex items-center justify-between px-8 shrink-0">
            <h2 className="text-xl font-semibold text-white">{pageTitle}</h2>
            <div className="flex items-center space-x-6">
                {/* Global Search, Notifications, Theme Toggle, User Menu would go here */}
                <div className="flex items-center space-x-3">
                    <img src="https://placehold.co/40x40/7dd3fc/1f2937?text=A" alt="User Avatar" className="w-10 h-10 rounded-full"/>
                    <div>
                        <p className="font-semibold text-white">{user.name}</p>
                        <p className="text-xs text-gray-400">Administrator</p>
                    </div>
                </div>
            </div>
        </header>
    );
};


// ============================================================================
// 4. ROUTING & PAGE RENDERING
// ============================================================================

const PageRenderer = ({ page }: { page: string }) => {
    const renderPage = () => {
        switch (page) {
            case 'Dashboard': return <Dashboard />;
            case 'SecurityCenter': return <SecurityCenter />;
            case 'NetworkMonitoring': return <NetworkMonitoring />;
            case 'FederatedLearning': return <FederatedLearning />;
            case 'DatasetManager': return <DatasetManager />;
            case 'FLAlgorithms': return <FLAlgorithms />;
            case 'Integrations': return <Integrations />;
            case 'Settings': return <SettingsPage />;
            case 'Help': return createPlaceholderPage('Help & Support')();
            default: return <Dashboard />;
        }
    };

    // Suspense is kept for potential future lazy loading, but not strictly needed with placeholders.
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div></div>}>
            {renderPage()}
        </Suspense>
    );
};

// ============================================================================
// 5. MAIN APP COMPONENT
// ============================================================================

const App: React.FC = () => {
    const { theme, setConnectionStatus, addNotification } = useAppStore();
    const [currentPage, setCurrentPage] = useState(window.location.hash.substring(1) || 'Dashboard');

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove(theme === 'dark' ? 'light' : 'dark');
        root.classList.add(theme);
    }, [theme]);

    useEffect(() => {
        const handleHashChange = () => setCurrentPage(window.location.hash.substring(1) || 'Dashboard');
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    useEffect(() => {
        setConnectionStatus('connecting');
        const connectTimeout = setTimeout(() => {
            setConnectionStatus('connected');
            toast.success('Connected to AgisFL Backend');
            addNotification({ type: 'info', title: 'System Online', message: 'Successfully connected to the real-time monitoring service.' });
        }, 2000);
        return () => clearTimeout(connectTimeout);
    }, [setConnectionStatus, addNotification]);

    return (
        <>
            <Toaster position="bottom-right" toastOptions={{
                style: { background: '#1f2937', color: '#e5e7eb', border: '1px solid #374151' },
                success: { iconTheme: { primary: '#34d399', secondary: 'white' } },
                error: { iconTheme: { primary: '#f87171', secondary: 'white' } },
            }} />
            <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
                <Sidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Header pageTitle={currentPage.replace(/([A-Z])/g, ' $1').trim()} />
                    <main className="flex-1 overflow-y-auto bg-gray-800/50">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentPage}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.25 }}
                            >
                                <PageRenderer page={currentPage} />
                            </motion.div>
                        </AnimatePresence>
                    </main>
                </div>
            </div>
        </>
    );
};

export default App;
