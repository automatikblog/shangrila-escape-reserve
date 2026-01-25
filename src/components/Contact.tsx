import { MapPin, Phone, MessageCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const Contact = () => {
  const whatsappLink = "https://wa.me/5511917248967?text=Ol%C3%A1%21+Gostaria+de+mais+informa%C3%A7%C3%B5es+sobre+o+Clube+de+Lazer+Shangril%C3%A1.";

  return (
    <section id="contato" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Localização e Contato
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Venha nos visitar ou entre em contato
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Map */}
          <div className="rounded-xl overflow-hidden shadow-lg h-[400px]">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3652.8969428558634!2d-46.70518!3d-23.71889!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce4f7a3f3f3f3f%3A0x3f3f3f3f3f3f3f3f!2sAv.%20Dona%20Belmira%20Marin%2C%205383%20-%20Shangril%C3%A1%2C%20S%C3%A3o%20Paulo%20-%20SP%2C%2004852-010!5e0!3m2!1spt-BR!2sbr!4v1234567890123"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Localização Clube Shangrilá"
            />
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <div className="flex items-start gap-4 p-4 bg-card rounded-lg shadow hover:shadow-md transition-shadow">
              <MapPin className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-1">Endereço</h3>
                <p className="text-muted-foreground">
                  Av. Dona Belmira Marin, 5383 - Shangrilá<br />
                  São Paulo - SP, 04852-010
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-card rounded-lg shadow hover:shadow-md transition-shadow">
              <Phone className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-1">WhatsApp</h3>
                <p className="text-muted-foreground">
                  (11) 91724-8967
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-card rounded-lg shadow hover:shadow-md transition-shadow">
              <Clock className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-1">Horário de Funcionamento</h3>
                <p className="text-muted-foreground">
                  Sextas, Sábados, Domingos e Feriados<br />
                  Das 10h às 18h
                </p>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold py-6 text-lg gap-2"
              onClick={() => window.open(whatsappLink, '_blank')}
            >
              <MessageCircle className="w-5 h-5" />
              Fale Conosco pelo WhatsApp
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
