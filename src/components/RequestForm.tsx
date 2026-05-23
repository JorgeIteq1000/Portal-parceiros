import React, { useState } from "react";
import { Upload, FileType, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { maskCPF } from "../lib/utils";

import { supabase } from "../lib/supabase";

import { CourseType, Partner } from "../types";

interface RequestFormProps {
  partner: Partner;
}

export default function RequestForm({ partner }: RequestFormProps) {
  const [studentName, setStudentName] = useState("");
  const [studentCpf, setStudentCpf] = useState("");
  const [courseType, setCourseType] = useState<CourseType | "">("");
  const [course, setCourse] = useState("");
  const [availableCourses, setAvailableCourses] = useState<{ id: string, name: string, course_type_id: string, enable_grades: boolean, enable_professors: boolean, subjects: string[] }[]>([]);
  const [courseTypesMap, setCourseTypesMap] = useState<Record<string, string>>({});
  
  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    civilRegistry: null, // Certidão de nascimento/casamento
    identity: null, // RG e CPF
    addressProof: null, // Comprovante de endereço
    previousDegree: null, // Diploma da graduação anterior
    previousTranscript: null, // Histórico da graduação anterior
    highSchoolTranscript: null, // Histórico do ensino médio
    paymentProof: null, // Comprovante de Pagamento
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [academicRecord, setAcademicRecord] = useState<Record<string, { grade: string, professor: string }>>({});

  const handleFileChange = (key: string, file: File | null) => {
    setFiles((prev) => ({ ...prev, [key]: file }));
  };

  React.useEffect(() => {
    async function loadData() {
      const [typesRes, coursesRes] = await Promise.all([
        supabase.from('course_types').select('id, name'),
        supabase.from('courses').select('id, name, course_type_id, enable_grades, enable_professors, subjects')
      ]);

      if (typesRes.data) {
        const map: Record<string, string> = {};
        typesRes.data.forEach(t => map[t.name] = t.id);
        setCourseTypesMap(map);
      }
      if (coursesRes.data) {
        setAvailableCourses(coursesRes.data);
      }
    }
    loadData();
  }, []);

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStudentCpf(maskCPF(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[RequestForm] Iniciando submissão de formulário.");
    setIsSubmitting(true);
    setSubmitStatus(null);

    // Validação básica
    if (!studentName.trim() || studentCpf.length < 14 || !courseType || !course || !startDate || !endDate) {
      console.warn("[RequestForm] Validação local falhou (nome, CPF, curso ou datas incompletas).");
      setSubmitStatus({ type: "error", message: "Por favor, preencha todos os campos obrigatórios." });
      setIsSubmitting(false);
      return;
    }

    const selectedCourseObj = availableCourses.find(c => c.name === course && c.course_type_id === courseTypesMap[courseType]);

    if (selectedCourseObj?.enable_grades) {
      for (const subject of selectedCourseObj.subjects) {
        const record = academicRecord[subject];
        if (!record?.grade) {
          setSubmitStatus({ type: "error", message: `Por favor, preencha a nota da disciplina: ${subject}` });
          setIsSubmitting(false);
          return;
        }
        if (selectedCourseObj.enable_professors && !record?.professor?.trim()) {
          setSubmitStatus({ type: "error", message: `Por favor, informe o nome do professor da disciplina: ${subject}` });
          setIsSubmitting(false);
          return;
        }
      }
    }

    const formData = new FormData();
    formData.append("student_name", studentName);
    formData.append("student_cpf", studentCpf);
    formData.append("course_type", courseType);
    formData.append("course", course);
    formData.append("partner_id", partner.id);
    formData.append("start_date", startDate);
    formData.append("end_date", endDate);

    if (selectedCourseObj?.enable_grades) {
      const recordArray = selectedCourseObj.subjects.map(sub => ({
        subject: sub,
        grade: academicRecord[sub]?.grade || "",
        professor: selectedCourseObj.enable_professors ? (academicRecord[sub]?.professor || "") : undefined
      }));
      formData.append("academic_record", JSON.stringify(recordArray));
    }

    // Anexa arquivos. Pula o comprovante de pagamento se não for obrigatório e não foi anexado.
    for (const [key, file] of Object.entries(files)) {
      if (file) {
        // Nome padronizado para o back-end processar
        formData.append(`file_${key}`, file, file.name);
      } else {
        if (key === "paymentProof" && !partner.require_payment_proof) continue;
        console.warn(`[RequestForm] Documento ausente: ${key}`);
        setSubmitStatus({ type: "error", message: "Todos os documentos obrigatórios devem ser anexados." });
        setIsSubmitting(false);
        return;
      }
    }

    try {
      console.log(`[RequestForm] Enviando payload via FormData para /api/upload... (Total de chaves no form: ${Array.from(formData.keys()).length})`);
      
      const { data, error } = await supabase.functions.invoke('api-upload', {
        body: formData
      });

      if (error) {
        throw new Error(error.message || "Erro no servidor ao processar o envio.");
      }

      if (!data?.success) {
        throw new Error(data?.error || "Falha ao enviar os dados.");
      }

      console.log("[RequestForm] Upload concluído com sucesso:", data);
      
      setSubmitStatus({ type: "success", message: "Solicitação enviada com sucesso! Você pode acompanhar pelo painel." });
      // Resetar form (opcional)
      setStudentName("");
      setStudentCpf("");
      setCourseType("");
      setCourse("");
      setStartDate("");
      setEndDate("");
      setAcademicRecord({});
      setFiles({
        civilRegistry: null, identity: null, addressProof: null,
        previousDegree: null, previousTranscript: null, highSchoolTranscript: null, paymentProof: null,
      });

    } catch (error) {
      console.error("[RequestForm] Exceção capturada no catch:", error);
      setSubmitStatus({ type: "error", message: error instanceof Error ? error.message : "Ocorreu um erro desconhecido ao enviar." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fileInputConfig = [
    { key: "civilRegistry", label: "Certidão de Nascimento/Casamento (PDF)", required: true },
    { key: "identity", label: "RG e CPF (PDF)", required: true },
    { key: "addressProof", label: "Comprovante de Endereço (PDF)", required: true },
    { key: "previousDegree", label: "Diploma da Graduação Anterior (PDF)", required: true },
    { key: "previousTranscript", label: "Histórico da Graduação Anterior (PDF)", required: true },
    { key: "highSchoolTranscript", label: "Histórico do Ensino Médio (PDF)", required: true },
  ];

  if (partner.require_payment_proof) {
    fileInputConfig.push({ key: "paymentProof", label: "Comprovante de Pagamento (PDF)", required: true });
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900">Nova Solicitação de Emissão</h2>
        <p className="text-gray-500 mt-1">
          Preencha os dados do aluno e anexe todos os documentos em formato PDF.
        </p>
      </div>

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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label htmlFor="studentName" className="block text-sm font-medium text-gray-700">
              Nome Completo do Aluno <span className="text-red-500">*</span>
            </label>
            <input
              id="studentName"
              type="text"
              required
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              placeholder="Ex: João da Silva"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="studentCpf" className="block text-sm font-medium text-gray-700">
              CPF do Aluno <span className="text-red-500">*</span>
            </label>
            <input
              id="studentCpf"
              type="text"
              required
              maxLength={14}
              value={studentCpf}
              onChange={handleCpfChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              placeholder="000.000.000-00"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="courseType" className="block text-sm font-medium text-gray-700">
              Tipo de Curso <span className="text-red-500">*</span>
            </label>
            <select
              id="courseType"
              required
              value={courseType}
              onChange={(e) => {
                setCourseType(e.target.value);
                setCourse(""); // Limpa o curso ao trocar o tipo
              }}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            >
              <option value="" disabled>Selecione um tipo...</option>
              {partner.authorized_courses?.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="course" className="block text-sm font-medium text-gray-700">
              Curso <span className="text-red-500">*</span>
            </label>
            <select
              id="course"
              required
              disabled={!courseType}
              value={course}
              onChange={(e) => {
                setCourse(e.target.value);
                setAcademicRecord({}); // Limpa as notas ao trocar o curso
              }}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:text-gray-500"
            >
              <option value="" disabled>Selecione um curso...</option>
              {courseType && availableCourses
                .filter(c => c.course_type_id === courseTypesMap[courseType])
                .map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
              Data de Início <span className="text-red-500">*</span>
            </label>
            <input
              id="startDate"
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
              Data de Conclusão <span className="text-red-500">*</span>
            </label>
            <input
              id="endDate"
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            />
          </div>
        </div>

        {/* Grade Curricular Dinâmica */}
        {(() => {
          const selectedCourseObj = availableCourses.find(c => c.name === course && c.course_type_id === courseTypesMap[courseType]);
          if (!selectedCourseObj?.enable_grades || !selectedCourseObj.subjects || selectedCourseObj.subjects.length === 0) return null;

          return (
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Grade Curricular</h3>
              <p className="text-sm text-gray-500 mb-4">Preencha as notas e professores (se aplicável) de cada disciplina.</p>
              
              <div className="space-y-3">
                {selectedCourseObj.subjects.map(subject => (
                  <div key={subject} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-gray-50 p-3 rounded-md border border-gray-100">
                    <div className="md:col-span-4 font-medium text-sm text-gray-700 break-words">
                      {subject}
                    </div>
                    
                    <div className="md:col-span-2">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        placeholder="Nota"
                        required
                        className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                        value={academicRecord[subject]?.grade || ""}
                        onChange={(e) => setAcademicRecord(prev => ({
                          ...prev,
                          [subject]: { ...prev[subject], grade: e.target.value }
                        }))}
                      />
                    </div>

                    {selectedCourseObj.enable_professors && (
                      <div className="md:col-span-6">
                        <input
                          type="text"
                          placeholder="Nome do Professor"
                          required
                          className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                          value={academicRecord[subject]?.professor || ""}
                          onChange={(e) => setAcademicRecord(prev => ({
                            ...prev,
                            [subject]: { ...prev[subject], professor: e.target.value }
                          }))}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        <div className="pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Documentação (Upload)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fileInputConfig.map((config) => (
              <div key={config.key} className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {config.label}
                  {config.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${
                  files[config.key] ? "border-blue-300 bg-blue-50" : "border-gray-300 hover:bg-gray-50"
                }`}>
                  <div className="space-y-1 text-center">
                    {files[config.key] ? (
                      <FileType className="mx-auto h-8 w-8 text-blue-500" />
                    ) : (
                      <Upload className="mx-auto h-8 w-8 text-gray-400" />
                    )}
                    
                    <div className="flex text-sm text-gray-600 justify-center">
                      <label htmlFor={`file-upload-${config.key}`} className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                        <span>{files[config.key] ? "Trocar arquivo" : "Fazer upload"}</span>
                        <input
                          id={`file-upload-${config.key}`}
                          name={`file-upload-${config.key}`}
                          type="file"
                          accept=".pdf"
                          className="sr-only"
                          onChange={(e) => handleFileChange(config.key, e.target.files?.[0] || null)}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 truncate w-32 mx-auto">
                      {files[config.key] ? files[config.key]?.name : "Apenas PDF até 10MB"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex justify-center items-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              "Enviar Solicitação"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
