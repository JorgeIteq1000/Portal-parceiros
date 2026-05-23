import React from "react";
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import { LayoutDashboard, FilePlus, List, Building, LogOut, BookOpen, Code } from "lucide-react";
import AdminDashboard from "./pages/AdminDashboard";
import PartnerDashboard from "./pages/PartnerDashboard";
import PartnerRequests from "./pages/PartnerRequests";
import AdminPartnerRegistration from "./pages/AdminPartnerRegistration";
import AdminPartners from "./pages/AdminPartners";
import AdminCourses from "./pages/AdminCourses";
import PartnerApiDocs from "./pages/PartnerApiDocs";
import Login from "./pages/Login";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

function Navigation() {
  const location = useLocation();
  const { role, signOut, user } = useAuth();
  
  if (!user || !role) return null; // Não mostra nav no login

  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="font-bold text-xl text-blue-600">CertificaPortal</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {role === 'partner' && (
                <>
                  <Link
                    to="/"
                    className={`${
                      location.pathname === "/"
                        ? "border-blue-500 text-gray-900"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    <FilePlus className="w-4 h-4 mr-2" />
                    Nova Solicitação
                  </Link>
                  <Link
                    to="/requests"
                    className={`${
                      location.pathname === "/requests"
                        ? "border-blue-500 text-gray-900"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    <List className="w-4 h-4 mr-2" />
                    Acompanhar
                  </Link>
                  <Link
                    to="/partner/api"
                    className={`${
                      location.pathname === "/partner/api"
                        ? "border-blue-500 text-gray-900"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    <Code className="w-4 h-4 mr-2" />
                    API
                  </Link>
                </>
              )}
              {role === 'admin' && (
                <>
                  <Link
                    to="/admin"
                    className={`${
                      location.pathname === "/admin"
                        ? "border-blue-500 text-gray-900"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Admin (Kanban)
                  </Link>
                  <Link
                    to="/admin/partners/new"
                    className={`${
                      location.pathname === "/admin/partners/new"
                        ? "border-blue-500 text-gray-900"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    <Building className="w-4 h-4 mr-2" />
                    Novo Parceiro
                  </Link>
                  <Link
                    to="/admin/partners"
                    className={`${
                      location.pathname === "/admin/partners"
                        ? "border-blue-500 text-gray-900"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    <Building className="w-4 h-4 mr-2" />
                    Parceiros
                  </Link>
                  <Link
                    to="/admin/courses"
                    className={`${
                      location.pathname === "/admin/courses"
                        ? "border-blue-500 text-gray-900"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Cursos
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center">
             <button
               onClick={signOut}
               className="text-gray-500 hover:text-red-600 inline-flex items-center text-sm font-medium"
             >
               <LogOut className="w-4 h-4 mr-1" /> Sair
             </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function ProtectedRoute({ children, allowedRole }: { children: React.ReactNode, allowedRole: 'admin' | 'partner' }) {
  const { user, role, isLoading } = useAuth();
  
  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role !== allowedRole) {
     return <Navigate to={role === 'admin' ? '/admin' : '/'} replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Carregando portal...</div>;

  return (
    <>
      <Navigation />
      <main className={user ? "max-w-7xl mx-auto py-6 sm:px-6 lg:px-8" : ""}>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Rotas de Parceiro */}
          <Route path="/" element={<ProtectedRoute allowedRole="partner"><PartnerDashboard /></ProtectedRoute>} />
          <Route path="/requests" element={<ProtectedRoute allowedRole="partner"><PartnerRequests /></ProtectedRoute>} />
          <Route path="/partner/api" element={<ProtectedRoute allowedRole="partner"><PartnerApiDocs /></ProtectedRoute>} />
          
          {/* Rotas de Admin */}
          <Route path="/admin" element={<ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/partners" element={<ProtectedRoute allowedRole="admin"><AdminPartners /></ProtectedRoute>} />
          <Route path="/admin/partners/new" element={<ProtectedRoute allowedRole="admin"><AdminPartnerRegistration /></ProtectedRoute>} />
          <Route path="/admin/courses" element={<ProtectedRoute allowedRole="admin"><AdminCourses /></ProtectedRoute>} />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <AppRoutes />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
