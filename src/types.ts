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
  require_payment_proof: boolean;
  authorized_courses: CourseType[];
  is_active: boolean;
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
  partners?: {
    name: string;
  };
}
