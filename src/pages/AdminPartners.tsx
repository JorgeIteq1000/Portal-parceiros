import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Edit2, CheckCircle, XCircle, Loader2, AlertCircle, ShieldOff } from 'lucide-react';
import { Partner } from '../types';

export default function AdminPartners() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRequireProof, setEditRequireProof] = useState(false);
  const [editIsActive, setEditIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPartners();
  }, []);

  async function fetchPartners() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setPartners(data || []);
    } catch (err: any) {
      console.error(err);
      setError("Erro ao carregar parceiros.");
    } finally {
      setLoading(false);
    }
  }

  const handleEditClick = (partner: Partner) => {
    setEditingPartner(partner);
    setEditEmail(""); // Fica vazio para indicar "não mudar"
    setEditPassword(""); // Fica vazio para indicar "não mudar"
    setEditRequireProof(partner.require_payment_proof);
    setEditIsActive(partner.is_active !== false); // Se for nulo, assumimos true
  };

  const handleUpdatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPartner) return;
    setIsSubmitting(true);

    try {
      const body: any = {
        require_payment_proof: editRequireProof,
        is_active: editIsActive
      };

      if (editEmail.trim()) body.email = editEmail.trim();
      if (editPassword.trim()) body.password = editPassword.trim();

      const response = await fetch(`/api/partners/${editingPartner.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao atualizar");

      // Atualiza estado local
      setPartners(partners.map(p => p.id === editingPartner.id ? { 
        ...p, 
        require_payment_proof: editRequireProof, 
        is_active: editIsActive 
      } : p));

      setEditingPartner(null);
      alert("Parceiro atualizado com sucesso!");
    } catch (err: any) {
      alert("Erro: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center"><Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Users className="w-6 h-6 mr-3 text-blue-600" />
          Gestão de Parceiros
        </h1>
        <p className="text-sm text-gray-500 mt-1 pl-9">
          Visualize todos os polos cadastrados e gerencie seus acessos e configurações.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-md flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-2" />
          <span className="text-sm text-red-800">{error}</span>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parceiro / Polo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exige Comprovante</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {partners.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-gray-500">Nenhum parceiro encontrado.</td></tr>
              ) : (
                partners.map((partner) => (
                  <tr key={partner.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {partner.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {partner.is_active !== false ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3.5 h-3.5 mr-1" /> Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <ShieldOff className="w-3.5 h-3.5 mr-1" /> Bloqueado
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {partner.require_payment_proof ? (
                        <span className="text-sm text-blue-600 font-medium">Sim</span>
                      ) : (
                        <span className="text-sm text-gray-500">Não</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleEditClick(partner)}
                        className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors inline-flex items-center"
                      >
                        <Edit2 className="w-4 h-4 mr-1.5" /> Editar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Edição */}
      {editingPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setEditingPartner(null)}></div>
          <div className="bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:max-w-lg w-full relative z-10">
              <form onSubmit={handleUpdatePartner}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Editar Parceiro: <span className="text-blue-600">{editingPartner.name}</span>
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Novo E-mail de Acesso</label>
                      <input 
                        type="email" 
                        value={editEmail}
                        onChange={e => setEditEmail(e.target.value)}
                        placeholder="Deixe em branco para não alterar"
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nova Senha</label>
                      <input 
                        type="password" 
                        value={editPassword}
                        onChange={e => setEditPassword(e.target.value)}
                        placeholder="Deixe em branco para não alterar"
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    
                    <div className="pt-2">
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          checked={editIsActive}
                          onChange={e => setEditIsActive(e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-900">Conta Ativa (Pode acessar o sistema)</span>
                      </label>
                    </div>

                    <div>
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          checked={editRequireProof}
                          onChange={e => setEditRequireProof(e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-900">Exigir Comprovante de Pagamento</span>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {isSubmitting ? "Salvando..." : "Salvar Alterações"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingPartner(null)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
      )}
    </div>
  );
}
