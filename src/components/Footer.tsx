import { Facebook, Instagram, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-secondary text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Logo and Description */}
          <div>
            <h3 className="text-2xl font-bold mb-3">
              Clube de Lazer Shangrilá
            </h3>
            <p className="text-white/80">
              Seu refúgio familiar com piscina, natureza e quiosques para churrasco — no sistema Day Use
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-3">Links Rápidos</h4>
            <ul className="space-y-2">
              <li>
                <a href="#reservas" className="text-white/80 hover:text-white transition-colors">
                  Reservas
                </a>
              </li>
              <li>
                <a href="#sobre" className="text-white/80 hover:text-white transition-colors">
                  Sobre
                </a>
              </li>
              <li>
                <a href="#precos" className="text-white/80 hover:text-white transition-colors">
                  Preços
                </a>
              </li>
              <li>
                <a href="#contato" className="text-white/80 hover:text-white transition-colors">
                  Contato
                </a>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h4 className="text-lg font-semibold mb-3">Redes Sociais</h4>
            <div className="flex gap-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="mailto:contato@clubeshangrila.com.br"
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/20 pt-8 text-center text-white/70">
          <p>© {new Date().getFullYear()} Clube de Lazer Shangrilá. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
