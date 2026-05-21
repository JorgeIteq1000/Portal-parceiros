import React from "react";
import KanbanBoard from "../components/KanbanBoard";
import { StudentRequest } from "../types";

// Mock das solicitações ativas no banco de dados para a visão de admin
const MOCK_REQUESTS: StudentRequest[] = [
  {
    id: "req_1",
    partner_id: "partner_123_abc",
    student_name: "Mariana Souza Santos",
    student_cpf: "123.456.789-00",
    course_type: "2ª Licenciatura",
    status: "Pedido Enviado",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "req_2",
    partner_id: "partner_123_abc",
    student_name: "Roberto Campos",
    student_cpf: "098.765.432-11",
    course_type: "Pós Graduação",
    status: "Recebimento Confirmado",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: "req_3",
    partner_id: "partner_999_xyz",
    student_name: "Amanda Costa Oliveira",
    student_cpf: "555.444.333-22",
    course_type: "Pós Graduação",
    status: "Em processo de emissão",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
  {
    id: "req_4",
    partner_id: "partner_777_kkk",
    student_name: "Lucas Batista",
    student_cpf: "111.999.888-77",
    course_type: "2ª Licenciatura",
    status: "Documentos Emitidos",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
  }
];

export default function AdminDashboard() {
  console.log("[AdminDashboard] Renderizando visualização Admin (Kanban). Load das solicitações...");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Painel de Administração</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie e movimente o status de emissão dos processos.</p>
        </div>
      </div>

      <KanbanBoard initialRequests={MOCK_REQUESTS} />
    </div>
  );
}
