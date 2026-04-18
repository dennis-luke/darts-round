export interface AnswerScore {
  pass: boolean;
  answerText: string;
  score: number | null;
  custom?: boolean;
}

export interface Team {
  teamName: string;
  points: number;
  scores: AnswerScore[];
}

export interface GameState {
  initialScore: number;
  leftTeam: Team;
  rightTeam: Team;
}