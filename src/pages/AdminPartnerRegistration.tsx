import React, { useState, useEffect } from "react";
import { CourseType } from "../types";
import { Building, CheckCircle, AlertCircle, Loader2, Save } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function AdminPartnerRegistration() {
  const [name, setName] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [partnerPassword, setPartnerPassword] = useState("");
  const [requirePaymentProof, setRequirePaymentProof] = useState(false);
  const [affiliation, setAffiliation] = useState("");
  const [authorizedCourses, setAuthorizedCourses] = useState<CourseType[]>([]);
  const [availableCourses, setAvailableCourses] = useState<CourseType[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    async function loadCourses() {
      const { data, error } = await supabase.from('course_types').select('name').order('name');
      if (data && !error) {
        setAvailableCourses(data.map(c => c.name));
      }
    }
    loadCourses();
  }, []);

  const handleCourseToggle = (course: CourseType) => {
    setAuthorizedCourses((prev) =>
      prev.includes(course)
        ? prev.filter((c) => c !== course)
        : [...prev, course]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);
    console.log("[AdminPartnerRegistration] Tentativa de cadastro iniciada.");

    if (!name.trim() || !partnerEmail.trim() || !partnerPassword.trim()) {
      setSubmitStatus({ type: "error", message: "Nome, e-mail e senha são obrigatórios." });
      setIsSubmitting(false);
      return;
    }

    if (authorizedCourses.length === 0) {
      setSubmitStatus({ type: "error", message: "Selecione pelo menos um curso autorizado para este parceiro." });
      setIsSubmitting(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('api-partners', {
        body: {
          name,
          email: partnerEmail,
          password: partnerPassword,
          affiliation,
          require_payment_proof: requirePaymentProof,
          authorized_courses: authorizedCourses
        }
      });

      if (error) {
        throw new Error(error.message || "Erro ao cadastrar");
      }
      
      if (!data?.success) {
        throw new Error(data?.error || "Erro ao cadastrar");
      }
      
      console.log("[AdminPartnerRegistration] Parceiro cadastrado com sucesso!");
      setSubmitStatus({ type: "success", message: `Parceiro cadastrado com sucesso!` });
      
      // Reset do formulário
      setName("");
      setPartnerEmail("");
      setPartnerPassword("");
      setAffiliation("");
      setRequirePaymentProof(false);
      setAuthorizedCourses([]);
    } catch (error) {
      console.error("[AdminPartnerRegistration] Erro ao cadastrar:", error);
      setSubmitStatus({ type: "error", message: error instanceof Error ? error.message : "Ocorreu um erro ao cadastrar o parceiro." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Building className="w-6 h-6 mr-3 text-blue-600" />
            Cadastrar Novo Parceiro
          </h1>
          <p className="text-sm text-gray-500 mt-1 pl-9">
            Registre uma nova instituição parceira e configure as regras de certificação.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
        {submitStatus && (
          <div className={`mb-6 p-4 rounded-md flex items-start gap-3 ${
            submitStatus.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
          }`}>
            {submitStatus.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            )}
            <p className="text-sm font-medium">{submitStatus.message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Informações Básicas */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Informações Básicas</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nome da Instituição / Polo <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  placeholder="Ex: Polo Unisul São Paulo"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    E-mail de Acesso <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={partnerEmail}
                    onChange={(e) => setPartnerEmail(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    placeholder="parceiro@exemplo.com"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Senha Provisória <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={partnerPassword}
                    onChange={(e) => setPartnerPassword(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    placeholder="Senha para o parceiro"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="affiliation" className="block text-sm font-medium text-gray-700">
                  Parceria com <span className="text-red-500">*</span>
                </label>
                <select
                  id="affiliation"
                  required
                  value={affiliation}
                  onChange={(e) => setAffiliation(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  <option value="" disabled>Selecione a Faculdade</option>
                  <option value="Faculdade do Estado de São Paulo">Faculdade do Estado de São Paulo</option>
                  <option value="Faculdade Alpha Channel">Faculdade Alpha Channel</option>
                  <option value="Faculdade UCEESP">Faculdade UCEESP</option>
                  <option value="Faculdade ITEQ">Faculdade ITEQ</option>
                </select>
              </div>

              <div className="flex items-center pt-2">
                <input
                  id="requirePayment"
                  type="checkbox"
                  checked={requirePaymentProof}
                  onChange={(e) => setRequirePaymentProof(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="requirePayment" className="ml-2 block text-sm text-gray-900">
                  Exigir Comprovante de Pagamento
                </label>
              </div>
              <p className="text-xs text-gray-500 ml-6">
                Marque se este parceiro for obrigado a anexar um PDF de comprovante de pagamento ao solicitar uma certificação.
              </p>
            </div>
          </div>

          {/* Cursos Autorizados */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Cursos Autorizados</h3>
            <p className="text-sm text-gray-600 mb-4">
              Selecione os tipos de certificações que este parceiro poderá solicitar:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {availableCourses.length === 0 ? (
                <p className="text-sm text-gray-500 col-span-2">Nenhum tipo de curso cadastrado no sistema. Por favor, cadastre em "Gestão de Cursos" primeiro.</p>
              ) : availableCourses.map((course) => (
                <div
                  key={course}
                  onClick={() => handleCourseToggle(course)}
                  className={`
                    cursor-pointer flex items-center justify-between p-4 rounded-lg border-2 transition-colors
                    ${authorizedCourses.includes(course) ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300 bg-white"}
                  `}
                >
                  <span className={`font-medium ${authorizedCourses.includes(course) ? "text-blue-700" : "text-gray-700"}`}>
                    {course}
                  </span>
                  {authorizedCourses.includes(course) && (
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center items-center py-2.5 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Cadastrar Parceiro
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
