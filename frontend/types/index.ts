// ============================================================
// Core domain types mirroring backend Pydantic schemas
// ============================================================

export type UserRole = 'SUPER_ADMIN' | 'JUDGE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface Team {
  id: string;
  team_id: string;
  team_name: string;
  leader_name: string;
  created_at: string;
  updated_at: string;
}

export interface TeamListResponse {
  teams: Team[];
  total: number;
}

export interface ScoreResponse {
  id: string;
  judge_id: string;
  judge_name: string;
  team_id: string;
  team_identifier: string;
  team_name: string;
  round: 1 | 2;
  qa_score: number;
  innovation_score: number;
  execution_score: number;
  total_score: number;
  submitted_at: string;
}

export interface RoundScoreStatus {
  round: 1 | 2;
  submitted: boolean;
  score: ScoreResponse | null;
}

export interface TeamScoreStatus {
  team_id: string;
  team_name: string;
  leader_name: string;
  round_1: RoundScoreStatus;
  round_2: RoundScoreStatus;
}

export interface ScoreSubmitPayload {
  team_id: string;
  round: 1 | 2;
  qa_score: number;
  innovation_score: number;
  execution_score: number;
}

// Admin schemas
export interface JudgeStats {
  judge: User;
  total_scores_submitted: number;
  round_1_count: number;
  round_2_count: number;
}

export interface DashboardStats {
  total_teams: number;
  total_judges: number;
  round_1_submissions: number;
  round_2_submissions: number;
  completed_teams: number;
  pending_teams: number;
}

export interface TeamLeaderboardEntry {
  rank: number;
  team_id: string;
  team_name: string;
  leader_name: string;
  round_1_avg: number | null;
  round_2_avg: number | null;
  overall_avg: number | null;
  judges_completed: number;
  total_submissions: number;
  status: 'complete' | 'partial' | 'pending';
}

export interface LeaderboardResponse {
  entries: TeamLeaderboardEntry[];
  total_teams: number;
  total_judges: number;
}

export interface JudgeRoundScore {
  round: 1 | 2;
  qa_score: number;
  innovation_score: number;
  execution_score: number;
  total_score: number;
  submitted_at: string;
}

export interface JudgeScoreDetail {
  judge_id: string;
  judge_name: string;
  judge_email: string;
  round_1: JudgeRoundScore | null;
  round_2: JudgeRoundScore | null;
  judge_total: number | null;
}

export interface TeamDetailWithScores {
  team: Team;
  judge_scores: JudgeScoreDetail[];
  round_1_avg: number | null;
  round_2_avg: number | null;
  overall_avg: number | null;
  total_submissions: number;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface TeamCreateFormData {
  team_id: string;
  team_name: string;
  leader_name: string;
}

export interface JudgeCreateFormData {
  name: string;
  email: string;
  password: string;
}

export interface ApiError {
  detail: string | Array<{ loc?: (string | number)[]; msg?: string; type?: string }> | Record<string, unknown>;
  status?: number;
}

