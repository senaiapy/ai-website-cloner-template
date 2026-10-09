import { MessageCircle } from "lucide-react";

// TODO: replace with the real support number once confirmed (digits only, country code first).
const WHATSAPP_NUMBER = "5500000000000";
const WHATSAPP_MESSAGE = "Olá! Preciso de ajuda com a plataforma.";

export function WhatsAppButton() {
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-20 right-4 z-50 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#25D366]/50"
    >
      <MessageCircle className="size-7" aria-hidden />
    </a>
  );
}
