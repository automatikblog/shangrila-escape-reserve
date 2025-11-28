import { useState, useEffect } from "react";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // altura do menu fixo
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/95 backdrop-blur-md shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="text-xl md:text-2xl font-bold text-primary hover:scale-105 transition-transform"
          >
            Shangrilá
          </button>

          {/* Menu Items */}
          <div className="flex items-center gap-2 md:gap-6">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="text-sm md:text-base font-medium text-foreground hover:text-primary transition-colors px-2 md:px-3 py-2"
            >
              Início
            </button>
            <button
              onClick={() => scrollToSection("reservas")}
              className="text-sm md:text-base font-medium text-foreground hover:text-primary transition-colors px-2 md:px-3 py-2"
            >
              Reservas
            </button>
            <button
              onClick={() => scrollToSection("precos")}
              className="text-sm md:text-base font-medium text-foreground hover:text-primary transition-colors px-2 md:px-3 py-2"
            >
              Preços
            </button>
            <button
              onClick={() => scrollToSection("instalacoes")}
              className="text-sm md:text-base font-medium text-foreground hover:text-primary transition-colors px-2 md:px-3 py-2"
            >
              Instalações
            </button>
            <button
              onClick={() => scrollToSection("contato")}
              className="text-sm md:text-base font-medium text-foreground hover:text-primary transition-colors px-2 md:px-3 py-2"
            >
              Contato
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
