export type RequestStatus = 
  | "Pedido Enviado" 
  | "Recebimento Confirmado" 
  | "Diligência"
  | "Em processo de emissão" 
  | "Documentos Emitidos";

export type CourseType = string;

export interface Partner {
  id: string;
  name: string;
  email?: string;
  affiliation?: string;
  require_payment_proof: boolean;
  authorized_courses: string[];
  is_active?: boolean;
  api_key?: string | null;
}

export interface RequestHistory {
  id: string;
  request_id: string;
  actor_name: string;
  action: string;
  details?: any;
  created_at: string;
}

export interface AcademicRecord {
  subject: string;
  grade: string;
  professor?: string;
}

export interface StudentRequest {
  id: string;
  partner_id: string;
  student_name: string;
  student_cpf: string;
  course_type: CourseType;
  course: string;
  status: RequestStatus;
  created_at: string;
  start_date?: string;
  end_date?: string;
  academic_record?: AcademicRecord[];
  diligence_reason?: string;
  diligence_documents?: string[];
  issued_documents?: {
    diploma?: { id: string, name: string };
    historico?: { id: string, name: string };
    certificado?: { id: string, name: string };
  };
  drive_folder_id?: string;
  partners?: {
    name: string;
  };
}
