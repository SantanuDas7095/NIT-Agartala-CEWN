import type { EmergencyReport, HospitalFeedback, MessFoodRating } from "@/lib/types";

// Note: Timestamps in mock data are strings, but the type expects Firestore Timestamp.
// This mock data is kept for reference but is no longer actively used in the components.

export const mockEmergencyReports: Omit<EmergencyReport, 'timestamp'> & { timestamp: string }[] = [
    {
      reportId: "EMR001",
      studentId: "user1",
      studentDetails: "Rohan Sharma, 20-UCD-034",
      location: "Hostel 5, Block B",
      emergencyType: "Medical",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      reportId: "EMR002",
      studentId: "user2",
      studentDetails: "Priya Singh, 21-UCS-112",
      location: "Library",
      emergencyType: "Safety",
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      reportId: "EMR003",
      studentId: "user3",
      studentDetails: "Amit Kumar, 19-UEE-056",
      location: "Hostel 2, Block A",
      emergencyType: "Medical",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        reportId: 'EMR004',
        studentId: "user4",
        studentDetails: 'Anjali Verma, 22-UME-089',
        location: 'Sports Complex',
        emergencyType: 'Medical',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
];

export const mockHospitalFeedbacks: Omit<HospitalFeedback, 'timestamp'> & { timestamp: string, feedbackId: string }[] = [
    {
      feedbackId: "HOSF01",
      studentId: "user1",
      waitingTime: 45,
      doctorAvailability: "available",
      postVisitFeedback: "Service was slow, but the doctor was helpful.",
      emergencyVsNormal: "normal",
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    },
    {
      feedbackId: "HOSF02",
      studentId: "user2",
      waitingTime: 10,
      doctorAvailability: "available",
      postVisitFeedback: "Quick and efficient for my emergency.",
      emergencyVsNormal: "emergency",
      timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
    },
    {
      feedbackId: "HOSF03",
      studentId: "user3",
      waitingTime: 120,
      doctorAvailability: "unavailable",
      postVisitFeedback: "Had to wait for 2 hours, no doctor was present initially.",
      emergencyVsNormal: "normal",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        feedbackId: 'HOSF04',
        studentId: "user4",
        waitingTime: 60,
        doctorAvailability: 'available',
        postVisitFeedback: 'The prescribed medicine caused some side effects.',
        emergencyVsNormal: 'normal',
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
];

export const mockMessFoodRatings: Omit<MessFoodRating, 'timestamp'> & { timestamp: string, ratingId: string }[] = [
    {
      ratingId: "MESS01",
      studentId: "user1",
      foodQualityRating: 2,
      sickAfterMealReport: "yes",
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    },
    {
      ratingId: "MESS02",
      studentId: "user2",
      foodQualityRating: 4,
      sickAfterMealReport: "no",
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      ratingId: "MESS03",
      studentId: "user3",
      foodQualityRating: 1,
      sickAfterMealReport: "yes",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      ratingId: "MESS04",
      studentId: "user4",
      foodQualityRating: 2,
      sickAfterMealReport: "yes",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 3600000).toISOString(),
    },
    {
        ratingId: 'MESS05',
        studentId: "user5",
        foodQualityRating: 3,
        sickAfterMealReport: 'no',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
];
