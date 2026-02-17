import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Play, ArrowRight } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
}

const MyCourses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMyCourses = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      // First get user's course access
      const { data: accessData, error: accessError } = await supabase
        .from('user_course_access')
        .select('course_id')
        .eq('user_id', user.id);

      if (accessError) {
        console.error('Error fetching access:', accessError);
        setIsLoading(false);
        return;
      }

      if (!accessData || accessData.length === 0) {
        setCourses([]);
        setIsLoading(false);
        return;
      }

      const courseIds = accessData.map(a => a.course_id);

      // Then fetch course details
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('id, title, description, thumbnail_url')
        .in('id', courseIds);

      if (coursesError) {
        console.error('Error fetching courses:', coursesError);
      } else {
        setCourses(coursesData || []);
      }

      setIsLoading(false);
    };

    fetchMyCourses();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16 px-4">
          <div className="container mx-auto text-center">
            <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-serif font-bold mb-2">Zaloguj się</h1>
            <p className="text-muted-foreground mb-6">
              Zaloguj się, aby zobaczyć swoje kursy
            </p>
            <Link to="/auth">
              <Button variant="gold">Zaloguj się</Button>
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
          {/* Header */}
          <div className="mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
              Moje <span className="text-gradient-gold">kursy</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Kontynuuj naukę od miejsca, w którym skończyłeś
            </p>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="glass-card border-border/50 animate-pulse">
                  <div className="h-48 bg-secondary rounded-t-lg" />
                  <CardHeader>
                    <div className="h-6 bg-secondary rounded w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-10 bg-secondary rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-serif font-bold mb-2">Brak zakupionych kursów</h2>
              <p className="text-muted-foreground mb-6">
                Nie masz jeszcze żadnych kursów. Przeglądaj nasze kursy i zacznij naukę!
              </p>
              <Link to="/courses">
                <Button variant="gold">
                  Przeglądaj kursy
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.map((course, index) => (
                <Card 
                  key={course.id} 
                  className="glass-card border-border/50 hover:border-primary/50 transition-all duration-300 group overflow-hidden animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="relative h-48 overflow-hidden">
                    {course.thumbnail_url ? (
                      <img 
                        src={course.thumbnail_url} 
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <BookOpen className="w-16 h-16 text-muted-foreground" />
                      </div>
                    )}
                    
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-accent text-accent-foreground">
                        Dostęp
                      </Badge>
                    </div>
                  </div>

                  <CardHeader>
                    <CardTitle className="font-serif text-xl line-clamp-2">
                      {course.title}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground line-clamp-2">
                      {course.description || 'Brak opisu'}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <Link to={`/course/${course.id}`}>
                      <Button variant="gold" className="w-full">
                        <Play className="w-4 h-4" />
                        Kontynuuj naukę
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MyCourses;
