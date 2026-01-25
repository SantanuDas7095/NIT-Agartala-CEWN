
'use client';

import { useState, useRef, useEffect } from 'react';
import { Header } from '@/components/common/header';
import { Footer } from '@/components/common/footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Camera, HeartPulse, Loader, Send, Sparkles, User, X, Salad, AlertCircle, Plus, BookCopy } from 'lucide-react';
import Image from 'next/image';
import { useUser, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { firstAidChat, type FirstAidChatInput, type FirstAidMessage } from '@/ai/flows/first-aid-flow';
import { nutritionTracker, type NutritionTrackerInput, type NutritionTrackerOutput } from '@/ai/flows/nutrition-tracker-flow';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar } from '@/components/ui/avatar';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { uploadPhoto } from '../actions';

export default function AiAssistantPage() {
  const { user, loading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  // State for First-Aid Chat
  const [chatMessages, setChatMessages] = useState<FirstAidMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // State for Nutrition Tracker
  const [mealPhoto, setMealPhoto] = useState<File | null>(null);
  const [mealPhotoPreview, setMealPhotoPreview] = useState<string | null>(null);
  const [nutritionData, setNutritionData] = useState<NutritionTrackerOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [nutritionError, setNutritionError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (chatScrollRef.current) {
        chatScrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatting) return;

    const newUserMessage: FirstAidMessage = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, newUserMessage]);
    setChatInput('');
    setIsChatting(true);

    const input: FirstAidChatInput = {
      history: [...chatMessages, newUserMessage],
    };
    
    let fullResponse = '';
    const aiMessage: FirstAidMessage = { role: 'model', content: '' };
    setChatMessages(prev => [...prev, aiMessage]);

    try {
        const result = await firstAidChat(input);
        fullResponse = result.response;

    } catch (error) {
      console.error('Chat error:', error);
      fullResponse = 'Sorry, I encountered an error. Please try again.';
    } finally {
       setChatMessages(prev => prev.map((msg, i) => i === prev.length - 1 ? { ...msg, content: fullResponse } : msg));
       setIsChatting(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setMealPhoto(file);
    setNutritionData(null);
    setNutritionError(null);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMealPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setMealPhotoPreview(null);
    }
  };

  const convertImageToJpeg = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = document.createElement('img');
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return reject(new Error('Could not get canvas context.'));
                }
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/jpeg', 0.9)); // Convert to JPEG with 90% quality
            };
            img.onerror = (error) => {
                reject(new Error('Failed to load image for conversion.'));
            };
            img.src = event.target?.result as string;
        };
        reader.onerror = (error) => {
            reject(new Error('Failed to read image file.'));
        };
        reader.readAsDataURL(file);
    });
  };

  const handleNutritionAnalysis = async () => {
    if (!mealPhoto || isAnalyzing) return;
    setIsAnalyzing(true);
    setNutritionData(null);
    setNutritionError(null);
    
    try {
      const photoDataUri = await convertImageToJpeg(mealPhoto);
      const input: NutritionTrackerInput = { photoDataUri };
      const result = await nutritionTracker(input);
      setNutritionData(result);
    } catch (error: any) {
      console.error("Nutrition analysis error:", error);
      setNutritionError(error.message || "Failed to analyze the image. Please try another one.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveToDiary = async () => {
    if (!nutritionData || !user || !db) return;
    setIsSaving(true);
  
    try {
        let photoUrl: string | undefined = undefined;
        if (mealPhoto) {
            const formData = new FormData();
            formData.append('photo', mealPhoto);
            const result = await uploadPhoto(formData);
            if (result.success && result.url) {
                photoUrl = result.url;
            } else {
                throw new Error(result.error || 'Photo upload failed.');
            }
        }

        const logData = {
            ...nutritionData,
            userId: user.uid,
            timestamp: serverTimestamp(),
            photoUrl: photoUrl || '',
        };
        
        const logsCollectionRef = collection(db, "userProfile", user.uid, "nutritionLogs");
  
        await addDoc(logsCollectionRef, logData);
        
        toast({
            title: "Meal Saved!",
            description: "Your meal has been added to your nutrition diary.",
        });

    } catch (error: any) {
        if (error.code && error.code.includes('permission-denied')) {
            const permissionError = new FirestorePermissionError({
                path: `userProfile/${user.uid}/nutritionLogs`,
                operation: 'create',
                requestResourceData: { userId: user.uid },
            }, error);
            errorEmitter.emit('permission-error', permissionError);
            toast({
                title: "Save Failed",
                description: "Could not save your meal due to a permission issue.",
                variant: "destructive",
            });
        } else {
            console.error("Error saving diary entry:", error);
            toast({
                title: "Save Failed",
                description: error.message || "Could not save your meal. Please try again.",
                variant: "destructive",
            });
        }
    } finally {
        setIsSaving(false);
    }
  };
  
  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-secondary/50">
        <div className="container mx-auto max-w-4xl py-12 px-4 md:px-6">
          <div className="space-y-4 text-center mb-8">
            <Sparkles className="mx-auto h-12 w-12 text-primary" />
            <h1 className="text-4xl font-bold font-headline">AI Health Assistant</h1>
            <p className="text-lg text-muted-foreground">Your personal assistant for first-aid and nutrition tracking.</p>
          </div>

          <Tabs defaultValue="first-aid" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="first-aid"><HeartPulse className="mr-2"/>First-Aid Assistant</TabsTrigger>
              <TabsTrigger value="nutrition"><Salad className="mr-2"/>Meal Nutrition Tracker</TabsTrigger>
            </TabsList>
            
            <TabsContent value="first-aid" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>First-Aid Chatbot</CardTitle>
                  <CardDescription>Ask for advice on minor health emergencies. This is not a substitute for professional medical advice.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[50vh] flex flex-col">
                        <ScrollArea className="flex-1 p-4 border rounded-md bg-background">
                            {chatMessages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                                    <HeartPulse className="h-12 w-12 mb-4"/>
                                    <p className="font-semibold">How can I help you today?</p>
                                    <p className="text-sm">e.g., "What are the symptoms of a sprained ankle?"</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                {chatMessages.map((msg, index) => (
                                    <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                    {msg.role === 'model' && <Avatar className="h-8 w-8 bg-primary text-primary-foreground"><Sparkles className="h-5 w-5"/></Avatar>}
                                    <div className={`rounded-lg px-4 py-2 max-w-[80%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                    </div>
                                    {msg.role === 'user' && <Avatar className="h-8 w-8"><User/></Avatar>}
                                    </div>
                                ))}
                                 <div ref={chatScrollRef} />
                                </div>
                            )}
                        </ScrollArea>
                        <form onSubmit={handleChatSubmit} className="mt-4 flex gap-2">
                            <Input
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder="Type your health query..."
                                disabled={isChatting}
                            />
                            <Button type="submit" disabled={isChatting || !chatInput.trim()}>
                                {isChatting ? <Loader className="animate-spin" /> : <Send />}
                            </Button>
                        </form>
                    </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="nutrition" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>AI-Powered Nutrition Tracker</CardTitle>
                  <CardDescription>Upload a photo of your meal to get an estimated nutritional breakdown.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="meal-photo">Upload Meal Photo</Label>
                    <Input id="meal-photo" type="file" accept="image/*" onChange={handlePhotoChange} disabled={isAnalyzing}/>
                  </div>

                  {mealPhotoPreview && (
                    <div className="relative w-full max-w-sm mx-auto">
                        <Image src={mealPhotoPreview} alt="Meal preview" width={400} height={300} className="rounded-md object-cover"/>
                        <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 bg-black/50 hover:bg-black/75 text-white rounded-full" onClick={() => { setMealPhoto(null); setMealPhotoPreview(null); setNutritionData(null); }}>
                            <X className="h-4 w-4"/>
                        </Button>
                    </div>
                  )}

                  <Button onClick={handleNutritionAnalysis} disabled={!mealPhoto || isAnalyzing} className="w-full">
                    {isAnalyzing ? <><Loader className="mr-2 animate-spin"/>Analyzing...</> : 'Analyze Nutrition'}
                  </Button>

                  {isAnalyzing && (
                    <div className="space-y-4">
                        <Skeleton className="h-8 w-3/4 mx-auto" />
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
                        </div>
                    </div>
                  )}
                  
                  {nutritionError && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Analysis Failed</AlertTitle>
                        <AlertDescription>{nutritionError}</AlertDescription>
                    </Alert>
                  )}

                  {nutritionData && (
                     <div className="space-y-4 text-center">
                        <h3 className="text-lg font-semibold">Estimated Nutritional Information</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Card className="p-4">
                                <CardTitle className="text-sm text-muted-foreground">Calories</CardTitle>
                                <p className="text-2xl font-bold">{nutritionData.calories.toFixed(0)}</p>
                            </Card>
                             <Card className="p-4">
                                <CardTitle className="text-sm text-muted-foreground">Protein</CardTitle>
                                <p className="text-2xl font-bold">{nutritionData.proteinGrams.toFixed(1)}g</p>
                            </Card>
                             <Card className="p-4">
                                <CardTitle className="text-sm text-muted-foreground">Carbs</CardTitle>
                                <p className="text-2xl font-bold">{nutritionData.carbsGrams.toFixed(1)}g</p>
                            </Card>
                             <Card className="p-4">
                                <CardTitle className="text-sm text-muted-foreground">Fat</CardTitle>
                                <p className="text-2xl font-bold">{nutritionData.fatGrams.toFixed(1)}g</p>
                            </Card>
                        </div>
                        <div className="flex justify-center gap-4">
                            <Button onClick={handleSaveToDiary} disabled={isSaving}>
                                {isSaving ? <><Loader className="mr-2 animate-spin" /> Saving...</> : <><Plus className="mr-2"/> Save to Diary</>}
                            </Button>
                            <Button variant="outline" onClick={() => router.push('/nutrition-diary')}>
                                <BookCopy className="mr-2"/> View Diary
                            </Button>
                        </div>
                     </div>
                  )}

                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
