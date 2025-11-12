/**
 * Agent Leaderboard Widget
 * 
 * Lists top agents by number of deals closed this month.
 * Displays rank, agent name, branch, and deals count.
 */
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Trophy, Medal, Award, User } from "lucide-react";
import { useAgentsForLeaderboard } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";

export default function AgentLeaderboardWidget() {
  const { data: agents, isLoading } = useAgentsForLeaderboard();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Agent Leaderboard</CardTitle>
          <CardDescription>Top agents by deals closed</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40" />
        </CardContent>
      </Card>
    );
  }

  const topAgents = agents || [];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-orange-500" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground">{rank}</span>;
    }
  };

  if (topAgents.length === 0) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Agent Leaderboard
          </CardTitle>
          <CardDescription>Top agents by deals closed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No agent data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Agent Leaderboard
        </CardTitle>
        <CardDescription>Top agents by deals closed this month</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topAgents.map((agent, index) => {
            const rank = index + 1;
            const dealsCount = agent.stats?.tenancies_count || 0;
            const agentName = agent.first_name && agent.last_name
              ? `${agent.first_name} ${agent.last_name}`
              : agent.email?.split("@")[0] || "Unknown Agent";

            return (
              <div
                key={agent.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-shrink-0 w-8 flex items-center justify-center">
                  {getRankIcon(rank)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{agentName}</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {agent.team || agent.branch_id || "No branch"}
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="font-bold text-lg">{dealsCount}</div>
                  <div className="text-xs text-muted-foreground">deals</div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

