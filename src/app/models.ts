export interface AnswerScore {
  pass: boolean;
  answerText: string;
  score: number | null;
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