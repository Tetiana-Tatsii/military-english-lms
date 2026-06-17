"use client";

import React from "react";
import { useAppContext } from "../../context/AppContext";

interface ProfileStatsProps {
  isDarkMode: boolean;
}

export default function ProfileStats({ isDarkMode }: ProfileStatsProps) {
  const { user, answers, courses } = useAppContext();

  // Обчислюємо бали для кожного навику на основі оцінок за пройдені уроки
  const calculateSkillScores = () => {
    const myAnswers = answers.filter((a) => a.studentName === user?.name && a.status === "reviewed");
    
    const skillScores = {
      listening: 0,
      speaking: 0,
      reading: 0,
      writing: 0,
    };
    
    const skillCounts = {
      listening: 0,
      speaking: 0,
      reading: 0,
      writing: 0,
    };

    myAnswers.forEach((answer) => {
      const course = courses.find((c) => c.id === answer.courseId);
      if (!course) return;

      for (const mod of course.modules) {
        const lesson = mod.lessons.find((l) => l.id === answer.lessonId);
        if (lesson && lesson.skill && lesson.skill !== "mixed") {
          const score = answer.score || 0;
          skillScores[lesson.skill] += score;
          skillCounts[lesson.skill]++;
        }
      }
    });

    // Обчислюємо середні бали для кожного навику
    const skills = [
      {
        label: "Listening",
        val: skillCounts.listening > 0 ? Math.round(skillScores.listening / skillCounts.listening) : 0,
      },
      {
        label: "Speaking",
        val: skillCounts.speaking > 0 ? Math.round(skillScores.speaking / skillCounts.speaking) : 0,
      },
      {
        label: "Reading",
        val: skillCounts.reading > 0 ? Math.round(skillScores.reading / skillCounts.reading) : 0,
      },
      {
        label: "Writing",
        val: skillCounts.writing > 0 ? Math.round(skillScores.writing / skillCounts.writing) : 0,
      },
    ];

    return skills;
  };

  const skills = calculateSkillScores();

  return (
    <div
      className={`rounded-xl border p-6 ${
        isDarkMode
          ? "bg-[#3a3326] border-[#4a4231]"
          : "bg-[#f6f1e4] border-[#d8cdb4]"
      }`}
    >
      <h3
        className={`mb-5 flex items-center gap-2 text-sm font-semibold ${
          isDarkMode ? "text-white" : "text-[#3a3528]"
        }`}
      >
        📈 Профіль SLP (STANAG 6001)
      </h3>
      <div className="flex flex-col gap-4">
        {skills.map((skill) => (
          <div key={skill.label}>
            <div
              className={`mb-1.5 flex justify-between text-xs font-semibold ${
                isDarkMode ? "text-[#d8cdb4]" : "text-[#5a5440]"
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
