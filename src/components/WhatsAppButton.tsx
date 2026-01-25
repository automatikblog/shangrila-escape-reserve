import { MessageCircle } from "lucide-react";

const WhatsAppButton = () => {
  const whatsappNumber = "5511917248967";
  const message = "Olá! Gostaria de mais informações sobre o Clube Shangrilá.";
  
  const handleClick = () => {
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-full p-4 shadow-xl hover:scale-110 transition-all duration-300 animate-fade-in group"
      aria-label="Contato via WhatsApp"
    >
      <MessageCircle size={28} className="group-hover:rotate-12 transition-transform duration-300" />
      <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-background text-foreground px-3 py-2 rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-medium">
        Fale conosco no WhatsApp
      </span>
    </button>
  );
};

export default WhatsAppButton;
