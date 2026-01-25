
import { Timestamp } from "firebase/firestore";

export type EmergencyReport = {
    id?: string;
    studentId: string;
    studentName: string;
    enrollmentNumber: string;
    year: number;
    location: string;
    emergencyType: string;
    timestamp: Timestamp;
    latitude?: number;
    longitude?: number;
};

export type HospitalFeedback = {
    id?: string;
    studentId: string;
    waitingTime: number;
    doctorAvailability: 'available' | 'unavailable';
    postVisitFeedback: string;
    emergencyVsNormal: 'emergency' | 'normal';
    timestamp: Timestamp;
};

export type MessFoodRating = {
    id?: string;
    studentId: string;
    messName: string;
    mealType: string;
    foodQualityRating: number;
    sickAfterMealReport: 'yes' | 'no';
    timestamp: Timestamp;
    imageUrl?: string;
};

export type Appointment = {
    id?: string;
    studentId: string;
    studentName: string;
    enrollmentNumber: string;
    appointmentDate: Timestamp;
    appointmentTime: string;
    reason: string;
    status: 'scheduled' | 'completed' | 'cancelled';
    bookedBy?: 'student' | 'admin';
    // Feedback fields
    waitingTime?: number;
    doctorAvailability?: 'available' | 'unavailable';
    postVisitFeedback?: string;
};

export type UserProfile = {
    id: string;
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    enrollmentNumber?: string;
    hostel?: string;
    department?: string;
    year?: number;
    phoneNumber?: string;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

export type DailyNutritionLog = {
    id: string;
    userId: string;
    timestamp: Timestamp;
    calories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
    photoUrl?: string;
}

export type DoctorStatus = {
    name: string;
    specialty: string;
    isAvailable: boolean;
    emergencyStatus?: string;
};
