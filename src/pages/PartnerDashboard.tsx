import React from "react";
import RequestForm from "../components/RequestForm";
import { useAuth } from "../contexts/AuthContext";

export default function PartnerDashboard() {
  const { partnerData } = useAuth();

  if (!partnerData) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Olá, {partnerData.name}</h1>
          <p className="text-sm text-gray-500 mt-1">Preencha o formulário abaixo para registrar uma nova solicitação de certificação.</p>
        </div>
      </div>

      <RequestForm partner={partnerData} />
    </div>
  );
}
