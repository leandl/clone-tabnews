// Representa emails no formato <email@dominio>
export type MailAddress = `<${string}>`;

export interface MailcatcherMessage {
  id: number;
  sender: MailAddress;
  recipients: MailAddress[];
  subject: string;
  size: string; // vem como string da API
  created_at: string; // ISO 8601
}
