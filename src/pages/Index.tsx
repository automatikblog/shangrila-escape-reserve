import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Reservas from "@/components/Reservas";
import About from "@/components/About";
import Pricing from "@/components/Pricing";
import Gallery from "@/components/Gallery";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Reservas />
      <About />
      <Pricing />
      <Gallery />
      <Contact />
      <Footer />
    </div>
  );
};

export default Index;
