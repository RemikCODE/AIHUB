import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit, Save, BookOpen, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { courseSchema, lessonSchema } from '@/lib/validations/admin';

interface Course {
  id: string;
  title: string;
  description: string | null;
  price_cents: number;
  stripe_price_id: string | null;
  is_published: boolean;
  order_index: number;
}

interface Lesson {
  id: string;
  course_id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  order_index: number;
  is_preview: boolean;
}

const Admin = () => {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [courseForm, setCourseForm] = useState({ title: '', description: '', price_cents: 0, stripe_price_id: '' });
  const [lessonForm, setLessonForm] = useState({ title: '', content: '', video_url: '', is_preview: false });
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [courseErrors, setCourseErrors] = useState<Record<string, string>>({});
  const [lessonErrors, setLessonErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate('/');
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) fetchCourses();
  }, [isAdmin]);

  useEffect(() => {
    if (selectedCourse) fetchLessons(selectedCourse.id);
  }, [selectedCourse]);

  const fetchCourses = async () => {
    const { data, error } = await supabase.from('courses').select('*').order('order_index');
    if (error) {
      toast({ title: 'Błąd', description: 'Nie udało się pobrać kursów', variant: 'destructive' });
    } else {
      setCourses(data || []);
    }
    setIsLoading(false);
  };

  const fetchLessons = async (courseId: string) => {
    const { data, error } = await supabase.from('lessons').select('*').eq('course_id', courseId).order('order_index');
    if (!error) setLessons(data || []);
  };

  const validateCourseForm = () => {
    const result = courseSchema.safeParse(courseForm);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        errors[field] = err.message;
      });
      setCourseErrors(errors);
      return false;
    }
    setCourseErrors({});
    return true;
  };

  const validateLessonForm = (data: typeof lessonForm) => {
    const result = lessonSchema.safeParse(data);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        errors[field] = err.message;
      });
      setLessonErrors(errors);
      return false;
    }
    setLessonErrors({});
    return true;
  };

  const handleCreateCourse = async () => {
    if (!validateCourseForm()) return;

    const { error } = await supabase.from('courses').insert({
      title: courseForm.title.trim(),
      description: courseForm.description.trim() || null,
      price_cents: courseForm.price_cents,
      stripe_price_id: courseForm.stripe_price_id.trim() || null,
      order_index: courses.length,
    });

    if (error) {
      toast({ title: 'Błąd', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Sukces', description: 'Kurs został utworzony' });
      setCourseForm({ title: '', description: '', price_cents: 0, stripe_price_id: '' });
      setCourseErrors({});
      fetchCourses();
    }
  };

  const handleTogglePublish = async (course: Course) => {
    const { error } = await supabase.from('courses').update({ is_published: !course.is_published }).eq('id', course.id);
    if (!error) fetchCourses();
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten kurs?')) return;
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (!error) {
      if (selectedCourse?.id === id) setSelectedCourse(null);
      fetchCourses();
    }
  };

  const handleCreateLesson = async () => {
    if (!selectedCourse) return;
    if (!validateLessonForm(lessonForm)) return;

    const { error } = await supabase.from('lessons').insert({
      course_id: selectedCourse.id,
      title: lessonForm.title.trim(),
      content: lessonForm.content.trim() || null,
      video_url: lessonForm.video_url.trim() || null,
      is_preview: lessonForm.is_preview,
      order_index: lessons.length,
    });

    if (error) {
      toast({ title: 'Błąd', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Sukces', description: 'Lekcja została dodana' });
      setLessonForm({ title: '', content: '', video_url: '', is_preview: false });
      setLessonErrors({});
      fetchLessons(selectedCourse.id);
    }
  };

  const handleUpdateLesson = async () => {
    if (!editingLesson) return;
    
    const lessonData = {
      title: editingLesson.title,
      content: editingLesson.content || '',
      video_url: editingLesson.video_url || '',
      is_preview: editingLesson.is_preview,
    };
    
    if (!validateLessonForm(lessonData)) return;

    const { error } = await supabase.from('lessons').update({
      title: editingLesson.title.trim(),
      content: editingLesson.content?.trim() || null,
      video_url: editingLesson.video_url?.trim() || null,
      is_preview: editingLesson.is_preview,
    }).eq('id', editingLesson.id);

    if (!error) {
      toast({ title: 'Zaktualizowano' });
      setEditingLesson(null);
      setLessonErrors({});
      if (selectedCourse) fetchLessons(selectedCourse.id);
    }
  };

  const handleDeleteLesson = async (id: string) => {
    if (!confirm('Usunąć lekcję?')) return;
    const { error } = await supabase.from('lessons').delete().eq('id', id);
    if (!error && selectedCourse) fetchLessons(selectedCourse.id);
  };

  if (authLoading || isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-pulse text-xl">Ładowanie...</div></div>;
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto">
          <h1 className="text-4xl font-serif font-bold mb-8">Panel <span className="text-gradient-gold">administratora</span></h1>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Courses Management */}
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5" /> Kursy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Course Form */}
                <div className="space-y-3 p-4 rounded-lg bg-secondary/30">
                  <div>
                    <Input 
                      placeholder="Tytuł kursu" 
                      value={courseForm.title} 
                      onChange={e => setCourseForm({ ...courseForm, title: e.target.value })} 
                      className={courseErrors.title ? 'border-destructive' : ''}
                    />
                    {courseErrors.title && <p className="text-sm text-destructive mt-1">{courseErrors.title}</p>}
                  </div>
                  <div>
                    <Textarea 
                      placeholder="Opis" 
                      value={courseForm.description} 
                      onChange={e => setCourseForm({ ...courseForm, description: e.target.value })} 
                      className={courseErrors.description ? 'border-destructive' : ''}
                    />
                    {courseErrors.description && <p className="text-sm text-destructive mt-1">{courseErrors.description}</p>}
                  </div>
                  <div>
                    <Input 
                      type="number" 
                      placeholder="Cena (grosze)" 
                      value={courseForm.price_cents} 
                      onChange={e => setCourseForm({ ...courseForm, price_cents: parseInt(e.target.value) || 0 })} 
                      className={courseErrors.price_cents ? 'border-destructive' : ''}
                    />
                    {courseErrors.price_cents && <p className="text-sm text-destructive mt-1">{courseErrors.price_cents}</p>}
                  </div>
                  <div>
                    <Input 
                      placeholder="Stripe Price ID (opcjonalnie)" 
                      value={courseForm.stripe_price_id} 
                      onChange={e => setCourseForm({ ...courseForm, stripe_price_id: e.target.value })} 
                      className={courseErrors.stripe_price_id ? 'border-destructive' : ''}
                    />
                    {courseErrors.stripe_price_id && <p className="text-sm text-destructive mt-1">{courseErrors.stripe_price_id}</p>}
                  </div>
                  <Button variant="gold" onClick={handleCreateCourse} disabled={!courseForm.title}><Plus className="w-4 h-4" /> Dodaj kurs</Button>
                </div>

                {/* Courses List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {courses.map(course => (
                    <div key={course.id} className={`p-3 rounded-lg border transition-all cursor-pointer ${selectedCourse?.id === course.id ? 'border-primary bg-primary/10' : 'border-border/50 hover:border-border'}`} onClick={() => setSelectedCourse(course)}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{course.title}</h3>
                          <p className="text-sm text-muted-foreground">{(course.price_cents / 100).toFixed(2)} PLN</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch checked={course.is_published} onCheckedChange={() => handleTogglePublish(course)} />
                          <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); handleDeleteCourse(course.id); }}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Lessons Management */}
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> Lekcje {selectedCourse && `- ${selectedCourse.title}`}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedCourse ? (
                  <>
                    {/* Add Lesson Form */}
                    <div className="space-y-3 p-4 rounded-lg bg-secondary/30">
                      <div>
                        <Input 
                          placeholder="Tytuł lekcji" 
                          value={lessonForm.title} 
                          onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })} 
                          className={lessonErrors.title ? 'border-destructive' : ''}
                        />
                        {lessonErrors.title && <p className="text-sm text-destructive mt-1">{lessonErrors.title}</p>}
                      </div>
                      <div>
                        <Textarea 
                          placeholder="Treść" 
                          value={lessonForm.content} 
                          onChange={e => setLessonForm({ ...lessonForm, content: e.target.value })} 
                          className={lessonErrors.content ? 'border-destructive' : ''}
                        />
                        {lessonErrors.content && <p className="text-sm text-destructive mt-1">{lessonErrors.content}</p>}
                      </div>
                      <div>
                        <Input 
                          placeholder="URL wideo (opcjonalnie)" 
                          value={lessonForm.video_url} 
                          onChange={e => setLessonForm({ ...lessonForm, video_url: e.target.value })} 
                          className={lessonErrors.video_url ? 'border-destructive' : ''}
                        />
                        {lessonErrors.video_url && <p className="text-sm text-destructive mt-1">{lessonErrors.video_url}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={lessonForm.is_preview} onCheckedChange={checked => setLessonForm({ ...lessonForm, is_preview: checked })} />
                        <Label>Podgląd (darmowy)</Label>
                      </div>
                      <Button variant="gold" onClick={handleCreateLesson} disabled={!lessonForm.title}><Plus className="w-4 h-4" /> Dodaj lekcję</Button>
                    </div>

                    {/* Lessons List */}
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {lessons.map((lesson, i) => (
                        <div key={lesson.id} className="p-3 rounded-lg border border-border/50 flex items-center justify-between">
                          <div>
                            <span className="text-muted-foreground mr-2">{i + 1}.</span>
                            <span>{lesson.title}</span>
                            {lesson.is_preview && <span className="ml-2 text-xs text-accent">(podgląd)</span>}
                          </div>
                          <div className="flex gap-1">
                            <Dialog>
                              <DialogTrigger asChild><Button variant="ghost" size="icon" onClick={() => setEditingLesson(lesson)}><Edit className="w-4 h-4" /></Button></DialogTrigger>
                              <DialogContent className="glass-card">
                                <DialogHeader><DialogTitle>Edytuj lekcję</DialogTitle></DialogHeader>
                                {editingLesson && (
                                  <div className="space-y-3">
                                    <div>
                                      <Input 
                                        value={editingLesson.title} 
                                        onChange={e => setEditingLesson({ ...editingLesson, title: e.target.value })} 
                                        className={lessonErrors.title ? 'border-destructive' : ''}
                                      />
                                      {lessonErrors.title && <p className="text-sm text-destructive mt-1">{lessonErrors.title}</p>}
                                    </div>
                                    <div>
                                      <Textarea 
                                        value={editingLesson.content || ''} 
                                        onChange={e => setEditingLesson({ ...editingLesson, content: e.target.value })} 
                                        className={lessonErrors.content ? 'border-destructive' : ''}
                                      />
                                      {lessonErrors.content && <p className="text-sm text-destructive mt-1">{lessonErrors.content}</p>}
                                    </div>
                                    <div>
                                      <Input 
                                        value={editingLesson.video_url || ''} 
                                        onChange={e => setEditingLesson({ ...editingLesson, video_url: e.target.value })} 
                                        className={lessonErrors.video_url ? 'border-destructive' : ''}
                                      />
                                      {lessonErrors.video_url && <p className="text-sm text-destructive mt-1">{lessonErrors.video_url}</p>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Switch checked={editingLesson.is_preview} onCheckedChange={checked => setEditingLesson({ ...editingLesson, is_preview: checked })} />
                                      <Label>Podgląd</Label>
                                    </div>
                                    <Button variant="gold" onClick={handleUpdateLesson}><Save className="w-4 h-4" /> Zapisz</Button>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteLesson(lesson.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Wybierz kurs, aby zarządzać lekcjami</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Admin;
