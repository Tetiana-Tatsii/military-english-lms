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
      listening: [] as number[],
      speaking: [] as number[],
      reading: [] as number[],
      writing: [] as number[],
    };

    myAnswers.forEach((answer) => {
      const course = courses.find((c) => c.id === answer.courseId);
      if (!course) return;

      for (const mod of course.modules) {
        const lesson = mod.lessons.find((l) => l.id === answer.lessonId);
        if (lesson) {
          const score = answer.score || 0;
          const skill = lesson.skill?.toLowerCase() || "";
          
          // Додаємо оцінку за ДЗ
          addScoreToSkills(skillScores, skill, score);
        }
      }
    });

    // Додаємо оцінки за практичні тести з localStorage
    courses.forEach((course) => {
      course.modules.forEach((mod) => {
        mod.lessons.forEach((lesson) => {
          const quizResultKey = `quiz_${user?.name}_${lesson.id}`;
          const savedResult = localStorage.getItem(quizResultKey);
          if (savedResult) {
            try {
              const parsed = JSON.parse(savedResult);
              if (parsed.submitted && parsed.score !== undefined) {
                const skill = lesson.skill?.toLowerCase() || "";
                // Додаємо оцінку за тест
                addScoreToSkills(skillScores, skill, parsed.score);
              }
            } catch (error) {
              console.error("Помилка при завантаженні результату тесту:", error);
            }
          }
        });
      });
    });

    // Обчислюємо середні бали для кожного навику
    const calculateAverage = (scores: number[]) => {
      if (scores.length === 0) return 0;
      return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    };

    const skills = [
      {
        label: "Listening",
        val: calculateAverage(skillScores.listening),
      },
      {
        label: "Speaking",
        val: calculateAverage(skillScores.speaking),
      },
      {
        label: "Reading",
        val: calculateAverage(skillScores.reading),
      },
      {
        label: "Writing",
        val: calculateAverage(skillScores.writing),
      },
    ];

    return skills;
  };

  // Допоміжна функція для додавання оцінки до відповідних навичок
  const addScoreToSkills = (skillScores: any, skill: string, score: number) => {
    // Якщо skill порожній або "mixed", додаємо до всіх категорій
    if (!skill || skill === "mixed") {
      skillScores.listening.push(score);
      skillScores.speaking.push(score);
      skillScores.reading.push(score);
      skillScores.writing.push(score);
    } else {
      // Перевіряємо чи містить skill назву навички
      if (skill.includes("listening")) {
        skillScores.listening.push(score);
      }
      if (skill.includes("speaking")) {
        skillScores.speaking.push(score);
      }
      if (skill.includes("reading")) {
        skillScores.reading.push(score);
      }
      if (skill.includes("writing")) {
        skillScores.writing.push(score);
      }
    }
  };

  const skills = calculateSkillScores();

  return (
    <div
      className={`rounded-xl border p-6 ${
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
