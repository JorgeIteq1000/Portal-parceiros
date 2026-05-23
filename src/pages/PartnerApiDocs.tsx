import React, { useState, useEffect } from 'react';
import { Terminal, Key, ShieldAlert, Copy, CheckCircle, RefreshCw, Trash2, Code } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function PartnerApiDocs() {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchApiKey();
  }, [user]);

  async function fetchApiKey() {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('api_key')
        .eq('id', user.id)
        .single();
      
      if (!error && data) {
        setApiKey(data.api_key);
      }
    } catch (err) {
      console.error('Error fetching API key:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleGenerateKey = async () => {
    if (!user) return;
    if (apiKey && !confirm('Tem certeza? Gerar uma nova chave invalidará a chave atual imediatamente.')) return;
    
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('api-partners', {
        body: { action: 'GENERATE_KEY', partner_id: user.id }
      });

      if (error) throw error;
      if (data?.success) {
        setApiKey(data.api_key);
      }
    } catch (err: any) {
      alert('Erro ao gerar chave: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevokeKey = async () => {
    if (!user) return;
    if (!confirm('Tem certeza que deseja revogar esta chave? Nenhuma requisição com ela será aceita.')) return;
    
    setIsGenerating(true);
    try {
      const { error } = await supabase.functions.invoke('api-partners', {
        body: { action: 'REVOKE_KEY', partner_id: user.id }
      });

      if (error) throw error;
      setApiKey(null);
    } catch (err: any) {
      alert('Erro ao revogar chave: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Carregando...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Terminal className="w-6 h-6 mr-3 text-blue-600" />
          Integração API (Desenvolvedores)
        </h1>
        <p className="text-sm text-gray-500 mt-1 pl-9">
          Automatize o envio de alunos utilizando a nossa API REST.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold flex items-center mb-4">
          <Key className="w-5 h-5 mr-2 text-gray-500" /> 
          Chave de Autenticação (API Key)
        </h2>
        
        {!apiKey ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <ShieldAlert className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-gray-900 font-medium mb-1">Nenhuma chave gerada</h3>
            <p className="text-sm text-gray-500 mb-4">
              Você ainda não gerou uma chave de API para o seu polo.
            </p>
            <button
              onClick={handleGenerateKey}
              disabled={isGenerating}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 inline-flex items-center"
            >
              {isGenerating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Key className="w-4 h-4 mr-2" />}
              Gerar Nova Chave API
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <p className="text-xs text-blue-800 font-semibold uppercase tracking-wider mb-2">Sua Chave Atual</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white border border-blue-200 px-3 py-2 rounded text-sm text-gray-800 font-mono break-all">
                  {apiKey}
                </code>
                <button
                  onClick={copyToClipboard}
                  className="bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 p-2 rounded transition-colors"
                  title="Copiar"
                >
                  {copied ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleGenerateKey}
                disabled={isGenerating}
                className="text-sm text-blue-600 border border-blue-200 bg-white hover:bg-blue-50 px-3 py-1.5 rounded inline-flex items-center"
              >
                {isGenerating ? <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1.5" />}
                Regerar Chave
              </button>
              <button
                onClick={handleRevokeKey}
                disabled={isGenerating}
                className="text-sm text-red-600 border border-red-200 bg-white hover:bg-red-50 px-3 py-1.5 rounded inline-flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                Revogar
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold flex items-center mb-4">
          <Code className="w-5 h-5 mr-2 text-gray-500" /> 
          Documentação da API
        </h2>

        <div className="prose prose-sm max-w-none text-gray-600 space-y-6">
          <p>
            Envie matrículas automaticamente para a nossa plataforma. O endpoint espera uma requisição <code className="bg-gray-100 px-1 py-0.5 rounded text-red-600">POST</code> no formato <code className="bg-gray-100 px-1 py-0.5 rounded text-red-600">multipart/form-data</code>.
          </p>

          <div>
            <h3 className="text-gray-900 font-medium">Endpoint</h3>
            <div className="bg-gray-800 text-green-400 p-3 rounded-md font-mono mt-1 overflow-x-auto whitespace-nowrap">
              POST https://fowfxmsduqgwajcpkgiy.supabase.co/functions/v1/api-upload
            </div>
          </div>

          <div>
            <h3 className="text-gray-900 font-medium">Cabeçalhos (Headers)</h3>
            <table className="min-w-full text-left text-sm mt-2 border">
              <thead className="bg-gray-50">
                <tr><th className="p-2 border">Chave</th><th className="p-2 border">Valor</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 border font-mono">Authorization</td>
                  <td className="p-2 border">Bearer &lt;SUA_API_KEY&gt;</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="text-gray-900 font-medium">Parâmetros do Formulário (Form Data)</h3>
            <table className="min-w-full text-left text-sm mt-2 border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 border">Campo</th>
                  <th className="p-2 border">Tipo</th>
                  <th className="p-2 border">Obrigatório</th>
                  <th className="p-2 border">Descrição</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="p-2 border font-mono">student_name</td><td className="p-2 border">Texto</td><td className="p-2 border">Sim</td><td className="p-2 border">Nome completo do aluno</td></tr>
                <tr><td className="p-2 border font-mono">student_cpf</td><td className="p-2 border">Texto</td><td className="p-2 border">Sim</td><td className="p-2 border">CPF (sem formatação ou formatado)</td></tr>
                <tr><td className="p-2 border font-mono">course_type</td><td className="p-2 border">Texto</td><td className="p-2 border">Sim</td><td className="p-2 border">Ex: "Pós Graduação"</td></tr>
                <tr><td className="p-2 border font-mono">course</td><td className="p-2 border">Texto</td><td className="p-2 border">Sim</td><td className="p-2 border">Ex: "Matemática"</td></tr>
                <tr><td className="p-2 border font-mono">start_date</td><td className="p-2 border">Data</td><td className="p-2 border">Não</td><td className="p-2 border">Data de Início (YYYY-MM-DD)</td></tr>
                <tr><td className="p-2 border font-mono">end_date</td><td className="p-2 border">Data</td><td className="p-2 border">Não</td><td className="p-2 border">Data de Conclusão (YYYY-MM-DD)</td></tr>
                <tr><td className="p-2 border font-mono">academic_record</td><td className="p-2 border">JSON String</td><td className="p-2 border">Não</td><td className="p-2 border">Array com as notas. Ex: <code className="bg-gray-100 rounded">[{'{"subject":"Mat", "grade":"10", "professor":"João"}'}]</code></td></tr>
                <tr><td className="p-2 border font-mono">file_cpf</td><td className="p-2 border">File (Binário)</td><td className="p-2 border">Sim</td><td className="p-2 border">Documento PDF do CPF</td></tr>
                <tr><td className="p-2 border font-mono">file_rg</td><td className="p-2 border">File (Binário)</td><td className="p-2 border">Sim</td><td className="p-2 border">Documento PDF do RG</td></tr>
                <tr><td className="p-2 border font-mono">file_...</td><td className="p-2 border">File (Binário)</td><td className="p-2 border">Não</td><td className="p-2 border">Envie todos os documentos exigidos com o prefixo 'file_'</td></tr>
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="text-gray-900 font-medium">Exemplo em cURL</h3>
            <pre className="bg-gray-800 text-gray-200 p-4 rounded-md text-sm overflow-x-auto mt-2">
{`curl -X POST https://fowfxmsduqgwajcpkgiy.supabase.co/functions/v1/api-upload \\
  -H "Authorization: Bearer SUA_API_KEY" \\
  -F "student_name=João da Silva" \\
  -F "student_cpf=123.456.789-00" \\
  -F "course_type=Pós Graduação" \\
  -F "course=Matemática" \\
  -F "file_cpf=@/caminho/para/o/cpf.pdf" \\
  -F "file_rg=@/caminho/para/o/rg.pdf"`}
            </pre>
          </div>

        </div>
      </div>
    </div>
  );
}
