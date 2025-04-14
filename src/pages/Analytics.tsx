import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LineChart, BarChart, Activity, Database, FilterIcon, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsiveLine } from "@nivo/line";
import { format } from "date-fns";
import { QueryCard } from "@/components/analytics/QueryCard";

type AnalyticsLog = {
  id: string;
  action_type: string;
  table_name: string;
  record_id: string | null;
  query: string;
  performed_by: string;
  performed_at: string;
};

type ActionCount = {
  action_type: string;
  count: number;
};

type TableActionCount = {
  table_name: string;
  count: number;
};

const Analytics = () => {
  const [logs, setLogs] = useState<AnalyticsLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionCounts, setActionCounts] = useState<ActionCount[]>([]);
  const [tableActionCounts, setTableActionCounts] = useState<TableActionCount[]>([]);
  const [filterTable, setFilterTable] = useState<string>("all");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<string>("all");
  const [lastQuery, setLastQuery] = useState<string>("");
  const { toast } = useToast();

  // Fetch analytics logs
  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("analytics_logs")
        .select("*")
        .order("performed_at", { ascending: false });

      let queryString = "SELECT * FROM analytics_logs ORDER BY performed_at DESC";
      
      // Apply filters
      if (filterTable !== "all") {
        query = query.eq("table_name", filterTable);
        queryString += ` WHERE table_name = '${filterTable}'`;
      }
      
      if (filterAction !== "all") {
        if (filterTable === "all") {
          query = query.eq("action_type", filterAction);
          queryString += ` WHERE action_type = '${filterAction}'`;
        } else {
          query = query.eq("action_type", filterAction);
          queryString += ` AND action_type = '${filterAction}'`;
        }
      }
      
      // Apply time filter
      const now = new Date();
      let startDate = new Date();
      
      if (timeFilter === "today") {
        startDate.setHours(0, 0, 0, 0);
        queryString += filterTable === "all" && filterAction === "all" 
          ? " WHERE " : " AND ";
        queryString += `performed_at >= '${startDate.toISOString()}'`;
        query = query.gte("performed_at", startDate.toISOString());
      } else if (timeFilter === "week") {
        startDate.setDate(now.getDate() - 7);
        queryString += filterTable === "all" && filterAction === "all" 
          ? " WHERE " : " AND ";
        queryString += `performed_at >= '${startDate.toISOString()}'`;
        query = query.gte("performed_at", startDate.toISOString());
      } else if (timeFilter === "month") {
        startDate.setMonth(now.getMonth() - 1);
        queryString += filterTable === "all" && filterAction === "all" 
          ? " WHERE " : " AND ";
        queryString += `performed_at >= '${startDate.toISOString()}'`;
        query = query.gte("performed_at", startDate.toISOString());
      }

      setLastQuery(queryString);
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      setLogs(data || []);
      
      // Log the analytics view itself
      await supabase.from("analytics_logs").insert({
        action_type: "VIEW",
        table_name: "analytics_logs",
        query: queryString,
        performed_by: "current_user",
      });
      
      // Get counts by action type using client-side grouping instead of server-side
      const actionTypeCounts: Record<string, number> = {};
      logs.forEach(log => {
        actionTypeCounts[log.action_type] = (actionTypeCounts[log.action_type] || 0) + 1;
      });
      
      const actionData: ActionCount[] = Object.entries(actionTypeCounts).map(([action_type, count]) => ({
        action_type,
        count
      }));
      
      setActionCounts(actionData);
      
      // Get counts by table using client-side grouping
      const tableTypeCounts: Record<string, number> = {};
      logs.forEach(log => {
        tableTypeCounts[log.table_name] = (tableTypeCounts[log.table_name] || 0) + 1;
      });
      
      const tableData: TableActionCount[] = Object.entries(tableTypeCounts).map(([table_name, count]) => ({
        table_name,
        count
      }));
      
      setTableActionCounts(tableData);
      
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast({
        title: "Error",
        description: "Failed to fetch analytics data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Initialize real-time subscription
  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('analytics-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'analytics_logs' }, 
        () => {
          fetchLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  useEffect(() => {
    fetchLogs();
    const unsubscribe = setupRealtimeSubscription();
    
    return () => {
      unsubscribe();
    };
  }, [filterTable, filterAction, timeFilter]);

  // Prepare data for the action type chart
  const actionBarData = actionCounts.map(item => ({
    actionType: item.action_type,
    count: item.count,
  }));

  // Prepare data for the table action chart
  const tableBarData = tableActionCounts.map(item => ({
    tableName: item.table_name,
    count: item.count,
  }));

  // Prepare data for timeline chart
  const getTimelineData = () => {
    const timeMap = new Map();
    
    logs.forEach(log => {
      const date = new Date(log.performed_at);
      const dateStr = format(date, "MMM dd, yyyy");
      
      if (!timeMap.has(dateStr)) {
        timeMap.set(dateStr, { date: dateStr, count: 0 });
      }
      
      const entry = timeMap.get(dateStr);
      entry.count += 1;
    });
    
    return Array.from(timeMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const timelineData = [
    {
      id: "activities",
      data: getTimelineData().map(item => ({
        x: item.date,
        y: item.count,
      })),
    },
  ];

  const getTables = () => {
    const tables = new Set<string>();
    logs.forEach(log => tables.add(log.table_name));
    return Array.from(tables);
  };

  const getActions = () => {
    const actions = new Set<string>();
    logs.forEach(log => actions.add(log.action_type));
    return Array.from(actions);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="h-6 w-6 text-mediease-600" />
          <h1 className="text-2xl font-bold">Analytics</h1>
        </div>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Filters</CardTitle>
            <CardDescription>
              Filter analytics data by table, action, and time period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <FilterIcon className="h-4 w-4 text-muted-foreground" />
                <Select value={filterTable} onValueChange={setFilterTable}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by table" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tables</SelectItem>
                    {getTables().map(table => (
                      <SelectItem key={table} value={table}>
                        {table}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <Select value={filterAction} onValueChange={setFilterAction}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {getActions().map(action => (
                      <SelectItem key={action} value={action}>
                        {action}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  variant={timeFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeFilter("all")}
                >
                  All Time
                </Button>
                <Button
                  variant={timeFilter === "today" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeFilter("today")}
                >
                  Today
                </Button>
                <Button
                  variant={timeFilter === "week" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeFilter("week")}
                >
                  Past Week
                </Button>
                <Button
                  variant={timeFilter === "month" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeFilter("month")}
                >
                  Past Month
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="charts">Charts</TabsTrigger>
            <TabsTrigger value="logs">Detailed Logs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Operations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{logs.length}</div>
                  <p className="text-xs text-muted-foreground">
                    All database operations logged
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    SELECT Operations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {logs.filter(log => log.action_type === "SELECT").length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Data retrieval operations
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    INSERT Operations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {logs.filter(log => log.action_type === "INSERT").length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Data creation operations
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    UPDATE/DELETE
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {logs.filter(log => 
                      log.action_type === "UPDATE" || 
                      log.action_type === "DELETE").length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Data modification operations
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
                <CardDescription>
                  Database operations over time
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {timelineData[0].data.length > 0 ? (
                  <ResponsiveLine
                    data={timelineData}
                    margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
                    xScale={{ type: "point" }}
                    yScale={{
                      type: "linear",
                      min: 0,
                      max: "auto",
                    }}
                    axisTop={null}
                    axisRight={null}
                    axisBottom={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: -45,
                      legend: "Date",
                      legendOffset: 40,
                      legendPosition: "middle",
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: "Operations",
                      legendOffset: -50,
                      legendPosition: "middle",
                    }}
                    colors={{ scheme: "category10" }}
                    pointSize={10}
                    pointColor={{ theme: "background" }}
                    pointBorderWidth={2}
                    pointBorderColor={{ from: "serieColor" }}
                    useMesh={true}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No timeline data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <QueryCard query={lastQuery} />
          </TabsContent>
          
          <TabsContent value="charts" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Operations by Action Type</CardTitle>
                  <CardDescription>
                    Distribution of operations by action type
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {actionBarData.length > 0 ? (
                    <ResponsiveBar
                      data={actionBarData}
                      keys={["count"]}
                      indexBy="actionType"
                      margin={{ top: 50, right: 50, bottom: 50, left: 60 }}
                      padding={0.3}
                      valueScale={{ type: "linear" }}
                      indexScale={{ type: "band", round: true }}
                      colors={{ scheme: "paired" }}
                      borderColor={{ from: "color", modifiers: [["darker", 1.6]] }}
                      axisTop={null}
                      axisRight={null}
                      axisBottom={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 0,
                        legend: "Action Type",
                        legendPosition: "middle",
                        legendOffset: 32,
                      }}
                      axisLeft={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 0,
                        legend: "Count",
                        legendPosition: "middle",
                        legendOffset: -40,
                      }}
                      labelSkipWidth={12}
                      labelSkipHeight={12}
                      labelTextColor={{ from: "color", modifiers: [["darker", 1.6]] }}
                      role="application"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-muted-foreground">No action data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Operations by Table</CardTitle>
                  <CardDescription>
                    Distribution of operations by database table
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {tableBarData.length > 0 ? (
                    <ResponsiveBar
                      data={tableBarData}
                      keys={["count"]}
                      indexBy="tableName"
                      margin={{ top: 50, right: 50, bottom: 70, left: 60 }}
                      padding={0.3}
                      valueScale={{ type: "linear" }}
                      indexScale={{ type: "band", round: true }}
                      colors={{ scheme: "nivo" }}
                      borderColor={{ from: "color", modifiers: [["darker", 1.6]] }}
                      axisTop={null}
                      axisRight={null}
                      axisBottom={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: -45,
                        legend: "Table",
                        legendPosition: "middle",
                        legendOffset: 50,
                      }}
                      axisLeft={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 0,
                        legend: "Count",
                        legendPosition: "middle",
                        legendOffset: -40,
                      }}
                      labelSkipWidth={12}
                      labelSkipHeight={12}
                      labelTextColor={{ from: "color", modifiers: [["darker", 1.6]] }}
                      role="application"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-muted-foreground">No table data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Operations Log</CardTitle>
                <CardDescription>
                  Complete log of all database operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-mediease-500" />
                  </div>
                ) : logs.length === 0 ? (
                  <Alert>
                    <AlertTitle>No logs found</AlertTitle>
                    <AlertDescription>
                      There are no analytics logs matching your current filters.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Timestamp</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Table</TableHead>
                          <TableHead>Performed By</TableHead>
                          <TableHead className="max-w-md">Query</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-medium">
                              {new Date(log.performed_at).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  log.action_type === "SELECT"
                                    ? "outline"
                                    : log.action_type === "INSERT"
                                    ? "default"
                                    : log.action_type === "UPDATE"
                                    ? "secondary"
                                    : "destructive"
                                }
                              >
                                {log.action_type}
                              </Badge>
                            </TableCell>
                            <TableCell>{log.table_name}</TableCell>
                            <TableCell>{log.performed_by}</TableCell>
                            <TableCell className="max-w-md truncate">
                              <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                                {log.query}
                              </code>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Analytics;
