import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, Lock, Mail, User } from 'lucide-react';
import { loginSchema, registerSchema } from '@/lib/validations/auth';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string }>({});
  const { signIn, signUp, user, signInWithOAuth } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const validateLogin = () => {
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof typeof errors;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const validateRegister = () => {
    const result = registerSchema.safeParse({ email, password, fullName: fullName || undefined });
    
    const mindlugosc = 8;
    const isstrong = password.length >= mindlugosc && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);
    if (!isstrong) {
      setErrors({ password: `Hasło musi mieć co najmniej ${mindlugosc} znaków, zawierać wielką literę, małą literę, cyfrę i znak specjalny.` });
      return false;
    }
    
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof typeof errors;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateLogin()) return;
    
    setIsLoading(true);
    
    const { error } = await signIn(email, password);
    
    if (error) {
      toast({
        title: "Błąd logowania",
        description: error.message === 'Invalid login credentials' 
          ? 'Nieprawidłowy email lub hasło' 
          : error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Zalogowano pomyślnie",
        description: "Witaj z powrotem!",
      });
      navigate('/');
    }
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateRegister()) return;
    
    setIsLoading(true);

    const { error } = await signUp(email, password, fullName);
    
    if (error) {
      if (error.message.includes('already registered')) {
        toast({
          title: "Konto już istnieje",
          description: "Ten adres email jest już zarejestrowany. Spróbuj się zalogować.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Błąd rejestracji",
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Konto utworzone",
        description: "Zostałeś pomyślnie zarejestrowany!",
      });
      navigate('/');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 gradient-hero">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      <Card className="w-full max-w-md glass-card border-border/50 animate-fade-in relative z-10">
        <CardHeader className="text-center space-y-4">
          <p className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <Link to="/" className=" float-left text-decoration-none hover:text-red-400">
            Powrót
            </Link>
          </p>
          <div className="mx-auto w-16 h-16 rounded-2xl gradient-gold flex items-center justify-center gold-glow">
            <TrendingUp className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl font-serif text-gradient-gold">AI Hub</CardTitle>
          <CardDescription className="text-muted-foreground">
            Platforma kursów inwestycyjnych
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-secondary/50">
              <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Logowanie
              </TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Rejestracja
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="twoj@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={`pl-10 bg-secondary/50 border-border focus:border-primary ${errors.email ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">Hasło</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className={`pl-10 bg-secondary/50 border-border focus:border-primary ${errors.password ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>

                <Button type="submit" variant="gold" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Logowanie...' : 'Zaloguj się'}
                </Button>
                <div className="text-center my-2 text-sm text-muted-foreground">— lub —</div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full flex items-center justify-center"
                  onClick={async () => {
                    setIsLoading(true);
                    const { error } = await signInWithOAuth('google');
                    if (error) {
                      toast({ title: 'Błąd logowania', description: error.message, variant: 'destructive' });
                    }
                    setIsLoading(false);
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 mr-2" aria-hidden>
                    <path fill="#fbbc05" d="M43.6 20.5H42V20H24v8h11.3C34.3 33 30 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.6C35.6 6.9 30.1 4 24 4 12.95 4 4 12.95 4 24s8.95 20 20 20c11.05 0 20-8.95 20-20 0-1.3-.12-2.57-.4-3.75z"/>
                    <path fill="#4285F4" d="M6.3 14.9l6.6 4.8C14.7 16 19 13.5 24 13.5c3.1 0 5.9 1.2 8 3.1l5.7-5.6C35.6 6.9 30.1 4 24 4 16.9 4 10.6 7.7 6.3 14.9z"/>
                    <path fill="#34A853" d="M24 44c6.6 0 12-5.4 12-12 0-1.5-.3-2.9-.8-4.2L24 29.5v14.5z"/>
                    <path fill="#ea4335" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.6-2.7 4.8-5 6.2l6 4.4C40.6 34.9 43.6 28.3 43.6 20.5z"/>
                  </svg>
                  Zaloguj przez Google
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="mt-6">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-foreground">Imię i nazwisko</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Jan Kowalski"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={`pl-10 bg-secondary/50 border-border focus:border-primary ${errors.fullName ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="regEmail" className="text-foreground">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="regEmail"
                      type="email"
                      placeholder="twoj@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={`pl-10 bg-secondary/50 border-border focus:border-primary ${errors.email ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="regPassword" className="text-foreground">Hasło</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="regPassword"
                      type="password"
                      placeholder="Minimum 6 znaków"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className={`pl-10 bg-secondary/50 border-border focus:border-primary ${errors.password ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>

                <Button type="submit" variant="gold" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Tworzenie konta...' : 'Utwórz konto'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
