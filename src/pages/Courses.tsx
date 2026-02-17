import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, Lock, Play, CheckCircle } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  price_cents: number;
  is_published: boolean;
}

interface CourseAccess {
  course_id: string;
}

const Courses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [userAccess, setUserAccess] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching courses:', error);
      } else {
        setCourses(data || []);
      }
    };

    const fetchUserAccess = async () => {
      if (!user) {
        setUserAccess([]);
        return;
      }

      const { data, error } = await supabase
        .from('user_course_access')
        .select('course_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching user access:', error);
      } else {
        setUserAccess((data || []).map((a: CourseAccess) => a.course_id));
      }
    };

    Promise.all([fetchCourses(), fetchUserAccess()]).finally(() => {
      setIsLoading(false);
    });
  }, [user]);

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(cents / 100);
  };

  const hasAccess = (courseId: string) => userAccess.includes(courseId);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
              Nasze <span className="text-gradient-gold">kursy</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Wybierz kurs dopasowany do Twojego poziomu i zacznij budować swoją wiedzę o AI
            </p>
          </div>

          {/* Courses Grid */}
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="glass-card border-border/50 animate-pulse">
                  <div className="h-48 bg-secondary rounded-t-lg" />
                  <CardHeader>
                    <div className="h-6 bg-secondary rounded w-3/4" />
                    <div className="h-4 bg-secondary rounded w-full mt-2" />
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
              <h2 className="text-2xl font-serif font-bold mb-2">Brak dostępnych kursów</h2>
              <p className="text-muted-foreground">Kursy pojawią się wkrótce. Sprawdź ponownie później.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.map((course, index) => (
                <Card 
                  key={course.id} 
                  className="glass-card border-border/50 hover:border-primary/50 transition-all duration-300 group overflow-hidden animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Thumbnail */}
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
                    
                    {/* Access Badge */}
                    {hasAccess(course.id) && (
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-accent text-accent-foreground">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Dostęp
                        </Badge>
                      </div>
                    )}

                    {/* Price Badge */}
                    {!hasAccess(course.id) && (
                      <div className="absolute bottom-4 right-4">
                        <Badge className="bg-primary text-primary-foreground font-bold">
                          {course.price_cents === 0 ? 'Darmowy' : formatPrice(course.price_cents)}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <CardHeader>
                    <CardTitle className="font-serif text-xl line-clamp-2">
                      {course.title}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground line-clamp-3">
                      {course.description || 'Brak opisu kursu'}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <Link to={`/course/${course.id}`}>
                      <Button 
                        variant={hasAccess(course.id) ? "gold" : "outline"} 
                        className="w-full"
                      >
                        {hasAccess(course.id) ? (
                          <>
                            <Play className="w-4 h-4" />
                            Kontynuuj naukę
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4" />
                            Zobacz szczegóły
                          </>
                        )}
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

export default Courses;
