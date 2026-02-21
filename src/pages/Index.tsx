import { Bot, BookOpen, Award, Users, ArrowRight, Play, Code, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/Navbar';

const Index = () => {
  const { user, isAdmin } = useAuth();

  const features = [
    {
      icon: BookOpen,
      title: 'Kompleksowa wiedza',
      description: 'Od podstaw programowania po zaawansowane modele AI'
    },
    {
      icon: Award,
      title: 'Eksperci AI',
      description: 'Ucz się od praktyków pracujących z najnowszymi technologiami'
    },
    {
      icon: Users,
      title: 'Społeczność',
      description: 'Dołącz do tysięcy programistów AI'
    }
  ];

  const stats = [
    { value: '356', label: 'Kursantów' },
    { value: '15', label: 'Modułów' },
    { value: '95%', label: 'Zadowolonych' },
    { value: '24/7', label: 'Dostęp' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-4 gradient-hero overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border/50 mb-8">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-sm text-muted-foreground">Nowa era programowania z AI</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 leading-tight">
              Opanuj sztukę
              <span className="block text-gradient-gold">programowania AI</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Kompleksowe kursy programowania AI prowadzone przez ekspertów. 
              Zbuduj przyszłość z wykorzystaniem sztucznej inteligencji.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <>
                  <Link to="/courses">
                    <Button variant="hero" size="xl">
                      Przeglądaj kursy
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </Link>
                  {isAdmin && (
                    <Link to="/admin">
                      <Button variant="outline" size="xl">
                        Panel administratora
                      </Button>
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link to="/auth">
                    <Button variant="hero" size="xl">
                      Rozpocznij naukę
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </Link>
                  <Link to="/courses">
                    <Button variant="outline" size="xl">
                      <Play className="w-5 h-5" />
                      Zobacz kursy
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-border/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="text-center animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-4xl md:text-5xl font-serif font-bold text-gradient-gold mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4">
              Dlaczego <span className="text-gradient-gold">my?</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Oferujemy kompleksowe podejście do nauki programowania AI
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="glass-card border-border/50 hover:border-primary/50 transition-all duration-300 group animate-slide-up"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <CardHeader>
                  <div className="w-14 h-14 rounded-2xl gradient-gold flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 gold-glow">
                    <feature.icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-xl font-serif">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10" />
        <div className="container mx-auto relative z-10">
          <Card className="glass-card border-border/50 p-8 md:p-12">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
                Gotowy na rewolucję AI?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Dołącz do tysięcy programistów, którzy już budują przyszłość z AI dzięki naszym kursom.
              </p>
              <Link to={user ? "/courses" : "/auth"}>
                <Button variant="gold" size="xl">
                  {user ? "Zobacz dostępne kursy" : "Załóż darmowe konto"}
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-serif font-bold text-xl">AI Academy</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2025 AI HUB. Wszystkie prawa zastrzeżone.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
