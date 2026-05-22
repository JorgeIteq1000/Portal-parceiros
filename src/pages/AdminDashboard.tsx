import React, { useEffect, useState } from "react";
import KanbanBoard from "../components/KanbanBoard";
import { StudentRequest } from "../types";
import { supabase } from "../lib/supabase";

export default function AdminDashboard() {
  const [requests, setRequests] = useState<StudentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAllRequests() {
      const { data, error } = await supabase
        .from("requests")
        .select("*, partners(name)")
        .order("created_at", { ascending: false });

      if (data && !error) {
        setRequests(data as StudentRequest[]);
      }
      setLoading(false);
    }
    fetchAllRequests();
  }, []);

  if (loading) return <div className="p-8 text-center">Carregando painel de administração...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Painel de Administração</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie e movimente o status de emissão dos processos.</p>
        </div>
      </div>

      <KanbanBoard initialRequests={requests} />
    </div>
  );
}
