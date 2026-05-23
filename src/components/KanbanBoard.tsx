import React, { useState } from "react";
import { StudentRequest, RequestStatus } from "../types";
import { User, FileText, Calendar, ArrowRight, ArrowLeft, X, Loader2, Upload, Clock } from "lucide-react";

const DOC_LABELS: Record<string, string> = {
  civilRegistry: "Certidão Civil",
  identity: "Documento de Identidade",
  addressProof: "Comprovante de Residência",
  previousDegree: "Diploma Anterior",
  previousTranscript: "Histórico Anterior",
  highSchoolTranscript: "Histórico Escolar",
  paymentProof: "Comprovante de Pagamento",
};

interface KanbanBoardProps {
  initialRequests: StudentRequest[];
}

const STATUS_COLUMNS: RequestStatus[] = [
  "Pedido Enviado",
  "Recebimento Confirmado",
  "Diligência",
  "Em processo de emissão",
  "Documentos Emitidos"
];

const STATUS_COLORS: Record<RequestStatus, string> = {
  "Pedido Enviado": "bg-blue-100 text-blue-800 border-blue-200",
  "Recebimento Confirmado": "bg-amber-100 text-amber-800 border-amber-200",
  "Diligência": "bg-red-100 text-red-800 border-red-200",
  "Em processo de emissão": "bg-purple-100 text-purple-800 border-purple-200",
  "Documentos Emitidos": "bg-emerald-100 text-emerald-800 border-emerald-200"
};

export default function KanbanBoard({ initialRequests }: KanbanBoardProps) {
  const [requests, setRequests] = useState<StudentRequest[]>(initialRequests);
  const [draggedRequestId, setDraggedRequestId] = useState<string | null>(null);
  const [draggingOverStatus, setDraggingOverStatus] = useState<RequestStatus | null>(null);

  // Modais
  const [diligenceModal, setDiligenceModal] = useState<{ isOpen: boolean, requestId: string, reason: string, documents: string[] }>({ isOpen: false, requestId: '', reason: '', documents: [] });
  const [issuedModal, setIssuedModal] = useState<{ isOpen: boolean, requestId: string, files: { diploma: File | null, historico: File | null, certificado: File | null }, isSubmitting: boolean }>({ isOpen: false, requestId: '', files: { diploma: null, historico: null, certificado: null }, isSubmitting: false });
  const [timelineModal, setTimelineModal] = useState<{ isOpen: boolean, history: any[], isLoading: boolean }>({ isOpen: false, history: [], isLoading: false });

  const moveRequest = async (id: string, newStatus: RequestStatus) => {
    // Atualiza otimista
    setRequests(prev => prev.map(req => 
      req.id === id ? { ...req, status: newStatus } : req
    ));

    // Atualiza no banco
    const { supabase } = await import("../lib/supabase");
    const { error } = await supabase.from('requests').update({ status: newStatus }).eq('id', id);
    if (!error) {
      await supabase.from('request_history').insert({
        request_id: id,
        actor_name: "Administrador",
        action: `Status alterado para: ${newStatus}`
      });
    } else {
       console.error("Erro ao atualizar status:", error);
    }
  };

  const handleStatusChange = (id: string, newStatus: RequestStatus) => {
    if (newStatus === "Diligência") {
      setDiligenceModal({ isOpen: true, requestId: id, reason: '', documents: [] });
    } else if (newStatus === "Documentos Emitidos") {
      setIssuedModal({ isOpen: true, requestId: id, files: { diploma: null, historico: null, certificado: null }, isSubmitting: false });
    } else {
      moveRequest(id, newStatus);
    }
  };

  const submitDiligence = async () => {
    const { requestId, reason, documents } = diligenceModal;
    setDiligenceModal({ ...diligenceModal, isOpen: false });

    const { supabase } = await import("../lib/supabase");
    const { error } = await supabase.from('requests').update({ 
      status: 'Diligência',
      diligence_reason: reason,
      diligence_documents: documents
    }).eq('id', requestId);

    if (!error) {
      setRequests(prev => prev.map(req => 
        req.id === requestId ? { ...req, status: 'Diligência', diligence_reason: reason, diligence_documents: documents } : req
      ));
      await supabase.from('request_history').insert({
        request_id: requestId,
        actor_name: "Administrador",
        action: "Diligência iniciada",
        details: { reason, documents }
      });
    }
  };

  const submitIssued = async () => {
    const { requestId, files } = issuedModal;
    if (!files.diploma && !files.historico && !files.certificado) {
      alert("Envie pelo menos 1 documento.");
      return;
    }
    
    setIssuedModal(prev => ({ ...prev, isSubmitting: true }));
    const { supabase } = await import("../lib/supabase");
    
    const formData = new FormData();
    formData.append("action", "admin_upload");
    formData.append("request_id", requestId);
    if (files.diploma) formData.append("diploma", files.diploma);
    if (files.historico) formData.append("historico", files.historico);
    if (files.certificado) formData.append("certificado", files.certificado);

    const { data: authData } = await supabase.auth.getSession();
    const token = authData.session?.access_token;
    
    try {
      const res = await fetch("https://fowfxmsduqgwajcpkgiy.supabase.co/functions/v1/api-drive-docs", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      
      if (!res.ok) throw new Error("Erro ao subir documentos");
      
      setRequests(prev => prev.map(req => 
        req.id === requestId ? { ...req, status: 'Documentos Emitidos' } : req
      ));
      setIssuedModal({ isOpen: false, requestId: '', files: { diploma: null, historico: null, certificado: null }, isSubmitting: false });
    } catch (err: any) {
      alert(err.message);
      setIssuedModal(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedRequestId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedRequestId(null);
    setDraggingOverStatus(null);
  };

  const handleDragOver = (e: React.DragEvent, status: RequestStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggingOverStatus !== status) {
      setDraggingOverStatus(status);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggingOverStatus(null);
  };

  const handleDrop = (e: React.DragEvent, status: RequestStatus) => {
    e.preventDefault();
    setDraggingOverStatus(null);
    if (draggedRequestId) {
      handleStatusChange(draggedRequestId, status);
    }
  };

  const handleOpenTimeline = async (reqId: string) => {
    setTimelineModal({ isOpen: true, history: [], isLoading: true });
    const { supabase } = await import("../lib/supabase");
    const { data } = await supabase.from('request_history').select('*').eq('request_id', reqId).order('created_at', { ascending: true });
    setTimelineModal({ isOpen: true, history: data || [], isLoading: false });
  };

  return (
    <div className="flex h-full min-h-[calc(100vh-8rem)] gap-6 overflow-x-auto pb-4">
      {STATUS_COLUMNS.map((status, colIndex) => {
        const columnRequests = requests.filter(req => req.status === status);
        const isDraggingOver = draggingOverStatus === status;
        
        return (
          <div 
            key={status} 
            className={`flex-1 min-w-[300px] flex flex-col rounded-xl p-4 border shadow-sm transition-colors ${
              isDraggingOver ? "bg-blue-50 border-blue-300" : "bg-gray-100/50 border-gray-200"
            }`}
            onDragOver={(e) => handleDragOver(e, status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, status)}
          >
            
            {/* Header da Coluna */}
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="font-medium text-gray-900">{status}</h3>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_COLORS[status]} bg-opacity-30 border`}>
                {columnRequests.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex-1 flex flex-col gap-3">
              {columnRequests.length === 0 ? (
                <div className={`flex-1 flex items-center justify-center border-2 border-dashed rounded-lg transition-colors ${
                  isDraggingOver ? "border-blue-400" : "border-gray-300"
                }`}>
                  <p className="text-sm text-gray-400">Arraste para cá</p>
                </div>
              ) : (
                columnRequests.map(req => (
                  <div 
                    key={req.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, req.id)}
                    onDragEnd={handleDragEnd}
                    className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all group flex flex-col cursor-grab active:cursor-grabbing ${
                      draggedRequestId === req.id ? 'opacity-50 scale-95' : 'opacity-100'
                    }`}
                  >
                    
                     <div className="flex items-start justify-between mb-2">
                       <div className="flex flex-col gap-1 w-full">
                         <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                            <User className="w-4 h-4 text-gray-400" />
                            {req.student_name}
                         </div>
                         {req.partners && (
                           <div className="flex items-center gap-2 text-xs font-medium text-blue-700 bg-blue-50 w-fit px-2 py-0.5 rounded-md border border-blue-100">
                             Polo: {req.partners.name}
                           </div>
                         )}
                       </div>
                    </div>

                    <div className="flex flex-col gap-1 mb-4">
                      <div className="flex flex-col text-xs text-gray-500 gap-0.5">
                        <div className="flex items-center">
                          <FileText className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                          <span className="font-medium text-gray-700">{req.course_type}</span>
                          {req.course && <span className="ml-1">- {req.course}</span>}
                        </div>
                        <div className="pl-5">
                          CPF: {req.student_cpf}
                        </div>
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="w-3.5 h-3.5 mr-1.5" />
                        {new Date(req.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>

                    <div className="mt-auto flex border-t border-gray-100 pt-3">
                      {/* Botoes de Ação */}
                      <div className="w-full flex justify-between items-center opacity-70 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleStatusChange(req.id, STATUS_COLUMNS[colIndex - 1])}
                          disabled={colIndex === 0}
                          className="p-1 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-0"
                          title="Voltar status"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleOpenTimeline(req.id)}
                          className="p-1 rounded text-gray-500 hover:bg-gray-100 hover:text-blue-600 flex items-center gap-1 text-xs px-2"
                          title="Ver Histórico"
                        >
                          <Clock className="w-3.5 h-3.5" /> Histórico
                        </button>

                        <button
                          onClick={() => handleStatusChange(req.id, STATUS_COLUMNS[colIndex + 1])}
                          disabled={colIndex === STATUS_COLUMNS.length - 1}
                          className="p-1 rounded text-gray-500 hover:bg-gray-100 hover:text-blue-600 disabled:opacity-0"
                          title="Avançar status"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}

      {/* Modal de Diligência */}
      {diligenceModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Motivo da Diligência</h3>
              <button onClick={() => setDiligenceModal({ ...diligenceModal, isOpen: false })} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Qual o motivo?</label>
                <textarea
                  className="w-full rounded-md border border-gray-300 p-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  rows={3}
                  value={diligenceModal.reason}
                  onChange={(e) => setDiligenceModal({ ...diligenceModal, reason: e.target.value })}
                  placeholder="Ex: Documento ilegível, faltou carimbo..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quais documentos devem ser reenviados?</label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded p-2 bg-gray-50">
                  {Object.entries(DOC_LABELS).map(([key, label]) => (
                    <label key={key} className="flex items-center text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-2 rounded text-blue-600 focus:ring-blue-500"
                        checked={diligenceModal.documents.includes(key)}
                        onChange={(e) => {
                          const newDocs = e.target.checked 
                            ? [...diligenceModal.documents, key] 
                            : diligenceModal.documents.filter(d => d !== key);
                          setDiligenceModal({ ...diligenceModal, documents: newDocs });
                        }}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
              
              <button
                onClick={submitDiligence}
                disabled={!diligenceModal.reason.trim() || diligenceModal.documents.length === 0}
                className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700 disabled:opacity-50 font-medium transition-colors"
              >
                Confirmar Diligência
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Documentos Emitidos */}
      {issuedModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Documentos Emitidos</h3>
              <button onClick={() => setIssuedModal({ ...issuedModal, isOpen: false })} className="text-gray-500 hover:text-gray-700" disabled={issuedModal.isSubmitting}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-gray-500 mb-4">Envie pelo menos um dos documentos oficiais gerados para anexar na pasta do aluno.</p>
            
            <div className="space-y-4">
              {(['diploma', 'historico', 'certificado'] as const).map(type => (
                <div key={type} className="border border-gray-200 rounded-md p-3">
                  <label className="block text-sm font-medium text-gray-700 capitalize mb-2">{type}</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files ? e.target.files[0] : null;
                      setIssuedModal(prev => ({
                        ...prev,
                        files: { ...prev.files, [type]: file }
                      }));
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 outline-none"
                    disabled={issuedModal.isSubmitting}
                  />
                </div>
              ))}
              
              <button
                onClick={submitIssued}
                disabled={issuedModal.isSubmitting || (!issuedModal.files.diploma && !issuedModal.files.historico && !issuedModal.files.certificado)}
                className="w-full bg-emerald-600 text-white py-2 rounded-md hover:bg-emerald-700 disabled:opacity-50 font-medium transition-colors flex items-center justify-center"
              >
                {issuedModal.isSubmitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</>
                ) : (
                  <><Upload className="w-4 h-4 mr-2" /> Salvar Documentos</>
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
