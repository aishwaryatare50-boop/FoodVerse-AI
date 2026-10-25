import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import FoodRecognition from './pages/FoodRecognition';
import FreshnessDetection from './pages/FreshnessDetection';
import HygieneMonitor from './pages/HygieneMonitor';
import SmartCooking from './pages/SmartCooking';
import MealPlanner from './pages/MealPlanner';
import Analytics from './pages/Analytics';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'white',
              color: '#292524',
              border: '1px solid #e7e5e4',
              borderRadius: '10px',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '0.875rem',
              fontWeight: 500,
              boxShadow: '0 4px 12px rgba(120, 80, 40, 0.1)',
            },
            success: {
              iconTheme: { primary: '#527d55', secondary: 'white' },
            },
            error: {
              iconTheme: { primary: '#bc5a3f', secondary: 'white' },
            },
          }}
        />

        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/food-recognition"
            element={
              <ProtectedRoute>
                <FoodRecognition />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/freshness"
            element={
              <ProtectedRoute>
                <FreshnessDetection />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/hygiene"
            element={
              <ProtectedRoute>
                <HygieneMonitor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/cooking"
            element={
              <ProtectedRoute>
                <SmartCooking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/meal-plan"
            element={
              <ProtectedRoute>
                <MealPlanner />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/analytics"
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            }
          />

          {/* Feature pages (protected) - placeholder routes */}
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
