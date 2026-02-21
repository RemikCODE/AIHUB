import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  BookOpen, 
  Clock, 
  Lock, 
  Play, 
  CheckCircle, 
  ArrowLeft,
  CreditCard,
  Eye
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  price_cents: number;
  stripe_price_id: string | null;
}

interface Lesson {
  id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  order_index: number;
  is_preview: boolean;
}

const CourseDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!id) return;

      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (courseError || !courseData) {
        console.error('Error fetching course:', courseError);
        navigate('/courses');
        return;
      }

      setCourse(courseData);

      // Fetch lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', id)
        .order('order_index', { ascending: true });

      if (lessonsError) {
        console.error('Error fetching lessons:', lessonsError);
      } else {
        setLessons(lessonsData || []);
      }

      // Check user access
      if (user) {
        const { data: accessData } = await supabase
          .from('user_course_access')
          .select('id')
          .eq('user_id', user.id)
          .eq('course_id', id)
          .maybeSingle();

        setHasAccess(!!accessData);
      }

      setIsLoading(false);
    };

    fetchCourse();
  }, [id, user, navigate]);

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(cents / 100);
  };

  const handlePurchase = async () => {
    if (!user) {
      toast({
        title: "Wymagane logowanie",
        description: "Zaloguj się, aby kupić kurs",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    if (!course?.stripe_price_id) {
      toast({
        title: "Kurs niedostępny",
        description: "Ten kurs nie jest jeszcze dostępny do zakupu",
        variant: "destructive",
      });
      return;
    }

    setIsPurchasing(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        throw new Error("Brak tokenu uwierzytelnienia");
      }

      const response = await fetch(
        'https://orcnkyuwwkfdgvktunkd.supabase.co/functions/v1/create-checkout',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            priceId: course.stripe_price_id,
            courseId: course.id,
          }),
        }
      );

      if (!response.ok) {
        const errorJson = await response.json();
        console.error('create-checkout error response:', errorJson);
        const serverMessage = errorJson?.error || errorJson?.message || JSON.stringify(errorJson);
        throw new Error(serverMessage || 'Błąd funkcji');
      }

      const data = await response.json();

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast({
        title: "Błąd płatności",
        description: error?.message
          ? `Nie udało się utworzyć sesji płatności: ${error.message}`
          : "Nie udało się utworzyć sesji płatności. Spróbuj ponownie.",
        variant: "destructive",
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  const canViewLesson = (lesson: Lesson) => {
    return hasAccess || lesson.is_preview;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16 px-4">
          <div className="container mx-auto">
            <div className="animate-pulse space-y-8">
              <div className="h-8 bg-secondary rounded w-1/3" />
              <div className="h-64 bg-secondary rounded" />
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-secondary rounded" />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16 px-4">
          <div className="container mx-auto text-center">
            <h1 className="text-2xl font-serif">Kurs nie znaleziony</h1>
            <Link to="/courses">
              <Button variant="gold" className="mt-4">
                Wróć do kursów
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto">
          {/* Back Button */}
          <Link to="/courses" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Wróć do kursów
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Course Info */}
            <div className="lg:col-span-2 space-y-8">
              {/* Header */}
              <Card className="glass-card border-border/50 overflow-hidden">
                {course.thumbnail_url ? (
                  <img 
                    src={course.thumbnail_url} 
                    alt={course.title}
                    className="w-full h-64 object-cover"
                  />
                ) : (
                  <div className="w-full h-64 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <BookOpen className="w-24 h-24 text-muted-foreground" />
                  </div>
                )}
                
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-3xl font-serif mb-2">
                        {course.title}
                      </CardTitle>
                      {hasAccess && (
                        <Badge className="bg-accent text-accent-foreground">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Masz dostęp
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription className="text-lg text-muted-foreground mt-4">
                    {course.description || 'Brak opisu kursu'}
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Lessons List */}
              <div>
                <h2 className="text-2xl font-serif font-bold mb-4">
                  Zawartość kursu ({lessons.length} lekcji)
                </h2>
                
                <div className="space-y-3">
                  {lessons.map((lesson, index) => (
                    <Card 
                      key={lesson.id}
                      className={`glass-card border-border/50 cursor-pointer transition-all duration-300 ${
                        canViewLesson(lesson) 
                          ? 'hover:border-primary/50' 
                          : 'opacity-75'
                      } ${selectedLesson?.id === lesson.id ? 'border-primary' : ''}`}
                      onClick={() => canViewLesson(lesson) && setSelectedLesson(lesson)}
                    >
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="font-medium">{lesson.title}</h3>
                            {lesson.is_preview && !hasAccess && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                <Eye className="w-3 h-3 mr-1" />
                                Podgląd
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {canViewLesson(lesson) ? (
                          <Play className="w-5 h-5 text-primary" />
                        ) : (
                          <Lock className="w-5 h-5 text-muted-foreground" />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Selected Lesson Content */}
              {selectedLesson && (
                <Card className="glass-card border-primary/50">
                  <CardHeader>
                    <CardTitle className="font-serif">{selectedLesson.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedLesson.video_url && (
                      <div className="aspect-video mb-6 rounded-lg overflow-hidden bg-secondary">
                        <iframe
                          src={selectedLesson.video_url}
                          className="w-full h-full"
                          allowFullScreen
                        />
                      </div>
                    )}
                    {selectedLesson.content && (
                      <div className="prose prose-invert max-w-none">
                        <p className="text-muted-foreground whitespace-pre-wrap">
                          {selectedLesson.content}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar - Purchase/Access */}
            <div className="lg:col-span-1">
              <Card className="glass-card border-border/50 sticky top-24">
                <CardHeader>
                  <CardTitle className="font-serif">
                    {hasAccess ? 'Masz dostęp' : 'Kup kurs'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!hasAccess && (
                    <div className="text-center">
                      <div className="text-4xl font-bold text-gradient-gold mb-2">
                        {course.price_cents === 0 ? 'Darmowy' : formatPrice(course.price_cents)}
                      </div>
                      <p className="text-muted-foreground">Jednorazowa płatność</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <BookOpen className="w-5 h-5 text-primary" />
                      <span>{lessons.length} lekcji</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Clock className="w-5 h-5 text-primary" />
                      <span>Dożywotni dostęp</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      <span>Certyfikat ukończenia</span>
                    </div>
                  </div>

                  {hasAccess ? (
                    <Button variant="gold" className="w-full" onClick={() => setSelectedLesson(lessons[0])}>
                      <Play className="w-4 h-4" />
                      Rozpocznij naukę
                    </Button>
                  ) : (
                    <Button 
                      variant="hero" 
                      className="w-full" 
                      onClick={handlePurchase}
                      disabled={isPurchasing}
                    >
                      {isPurchasing ? (
                        'Przetwarzanie...'
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5" />
                          Kup teraz
                        </>
                      )}
                    </Button>
                  )}

                  {!user && !hasAccess && (
                    <p className="text-center text-sm text-muted-foreground">
                      <Link to="/auth" className="text-primary hover:underline">
                        Zaloguj się
                      </Link>
                      {' '}aby kupić kurs
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CourseDetails;
