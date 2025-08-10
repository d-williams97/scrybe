import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "./ui/card";
import { Button } from "./ui/button";
import { NotesEditorProps } from "@/app/types";

export function NotesEditor({ initialValue = "" }: NotesEditorProps) {
  return (
    <Card className="w-full max-w-3xl">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Generated Notes</CardTitle>
        <CardAction>
          <Button variant="outline" size="sm">
            Download .txt
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <textarea
          className="w-full h-64 font-mono text-sm rounded-md border p-3 bg-background"
          defaultValue={initialValue}
        />
      </CardContent>
    </Card>
  );
}
