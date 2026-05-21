import React from "react";
import RequestForm from "../components/RequestForm";
import { Partner } from "../types";

// Dados mockados para simular o parceiro logado
const MOCK_PARTNER_LOGGED_IN: Partner = {
  id: "partner_123_abc",
  name: "Polo Unisul São Paulo",
  require_payment_proof: true, // Simula que este parceiro PRECISA enviar comprovante
  authorized_courses: ["2ª Licenciatura", "Pós Graduação"],
};

export default function PartnerDashboard() {
  console.log("[PartnerDashboard] Renderizando visualização do Parceiro.", MOCK_PARTNER_LOGGED_IN);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Olá, {MOCK_PARTNER_LOGGED_IN.name}</h1>
          <p className="text-sm text-gray-500 mt-1">Preencha o formulário abaixo para registrar uma nova solicitação de certificação.</p>
        </div>
      </div>

      <RequestForm partner={MOCK_PARTNER_LOGGED_IN} />
    </div>
  );
}
