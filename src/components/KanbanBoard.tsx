import React, { useState } from "react";
import { StudentRequest, RequestStatus } from "../types";
import { User, FileText, Calendar, ArrowRight, ArrowLeft } from "lucide-react";

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

  const moveRequest = (id: string, newStatus: RequestStatus) => {
    console.log(`[KanbanBoard] Movendo card ${id} para status: ${newStatus}`);
    setRequests(prev => prev.map(req => 
      req.id === id ? { ...req, status: newStatus } : req
    ));
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
      moveRequest(draggedRequestId, status);
    }
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
                       <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                          <User className="w-4 h-4 text-gray-400" />
                          {req.student_name}
                       </div>
                    </div>

                    <div className="flex flex-col gap-1 mb-4">
                      <div className="flex items-center text-xs text-gray-500">
                        <FileText className="w-3.5 h-3.5 mr-1.5" />
                        {req.course_type} | CPF: {req.student_cpf}
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
                          onClick={() => moveRequest(req.id, STATUS_COLUMNS[colIndex - 1])}
                          disabled={colIndex === 0}
                          className="p-1 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-0"
                          title="Voltar status"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => moveRequest(req.id, STATUS_COLUMNS[colIndex + 1])}
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
    </div>
  );
}
