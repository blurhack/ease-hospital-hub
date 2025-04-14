
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clipboard, ClipboardCheck } from "lucide-react";
import { useState } from "react";

interface QueryCardProps {
  query: string;
}

export function QueryCard({ query }: QueryCardProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(query);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">SQL Query</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={copyToClipboard}
          disabled={!query}
        >
          {copied ? (
            <ClipboardCheck className="h-4 w-4" />
          ) : (
            <Clipboard className="h-4 w-4" />
          )}
          <span className="ml-2">{copied ? "Copied" : "Copy"}</span>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-md bg-muted p-4">
          <pre className="overflow-x-auto text-xs">
            <code>{query || "No query executed yet"}</code>
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
