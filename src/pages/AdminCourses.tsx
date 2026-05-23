import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BookOpen, Layers, Plus, Trash2, Loader2, AlertCircle, Edit2 } from 'lucide-react';

interface CourseType {
  id: string;
  name: string;
}

interface Course {
  id: string;
  course_type_id: string;
  name: string;
  enable_grades?: boolean;
  enable_professors?: boolean;
  subjects?: string[];
}

export default function AdminCourses() {
  const [courseTypes, setCourseTypes] = useState<CourseType[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [newTypeName, setNewTypeName] = useState("");
  const [newCourseName, setNewCourseName] = useState("");
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [isSubmittingType, setIsSubmittingType] = useState(false);
  const [isSubmittingCourse, setIsSubmittingCourse] = useState(false);

  // Novos estados para Grade e Professores
  const [enableGrades, setEnableGrades] = useState(false);
  const [enableProfessors, setEnableProfessors] = useState(false);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [newSubject, setNewSubject] = useState("");

  // Edit states
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editCourseName, setEditCourseName] = useState("");
  const [editSelectedTypeId, setEditSelectedTypeId] = useState("");
  const [editEnableGrades, setEditEnableGrades] = useState(false);
  const [editEnableProfessors, setEditEnableProfessors] = useState(false);
  const [editSubjects, setEditSubjects] = useState<string[]>([]);
  const [editNewSubject, setEditNewSubject] = useState("");
  const [isUpdatingCourse, setIsUpdatingCourse] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const [typesRes, coursesRes] = await Promise.all([
        supabase.from('course_types').select('*').order('name'),
        supabase.from('courses').select('*').order('name')
      ]);

      if (typesRes.error) throw typesRes.error;
      if (coursesRes.error) throw coursesRes.error;

      setCourseTypes(typesRes.data || []);
      setCourses(coursesRes.data || []);
    } catch (err: any) {
      console.error(err);
      setError("Erro ao carregar dados. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const handleAddType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;
    setIsSubmittingType(true);

    try {
      const { data, error } = await supabase
        .from('course_types')
        .insert([{ name: newTypeName }])
        .select()
        .single();

      if (error) throw error;
      setCourseTypes([...courseTypes, data]);
      setNewTypeName("");
    } catch (err: any) {
      alert("Erro ao adicionar tipo de curso: " + err.message);
    } finally {
      setIsSubmittingType(false);
    }
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseName.trim() || !selectedTypeId) return;
    setIsSubmittingCourse(true);

    try {
      const { data, error } = await supabase
        .from('courses')
        .insert([{ 
          name: newCourseName, 
          course_type_id: selectedTypeId,
          enable_grades: enableGrades,
          enable_professors: enableProfessors,
          subjects: enableGrades ? subjects : []
        }])
        .select()
        .single();

      if (error) throw error;
      setCourses([...courses, data]);
      setNewCourseName("");
      setEnableGrades(false);
      setEnableProfessors(false);
      setSubjects([]);
      setNewSubject("");
    } catch (err: any) {
      alert("Erro ao adicionar curso: " + err.message);
    } finally {
      setIsSubmittingCourse(false);
    }
  };

  const handleEditCourseClick = (course: Course) => {
    setEditingCourse(course);
    setEditCourseName(course.name);
    setEditSelectedTypeId(course.course_type_id);
    setEditEnableGrades(course.enable_grades || false);
    setEditEnableProfessors(course.enable_professors || false);
    setEditSubjects(course.subjects || []);
    setEditNewSubject("");
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse || !editCourseName.trim() || !editSelectedTypeId) return;
    setIsUpdatingCourse(true);

    try {
      const { data, error } = await supabase
        .from('courses')
        .update({ 
          name: editCourseName, 
          course_type_id: editSelectedTypeId,
          enable_grades: editEnableGrades,
          enable_professors: editEnableProfessors,
          subjects: editEnableGrades ? editSubjects : []
        })
        .eq('id', editingCourse.id)
        .select()
        .single();

      if (error) throw error;
      setCourses(courses.map(c => c.id === editingCourse.id ? data : c));
      setEditingCourse(null);
    } catch (err: any) {
      alert("Erro ao atualizar curso: " + err.message);
    } finally {
      setIsUpdatingCourse(false);
    }
  };

  const handleDeleteType = async (id: string) => {
    if (!confirm("Tem certeza? Isso apagará também todos os cursos vinculados a este tipo.")) return;
    try {
      const { error } = await supabase.from('course_types').delete().eq('id', id);
      if (error) throw error;
      setCourseTypes(courseTypes.filter(t => t.id !== id));
      setCourses(courses.filter(c => c.course_type_id !== id));
    } catch (err: any) {
      alert("Erro ao apagar: " + err.message);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm("Tem certeza?")) return;
    try {
      const { error } = await supabase.from('courses').delete().eq('id', id);
      if (error) throw error;
      setCourses(courses.filter(c => c.id !== id));
    } catch (err: any) {
      alert("Erro ao apagar: " + err.message);
    }
  };

  if (loading) {
    return <div className="p-8 text-center"><Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <BookOpen className="w-6 h-6 mr-3 text-blue-600" />
          Gestão de Cursos
        </h1>
        <p className="text-sm text-gray-500 mt-1 pl-9">
          Cadastre os tipos de certificação e os cursos disponíveis no sistema.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-md flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-2" />
          <span className="text-sm text-red-800">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Lado Esquerdo: Tipos de Cursos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold flex items-center mb-4">
            <Layers className="w-5 h-5 mr-2 text-gray-500" /> Tipos de Cursos
          </h2>
          
          <form onSubmit={handleAddType} className="flex gap-2 mb-6">
            <input 
              type="text" 
              placeholder="Ex: Pós Graduação" 
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
            />
            <button 
              type="submit" 
              disabled={isSubmittingType || !newTypeName.trim()}
              className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {isSubmittingType ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </button>
          </form>

          <div className="space-y-2">
            {courseTypes.length === 0 ? (
               <p className="text-sm text-gray-500 text-center py-4">Nenhum tipo cadastrado.</p>
            ) : (
               courseTypes.map(type => (
                 <div key={type.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-100">
                    <span className="text-sm font-medium text-gray-800">{type.name}</span>
                    <button onClick={() => handleDeleteType(type.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
               ))
            )}
          </div>
        </div>

        {/* Lado Direito: Cursos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold flex items-center mb-4">
            <BookOpen className="w-5 h-5 mr-2 text-gray-500" /> Cursos
          </h2>
          
          <form onSubmit={handleAddCourse} className="flex flex-col gap-3 mb-6 bg-gray-50 p-4 rounded-md border border-gray-100">
            <select 
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
              value={selectedTypeId}
              onChange={(e) => setSelectedTypeId(e.target.value)}
            >
              <option value="" disabled>Selecione um Tipo...</option>
              {courseTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            
            <input 
              type="text" 
              placeholder="Nome do Curso (Ex: Pedagogia)" 
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              value={newCourseName}
              onChange={(e) => setNewCourseName(e.target.value)}
            />

            <div className="flex gap-4 mt-1">
              <label className="flex items-center text-sm text-gray-700 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="mr-2 rounded text-blue-600 focus:ring-blue-500"
                  checked={enableGrades}
                  onChange={(e) => {
                    setEnableGrades(e.target.checked);
                    if (!e.target.checked) setEnableProfessors(false);
                  }}
                />
                Habilitar Grade
              </label>
              
              {enableGrades && (
                <label className="flex items-center text-sm text-gray-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="mr-2 rounded text-blue-600 focus:ring-blue-500"
                    checked={enableProfessors}
                    onChange={(e) => setEnableProfessors(e.target.checked)}
                  />
                  Habilitar Professores
                </label>
              )}
            </div>

            {enableGrades && (
              <div className="mt-2 border-t border-gray-200 pt-3">
                <p className="text-xs font-semibold text-gray-600 mb-2 uppercase">Disciplinas do Curso</p>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Nome da disciplina"
                    className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newSubject.trim() && !subjects.includes(newSubject.trim())) {
                          setSubjects([...subjects, newSubject.trim()]);
                          setNewSubject("");
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newSubject.trim() && !subjects.includes(newSubject.trim())) {
                        setSubjects([...subjects, newSubject.trim()]);
                        setNewSubject("");
                      }
                    }}
                    className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-sm hover:bg-gray-300 transition-colors"
                  >
                    Adicionar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {subjects.length === 0 && <span className="text-xs text-gray-400">Nenhuma disciplina adicionada.</span>}
                  {subjects.map((sub, idx) => (
                    <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center">
                      {sub}
                      <button type="button" className="ml-1.5 text-blue-600 hover:text-blue-900 font-bold" onClick={() => setSubjects(subjects.filter((_, i) => i !== idx))}>
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isSubmittingCourse || !newCourseName.trim() || !selectedTypeId || (enableGrades && subjects.length === 0)}
              className="mt-2 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center transition-colors"
            >
              {isSubmittingCourse ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Adicionar Curso
            </button>
          </form>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {courses.length === 0 ? (
               <p className="text-sm text-gray-500 text-center py-4">Nenhum curso cadastrado.</p>
            ) : (
               courses.map(course => {
                 const typeName = courseTypes.find(t => t.id === course.course_type_id)?.name || 'Desconhecido';
                 return (
                   <div key={course.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-100">
                      <div>
                        <div className="text-sm font-medium text-gray-800">{course.name}</div>
                        <div className="text-xs text-gray-500">{typeName}</div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => handleEditCourseClick(course)} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded-md transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteCourse(course.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                   </div>
                 );
               })
            )}
          </div>
        </div>

      </div>

      {/* Modal de Edição de Curso */}
      {editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setEditingCourse(null)}></div>
          <div className="bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:max-w-lg w-full relative z-10">
              <form onSubmit={handleUpdateCourse}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Editar Curso: <span className="text-blue-600">{editingCourse.name}</span>
                  </h3>
                  
                  <div className="space-y-4">
                    <select 
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                      value={editSelectedTypeId}
                      onChange={(e) => setEditSelectedTypeId(e.target.value)}
                    >
                      <option value="" disabled>Selecione um Tipo...</option>
                      {courseTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    
                    <input 
                      type="text" 
                      placeholder="Nome do Curso" 
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                      value={editCourseName}
                      onChange={(e) => setEditCourseName(e.target.value)}
                    />

                    <div className="flex gap-4 mt-2">
                      <label className="flex items-center text-sm text-gray-700 cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="mr-2 rounded text-blue-600 focus:ring-blue-500"
                          checked={editEnableGrades}
                          onChange={(e) => {
                            setEditEnableGrades(e.target.checked);
                            if (!e.target.checked) setEditEnableProfessors(false);
                          }}
                        />
                        Habilitar Grade
                      </label>
                      
                      {editEnableGrades && (
                        <label className="flex items-center text-sm text-gray-700 cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="mr-2 rounded text-blue-600 focus:ring-blue-500"
                            checked={editEnableProfessors}
                            onChange={(e) => setEditEnableProfessors(e.target.checked)}
                          />
                          Habilitar Professores
                        </label>
                      )}
                    </div>

                    {editEnableGrades && (
                      <div className="mt-2 border-t border-gray-200 pt-3">
                        <p className="text-xs font-semibold text-gray-600 mb-2 uppercase">Disciplinas do Curso</p>
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            placeholder="Nome da disciplina"
                            className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none"
                            value={editNewSubject}
                            onChange={(e) => setEditNewSubject(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (editNewSubject.trim() && !editSubjects.includes(editNewSubject.trim())) {
                                  setEditSubjects([...editSubjects, editNewSubject.trim()]);
                                  setEditNewSubject("");
                                }
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (editNewSubject.trim() && !editSubjects.includes(editNewSubject.trim())) {
                                setEditSubjects([...editSubjects, editNewSubject.trim()]);
                                setEditNewSubject("");
                              }
                            }}
                            className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-sm hover:bg-gray-300 transition-colors"
                          >
                            Adicionar
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                          {editSubjects.length === 0 && <span className="text-xs text-gray-400">Nenhuma disciplina adicionada.</span>}
                          {editSubjects.map((sub, idx) => (
                            <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center">
                              {sub}
                              <button type="button" className="ml-1.5 text-blue-600 hover:text-blue-900 font-bold" onClick={() => setEditSubjects(editSubjects.filter((_, i) => i !== idx))}>
                                &times;
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={isUpdatingCourse || !editCourseName.trim() || !editSelectedTypeId || (editEnableGrades && editSubjects.length === 0)}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {isUpdatingCourse ? "Salvando..." : "Salvar Alterações"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingCourse(null)}
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
