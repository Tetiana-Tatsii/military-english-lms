"use client";

import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { supabase } from "../../lib/supabase";

interface ProfileStatsProps {
  isDarkMode: boolean;
}

export default function ProfileStats({ isDarkMode }: ProfileStatsProps) {
  const { user, answers, courses } = useAppContext();
  const [slpMetrics, setSlpMetrics] = useState({
    listening: 0,
    speaking: 0,
    reading: 0,
    writing: 0,
  });

  // Load SLP metrics from Supabase (always fetch fresh data on mount)
  useEffect(() => {
    if (user?.id) {
      const loadSlpMetrics = async () => {
        const { data, error } = await supabase
          .from("profiles")
          .select("slp_listening, slp_speaking, slp_reading, slp_writing")
          .eq("id", user.id)
          .single();

        if (!error && data) {
          setSlpMetrics({
            listening: data.slp_listening ?? 0,
            speaking: data.slp_speaking ?? 0,
            reading: data.slp_reading ?? 0,
            writing: data.slp_writing ?? 0,
          });
        } else if (error) {
          // Silently ignore if columns don't exist yet (migration pending)
          if (!error.message?.includes("does not exist")) {
            console.error("Error loading SLP metrics:", error);
          }
        }
      };
      loadSlpMetrics();
    }
  }, [user?.id]);

  const skills = [
    {
      label: "Listening",
      val: slpMetrics.listening,
    },
    {
      label: "Speaking",
      val: slpMetrics.speaking,
    },
    {
      label: "Reading",
      val: slpMetrics.reading,
    },
    {
      label: "Writing",
      val: slpMetrics.writing,
    },
  ];

  return (
    <div
      className={`rounded-2xl border p-6 ${
        isDarkMode
          ? "bg-[#2d2f2a] border-[#3e403a]"
          : "bg-[#f6f1e4] border-[#d8cdb4]"
      }`}
    >
      <h3
        className={`mb-5 flex items-center gap-2 text-sm font-semibold ${
          isDarkMode ? "text-[#e6e4dc]" : "text-[#3a3528]"
        }`}
      >
        📈 Профіль SLP (STANAG 6001)
      </h3>
      <div className="flex flex-col gap-4">
        {skills.map((skill) => (
          <div key={skill.label}>
            <div
              className={`mb-1.5 flex justify-between text-xs font-semibold ${
                isDarkMode ? "text-[#a3a198]" : "text-[#5a5440]"
              }`}
            >
              <span>{skill.label}</span>
              <span>{skill.val}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#e9e1cd]">
              <div
                className="h-full rounded-full bg-[#8a8a45]"
                style={{ width: `${skill.val}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
      <p
        className={`mt-5 text-center text-xs leading-relaxed ${
          isDarkMode ? "text-[#9a8f70]" : "text-[#9a8f70]"
        }`}
      >
        *Дані профілю генеруються на основі результатів виконаних модулів
        та фінальних тестів.
      </p>
    </div>
  );
}
