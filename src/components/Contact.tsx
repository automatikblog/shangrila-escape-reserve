import { MapPin, Phone, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const Contact = () => {
  const whatsappNumber = "5511999999999"; // Replace with actual number
  const whatsappMessage = encodeURIComponent("Olá! Gostaria de mais informações sobre o Clube Shangrilá.");

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
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.1971755372437!2d-46.65842908502262!3d-23.561414084682943!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce59c8da0aa315%3A0xd59f9431f2c9776a!2sS%C3%A3o%20Paulo%2C%20SP!5e0!3m2!1sen!2sbr!4v1234567890123"
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
                  Rua Exemplo, 123 - Bairro<br />
                  São Paulo - SP, 00000-000
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-card rounded-lg shadow hover:shadow-md transition-shadow">
              <Phone className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-1">Telefone</h3>
                <p className="text-muted-foreground">
                  (11) 9999-9999
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-card rounded-lg shadow hover:shadow-md transition-shadow">
              <Mail className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-1">E-mail</h3>
                <p className="text-muted-foreground">
                  contato@clubeshangrila.com.br
                </p>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold py-6 text-lg gap-2"
              onClick={() => window.open(`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`, '_blank')}
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
