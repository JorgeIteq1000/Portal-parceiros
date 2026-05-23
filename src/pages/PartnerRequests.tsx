import React, { useState, useMemo, useEffect } from "react";
import { StudentRequest, CourseType, RequestStatus } from "../types";
import { Clock, CheckCircle2, AlertCircle, FileText, Calendar, Search, Filter, X, Loader2, Upload } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

const DOC_LABELS: Record<string, string> = {
  civilRegistry: "Certidão Civil",
  identity: "Documento de Identidade",
  addressProof: "Comprovante de Residência",
  previousDegree: "Diploma Anterior",
  previousTranscript: "Histórico Anterior",
  highSchoolTranscript: "Histórico Escolar",
  paymentProof: "Comprovante de Pagamento",
};

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

  const [reuploadModal, setReuploadModal] = useState<StudentRequest | null>(null);
  const [reuploadFiles, setReuploadFiles] = useState<{ [key: string]: File | null }>({});
  const [isReuploading, setIsReuploading] = useState(false);
  const [timelineModal, setTimelineModal] = useState<{ isOpen: boolean, history: any[], isLoading: boolean }>({ isOpen: false, history: [], isLoading: false });

  const submitReupload = async () => {
    if (!reuploadModal) return;
    setIsReuploading(true);
    
    const formData = new FormData();
    formData.append("action", "partner_reupload");
    formData.append("request_id", reuploadModal.id);
    
    for (const doc of (reuploadModal.diligence_documents || [])) {
      if (reuploadFiles[doc]) {
         formData.append(`file_${doc}`, reuploadFiles[doc] as File);
      } else {
         alert(`Por favor, anexe o documento: ${DOC_LABELS[doc] || doc}`);
         setIsReuploading(false);
         return;
      }
    }

    const { data: authData } = await supabase.auth.getSession();
    const token = authData.session?.access_token;
    
    try {
      const res = await fetch("https://fowfxmsduqgwajcpkgiy.supabase.co/functions/v1/api-drive-docs", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      
      if (!res.ok) throw new Error("Erro ao reenviar documentos");
      
      setRequests(prev => prev.map(req => 
        req.id === reuploadModal.id ? { ...req, status: 'Pedido Enviado', diligence_reason: undefined, diligence_documents: undefined } : req
      ));
      setReuploadModal(null);
      setReuploadFiles({});
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsReuploading(false);
    }
  };

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (fileId: string, fileName: string) => {
    setDownloadingId(fileId);
    try {
      const { data: authData } = await supabase.auth.getSession();
      const token = authData.session?.access_token;
      
      const res = await fetch(`https://fowfxmsduqgwajcpkgiy.supabase.co/functions/v1/api-drive-docs?fileId=${fileId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error("Erro ao baixar o arquivo");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || "Documento";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("Falha no download: " + err.message);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleOpenTimeline = async (reqId: string) => {
    setTimelineModal({ isOpen: true, history: [], isLoading: true });
    const { data } = await supabase.from('request_history').select('*').eq('request_id', reqId).order('created_at', { ascending: true });
    setTimelineModal({ isOpen: true, history: data || [], isLoading: false });
  };

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

                        <button
                          onClick={() => handleOpenTimeline(request.id)}
                          className="block mt-2 text-xs text-blue-600 font-medium hover:text-blue-800 transition-colors underline"
                        >
                          Ver Histórico
                        </button>

                        {request.status === 'Diligência' && request.diligence_reason && (
                          <div className="mt-2 text-xs text-red-600 max-w-[250px] whitespace-normal bg-red-50 p-2 rounded-md border border-red-100">
                            <strong>Motivo:</strong> {request.diligence_reason}
                            <button onClick={() => setReuploadModal(request)} className="block mt-1.5 text-red-700 underline font-medium hover:text-red-900 transition-colors">
                              Reenviar documentos exigidos
                            </button>
                          </div>
                        )}

                        {request.status === 'Documentos Emitidos' && request.issued_documents && (
                          <div className="mt-2 flex flex-col gap-1.5">
                            {Object.entries(request.issued_documents).map(([type, doc]: any) => (
                              <button 
                                key={type}
                                onClick={() => handleDownload(doc.id, doc.name)}
                                disabled={downloadingId === doc.id}
                                className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1.5 rounded-md hover:bg-emerald-200 transition-colors w-max font-medium flex items-center disabled:opacity-50"
                              >
                                {downloadingId === doc.id ? (
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                )}
                                Baixar {type.charAt(0).toUpperCase() + type.slice(1)}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Reenvio (Diligência) */}
      {reuploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Reenviar Documentos</h3>
              <button onClick={() => setReuploadModal(null)} className="text-gray-500 hover:text-gray-700" disabled={isReuploading}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-red-50 text-red-800 text-sm rounded-md border border-red-100">
              <strong>Motivo da Diligência:</strong> {reuploadModal.diligence_reason}
            </div>
            
            <div className="space-y-4">
              {(reuploadModal.diligence_documents || []).map(doc => (
                <div key={doc} className="border border-gray-200 rounded-md p-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {DOC_LABELS[doc] || doc} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files ? e.target.files[0] : null;
                      setReuploadFiles(prev => ({ ...prev, [doc]: file }));
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 outline-none"
                    disabled={isReuploading}
                  />
                </div>
              ))}
              
              <button
                onClick={submitReupload}
                disabled={isReuploading}
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors flex items-center justify-center"
              >
                {isReuploading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</>
                ) : (
                  <><Upload className="w-4 h-4 mr-2" /> Reenviar e Resolver</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Timeline */}
      {timelineModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full shadow-xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Histórico do Pedido
              </h3>
              <button onClick={() => setTimelineModal({ ...timelineModal, isOpen: false })} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 pr-2">
              {timelineModal.isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : timelineModal.history.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Nenhum histórico encontrado.</p>
              ) : (
                <div className="relative border-l border-gray-200 ml-3 space-y-6 pb-4">
                  {timelineModal.history.map((item, idx) => (
                    <div key={item.id} className="relative pl-6">
                      <div className={`absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-white ${idx === timelineModal.history.length - 1 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900">{item.action}</span>
                        <span className="text-xs text-gray-500 mt-0.5">Por {item.actor_name} em {new Date(item.created_at).toLocaleString('pt-BR')}</span>
                        {item.details && item.details.reason && (
                          <div className="mt-2 text-sm bg-red-50 border border-red-100 rounded p-2 text-red-800">
                            <strong>Motivo:</strong> {item.details.reason}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
