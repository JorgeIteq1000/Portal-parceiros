import React from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FilePlus, List, Building } from "lucide-react";
import AdminDashboard from "./pages/AdminDashboard";
import PartnerDashboard from "./pages/PartnerDashboard";
import PartnerRequests from "./pages/PartnerRequests";
import AdminPartnerRegistration from "./pages/AdminPartnerRegistration";

function Navigation() {
  const location = useLocation();
  
  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="font-bold text-xl text-blue-600">CertificaPortal</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
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
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<PartnerDashboard />} />
            <Route path="/requests" element={<PartnerRequests />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/partners/new" element={<AdminPartnerRegistration />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
