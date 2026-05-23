"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Utensils } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type DietDayType = "training" | "rest";

type DietMeal = {
  id: string;
  day_type: DietDayType;
  meal_order: number;
  time: string;
  meal: string;
  food: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
};

type DietSummary = {
  id: string;
  day_type: DietDayType;
  nutrient: string;
  count: string;
  comment: string;
};

const DAY_OPTIONS: { label: string; value: DietDayType; note: string }[] = [
  { label: "Training day", value: "training", note: "Mon, Tue, Wed, Fri, Sat" },
  { label: "Rest day", value: "rest", note: "Thu, Sun" },
];

const METRICS = [
  { key: "kcal", label: "Kcal", unit: "" },
  { key: "protein", label: "Protein", unit: "g" },
  { key: "carbs", label: "Carbs", unit: "g" },
  { key: "fat", label: "Fat", unit: "g" },
  { key: "fiber", label: "Fiber", unit: "g" },
] as const;

export default function DietChartPage() {
  const supabase = useMemo(() => createClient(), []);
  const [dayType, setDayType] = useState<DietDayType>("training");
  const [meals, setMeals] = useState<DietMeal[]>([]);
  const [summary, setSummary] = useState<DietSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDietChart() {
      setLoading(true);
      setError("");

      const [{ data: mealRows, error: mealError }, { data: summaryRows, error: summaryError }] =
        await Promise.all([
          supabase
            .from("diet_chart_meals")
            .select("*")
            .eq("day_type", dayType)
            .order("meal_order"),
          supabase
            .from("diet_chart_summary")
            .select("*")
            .eq("day_type", dayType)
            .order("position"),
        ]);

      if (mealError || summaryError) {
        setError(mealError?.message || summaryError?.message || "Unable to load diet chart");
        setMeals([]);
        setSummary([]);
      } else {
        setMeals((mealRows || []) as DietMeal[]);
        setSummary((summaryRows || []) as DietSummary[]);
      }

      setLoading(false);
    }

    loadDietChart();
  }, [dayType, supabase]);

  const totals = meals.reduce(
    (total, meal) => ({
      kcal: total.kcal + Number(meal.kcal || 0),
      protein: total.protein + Number(meal.protein || 0),
      carbs: total.carbs + Number(meal.carbs || 0),
      fat: total.fat + Number(meal.fat || 0),
      fiber: total.fiber + Number(meal.fiber || 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
  );

  const activeOption = DAY_OPTIONS.find((option) => option.value === dayType);

  return (
    <div className="mobile-page diet-chart-page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Diet Chart</p>
          <h1>{activeOption?.label}</h1>
          <p>{activeOption?.note}</p>
        </div>
        <span className="heading-icon">
          <Utensils size={22} />
        </span>
      </section>

      <section className="segmented two">
        {DAY_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={dayType === option.value ? "active" : ""}
            onClick={() => setDayType(option.value)}
          >
            {option.label}
          </button>
        ))}
      </section>

      {loading ? (
        <div className="center-state">
          <Loader2 className="spin" size={24} />
          <p>Loading diet chart...</p>
        </div>
      ) : error ? (
        <section className="center-state mobile-card">
          <h2>Diet chart table is not ready</h2>
          <p>{error}</p>
        </section>
      ) : meals.length === 0 ? (
        <section className="center-state mobile-card">
          <h2>No diet rows yet</h2>
          <p>Add the diet chart seed SQL in Supabase, then refresh this page.</p>
        </section>
      ) : (
        <>
          <section className="macro-grid">
            {METRICS.map((metric) => (
              <article key={metric.key} className="macro-card">
                <span>{metric.label}</span>
                <strong>
                  {metric.key === "kcal" ? Math.round(totals[metric.key]) : totals[metric.key].toFixed(1)}
                  {metric.unit && ` ${metric.unit}`}
                </strong>
              </article>
            ))}
          </section>

          <section className="mobile-card diet-table-card">
            <div className="diet-table-scroll">
              <table className="diet-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Meal</th>
                    <th>Food / quantity</th>
                    <th>Kcal</th>
                    <th>Protein</th>
                    <th>Carbs</th>
                    <th>Fat</th>
                    <th>Fiber</th>
                  </tr>
                </thead>
                <tbody>
                  {meals.map((meal) => (
                    <tr key={meal.id}>
                      <td>{meal.time}</td>
                      <td>{meal.meal}</td>
                      <td>{meal.food}</td>
                      <td>{Math.round(Number(meal.kcal))}</td>
                      <td>{Number(meal.protein).toFixed(1)} g</td>
                      <td>{Number(meal.carbs).toFixed(1)} g</td>
                      <td>{Number(meal.fat).toFixed(1)} g</td>
                      <td>{Number(meal.fiber).toFixed(1)} g</td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td colSpan={3}>Total</td>
                    <td>{Math.round(totals.kcal)}</td>
                    <td>{totals.protein.toFixed(1)} g</td>
                    <td>{totals.carbs.toFixed(1)} g</td>
                    <td>{totals.fat.toFixed(1)} g</td>
                    <td>{totals.fiber.toFixed(1)} g</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="summary-card-grid">
            {summary.map((item) => (
              <article key={item.id} className="summary-card">
                <span>{item.nutrient}</span>
                <strong>{item.count}</strong>
                <p>{item.comment}</p>
              </article>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
