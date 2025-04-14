
import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Database, Play, AlertCircle, Info, X } from "lucide-react";

const SqlConsole = () => {
  const { executeSqlQuery } = useData();
  const [query, setQuery] = useState("");
  const [queryResult, setQueryResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const handleExecuteQuery = () => {
    if (!query.trim()) {
      setError("Please enter a SQL query");
      return;
    }

    setIsExecuting(true);
    setError(null);

    // Simulate a delay for the execution
    setTimeout(() => {
      try {
        const result = executeSqlQuery(query);
        
        if (result.success) {
          setQueryResult(result.data);
        } else {
          setError(result.error || "Unknown error executing query");
          setQueryResult(null);
        }
      } catch (err) {
        setError("Error executing query");
        setQueryResult(null);
      } finally {
        setIsExecuting(false);
      }
    }, 500);
  };

  const handleClearConsole = () => {
    setQuery("");
    setQueryResult(null);
    setError(null);
  };

  const renderResultTable = () => {
    if (!queryResult || !Array.isArray(queryResult) || queryResult.length === 0) {
      return <p className="text-muted-foreground">No results</p>;
    }

    const headers = Object.keys(queryResult[0]);

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header) => (
                <TableHead key={header}>{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {queryResult.map((row, index) => (
              <TableRow key={index}>
                {headers.map((header) => (
                  <TableCell key={`${index}-${header}`}>
                    {row[header] !== null && row[header] !== undefined
                      ? JSON.stringify(row[header])
                      : "null"}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const sampleQueries = [
    "SELECT * FROM doctors",
    "SELECT * FROM patients",
    "SELECT * FROM rooms",
    "SELECT * FROM appointments",
    "SELECT * FROM bills",
    "SELECT COUNT(*) FROM rooms",
    "SELECT * FROM rooms WHERE status = 'available'",
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="h-6 w-6 text-mediease-600" />
          <h1 className="text-2xl font-bold">SQL Console</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>SQL Query</span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearConsole}
                    disabled={isExecuting}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                  <Button
                    onClick={handleExecuteQuery}
                    disabled={isExecuting || !query.trim()}
                    size="sm"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    {isExecuting ? "Executing..." : "Execute"}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter your SQL query here..."
                className="font-mono min-h-[200px]"
              />
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
            </CardHeader>
            <CardContent>
              {isExecuting ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mediease-600"></div>
                </div>
              ) : (
                renderResultTable()
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Sample Queries</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {sampleQueries.map((sampleQuery, index) => (
                  <li key={index}>
                    <Button
                      variant="outline"
                      className="w-full justify-start overflow-hidden text-ellipsis font-mono text-xs"
                      onClick={() => setQuery(sampleQuery)}
                    >
                      {sampleQuery}
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Alert className="mt-6">
            <Info className="h-4 w-4" />
            <AlertTitle>Query Info</AlertTitle>
            <AlertDescription>
              <p className="text-sm">
                This is a demo SQL console that supports basic SELECT and COUNT queries on the hospital database.
              </p>
              <p className="text-sm mt-2">
                Sample tables: doctors, patients, rooms, appointments, bills
              </p>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
};

export default SqlConsole;
