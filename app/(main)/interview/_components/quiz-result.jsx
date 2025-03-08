import { CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy } from "lucide-react";
import React from "react";

const QuizResult = ({ result, hideStartNew = false, onStartNew }) => {
  if (!result) return null;

  return (
    <div>
      <h1 className=" flex items-center gap-2 text-3xl gradient-title">
        <Trophy className=" h-6 w-6 text-yellow-500" />
        Quiz Results
      </h1>

      <CardContent>
        {/* Score Overview */}
        <div className=" text-center space-y-2">
          <h3 className=" text-2xl font-bold">
            {result.quizScore.toFixed(1)}%
          </h3>
          <Progress value={result.quizScore} className=" w-full" />
        </div>

        {/* Improvemet Tip */}
        {result.improvementTip && (
          <div className=" bg-muted p-4 rounded-lg">
            <p className=" font-medium">Improvement Tip:</p>
            <p className=" text-muted-foreground">{result.improvementTip}</p>
          </div>
        )}
      </CardContent>
    </div>
  );
};

export default QuizResult;
