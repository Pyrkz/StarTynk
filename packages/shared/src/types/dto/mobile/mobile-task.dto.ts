export interface MobileTaskDTO {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string;
  assigneeId?: string;
  assigneeName?: string;
}