import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { LanguageProvider } from "./contexts/LanguageContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { ThemeProvider } from "./components/ThemeProvider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminProtectedRoute } from "./components/AdminProtectedRoute";
import Landing from "./pages/Landing";
import AboutUs from "./pages/AboutUs";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import Dashboard from "./pages/Dashboard";
import NewPrint from "./pages/NewPrint";
import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails";
import EditOrder from "./pages/EditOrder";
import EditProject from "./pages/EditProject";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Payment from "./pages/Payment";
import PaymentPage from "./pages/PaymentPage";
import Refund from "./pages/Refund";
import Credits from "./pages/Credits";
import PaymentSuccess from "./pages/PaymentSuccess";
import Conversations from "./pages/Conversations";
import Business from "./pages/Business";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminOrderDetail from "./pages/admin/AdminOrderDetail";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminUserProfile from "./pages/admin/AdminUserProfile";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminMaterials from "./pages/admin/AdminMaterials";
import AdminPrinters from "./pages/admin/AdminPrinters";
import AdminConversations from "./pages/admin/AdminConversations";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminBusinessManagement from "./pages/admin/AdminBusinessManagement";

const queryClient = new QueryClient();
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";

const App = () => (
  <ThemeProvider defaultTheme="system" storageKey="protolab-ui-theme">
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <NotificationProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/about" element={<AboutUs />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/login" element={<SignIn />} /> {/* Redirect /login to /signin */}
                
                {/* Protected Routes - Require Authentication */}
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/new-print" element={<ProtectedRoute><NewPrint /></ProtectedRoute>} />
                <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                <Route path="/orders/:orderId" element={<ProtectedRoute><OrderDetails /></ProtectedRoute>} />
                <Route path="/orders/:orderId/edit" element={<ProtectedRoute><EditOrder /></ProtectedRoute>} />
                <Route path="/orders/:orderId/payment" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
                <Route path="/projects/:projectName/edit" element={<ProtectedRoute><EditProject /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
                <Route path="/refund" element={<ProtectedRoute><Refund /></ProtectedRoute>} />
                <Route path="/credits" element={<ProtectedRoute><Credits /></ProtectedRoute>} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="/conversations" element={<ProtectedRoute><Conversations /></ProtectedRoute>} />
                <Route path="/business" element={<ProtectedRoute><Business /></ProtectedRoute>} />
                
                {/* Admin Routes */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
                <Route path="/admin/orders" element={<AdminProtectedRoute><AdminOrders /></AdminProtectedRoute>} />
                <Route path="/admin/orders/:orderId" element={<AdminProtectedRoute><AdminOrderDetail /></AdminProtectedRoute>} />
                <Route path="/admin/users" element={<AdminProtectedRoute><AdminUsers /></AdminProtectedRoute>} />
                <Route path="/admin/users/:userId" element={<AdminProtectedRoute><AdminUserProfile /></AdminProtectedRoute>} />
                <Route path="/admin/conversations" element={<AdminProtectedRoute><AdminConversations /></AdminProtectedRoute>} />
                <Route path="/admin/settings" element={<AdminProtectedRoute><AdminSettings /></AdminProtectedRoute>} />
                <Route path="/admin/materials" element={<AdminProtectedRoute><AdminMaterials /></AdminProtectedRoute>} />
                <Route path="/admin/printers" element={<AdminProtectedRoute><AdminPrinters /></AdminProtectedRoute>} />
                <Route path="/admin/analytics" element={<AdminProtectedRoute><AdminAnalytics /></AdminProtectedRoute>} />
                <Route path="/admin/businesses" element={<AdminProtectedRoute><AdminBusinessManagement /></AdminProtectedRoute>} />
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </NotificationProvider>
      </LanguageProvider>
    </QueryClientProvider>
  </GoogleOAuthProvider>
  </ThemeProvider>
);

export default App;
