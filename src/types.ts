export type RequestStatus = 
  | "Pedido Enviado" 
  | "Recebimento Confirmado" 
  | "Diligência"
  | "Em processo de emissão" 
  | "Documentos Emitidos";

export type CourseType = "2ª Licenciatura" | "Pós Graduação";

export interface Partner {
  id: string;
  name: string;
  require_payment_proof: boolean;
  authorized_courses: CourseType[];
}

export interface StudentRequest {
  id: string;
  partner_id: string;
  student_name: string;
  student_cpf: string;
  course_type: CourseType;
  status: RequestStatus;
  created_at: string;
}
