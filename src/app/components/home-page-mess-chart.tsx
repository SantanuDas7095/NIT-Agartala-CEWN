
"use client"

import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, QueryConstraint } from "firebase/firestore";
import { useFirestore, useUser } from "@/firebase";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CardDescription } from "@/components/ui/card";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Utensils } from "lucide-react";

type ChartData = {
  day: string;
  [key: string]: number | string; 
}

const messes = ["Gargi hostel mess", "Southern mess", "Northern mess", "Veg mess", "Rnt mess", "Eastern mess"];
const meals = ["Breakfast", "Lunch", "Dinner", "Snacks"];

export default function HomePageMessChart() {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [mealTypes, setMealTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMess, setSelectedMess] = useState<string>("All Messes");
  const db = useFirestore();
  const { user, loading: userLoading } = useUser();

  const colors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

  useEffect(() => {
    if (!db || !user) {
        if (!userLoading) {
            setLoading(false);
        }
        return;
    };
    
    let ratingsQuery: any;
    const ratingsCol = collection(db, "messFoodRatings");

    if (selectedMess !== "All Messes") {
        ratingsQuery = query(ratingsCol, where("messName", "==", selectedMess));
    } else {
        ratingsQuery = query(ratingsCol);
    }

    setLoading(true);
    const unsubscribe = onSnapshot(ratingsQuery, (querySnapshot) => {
      const dailyAverages: { [day: string]: { [meal: string]: { total: number, count: number } } } = {};
      const mealTypeSet = new Set<string>();

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.mealType && data.timestamp) {
          const mealType = data.mealType;
          mealTypeSet.add(mealType);
          const day = format(data.timestamp.toDate(), 'yyyy-MM-dd');

          if (!dailyAverages[day]) {
            dailyAverages[day] = {};
          }
          if (!dailyAverages[day][mealType]) {
            dailyAverages[day][mealType] = { total: 0, count: 0 };
          }
          dailyAverages[day][mealType].total += data.foodQualityRating;
          dailyAverages[day][mealType].count += 1;
        }
      });
      
      const uniqueMeals = Array.from(mealTypeSet).sort((a,b) => meals.indexOf(a) - meals.indexOf(b));
      setMealTypes(uniqueMeals);

      const formattedData = Object.keys(dailyAverages).map(day => {
        const dayEntry: ChartData = { day };
        uniqueMeals.forEach(meal => {
          if (dailyAverages[day][meal]) {
            dayEntry[meal] = parseFloat((dailyAverages[day][meal].total / dailyAverages[day][meal].count).toFixed(1));
          }
        });
        return dayEntry;
      }).sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime());

      setChartData(formattedData);
      setLoading(false);
    }, (error) => {
        const permissionError = new FirestorePermissionError({
            path: ratingsCol.path,
            operation: 'list',
        }, error);
        errorEmitter.emit('permission-error', permissionError);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [db, selectedMess, user, userLoading]);

  return (
    <div className="space-y-4">
        <div className="flex justify-between items-center">
            <CardDescription>Daily average ratings across different meals.</CardDescription>
            <div className="w-48">
                 <Select onValueChange={setSelectedMess} defaultValue="All Messes" disabled={!user}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a mess" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All Messes">All Messes</SelectItem>
                        {messes.map(mess => (
                            <SelectItem key={mess} value={mess}>{mess}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
        <div className="h-[350px] w-full">
            {loading || userLoading ? (
                <Skeleton className="h-[350px] w-full" />
            ) : !user ? (
                 <div className="h-[350px] w-full flex flex-col items-center justify-center text-muted-foreground gap-4">
                    <Utensils className="h-12 w-12"/>
                    <p className="font-semibold">Please log in to view mess hygiene trends.</p>
                </div>
            ) : chartData.length === 0 ? (
                <div className="h-[350px] w-full flex items-center justify-center text-muted-foreground">
                    No rating data available for the selected mess.
                </div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                        dataKey="day" 
                        stroke="hsl(var(--foreground))"
                        fontSize={12} 
                        tickFormatter={(str) => format(new Date(str), 'MMM d')}
                    />
                    <YAxis stroke="hsl(var(--foreground))" fontSize={12} domain={[1, 5]} />
                    <Tooltip
                        contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        }}
                        labelFormatter={(label) => format(new Date(label), 'PPP')}
                    />
                    <Legend wrapperStyle={{fontSize: "12px"}}/>
                    {mealTypes.map((meal, i) => (
                        <Line key={meal} type="monotone" dataKey={meal} stroke={colors[i % colors.length]} strokeWidth={2} name={meal} />
                    ))}
                    </LineChart>
                </ResponsiveContainer>
            )}
        </div>
    </div>
  )
}
