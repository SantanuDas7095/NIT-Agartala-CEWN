
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { predictHealthRisks, type PredictHealthRisksInput, type PredictHealthRisksOutput } from "@/ai/flows/predict-health-risks";
import { BrainCircuit, Loader, AlertTriangle, ShieldCheck, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useFirestore } from "@/firebase";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import type { EmergencyReport, HospitalFeedback, MessFoodRating } from "@/lib/types";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export default function PredictiveHealth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<PredictHealthRisksOutput | null>(null);
  const db = useFirestore();

  const [inputData, setInputData] = useState<PredictHealthRisksInput | null>(null);
  const [dataLoading, setDataLoading] = useState(false);

  // Helper to convert Firestore data for server action
  const serializeFirestoreData = (docs: any[], idField: string) => {
    return docs.map(docData => {
      const data = { ...docData, [idField]: docData.id };
      if (data.timestamp && data.timestamp instanceof Timestamp) {
        data.timestamp = data.timestamp.toDate().toISOString();
      }
      // Convert any other Timestamps if necessary
      for (const key in data) {
        if (data[key] instanceof Timestamp) {
          data[key] = data[key].toDate().toISOString();
        }
      }
      return data;
    });
  }

  const fetchAllData = async () => {
    if (!db) return;
    setDataLoading(true);
    setError(null);
    setInputData(null);
    try {
        const emergencyReportsCol = collection(db, "emergencyReports");
        const hospitalFeedbacksCol = collection(db, "hospitalFeedbacks");
        const messFoodRatingsCol = collection(db, "messFoodRatings");

        const [emergencySnap, feedbackSnap, ratingsSnap] = await Promise.all([
            getDocs(emergencyReportsCol).catch(err => {
                const permissionError = new FirestorePermissionError({ path: emergencyReportsCol.path, operation: 'list' }, err);
                errorEmitter.emit('permission-error', permissionError);
                throw permissionError;
            }),
            getDocs(hospitalFeedbacksCol).catch(err => {
                const permissionError = new FirestorePermissionError({ path: hospitalFeedbacksCol.path, operation: 'list' }, err);
                errorEmitter.emit('permission-error', permissionError);
                throw permissionError;
            }),
            getDocs(messFoodRatingsCol).catch(err => {
                const permissionError = new FirestorePermissionError({ path: messFoodRatingsCol.path, operation: 'list' }, err);
                errorEmitter.emit('permission-error', permissionError);
                throw permissionError;
            })
        ]);
        
        const emergencyReports = serializeFirestoreData(emergencySnap.docs.map(doc => ({...doc.data(), id: doc.id})), 'reportId');
        const hospitalFeedbacks = serializeFirestoreData(feedbackSnap.docs.map(doc => ({...doc.data(), id: doc.id})), 'feedbackId');
        const messFoodRatings = serializeFirestoreData(ratingsSnap.docs.map(doc => ({...doc.data(), id: doc.id})), 'ratingId');
        
        setInputData({ emergencyReports, hospitalFeedbacks, messFoodRatings });
    } catch (e: any) {
        setError(e.message || "Failed to fetch required data for analysis.");
    } finally {
        setDataLoading(false);
    }
  }


  const handleAnalysis = async () => {
    if (!inputData) {
        setError("Please load the campus data before running the analysis.");
        return;
    }
    setLoading(true);
    setError(null);
    setPredictions(null);
    try {
        const result = await predictHealthRisks(inputData);
        setPredictions(result);
    } catch (error: any) {
        console.error(error);
        setError(error.message || 'Failed to get predictions. Please check the server logs.');
    }
    setLoading(false);
  };

  const getRiskBadge = (level: string) => {
    switch (level.toLowerCase()) {
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "low":
        return "default";
      default:
        return "outline";
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BrainCircuit className="text-primary" />
          Predictive Health Risk Analysis
        </CardTitle>
        <CardDescription>
          Use AI to analyze real-time emergency, hospital, and mess data to identify potential health risks on campus.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center gap-4">
          <Button onClick={fetchAllData} disabled={dataLoading} size="lg">
            {dataLoading ? (
                 <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Loading Campus Data...
                </>
            ) : (
                <>
                    <Database className="mr-2 h-4 w-4"/>
                    {inputData ? 'Reload Campus Data' : 'Load Campus Data'}
                </>
            )}
          </Button>

          {inputData && (
             <Button onClick={handleAnalysis} disabled={loading}>
                {loading ? (
                <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Data...
                </>
                ) : (
                "Run AI Health Analysis"
                )}
            </Button>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>An Error Occurred</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {predictions && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Analysis Complete: {predictions.healthRisks.length} potential risks identified.</h3>
            <Accordion type="single" collapsible className="w-full">
              {predictions.healthRisks.map((risk, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-4">
                       <Badge variant={getRiskBadge(risk.riskLevel)}>{risk.riskLevel} Risk</Badge>
                       <span>{risk.riskType} in {risk.affectedArea}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 p-2">
                    <p><strong>Description:</strong> {risk.description}</p>
                    <div className="bg-secondary/50 p-4 rounded-md">
                        <h4 className="font-semibold flex items-center gap-2 mb-2">
                           <ShieldCheck className="h-4 w-4 text-green-600"/>
                           Recommendations
                        </h4>
                        <p className="text-muted-foreground">{risk.recommendations}</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
