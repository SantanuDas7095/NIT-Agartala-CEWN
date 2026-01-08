
'use server';

/**
 * @fileOverview This file contains the Genkit flow for predicting health risks on campus by analyzing student health data.
 *
 * - predictHealthRisks - A function that initiates the health risk prediction process.
 * - PredictHealthRisksInput - The input type for the predictHealthRisks function.
 * - PredictHealthRisksOutput - The return type for the predictHealthRisks function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const EmergencyReportSchema = z.object({
  reportId: z.string().describe('Unique identifier for the emergency report.'),
  studentName: z.string().describe('Name of the student involved.'),
  enrollmentNumber: z.string().describe("The student's enrollment number."),
  year: z.number().optional().describe("The student's current year of study."),
  location: z.string().describe('Location of the emergency.'),
  emergencyType: z.string().describe('Type of emergency (medical, safety, fire, etc.).'),
  timestamp: z.string().describe('ISO 8601 string timestamp of the emergency report.'),
});

const HospitalFeedbackSchema = z.object({
  feedbackId: z.string().describe('Unique identifier for the hospital feedback.'),
  waitingTime: z.number().describe('Waiting time at the hospital (in minutes).'),
  doctorAvailability: z.string().describe('Doctor availability status.'),
  postVisitFeedback: z.string().describe('Feedback provided after the visit.'),
  emergencyVsNormal: z.string().describe('The case type tagged as emergency or normal case'),
  timestamp: z.string().describe('ISO 8601 string timestamp of the feedback.'),
});

const MessFoodRatingSchema = z.object({
  ratingId: z.string().describe('Unique identifier for the food rating.'),
  foodQualityRating: z.number().describe('Rating of the food quality (1-5).'),
  sickAfterMealReport: z.string().describe('Report of feeling sick after the meal.'),
  timestamp: z.string().describe('ISO 8601 string timestamp of the food rating.'),
});

const PredictHealthRisksInputSchema = z.object({
  emergencyReports: z.array(EmergencyReportSchema).describe('Array of emergency reports.'),
  hospitalFeedbacks: z.array(HospitalFeedbackSchema).describe('Array of hospital feedback records.'),
  messFoodRatings: z.array(MessFoodRatingSchema).describe('Array of mess food ratings.'),
});
export type PredictHealthRisksInput = z.infer<typeof PredictHealthRisksInputSchema>;

const PredictedHealthRiskSchema = z.object({
  riskType: z.string().describe('Type of health risk identified.'),
  riskLevel: z.string().describe('The level of risk of this riskType'),
  description: z.string().describe('Description of the potential health risk.'),
  affectedArea: z.string().describe('The area on campus affected by this risk'),
  recommendations: z.string().describe('Recommendations to mitigate the health risk.'),
});

const PredictHealthRisksOutputSchema = z.object({
  healthRisks: z.array(PredictedHealthRiskSchema).describe('Array of predicted health risks and trends.'),
});
export type PredictHealthRisksOutput = z.infer<typeof PredictHealthRisksOutputSchema>;

export async function predictHealthRisks(input: PredictHealthRisksInput): Promise<PredictHealthRisksOutput> {
  return predictHealthRisksFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictHealthRisksPrompt',
  input: {schema: PredictHealthRisksInputSchema},
  output: {schema: PredictHealthRisksOutputSchema},
  prompt: `You are an expert in campus health and safety, specializing in identifying potential health risks and trends.

  Analyze the following data to identify potential health risks and trends on the NIT Agartala campus. Provide actionable recommendations to mitigate these risks.

  Emergency Reports:
  {{#each emergencyReports}}
  - Report ID: {{reportId}}, Student: {{studentName}} ({{enrollmentNumber}}, Year {{year}}), Location: {{location}}, Emergency Type: {{emergencyType}}, Timestamp: {{timestamp}}
  {{/each}}

  Hospital Feedback:
  {{#each hospitalFeedbacks}}
  - Feedback ID: {{feedbackId}}, Waiting Time: {{waitingTime}}, Doctor Availability: {{doctorAvailability}}, Post-Visit Feedback: {{postVisitFeedback}}, Emergency vs Normal: {{emergencyVsNormal}}, Timestamp: {{timestamp}}
  {{/each}}

  Mess Food Ratings:
  {{#each messFoodRatings}}
  - Rating ID: {{ratingId}}, Food Quality Rating: {{foodQualityRating}}, Sick After Meal Report: {{sickAfterMealReport}}, Timestamp: {{timestamp}}
  {{/each}}

  Based on this data, identify potential health risks, their risk levels (high, medium, low), affected areas, and provide recommendations.
  Format your response as a JSON array of PredictedHealthRisk objects:
  `,
});

const predictHealthRisksFlow = ai.defineFlow(
  {
    name: 'predictHealthRisksFlow',
    inputSchema: PredictHealthRisksInputSchema,
    outputSchema: PredictHealthRisksOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
