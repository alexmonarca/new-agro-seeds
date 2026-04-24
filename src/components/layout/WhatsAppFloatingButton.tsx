import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "5555996194261";

export default function WhatsAppFloatingButton() {
  const href = `https://wa.me/${WHATSAPP_NUMBER}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chame no WhatsApp"
      className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-full border border-border bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
    >
      <MessageCircle className="h-5 w-5" aria-hidden="true" />
      <span>Chame no WhatsApp</span>
    </a>
  );
}