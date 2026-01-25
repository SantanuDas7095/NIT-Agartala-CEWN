# NIT Agartala CEWN (Campus Emergency & Wellness Network)

**NIT Agartala CEWN** is a unified digital platform designed to create a real-time, transparent, and data-driven ecosystem for managing student safety, health, and wellness. It addresses critical delays and communication gaps in campus services by integrating emergency response, medical service transparency, and food safety monitoring into a single, accessible application for students and administrators.

---

## 🚀 The Problem Addressed

Large university campuses often struggle with fragmented systems for student welfare:
- **Slow Emergency Response:** Emergency reporting is often manual (phone calls, word-of-mouth), leading to critical delays in getting help to the right location.
- **Lack of Transparency:** Students have no visibility into medical center wait times or doctor availability, leading to frustration and inefficient use of health services.
- **Reactive Health Management:** Issues like foodborne illnesses from campus messes are often discovered only after many students are already affected.
- **No Centralized Data:** Administrators lack the aggregated, real-time data needed to identify trends, predict risks, and make informed decisions to improve campus life.

## ✨ The Solution: A Unified & Proactive Platform

The CEWN platform solves these issues by providing a suite of interconnected tools:

### Key Features

*   🚨 **Emergency SOS System**
    - One-tap alerts for Medical, Safety, Fire, or Hostel issues.
    - Instantly notifies campus security and administrators with the user's name, location (including GPS coordinates), and emergency type.
    - Ensures a rapid, coordinated, and accurate response.

*   🏥 **Hospital Transparency Platform**
    - Real-time dashboard showing average wait times and doctor availability at the campus hospital.
    - A simple appointment booking system for non-emergency visits.
    - A post-visit feedback system for patients to rate their experience, creating accountability and driving service improvements.

*   🍲 **Mess Food Safety Monitor**
    - Students can rate daily meals from various campus messes and upload photos.
    - An immediate "Report Sickness" feature that flags potential food safety issues and automatically creates a medical alert for the administration.
    - AI-powered trend analysis helps identify hygiene problems before they become widespread.

*   🤖 **AI Health Assistant**
    - **First-Aid Chatbot:** An AI-powered assistant providing immediate advice for minor health emergencies, with built-in disclaimers to consult professionals.
    - **Nutrition Tracker:** Students can upload a photo of their meal, and the AI provides an estimated breakdown of calories, protein, carbs, and fat, which can be saved to a personal nutrition diary.

*   📈 **Comprehensive Admin Dashboard**
    - A centralized command center for administrators.
    - **Live Alerts:** A real-time stream of all incoming emergency reports.
    - **Data Visualization:** Interactive charts showing hospital response times and mess hygiene trends.
    - **Predictive Health Analysis:** Uses Genkit and Google's Gemini AI model to analyze campus-wide data and predict potential health risks, enabling proactive intervention.

---

## 🛠️ Core Technologies

This application is built with a modern, robust, and scalable tech stack:

-   **Frontend:** [Next.js](https://nextjs.org/) (App Router) & [React](https://react.dev/)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [ShadCN/UI](https://ui.shadcn.com/) for beautiful, accessible components.
-   **Backend & Database:** [Firebase](https://firebase.google.com/) (Authentication, Firestore).
-   **Generative AI:** [Genkit](https://firebase.google.com/docs/genkit) with [Google's Gemini models](https://deepmind.google/technologies/gemini/) for all AI-powered features.
-   **Image Uploads:** [Cloudinary](https://cloudinary.com/) for robust image hosting.
-   **Deployment:** Configured for seamless deployment on [Vercel](https://vercel.com/).

---

## 🚀 Google Technologies Used

This project leverages a powerful suite of Google technologies to deliver a seamless, scalable, and intelligent experience:

*   **Firebase:** A comprehensive application development platform.
    *   **Firebase Authentication:** Provides secure and easy-to-use user login and identity management.
    *   **Firestore:** A flexible, scalable NoSQL database for storing all application data in real-time.
    *   **Firebase App Hosting:** A fully-managed, secure hosting service for web applications.

*   **Google AI & Gemini:** Powers the application's intelligent features.
    *   **Gemini Models:** State-of-the-art, multimodal AI models used for complex reasoning tasks, including:
        *   **Predictive Health Analysis:** Analyzing campus-wide health data to identify emerging risks.
        *   **Nutrition Tracking:** Understanding the content of a meal from a single image.
        *   **First-Aid Chatbot:** Providing conversational, helpful advice for health queries.
    *   **Genkit:** The open-source framework used to build, manage, and monitor the production-grade AI flows that connect the application to the Gemini models.

*   **Firebase Studio:** The AI-assisted development environment used to bootstrap, build, and iterate on this application.

*   **Google Fonts:** Delivers fast and efficient web fonts to ensure a consistent and high-quality user interface.

---

## ⚙️ Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

-   Node.js (v18 or newer)
-   npm, yarn, or pnpm

### Firebase & Cloudinary Setup

1.  **Firebase:**
    - Create a new project on the [Firebase Console](https://console.firebase.google.com/).
    - In your project, go to **Project settings** > **General**, and under "Your apps," create a new Web App.
    - Copy the `firebaseConfig` object.
    - Create a `.env.local` file in the root of your project and populate it with the config values, prefixing each key with `NEXT_PUBLIC_FIREBASE_`.

    ```env
    # .env.local
    NEXT_PUBLIC_FIREBASE_API_KEY="AIza..."
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="..."
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
    NEXT_PUBLIC_FIREBASE_APP_ID="..."
    ```

2.  **Cloudinary:**
    - Sign up for a free [Cloudinary](https://cloudinary.com/) account.
    - Find your `cloud_name`, `api_key`, and `api_secret` in your dashboard.
    - Add these to your `.env.local` file.

    ```env
    # .env.local
    CLOUDINARY_CLOUD_NAME="..."
    CLOUDINARY_API_KEY="..."
    CLOUDINARY_API_SECRET="..."
    ```

### Installation & Running Locally

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd <your-repo-name>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
