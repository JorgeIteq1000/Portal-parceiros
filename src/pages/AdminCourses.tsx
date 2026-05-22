import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BookOpen, Layers, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';

interface CourseType {
  id: string;
  name: string;
}

interface Course {
  id: string;
  course_type_id: string;
  name: string;
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
        .insert([{ name: newCourseName, course_type_id: selectedTypeId }])
        .select()
        .single();

      if (error) throw error;
      setCourses([...courses, data]);
      setNewCourseName("");
    } catch (err: any) {
      alert("Erro ao adicionar curso: " + err.message);
    } finally {
      setIsSubmittingCourse(false);
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
          
          <form onSubmit={handleAddCourse} className="flex flex-col gap-3 mb-6">
            <select 
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              value={selectedTypeId}
              onChange={(e) => setSelectedTypeId(e.target.value)}
            >
              <option value="" disabled>Selecione um Tipo...</option>
              {courseTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Ex: Pedagogia" 
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
              />
              <button 
                type="submit" 
                disabled={isSubmittingCourse || !newCourseName.trim() || !selectedTypeId}
                className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {isSubmittingCourse ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              </button>
            </div>
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
                      <button onClick={() => handleDeleteCourse(course.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                 );
               })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
