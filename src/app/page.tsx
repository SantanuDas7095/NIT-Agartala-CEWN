
'use client';

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Header } from "@/components/common/header";
import { Footer } from "@/components/common/footer";
import { ArrowRight, HeartPulse, Shield, Soup, LayoutDashboard, Utensils, BrainCircuit } from "lucide-react";
import { useAdmin } from "@/hooks/use-admin";
import HomePageMessChart from "./components/home-page-mess-chart";

const featureCards = [
  {
    icon: <HeartPulse className="h-8 w-8 text-accent" />,
    title: "Emergency SOS",
    description: "One-tap alert for medical, safety, and other emergencies. Get help fast.",
    link: "/sos",
    image: PlaceHolderImages.find(img => img.id === 'sos-alert'),
  },
  {
    icon: <Shield className="h-8 w-8 text-accent" />,
    title: "Hospital Transparency",
    description: "Track wait times, doctor availability, and give feedback to improve services.",
    link: "/hospital",
    image: PlaceHolderImages.find(img => img.id === 'hospital-care'),
  },
  {
    icon: <Soup className="h-8 w-8 text-accent" />,
    title: "Mess Food Monitor",
    description: "Rate daily meals and report sickness to ensure food safety and quality.",
    link: "/mess",
    image: PlaceHolderImages.find(img => img.id === 'mess-food'),
  },
  {
    icon: <BrainCircuit className="h-8 w-8 text-accent" />,
    title: "AI Health Assistant",
    description: "Chat for first-aid advice and track your meal's nutrition with a photo.",
    link: "/ai-assistant",
    image: PlaceHolderImages.find(img => img.id === 'ai-assistant'),
  },
];

export default function Home() {
  const { isAdmin } = useAdmin();
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-campus');
  const todaysReviewImage = PlaceHolderImages.find(img => img.id === 'todays-review');


  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="relative h-[60vh] w-full">
          {heroImage && (
            <Image
              src={heroImage.imageUrl}
              alt={heroImage.description}
              fill
              className="object-cover"
              data-ai-hint={heroImage.imageHint}
              priority
            />
          )}
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-10 flex h-full flex-col items-center justify-center text-center text-white">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl font-headline">
              NIT Agartala CEWN
            </h1>
            <p className="mt-4 max-w-2xl text-lg md:text-xl">
              One platform for Emergency, Health, and Food Safety.
            </p>
            <Button asChild size="lg" className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href="/sos">
                Report Emergency <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        <section id="features" className="py-12 md:py-20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">A Real-Time Response System</h2>
              <p className="mt-4 max-w-3xl mx-auto text-muted-foreground md:text-lg">
                Solving real problems with a connected, transparent, and accountable system.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
              {featureCards.map((feature) => (
                <Card key={feature.title} className="flex flex-col overflow-hidden transition-all hover:shadow-xl">
                  {feature.image && (
                     <div className="w-full h-48 relative">
                      <Image
                        src={feature.image.imageUrl}
                        alt={feature.title}
                        fill
                        className="object-cover"
                        data-ai-hint={feature.image.imageHint}
                      />
                     </div>
                  )}
                  <CardHeader className="flex flex-row items-start gap-4">
                    <div className="flex-shrink-0">{feature.icon}</div>
                    <div className="flex-grow">
                      <CardTitle className="font-headline">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                  <div className="p-6 pt-0">
                    <Button asChild variant="outline" className="w-full">
                      <Link href={feature.link}>
                        Go to {feature.title} <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              ))}
               <Card className="flex flex-col overflow-hidden transition-all hover:shadow-xl md:col-span-1 lg:col-span-2">
                 {todaysReviewImage && (
                     <div className="w-full h-48 relative">
                      <Image
                        src={todaysReviewImage.imageUrl}
                        alt={todaysReviewImage.title}
                        fill
                        className="object-cover"
                        data-ai-hint={todaysReviewImage.imageHint}
                      />
                     </div>
                  )}
                <CardHeader className="flex flex-row items-start gap-4">
                  <div className="flex-shrink-0">
                    <Utensils className="h-8 w-8 text-accent" />
                  </div>
                  <div className="flex-grow">
                    <CardTitle className="font-headline">Mess Food Hygiene Trends</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <HomePageMessChart />
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {isAdmin && (
            <section className="bg-card py-12 md:py-20">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                        <div className="space-y-4">
                            <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">Admin Dashboard</div>
                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">Data-Driven Insights</h2>
                            <p className="text-muted-foreground md:text-lg">
                                Monitor live emergencies, track hospital performance, analyze food safety trends, and get AI-powered health predictions to proactively manage campus wellness.
                            </p>
                            <Button asChild>
                                <Link href="/admin">
                                    View Dashboard <LayoutDashboard className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                        <div>
                            {PlaceHolderImages.find(img => img.id === 'admin-dashboard') && (
                                <Image 
                                    src={PlaceHolderImages.find(img => img.id === 'admin-dashboard')!.imageUrl}
                                    alt="Admin Dashboard"
                                    width={600}
                                    height={400}
                                    className="rounded-lg shadow-lg"
                                    data-ai-hint={PlaceHolderImages.find(img => img.id === 'admin-dashboard')!.imageHint}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
