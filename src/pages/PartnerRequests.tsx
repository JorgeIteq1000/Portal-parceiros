import React, { useState, useMemo, useEffect } from "react";
import { StudentRequest, CourseType, RequestStatus } from "../types";
import { Clock, CheckCircle2, AlertCircle, FileText, Calendar, Search, Filter } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

const STATUS_CONFIG: Record<RequestStatus, { icon: any, color: string, bg: string, border: string }> = {
  "Pedido Enviado": { icon: Clock, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-200" },
  "Recebimento Confirmado": { icon: CheckCircle2, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-200" },
  "Diligência": { icon: AlertCircle, color: "text-red-500", bg: "bg-red-50", border: "border-red-200" },
  "Em processo de emissão": { icon: AlertCircle, color: "text-purple-500", bg: "bg-purple-50", border: "border-purple-200" },
  "Documentos Emitidos": { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-200" }
};

export default function PartnerRequests() {
  const { user, partnerData } = useAuth();
  const [requests, setRequests] = useState<StudentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState<CourseType | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "ALL">("ALL");

  useEffect(() => {
    async function fetchRequests() {
      if (!user) return;
      const { data, error } = await supabase
        .from("requests")
        .select("*")
        .eq("partner_id", user.id)
        .order("created_at", { ascending: false });

      if (data && !error) {
        setRequests(data as StudentRequest[]);
      }
      setLoading(false);
    }
    fetchRequests();
  }, [user]);

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const normalizedSearch = searchTerm.toLowerCase();
      const documentRaw = req.student_cpf.replace(/\D/g, "");
      const searchRaw = searchTerm.replace(/\D/g, "");
      
      const matchSearch =
        req.student_name.toLowerCase().includes(normalizedSearch) ||
        (searchRaw && documentRaw.includes(searchRaw));

      const matchCourse = courseFilter === "ALL" || req.course_type === courseFilter;
      const matchStatus = statusFilter === "ALL" || req.status === statusFilter;

      return matchSearch && matchCourse && matchStatus;
    });
  }, [requests, searchTerm, courseFilter, statusFilter]);

  if (loading) return <div className="p-8 text-center">Carregando solicitações...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Minhas Solicitações</h1>
          <p className="text-sm text-gray-500 mt-1">Acompanhe e filtre os pedidos enviados pelo seu polo.</p>
        </div>
      </div>

      {/* Control Bar - Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <label htmlFor="search" className="sr-only">Buscar por Nome ou CPF</label>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="search"
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Buscar aluno por nome ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-4 md:w-auto w-full">
          <div className="w-full md:w-48 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value as CourseType | "ALL")}
              className="block w-full pl-9 pr-8 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">Todos os cursos</option>
              {partnerData?.authorized_courses?.map((course: string) => (
                <option key={course} value={course}>{course}</option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-48 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RequestStatus | "ALL")}
              className="block w-full pl-9 pr-8 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">Todos os status</option>
              <option value="Pedido Enviado">Pedido Enviado</option>
              <option value="Recebimento Confirmado">Recebimento Confirmado</option>
              <option value="Diligência">Diligência</option>
              <option value="Em processo de emissão">Em processo de emissão</option>
              <option value="Documentos Emitidos">Documentos Emitidos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum resultado encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">Tente ajustar seus filtros para encontrar a solicitação.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aluno
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Curso
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data da Solicitação
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status Atual
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => {
                  const StatusIcon = STATUS_CONFIG[request.status].icon;
                  return (
                    <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{request.student_name}</div>
                        <div className="text-sm text-gray-500">CPF: {request.student_cpf}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                          {request.course_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1.5 text-gray-400" />
                          {new Date(request.created_at).toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_CONFIG[request.status].bg} ${STATUS_CONFIG[request.status].color} ${STATUS_CONFIG[request.status].border}`}>
                          <StatusIcon className="w-3.5 h-3.5 mr-1.5" />
                          {request.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
