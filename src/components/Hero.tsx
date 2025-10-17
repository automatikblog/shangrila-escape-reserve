import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import heroImage from "@/assets/hero-pool.jpg";

const Hero = () => {
  const scrollToReservation = () => {
    document.getElementById("reservas")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-secondary/90" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center text-white">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
          Clube de Lazer Shangrilá
        </h1>
        <p className="text-xl md:text-3xl mb-8 max-w-3xl mx-auto font-light opacity-95">
          Diversão, lazer e boa comida em um só lugar
        </p>
        <Button 
          size="lg" 
          onClick={scrollToReservation}
          className="bg-white text-primary hover:bg-white/90 font-semibold text-lg px-8 py-6 rounded-full shadow-xl hover:scale-105 transition-all duration-300"
        >
          Reserve sua mesa agora
        </Button>
      </div>

      {/* Scroll Indicator */}
      <button
        onClick={scrollToReservation}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white animate-bounce cursor-pointer hover:scale-110 transition-transform"
        aria-label="Scroll para reservas"
      >
        <ChevronDown size={40} />
      </button>
    </section>
  );
};

export default Hero;
