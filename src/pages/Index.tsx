import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Reservas from "@/components/Reservas";
import About from "@/components/About";
import Pricing from "@/components/Pricing";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Pricing />
      <Reservas />
      <About />
      <Contact />
      <Footer />
    </div>
  );
};

export default Index;
