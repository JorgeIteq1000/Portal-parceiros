import React, { useState } from "react";
import { CourseType } from "../types";
import { Building, CheckCircle, AlertCircle, Loader2, Save } from "lucide-react";

export default function AdminPartnerRegistration() {
  const [name, setName] = useState("");
  const [requirePaymentProof, setRequirePaymentProof] = useState(false);
  const [authorizedCourses, setAuthorizedCourses] = useState<CourseType[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const AVAILABLE_COURSES: CourseType[] = ["2ª Licenciatura", "Pós Graduação"];

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

    if (!name.trim()) {
      setSubmitStatus({ type: "error", message: "O nome do parceiro é obrigatório." });
      setIsSubmitting(false);
      return;
    }

    if (authorizedCourses.length === 0) {
      setSubmitStatus({ type: "error", message: "Selecione pelo menos um curso autorizado para este parceiro." });
      setIsSubmitting(false);
      return;
    }

    try {
      // Simulação de chamada de API para salvar no Supabase
      console.log("[AdminPartnerRegistration] Salvando no banco de dados...", {
        name,
        requirePaymentProof,
        authorizedCourses,
      });
      await new Promise((resolve) => setTimeout(resolve, 800)); // Simulando delay
      
      console.log("[AdminPartnerRegistration] Parceiro cadastrado com sucesso!");
      setSubmitStatus({ type: "success", message: "Parceiro cadastrado com sucesso!" });
      
      // Reset do formulário
      setName("");
      setRequirePaymentProof(false);
      setAuthorizedCourses([]);
    } catch (error) {
      console.error("[AdminPartnerRegistration] Erro ao cadastrar:", error);
      setSubmitStatus({ type: "error", message: "Ocorreu um erro ao cadastrar o parceiro. Tente novamente." });
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
              {AVAILABLE_COURSES.map((course) => (
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
